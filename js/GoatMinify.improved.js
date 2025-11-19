/** Goat Minify - Modular Version
 * @file GoatMinify.improved.js
 * @description Enhanced client-side minifier with modular architecture
 * @license MIT
 * @author Chase McGoat
 * @version 2.5.0
 */

// 1. Load Polyfills FIRST
import './modules/polyfills.js';

// 2. Load other modules
import { UI_CONSTANTS, ICONS } from './modules/constants.js';
import { debounce, formatOutput, sanitizeFilename, getTimestampSuffix, extractFilenameFromContent } from './modules/utils.js';
import { detectCodeType, extractLine1Comments } from './modules/detector.js';
import { storage } from './modules/storage.js';
import { UI } from './modules/ui-core.js';
import { 
    minifyJS, 
    minifyCSS, 
    minifyHTML, 
    applyBasicMinification 
} from './modules/minification-engines.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded. App starting...");

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
        statusMessageTimer: null,
    };

    // =======================
    // UI Orchestration
    // =======================

    function showTemporaryStatusMessage(message, isError = false, duration = UI_CONSTANTS.STATUS_MESSAGE_TIMEOUT_MS) {
        if (!DOM.typeDisplayOutput) return;
        if (state.statusMessageTimer) clearTimeout(state.statusMessageTimer);

        DOM.typeDisplayOutput.textContent = '';
        const span = UI.createStyledSpan(message, {
            color: isError ? UI_CONSTANTS.ERROR_HIGHLIGHT_COLOR : UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR,
            fontWeight: 'normal'
        });
        DOM.typeDisplayOutput.appendChild(span);

        UI.announceToScreenReader(isError ? `Error: ${message}` : message);

        state.statusMessageTimer = setTimeout(() => {
            updateTypeDisplayOutput();
            state.statusMessageTimer = null;
        }, duration);
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
        const valueSpan = UI.createStyledSpan(typeDisplayName, {
            fontWeight: 'bold',
            color: UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR
        });
        valueSpan.className = 'detected-type-value';
        DOM.typeDisplayOutput.appendChild(valueSpan);
    }

    function getMinifyLevel() {
        const radio = document.querySelector('input[name="minify-level"]:checked');
        const level = radio ? parseInt(radio.value, 10) : 4;
        return (level < 1 || level > 4 || isNaN(level)) ? 4 : level;
    }

    async function performMinification() {
        console.log("Processing...");
        if (!DOM.inputArea) return;
        const currentCode = DOM.inputArea.value;

        if (currentCode.trim() === "") {
            handleEmptyInput();
            return;
        }

        state.autoDetectedType = detectCodeType(currentCode, state.uploadedFilenameBase);
        
        if (DOM.manualTypeSelector?.value !== "auto") {
            state.effectiveType = DOM.manualTypeSelector.value;
            state.isManualTypeOverrideActive = true;
        } else {
            state.effectiveType = state.autoDetectedType;
            state.isManualTypeOverrideActive = false;
        }

        updateTypeDisplayOutput();
        updateAppCounts();

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
                    minifiedCode = formatOutput(header, await minifyCSS(body, level));
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
            console.error("Minify Error:", error);
            showTemporaryStatusMessage("Minification error. Output may be incomplete.", true);
            minifiedCode = currentCode;
        }

        if (DOM.outputArea) DOM.outputArea.value = minifiedCode;
        
        updateAppCounts();
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
        updateAppCounts();
        updateHighlights();
        updateTypeDisplayOutput();
        updateAllUIStates();
    }

    function updateAppCounts() {
        UI.updateCounts(
            { area: DOM.inputArea, line: DOM.inputLineCount, char: DOM.inputCharCount, gutter: DOM.inputLineGutter, hl: DOM.inputHighlightArea, isWordWrapEnabled: state.isWordWrapEnabled },
            { area: DOM.outputArea, line: DOM.outputLineCount, char: DOM.outputCharCount, gutter: DOM.outputLineGutter, hl: DOM.outputHighlightArea, isWordWrapEnabled: state.isWordWrapEnabled }
        );
    }

    const debouncedHighlight = debounce(() => {
        if (DOM.inputArea && DOM.inputHighlightCode) {
            UI.updateHighlight(DOM.inputArea.value, DOM.inputHighlightCode, state.effectiveType, DOM.inputHighlightArea, state.isWordWrapEnabled);
        }
    }, UI_CONSTANTS.HIGHLIGHT_DEBOUNCE_DELAY_MS);

    function updateHighlights() {
        debouncedHighlight();
        if (DOM.outputArea && DOM.outputHighlightCode) {
            UI.updateHighlight(DOM.outputArea.value, DOM.outputHighlightCode, state.effectiveType, DOM.outputHighlightArea, state.isWordWrapEnabled);
        }
    }

    function updateAllUIStates() {
        const isInputEmpty = !DOM.inputArea?.value.trim();
        const isOutputEmpty = !DOM.outputArea?.value.trim();
        
        if (DOM.clearInputButton) DOM.clearInputButton.disabled = isInputEmpty;
        if (DOM.copyButton) DOM.copyButton.disabled = isOutputEmpty;
        if (DOM.downloadButton) DOM.downloadButton.disabled = isOutputEmpty;

        if (DOM.customPlaceholder && DOM.inputArea) {
            DOM.customPlaceholder.classList.toggle(UI_CONSTANTS.HIDDEN_CLASS, !isInputEmpty || document.activeElement === DOM.inputArea);
        }

        if (DOM.minifyLevelSelector) {
            DOM.minifyLevelSelector.classList.toggle(UI_CONSTANTS.EMPTY_STATE_CLASS, isInputEmpty && isOutputEmpty);
        }
    }

    // =======================
    // Event Listeners & Init
    // =======================

    function setupEventListeners() {
        if (DOM.inputArea) {
            DOM.inputArea.addEventListener("input", () => {
                // Immediate visual update to background layer
                UI.setRawHighlightContent(DOM.inputHighlightCode, DOM.inputArea.value);

                state.uploadedFilenameBase = null;
                if (DOM.manualTypeSelector && DOM.manualTypeSelector.value !== "auto" && !state.isManualTypeOverrideActive) {
                     DOM.manualTypeSelector.value = "auto";
                     storage.set(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY, "auto");
                }
                debouncedMinify();
            });
            
            DOM.inputArea.addEventListener("paste", () => {
                setTimeout(() => {
                    // Immediate visual update on paste
                    UI.setRawHighlightContent(DOM.inputHighlightCode, DOM.inputArea.value);
                    performMinification();
                }, 0);
            });
            
            DOM.inputArea.addEventListener("focus", updateAllUIStates);
            DOM.inputArea.addEventListener("blur", updateAllUIStates);
            DOM.inputArea.addEventListener("scroll", () => UI.syncScroll(DOM.inputArea, DOM.inputLineGutter, DOM.inputHighlightArea));
        }

        if (DOM.outputArea) {
            DOM.outputArea.addEventListener("scroll", () => UI.syncScroll(DOM.outputArea, DOM.outputLineGutter, DOM.outputHighlightArea));
        }

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

        document.querySelectorAll('input[name="minify-level"]').forEach(el => {
            el.addEventListener("change", performMinification);
        });

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
                    UI.announceToScreenReader("Copied to clipboard");
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
                
                let base = "GoatMinify";
                const extractedName = extractFilenameFromContent(DOM.inputArea?.value || "");
                
                if (extractedName) {
                    if (extractedName.toLowerCase().endsWith('.' + ext)) {
                        base = extractedName.substring(0, extractedName.lastIndexOf('.'));
                    } else {
                        base = extractedName;
                    }
                } else if (state.uploadedFilenameBase) {
                    base = state.uploadedFilenameBase.substring(0, state.uploadedFilenameBase.lastIndexOf("."));
                }
                
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
                UI.announceToScreenReader("File downloaded");
            });
        }

        if (DOM.uploadFileButton && DOM.fileInputHidden) {
            DOM.uploadFileButton.addEventListener("click", () => DOM.fileInputHidden.click());
            DOM.fileInputHidden.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                    if(!confirm("File is large (>10MB). Processing may freeze the browser. Continue?")) {
                        e.target.value = null;
                        return;
                    }
                }

                // Show loading state
                if (DOM.inputArea) {
                    DOM.inputArea.value = "Loading...";
                    DOM.inputArea.disabled = true;
                }
                showTemporaryStatusMessage("Reading file...", false);

                const reader = new FileReader();
                reader.onload = (evt) => {
                    if (DOM.inputArea) {
                        DOM.inputArea.value = evt.target.result;
                        DOM.inputArea.disabled = false;
                        state.uploadedFilenameBase = file.name;
                        
                        UI.setRawHighlightContent(DOM.inputHighlightCode, DOM.inputArea.value);
                        
                        // Process next tick to update UI
                        setTimeout(() => {
                            performMinification();
                            showTemporaryStatusMessage("File loaded", false);
                        }, 10);
                    }
                };
                reader.onerror = () => {
                    showTemporaryStatusMessage("Error reading file", true);
                    if (DOM.inputArea) {
                        DOM.inputArea.value = "";
                        DOM.inputArea.disabled = false;
                    }
                };
                reader.readAsText(file);
                e.target.value = null;
            });
        }

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
                updateAppCounts();
                updateHighlights();
            });
        }

        window.addEventListener("resize", debounce(() => updateAppCounts(), 200));
    }

    function init() {
        const savedWrap = storage.get(UI_CONSTANTS.LOCAL_STORAGE_WORD_WRAP_KEY);
        if (savedWrap === "true") {
            state.isWordWrapEnabled = true;
            DOM.toggleWordWrapButton?.click();
        }

        const savedType = storage.get(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY);
        if (savedType && DOM.manualTypeSelector) {
            DOM.manualTypeSelector.value = savedType;
        }

        setupEventListeners();
        
        if (DOM.inputArea?.value.trim()) {
            UI.setRawHighlightContent(DOM.inputHighlightCode, DOM.inputArea.value);
            performMinification();
        } else {
            handleEmptyInput();
        }

        console.log('🐐 Goat Minify v2.5.0 Initialized');
    }

    init();
});