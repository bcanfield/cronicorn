import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  return {
    resolve: {
      alias: {
        "@/api": path.resolve(__dirname, "./src"),
      },
    },
  };
});
