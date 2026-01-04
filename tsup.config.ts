import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: 'esm', // ESM
  target: 'es2022',
  platform: 'node',
  clean: true,
  sourcemap: true,
  minify: false,
  bundle: false, // kluczowe – zachowuje strukturę
  splitting: false,
  treeshake: false,
  outExtension: () => ({ js: '.mjs' }), // pliki wyjściowe jako .mjs
});
