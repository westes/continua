// Dumps every hour's resolved ordo for a span of years to a JSON file, so a
// refactor of the hour resolvers can be checked by diffing before/after
// (scripts/snapshot-diff.mjs). Not part of `npm test` -- run with:
//   SNAP_OUT=/path/before.json npm run snapshot
// Optional: SNAP_YEARS=2026,2027 (default).
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolveOrdo } from '../src/hours';
import { HOUR_IDS } from '../src/hours/types';

it('snapshot', () => {
  const out = process.env.SNAP_OUT;
  if (!out) throw new Error('SNAP_OUT is required');
  const years = (process.env.SNAP_YEARS ?? '2026,2027').split(',').map(Number);
  const snap: Record<string, string> = {};
  for (const year of years) {
    for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
      const date = d.toISOString().slice(0, 10);
      for (const hour of HOUR_IDS) {
        try {
          snap[`${date}/${hour}`] = JSON.stringify(resolveOrdo(hour, date));
        } catch (e) {
          snap[`${date}/${hour}`] = `ERR ${(e as Error).message}`;
        }
      }
    }
  }
  writeFileSync(out, JSON.stringify(snap));
}, 900000);
