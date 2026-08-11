// The temporal-cycle sibling of calendar/feasts.ts's SaintRecord: a small
// metadata record for a *temporal* id (Christmas, Pentecost, ...) that
// needs to carry something beyond its collect text — so far, just whether
// it has an octave (calendar/types.ts's OctaveConfig). Most temporal ids
// don't need a record at all (they're just collect-text lookups via
// propers/index.ts's getTemporalProper); this only exists for the ones
// that do.
import type { OctaveConfig } from './types';
import { easterOffsetOf } from './temporal';

export interface TemporalFeastRecord {
  id: string;
  name: string;
  octave?: OctaveConfig;
}

const temporalFeastModules = import.meta.glob<{ default: TemporalFeastRecord }>(
  '../data/calendar/temporal-feasts/*.yml',
  { eager: true },
);

const temporalFeastsById = new Map<string, TemporalFeastRecord>();
for (const mod of Object.values(temporalFeastModules)) {
  temporalFeastsById.set(mod.default.id, mod.default);
}

export function getTemporalFeastRecord(id: string): TemporalFeastRecord | undefined {
  return temporalFeastsById.get(id);
}

/** Fixed-calendar-date starts (MM-DD -> temporal feast id). Only Christmas
 * so far; Epiphany/Candlemas would join here if they ever needed an
 * octave modeled too. */
const FIXED_DATE_STARTS: [string, string][] = [['12-25', 'christmas-day']];

/** Easter-offset starts (offset -> temporal feast id). */
const EASTER_OFFSET_STARTS: [number, string][] = [[49, 'pentecost-sunday']];

/** Which temporal feast(s), if any, have their own (day-1) octave start on this date. */
export function temporalFeastIdsStartingOn(isoDate: string): string[] {
  const monthDay = isoDate.slice(5);
  const ids: string[] = [];
  for (const [md, id] of FIXED_DATE_STARTS) {
    if (md === monthDay) ids.push(id);
  }
  const offset = easterOffsetOf(isoDate);
  for (const [off, id] of EASTER_OFFSET_STARTS) {
    if (off === offset) ids.push(id);
  }
  return ids;
}
