import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  requireAdmin,
  requireTrustedOrigin
} from "../auth/admin.security.js";

export const productUploadRouter = Router();

const UPLOAD_DIR = path.resolve(
  process.cwd(),
  "uploads",
  "products"
);

const MAX_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
    fields: 0
  },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(file.mimetype)) {
      callback(new Error("Only JPEG, PNG and WebP are allowed"));
      return;
    }

    callback(null, true);
  }
});

productUploadRouter.post(
  "/product-image",
  requireAdmin,
  requireTrustedOrigin,
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        res.status(400).json({
          success: false,
          message: error instanceof multer.MulterError
            ? "Invalid image upload or file too large"
            : "Unsupported image format"
        });
        return;
      }

      next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "Image file required"
        });
        return;
      }

      const processor = sharp(req.file.buffer, {
        limitInputPixels: 20_000_000,
        failOn: "error"
      });

      const metadata = await processor.metadata();

      if (
        !metadata.format ||
        !["jpeg", "png", "webp"].includes(metadata.format) ||
        !metadata.width ||
        !metadata.height ||
        metadata.width < 1 ||
        metadata.height < 1 ||
        metadata.width * metadata.height > 20_000_000
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid or unsupported image content"
        });
        return;
      }

      const filename = `${randomUUID()}.webp`;

      const optimized = await sharp(req.file.buffer, {
        limitInputPixels: 20_000_000,
        failOn: "error"
      })
        .rotate()
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 83, effort: 4 })
        .toBuffer();

      await mkdir(UPLOAD_DIR, { recursive: true });

      await writeFile(
        path.join(UPLOAD_DIR, filename),
        optimized,
        { flag: "wx" }
      );

      res.status(201).json({
        success: true,
        data: {
          url: `/uploads/products/${filename}`,
          filename,
          size: optimized.length,
          mimeType: "image/webp"
        }
      });
    } catch (error) {
      if (error instanceof Error && (
        /unsupported image format|Input buffer|corrupt|pixel limit|image exceeds/i
          .test(error.message)
      )) {
        res.status(400).json({
          success: false,
          message: "Invalid or corrupted image"
        });
        return;
      }

      next(error);
    }
  }
);
