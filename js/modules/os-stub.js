/**
 * @file os-stub.js
 * @description Minimal polyfill for Node.js 'os' module to support cssnano/postcss in browser.
 * Replaces the abandoned 'os-browserify' package.
 */

export const platform = () => 'browser';
export const type = () => 'Browser';
export const release = () => '1.0.0';
export const endianness = () => 'LE';
export const arch = () => 'javascript';
export const homedir = () => '/';
export const tmpdir = () => '/tmp';
export const EOL = '\n';

export default {
    platform,
    type,
    release,
    endianness,
    arch,
    homedir,
    tmpdir,
    EOL
};