import { defineConfig, mergeConfig } from 'vitest/config';
import base from './vite.config';

// Separate config so the year-wide snapshot (tools/snapshot.snap.ts) never
// runs under `npm test`.
export default mergeConfig(base, defineConfig({ test: { include: ['tools/**/*.snap.ts'] } }));
