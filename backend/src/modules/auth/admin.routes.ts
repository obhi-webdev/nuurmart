import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { AdminModel } from "./admin.model.js";
import {
  ADMIN_COOKIE,
  createSession,
  cookieOptions,
  clearCookieOptions,
  requireAdmin,
  requireTrustedOrigin,
} from "./admin.security.js";

export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

const loginSchema = z.object({
  email: z.email().max(254).transform(
    (value) => value.trim().toLowerCase()
  ),
  password: z.string().min(1).max(1024),
});

adminRouter.post(
  "/login",
  requireTrustedOrigin,
  loginLimiter,
  async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: "Invalid login input",
        });
        return;
      }

      const admin = await AdminModel.findOne({
        email: parsed.data.email,
        active: true,
      }).select("+passwordHash");

      const valid = admin
        ? await bcrypt.compare(
            parsed.data.password,
            admin.passwordHash
          )
        : false;

      if (!admin || !valid) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      const token = await createSession(
        String(admin._id),
        admin.sessionVersion
      );

      res.cookie(ADMIN_COOKIE, token, cookieOptions());

      res.json({
        success: true,
        admin: {
          id: String(admin._id),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get("/me", requireAdmin, (_req, res) => {
  const admin = res.locals.admin;

  res.setHeader("Cache-Control", "no-store");

  res.json({
    success: true,
    admin: {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

adminRouter.post(
  "/logout",
  requireTrustedOrigin,
  (_req, res) => {
    res.clearCookie(ADMIN_COOKIE, clearCookieOptions());

    res.json({
      success: true,
      message: "Signed out",
    });
  }
);

adminRouter.get(
  "/dashboard",
  requireAdmin,
  (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      message: "Authorized admin dashboard",
      modules: [
        "products",
        "categories",
        "orders",
        "customers",
        "banners",
        "settings",
      ],
    });
  }
);
