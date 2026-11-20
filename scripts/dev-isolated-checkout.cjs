const path = require("node:path");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");

const root = path.resolve(__dirname, "..");

require(
  path.join(root, "backend/node_modules/dotenv")
).config({
  path: path.join(root, "backend/.env"),
  quiet: true
});

const originalUri = process.env.MONGODB_URI;

if (!originalUri) {
  throw new Error("Missing MONGODB_URI");
}

const parsed = new URL(originalUri);

const currentDatabase = decodeURIComponent(
  parsed.pathname.replace(/^\//, "")
);

if (currentDatabase !== "nuur") {
  throw new Error(
    "STOP: Expected source database nuur."
  );
}

parsed.pathname = "/nuurmart_cod_test";
parsed.searchParams.delete("dbName");

const backendUrl = "http://127.0.0.1:5101";
const frontendUrl = "http://localhost:3100";

const children = [];
let shuttingDown = false;

async function portIsOccupied(port) {
  const net = require("node:net");

  return new Promise(resolve => {
    const socket = net.connect({
      host: "127.0.0.1",
      port
    });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(true);
    });
  });
}

async function waitFor(url, child) {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (child.exitCode !== null) {
      throw new Error(
        `Service exited before becoming ready: ${url}`
      );
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1200)
      });

      if (response.ok) return response;
    } catch {}

    await delay(500);
  }

  throw new Error(`Service not ready: ${url}`);
}

function launch(label, command, args, options) {
  console.log(`Starting ${label}...`);

  const child = spawn(command, args, {
    ...options,
    stdio: "inherit"
  });

  children.push(child);

  child.on("error", error => {
    console.error(`${label}:`, error.message);
    shutdown(1);
  });

  child.on("exit", code => {
    if (!shuttingDown) {
      console.error(
        `${label} stopped unexpectedly: ${code}`
      );

      shutdown(1);
    }
  });

  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;

  shuttingDown = true;

  console.log("\nStopping isolated services...");

  for (const child of children) {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
    }
  }

  process.exitCode = code;

  setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    }
    process.exit(code);
  }, 2000).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  if (
    await portIsOccupied(3100) ||
    await portIsOccupied(5101)
  ) {
    throw new Error(
      "STOP: Port 3100 or 5101 is already occupied."
    );
  }

  console.log("=== ISOLATED ENVIRONMENT ===");
  console.log("Source Database:", currentDatabase);
  console.log("Test Database: nuurmart_cod_test");
  console.log("Test Backend:", backendUrl);
  console.log("Test Frontend:", frontendUrl);
  console.log("Database Credentials: HIDDEN");

  const backend = launch(
    "Test Backend",
    process.execPath,
    ["dist/server.js"],
    {
      cwd: path.join(root, "backend"),
      env: {
        ...process.env,
        NODE_ENV: "development",
        PORT: "5101",
        MONGODB_URI: parsed.toString(),
        FRONTEND_URL: frontendUrl
      }
    }
  );

  await waitFor(`${backendUrl}/api/health`, backend);
  console.log("Isolated Backend: READY");

  const response = await fetch(
    `${backendUrl}/api/products?limit=5`
  );

  if (!response.ok) {
    throw new Error("Isolated product API unavailable.");
  }

  const products = await response.json();

  if (!products.success) {
    throw new Error("Unexpected Product API response.");
  }

  console.log(
    "Test Database Active Products:",
    products.pagination?.total
  );

  const frontend = launch(
    "Test Frontend",
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "-p",
      "3100"
    ],
    {
      cwd: path.join(root, "frontend"),
      env: {
        ...process.env,
        NODE_ENV: "development",
        NEXT_PUBLIC_API_URL: `${backendUrl}/api`
      }
    }
  );

  await waitFor(frontendUrl, frontend);

  console.log("");
  console.log("=== ISOLATED BROWSER READY ===");
  console.log("Store:", frontendUrl);
  console.log(
    "Checkout:",
    `${frontendUrl}/checkout/place-order`
  );
  console.log(
    "Tracking:",
    `${frontendUrl}/orders/track`
  );
  console.log("");
  console.log("Press Ctrl+C to stop both services.");
}

main().catch(error => {
  console.error("STARTUP FAILED:", error.message);
  shutdown(1);
});
