import type { Request, Response, NextFunction } from "express";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../config/env.js";
import { AdminModel } from "./admin.model.js";

export const ADMIN_COOKIE = "nm_admin_session";

const encoder = new TextEncoder();

function secret() {
  const value = env.ADMIN_JWT_SECRET;

  if (!value || value.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must be at least 32 characters");
  }

  return encoder.encode(value);
}

export async function createSession(
  adminId: string,
  version: number
) {
  return new SignJWT({ version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setIssuer("nuurmart-api")
    .setAudience("nuurmart-admin")
    .setExpirationTime("8h")
    .sign(secret());
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/admin",
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/admin",
  };
}

export function requireTrustedOrigin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const origin = req.get("origin");

  if (origin !== env.FRONTEND_URL) {
    res.status(403).json({
      success: false,
      message: "Request origin not permitted",
    });
    return;
  }

  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.[ADMIN_COOKIE];

    if (typeof token !== "string") {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "nuurmart-api",
      audience: "nuurmart-admin",
    });

    if (!payload.sub) {
      res.status(401).json({
        success: false,
        message: "Invalid session",
      });
      return;
    }

    const admin = await AdminModel.findById(payload.sub);

    if (
      !admin ||
      !admin.active ||
      admin.sessionVersion !== payload.version
    ) {
      res.status(401).json({
        success: false,
        message: "Session expired",
      });
      return;
    }

    res.locals.admin = admin;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}
