import { getApiUrl } from "@/lib/get-api-url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@cronicorn/api"],
  async rewrites() {
    const DESTINATION =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3001"
        : "http://cronicorn-api:3001";
    console.log("Rewrites destination:", DESTINATION);
    return [
      {
        source: "/api/auth/:path*",
        // destination: "http://localhost:3001/api/auth/:path*",
        destination: `${DESTINATION}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
