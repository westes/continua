// The temporal-cycle sibling of calendar/feasts.ts's SaintRecord: a small
// metadata record for a *temporal* id (Christmas, Pentecost, ...) that
// needs to carry something beyond its collect text — so far, just whether
// it has an octave (calendar/types.ts's OctaveConfig). Most temporal ids
// don't need a record at all (they're just collect-text lookups via
// propers/index.ts's getTemporalProper); this only exists for the ones
// that do.
import type { FeastClass, OctaveConfig } from './types';
import { easterOffsetOf } from './temporal';

/** How to compute a movable feast's own date each year, for a feast that
 * ISN'T itself a Sunday (or, for `unconditional` feasts like Christ the
 * King, one whose occurrence rule is simpler to express as "always wins
 * outright" than as an ordinary rank contest) -- see
 * calendar/movable-feasts.ts, which is the only consumer of this.
 * `resolveTemporalId`'s own Easter-offset resolution only ever finds one
 * of the 52 canonical *Sunday* ids (it works by finding the governing
 * Sunday on-or-before a date, then looking that Sunday's own offset up);
 * none of these three anchor kinds are reachable through that lookup no
 * matter what, so they need this separate mechanism instead. A feast
 * that *is* a Sunday itself (Pentecost) doesn't need this at all -- it's
 * already covered by the ordinary Sunday lookup, and by
 * EASTER_OFFSET_STARTS below if it also has an octave to start. */
export type MovableAnchor =
  | { kind: 'easter'; offset: number }
  | { kind: 'nth-sunday-of-month'; month: number; nth: number } // nth: 1-4, or -1 for "last"
  | { kind: 'nth-sunday-of-advent'; nth: number }; // nth: 1-4 (Advent always has exactly 4 Sundays)

export interface TemporalFeastRecord {
  id: string;
  name: string;
  octave?: OctaveConfig;
  rank?: FeastClass;
  anchor?: MovableAnchor;
  /** Christ the King's own rule: always wins the day outright, no rank
   * contest at all (see calendar/movable-feasts.ts's applyMovableFeasts) --
   * every other movable feast instead loses to an equal-or-higher-ranked
   * sanctoral winner and is commemorated alongside it instead. */
  unconditional?: boolean;
  /** The temporal-feast sibling of calendar/feasts.ts's SaintRecord field
   * of the same name -- see that field's own doc comment for the full
   * rationale (a feast-side mirror of the day-side privilege
   * calendar/commemorations.ts already models, deliberately a flag
   * rather than a ported rank-threshold formula). Set on sacred-heart.yml
   * specifically -- live source (horascommon.pl, github #4586): on the
   * rare late-Easter date the movable Feast of the Sacred Heart falls the
   * day immediately before the fixed Most Precious Blood (July 1), Sacred
   * Heart's own kept Second Vespers explicitly does *not* commemorate
   * Precious Blood the next evening ("Vespera de præcedenti; nihil de
   * sequenti") -- the reverse direction (Precious Blood's own Vespers
   * commemorating a Sacred Heart that falls *after* it, the other rare
   * late-Easter arrangement) has no such carve-out in the reference
   * engine, so this flag is intentionally one-directional, not mirrored
   * onto most-precious-blood.yml. */
  forbidsSuccessorCommemoration?: true;
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

/** Every temporal feast record carrying its own `anchor` -- the table
 * calendar/movable-feasts.ts's applyMovableFeasts scans. Adding a new
 * movable feast (an Ember/Rogation day, a Sacred-Heart-family Marian
 * feast, a Lenten Friday devotion, ...) is just a new
 * `data/calendar/temporal-feasts/<id>.yml` file with `rank` and `anchor`
 * set -- no new code. */
export function movableTemporalFeasts(): TemporalFeastRecord[] {
  return [...temporalFeastsById.values()].filter((f) => f.anchor !== undefined);
}

/** Fixed-calendar-date starts (MM-DD -> temporal feast id). Only Christmas
 * so far; Epiphany/Candlemas would join here if they ever needed an
 * octave modeled too. */
const FIXED_DATE_STARTS: [string, string][] = [['12-25', 'christmas-day']];

/** Easter-offset starts (offset -> temporal feast id). */
const EASTER_OFFSET_STARTS: [number, string][] = [
  [39, 'ascension'],
  [49, 'pentecost-sunday'],
  [60, 'corpus-christi'],
  [68, 'sacred-heart'],
];

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
