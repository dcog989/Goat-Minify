/**
 * @file minification-engines.js
 * @description Minification logic using Pure JS tools.
 * Supports "Idle Preloading" to ensure UI loads instantly, but engines are ready before user input.
 */

import { DETECT_REGEX } from './constants.js';

// Cache for dynamically loaded modules
const engines = {
    terser: null,
    postcss: null,
    cssnano: null,
    htmlMinifier: null
};

/**
 * Trigger background loading of heavy engines.
 * Call this after the initial page render.
 */
export function preloadEngines() {
    console.log("🚀 Preloading minification engines in background...");
    
    // Load Terser
    if (!engines.terser) {
        import('terser').then(mod => {
            engines.terser = mod.minify;
        }).catch(e => console.warn("Preload Terser failed:", e));
    }

    // Load HTML Minifier
    if (!engines.htmlMinifier) {
        import('html-minifier-terser-bundle').then(mod => {
            engines.htmlMinifier = mod.default.minify;
        }).catch(e => console.warn("Preload HTML failed:", e));
    }

    // Load PostCSS + CSSNano
    if (!engines.postcss) {
        Promise.all([
            import('postcss'),
            import('cssnano')
        ]).then(([postMod, cssMod]) => {
            engines.postcss = postMod.default;
            engines.cssnano = cssMod.default;
        }).catch(e => console.warn("Preload CSS failed:", e));
    }
}

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

    if (level >= 3 && looksLikeJsOrJson) {
        try {
            if (!engines.terser) {
                console.log("⏳ Waiting for Terser to load...");
                engines.terser = (await import('terser')).minify;
            }

            const result = await engines.terser(originalBody, {
                ecma: 2020, sourceMap: false,
                format: { beautify: false, semicolons: true, comments: false },
                compress: {
                    dead_code: true, conditionals: true, booleans: true, loops: true, unused: true,
                    if_return: true, join_vars: true, 
                    sequences: level === 4, 
                    passes: level === 4 ? 2 : 1,
                    drop_console: level === 4,
                    unsafe: level === 4
                },
                mangle: level === 4
            });
            if (result.code) return result.code;
        } catch (e) {
            console.warn("Terser failed, falling back:", e);
        }
    }
    return applyFallbackMinification(originalBody, level, "js");
}

export async function minifyCSS(originalBody, level) {
    if (!originalBody.trim() && level > 1) return "";
    
    if (level >= 3) {
        try {
            if (!engines.postcss) {
                console.log("⏳ Waiting for PostCSS/CSSNano to load...");
                const [postcssMod, cssnanoMod] = await Promise.all([
                    import('postcss'),
                    import('cssnano')
                ]);
                engines.postcss = postcssMod.default;
                engines.cssnano = cssnanoMod.default;
            }

            const presetConfig = level === 4 
                ? { preset: ['default', { discardComments: { removeAll: true }, normalizeWhitespace: true }] }
                : { preset: ['default', { discardComments: false }] };

            const result = await engines.postcss([
                engines.cssnano(presetConfig)
            ]).process(originalBody, { from: undefined });

            if (result && result.css) return result.css;
        } catch (e) {
            console.warn("cssnano failed, falling back:", e);
        }
    }
    return applyFallbackMinification(originalBody, level, "css");
}

export async function minifyHTML(originalBody, level) {
    if (!originalBody.trim()) return "";

    if (level >= 3) {
        try {
            if (!engines.htmlMinifier) {
                console.log("⏳ Waiting for HTMLMinifier to load...");
                const mod = await import('html-minifier-terser-bundle');
                engines.htmlMinifier = mod.default.minify;
            }

            const options = {
                html5: true,
                decodeEntities: true,
                removeComments: true,
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                removeRedundantAttributes: level === 4,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                removeOptionalTags: level === 4,
                collapseBooleanAttributes: level === 4,
                removeAttributeQuotes: level === 4,
                removeEmptyAttributes: true,
                sortAttributes: level === 4,
                sortClassName: level === 4,
                minifyJS: level >= 3,
                minifyCSS: level >= 3
            };
            
            return await engines.htmlMinifier(originalBody, options);
        } catch (e) {
            console.warn("HTMLMinifier failed, falling back:", e);
        }
    }
    return applyFallbackMinification(originalBody, level, "html");
}