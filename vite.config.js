import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify as minifyHtml } from 'html-minifier-terser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: '.',
    define: {
        // Fix ReferenceError: __filename/global is not defined
        // process is now handled in index.html
        global: 'globalThis',
        __filename: '""',
        __dirname: '""',
    },
    plugins: [
        {
            name: 'minify-index-html',
            enforce: 'post',
            async transformIndexHtml(html) {
                return await minifyHtml(html, {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                    minifyCSS: true,
                    minifyJS: true
                });
            }
        }
    ],
    resolve: {
        alias: {
            // 1. Internal Alias for the real URL package
            'original-url': path.resolve(__dirname, 'node_modules/url'),

            // 2. Node Stubs/Polyfills
            'fs/promises': path.resolve(__dirname, 'js/modules/fs-stub.js'),
            fs: path.resolve(__dirname, 'js/modules/fs-stub.js'),
            url: path.resolve(__dirname, 'js/modules/url-stub.js'),
            os: path.resolve(__dirname, 'js/modules/os-stub.js'),
            
            // 3. Force Absolute Paths for Polyfills
            path: path.resolve(__dirname, 'node_modules/path-browserify'),
            util: path.resolve(__dirname, 'node_modules/util'),
            events: path.resolve(__dirname, 'node_modules/events'),
            process: path.resolve(__dirname, 'node_modules/process/browser.js'),
            buffer: path.resolve(__dirname, 'node_modules/buffer'),
            stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
            
            // 4. Library Specific Aliases
            'html-minifier-terser-bundle': path.resolve(__dirname, 'node_modules/html-minifier-terser/dist/htmlminifier.umd.bundle.min.js')
        }
    },
    build: {
        outDir: 'dist',
        minify: 'terser',
        chunkSizeWarningLimit: 4000,
        rollupOptions: {
            input: {
                main: 'index.html',
            },
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/highlight.js')) return 'vendor-highlight';
                    if (id.includes('node_modules/terser')) return 'vendor-terser';
                    if (id.includes('node_modules/postcss') || id.includes('node_modules/cssnano')) return 'vendor-postcss';
                    if (id.includes('node_modules/html-minifier-terser')) return 'vendor-htmlmin';
                }
            }
        },
        commonjsOptions: {
            transformMixedEsModules: true,
            include: [/node_modules/]
        }
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        },
        include: [
            'buffer', 
            'process', 
            'util', 
            'events', 
            'path-browserify', 
            'stream-browserify',
            'source-map-js',
            'postcss',
            'cssnano',
            'terser',
            'html-minifier-terser'
        ]
    },
    server: {
        port: 3000,
        open: true,
    },
    preview: {
        port: 8080,
    },
});