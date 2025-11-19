/**
 * @file constants.js
 * @description Application constants and configuration
 */

export const UI_CONSTANTS = {
    LOCAL_STORAGE_WORD_WRAP_KEY: "goatMinifyWordWrap",
    LOCAL_STORAGE_MANUAL_TYPE_KEY: "goatMinifyManualType",
    WORD_WRAP_ENABLED_CLASS: "word-wrap-enabled",
    WORD_WRAP_DISABLED_CLASS: "word-wrap-disabled",
    EMPTY_STATE_CLASS: "empty-state",
    HIDDEN_CLASS: "hidden",
    ACTIVE_CLASS: "active",
    
    // Adjusted for performance
    DEBOUNCE_DELAY_MS: 500, // Slower debounce for heavy minification tasks
    HIGHLIGHT_DEBOUNCE_DELAY_MS: 300, // Smoother typing experience
    
    FEEDBACK_MESSAGE_TIMEOUT_MS: 1500,
    STATUS_MESSAGE_TIMEOUT_MS: 3000,
    DEFAULT_MINIFY_LEVEL_ID: "minify-level-4",
    
    // Performance limits
    MAX_HIGHLIGHT_LEN: 50000, // Disable syntax highlighting for files > 50KB to prevent freezing
    
    ACCEPTED_FILE_EXTENSIONS: ["js", "css", "html", "txt", "json", "xml", "svg", "yaml", "yml", "toml", "md", "markdown"],
    DEFAULT_HIGHLIGHT_COLOR: "var(--color-text-highlight)",
    ERROR_HIGHLIGHT_COLOR: "red",
    TYPE_OPTIONS: ["auto", "js", "css", "html", "json", "xml", "svg", "yaml", "toml", "md", "none"],
};

export const DETECT_REGEX = {
    // HTML
    HTML: /<!DOCTYPE\s+html|<html\s*[\s>]|<body\s*[\s>]|<\/(html|body|div|span|p|table|script|style)>|<(script|style|div|span|p|table)\b[^>]*>/i,
    
    // XML/SVG
    SVG: /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"|<svg\s+[^>]*>[\s\S]*<\/svg>/i,
    XML: /<\?xml\s+version=['"][\d.]+['"]|<([a-zA-Z0-9_:]+)\b[^>]*>[\s\S]*<\/\1>/,

    // CSS
    CSS_RULE: /(?:[.#]?-?[_a-zA-Z]+[_a-zA-Z0-9-]*|\[[^\]]+\]|::?[a-zA-Z0-9-]+(?:\([^)]+\))?)\s*\{[\s\S]*?\}/,
    CSS_AT_RULE: /@(media|keyframes|font-face|import|charset|namespace|supports|document|page|layer|property|container|scope)\b/i,
    CSS_VAR: /--[a-zA-Z0-9-]+\s*:/,
    
    // JS
    JS_KEYWORD: /\b(function|class|let|const|var|if|for|while|switch|return|async|await|import|export|yield|=>|document|window|console)\b/i,
    JS_OPERATOR: /(===?|!==?|&&|\|\||\+\+|--(?![a-zA-Z<])|\*\*|[+\-*/%&|^!~<>?]=?)/,
    
    // Precompiled strong keywords for faster detection
    // 1. Exclude CSS selectors like .class, #return using lookbehind (?<![.#])
    // 2. Exclude CSS variables like var(--x) by ensuring 'var' isn't followed by '('
    // 3. Exclude CSS imports like @import by ensuring 'import' isn't preceded by '@'
    JS_STRONG_KEYWORDS: /(?<![.#])\b(function|const|let|return|if|else|while|for|switch|console|window|export|class)\b|(?<![.#])\bvar\b(?!\s*\()|(?<![@])\bimport\b/,
    
    // YAML
    YAML_START: /^%YAML|---\s*$/m,
    YAML_KEY_VALUE: /^\s*([a-zA-Z0-9_.-]+)\s*:\s*(.*)/m,
    YAML_LIST_ITEM: /^\s*-\s+\S+/m,
    
    // TOML
    TOML_TABLE: /^\s*\[([a-zA-Z0-9_.-]+)\]\s*$/m,
    TOML_KEY_VALUE: /^\s*([a-zA-Z0-9_.-]+)\s*=\s*(["']|true|false|[0-9]|\[|\{)/m,
    
    // MARKDOWN
    MARKDOWN_FRONTMATTER: /^---\s*$/m,
    MARKDOWN_HEADER: /^#{1,6}\s+.+$/m,
    MARKDOWN_LIST: /^[\s\t]*(\*|\+|\-|\d+\.)\s+\S+/m,
    MARKDOWN_CODE_BLOCK: /^[\s\t]*(`{3,}|~{3,})/m,
    MARKDOWN_LINK: /!{0,1}\[.*?\]\(.*?\)/,
    MARKDOWN_FORMAT: /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/,
};

export const ICONS = {
    CHECKMARK: '<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>',
};