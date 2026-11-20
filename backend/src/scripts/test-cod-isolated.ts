import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { ProductModel } from "../modules/products/product.model.js";
import { AdminModel } from "../modules/auth/admin.model.js";
import { OrderModel } from "../modules/orders/order.model.js";
import { env } from "../config/env.js";

const BASE = "http://127.0.0.1:5101";
const EXPECTED_DB = "nuurmart_cod_test";
const id = randomUUID().slice(0, 8);
const slug = `cod-test-${id}`;
const email = `cod-test-${id}@example.invalid`;
const requestId = randomUUID();
const concurrentRequestIds = [randomUUID(), randomUUID()];
const phone = "01700000000";

let server: ChildProcess | null = null;
let productCreated = false;
let adminCreated = false;
let orderCreated = false;

function check(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) throw new Error(message);
}

async function post(
  path: string,
  body: unknown,
  cookie?: string
) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Origin: env.FRONTEND_URL,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: await response.json() as Record<string, any>,
    cookie: response.headers.get("set-cookie")?.split(";")[0] || ""
  };
}

async function stock() {
  const product = await ProductModel.findOne({ slug }).lean();
  check(product, "Test product missing");
  return product.stockQuantity;
}

async function startServer() {
  // Never reuse an unknown process on the test port.
  try {
    const response = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(1000)
    });

    if (response.ok) {
      throw new Error("Port 5101 already occupied. Stop that process.");
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already occupied")
    ) throw error;
  }

  server = spawn(
    process.execPath,
    ["dist/server.js"],
    {
      cwd: process.cwd(),
      env: { ...process.env, PORT: "5101" },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  let output = "";

  server.stderr?.on("data", data => {
    output += String(data);
  });

  server.stdout?.on("data", data => {
    output += String(data);
  });

  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) break;

    try {
      const response = await fetch(`${BASE}/api/health`, {
        signal: AbortSignal.timeout(1000)
      });

      if (response.ok) return;
    } catch {}

    await sleep(400);
  }

  throw new Error(
    "Test API failed to start: " + output.slice(-700)
  );
}

async function main() {
  check(
    env.NODE_ENV === "development",
    "Development mode required"
  );

  check(env.MONGODB_URI, "MongoDB URI missing");

  await mongoose.connect(env.MONGODB_URI);

  check(
    mongoose.connection.db?.databaseName === EXPECTED_DB,
    "STOP: Wrong database. Test writes refused."
  );

  console.log("Isolated Database: VERIFIED");

  const [products, orders, admins] = await Promise.all([
    ProductModel.countDocuments(),
    OrderModel.countDocuments(),
    AdminModel.countDocuments()
  ]);

  check(
    products === 0 && orders === 0 && admins === 0,
    "STOP: Test database contains existing records."
  );

  console.log("Empty Test Collections: VERIFIED");

  // Only the isolated database receives these records.
  await ProductModel.create({
    name: "Automated COD Test Product",
    slug,
    sku: `TEST-${id.toUpperCase()}`,
    categorySlug: "honey",
    description: "Temporary isolated COD test product.",
    shortDescription: "Automated inventory test",
    price: 100,
    currency: "BDT",
    unit: "1 pc",
    images: [],
    stockQuantity: 10,
    trackInventory: true,
    status: "active",
    featured: false
  });

  productCreated = true;

  const password = randomUUID() + "Aa9!";
  const passwordHash = await bcrypt.hash(password, 12);

  await AdminModel.create({
    name: "Temporary Test Admin",
    email,
    passwordHash,
    role: "super_admin",
    active: true,
    sessionVersion: 1
  });

  adminCreated = true;

  console.log("Temporary Product Stock:", await stock());

  await startServer();
  console.log("Isolated Backend: ONLINE");

  const login = await post("/api/admin/login", {
    email,
    password
  });

  check(login.status === 200 && login.cookie, "Admin login failed");
  console.log("Temporary Admin Login: PASS");

  const quote = await post("/api/checkout/quote", {
    items: [{ productId: slug, quantity: 2 }]
  });

  check(quote.status === 200, "Quote API failed");
  check(quote.body.canCheckout, "Quote unexpectedly blocked");
  check(quote.body.subtotal === 200, "Wrong quote subtotal");

  console.log("Verified Subtotal: ৳200");

  const payload = {
    requestId,
    customer: {
      name: "COD Test Customer",
      phone,
      district: "Test District",
      address: "Temporary test address only",
      note: "Automated isolated test"
    },
    deliveryArea: "outside_dhaka",
    items: [{ productId: slug, quantity: 2 }]
  };

  const order = await post("/api/orders", payload);

  // A successful response must correspond to a persisted order.
  const storedOrder = await OrderModel.findOne({ requestId });

  if (storedOrder) orderCreated = true;

  check(order.status === 201, "COD Order API did not return 201");
  check(storedOrder, "Order not persisted");
  check(storedOrder.subtotal === 200, "Wrong order subtotal");
  check(storedOrder.deliveryFee === 130, "Wrong delivery fee");
  check(storedOrder.total === 330, "Wrong COD total");

  console.log("COD Order Creation: PASS");
  console.log("Final COD Total: ৳330");

  check(await stock() === 8, "Stock did not decrease to 8");
  console.log("Stock 10 → 8: PASS");

  const duplicate = await post("/api/orders", payload);

  check(duplicate.status === 200, "Matching retry did not return HTTP 200");
  check(
    duplicate.body.success === true &&
    duplicate.body.idempotentReplay === true,
    "Matching retry was not identified as a replay"
  );
  check(
    duplicate.body.data?.orderNumber === storedOrder.orderNumber,
    "Retry returned a different order number"
  );
  check(await stock() === 8, "Duplicate request deducted stock");

  console.log("Order Replay Idempotency: PASS");

  const mismatchedReplay = await post("/api/orders", {
    ...payload,
    items: [{ productId: slug, quantity: 3 }]
  });

  check(
    mismatchedReplay.status === 409,
    "Modified payload with reused Request ID was accepted"
  );
  check(await stock() === 8, "Modified retry deducted stock");

  console.log("Mismatched Request Rejection: PASS");

  check(
    await OrderModel.countDocuments({ requestId }) === 1,
    "Duplicate order record detected"
  );

  console.log("Duplicate Request Protection: PASS");

  const insufficient = await post("/api/orders", {
    ...payload,
    requestId: randomUUID(),
    items: [{ productId: slug, quantity: 9 }]
  });

  check(
    insufficient.status === 409,
    "Insufficient-stock order was accepted"
  );
  check(await stock() === 8, "Invalid order deducted stock");

  console.log("Insufficient Stock Protection: PASS");

  const tracking = await post("/api/orders/track", {
    orderNumber: storedOrder.orderNumber,
    phone
  });

  check(tracking.status === 200, "Valid order tracking failed");
  check(tracking.body.data?.status === "pending", "Wrong tracking status");
  check(
    !("customer" in tracking.body.data) &&
    !("address" in tracking.body.data),
    "Tracking leaked customer details"
  );

  console.log("Order Tracking Privacy: PASS");

  const cancellation = await fetch(
    `${BASE}/api/admin/orders/${storedOrder._id}/status`,
    {
      method: "PATCH",
      headers: {
        Origin: env.FRONTEND_URL,
        "Content-Type": "application/json",
        Cookie: login.cookie
      },
      body: JSON.stringify({ status: "cancelled" })
    }
  );

  check(
    cancellation.status === 200,
    "Admin cancellation failed"
  );

  check(await stock() === 10, "Cancelled stock was not restored");

  const cancelledOrder = await OrderModel.findById(storedOrder._id);

  check(
    cancelledOrder?.status === "cancelled" &&
    cancelledOrder.stockReserved === false,
    "Order cancellation state incorrect"
  );

  console.log("Cancellation Stock 8 → 10: PASS");

  const repeatedCancel = await fetch(
    `${BASE}/api/admin/orders/${storedOrder._id}/status`,
    {
      method: "PATCH",
      headers: {
        Origin: env.FRONTEND_URL,
        "Content-Type": "application/json",
        Cookie: login.cookie
      },
      body: JSON.stringify({ status: "cancelled" })
    }
  );

  check(
    repeatedCancel.status === 409,
    "Repeated cancellation was accepted"
  );
  check(await stock() === 10, "Stock restored twice");

  console.log("Repeated Cancellation Protection: PASS");

  // NUURMART_CONCURRENT_ORDER_TEST_V1
  // Competing transactions for the final available units.
  console.log("");
  console.log("=== CONCURRENT INVENTORY TEST ===");

  const resetStock = await ProductModel.updateOne(
    { slug },
    { $set: { stockQuantity: 3 } }
  );

  check(
    resetStock.matchedCount === 1,
    "Could not prepare concurrent test stock"
  );

  check(await stock() === 3, "Concurrent test setup failed");

  const concurrentPayloads = concurrentRequestIds.map(
    concurrentId => ({
      ...payload,
      requestId: concurrentId,
      items: [{ productId: slug, quantity: 2 }]
    })
  );

  const concurrentResults = await Promise.all(
    concurrentPayloads.map(body => post("/api/orders", body))
  );

  const statuses = concurrentResults
    .map(result => result.status)
    .sort((a, b) => a - b);

  const concurrentOrders = await OrderModel.find({
    requestId: { $in: concurrentRequestIds }
  }).lean();

  const remaining = await stock();

  console.log("HTTP Statuses:", statuses.join(", "));
  console.log("Created Orders:", concurrentOrders.length);
  console.log("Remaining Stock:", remaining);

  check(
    concurrentOrders.length === 1,
    "Concurrency failure: expected exactly one order"
  );

  check(
    remaining === 1,
    "Concurrency failure: stock must equal 1"
  );

  console.log("Concurrent Overselling Prevention: PASS");

  check(
    statuses[0] === 201 && statuses[1] === 409,
    "Expected 201 and 409. A concurrency error may be returning HTTP 500."
  );

  console.log("Concurrent API Error Handling: PASS");

  console.log("");
  console.log("ALL COD RELIABILITY CHECKS PASSED");
}

async function cleanup() {
  if (server) {
    server.kill("SIGTERM");
    await sleep(500);
    if (server.exitCode === null) server.kill("SIGKILL");
  }

  // Delete only temporary test records created by this run.
  if (mongoose.connection.readyState === 1 &&
      mongoose.connection.db?.databaseName === EXPECTED_DB) {
    if (orderCreated) {
      await OrderModel.deleteMany({ requestId });
    }
    await OrderModel.deleteMany({
      requestId: { $in: concurrentRequestIds }
    });

    if (productCreated) {
      await ProductModel.deleteOne({ slug });
    }
    if (adminCreated) {
      await AdminModel.deleteOne({ email });
    }

    console.log("Temporary test records cleaned.");
  }

  await mongoose.disconnect();
}

main()
  .catch(error => {
    console.error("TEST FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (error) {
      console.error("Cleanup failed:", error);
      process.exitCode = 1;
    }
  });
