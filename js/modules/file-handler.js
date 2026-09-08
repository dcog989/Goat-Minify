/**
 * @file file-handler.js
 * @description File upload and download handling
 */

import { TYPE_CONFIG } from "./type-config.js";
import { getTimestampSuffix } from "./utils.js";

const DEFAULT_BASE_FILENAME = "GoatMinify";
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const FILE_PROCESS_DELAY_MS = 10;

/**
 * Sanitize filename for downloads
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Remove path traversal and unsafe characters
  const name = filename.replace(/^.*[\\/]/, "");
  return name.replace(/[^\w.-]/g, "_").replace(/_{2,}/g, "_");
}

/**
 * Attempt to extract a filename from the file header comments
 * @param {string} content - File content
 * @returns {string|null} Extracted filename or null
 */
function extractFilenameFromContent(content) {
  if (!content) return null;
  // Limit search to first 500 chars to avoid regex DoS on massive files
  const header = content.slice(0, 500);

  const patterns = [
    // C-style block comments: /* filename.js */
    /\/\*!?\s*([\w.-]+\.\w+)\s*\*\//,
    // C-style line comments: // filename.js
    /\/\/!?\s*([\w.-]+\.\w+)/,
    // HTML comments: <!-- filename.html -->
    /<!--!?\s*([\w.-]+\.\w+)\s*-->/,
    // Hash comments: # filename.yaml
    /#\s*([\w.-]+\.\w+)/,
  ];

  for (const regex of patterns) {
    const match = header.match(regex);
    if (match?.[1]) {
      return sanitizeFilename(match[1]);
    }
  }
  return null;
}

/**
 * Build a sanitized download filename from context
 * @returns {string}
 */
function buildDownloadFilename({ extractedName, ext, uploadedFilenameBase }) {
  let base = DEFAULT_BASE_FILENAME;
  if (extractedName) {
    base = extractedName.toLowerCase().endsWith(`.${ext}`)
      ? extractedName.substring(0, extractedName.lastIndexOf("."))
      : extractedName;
  } else if (uploadedFilenameBase) {
    base = uploadedFilenameBase.substring(0, uploadedFilenameBase.lastIndexOf("."));
  }
  return `${sanitizeFilename(base)}-min-${getTimestampSuffix()}.${ext}`;
}

/**
 * Trigger a browser download for the given text content
 */
function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create a file handler bound to the given DOM, state, and callbacks.
 * Wire it up with attachListeners().
 */
export function createFileHandler({ DOM, state, onMinify, onRawContent, showStatusMessage, announceToScreenReader }) {
  return {
    attachListeners() {
      this.attachDownloadListener();
      this.attachUploadListener();
    },

    attachDownloadListener() {
      if (!DOM.outputArea || !DOM.downloadButton) return;
      DOM.downloadButton.addEventListener("click", () => {
        if (!DOM.outputArea.value) return;
        const ext = TYPE_CONFIG[state.effectiveType]?.ext ?? "txt";
        const filename = buildDownloadFilename({
          extractedName: extractFilenameFromContent(DOM.inputArea?.value || ""),
          ext,
          uploadedFilenameBase: state.uploadedFilenameBase,
        });
        downloadTextFile(DOM.outputArea.value, filename);
        announceToScreenReader("File downloaded");
      });
    },

    attachUploadListener() {
      if (!DOM.uploadFileButton || !DOM.fileInputHidden) return;
      DOM.uploadFileButton.addEventListener("click", () => DOM.fileInputHidden.click());
      DOM.fileInputHidden.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          if (!confirm("File is large (>10MB). Processing may freeze the browser. Continue?")) {
            e.target.value = null;
            return;
          }
        }

        if (DOM.inputArea) {
          DOM.inputArea.value = "Loading...";
          DOM.inputArea.disabled = true;
        }
        showStatusMessage("Reading file...", false);

        const reader = new FileReader();
        reader.onload = (evt) => {
          if (!DOM.inputArea) return;
          DOM.inputArea.value = evt.target.result;
          DOM.inputArea.disabled = false;
          state.uploadedFilenameBase = file.name;
          onRawContent(DOM.inputArea.value);

          setTimeout(() => {
            onMinify();
            showStatusMessage("File loaded", false);
          }, FILE_PROCESS_DELAY_MS);
        };
        reader.onerror = () => {
          showStatusMessage("Error reading file", true);
          if (DOM.inputArea) {
            DOM.inputArea.value = "";
            DOM.inputArea.disabled = false;
          }
        };
        reader.readAsText(file);
        e.target.value = null;
      });
    },
  };
}
