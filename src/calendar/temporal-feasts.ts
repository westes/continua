// The temporal-cycle sibling of calendar/feasts.ts's SaintRecord: a small
// metadata record for a *temporal* id (Christmas, Pentecost, ...) that
// needs to carry something beyond its collect text — so far, just whether
// it has an octave (calendar/types.ts's OctaveConfig). Most temporal ids
// don't need a record at all (they're just collect-text lookups via
// propers/index.ts's getTemporalProper); this only exists for the ones
// that do.
import type { FeastClass, OctaveConfig } from './types';
import { easterOffsetOf } from './temporal';

export interface TemporalFeastRecord {
  id: string;
  name: string;
  octave?: OctaveConfig;
  rank?: FeastClass;
  /** Days from Easter Sunday (0) this feast's own date falls on, for a
   * feast that ISN'T itself a Sunday -- see calendar/movable-feasts.ts.
   * `resolveTemporalId`'s own Easter-offset resolution only ever finds
   * one of the 52 canonical *Sunday* ids (it works by finding the
   * governing Sunday on-or-before a date, then looking that Sunday's own
   * offset up); a weekday-anchored feast like Immaculate Heart of Mary
   * (Easter+69, always a Saturday) is invisible to that lookup no matter
   * what, so it needs this separate field plus calendar/movable-feasts.ts's
   * own override pass instead. A feast that *is* a Sunday (Pentecost)
   * doesn't need this at all -- it's already covered by the ordinary
   * Sunday lookup, and by EASTER_OFFSET_STARTS below if it also has an
   * octave to start. */
  easterOffset?: number;
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

/** Every temporal feast record carrying its own `easterOffset` -- the
 * table calendar/movable-feasts.ts's applyMovableFeasts scans. Adding a
 * new weekday-anchored movable feast (an Ember/Rogation day, a Sacred-
 * Heart-family Marian feast, a Lenten Friday devotion, ...) is just a new
 * `data/calendar/temporal-feasts/<id>.yml` file with `rank` and
 * `easterOffset` set -- no new code. */
export function movableTemporalFeasts(): TemporalFeastRecord[] {
  return [...temporalFeastsById.values()].filter((f) => f.easterOffset !== undefined);
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
