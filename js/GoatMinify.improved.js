/** Goat Minify - Improved Version
 * @file GoatMinify.improved.js
 * @description Enhanced client-side minifier with security and performance improvements
 * @license MIT
 * @author Chase McGoat
 * @version 2.0.0
 */

import { UI_CONSTANTS, DETECT_REGEX, ICONS } from './modules/constants.js';
import { debounce, formatOutput, sanitizeFilename, getTimestampSuffix } from './modules/utils.js';
import { detectCodeType, extractLine1Comments } from './modules/detector.js';

document.addEventListener("DOMContentLoaded", () => {
    // =======================
    // DOM Element References
    // =======================
    const DOM = {
        inputArea: document.getElementById("input-area"),
        outputArea: document.getElementById("output-area"),
        inputHighlightArea: document.getElementById("input-highlight-area"),
        outputHighlightArea: document.getElementById("output-highlight-area"),
        minifyLevelSelector: document.getElementById("minify-level-selector"),
        copyButton: document.getElementById("copy-button"),
        downloadButton: document.getElementById("download-button"),
        clearInputButton: document.getElementById("clear-input-button"),
        uploadFileButton: document.getElementById("upload-file-button"),
        typeDisplayOutput: document.getElementById("type-display-output"),
        manualTypeSelector: document.getElementById("manual-type-selector"),
        copyIconContainer: document.getElementById("copy-icon-svg-path-container"),
        inputLineCount: document.getElementById("input-line-count"),
        inputCharCount: document.getElementById("input-char-count"),
        outputLineCount: document.getElementById("output-line-count"),
        outputCharCount: document.getElementById("output-char-count"),
        fileInputHidden: document.getElementById("file-input-hidden"),
        customPlaceholder: document.getElementById("custom-placeholder"),
        toggleWordWrapButton: document.getElementById("toggle-word-wrap-button"),
        inputLineGutter: document.getElementById("input-line-gutter"),
        outputLineGutter: document.getElementById("output-line-gutter"),
    };

    // Cache highlight code elements
    DOM.inputHighlightCode = DOM.inputHighlightArea?.querySelector('code');
    DOM.outputHighlightCode = DOM.outputHighlightArea?.querySelector('code');

    // Store original copy icon
    const originalCopyIconPath = DOM.copyIconContainer?.innerHTML || "";

    // =======================
    // State Management
    // =======================
    const state = {
        autoDetectedType: "none",
        effectiveType: "none",
        isManualTypeOverrideActive: false,
        isWordWrapEnabled: false,
        uploadedFilenameBase: null,
        measurementHelperDiv: null,
        statusMessageTimer: null,
    };

    // =======================
    // Safe localStorage Operations
    // =======================
    const storage = {
        get(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                return value !== null ? value : defaultValue;
            } catch (e) {
                console.warn(`Failed to read ${key} from localStorage:`, e);
                return defaultValue;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, String(value));
                return true;
            } catch (e) {
                console.error(`Failed to save ${key} to localStorage:`, e);
                showTemporaryStatusMessage("Settings couldn't be saved (storage full?)", true);
                return false;
            }
        },
    };

    // =======================
    // Helper Functions (UI & Safe DOM)
    // =======================

    function createStyledSpan(text, styles = {}) {
        const span = document.createElement('span');
        span.textContent = text;
        Object.assign(span.style, styles);
        return span;
    }

    function showTemporaryStatusMessage(message, isError = false, duration = UI_CONSTANTS.STATUS_MESSAGE_TIMEOUT_MS) {
        if (!DOM.typeDisplayOutput) return;
        if (state.statusMessageTimer) clearTimeout(state.statusMessageTimer);

        DOM.typeDisplayOutput.textContent = '';
        const span = createStyledSpan(message, {
            color: isError ? UI_CONSTANTS.ERROR_HIGHLIGHT_COLOR : UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR,
            fontWeight: 'normal'
        });
        DOM.typeDisplayOutput.appendChild(span);

        if (isError) announceToScreenReader(`Error: ${message}`);
        else announceToScreenReader(message);

        state.statusMessageTimer = setTimeout(() => {
            updateTypeDisplayOutput();
            state.statusMessageTimer = null;
        }, duration);
    }

    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    function updateTypeDisplayOutput() {
        if (!DOM.typeDisplayOutput || state.statusMessageTimer) return;

        let displayLabel = "Detected Type";
        let typeValue = state.autoDetectedType;

        if (state.isManualTypeOverrideActive && DOM.manualTypeSelector?.value !== "auto") {
            displayLabel = "Manual Type";
            typeValue = DOM.manualTypeSelector.value;
        }

        let typeDisplayName = (typeValue && typeValue !== "none") ? typeValue.toUpperCase() : "NONE";
        if (typeValue === 'md') typeDisplayName = 'Markdown';

        DOM.typeDisplayOutput.textContent = `${displayLabel}: `;
        const valueSpan = createStyledSpan(typeDisplayName, {
            fontWeight: 'bold',
            color: UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR
        });
        valueSpan.className = 'detected-type-value';
        DOM.typeDisplayOutput.appendChild(valueSpan);
    }

    function getMinifyLevel() {
        const radio = document.querySelector('input[name="minify-level"]:checked');
        const level = radio ? parseInt(radio.value, 10) : 4;
        if (level < 1 || level > 4 || isNaN(level)) return 4;
        return level;
    }

    function getVisualLineCountForLogicalLine(logicalLineText, textarea) {
        if (!state.measurementHelperDiv) {
            state.measurementHelperDiv = document.createElement("div");
            Object.assign(state.measurementHelperDiv.style, {
                padding: "0", border: "none", visibility: "hidden",
                position: "absolute", top: "-9999px", left: "-9999px",
                boxSizing: "content-box"
            });
            document.body.appendChild(state.measurementHelperDiv);
        }
        const styles = getComputedStyle(textarea);
        Object.assign(state.measurementHelperDiv.style, {
            fontFamily: styles.fontFamily, fontSize: styles.fontSize,
            lineHeight: styles.lineHeight, whiteSpace: "pre-wrap",
            wordBreak: styles.wordBreak
        });
        const textareaPaddingLeft = parseFloat(styles.paddingLeft) || 0;
        const textareaPaddingRight = parseFloat(styles.paddingRight) || 0;
        const textareaWidth = textarea.clientWidth - textareaPaddingLeft - textareaPaddingRight;

        state.measurementHelperDiv.style.width = `${Math.max(0, textareaWidth)}px`;
        state.measurementHelperDiv.textContent = logicalLineText.length === 0 ? "\u00A0" : logicalLineText;

        const scrollHeight = state.measurementHelperDiv.scrollHeight;
        const singleLineHeight = parseFloat(styles.lineHeight) || (parseFloat(styles.fontSize) * 1.4);

        if (singleLineHeight === 0 || isNaN(singleLineHeight)) return 1;
        return Math.max(1, Math.round((scrollHeight + 0.001) / singleLineHeight));
    }

    // =======================
    // Minification Logic
    // =======================

    function applyLevel1(b) { return !b ? "" : b.split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n"); }
    function applyLevel2(b) { return !b ? "" : b.split("\n").filter((l) => l.trim().length > 0).join("\n"); }

    function removeCommentsFromText(text, type) {
        if (!text) return "";
        if (type === "js" || type === "css") return text.replace(/\/\*(?![\!])[\s\S]*?\*\/|(?<!http:|https:)\/\/(?![\!]).*/g, "");
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
        if (level >= 1) pb = applyLevel1(pb);
        if (level >= 2) pb = applyLevel2(pb);
        if (level >= 3 && pb.trim()) {
            pb = removeCommentsFromText(pb, type);
            pb = applyLevel2(pb);
            if (pb.trim() && type !== 'yaml' && type !== 'md') {
                pb = pb.split('\n').map(line => line.replace(/^\s+/, '')).join('\n');
            }
        }
        return pb;
    }

    function applyFallbackMinification(originalBody, level, type) {
        let body = applyBasicMinification(originalBody, level, type);
        if (level === 4 && body.trim()) {
            if (type === "js") body = body.replace(/\n/g, " ").replace(/\s\s+/g, " ");
            if (type === "css") body = body.replace(/\s*([{};:,])\s*/g, "$1").replace(/;\s*}/g, "}").replace(/\s\s+/g, " ");
            if (type === "html") body = body.replace(/\n\s*/g, " ").replace(/>\s+</g, "><").replace(/\s\s+/g, " ").trim();
        }
        return body;
    }

    async function minifyJS(originalBody, level) {
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
                    showTemporaryStatusMessage(`Advanced minification failed, using basic level.`, true);
                }
            }
        }
        return applyFallbackMinification(originalBody, level, "js");
    }

    function minifyCSS(originalBody, level) {
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
                showTemporaryStatusMessage(`Advanced minification failed, using basic level.`, true);
            }
        }
        return applyFallbackMinification(originalBody, level, "css");
    }

    async function minifyHTML(originalBody, level) {
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
                showTemporaryStatusMessage(`Advanced minification failed, using basic level.`, true);
            }
        }
        return applyFallbackMinification(originalBody, level, "html");
    }

    async function performMinification() {
        if (!DOM.inputArea) return;
        const currentCode = DOM.inputArea.value;

        if (currentCode.trim() === "") {
            handleEmptyInput();
            return;
        }

        // Update detection
        state.autoDetectedType = detectCodeType(currentCode, state.uploadedFilenameBase);
        
        if (DOM.manualTypeSelector?.value !== "auto") {
            state.effectiveType = DOM.manualTypeSelector.value;
            state.isManualTypeOverrideActive = true;
        } else {
            state.effectiveType = state.autoDetectedType;
            state.isManualTypeOverrideActive = false;
        }

        updateTypeDisplayOutput();
        updateCounts();

        const level = getMinifyLevel();
        let minifiedCode = "";
        let { header, body } = extractLine1Comments(currentCode, state.effectiveType);

        try {
            switch (state.effectiveType) {
                case "js":
                case "json":
                    minifiedCode = formatOutput(header, await minifyJS(body, level));
                    break;
                case "css":
                    minifiedCode = formatOutput(header, minifyCSS(body, level));
                    break;
                case "html":
                case "svg":
                case "xml":
                    minifiedCode = formatOutput(header, await minifyHTML(body, level));
                    break;
                default:
                    minifiedCode = formatOutput(header, applyBasicMinification(body, level, state.effectiveType));
                    break;
            }
        } catch (error) {
            console.error(error);
            showTemporaryStatusMessage("Minification error. Output may be incomplete.", true);
            minifiedCode = currentCode; // Safety fallback
        }

        if (DOM.outputArea) DOM.outputArea.value = minifiedCode;
        
        updateCounts();
        updateHighlights();
        updateAllUIStates();
    }

    const debouncedMinify = debounce(performMinification, UI_CONSTANTS.DEBOUNCE_DELAY_MS);

    // =======================
    // UI Updates
    // =======================

    function handleEmptyInput() {
        state.autoDetectedType = "none";
        state.effectiveType = "none";
        if (DOM.outputArea) DOM.outputArea.value = "";
        updateCounts();
        updateHighlights();
        updateTypeDisplayOutput();
        updateAllUIStates();
    }

    function updateCounts() {
        [
            { area: DOM.inputArea, line: DOM.inputLineCount, char: DOM.inputCharCount, gutter: DOM.inputLineGutter, hl: DOM.inputHighlightArea },
            { area: DOM.outputArea, line: DOM.outputLineCount, char: DOM.outputCharCount, gutter: DOM.outputLineGutter, hl: DOM.outputHighlightArea }
        ].forEach(set => {
            if (!set.area) return;
            const val = set.area.value;
            if (set.line) set.line.textContent = `Lines: ${val ? val.split('\n').length : 0}`;
            if (set.char) set.char.textContent = `Chars: ${val.length}`;
            if (set.gutter) updateGutterContent(set.area, set.gutter, set.hl);
        });
    }

    function updateGutterContent(textarea, gutterEl, highlightAreaEl) {
        if (!textarea || !gutterEl) return;
        const logicalLines = textarea.value.split("\n");
        const logicalLineCount = logicalLines.length;
        
        // Simple diff check to avoid heavy DOM ops
        const cacheKey = `${textarea.value.length}-${state.isWordWrapEnabled}`;
        if (gutterEl.dataset.cacheKey === cacheKey && gutterEl.dataset.textareaValue === textarea.value) {
             syncScroll(textarea, gutterEl, highlightAreaEl);
             return;
        }

        let newGutterTextContent = "";
        if (state.isWordWrapEnabled) {
            let linesForGutter = [];
            for (let i = 0; i < logicalLineCount; i++) {
                let lineDisplay = [(i + 1).toString()];
                const numVisualLines = getVisualLineCountForLogicalLine(logicalLines[i], textarea);
                for (let j = 1; j < numVisualLines; j++) lineDisplay.push("");
                linesForGutter.push(lineDisplay.join('\n'));
            }
            newGutterTextContent = linesForGutter.join('\n');
            if (logicalLineCount > 0 || textarea.value === "") newGutterTextContent += '\n';
        } else {
            for (let i = 0; i < logicalLineCount; i++) newGutterTextContent += `${i + 1}\n`;
        }

        if (textarea.value === "" || (logicalLineCount === 1 && logicalLines[0] === "")) {
            newGutterTextContent = "1\n";
        }

        gutterEl.textContent = newGutterTextContent;
        gutterEl.dataset.cacheKey = cacheKey;
        gutterEl.dataset.textareaValue = textarea.value;
        syncScroll(textarea, gutterEl, highlightAreaEl);
    }

    function syncScroll(source, ...targets) {
        if (!source) return;
        const { scrollTop, scrollLeft } = source;
        targets.forEach(t => {
            if (t) {
                t.scrollTop = scrollTop;
                if (t.tagName === 'PRE' || t.tagName === 'CODE') t.scrollLeft = scrollLeft;
            }
        });
    }

    function updateHighlight(sourceText, codeEl, lang, preEl) {
        if (!codeEl || !window.hljs || !preEl) return;
        
        preEl.className = `hljs-highlight-layer ${state.isWordWrapEnabled ? UI_CONSTANTS.WORD_WRAP_ENABLED_CLASS : UI_CONSTANTS.WORD_WRAP_DISABLED_CLASS}`;

        let hljsLang = 'plaintext';
        switch(lang) {
            case 'js': hljsLang = 'javascript'; break;
            case 'html': case 'xml': case 'svg': hljsLang = 'xml'; break;
            case 'css': hljsLang = 'css'; break;
            case 'json': hljsLang = 'json'; break;
            case 'yaml': hljsLang = 'yaml'; break;
            case 'toml': hljsLang = 'ini'; break;
            case 'md': hljsLang = 'markdown'; break;
        }

        if (sourceText.trim() === "") {
            codeEl.textContent = "";
            codeEl.className = 'hljs';
        } else {
            try {
                const res = window.hljs.highlight(sourceText, { language: hljsLang, ignoreIllegals: true });
                codeEl.innerHTML = res.value;
                codeEl.className = `hljs language-${hljsLang}`;
            } catch (e) {
                codeEl.textContent = sourceText;
            }
        }
    }

    const debouncedHighlight = debounce(() => {
        if (DOM.inputArea && DOM.inputHighlightCode) updateHighlight(DOM.inputArea.value, DOM.inputHighlightCode, state.effectiveType, DOM.inputHighlightArea);
    }, UI_CONSTANTS.HIGHLIGHT_DEBOUNCE_DELAY_MS);

    function updateHighlights() {
        debouncedHighlight();
        if (DOM.outputArea && DOM.outputHighlightCode) updateHighlight(DOM.outputArea.value, DOM.outputHighlightCode, state.effectiveType, DOM.outputHighlightArea);
    }

    function updateAllUIStates() {
        // Button states
        const isInputEmpty = !DOM.inputArea?.value.trim();
        const isOutputEmpty = !DOM.outputArea?.value.trim();
        
        if (DOM.clearInputButton) DOM.clearInputButton.disabled = isInputEmpty;
        if (DOM.copyButton) DOM.copyButton.disabled = isOutputEmpty;
        if (DOM.downloadButton) DOM.downloadButton.disabled = isOutputEmpty;

        // Placeholder
        if (DOM.customPlaceholder && DOM.inputArea) {
            DOM.customPlaceholder.classList.toggle(UI_CONSTANTS.HIDDEN_CLASS, !isInputEmpty || document.activeElement === DOM.inputArea);
        }

        // Empty state slider
        if (DOM.minifyLevelSelector) {
            DOM.minifyLevelSelector.classList.toggle(UI_CONSTANTS.EMPTY_STATE_CLASS, isInputEmpty && isOutputEmpty);
        }
    }

    // =======================
    // Event Listeners & Init
    // =======================

    function setupEventListeners() {
        // Input Area
        if (DOM.inputArea) {
            DOM.inputArea.addEventListener("input", () => {
                state.uploadedFilenameBase = null;
                if (DOM.manualTypeSelector && DOM.manualTypeSelector.value !== "auto" && !state.isManualTypeOverrideActive) {
                     DOM.manualTypeSelector.value = "auto";
                     storage.set(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY, "auto");
                }
                debouncedMinify();
            });
            
            DOM.inputArea.addEventListener("focus", updateAllUIStates);
            DOM.inputArea.addEventListener("blur", updateAllUIStates);
            DOM.inputArea.addEventListener("scroll", () => syncScroll(DOM.inputArea, DOM.inputLineGutter, DOM.inputHighlightArea));
        }

        // Output Area
        if (DOM.outputArea) {
            DOM.outputArea.addEventListener("scroll", () => syncScroll(DOM.outputArea, DOM.outputLineGutter, DOM.outputHighlightArea));
        }

        // Type Selector
        if (DOM.manualTypeSelector) {
            UI_CONSTANTS.TYPE_OPTIONS.forEach(opt => {
                const el = document.createElement("option");
                el.value = opt;
                el.textContent = opt === "auto" ? "Auto-Detect" : (opt === "none" ? "Plain Text" : opt.toUpperCase());
                DOM.manualTypeSelector.appendChild(el);
            });

            DOM.manualTypeSelector.addEventListener("change", (e) => {
                storage.set(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY, e.target.value);
                performMinification();
            });
        }

        // Levels
        document.querySelectorAll('input[name="minify-level"]').forEach(el => {
            el.addEventListener("change", performMinification);
        });

        // Buttons
        if (DOM.clearInputButton) {
            DOM.clearInputButton.addEventListener("click", () => {
                if (DOM.inputArea) {
                    DOM.inputArea.value = "";
                    DOM.inputArea.focus();
                }
                state.uploadedFilenameBase = null;
                handleEmptyInput();
            });
        }

        if (DOM.copyButton) {
            DOM.copyButton.addEventListener("click", async () => {
                if (!DOM.outputArea?.value) return;
                try {
                    await navigator.clipboard.writeText(DOM.outputArea.value);
                    if (DOM.copyIconContainer) DOM.copyIconContainer.innerHTML = ICONS.CHECKMARK;
                    announceToScreenReader("Copied to clipboard");
                    setTimeout(() => {
                        if (DOM.copyIconContainer) DOM.copyIconContainer.innerHTML = originalCopyIconPath;
                    }, UI_CONSTANTS.FEEDBACK_MESSAGE_TIMEOUT_MS);
                } catch (e) {
                    showTemporaryStatusMessage("Failed to copy", true);
                }
            });
        }

        if (DOM.downloadButton) {
            DOM.downloadButton.addEventListener("click", () => {
                if (!DOM.outputArea?.value) return;
                const timestamp = getTimestampSuffix();
                const ext = state.effectiveType === "none" ? "txt" : state.effectiveType;
                const base = state.uploadedFilenameBase 
                    ? state.uploadedFilenameBase.substring(0, state.uploadedFilenameBase.lastIndexOf("."))
                    : "GoatMinify";
                
                const filename = `${sanitizeFilename(base)}-min-${timestamp}.${ext}`;
                
                const blob = new Blob([DOM.outputArea.value], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                announceToScreenReader("File downloaded");
            });
        }

        if (DOM.uploadFileButton && DOM.fileInputHidden) {
            DOM.uploadFileButton.addEventListener("click", () => DOM.fileInputHidden.click());
            DOM.fileInputHidden.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Check size (10MB limit for browser perf)
                if (file.size > 10 * 1024 * 1024) {
                    if(!confirm("File is large (>10MB). Processing may freeze the browser. Continue?")) return;
                }

                const reader = new FileReader();
                reader.onload = (evt) => {
                    if (DOM.inputArea) {
                        DOM.inputArea.value = evt.target.result;
                        state.uploadedFilenameBase = file.name;
                        performMinification();
                    }
                };
                reader.readAsText(file);
                e.target.value = null;
            });
        }

        // Word Wrap
        if (DOM.toggleWordWrapButton) {
            DOM.toggleWordWrapButton.addEventListener("click", () => {
                state.isWordWrapEnabled = !state.isWordWrapEnabled;
                storage.set(UI_CONSTANTS.LOCAL_STORAGE_WORD_WRAP_KEY, state.isWordWrapEnabled);
                
                const cls = state.isWordWrapEnabled ? UI_CONSTANTS.WORD_WRAP_ENABLED_CLASS : UI_CONSTANTS.WORD_WRAP_DISABLED_CLASS;
                const antiCls = state.isWordWrapEnabled ? UI_CONSTANTS.WORD_WRAP_DISABLED_CLASS : UI_CONSTANTS.WORD_WRAP_ENABLED_CLASS;
                
                [DOM.inputArea, DOM.outputArea].forEach(el => {
                    if(el) {
                        el.classList.add(cls);
                        el.classList.remove(antiCls);
                        el.wrap = state.isWordWrapEnabled ? "soft" : "off";
                    }
                });
                
                DOM.toggleWordWrapButton.classList.toggle(UI_CONSTANTS.ACTIVE_CLASS, state.isWordWrapEnabled);
                updateCounts(); // Triggers gutter redraw
                updateHighlights();
            });
        }

        window.addEventListener("resize", debounce(() => {
            updateCounts(); // Refreshes gutters
        }, 200));
    }

    function init() {
        // Load settings
        const savedWrap = storage.get(UI_CONSTANTS.LOCAL_STORAGE_WORD_WRAP_KEY);
        if (savedWrap === "true") {
            state.isWordWrapEnabled = true;
            DOM.toggleWordWrapButton?.click(); // Simulate click to apply all classes
        }

        const savedType = storage.get(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY);
        if (savedType && DOM.manualTypeSelector) {
            DOM.manualTypeSelector.value = savedType;
        }

        setupEventListeners();
        
        // Initial run if content exists
        if (DOM.inputArea?.value.trim()) {
            performMinification();
        } else {
            handleEmptyInput();
        }

        console.log('🐐 Goat Minify v2.0.0 Initialized');
    }

    init();
});