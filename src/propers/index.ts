import type { ProperText } from './types';
import { properEntries } from './store';

// Every Common's, feast's and season's texts load through ./store.ts. The old
// separate "temporal" store survives as a flag on the entry, because
// getTemporalProper reads only what was authored there.
const commonPropers = new Map<string, ProperText>();
const temporalPropers = new Map<string, ProperText>();
for (const [id, { temporal, ...proper }] of properEntries) {
  (temporal ? temporalPropers : commonPropers).set(id, proper);
}

function resolve(store: Map<string, ProperText>, id: string): ProperText {
  const proper = store.get(id);
  if (proper) {
    return proper;
  }
  // Same "resolve as pending" convention as psalm/martyrology/regula lookups
  // — an unauthored id isn't a bug, it's content waiting to be written.
  return { id, text: {}, status: { la: 'missing', en: 'missing' } };
}

export function getCommonProper(id: string): ProperText {
  // Ids are unique across both stores; a temporal proper (an Advent week's
  // Benedictus antiphon...) is found through the same lookup as a Common's.
  const temporal = commonPropers.has(id) ? undefined : temporalPropers.get(id);
  return temporal ?? resolve(commonPropers, id);
}

/**
 * Temporal propers (currently: Sunday collects only — see
 * the entries of data/<lang>/propers/*.yml flagged `temporal`) are keyed Pentecost/offset-based
 * ("post-pentecost-N-collect"), not Trinity-counted — that's a display
 * choice that lives in calendar/day-label.ts, not a content-storage
 * concern. See that file's header for the full id scheme.
 */
export function getTemporalProper(id: string): ProperText {
  return resolve(temporalPropers, id);
}

export { getOctaveReading } from './octave-readings';
export type { ProperText } from './types';
export type { OctaveReadingText } from './octave-readings';
