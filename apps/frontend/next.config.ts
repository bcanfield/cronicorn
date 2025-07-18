import { getApiUrl } from "@/lib/get-api-url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@cronicorn/api"],
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        // destination: "http://localhost:3001/api/auth/:path*",
        destination: `${getApiUrl()}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
