import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: "module",
      },
      globals: globals.node
    },
    rules: {
      "eol-last": ["error", "always"],
      "brace-style": ["error", "1tbs"],
      "@typescript-eslint/no-explicit-any": "warn",
      "import/no-named-as-default-member": "off" // Temporarily disable this rule
    }
  }
];