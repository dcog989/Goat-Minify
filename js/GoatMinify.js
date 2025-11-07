/** Goat Minify
 * @file GoatMinify.js
 * @description A client-side HTML, CSS, JS, YAML, TOML minifier tool.
 * Provides multiple levels of minification and a user-friendly interface
 * for pasting, uploading, and processing code with syntax highlighting.
 * Allows manual override of detected code type.
 * @license MIT
 * @author Chase McGoat
 * @createdAt 2025-04-20
 * @lastModified 2025-06-06
 * @version 1.3.1
 */
document.addEventListener("DOMContentLoaded", () => {
    const inputArea = document.getElementById("input-area");
    const outputArea = document.getElementById("output-area");
    const inputHighlightArea = document.getElementById("input-highlight-area");
    const outputHighlightArea = document.getElementById("output-highlight-area");
    const inputHighlightCode = inputHighlightArea ? inputHighlightArea.querySelector('code') : null;
    const outputHighlightCode = outputHighlightArea ? outputHighlightArea.querySelector('code') : null;
    const minifyLevelSelectorWrapper = document.getElementById("minify-level-selector");
    const copyButton = document.getElementById("copy-button");
    const downloadButton = document.getElementById("download-button");
    const clearInputButton = document.getElementById("clear-input-button");
    const uploadFileButton = document.getElementById("upload-file-button");
    const typeDisplayOutput = document.getElementById("type-display-output");
    const manualTypeSelector = document.getElementById("manual-type-selector");
    const copyIconContainer = document.getElementById("copy-icon-svg-path-container");
    const inputLineCountEl = document.getElementById("input-line-count");
    const inputCharCountEl = document.getElementById("input-char-count");
    const outputLineCountEl = document.getElementById("output-line-count");
    const outputCharCountEl = document.getElementById("output-char-count");
    const fileInputHidden = document.getElementById("file-input-hidden");
    const customPlaceholder = document.getElementById("custom-placeholder");
    const toggleWordWrapButton = document.getElementById("toggle-word-wrap-button");
    const inputLineGutter = document.getElementById("input-line-gutter");
    const outputLineGutter = document.getElementById("output-line-gutter");

    const UI_CONSTANTS = {
        LOCAL_STORAGE_WORD_WRAP_KEY: "goatMinifyWordWrap",
        LOCAL_STORAGE_MANUAL_TYPE_KEY: "goatMinifyManualType",
        WORD_WRAP_ENABLED_CLASS: "word-wrap-enabled",
        WORD_WRAP_DISABLED_CLASS: "word-wrap-disabled",
        EMPTY_STATE_CLASS: "empty-state",
        HIDDEN_CLASS: "hidden",
        ACTIVE_CLASS: "active",
        DEBOUNCE_DELAY_MS: 400,
        HIGHLIGHT_DEBOUNCE_DELAY_MS: 150,
        FEEDBACK_MESSAGE_TIMEOUT_MS: 1500,
        STATUS_MESSAGE_TIMEOUT_MS: 3000,
        DEFAULT_MINIFY_LEVEL_ID: "minify-level-4",
        ACCEPTED_FILE_EXTENSIONS: ["js", "css", "html", "txt", "json", "xml", "svg", "yaml", "yml", "toml", "md", "markdown"],
        DEFAULT_HIGHLIGHT_COLOR: "var(--color-text-highlight)",
        ERROR_HIGHLIGHT_COLOR: "red",
        TYPE_OPTIONS: ["auto", "js", "css", "html", "json", "xml", "svg", "yaml", "toml", "md", "none"],
    };

    const CHECKMARK_ICON_PATH = '<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>';
    const originalCopyIconPath = copyIconContainer ? copyIconContainer.innerHTML : "";

    let autoDetectedType = "none";
    let effectiveType = "none";
    let isManualTypeOverrideActive = false;
    let isWordWrapEnabled = false;
    let uploadedFilenameBase = null;
    let measurementHelperDiv = null;

    let statusMessageTimer = null;

    function showTemporaryStatusMessage(message, isError = false, duration = UI_CONSTANTS.STATUS_MESSAGE_TIMEOUT_MS) {
        if (!typeDisplayOutput) return;
        if (statusMessageTimer) clearTimeout(statusMessageTimer);

        typeDisplayOutput.innerHTML = `<span style="color: ${isError ? UI_CONSTANTS.ERROR_HIGHLIGHT_COLOR : UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR}; font-weight: normal;">${message}</span>`;

        statusMessageTimer = setTimeout(() => {
            updateTypeDisplayOutput();
            statusMessageTimer = null;
        }, duration);
    }

    function updateTypeDisplayOutput() {
        if (!typeDisplayOutput || statusMessageTimer) return;

        let displayLabel = "Detected Type";
        let typeValue = autoDetectedType;

        if (isManualTypeOverrideActive && manualTypeSelector && manualTypeSelector.value !== "auto") {
            displayLabel = "Manual Type";
            typeValue = manualTypeSelector.value;
        }
        let typeDisplayName = (typeValue && typeValue !== "none") ? typeValue.toUpperCase() : "NONE";
        if (typeValue === 'md') typeDisplayName = 'Markdown';

        const valueSpan = `<span class="detected-type-value" style="font-weight: bold; color: ${UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR};">${typeDisplayName}</span>`;
        typeDisplayOutput.innerHTML = `${displayLabel}: ${valueSpan}`;
    }

    function getVisualLineCountForLogicalLine(logicalLineText, textarea) {
        if (!measurementHelperDiv) {
            measurementHelperDiv = document.createElement("div");
            Object.assign(measurementHelperDiv.style, {
                padding: "0", border: "none", visibility: "hidden",
                position: "absolute", top: "-9999px", left: "-9999px",
                boxSizing: "content-box"
            });
            document.body.appendChild(measurementHelperDiv);
        }
        const styles = getComputedStyle(textarea);
        Object.assign(measurementHelperDiv.style, {
            fontFamily: styles.fontFamily, fontSize: styles.fontSize,
            lineHeight: styles.lineHeight, whiteSpace: "pre-wrap",
            wordBreak: styles.wordBreak
        });
        const textareaPaddingLeft = parseFloat(styles.paddingLeft) || 0;
        const textareaPaddingRight = parseFloat(styles.paddingRight) || 0;
        const textareaWidth = textarea.clientWidth - textareaPaddingLeft - textareaPaddingRight;

        measurementHelperDiv.style.width = `${Math.max(0, textareaWidth)}px`;
        measurementHelperDiv.textContent = logicalLineText.length === 0 ? "\u00A0" : logicalLineText;

        const scrollHeight = measurementHelperDiv.scrollHeight;
        const singleLineHeight = parseFloat(styles.lineHeight) || (parseFloat(styles.fontSize) * parseFloat(getComputedStyle(document.body).getPropertyValue('--font-line-height-textarea') || 1.4));

        if (singleLineHeight === 0 || isNaN(singleLineHeight)) return 1;

        return Math.max(1, Math.round((scrollHeight + 0.001) / singleLineHeight));
    }

    function updateCustomPlaceholderVisibility() {
        if (!customPlaceholder || !inputArea) return;
        customPlaceholder.classList.toggle(UI_CONSTANTS.HIDDEN_CLASS, inputArea.value.trim() !== "" || document.activeElement === inputArea);
    }
    function updateButtonStates() {
        const isInputEmpty = !inputArea || inputArea.value.trim() === "";
        const isOutputEmpty = !outputArea || outputArea.value.trim() === "";
        if (clearInputButton) clearInputButton.disabled = isInputEmpty;
        if (copyButton) copyButton.disabled = isOutputEmpty;
        if (downloadButton) downloadButton.disabled = isOutputEmpty;
    }
    function updateSliderAppearance() {
        if (!minifyLevelSelectorWrapper || !inputArea || !outputArea) return;
        const isInputEmpty = inputArea.value.trim() === "" && outputArea.value.trim() === "";
        minifyLevelSelectorWrapper.classList.toggle(UI_CONSTANTS.EMPTY_STATE_CLASS, isInputEmpty);
        if (isInputEmpty) {
            const defaultLevelRadio = document.getElementById(UI_CONSTANTS.DEFAULT_MINIFY_LEVEL_ID);
            if (defaultLevelRadio && !defaultLevelRadio.checked) defaultLevelRadio.checked = true;
        }
    }
    function updateAllUIStates() {
        updateCustomPlaceholderVisibility();
        updateSliderAppearance();
        updateButtonStates();
        updateTypeDisplayOutput();
    }
    function syncScroll(sourceTextarea, ...elementsToSync) {
        if (!sourceTextarea) return;
        const scrollTop = sourceTextarea.scrollTop;
        const scrollLeft = sourceTextarea.scrollLeft;
        elementsToSync.forEach(el => {
            if (el) {
                el.scrollTop = scrollTop;
                if (el.tagName === 'PRE' || el.classList.contains('hljs-highlight-layer') || el.tagName === 'CODE') {
                    el.scrollLeft = scrollLeft;
                }
            }
        });
    }

    function updateGutterContent(textarea, gutterEl, highlightAreaEl) {
        if (!textarea || !gutterEl) return;
        const logicalLines = textarea.value.split("\n");
        const logicalLineCount = logicalLines.length;

        if (textarea.value === gutterEl.dataset.textareaValue &&
            gutterEl.dataset.wordWrapState === String(isWordWrapEnabled) &&
            gutterEl.firstChild &&
            logicalLineCount.toString() === gutterEl.dataset.logicalLineCount) {
            syncScroll(textarea, gutterEl, highlightAreaEl);
            return;
        }

        let newGutterTextContent = "";
        if (isWordWrapEnabled) {
            let linesForGutter = [];
            for (let i = 0; i < logicalLineCount; i++) {
                let lineDisplay = [(i + 1).toString()];
                const numVisualLines = getVisualLineCountForLogicalLine(logicalLines[i], textarea);
                for (let j = 1; j < numVisualLines; j++) {
                    lineDisplay.push("");
                }
                linesForGutter.push(lineDisplay.join('\n'));
            }
            newGutterTextContent = linesForGutter.join('\n');
            if (logicalLineCount > 0 || textarea.value === "") {
                newGutterTextContent += '\n';
            }
        } else {
            for (let i = 0; i < logicalLineCount; i++) {
                newGutterTextContent += `${i + 1}\n`;
            }
        }

        if (textarea.value === "" || (logicalLineCount === 1 && logicalLines[0] === "")) {
            newGutterTextContent = "1\n";
        }

        if (gutterEl.textContent !== newGutterTextContent) {
            gutterEl.textContent = newGutterTextContent;
        }

        gutterEl.dataset.logicalLineCount = logicalLineCount.toString();
        gutterEl.dataset.textareaValue = textarea.value;
        gutterEl.dataset.wordWrapState = String(isWordWrapEnabled);

        syncScroll(textarea, gutterEl, highlightAreaEl);
    }

    function updateCounts(textarea, lineEl, charEl, gutterEl, highlightAreaEl) {
        if (!textarea) return;
        const text = textarea.value;
        const lines = text.split("\n").length;
        const chars = text.length;
        if (lineEl) lineEl.textContent = `Lines: ${lines}`;
        if (charEl) charEl.textContent = `Chars: ${chars}`;

        if (gutterEl) updateGutterContent(textarea, gutterEl, highlightAreaEl);
        updateAllUIStates();
    }

    const DETECT_REGEX = {
        HTML: /<!DOCTYPE\s+html|<html\s*[\s>]|<body\s*[\s>]|<([a-z][a-z0-9]*)\b[^>]*>/i,
        SVG: /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"|<svg[^>]*>/i,
        XML: /<\?xml[^?]*\?>|<([a-zA-Z0-9_:]+)\b[^>]*>/i,
        CSS_RULE: /(?:[.#]?-?[_a-zA-Z]+[_a-zA-Z0-9-]*|\\[[^\]]+\\]|::?[a-zA-Z0-9-]+(?:\\([^)]+\\))?)\s*\{[\s\S]*?\}/,
        CSS_AT_RULE: /@(media|keyframes|font-face|import|charset|namespace|supports|document|page|layer|property|container|scope)\b/i,
        CSS_VAR: /--[a-zA-Z0-9-]+\s*:/,
        JS_KEYWORD: /\b(function|class|let|const|var|if|for|while|switch|return|async|await|import|export|yield|=>|document|window|console)\b/i,
        JS_OPERATOR: /(===?|!==?|&&|\|\||\+\+|--(?![a-zA-Z<])|\*\*|[+\-*/%&|^!~<>?]=?)/,
        YAML_START: /^(%YAML|---)/m,
        YAML_KEY_VALUE: /^\s*([a-zA-Z0-9_.-]+)\s*:\s*(.*)/m,
        YAML_LIST_ITEM: /^\s*-\s+\S+/m,
        TOML_TABLE: /^\s*\[([a-zA-Z0-9_.-]+)\]\s*$/m,
        TOML_KEY_VALUE: /^\s*([a-zA-Z0-9_.-]+)\s*=\s*(["']|true|false|[0-9]|\[|\{)/m,
        MARKDOWN_HEADER: /^(#+\s+.+|={3,}|-{3,})/m,
        MARKDOWN_LIST: /^(\*|\+|\-|\d+\.)\s+\S+/m,
        MARKDOWN_LINK_IMAGE: /!?\[.*?\]\(.*?\)/m,
    };

    function simplifiedDetectCodeType(code) {
        const trimmedCode = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
        if (!trimmedCode) return "none";

        const firstK = trimmedCode.substring(0, 2000);

        if (uploadedFilenameBase) {
            const ext = uploadedFilenameBase.substring(uploadedFilenameBase.lastIndexOf(".") + 1).toLowerCase();
            if (ext === "json") { try { JSON.parse(trimmedCode); return "json"; } catch (e) {/* fall-through */ } }
            if (ext === "svg" && DETECT_REGEX.SVG.test(firstK)) return "svg";
            if (ext === "html" && DETECT_REGEX.HTML.test(firstK)) return "html";
            if (ext === "xml" && DETECT_REGEX.XML.test(firstK)) return "xml";
            if (ext === "css" && (DETECT_REGEX.CSS_RULE.test(trimmedCode) || DETECT_REGEX.CSS_AT_RULE.test(firstK) || DETECT_REGEX.CSS_VAR.test(firstK))) return "css";
            if (ext === "js" && (DETECT_REGEX.JS_KEYWORD.test(firstK) || DETECT_REGEX.JS_OPERATOR.test(trimmedCode))) return "js";
            if ((ext === "yaml" || ext === "yml") && (DETECT_REGEX.YAML_START.test(firstK) || DETECT_REGEX.YAML_KEY_VALUE.test(firstK) || DETECT_REGEX.YAML_LIST_ITEM.test(firstK))) return "yaml";
            if (ext === "toml" && (DETECT_REGEX.TOML_TABLE.test(firstK) || DETECT_REGEX.TOML_KEY_VALUE.test(firstK))) return "toml";
            if ((ext === "md" || ext === "markdown") && (DETECT_REGEX.MARKDOWN_HEADER.test(firstK) || DETECT_REGEX.MARKDOWN_LIST.test(firstK) || DETECT_REGEX.MARKDOWN_LINK_IMAGE.test(firstK))) return "md";
        }

        if (DETECT_REGEX.SVG.test(firstK) && /<\/svg\s*>$/i.test(trimmedCode)) return "svg";
        if (DETECT_REGEX.HTML.test(firstK)) return "html";
        if (DETECT_REGEX.CSS_RULE.test(trimmedCode) || DETECT_REGEX.CSS_AT_RULE.test(firstK) || DETECT_REGEX.CSS_VAR.test(firstK)) return "css";

        if (DETECT_REGEX.YAML_START.test(firstK) || (DETECT_REGEX.YAML_KEY_VALUE.test(firstK) && DETECT_REGEX.YAML_LIST_ITEM.test(firstK))) return "yaml";
        if (DETECT_REGEX.YAML_KEY_VALUE.test(trimmedCode) && trimmedCode.split('\n').length > 2) return "yaml";

        if (DETECT_REGEX.TOML_TABLE.test(firstK) || DETECT_REGEX.TOML_KEY_VALUE.test(firstK)) return "toml";

        if (DETECT_REGEX.XML.test(firstK) && !DETECT_REGEX.HTML.test(firstK)) return "xml";

        try {
            JSON.parse(trimmedCode);
            if (trimmedCode.length > 2 && (trimmedCode.startsWith("{") || trimmedCode.startsWith("[")) &&
                !DETECT_REGEX.JS_KEYWORD.test(firstK.substring(0, 200)) &&
                !(DETECT_REGEX.CSS_RULE.test(trimmedCode.substring(0, 200)) && trimmedCode.includes("{") && trimmedCode.includes("}"))
            ) return "json";
        } catch (e) {/* not JSON */ }

        if (DETECT_REGEX.JS_KEYWORD.test(firstK) || DETECT_REGEX.JS_OPERATOR.test(trimmedCode)) return "js";

        if (DETECT_REGEX.MARKDOWN_HEADER.test(firstK) || DETECT_REGEX.MARKDOWN_LIST.test(firstK) || DETECT_REGEX.MARKDOWN_LINK_IMAGE.test(firstK)) return "md";

        return "none";
    }

    function extractLine1Comments(code, type) {
        let header = "", body = code;
        let commentPattern;

        if (type === "yaml" || type === "toml") {
            commentPattern = /^\s*(#(?!!)[^\r\n]*)/; // Only # comments, not starting with #!
        } else if (type === "md") {
            const fmMatch = code.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
            if (fmMatch) {
                header = fmMatch[0];
                body = code.substring(fmMatch[0].length);
                return { header, body };
            }
            commentPattern = /^\s*(<!--![\s\S]*?-->|<!--[\s\S]*?-->)/; // HTML comments for MD
        }
        else {
            commentPattern = /^\s*(\/\*![\s\S]*?\*\/|\/\/[!][^\r\n]*|\<!--![\s\S]*?--\>|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|\<!--[\s\S]*?--\>)/;
        }

        const match = code.match(commentPattern);
        if (match && match[0].indexOf(match[1]) === match[0].trimStart().indexOf(match[1])) { // Ensure comment starts on the first non-whitespace part of the line
            header = match[0];
            body = code.substring(match[0].length);
        }
        return { header: header, body: body };
    }

    function getMinifyLevel() {
        const r = document.querySelector('input[name="minify-level"]:checked');
        return r ? parseInt(r.value) : 4;
    }
    function applyLevel1(b) { return !b ? "" : b.split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n"); }
    function applyLevel2(b) { return !b ? "" : b.split("\n").filter((l) => l.trim().length > 0).join("\n"); }

    function removeCommentsFromText(text, type) {
        if (!text) return "";
        if (type === "js") return text.replace(/\/\*(?![\!])[\s\S]*?\*\/|(?<!http:|https:)\/\/(?![\!]).*/g, "");
        if (type === "css") return text.replace(/\/\*(?![\!])[\s\S]*?\*\/|(?<!http:|https:)\/\/(?![\!]).*/g, "");
        if (type === "html" || type === "xml" || type === "svg") return text.replace(/<!--(?![\!])[\s\S]*?-->/g, "");
        if (type === "yaml" || type === "toml") return text.replace(/#(?![\!]).*$/gm, "").replace(/^\s*[\r\n]/gm, '');
        if (type === "md") {
            let processed = text.replace(/<!--(?![\!])[\s\S]*?-->/g, "");
            if (getMinifyLevel() >= 3) processed = processed.replace(/\n{3,}/g, '\n\n');
            return processed;
        }
        return text;
    }

    function applyBasicMinification(body, level, type) {
        let pb = body;

        if (level >= 1) {
            pb = applyLevel1(pb);
        }

        if (level >= 2) {
            pb = applyLevel2(pb);
        }

        if (level >= 3 && pb.trim()) {
            pb = removeCommentsFromText(pb, type);
            pb = applyLevel2(pb);

            if (pb.trim() && type !== 'yaml' && type !== 'md') {
                pb = pb.split('\n').map(line => line.replace(/^\s+/, '')).join('\n');
            }
        }

        return pb;
    }

    function applyJSFallbackMinification(originalBody, level) {
        let body = applyBasicMinification(originalBody, level, "js");
        if (level === 4 && body.trim()) {
            body = body.replace(/\n/g, " ").replace(/\s\s+/g, " ");
        }
        return body;
    }

    function applyCSSFallbackMinification(originalBody, level) {
        let body = applyBasicMinification(originalBody, level, "css");
        if (level === 4 && body.trim()) {
            body = body.replace(/\s*([{};:,])\s*/g, "$1").replace(/;\s*}/g, "}").replace(/\s\s+/g, " ");
        }
        return body;
    }
    function applyHTMLFallbackMinification(originalBody, level) {
        let body = applyBasicMinification(originalBody, level, "html");
        if (level === 4 && body.trim()) {
            body = body.replace(/\n\s*/g, " ").replace(/>\s+</g, "><").replace(/\s\s+/g, " ").trim();
        }
        return body;
    }

    function formatOutput(h, pb) {
        const th = h.trimEnd(), tb = pb.trim();
        if (!th && !tb) return "";
        if (!th) return tb;
        if (!tb) return th;
        return `${th}\n${tb}`;
    }

    async function minifyJS(code, level) {
        let { header, body: originalBody } = extractLine1Comments(code, "js");
        let processedBody = originalBody;
        const hasContent = originalBody && typeof originalBody.trim === "function" && originalBody.trim();

        if (!hasContent) {
            return formatOutput(header, "");
        }

        const trimmedBodyForCheck = originalBody.trim();
        const looksLikeJsOrJson =
            trimmedBodyForCheck.startsWith("{") ||
            trimmedBodyForCheck.startsWith("[") ||
            DETECT_REGEX.JS_KEYWORD.test(trimmedBodyForCheck.substring(0, 500)) ||
            DETECT_REGEX.JS_OPERATOR.test(trimmedBodyForCheck);

        if (level === 1 || level === 2) {
            processedBody = applyBasicMinification(originalBody, level, "js");
        }
        else if (level >= 3) {
            if (looksLikeJsOrJson && typeof window.Terser === "object" && typeof window.Terser.minify === "function") {
                try {
                    const terserOptions = {
                        ecma: 2020, sourceMap: false,
                        format: { beautify: false, semicolons: true, comments: false }, // Comments are removed at level 3+
                        compress: {
                            dead_code: true, conditionals: true, booleans: true, loops: true, unused: true,
                            if_return: true, join_vars: true, sequences: level === 4, passes: level === 4 ? 2 : 1,
                            drop_console: level === 4
                        },
                        mangle: level === 4
                    };
                    const result = await window.Terser.minify({ "input.js": originalBody }, terserOptions);
                    if (result.error) {
                        showTemporaryStatusMessage(`Terser Error: ${result.error.message}`, true);
                        processedBody = applyJSFallbackMinification(originalBody, level);
                    } else {
                        processedBody = result.code;
                    }
                } catch (e) {
                    showTemporaryStatusMessage(`Terser Exception: ${e.message}`, true);
                    processedBody = applyJSFallbackMinification(originalBody, level);
                }
            } else {
                if (!looksLikeJsOrJson && (effectiveType === "js" || effectiveType === "json")) {
                    showTemporaryStatusMessage(`Content (type ${effectiveType.toUpperCase()}) doesn't look like JS/JSON. Using fallback.`, false);
                } else if (typeof window.Terser !== "object" || typeof window.Terser.minify !== "function") {
                    let terserStatusMessage = "Terser library unavailable";
                    if (window.Terser && typeof window.Terser.minify !== 'function') {
                        terserStatusMessage = "Terser library loaded, but minify function is missing.";
                    }
                    showTemporaryStatusMessage(terserStatusMessage + ". Using fallback minification.", false);
                }
                processedBody = applyJSFallbackMinification(originalBody, level);
            }
        }

        if (typeof processedBody !== "string") {
            processedBody = originalBody;
        }
        return formatOutput(header, processedBody.trim());
    }

    function minifyCSS(code, level) {
        let { header, body: originalBody } = extractLine1Comments(code, "css");
        let processedBody = originalBody;
        const hasContent = originalBody && typeof originalBody.trim === "function" && originalBody.trim();

        if (!hasContent && level > 1) {
            return formatOutput(header, "");
        }

        if (level === 1) processedBody = applyLevel1(processedBody);
        else if (level === 2) processedBody = applyBasicMinification(originalBody, 2, "css");
        else if (level >= 3) {
            if (hasContent && typeof window.csso === "object" && typeof window.csso.minify === "function") {
                try {
                    const cssoOptions = {
                        comments: false,
                        restructure: level === 4,
                        forceMediaMerge: level === 4
                    };
                    const result = window.csso.minify(originalBody, cssoOptions);
                    if (result && typeof result.css === "string") processedBody = result.css;
                    else {
                        showTemporaryStatusMessage("CSSO Error: Invalid result. Using fallback.", true);
                        processedBody = applyCSSFallbackMinification(originalBody, level);
                    }
                } catch (e) {
                    showTemporaryStatusMessage(`CSSO Exception: ${e.message}. Using fallback.`, true);
                    processedBody = applyCSSFallbackMinification(originalBody, level);
                }
            } else if (hasContent) {
                let cssoStatusMessage = "CSSO library unavailable";
                if (window.csso && typeof window.csso.minify !== 'function') {
                    cssoStatusMessage = "CSSO library loaded, but minify function is missing.";
                }
                showTemporaryStatusMessage(cssoStatusMessage + ". Using fallback minification.", false);
                processedBody = applyCSSFallbackMinification(originalBody, level);
            } else {
                processedBody = applyCSSFallbackMinification(originalBody, level);
            }
        }
        if (typeof processedBody !== "string") processedBody = originalBody;
        return formatOutput(header, processedBody.trim());
    }

    async function minifyHTML(code, level) {
        let { header, body: originalBody } = extractLine1Comments(code, "html");
        let processedBody = originalBody;
        const hasContent = originalBody && typeof originalBody.trim === "function" && originalBody.trim();

        if (!hasContent) {
            return formatOutput(header, "");
        }

        // Levels 1 & 2: Use our simple, manual minification which respects indentation.
        if (level === 1 || level === 2) {
            processedBody = applyBasicMinification(originalBody, level, "html");
        }
        // Levels 3 & 4: Use the powerful HTMLMinifier library for aggressive optimization.
        else if (level >= 3) {
            if (hasContent && typeof window.HTMLMinifier === "object" && typeof window.HTMLMinifier.minify === "function") {
                try {
                    const htmlMinifierOptions = {
                        html5: true, decodeEntities: true,
                        removeComments: true, // Level 3+
                        collapseWhitespace: true, // Level 3+
                        collapseInlineTagWhitespace: true, // Level 3+
                        removeRedundantAttributes: level === 4,
                        removeScriptTypeAttributes: true, // Level 3+
                        removeStyleLinkTypeAttributes: true, // Level 3+
                        removeOptionalTags: level === 4,
                        collapseBooleanAttributes: level === 4,
                        removeAttributeQuotes: level === 4,
                        removeEmptyAttributes: true, // Level 3+
                        minifyJS: level === 3 ? (text) => applyBasicMinification(text, 3, 'js') : (level === 4 ? true : false),
                        minifyCSS: level === 3 ? (text) => applyBasicMinification(text, 3, 'css') : (level === 4 ? true : false),
                        sortAttributes: level === 4,
                        sortClassName: level === 4
                    };
                    const result = await window.HTMLMinifier.minify(originalBody, htmlMinifierOptions);
                    if (typeof result === "string") processedBody = result;
                    else {
                        showTemporaryStatusMessage("HTMLMinifier Error: Invalid result. Using fallback.", true);
                        processedBody = applyHTMLFallbackMinification(originalBody, level);
                    }
                } catch (e) {
                    showTemporaryStatusMessage(`HTMLMinifier Exception: ${e.message}. Using fallback.`, true);
                    processedBody = applyHTMLFallbackMinification(originalBody, level);
                }
            } else if (hasContent) {
                let htmlMinifierStatusMessage = "HTMLMinifier library unavailable";
                if (window.HTMLMinifier && typeof window.HTMLMinifier.minify !== 'function') {
                    htmlMinifierStatusMessage = "HTMLMinifier library loaded, but minify function is missing.";
                }
                showTemporaryStatusMessage(htmlMinifierStatusMessage + ". Using fallback minification.", false);
                processedBody = applyHTMLFallbackMinification(originalBody, level);
            } else {
                processedBody = applyHTMLFallbackMinification(originalBody, level);
            }
        }
        if (typeof processedBody !== "string") processedBody = originalBody;
        return formatOutput(header, processedBody.trim());
    }

    function debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function getHighlightJsLanguage(typeForHighlight) {
        switch (typeForHighlight) {
            case "js": return "javascript";
            case "json": return "json";
            case "html": return "xml";
            case "svg": return "xml";
            case "xml": return "xml";
            case "css": return "css";
            case "yaml": return "yaml";
            case "toml": return "ini";
            case "md": return "markdown";
            default: return "plaintext";
        }
    }

    function updateHighlight(sourceText, highlightCodeElement, langToHighlight, highlightPreElement) {
        if (!highlightCodeElement || !window.hljs || !highlightPreElement) return;
        const mappedLang = getHighlightJsLanguage(langToHighlight);

        highlightPreElement.classList.toggle(UI_CONSTANTS.WORD_WRAP_ENABLED_CLASS, isWordWrapEnabled);
        highlightPreElement.classList.toggle(UI_CONSTANTS.WORD_WRAP_DISABLED_CLASS, !isWordWrapEnabled);

        if (sourceText.trim() === "" || mappedLang === "plaintext" || !window.hljs.getLanguage(mappedLang)) {
            highlightCodeElement.textContent = sourceText;
            highlightCodeElement.className = 'hljs';
        } else {
            try {
                const highlighted = window.hljs.highlight(sourceText, { language: mappedLang, ignoreIllegals: true });
                highlightCodeElement.innerHTML = highlighted.value;
                highlightCodeElement.className = `hljs language-${mappedLang}`;
            } catch (e) {
                highlightCodeElement.textContent = sourceText;
                highlightCodeElement.className = 'hljs';
            }
        }
    }
    const debouncedUpdateInputHighlight = debounce(() => {
        if (inputArea && inputHighlightCode && inputHighlightArea) {
            updateHighlight(inputArea.value, inputHighlightCode, effectiveType, inputHighlightArea);
        }
    }, UI_CONSTANTS.HIGHLIGHT_DEBOUNCE_DELAY_MS);

    function handleEmptyInput() {
        autoDetectedType = "none";
        effectiveType = "none";

        if (outputArea) outputArea.value = "";
        updateCounts(inputArea, inputLineCountEl, inputCharCountEl, inputLineGutter, inputHighlightArea);
        updateCounts(outputArea, outputLineCountEl, outputCharCountEl, outputLineGutter, outputHighlightArea);

        if (inputHighlightCode && inputHighlightArea) updateHighlight("", inputHighlightCode, "none", inputHighlightArea);
        if (outputHighlightCode && outputHighlightArea) updateHighlight("", outputHighlightCode, "none", outputHighlightArea);

        updateTypeDisplayOutput();
        updateAllUIStates();
    }

    async function minifyCode() {
        if (!inputArea) return;
        const currentCode = inputArea.value;

        if (currentCode.trim() === "") {
            handleEmptyInput();
            return;
        }

        updateCounts(inputArea, inputLineCountEl, inputCharCountEl, inputLineGutter, inputHighlightArea);

        autoDetectedType = simplifiedDetectCodeType(currentCode);

        if (manualTypeSelector && manualTypeSelector.value !== "auto") {
            effectiveType = manualTypeSelector.value;
            isManualTypeOverrideActive = true;
        } else {
            effectiveType = autoDetectedType;
            isManualTypeOverrideActive = false;
        }

        if ((effectiveType === "js" || effectiveType === "json") && uploadedFilenameBase && !isManualTypeOverrideActive) {
            const ext = uploadedFilenameBase.substring(uploadedFilenameBase.lastIndexOf(".") + 1).toLowerCase();
            if (["css", "html", "svg", "xml", "yaml", "yml", "toml", "md"].includes(ext)) {
                const contentForCheck = currentCode.trim();
                const stronglyLooksLikeJsOrJson =
                    contentForCheck.startsWith("{") || contentForCheck.startsWith("[") ||
                    DETECT_REGEX.JS_KEYWORD.test(contentForCheck.substring(0, 500)) ||
                    DETECT_REGEX.JS_OPERATOR.test(contentForCheck);

                if (!stronglyLooksLikeJsOrJson) {
                    effectiveType = UI_CONSTANTS.TYPE_OPTIONS.includes(ext) ? ext : "none";
                    if (ext === "yml") effectiveType = "yaml";
                    if (ext === "markdown") effectiveType = "md";
                    autoDetectedType = effectiveType;
                }
            }
        }

        updateTypeDisplayOutput();

        const level = getMinifyLevel();
        let minifiedCode = "";

        // Extract header and body here for use in generic cases and catch block
        let { header, body: initialBody } = extractLine1Comments(currentCode, effectiveType);

        try {
            if (effectiveType === "js" || effectiveType === "json") {
                minifiedCode = await minifyJS(currentCode, level);
            } else if (effectiveType === "css") {
                minifiedCode = minifyCSS(currentCode, level);
            } else if (effectiveType === "html" || effectiveType === "svg" || effectiveType === "xml") {
                minifiedCode = await minifyHTML(currentCode, level);
            } else if (effectiveType === "yaml" || effectiveType === "toml" || effectiveType === "md" || effectiveType === "none") {
                let processedBodyPart = applyBasicMinification(initialBody, level, effectiveType);
                minifiedCode = formatOutput(header, processedBodyPart.trim());
            } else {
                let processedBodyPart = applyBasicMinification(initialBody, level, "none");
                minifiedCode = formatOutput(header, processedBodyPart.trim());
            }
        } catch (error) {
            showTemporaryStatusMessage(`Error during ${effectiveType.toUpperCase()} minification. See console.`, true);
            let processedBodyPart = applyBasicMinification(initialBody, 1, "none");
            minifiedCode = formatOutput(header, processedBodyPart.trim());
        }

        if (outputArea) outputArea.value = minifiedCode;
        updateCounts(outputArea, outputLineCountEl, outputCharCountEl, outputLineGutter, outputHighlightArea);
        if (outputArea && outputHighlightCode && outputHighlightArea) {
            updateHighlight(outputArea.value, outputHighlightCode, effectiveType, outputHighlightArea);
        }
        updateAllUIStates();
    }

    const debouncedMinifyAndUpdateCounts = debounce(async () => {
        await minifyCode();
        debouncedUpdateInputHighlight();
    }, UI_CONSTANTS.DEBOUNCE_DELAY_MS);

    function applyWordWrapState() {
        const enableClass = UI_CONSTANTS.WORD_WRAP_ENABLED_CLASS;
        const disableClass = UI_CONSTANTS.WORD_WRAP_DISABLED_CLASS;

        [inputArea, outputArea].forEach((ta) => {
            if (!ta) return;
            ta.classList.toggle(enableClass, isWordWrapEnabled);
            ta.classList.toggle(disableClass, !isWordWrapEnabled);
            ta.wrap = isWordWrapEnabled ? "soft" : "off";
        });
        [inputHighlightArea, outputHighlightArea].forEach((pre) => {
            if (!pre) return;
            pre.classList.toggle(enableClass, isWordWrapEnabled);
            pre.classList.toggle(disableClass, !isWordWrapEnabled);
        });
        if (toggleWordWrapButton) {
            toggleWordWrapButton.classList.toggle(UI_CONSTANTS.ACTIVE_CLASS, isWordWrapEnabled);
            toggleWordWrapButton.title = isWordWrapEnabled ? "Disable Word Wrap" : "Enable Word Wrap";
        }
    }

    function toggleWordWrap() {
        isWordWrapEnabled = !isWordWrapEnabled;
        localStorage.setItem(UI_CONSTANTS.LOCAL_STORAGE_WORD_WRAP_KEY, String(isWordWrapEnabled));
        applyWordWrapState();

        updateGutterContent(inputArea, inputLineGutter, inputHighlightArea);
        updateGutterContent(outputArea, outputLineGutter, outputHighlightArea);
        if (inputArea && inputHighlightCode) updateHighlight(inputArea.value, inputHighlightCode, effectiveType, inputHighlightArea);
        if (outputArea && outputHighlightCode) updateHighlight(outputArea.value, outputHighlightCode, effectiveType, outputHighlightArea);
    }

    function initializeWordWrap() {
        isWordWrapEnabled = localStorage.getItem(UI_CONSTANTS.LOCAL_STORAGE_WORD_WRAP_KEY) === "true";
        applyWordWrapState();
    }

    function getTimestampSuffix() {
        const n = new Date();
        return `${String(n.getFullYear()).slice(-2)}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}${String(n.getHours()).padStart(2, "0")}${String(n.getMinutes()).padStart(2, "0")}`;
    }

    function extractFilenameFromHeaderComment(textInput) {
        if (!textInput) return null;
        const { header: h } = extractLine1Comments(textInput, "none");
        if (!h || !h.trim()) return null;

        const firstLineOfHeader = h.split("\n")[0].trim();
        const extendedExtensions = UI_CONSTANTS.ACCEPTED_FILE_EXTENSIONS.filter(ext => ext !== 'yml' && ext !== 'markdown').join('|');
        const patterns = [
            new RegExp(`^\\/\\*+\\s*!?\\s*([a-zA-Z0-9._-]+?(\\.(${extendedExtensions}|yml|markdown))\\b)`, "i"),
            new RegExp(`^\\/\\/+\\s*!?\\s*([a-zA-Z0-9._-]+?(\\.(${extendedExtensions}|yml|markdown))\\b)`, "i"),
            new RegExp(`^<!--\\s*!?\\s*([a-zA-Z0-9._-]+?(\\.(${extendedExtensions}|yml|markdown))\\b)`, "i"),
            new RegExp(`^#\\s*!?\\s*([a-zA-Z0-9._-]+?(\\.(${extendedExtensions}|yml|markdown))\\b)`, "i")
        ];
        for (const pattern of patterns) {
            const match = firstLineOfHeader.match(pattern);
            if (match && match[1] && match[2] && match[1].toLowerCase().endsWith(match[2].toLowerCase())) {
                return match[1].substring(0, match[1].length - (match[2].length + 1));
            }
        }
        return null;
    }

    if (inputArea) {
        const handleManualInputChange = async (isImmediate = false) => {
            uploadedFilenameBase = null;

            if (manualTypeSelector && manualTypeSelector.value !== "auto") {
                manualTypeSelector.value = "auto";
                isManualTypeOverrideActive = false;
                localStorage.setItem(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY, "auto");
            }

            if (isImmediate) {
                await minifyCode();
                debouncedUpdateInputHighlight();
            } else {
                debouncedMinifyAndUpdateCounts();
            }
        };

        inputArea.addEventListener("input", () => {
            handleManualInputChange(false);
        });

        inputArea.addEventListener("focus", updateCustomPlaceholderVisibility);
        inputArea.addEventListener("blur", updateCustomPlaceholderVisibility);

        inputArea.addEventListener("paste", () => {
            setTimeout(() => handleManualInputChange(true), 0);
        });

        inputArea.addEventListener("scroll", () => syncScroll(inputArea, inputLineGutter, inputHighlightArea));
    }

    if (outputArea) outputArea.addEventListener("scroll", () => syncScroll(outputArea, outputLineGutter, outputHighlightArea));

    if (minifyLevelSelectorWrapper) {
        minifyLevelSelectorWrapper.querySelectorAll('input[type="radio"]').forEach((r) => {
            r.addEventListener("change", async () => {
                await minifyCode();
                debouncedUpdateInputHighlight();
            });
        });
    }

    if (manualTypeSelector) {
        UI_CONSTANTS.TYPE_OPTIONS.forEach(typeOpt => {
            const option = document.createElement("option");
            option.value = typeOpt;
            let displayName = typeOpt === "auto" ? "Auto-Detect" : typeOpt.toUpperCase();
            if (typeOpt === "none") displayName = "Plain Text";
            if (typeOpt === "md") displayName = "Markdown";
            option.textContent = displayName;
            manualTypeSelector.appendChild(option);
        });
        const savedManualType = localStorage.getItem(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY);
        if (savedManualType && UI_CONSTANTS.TYPE_OPTIONS.includes(savedManualType)) {
            manualTypeSelector.value = savedManualType;
        }

        manualTypeSelector.addEventListener("change", async (event) => {
            const selectedType = event.target.value;
            localStorage.setItem(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY, selectedType);
            isManualTypeOverrideActive = selectedType !== "auto";

            await minifyCode();
            if (inputArea && inputHighlightCode && inputHighlightArea) {
                updateHighlight(inputArea.value, inputHighlightCode, effectiveType, inputHighlightArea);
            }
        });
    }

    if (copyButton && copyIconContainer && originalCopyIconPath) {
        copyButton.addEventListener("click", () => {
            if (copyButton.disabled || !outputArea || !outputArea.value.trim()) return;
            navigator.clipboard.writeText(outputArea.value).then(() => {
                copyIconContainer.innerHTML = CHECKMARK_ICON_PATH; copyButton.title = "Copied!";
                setTimeout(() => { copyIconContainer.innerHTML = originalCopyIconPath; copyButton.title = "Copy to Clipboard"; }, UI_CONSTANTS.FEEDBACK_MESSAGE_TIMEOUT_MS);
            }).catch((e) => {
                copyButton.title = "Copy failed!";
                showTemporaryStatusMessage("Failed to copy. See console for details.", true);
                setTimeout(() => { copyButton.title = "Copy to Clipboard"; }, UI_CONSTANTS.FEEDBACK_MESSAGE_TIMEOUT_MS);
            });
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener("click", () => {
            if (downloadButton.disabled || !outputArea || !outputArea.value) return;
            const contentToDownload = outputArea.value;
            const timestamp = getTimestampSuffix();
            let baseFilenameForDownload = "GoatMinify";
            let fileExtension = "txt";
            let mimeType = "text/plain";

            switch (effectiveType) {
                case "js": fileExtension = "js"; mimeType = "text/javascript"; break;
                case "json": fileExtension = "json"; mimeType = "application/json"; break;
                case "css": fileExtension = "css"; mimeType = "text/css"; break;
                case "html": fileExtension = "html"; mimeType = "text/html"; break;
                case "svg": fileExtension = "svg"; mimeType = "image/svg+xml"; break;
                case "xml": fileExtension = "xml"; mimeType = "application/xml"; break;
                case "yaml": fileExtension = "yaml"; mimeType = "application/x-yaml"; break;
                case "toml": fileExtension = "toml"; mimeType = "application/toml"; break;
                case "md": fileExtension = "md"; mimeType = "text/markdown"; break;
            }

            const filenameFromComment = extractFilenameFromHeaderComment(inputArea.value);
            if (filenameFromComment) {
                baseFilenameForDownload = filenameFromComment;
            } else if (uploadedFilenameBase) {
                baseFilenameForDownload = uploadedFilenameBase.substring(0, uploadedFilenameBase.lastIndexOf(".") > 0 ? uploadedFilenameBase.lastIndexOf(".") : uploadedFilenameBase.length);
            }

            const sanitizedBase = baseFilenameForDownload.replace(/[^\w.-]/g, "_").replace(/_{2,}/g, "_");
            const finalFilename = `${sanitizedBase}-min-${timestamp}.${fileExtension}`;

            const blob = new Blob([contentToDownload], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = finalFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            downloadButton.title = "Downloaded!";
            setTimeout(() => { downloadButton.title = "Download Minified File"; }, UI_CONSTANTS.FEEDBACK_MESSAGE_TIMEOUT_MS);
        });
    }

    if (clearInputButton) {
        clearInputButton.addEventListener("click", () => {
            if (clearInputButton.disabled || !inputArea) return;
            inputArea.value = "";
            uploadedFilenameBase = null;

            handleEmptyInput();

            const defaultLevelRadio = document.getElementById(UI_CONSTANTS.DEFAULT_MINIFY_LEVEL_ID);
            if (defaultLevelRadio) defaultLevelRadio.checked = true;

            inputArea.focus();
        });
    }

    if (uploadFileButton && fileInputHidden) {
        uploadFileButton.addEventListener("click", () => fileInputHidden.click());

        fileInputHidden.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                const originalFilename = file.name;
                uploadedFilenameBase = originalFilename;

                const fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();

                if (!UI_CONSTANTS.ACCEPTED_FILE_EXTENSIONS.includes(fileExtension) &&
                    file.type && !file.type.startsWith("text/") && !file.type.includes("xml") && !file.type.includes("json") && !file.type.includes("yaml") && !file.type.includes("toml") && !file.type.includes("markdown")) {
                    if (!confirm(`File type "${fileExtension}" (${file.type}) might not be text-based or suitable for minification. Continue?`)) {
                        e.target.value = null;
                        uploadedFilenameBase = null;
                        return;
                    }
                }

                reader.onload = async (evt) => {
                    const fileContent = evt.target.result;
                    if (inputArea) inputArea.value = fileContent;

                    if (manualTypeSelector) {
                        manualTypeSelector.value = "auto";
                    }
                    isManualTypeOverrideActive = false;
                    localStorage.setItem(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY, "auto");

                    await minifyCode();
                    if (inputArea && inputHighlightCode && inputHighlightArea) {
                        updateHighlight(inputArea.value, inputHighlightCode, effectiveType, inputHighlightArea);
                    }
                };

                reader.onerror = (evt) => {
                    showTemporaryStatusMessage("Error reading file. See console for details.", true);
                    uploadedFilenameBase = null;
                };
                reader.readAsText(file);
            }
            e.target.value = null;
        });
    }

    if (toggleWordWrapButton) toggleWordWrapButton.addEventListener("click", toggleWordWrap);

    const debouncedResizeGutterUpdate = debounce(() => {
        if (isWordWrapEnabled) {
            updateGutterContent(inputArea, inputLineGutter, inputHighlightArea);
            updateGutterContent(outputArea, outputLineGutter, outputHighlightArea);
            if (inputArea && inputHighlightCode) updateHighlight(inputArea.value, inputHighlightCode, effectiveType, inputHighlightArea);
            if (outputArea && outputHighlightCode) updateHighlight(outputArea.value, outputHighlightCode, effectiveType, outputHighlightArea);
        }
    }, 250);
    window.addEventListener("resize", debouncedResizeGutterUpdate);

    initializeWordWrap();

    let initialEffectiveTypeOnLoad = "none";
    let initialAutoDetectedTypeOnLoad = "none";
    let initialManualOverrideActiveOnLoad = false;

    if (manualTypeSelector) {
        const savedManualType = localStorage.getItem(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY);
        if (savedManualType && UI_CONSTANTS.TYPE_OPTIONS.includes(savedManualType)) {
            manualTypeSelector.value = savedManualType;
            if (savedManualType !== "auto") {
                initialManualOverrideActiveOnLoad = true;
                initialEffectiveTypeOnLoad = savedManualType;
            }
        }
    }

    if (inputArea && inputArea.value.trim() !== "") {
        const currentInputContent = inputArea.value;
        initialAutoDetectedTypeOnLoad = simplifiedDetectCodeType(currentInputContent);
        if (!initialManualOverrideActiveOnLoad) {
            initialEffectiveTypeOnLoad = initialAutoDetectedTypeOnLoad;
        }
    }

    effectiveType = initialEffectiveTypeOnLoad;
    autoDetectedType = initialAutoDetectedTypeOnLoad;
    isManualTypeOverrideActive = initialManualOverrideActiveOnLoad;

    updateTypeDisplayOutput();

    setTimeout(async () => {
        try {
            await minifyCode();
        } catch (error) {
            showTemporaryStatusMessage("Error during initial page load processing.", true);
        } finally {
            if (inputArea && inputHighlightCode && inputHighlightArea) {
                updateHighlight(inputArea.value, inputHighlightCode, effectiveType, inputHighlightArea);
            }
            updateCustomPlaceholderVisibility();
            updateAllUIStates();
        }
    }, 0);
});