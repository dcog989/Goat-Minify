# Goat Minify

**Goat Minify** is a code minification / compression tool. It runs entirely in your browser, ensuring maximum privacy and speed.

It supports **JavaScript, CSS, HTML, XML, JSON, YAML, TOML, and Markdown**, featuring auto-detection, syntax highlighting, and granular compression levels.

Try it out now: [https://github.com/dcog989/Goat-Minify](https://github.com/dcog989/Goat-Minify)

![Goat Minify Version](https://img.shields.io/badge/version-2.5.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

- **Privacy First**: All processing happens locally using Web Workers and bundled compilers.
- **Multi-Language**:
  - **JS/JSON**: Powered by [Terser](https://github.com/terser/terser).
  - **CSS**: Powered by [PostCSS](https://postcss.org/) + [cssnano](https://cssnano.co/).
  - **HTML/XML/SVG**: Powered by [html-minifier-terser](https://github.com/terser/html-minifier-terser).
  - **Data (YAML/TOML)**: Structure-aware whitespace removal.
  - **Markdown**: Frontmatter preservation and whitespace optimization.
- **Smart Detection**: Heuristic analysis to detect code type (even without file extensions).
- **Developer Experience**:
  - Syntax Highlighting (Highlight.js) with line numbers.
  - Drag-and-drop file upload.
  - Minification Levels (1-4) for fine-grained control.
- **Accessibility**: Fully accessible (ARIA support, keyboard navigation, high contrast compatibility).

## 🛠️ Development

This project is built with **Vite 7** and utilizes a modular ES6 architecture.

### Prerequisites

- Node.js (v18 or higher recommended)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/dcog989/Goat-Minify.git
    cd Goat-Minify
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

    Open the URL shown in the terminal (usually `http://localhost:3000`).

### Build for Production

To create a deployable static site:

```bash
npm run build
```

The output will be in the `dist/` folder.

### Preview Production Build

To test the production build locally (verifying bundle loading and polyfills):

```bash
npm run preview
```

## 🏗️ Project Structure

```
├── css/
│   ├── stylish.css       # Main themes and layout
│   └── accessibility.css # ARIA, focus, and motion handling
├── js/
│   ├── GoatMinify.js  # Main entry point
│   └── modules/
│       ├── constants.js        # Regex patterns and config
│       ├── detector.js         # Language detection logic
│       ├── minification-engines.js # Interface to compilers (Terser/PostCSS)
│       ├── polyfills.js        # Node.js environment shims for browser
│       ├── storage.js          # Safe localStorage wrapper
│       ├── ui-core.js          # UI manipulation (highlights, scrolling)
│       ├── utils.js            # Debounce, formatting helpers
│       ├── fs-stub.js          # Virtual file system for cssnano
│       ├── os-stub.js          # Virtual OS module
│       └── url-stub.js         # Virtual URL module
├── vite.config.js              # Build configuration & polyfill mapping
└── index.html
```

## 📦 Deployment

This is a **Static Web App**. You can deploy the `dist/` folder to any static host:

- **GitHub Pages**: (Recommended) Push to a `gh-pages` branch or use a GitHub Action.
- **Netlify / Vercel / Cloudflare Pages**: Drag and drop the `dist` folder.
- **Apache / Nginx**: Upload contents to your web root.

**Note**: You cannot run the `index.html` directly via the file system (`file://`) due to browser security restrictions on ES Modules. You must serve it via a web server.

## 📚 Credits

Built on the shoulders of giants:

- [Vite](https://vitejs.dev/)
- [Highlight.js](https://highlightjs.org/)
- [Terser](https://terser.org/)
- [cssnano](https://cssnano.co/)
- [html-minifier-terser](https://github.com/terser/html-minifier-terser)

## License

MIT
