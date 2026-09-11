/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import yaml from '@rollup/plugin-yaml';

// Served under reground.org/continua (Caddy path_mount to the continua
// container) — every asset URL and the service worker's registration scope
// must be scoped to this path, or they'll resolve against the domain root
// instead.
const base = '/continua/';

// App version, read from git tags rather than package.json's version field
// -- the CI release step (.gitea/workflows/deploy.yml) tags releases
// directly from conventional-commit history and never touches
// package.json, so a tag is the actual source of truth. Two forms are
// exposed: the bare nearest tag (what prod shows -- no "how many commits
// since the last real version bump" noise a user has no reason to care
// about) and the full `git describe` (what dev shows, since knowing exactly
// which commit is running is the whole point there). Wrapped in try/catch
// so a shallow/tagless checkout (a fresh clone, or CI before the very first
// `v1.0.0` tag exists) still builds instead of failing outright.
function gitCommand(command: string, fallback: string): string {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}
const appVersion = gitCommand('git describe --tags --abbrev=0', 'v0.0.0-dev');
const appVersionFull = gitCommand('git describe --tags --always --dirty', 'v0.0.0-dev');
const appVersionDate = gitCommand(`git log -1 --format=%cI ${appVersion}`, new Date().toISOString());

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_VERSION_FULL__: JSON.stringify(appVersionFull),
    __APP_VERSION_DATE__: JSON.stringify(appVersionDate),
  },
  plugins: [
    yaml(),
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
        // Default cap (2 MiB) is too small once the sanctoral pull's real
        // propers/octave-reading text (all eagerly bundled, by design, for
        // offline use) pushes the main chunk past it -- raised again
        // (2026-08-28, was 6 MiB) once the movable-octave content (Ascension/
        // Corpus Christi/Sacred Heart/Patronage of St. Joseph) pushed the
        // bundle past the previous cap, then again (2026-09-02, was 8 MiB)
        // once the bulk Vulgate/Douay-Rheims scripture import (~1000 new
        // chapters under src/data/scripture/) pushed it past 16 MiB. Bump
        // this again, with headroom, if a future content pull hits it --
        // this is deliberate bundling, not bloat to trim (see this project's design notes).
        maximumFileSizeToCacheInBytes: 24 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
