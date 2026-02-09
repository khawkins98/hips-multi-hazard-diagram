import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hips-multi-hazard-diagram/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
