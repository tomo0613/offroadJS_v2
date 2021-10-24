import { defineConfig, Plugin } from 'vite';

const assetUrlRegExp = /assets\//g;

export default defineConfig({
    publicDir: 'assets',
    esbuild: {
        jsxInject: 'import React from "react"',
    },
    build: {
        rollupOptions: {
            output: {
                entryFileNames: 'esm/[name][hash].js',
                chunkFileNames: 'esm/[name][hash].js',
                assetFileNames: 'static/[name]-[hash][extname]',
                manualChunks: {
                    react: ['react', 'react-dom'],
                    three: ['three'],
                    cannon: ['cannon-es'],
                },
            },
            plugins: [
                codeTransformPlugin(),
            ],
        },
        chunkSizeWarningLimit: 550,
    },
});

function codeTransformPlugin(): Plugin {
    return {
        name: 'code-transform',
        transform(code) {
            return code.replace(assetUrlRegExp, '');
        },
    };
}
