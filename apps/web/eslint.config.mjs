import pluginQuery from "@tanstack/eslint-plugin-query";
import createConfig from "@tasks-app/eslint-config/create-config";

export default createConfig({
  react: true,
}, {
  plugins: {
    "@tanstack/query": pluginQuery,
  },
  rules: {
    "antfu/top-level-function": "off",
    "@tanstack/query/exhaustive-deps": "error",
    "unicorn/filename-case": ["error", {
      case: "kebabCase",
      ignore: ["README.md", "~__root.tsx"],
    }],
  },
});
