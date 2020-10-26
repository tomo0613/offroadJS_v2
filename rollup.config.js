import node_resolve from 'rollup-plugin-node-resolve';
import rollup_ts from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import typescript from 'typescript';

export default {
    input: 'src/main.ts',
    output: {
        file: './build/main.js',
        format: 'esm',
    },
    plugins: [
        rollup_ts({ typescript }),
        // node_resolve({ only: 'three' }),
        node_resolve({ only: ['three', 'cannon-es', 'cannon-es-debugger'] }),
        terser(),
    ],
};
