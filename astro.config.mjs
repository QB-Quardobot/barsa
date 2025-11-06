// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://illariooo.ru',
  output: 'static',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto', // Auto-inline small CSS
    assets: '_assets',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true, // Split CSS for better caching
      minify: 'terser', // Use terser for better minification
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: undefined, // Let Vite handle chunking automatically
        },
      },
    },
    server: {
      host: true,
      allowedHosts: [
        '.trycloudflare.com',
        '.ngrok.io',
        '.localhost'
      ]
    }
  }
});