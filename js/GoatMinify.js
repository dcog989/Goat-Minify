/** Goat Minify - Modular Version
 * @file GoatMinify.js
 * @description Enhanced client-side minifier with modular architecture
 * @license MIT
 * @author Chase McGoat
 * @version 2.5.4
 */

// 1. Load Styles & Polyfills FIRST
import "../css/stylish.css";
import "../css/accessibility.css";
import "./modules/polyfills.js";

// 2. Load other modules
import { ICONS, UI_CONSTANTS } from "./modules/constants.js";
import { detectCodeType, extractLine1Comments } from "./modules/detector.js";
import { createFileHandler } from "./modules/file-handler.js";
import { preloadEngines } from "./modules/minification-engines.js";
import { storage } from "./modules/storage.js";
import { TYPE_CONFIG } from "./modules/type-config.js";
import { UI } from "./modules/ui-core.js";
import { debounce, formatOutput } from "./modules/utils.js";

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
  DOM.inputHighlightCode = DOM.inputHighlightArea?.querySelector("code");
  DOM.outputHighlightCode = DOM.outputHighlightArea?.querySelector("code");

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

    DOM.typeDisplayOutput.textContent = "";
    const span = UI.createStyledSpan(message, {
      color: isError ? UI_CONSTANTS.ERROR_HIGHLIGHT_COLOR : UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR,
      fontWeight: "normal",
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

    let typeDisplayName = typeValue && typeValue !== "none" ? typeValue.toUpperCase() : "NONE";
    if (typeValue === "md") typeDisplayName = "Markdown";

    DOM.typeDisplayOutput.textContent = `${displayLabel}: `;
    const valueSpan = UI.createStyledSpan(typeDisplayName, {
      fontWeight: "bold",
      color: UI_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR,
    });
    valueSpan.className = "detected-type-value";
    DOM.typeDisplayOutput.appendChild(valueSpan);
  }

  const minifyLevelRadios = Array.from(document.querySelectorAll('input[name="minify-level"]'));

  function getMinifyLevel() {
    const checked = minifyLevelRadios.find((el) => el.checked);
    const level = checked ? parseInt(checked.value, 10) : UI_CONSTANTS.DEFAULT_MINIFY_LEVEL;
    return Number.isNaN(level) || level < UI_CONSTANTS.MIN_MINIFY_LEVEL || level > UI_CONSTANTS.MAX_MINIFY_LEVEL
      ? UI_CONSTANTS.DEFAULT_MINIFY_LEVEL
      : level;
  }

  async function performMinification() {
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

    const level = getMinifyLevel();
    let minifiedCode = "";
    const { header, body } = extractLine1Comments(currentCode, state.effectiveType);

    try {
      const typeConfig = TYPE_CONFIG[state.effectiveType] ?? TYPE_CONFIG.none;
      minifiedCode = formatOutput(header, await typeConfig.minify(body, level, state.effectiveType));
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
      {
        area: DOM.inputArea,
        line: DOM.inputLineCount,
        char: DOM.inputCharCount,
        gutter: DOM.inputLineGutter,
        hl: DOM.inputHighlightArea,
        isWordWrapEnabled: state.isWordWrapEnabled,
      },
      {
        area: DOM.outputArea,
        line: DOM.outputLineCount,
        char: DOM.outputCharCount,
        gutter: DOM.outputLineGutter,
        hl: DOM.outputHighlightArea,
        isWordWrapEnabled: state.isWordWrapEnabled,
      },
    );
  }

  const debouncedHighlight = debounce(() => {
    if (DOM.inputArea && DOM.inputHighlightCode) {
      UI.updateHighlight(
        DOM.inputArea.value,
        DOM.inputHighlightCode,
        state.effectiveType,
        DOM.inputHighlightArea,
        state.isWordWrapEnabled,
      );
    }
  }, UI_CONSTANTS.HIGHLIGHT_DEBOUNCE_DELAY_MS);

  function updateInputHighlight() {
    UI.setRawHighlightContent(DOM.inputHighlightCode, DOM.inputArea.value);
  }

  function updateHighlights() {
    debouncedHighlight();
    if (DOM.outputArea && DOM.outputHighlightCode) {
      UI.updateHighlight(
        DOM.outputArea.value,
        DOM.outputHighlightCode,
        state.effectiveType,
        DOM.outputHighlightArea,
        state.isWordWrapEnabled,
      );
    }
  }

  function updateAllUIStates() {
    const isInputEmpty = !DOM.inputArea?.value.trim();
    const isOutputEmpty = !DOM.outputArea?.value.trim();

    if (DOM.clearInputButton) DOM.clearInputButton.disabled = isInputEmpty;
    if (DOM.copyButton) DOM.copyButton.disabled = isOutputEmpty;
    if (DOM.downloadButton) DOM.downloadButton.disabled = isOutputEmpty;

    if (DOM.customPlaceholder && DOM.inputArea) {
      DOM.customPlaceholder.classList.toggle(
        UI_CONSTANTS.HIDDEN_CLASS,
        !isInputEmpty || document.activeElement === DOM.inputArea,
      );
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
        updateInputHighlight();

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
          updateInputHighlight();
          performMinification();
        }, 0);
      });

      DOM.inputArea.addEventListener("focus", updateAllUIStates);
      DOM.inputArea.addEventListener("blur", updateAllUIStates);
      DOM.inputArea.addEventListener("scroll", () =>
        UI.syncScroll(DOM.inputArea, DOM.inputLineGutter, DOM.inputHighlightArea),
      );
    }

    if (DOM.outputArea) {
      DOM.outputArea.addEventListener("scroll", () =>
        UI.syncScroll(DOM.outputArea, DOM.outputLineGutter, DOM.outputHighlightArea),
      );
    }

    if (DOM.manualTypeSelector) {
      UI_CONSTANTS.TYPE_OPTIONS.forEach((opt) => {
        const el = document.createElement("option");
        el.value = opt;
        el.textContent = opt === "auto" ? "Auto-Detect" : opt === "none" ? "Plain Text" : opt.toUpperCase();
        DOM.manualTypeSelector.appendChild(el);
      });

      DOM.manualTypeSelector.addEventListener("change", (e) => {
        storage.set(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY, e.target.value);
        performMinification();
      });
    }

    minifyLevelRadios.forEach((el) => {
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
        } catch (_e) {
          showTemporaryStatusMessage("Failed to copy", true);
        }
      });
    }

    const fileHandler = createFileHandler({
      DOM,
      state,
      onMinify: performMinification,
      onRawContent: (content) => UI.setRawHighlightContent(DOM.inputHighlightCode, content),
      showStatusMessage,
      announceToScreenReader: UI.announceToScreenReader.bind(UI),
    });
    fileHandler.attachListeners();

    if (DOM.toggleWordWrapButton) {
      DOM.toggleWordWrapButton.addEventListener("click", () => {
        state.isWordWrapEnabled = !state.isWordWrapEnabled;
        storage.set(UI_CONSTANTS.LOCAL_STORAGE_WORD_WRAP_KEY, state.isWordWrapEnabled);

        UI.setWordWrap([DOM.inputArea, DOM.outputArea], DOM.toggleWordWrapButton, state.isWordWrapEnabled);
        updateAppCounts();
        updateHighlights();
      });
    }

    window.addEventListener(
      "resize",
      debounce(() => updateAppCounts(), UI_CONSTANTS.RESIZE_DEBOUNCE_DELAY_MS),
    );
  }

  function init() {
    setupEventListeners();

    const savedWrap = storage.get(UI_CONSTANTS.LOCAL_STORAGE_WORD_WRAP_KEY);
    if (savedWrap === "true") {
      state.isWordWrapEnabled = true;
      UI.setWordWrap([DOM.inputArea, DOM.outputArea], DOM.toggleWordWrapButton, true);
    }

    const savedType = storage.get(UI_CONSTANTS.LOCAL_STORAGE_MANUAL_TYPE_KEY);
    if (savedType && DOM.manualTypeSelector) {
      DOM.manualTypeSelector.value = savedType;
    }

    // Background Preloading:
    // Wait for the main thread to be idle (after UI paint), then load the heavy engines.
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => preloadEngines());
    } else {
      setTimeout(() => preloadEngines(), UI_CONSTANTS.ENGINE_PRELOAD_FALLBACK_DELAY_MS);
    }

    if (DOM.inputArea?.value.trim()) {
      updateInputHighlight();
      performMinification();
    } else {
      handleEmptyInput();
    }
  }

  init();
});
