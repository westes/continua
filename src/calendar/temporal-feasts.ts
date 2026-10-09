// The temporal-cycle sibling of calendar/feasts.ts's SaintRecord: a small
// metadata record for a *temporal* id (Christmas, Pentecost, ...) that
// needs to carry something beyond its collect text — so far, just whether
// it has an octave (calendar/types.ts's OctaveConfig). Most temporal ids
// don't need a record at all (they're just collect-text lookups via
// propers/index.ts's getTemporalProper); this only exists for the ones
// that do.
import type { FeastClass, OctaveConfig } from './types';
import { withRankOverride } from './rank-overrides';
import { dateForAnchor } from './anchors';

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
 * already covered by the ordinary Sunday lookup, and its octave start is
 * given by `octaveStart` on its record. */
export type MovableAnchor =
  | { kind: 'easter'; offset: number }
  | { kind: 'nth-sunday-of-month'; month: number; nth: number } // nth: 1-4, or -1 for "last"
  | { kind: 'nth-sunday-of-advent'; nth: number } // nth: 1-4 (Advent always has exactly 4 Sundays)
  | { kind: 'fixed-date'; month: number; day: number }; // a plain civil-calendar date, not itself Easter- or Advent-anchored (e.g. the Circumcision, Jan 1)

export interface TemporalFeastRecord {
  id: string;
  name: string;
  /** Latin form of `name`, when authored — see calendar/types.ts's
   * `SanctoralIdentity.nameLa` doc comment for the display fallback. */
  nameLa?: string;
  /** Short form of `name` for the browser tab title only — see
   * `calendar/feasts.ts`'s `SaintRecord.titleName` doc comment for the
   * full rationale (same field, same fallback chain, just the temporal-
   * feast side — e.g. `sacred-heart.yml`'s "The Most Sacred Heart of Our
   * Lord Jesus Christ" → "Sacred Heart"). */
  titleName?: string;
  /** Latin form of `titleName`, when authored. */
  titleNameLa?: string;
  octave?: OctaveConfig;
  /** Another office id whose authored Lauds/Vespers/minor-hour content this
   * feast shares where it has none of its own (the days of Easter week share
   * Easter Sunday's psalm antiphons, chapters and responsories). Used by
   * hours/office-source.ts's `sharedOfficeId`. */
  officeFrom?: string;
  /** Parts this feast deliberately has none of (`lauds-responsory`, ...),
   * so the lookup returns nothing instead of falling to a shared office. */
  noParts?: string[];
  /** The id this feast displaces on its own day is only the governing-week
   * catch-all (no office of its own): don't commemorate it (see
   * calendar/movable-feasts.ts). */
  suppressDisplacedCommemoration?: boolean;
  rank?: FeastClass;
  anchor?: MovableAnchor;
  /** Where this feast's octave begins, for a feast with an `octave` but no
   * `anchor` (Pentecost is already found by the ordinary Sunday lookup;
   * Christmas is a plain fixed date) -- giving either an `anchor` would
   * make calendar/movable-feasts.ts treat it as a movable feast too. A
   * feast with an `anchor` starts its octave there and needs no
   * `octaveStart`. */
  octaveStart?: MovableAnchor;
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
  const feast = temporalFeastsById.get(id);
  return feast && withRankOverride(feast);
}

/** Every temporal feast record carrying its own `anchor` -- the table
 * calendar/movable-feasts.ts's applyMovableFeasts scans. Adding a new
 * movable feast (an Ember/Rogation day, a Sacred-Heart-family Marian
 * feast, a Lenten Friday devotion, ...) is just a new
 * `data/calendar/temporal-feasts/<id>.yml` file with `rank` and `anchor`
 * set -- no new code. */
export function movableTemporalFeasts(): TemporalFeastRecord[] {
  return [...temporalFeastsById.values()].filter((f) => f.anchor !== undefined).map(withRankOverride);
}

/** Which temporal feast(s), if any, have their own (day-1) octave start on this date. */
export function temporalFeastIdsStartingOn(isoDate: string): string[] {
  const year = Number(isoDate.slice(0, 4));
  const ids: string[] = [];
  for (const feast of temporalFeastsById.values()) {
    const start = feast.anchor ?? feast.octaveStart;
    if (feast.octave?.enabled && start && dateForAnchor(year, start) === isoDate) {
      ids.push(feast.id);
    }
  }
  return ids;
}
