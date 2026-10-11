/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import yaml from '@rollup/plugin-yaml';
import { devGitInfoPlugin } from './vite-plugins/dev-git-info.ts';

// Served from the root of its own host, continua.reground.org (Caddy
// reverse_proxy to the continua container). It used to be path-mounted at
// reground.org/continua with base '/continua/'; the hub's Caddy now redirects
// that path here and replaces the old service worker with one that
// unregisters itself.
const base = '/';

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        // Split src/data/** into one chunk per top-level content
        // subdirectory (and one further level down for the largest,
        // propers/ and calendar/), separate from app code. Without this,
        // every data file lands in one ~18MB chunk keyed by a single
        // content hash, so editing one saint -- or even just bumping the
        // version string -- invalidates the whole thing and forces every
        // returning visitor's service worker to re-download the entire
        // bundle. Splitting by directory means a change only invalidates
        // the chunk(s) it actually touched; e.g. the ~13MB scripture
        // import stays cached across ordinary saint/proper edits.
        manualChunks(id) {
          const marker = '/src/data/';
          const idx = id.indexOf(marker);
          if (idx === -1) return undefined;
          const rel = id.slice(idx + marker.length);
          const [top, sub] = rel.split('/');
          if (!top) return undefined;
          if (top === 'propers' && sub) return `data-propers-${sub}`;
          if (top === 'calendar' && (sub === 'saints' || sub === 'temporal-feasts')) {
            return `data-calendar-${sub}`;
          }
          if (top === 'calendar') return 'data-calendar';
          if (top === 'hours') return 'data-hours';
          const [name] = top.split('.');
          return `data-${name}`;
        },
      },
    },
  },
  plugins: [
    yaml(),
    devGitInfoPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: base,
      base,
      manifest: {
        name: 'Continua',
        short_name: 'Continua',
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
        // Default cap (2 MiB) is too small for this project's eagerly
        // bundled offline content even after the manualChunks split above;
        // the largest single chunk (data-scripture) alone is ~10 MiB
        // (2026-09-11). Bump this, with headroom, if a future content pull
        // pushes any one chunk past it -- this is deliberate bundling, not
        // bloat to trim (see this project's design notes).
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
      },
    }),
  ],
  test: {
    // Only tests/ui exercises the DOM (opts into jsdom itself via a
    // `// @vitest-environment jsdom` docblock); jsdom setup is real
    // overhead so the other 48 files stay on the plain node environment.
    environment: 'node',
    globals: false,
    // Every test file re-imports the same large src/data/** YAML modules
    // (scripture/martyrology/propers alone are tens of MB); with isolate
    // left at its default, each of the 49 test files gets its own fresh
    // module registry and re-parses/re-transforms all of it from scratch.
    // Sharing the registry across files in a worker cuts that duplicated
    // work — safe here because these tests are pure functional resolution
    // over static data, not mutation of shared state (the one exception,
    // tests/ui/shell.test.ts, already resets app-state in beforeEach).
    isolate: false,
    // Worker threads share memory instead of forking a process per worker
    // (lower spawn/IPC overhead than the default 'forks' pool); safe given
    // isolate: false already accepts shared module state across files.
    pool: 'threads',
  },
});
