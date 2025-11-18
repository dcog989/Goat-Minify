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

export const DETECT_REGEX = {
    HTML: /<!DOCTYPE\s+html|<html\s*[\s>]|<body\s*[\s>]|<([a-z][a-z0-9]*)\b[^>]*>/i,
    SVG: /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"|<svg[^>]*>/i,
    XML: /<\?xml[^?]*\?>|<([a-zA-Z0-9_:]+)\b[^>]*>/i,
    CSS_RULE: /(?:[.#]?-?[_a-zA-Z]+[_a-zA-Z0-9-]*|\[[^\]]+\]|::?[a-zA-Z0-9-]+(?:\([^)]+\))?)\s*\{[\s\S]*?\}/,
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

export const ICONS = {
    CHECKMARK: '<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>',
};