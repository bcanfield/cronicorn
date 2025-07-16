import type { NextConfig } from "next";

const nextFullPath = `${process.env.NEXT_PUBLIC_API_PROTOCOL}://${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_API_PORT}`;

console.log({ nextFullPath });
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@cronicorn/api"],
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${nextFullPath}/api/auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${nextFullPath}/:path*`,
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
