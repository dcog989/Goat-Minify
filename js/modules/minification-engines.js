/**
 * @file minification-engines.js
 * @description Minification logic for different languages
 */

import { DETECT_REGEX } from './constants.js';

function applyLevel1(b) { return !b ? "" : b.split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n"); }
function applyLevel2(b) { return !b ? "" : b.split("\n").filter((l) => l.trim().length > 0).join("\n"); }

function removeCommentsFromText(text, type, level) {
    if (!text) return "";
    if (type === "js" || type === "css") return text.replace(/\/\*(?![\!])[\s\S]*?\*\/|(?<!http:|https:)\/\/(?![\!]).*/g, "");
    if (type === "html" || type === "xml" || type === "svg") return text.replace(/<!--(?![\!])[\s\S]*?-->/g, "");
    if (type === "yaml" || type === "toml") return text.replace(/#(?![\!]).*$/gm, "").replace(/^\s*[\r\n]/gm, '');
    if (type === "md") {
        let processed = text.replace(/<!--(?![\!])[\s\S]*?-->/g, "");
        if (level >= 3) processed = processed.replace(/\n{3,}/g, '\n\n');
        return processed;
    }
    return text;
}

export function applyBasicMinification(body, level, type) {
    let pb = body;
    if (level >= 1) pb = applyLevel1(pb);
    if (level >= 2) pb = applyLevel2(pb);
    if (level >= 3 && pb.trim()) {
        pb = removeCommentsFromText(pb, type, level);
        pb = applyLevel2(pb);
        if (pb.trim() && type !== 'yaml' && type !== 'md') {
            pb = pb.split('\n').map(line => line.replace(/^\s+/, '')).join('\n');
        }
    }
    return pb;
}

export function applyFallbackMinification(originalBody, level, type) {
    let body = applyBasicMinification(originalBody, level, type);
    if (level === 4 && body.trim()) {
        if (type === "js") body = body.replace(/\n/g, " ").replace(/\s\s+/g, " ");
        if (type === "css") body = body.replace(/\s*([{};:,])\s*/g, "$1").replace(/;\s*}/g, "}").replace(/\s\s+/g, " ");
        if (type === "html") body = body.replace(/\n\s*/g, " ").replace(/>\s+</g, "><").replace(/\s\s+/g, " ").trim();
    }
    return body;
}

export async function minifyJS(originalBody, level) {
    const hasContent = originalBody && originalBody.trim();
    if (!hasContent) return "";
    
    const trimmedBodyForCheck = originalBody.trim();
    const looksLikeJsOrJson = trimmedBodyForCheck.startsWith("{") || trimmedBodyForCheck.startsWith("[") || 
                            DETECT_REGEX.JS_KEYWORD.test(trimmedBodyForCheck.substring(0, 500));

    if (level >= 3) {
        if (looksLikeJsOrJson && window.Terser?.minify) {
            try {
                const result = await window.Terser.minify({ "input.js": originalBody }, {
                    ecma: 2020, sourceMap: false,
                    format: { beautify: false, semicolons: true, comments: false },
                    compress: {
                        dead_code: true, conditionals: true, booleans: true, loops: true, unused: true,
                        if_return: true, join_vars: true, sequences: level === 4, passes: level === 4 ? 2 : 1,
                        drop_console: level === 4
                    },
                    mangle: level === 4
                });
                if (result.code) return result.code;
                throw new Error(result.error || "Unknown Terser error");
            } catch (e) {
                console.warn("Terser failed, falling back:", e);
            }
        }
    }
    return applyFallbackMinification(originalBody, level, "js");
}

export function minifyCSS(originalBody, level) {
    if (!originalBody.trim() && level > 1) return "";
    
    if (level >= 3 && window.csso?.minify) {
        try {
            const result = window.csso.minify(originalBody, {
                comments: false,
                restructure: level === 4,
                forceMediaMerge: level === 4
            });
            if (result?.css) return result.css;
            throw new Error("CSSO failed");
        } catch (e) {
            console.warn("CSSO failed, falling back:", e);
        }
    }
    return applyFallbackMinification(originalBody, level, "css");
}

export async function minifyHTML(originalBody, level) {
    if (!originalBody.trim()) return "";

    if (level >= 3 && window.HTMLMinifier?.minify) {
        try {
            return await window.HTMLMinifier.minify(originalBody, {
                html5: true, decodeEntities: true,
                removeComments: true, collapseWhitespace: true, collapseInlineTagWhitespace: true,
                removeRedundantAttributes: level === 4, removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true, removeOptionalTags: level === 4,
                collapseBooleanAttributes: level === 4, removeAttributeQuotes: level === 4,
                removeEmptyAttributes: true, sortAttributes: level === 4, sortClassName: level === 4,
                minifyJS: level >= 3, minifyCSS: level >= 3
            });
        } catch (e) {
            console.warn("HTMLMinifier failed, falling back:", e);
        }
    }
    return applyFallbackMinification(originalBody, level, "html");
}