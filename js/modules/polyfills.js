/**
 * @file polyfills.js
 * @description Injects Node.js globals into the browser window object.
 * Required for libraries like cssnano, postcss, and browserslist.
 */

import { Buffer } from 'buffer';
import process from 'process';

// Inject globals
window.Buffer = Buffer;
window.process = process;
window.global = window;

// Polyfill process.cwd() specifically for browserslist
if (!window.process.cwd) {
    window.process.cwd = () => '/';
}

// Ensure process.env exists
if (!window.process.env) {
    window.process.env = {};
}