import { defineConfig, Plugin } from 'vite';

const INDEX = 'index.js';
const assetUrlRegExp = /assets\//g;

export default defineConfig({
    base: './',
    publicDir: 'assets',
    esbuild: {
        jsxInject: 'import React from "react"',
    },
    build: {
        rollupOptions: {
            output: {
                entryFileNames: '[name][hash].js',
                assetFileNames: 'static/[name]-[hash][extname]',
                chunkFileNames({ name, facadeModuleId }) {
                    if (!facadeModuleId && name.startsWith('vendor_')) {
                        return `vendor/${name.replace('vendor_', '')}-[hash].js`;
                    }
                    if (!facadeModuleId && name === 'vendor') {
                        return 'vendor/[name]-[hash].js';
                    }

                    if (name === INDEX && facadeModuleId) {
                        const folderName = facadeModuleId.replace(`/${INDEX}.js`, '').split('/').pop();

                        return `modules/${folderName}-[hash].js`;
                    }

                    return 'modules/[name]-[hash].js';
                },
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }
                    if (id.includes('react')) {
                        return 'vendor_react';
                    }
                    if (id.includes('cannon')) {
                        return 'vendor_cannon';
                    }
                    if (id.includes('three')) {
                        return 'vendor_three';
                    }

                    return 'vendor';
                },
            },
            plugins: [
                codeTransformPlugin(),
            ],
        },
        chunkSizeWarningLimit: 660,
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
