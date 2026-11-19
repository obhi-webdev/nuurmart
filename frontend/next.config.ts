import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:5001/uploads/:path*",
      },
    ];
  },

  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },
};

export default nextConfig;
