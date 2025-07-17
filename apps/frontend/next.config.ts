import type { NextConfig } from "next";

console.log("NEXT PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL);
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@cronicorn/api"],
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/auth/:path*",
  //       destination: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/:path*`,
  //     },
  //     {
  //       source: "/api/:path*",
  //       destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
  //     },
  //   ];
  // },
  /* config options here */
};

export default nextConfig;
