import path from "node:path";
// vitest.config.ts (or add to vite.config.ts)
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@/web": path.resolve(__dirname, "src"),
            "@/api": path.resolve(__dirname, "../api/src"),
            "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
        },
    },
    test: {
        // ← key piece: simulate a browser DOM
        environment: "jsdom",
        // let you use describe/it/globals without imports
        globals: true,
        // where to find your tests
        include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
        // run any setup code (e.g. jest-dom)
        setupFiles: "src/setup-tests.tsx",
        // inline ESM‑only deps if necessary
        // deps: { inline: [/solid-js/, /@testing-library/] },
    },
});
