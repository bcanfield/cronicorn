import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

/** @type {import('vite').UserConfig} */
export default defineConfig({
  // resolve: {
  //   alias: {
  //     // `@/web/foo` → `<projectRoot>/src/foo`
  //     "@/web": path.resolve(__dirname, "src"),
  //     // if you import `@workspace/ui/...`
  //     "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
  //   },
  // },
  // eslint-disable-next-line node/no-process-env
  envDir: process.env.NODE_ENV !== "production" ? "../../" : undefined,
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackRouter({
      routeFilePrefix: "~",
      routeTreeFileHeader: [
        "/* eslint-disable eslint-comments/no-unlimited-disable */",
        "/* eslint-disable */",
      ],
      generatedRouteTree: "./src/route-tree.gen.ts",

    }),
    react(),
    svgr(),
  ],

  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:9999",
    },
  },
});
