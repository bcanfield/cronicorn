import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import createMDX from "@next/mdx";
import remarkGFm from "remark-gfm";
// biome-ignore lint/correctness/noUnusedImports: Importing env for errors on init
import { env } from "./env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@cronicorn/ui"],
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.plugins = [...config.plugins, new PrismaPlugin()];
		}

		return config;
	},
};

const withMDX = createMDX({
	options: { remarkPlugins: [remarkGFm] },
	ignoreBuildErrors: true,

	// Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
