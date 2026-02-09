import { defineConfig } from 'vite';

const isEmbed = process.env.EMBED === 'true';

export default defineConfig(isEmbed ? {
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/embed.js',
      name: 'HipsDiagram',
      fileName: () => 'hips-diagram.js',
      formats: ['iife'],
    },
  },
} : {
  base: '/hips-multi-hazard-diagram/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
