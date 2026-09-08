/**
 * @file type-config.js
 * @description Single source of truth mapping code types to minifier and highlighter configuration
 */

import { applyBasicMinification, minifyCSS, minifyHTML, minifyJS } from "./minification-engines.js";

export const TYPE_CONFIG = {
  js: { minify: minifyJS, hljs: "javascript", ext: "js" },
  json: { minify: minifyJS, hljs: "json", ext: "json" },
  css: { minify: minifyCSS, hljs: "css", ext: "css" },
  html: { minify: minifyHTML, hljs: "xml", ext: "html" },
  svg: { minify: minifyHTML, hljs: "xml", ext: "svg" },
  xml: { minify: minifyHTML, hljs: "xml", ext: "xml" },
  yaml: { minify: applyBasicMinification, hljs: "yaml", ext: "yaml" },
  toml: { minify: applyBasicMinification, hljs: "ini", ext: "toml" },
  md: { minify: applyBasicMinification, hljs: "markdown", ext: "md" },
  none: { minify: applyBasicMinification, hljs: "plaintext", ext: "txt" },
};
