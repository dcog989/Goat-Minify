/**
 * @file fs-stub.js
 * @description A fake file system module to prevent Node.js libraries from crashing in the browser.
 */

const noop = () => {};
const noopAsync = () => Promise.resolve(null);

// Named exports for "import { readFile } from 'fs'"
export const existsSync = () => false;
export const readFileSync = () => "";
export const readFile = noopAsync;
export const writeFile = noopAsync;
export const statSync = () => ({ isFile: () => false, isDirectory: () => false });
export const promises = {
    readFile: noopAsync,
    writeFile: noopAsync,
};

// Default export for "import fs from 'fs'"
export default {
    existsSync,
    readFileSync,
    readFile,
    writeFile,
    statSync,
    promises
};