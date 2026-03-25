import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "no-unused-vars": "warn",
      "no-console": "off",
      "indent": ["error", 2],
      "no-trailing-spaces": "error"
    }
  }
];