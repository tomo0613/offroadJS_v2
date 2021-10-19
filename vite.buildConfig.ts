import { nodeResolve as rollup_nodeResolve } from '@rollup/plugin-node-resolve';
import rollup_html from '@web/rollup-plugin-html';
import FileSystem from 'fs-extra';
import { defineConfig, Plugin } from 'vite';

const tscBuildDir = 'tsc_build';
const distDir = 'dist';

export default defineConfig({
    build: {
        rollupOptions: {
            input: `./${tscBuildDir}/index.html`,
            plugins: [
                buildPlugin(),
                rollup_html(),
                rollup_nodeResolve(),
            ],
        },
        // chunkSizeWarningLimit: 900,
    },
});

function buildPlugin(): Plugin {
    return {
        name: 'build',
        options: async (options) => {
            await addStaticFilesToBuildDir();

            return options;
        },
        closeBundle: async () => {
            await FileSystem.copy('./assets', `./${distDir}/assets`);
        },
    };
}

async function addStaticFilesToBuildDir() {
    await Promise.all([
        copyIndexHtml(),
        FileSystem.copy('./assets', `./${tscBuildDir}/assets`),
        FileSystem.copy('./style', `./${tscBuildDir}/style`),
    ]);
}

async function copyIndexHtml() {
    try {
        const htmlContent = await FileSystem.readFile('./index.html');
        let indexHtmlContent = htmlContent.toString();

        indexHtmlContent = indexHtmlContent.replace('./src/main.ts', './main.js');

        await FileSystem.writeFile(`./${tscBuildDir}/index.html`, indexHtmlContent);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
    }
}
