import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
    js.configs.recommended,
    eslintConfigPrettier,
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.es2021,
                // Add libraries loaded via CDN in index.html
                Terser: "readonly",
                csso: "readonly",
                HTMLMinifier: "readonly",
                hljs: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "prefer-const": "error"
        }
    }
];