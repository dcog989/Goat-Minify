/**
 * @file os-stub.js
 * @description Minimal polyfill for Node.js 'os' module to support cssnano/postcss in browser.
 * Replaces the abandoned 'os-browserify' package.
 */

const os = {
  platform: () => "browser",
  type: () => "Browser",
  release: () => "1.0.0",
  endianness: () => "LE",
  arch: () => "javascript",
  homedir: () => "/",
  tmpdir: () => "/tmp",
  EOL: "\n",
};

export const { platform, type, release, endianness, arch, homedir, tmpdir, EOL } = os;
export default os;
