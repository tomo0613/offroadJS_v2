import { terser } from 'rollup-plugin-terser';

export default {
    input: 'build/_src_/main.js',
    output: {
        file: './bundle/main.js',
        format: 'esm',
    },
    plugins: [
        terser(),
    ],
};
