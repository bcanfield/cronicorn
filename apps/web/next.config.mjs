import createMDX from "@next/mdx";
import remarkGFm from "remark-gfm";
import { env } from "./env.mjs";

console.log("Environment Variables:", { env });

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@cronicorn/ui", "@cronicorn/database"],
	webpack: (config, { isServer }) => {
		// Exclude Prisma from client bundle
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
			};
		}

		return config;
	},
	serverExternalPackages: ["@prisma/client", "prisma"],
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
};

const withMDX = createMDX({
	options: { remarkPlugins: [remarkGFm] },
	ignoreBuildErrors: true,
});

export default withMDX(nextConfig);
