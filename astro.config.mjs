// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://illariooo.ru',
  vite: {
    plugins: [tailwindcss()],
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