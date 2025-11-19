/**
 * @file url-stub.js
 * @description Extends the 'url' polyfill with missing Node.js specific functions
 * to prevent PostCSS/CSSNano from complaining in the browser.
 */

// Import from the alias defined in vite.config.js to avoid circular dependency
import * as urlPolyfill from 'original-url';

// PostCSS uses these to resolve file paths, which don't exist in the browser.
// We stub them to return safe strings.
export const fileURLToPath = (url) => {
    if (typeof url === 'string') return url;
    return url.toString();
};

export const pathToFileURL = (path) => {
    // Safe stub for browser environment
    try {
        return new URL('file://' + path);
    } catch (e) {
        return new URL('file:///unknown');
    }
};

// Export everything else from the standard polyfill
export const { URL, URLSearchParams, domainToASCII, domainToUnicode, format, parse, resolve } = urlPolyfill;
export default {
    ...urlPolyfill,
    fileURLToPath,
    pathToFileURL
};