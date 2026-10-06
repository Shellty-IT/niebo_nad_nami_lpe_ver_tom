import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default ['entry', 'editor', 'ephemeris.worker'].map((name) => ({
  input: name === 'ephemeris.worker' ? 'src/workers/ephemeris.worker.ts' : `src/hosts/zpe/${name}.ts`,
  plugins: [nodeResolve({ browser: true }), json(), typescript({ noEmit: false, declaration: false, include: ['src/**/*.ts'] })],
  output: {
    file: `dist/zpe-engine/${name}.js`,
    format: name === 'ephemeris.worker' ? 'iife' : 'amd',
    exports: name === 'ephemeris.worker' ? 'auto' : 'default',
    generatedCode: 'es5',
    inlineDynamicImports: true,
  },
  onwarn(warning, warn) {
    if (warning.code === 'UNRESOLVED_IMPORT') throw new Error(warning.message);
    warn(warning);
  },
}));
