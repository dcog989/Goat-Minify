import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: '.',
    define: {
        global: 'globalThis',
        __filename: '""',
        __dirname: '""',
        'process.env': {},
        'process.cwd': '(() => "/")',
        'process.platform': '"browser"',
    },
    resolve: {
        alias: {
            // 1. Local Stubs
            'fs/promises': path.resolve(__dirname, 'js/modules/fs-stub.js'),
            fs: path.resolve(__dirname, 'js/modules/fs-stub.js'),
            url: path.resolve(__dirname, 'js/modules/url-stub.js'),

            // 2. Force Absolute Paths for Polyfills (Fixes "externalized" warnings)
            // Using path.resolve ensures Vite picks the installed package, not its internal stub.
            path: path.resolve(__dirname, 'node_modules/path-browserify'),
            util: path.resolve(__dirname, 'node_modules/util'),
            events: path.resolve(__dirname, 'node_modules/events'),
            process: path.resolve(__dirname, 'node_modules/process/browser.js'),
            buffer: path.resolve(__dirname, 'node_modules/buffer'),
            stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
            
            // 3. Library Specific Aliases
            'html-minifier-terser-bundle': path.resolve(__dirname, 'node_modules/html-minifier-terser/dist/htmlminifier.umd.bundle.min.js')
        }
    },
    build: {
        outDir: 'dist',
        minify: 'terser',
        rollupOptions: {
            input: {
                main: 'index.html',
            },
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