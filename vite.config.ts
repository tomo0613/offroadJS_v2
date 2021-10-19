import vite_react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vite_react(),
    ],
    server: {
        open: true,
    },
});
