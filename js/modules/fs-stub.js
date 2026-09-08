/**
 * @file fs-stub.js
 * @description A fake file system module to prevent Node.js libraries from crashing in the browser.
 */

const noopAsync = () => Promise.resolve(null);

const fs = {
  existsSync: () => false,
  readFileSync: () => "",
  readFile: noopAsync,
  writeFile: noopAsync,
  statSync: () => ({ isFile: () => false, isDirectory: () => false }),
  promises: {
    readFile: noopAsync,
    writeFile: noopAsync,
  },
};

// Named exports for "import { readFile } from 'fs'"
export const { existsSync, readFileSync, readFile, writeFile, statSync, promises } = fs;

// Default export for "import fs from 'fs'"
export default fs;
