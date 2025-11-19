/**
 * @file url-stub.js
 * @description Extends the 'url' polyfill with missing Node.js specific functions
 * to prevent PostCSS/CSSNano from complaining in the browser.
 */

import * as urlPolyfill from 'url';

// PostCSS uses these to resolve file paths, which don't exist in the browser.
// We stub them to return safe strings.
export const fileURLToPath = (url) => {
    if (typeof url === 'string') return url;
    return url.toString();
};

export const pathToFileURL = (path) => {
    return new URL('file://' + path);
};

// Export everything else from the standard polyfill
export const { URL, URLSearchParams, domainToASCII, domainToUnicode, format, parse, resolve } = urlPolyfill;
export default {
    ...urlPolyfill,
    fileURLToPath,
    pathToFileURL
};