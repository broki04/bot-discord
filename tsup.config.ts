import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  outDir: 'dist',
  format: 'esm',
  minify: true,
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // @ts-expect-error
  preserveStructure: true,
});
