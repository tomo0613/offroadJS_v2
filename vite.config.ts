import vite_react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vite_react(),
        devServer_crossOriginIsolation(),
    ],
    server: {
        open: true,
    },
});

function devServer_crossOriginIsolation(): Plugin {
    return {
        name: 'crossOrigin-server',
        apply: 'serve',
        configureServer({ middlewares }) {
            middlewares.use((req, res, next) => {
                res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                next();
            });
        },
    };
}
