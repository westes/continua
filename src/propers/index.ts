import type { ProperText } from './types';

// "common" and "temporal" propers stores exist; "sanctoral" propers text
// (as opposed to calendar/feasts.ts's rank/name metadata) doesn't yet —
// none of the 7 saints in data/calendar/saints/*.yml have real collect
// text authored (all `propers: null`).
const commonModules = import.meta.glob<{ default: ProperText }>('../data/propers/common/*.yml', {
  eager: true,
});
const temporalModules = import.meta.glob<{ default: ProperText }>('../data/propers/temporal/*.yml', {
  eager: true,
});

function toMap(modules: Record<string, { default: ProperText }>): Map<string, ProperText> {
  const map = new Map<string, ProperText>();
  for (const mod of Object.values(modules)) {
    map.set(mod.default.id, mod.default);
  }
  return map;
}

const commonPropers = toMap(commonModules);
const temporalPropers = toMap(temporalModules);

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
  return resolve(commonPropers, id);
}

/**
 * Temporal propers (currently: Sunday collects only — see
 * data/propers/temporal/*.yml) are keyed Pentecost/offset-based
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
