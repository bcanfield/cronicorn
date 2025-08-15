import createConfig from "@tasks-app/eslint-config/create-config";

export default createConfig({
  rules: {
    // TODO: remove this when all placeholders are implemented
    "unused-imports/no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",

    // Enforce .js extensions for relative imports (required for Node.js ESM)
    "import/extensions": ["error", "ignorePackages", {
      js: "always",
      ts: "never",
    }],
  },
});
