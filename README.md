# Goat Minify

A powerful client-side code minification tool supporting JS, CSS, HTML, XML, JSON, YAML, TOML, and Markdown. Features a user-friendly interface with syntax highlighting, auto-detection, and drag-and-drop support.

## 🚀 Features

- **Multi-Language Support**: Minifies JS, CSS, HTML, XML, JSON, YAML, TOML, and Markdown.
- **Privacy First**: 100% client-side processing. Your code never leaves your browser.
- **Smart Detection**: Automatically identifies code type with manual override options.
- **Accessibility**: Full keyboard navigation, screen reader support (ARIA), and high-contrast compatibility.
- **Developer Friendly**:
  - Syntax highlighting (Highlight.js)
  - Line numbers and gutters
  - File drag-and-drop
  - Minification levels (1-4)
  - Copy/Download utilities

## 🛠️ Installation & Development

This project uses [Vite](https://vitejs.dev/) for development.

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`

3. **Build for Production**

   ```bash
   npm run build
   ```

4. **Run Tests**

   ```bash
   npm test
   ```

## 🏗️ Project Structure

```
├── css/
│   ├── stylish.css       # Main themes and layout
│   └── accessibility.css # ARIA, focus, and motion handling
├── js/
│   ├── GoatMinify.improved.js  # Main application logic (ES Module)
│   └── modules/                # Modular components
│       ├── constants.js
│       ├── detector.js
│       └── utils.js
└── index.html
```

## 📚 Credits

Built with:

- [highlight.js](https://github.com/highlightjs/highlight.js)
- [CSSO](https://github.com/css/csso)
- [html-minifier-terser](https://github.com/terser/html-minifier-terser)
- [Terser](https://github.com/terser/terser)

## License

MIT
