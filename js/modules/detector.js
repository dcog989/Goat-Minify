/**
 * @file detector.js
 * @description Code type detection logic
 */

import { DETECT_REGEX } from './constants.js';

/**
 * Detect code type from content
 * @param {string} code - Code content to analyze
 * @param {string|null} uploadedFilename - Optional uploaded filename for context
 * @returns {string} Detected type (js, css, html, etc.)
 */
export function detectCodeType(code, uploadedFilename = null) {
    const trimmedCode = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!trimmedCode) return "none";

    const firstK = trimmedCode.substring(0, 3000);

    // File extension hints (Strong signal)
    if (uploadedFilename) {
        const ext = uploadedFilename.substring(uploadedFilename.lastIndexOf(".") + 1).toLowerCase();
        const typeFromExt = detectFromExtension(ext, trimmedCode, firstK);
        if (typeFromExt) return typeFromExt;
    }

    // Content-based detection
    return detectFromContent(trimmedCode, firstK);
}

/**
 * Detect type from file extension with validation
 * @private
 */
function detectFromExtension(ext, trimmedCode, firstK) {
    if (ext === "json") {
        try {
            JSON.parse(trimmedCode);
            return "json";
        } catch (e) {
            // Fallthrough
        }
    }
    
    if (ext === "svg" && DETECT_REGEX.SVG.test(firstK)) return "svg";
    if (ext === "html" && DETECT_REGEX.HTML.test(firstK)) return "html";
    if (ext === "xml" && DETECT_REGEX.XML.test(firstK)) return "xml";
    if (ext === "css" && (DETECT_REGEX.CSS_RULE.test(trimmedCode) || DETECT_REGEX.CSS_AT_RULE.test(firstK) || DETECT_REGEX.CSS_VAR.test(firstK))) return "css";
    if (ext === "js" && (DETECT_REGEX.JS_KEYWORD.test(firstK) || DETECT_REGEX.JS_OPERATOR.test(trimmedCode))) return "js";
    if ((ext === "yaml" || ext === "yml") && (DETECT_REGEX.YAML_START.test(firstK) || DETECT_REGEX.YAML_KEY_VALUE.test(firstK))) return "yaml";
    if (ext === "toml" && (DETECT_REGEX.TOML_TABLE.test(firstK) || DETECT_REGEX.TOML_KEY_VALUE.test(firstK))) return "toml";
    if ((ext === "md" || ext === "markdown") && (DETECT_REGEX.MARKDOWN_HEADER.test(firstK) || DETECT_REGEX.MARKDOWN_LIST.test(firstK) || DETECT_REGEX.MARKDOWN_CODE_BLOCK.test(firstK))) return "md";
    
    return null;
}

/**
 * Detect type from content patterns
 * @private
 */
function detectFromContent(trimmedCode, firstK) {
    // 1. Markup / DocType (Highest Priority)
    if (firstK.trim().startsWith("<!DOCTYPE html") || firstK.trim().startsWith("<html")) return "html";
    if (firstK.trim().startsWith("<?xml")) return "xml";
    if (DETECT_REGEX.SVG.test(firstK) && /<\/svg\s*>$/i.test(trimmedCode)) return "svg";

    // 2. Markdown Strong Signals
    if (firstK.startsWith("---") && /\n---/.test(firstK)) return "md";
    if (DETECT_REGEX.MARKDOWN_CODE_BLOCK.test(firstK)) return "md";
    if (DETECT_REGEX.MARKDOWN_HEADER.test(firstK) && (DETECT_REGEX.MARKDOWN_LIST.test(firstK) || DETECT_REGEX.MARKDOWN_LINK.test(firstK))) return "md";

    // 3. JSON
    try {
        if (trimmedCode.startsWith("{") || trimmedCode.startsWith("[")) {
            JSON.parse(trimmedCode);
            return "json";
        }
    } catch (e) { /* Not JSON */ }

    // 4. JavaScript (Strong Keywords)
    // MOVED UP: Check JS before CSS because JS objects/classes often look like CSS rules.
    // The Regex now handles exclusions for CSS vars (var(--x)) and imports (@import)
    if (DETECT_REGEX.JS_STRONG_KEYWORDS.test(firstK)) {
        return "js";
    }
    
    // Specific JS structures that confuse CSS regex
    if (/\bclass\s+[a-zA-Z0-9_]+\s*\{/.test(firstK)) return "js"; // class MyClass {
    if (/=>/.test(firstK)) return "js"; // Arrow functions

    // 5. CSS
    if (DETECT_REGEX.CSS_AT_RULE.test(firstK)) return "css"; // @media, @import
    if (DETECT_REGEX.CSS_RULE.test(trimmedCode) && trimmedCode.includes("{") && trimmedCode.includes(":")) return "css";

    // 6. HTML (Weaker check)
    if (DETECT_REGEX.HTML.test(firstK)) return "html";

    // 7. Data Configs
    if (DETECT_REGEX.YAML_START.test(firstK) || (DETECT_REGEX.YAML_KEY_VALUE.test(firstK) && DETECT_REGEX.YAML_LIST_ITEM.test(firstK))) return "yaml";
    if (DETECT_REGEX.TOML_TABLE.test(firstK) && DETECT_REGEX.TOML_KEY_VALUE.test(firstK)) return "toml";

    // 8. Fallbacks
    if (DETECT_REGEX.MARKDOWN_HEADER.test(firstK) || DETECT_REGEX.MARKDOWN_LIST.test(firstK)) return "md";
    if (DETECT_REGEX.JS_KEYWORD.test(firstK) || DETECT_REGEX.JS_OPERATOR.test(trimmedCode)) return "js";

    return "none";
}

/**
 * Extract first-line comments (header) from code
 * @param {string} code - Source code
 * @param {string} type - Code type
 * @returns {{header: string, body: string}} Separated header and body
 */
export function extractLine1Comments(code, type) {
    let header = "";
    let body = code;
    let commentPattern;

    if (type === "yaml" || type === "toml") {
        commentPattern = /^\s*(#(?!!)[^\r\n]*)/;
    } else if (type === "md") {
        const fmMatch = code.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
        if (fmMatch) {
            header = fmMatch[0];
            body = code.substring(fmMatch[0].length);
            return { header, body };
        }
        commentPattern = /^\s*(<!--![\s\S]*?-->|<!--[\s\S]*?-->)/;
    } else {
        commentPattern = /^\s*(\/\*![\s\S]*?\*\/|\/\/[!][^\r\n]*|<!--![\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|<!--[\s\S]*?-->)/;
    }

    const match = code.match(commentPattern);
    if (match && match[0].indexOf(match[1]) === match[0].trimStart().indexOf(match[1])) {
        header = match[0];
        body = code.substring(match[0].length);
    }
    
    return { header, body };
}