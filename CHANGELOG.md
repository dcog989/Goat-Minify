# Changelog

All notable changes to the Goat-Minify project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-18 - Security & Accessibility Release

### 🔒 Security

#### Added
- Safe DOM manipulation functions to prevent XSS attacks
- Safe localStorage wrapper with try-catch error handling
- Input validation for minification levels
- File validation for uploads (type and size checks)
- Sanitization function for filenames

#### Fixed
- XSS vulnerability in `showTemporaryStatusMessage()` using innerHTML
- XSS vulnerability in `updateTypeDisplayOutput()` using innerHTML
- Unhandled exceptions when localStorage is full or disabled

### ♿ Accessibility

#### Added
- ARIA attributes (role, aria-live, aria-atomic) for status updates
- Screen reader announcement utility function
- Skip navigation link for keyboard users
- SR-only CSS utility class
- Focus-visible styles for all interactive elements
- High contrast mode support via media queries
- Reduced motion support for users with vestibular disorders
- Print styles for better printing experience

#### Enhanced
- Keyboard navigation for all controls
- Semantic HTML improvements
- Color contrast compliance
- Better focus management

### 🏗️ Architecture

#### Added
- Modular structure with separate files:
  - `js/modules/constants.js` - All constants and regex patterns
  - `js/modules/utils.js` - Utility functions
  - `js/modules/detector.js` - Type detection logic
- `js/GoatMinify.improved.js` - Enhanced main file with all fixes
- `css/accessibility.css` - Accessibility-specific styles

#### Changed
- Refactored DOM element references into single object
- Improved state management
- Better code organization and readability

### 🛠️ Development

#### Added
- `package.json` with npm scripts
- `vite.config.js` for modern build tooling
- ESLint configuration
- Prettier configuration
- Testing framework setup (Vitest)
- Development server configuration

#### Scripts
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "lint": "eslint",
  "format": "prettier"
}
```

### 📚 Documentation

#### Added
- `.docs/Code-Review.md` - Comprehensive code review with 10 categories
- `.docs/Implementation-Guide.md` - Step-by-step implementation instructions
- `.docs/SUMMARY.md` - Executive summary of all changes
- `.docs/QUICK-REFERENCE.md` - Quick reference card for developers
- `.docs/ToDo.md` - Updated task list with priorities
- `CHANGELOG.md` - This file

### 🐛 Bug Fixes

#### Fixed
- Improved error messages with user-friendly fallbacks
- Better handling of edge cases in type detection
- Fixed potential issues with large file uploads
- Improved debouncing logic

### 📈 Performance

#### Improved
- Cached DOM element references
- Optimized regex testing (avoiding repeated tests)
- Better memory management for measurement helper div
- Reduced unnecessary DOM queries

### 🎨 UI/UX

#### Added
- Better visual feedback for errors
- Improved status message handling
- Enhanced button state management
- Better placeholder visibility logic

#### Changed
- More consistent error messaging
- Improved user feedback timing

---

## [1.3.1] - 2025-06-06 - Previous Version

### Features
- Multi-level minification (levels 1-4)
- Support for JS, CSS, HTML, XML, JSON, YAML, TOML, Markdown
- Auto-detection of code types
- Manual type override option
- Syntax highlighting with line numbers
- Word wrap toggle
- File upload/download
- Copy to clipboard
- Character and line counting
- Light/dark theme support

### Technical
- Client-side processing (no server required)
- Uses Terser for JavaScript minification
- Uses CSSO for CSS minification
- Uses html-minifier-terser for HTML minification
- Integration with highlight.js for syntax highlighting

---

## [Roadmap] - Future Versions

### [2.1.0] - Planned
- Unit tests coverage
- Integration tests
- PWA support
- Service worker for offline use

### [2.2.0] - Planned
- Batch file processing
- Diff viewer
- History/undo feature
- Compression statistics

### [3.0.0] - Future
- Browser extension
- Desktop application (Electron)
- API endpoint
- Collaborative features

---

## Migration Guide

### From v1.3.1 to v2.0.0

1. **Backup Your Files**
   ```bash
   cp js/GoatMinify.js js/GoatMinify.v1.3.1.backup.js
   ```

2. **Add New Files**
   - `css/accessibility.css`
   - `js/GoatMinify.improved.js`
   - `js/modules/` (optional, for modular version)

3. **Update index.html**
   ```html
   <!-- Add after existing stylish.css -->
   <link rel="stylesheet" href="./css/accessibility.css">
   
   <!-- Add at start of body -->
   <a href="#main-content" class="skip-to-main">Skip to main content</a>
   
   <!-- Add id to main container -->
   <div class="editor-container" id="main-content">
   
   <!-- Update type display -->
   <div id="type-display-output" role="status" aria-live="polite" aria-atomic="true">
   
   <!-- Change script -->
   <script src="./js/GoatMinify.improved.js"></script>
   ```

4. **Test Everything**
   - Upload files
   - Download files
   - Copy to clipboard
   - All minification levels
   - Keyboard navigation
   - Screen reader (if available)

5. **Deploy**
   - Upload changed files
   - Clear browser cache
   - Monitor for errors

### Breaking Changes
- None. All changes are backward compatible.
- Original `GoatMinify.js` (v1.3.1) still works if you don't update the script tag.

### Deprecated Features
- None

---

## Contributors

- **Chase McGoat** - Original author and maintainer
- **Claude (Anthropic AI)** - Code review and improvements (v2.0.0)

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

### Libraries Used
- [highlight.js](https://github.com/highlightjs/highlight.js) - Syntax highlighting
- [CSSO](https://github.com/css/csso) - CSS optimizer
- [html-minifier-terser](https://github.com/terser/html-minifier-terser) - HTML minifier
- [Terser](https://github.com/terser/terser) - JavaScript minifier

### Development Tools
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

---

**For detailed information about specific changes, see:**
- Code Review: `.docs/Code-Review.md`
- Implementation Guide: `.docs/Implementation-Guide.md`
- Summary: `.docs/SUMMARY.md`
- Quick Reference: `.docs/QUICK-REFERENCE.md`

---

*Last Updated: 2025-11-18*
