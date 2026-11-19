import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../config/env.js";
import { AdminModel } from "../modules/auth/admin.model.js";

async function main() {
  if (env.NODE_ENV !== "development") {
    throw new Error("Bootstrap script requires development mode.");
  }

  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI not configured");
  }

  const email = z.email().parse(
    process.env.NUURMART_ADMIN_EMAIL?.trim().toLowerCase()
  );

  const password = z.string().min(12).max(72).parse(
    process.env.NUURMART_ADMIN_PASSWORD
  );

  const name = z.string().min(2).max(100).parse(
    process.env.NUURMART_ADMIN_NAME || "NuurMart Administrator"
  );

  await mongoose.connect(env.MONGODB_URI);

  const existingAdmins = await AdminModel.countDocuments();

  if (existingAdmins > 0) {
    throw new Error(
      "An admin already exists. Bootstrap disabled."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await AdminModel.create({
    email,
    name,
    passwordHash,
    role: "super_admin",
    active: true,
    sessionVersion: 1,
  });

  console.log("Super Admin created.");
  console.log("Email:", admin.email);
  console.log("Role:", admin.role);
}

main()
  .catch((error: unknown) => {
    console.error(
      "Bootstrap failed:",
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
