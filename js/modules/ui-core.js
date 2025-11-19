/**
 * @file ui-core.js
 * @description UI manipulation functions (gutters, highlights, scrolling)
 */

import { UI_CONSTANTS } from './constants.js';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import ini from 'highlight.js/lib/languages/ini';
import markdown from 'highlight.js/lib/languages/markdown';

// Register only necessary languages to save bundle size
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml); // Handles HTML, SVG, XML
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('ini', ini); // Handles TOML
hljs.registerLanguage('markdown', markdown);

import 'highlight.js/styles/github-dark.min.css';

let measurementHelperDiv = null;

/**
 * Calculate visual lines for wrapped text.
 * Optimized to use cached styles to reduce getComputedStyle calls.
 */
function getVisualLineCountForLogicalLine(logicalLineText, stylesCache, measurementHelper) {
    // Ensure width is updated
    if (measurementHelper.style.width !== stylesCache.width) {
        measurementHelper.style.width = stylesCache.width;
    }

    measurementHelper.textContent = logicalLineText.length === 0 ? "\u00A0" : logicalLineText;

    // Reading scrollHeight forces layout, but we've minimized style recalc overhead upstream
    const scrollHeight = measurementHelper.scrollHeight;
    
    if (stylesCache.singleLineHeight === 0) return 1;
    return Math.max(1, Math.round((scrollHeight + 0.001) / stylesCache.singleLineHeight));
}

/**
 * Prepare measurement helper and extract styles once
 */
function getMeasurementContext(textarea) {
    if (!measurementHelperDiv) {
        measurementHelperDiv = document.createElement("div");
        Object.assign(measurementHelperDiv.style, {
            padding: "0", border: "none", visibility: "hidden",
            position: "absolute", top: "-9999px", left: "-9999px",
            boxSizing: "content-box"
        });
        document.body.appendChild(measurementHelperDiv);
    }

    const computed = getComputedStyle(textarea);
    const paddingX = (parseFloat(computed.paddingLeft) || 0) + (parseFloat(computed.paddingRight) || 0);
    const width = (textarea.clientWidth - paddingX) + "px";
    const singleLineHeight = parseFloat(computed.lineHeight) || (parseFloat(computed.fontSize) * 1.4);

    // Apply font styles to helper once
    measurementHelperDiv.style.fontFamily = computed.fontFamily;
    measurementHelperDiv.style.fontSize = computed.fontSize;
    measurementHelperDiv.style.lineHeight = computed.lineHeight;
    measurementHelperDiv.style.whiteSpace = "pre-wrap";
    measurementHelperDiv.style.wordBreak = computed.wordBreak;

    return {
        helper: measurementHelperDiv,
        styles: { width, singleLineHeight }
    };
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
        
        const cacheKey = `${textarea.value.length}-${isWordWrapEnabled}-${textarea.clientWidth}`;
        if (gutterEl.dataset.cacheKey === cacheKey && gutterEl.dataset.textareaValue === textarea.value) {
             this.syncScroll(textarea, gutterEl, highlightAreaEl);
             return;
        }

        let newGutterTextContent = "";
        if (isWordWrapEnabled) {
            // Get context once before the loop to avoid layout thrashing
            const context = getMeasurementContext(textarea);
            
            let linesForGutter = [];
            for (let i = 0; i < logicalLineCount; i++) {
                let lineDisplay = [(i + 1).toString()];
                // Pass context to helper
                const numVisualLines = getVisualLineCountForLogicalLine(logicalLines[i], context.styles, context.helper);
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

        // Performance Check: Skip syntax highlighting for very large files
        if (sourceText.length > UI_CONSTANTS.MAX_HIGHLIGHT_LEN) {
            codeEl.textContent = sourceText;
            codeEl.className = 'hljs'; // Basic styling only
            return;
        }

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
                const res = hljs.highlight(sourceText, { language: hljsLang, ignoreIllegals: true });
                codeEl.innerHTML = res.value;
                codeEl.className = `hljs language-${hljsLang}`;
            } catch (e) {
                codeEl.textContent = sourceText;
            }
        }
    },

    setRawHighlightContent(codeEl, content) {
        if (codeEl) {
            codeEl.textContent = content;
            if (!codeEl.classList.contains('hljs')) {
                codeEl.classList.add('hljs');
            }
        }
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