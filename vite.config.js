import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        minify: 'terser',
        sourcemap: true,
        rollupOptions: {
            input: {
                main: 'index.html',
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    preview: {
        port: 8080,
    },
});