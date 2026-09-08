/**
 * @file type-config.js
 * @description Single source of truth mapping code types to minifier and highlighter configuration
 */

import { applyBasicMinification, minifyCSS, minifyHTML, minifyJS } from "./minification-engines.js";

const basicMinify = (body, level, type) => applyBasicMinification(body, level, type);

export const TYPE_CONFIG = {
  js: { minify: minifyJS, hljs: "javascript", ext: "js" },
  json: { minify: minifyJS, hljs: "json", ext: "json" },
  css: { minify: minifyCSS, hljs: "css", ext: "css" },
  html: { minify: minifyHTML, hljs: "xml", ext: "html" },
  svg: { minify: minifyHTML, hljs: "xml", ext: "svg" },
  xml: { minify: minifyHTML, hljs: "xml", ext: "xml" },
  yaml: { minify: basicMinify, hljs: "yaml", ext: "yaml" },
  toml: { minify: basicMinify, hljs: "ini", ext: "toml" },
  md: { minify: basicMinify, hljs: "markdown", ext: "md" },
  none: { minify: basicMinify, hljs: "plaintext", ext: "txt" },
};
