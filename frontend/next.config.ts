import type { NextConfig } from "next";
import path from "node:path";

const backendOrigin = (
  process.env.NUURMART_BACKEND_ORIGIN ||
  "http://127.0.0.1:5001"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`
      },
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`
      }
    ];
  },

  turbopack: {
    root: path.resolve(process.cwd(), "..")
  }
};

export default nextConfig;
