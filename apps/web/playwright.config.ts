import { defineConfig, devices } from "@playwright/test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Define __dirname for ES module scope
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    testDir: "playwright",
    // timeout: 5 * 60 * 1000,
    // 5 sec timeout
    timeout: 30 * 1000,
    retries: process.env.CI ? 2 : 0,
    reporter: [
        ["json", { outputFile: "test-results.json" }],
    ],
    webServer: {
        command: "pnpm dev",
        cwd: resolve(__dirname, "../.."),
        url: "http://localhost:3000",
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,

        // reuseExistingServer: !process.env.CI,
    },

    use: {
        baseURL: "http://localhost:3000",
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        video: "retain-on-failure",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        // {
        //     name: "firefox",
        //     use: { ...devices["Desktop Firefox"] },
        // },
        // {
        //     name: "webkit",
        //     use: { ...devices["Desktop Safari"] },
        // },
    ],
});
