/**
 * @file ui-core.js
 * @description UI manipulation functions (gutters, highlights, scrolling)
 */

import { UI_CONSTANTS } from './constants.js';

let measurementHelperDiv = null;

/**
 * Calculate visual lines for wrapped text
 */
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
    
    const paddingX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const width = textarea.clientWidth - paddingX;

    measurementHelperDiv.style.width = `${Math.max(0, width)}px`;
    measurementHelperDiv.textContent = logicalLineText.length === 0 ? "\u00A0" : logicalLineText;

    const scrollHeight = measurementHelperDiv.scrollHeight;
    const singleLineHeight = parseFloat(styles.lineHeight) || (parseFloat(styles.fontSize) * 1.4);

    if (singleLineHeight === 0 || isNaN(singleLineHeight)) return 1;
    return Math.max(1, Math.round((scrollHeight + 0.001) / singleLineHeight));
}

export const UI = {
    syncScroll(source, ...targets) {
        if (!source) return;
        const { scrollTop, scrollLeft } = source;
        targets.forEach(t => {
            if (t) {
                t.scrollTop = scrollTop;
                if (t.tagName === 'PRE' || t.tagName === 'CODE') t.scrollLeft = scrollLeft;
            }
        });
    },

    updateGutter(textarea, gutterEl, highlightAreaEl, isWordWrapEnabled) {
        if (!textarea || !gutterEl) return;
        
        const logicalLines = textarea.value.split("\n");
        const logicalLineCount = logicalLines.length;
        
        // Cache check
        const cacheKey = `${textarea.value.length}-${isWordWrapEnabled}`;
        if (gutterEl.dataset.cacheKey === cacheKey && gutterEl.dataset.textareaValue === textarea.value) {
             this.syncScroll(textarea, gutterEl, highlightAreaEl);
             return;
        }

        let newGutterTextContent = "";
        if (isWordWrapEnabled) {
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
        this.syncScroll(textarea, gutterEl, highlightAreaEl);
    },

    updateHighlight(sourceText, codeEl, lang, preEl, isWordWrapEnabled) {
        if (!codeEl || !preEl) return;
        
        preEl.className = `hljs-highlight-layer ${isWordWrapEnabled ? UI_CONSTANTS.WORD_WRAP_ENABLED_CLASS : UI_CONSTANTS.WORD_WRAP_DISABLED_CLASS}`;

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
            if (window.hljs) {
                try {
                    const res = window.hljs.highlight(sourceText, { language: hljsLang, ignoreIllegals: true });
                    codeEl.innerHTML = res.value;
                    codeEl.className = `hljs language-${hljsLang}`;
                } catch (e) {
                    codeEl.textContent = sourceText;
                }
            } else {
                codeEl.textContent = sourceText;
            }
        }
    },

    setRawHighlightContent(codeEl, content) {
        if (codeEl) codeEl.textContent = content;
    },

    updateCounts(inputMap, outputMap) {
        [inputMap, outputMap].forEach(set => {
            if (!set.area) return;
            const val = set.area.value;
            if (set.line) set.line.textContent = `Lines: ${val ? val.split('\n').length : 0}`;
            if (set.char) set.char.textContent = `Chars: ${val.length}`;
            if (set.gutter) this.updateGutter(set.area, set.gutter, set.hl, set.isWordWrapEnabled);
        });
    },
    
    createStyledSpan(text, styles = {}) {
        const span = document.createElement('span');
        span.textContent = text;
        Object.assign(span.style, styles);
        return span;
    },

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
};