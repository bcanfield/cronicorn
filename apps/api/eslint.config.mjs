import createConfig from "@tasks-app/eslint-config/create-config";
import drizzle from "eslint-plugin-drizzle";

export default createConfig({
  "ignores": ["src/db/migrations/*", "public/*"],
  "plugins": { drizzle },
  "rules": {
    ...drizzle.configs.recommended.rules,
  },
  // Enforce .js extensions for relative imports (required for Node.js ESM)
  "import/extensions": ["error", "ignorePackages", {
    js: "always",
    ts: "never",
  }],
});
