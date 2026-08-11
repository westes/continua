/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import yaml from '@rollup/plugin-yaml';

// Served under reground.org/vu (Caddy path_mount to the vu container) — every
// asset URL and the service worker's registration scope must be scoped to
// this path, or they'll resolve against the domain root instead.
const base = '/vu/';

export default defineConfig({
  base,
  plugins: [
    yaml(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: base,
      base,
      manifest: {
        name: 'vu',
        short_name: 'vu',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f7f3ea',
        theme_color: '#7a2e2e',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Precache everything the shell needs so a day's office renders
        // fully offline once visited once.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Default cap (2 MiB) is too small once the sanctoral pull's real
        // propers/octave-reading text (all eagerly bundled, by design, for
        // offline use) pushes the main chunk past it -- raised with
        // headroom for the octaves still being transcribed.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
