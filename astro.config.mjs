// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://illariooo.ru',
  output: 'static',
  compressHTML: true,
  build: {
    // CRITICAL FCP: Inline all CSS to prevent render-blocking
    // Small CSS files are inlined, large ones are loaded asynchronously by Astro
    inlineStylesheets: 'auto', // Auto-inline small CSS (<4KB), larger ones remain external but optimized
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
          // OPTIMIZED: Additional dead code elimination for bundle size
          dead_code: true, // Remove unreachable code
          unused: true, // Remove unused variables and functions
          passes: 2, // Multiple passes for better optimization
          pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console calls
        },
        mangle: {
          // OPTIMIZED: Mangle variable names for smaller bundle size
          toplevel: false, // Keep top-level names for debugging
        },
      },
      rollupOptions: {
        // OPTIMIZED: Tree shaking configuration for better dead code elimination
        treeshake: {
          moduleSideEffects: false, // Assume no side effects for better tree shaking
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        output: {
          // OPTIMIZED: Manual chunks for better code splitting and TTI
          // Separate vendor libraries, page-specific code, and shared utilities
          manualChunks(id) {
            // Vendor libraries - separate chunk for better caching
            if (id.includes('node_modules')) {
              // Keep node_modules together for better caching
              return 'vendor';
            }
            
            // Page-specific code - separate chunks per page
            if (id.includes('/pages/index.astro')) {
              return 'index';
            }
            if (id.includes('/pages/how-it-works.astro')) {
              return 'how-it-works';
            }
            
            // Shared utilities - separate chunk
            if (id.includes('/lib/reveal')) {
              return 'reveal';
            }
            if (id.includes('/lib/')) {
              return 'lib';
            }
            
            // Default: let Vite handle the rest
            return null;
          },
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