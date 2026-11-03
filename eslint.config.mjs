import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import vue from "eslint-plugin-vue";

export default [
  { ignores: ["app/generated/**", ".nuxt/**", ".output/**", "node_modules/**"] },
  {
    files: ["**/*.{js,mjs,ts,vue}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser, extraFileExtensions: [".vue"] } },
    plugins: { vue },
    rules: { "vue/no-parsing-error": "error", "vue/no-dupe-keys": "error" },
  },
];
