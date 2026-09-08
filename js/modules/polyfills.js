/**
 * @file polyfills.js
 * @description Injects Buffer into the browser window object.
 * Note: process is now handled in index.html to ensure earliest execution.
 */

import { Buffer } from "buffer";

// Inject globals for libraries that rely on them (like browserslist/cssnano)
window.Buffer = Buffer;
window.process = process;
window.global = window;

// Polyfill process.cwd() specifically for browserslist
if (!window.process.cwd) {
  window.process.cwd = () => "/";
}

// Ensure process.env exists
if (!window.process.env) {
  window.process.env = {};
}
