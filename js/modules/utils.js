/**
 * @file utils.js
 * @description Utility functions
 */

/**
 * Debounce function to limit function execution rate
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Generate timestamp suffix for file naming
 * @returns {string} Timestamp in format YYMMDDH HMM
 */
export function getTimestampSuffix() {
    const n = new Date();
    return `${String(n.getFullYear()).slice(-2)}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}${String(n.getHours()).padStart(2, "0")}${String(n.getMinutes()).padStart(2, "0")}`;
}

/**
 * Normalize line endings to \n
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Format output by combining header and body
 * @param {string} header - Header comment
 * @param {string} body - Body content
 * @returns {string} Formatted output
 */
export function formatOutput(header, body) {
    const trimmedHeader = header.trimEnd();
    const trimmedBody = body.trim();
    
    if (!trimmedHeader && !trimmedBody) return "";
    if (!trimmedHeader) return trimmedBody;
    if (!trimmedBody) return trimmedHeader;
    
    return `${trimmedHeader}\n${trimmedBody}`;
}

/**
 * Sanitize filename for downloads
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
    return filename.replace(/[^\w.-]/g, "_").replace(/_{2,}/g, "_");
}