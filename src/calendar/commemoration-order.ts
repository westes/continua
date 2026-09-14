// Shared "most recent date first" ordering for a day's commemorations —
// user's own rule (2026-09-13): "you've got a list of things to
// commemorate. you do them from most recent to least recent." Replaces the
// previous fixed kind-based grouping (temporal-then-sanctoral-then-octave)
// in both calendar/day-label.ts (the header) and hours/resolve-common.ts's
// getDayCollects (the reading/collect list) — both now go through this one
// module so the two stay in sync by construction, not by convention (see
// TODO.md's old note on why that mattered).
//
// A separate module rather than living in commemorations.ts: octaves.ts
// itself imports from commemorations.ts (for compareFeastClass/
// minimumOutrightWinningRank), so a reverse import there would cycle.
import type { Commemoration, LiturgicalDay } from './types';
import { addDays } from './date-math';
import { activeOctavesFor } from './octaves';

const KIND_ORDER: Record<Commemoration['kind'], number> = {
  temporal: 0,
  sanctoral: 1,
  octave: 2,
};

/**
 * The real calendar date the office behind a commemoration actually
 * occurred/governs — every case below is derivable from fields already on
 * `Commemoration`/`LiturgicalDay`, no construction-site changes needed:
 *  - `temporal`: `day.date` normally; the one cross-day case
 *    (`commemorationOfDisplacedPredecessor`, calendar/vespers.ts) sets
 *    `c.name` and is always exactly the day before `day.date`.
 *  - `sanctoral`: `day.date` normally; `vespersNote` ('today'/'tomorrow',
 *    also calendar/vespers.ts) marks the two cross-day cases, -/+ one day.
 *  - `octave`: the octave's own start date, derived from
 *    `activeOctavesFor`'s `dayNumber` (1 on the octave's own first day).
 */
export function commemorationSortDate(day: LiturgicalDay, c: Commemoration): string {
  if (c.kind === 'temporal') {
    return c.name ? addDays(day.date, -1) : day.date;
  }
  if (c.kind === 'sanctoral') {
    if (c.vespersNote === 'today') return addDays(day.date, -1);
    if (c.vespersNote === 'tomorrow') return addDays(day.date, 1);
    return day.date;
  }
  const octave = activeOctavesFor(day.date).find((a) => a.id === c.id);
  return octave ? addDays(day.date, -(octave.dayNumber - 1)) : day.date;
}

/**
 * Comparator for `Array.prototype.sort`: most-recent-date-first, falling
 * back to the old kind order (temporal -> sanctoral -> octave) as a stable
 * tiebreak when two land on the same date — per user decision, 2026-09-13
 * (ties aren't meaningfully orderable by "recency" alone, so the previous
 * convention is kept rather than inventing a new one). Exported (alongside
 * `sortCommemorations` below) so a caller sorting some other array keyed by
 * `Commemoration` (e.g. day-label.ts's `{ c: Commemoration; bi: Bi }[]`)
 * can reuse the same ordering without going through plain `Commemoration[]`.
 */
export function compareCommemorations(day: LiturgicalDay, a: Commemoration, b: Commemoration): number {
  const dateA = commemorationSortDate(day, a);
  const dateB = commemorationSortDate(day, b);
  if (dateA !== dateB) {
    return dateA < dateB ? 1 : -1;
  }
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
}

/**
 * Sorts commemorations most-recent-date-first (see `compareCommemorations`).
 * Does not filter by kind — callers that want only a subset (e.g.
 * sanctoral-only) should filter before or after sorting; order is stable
 * either way since the comparator is total.
 */
export function sortCommemorations<T extends Commemoration>(day: LiturgicalDay, commemorations: T[]): T[] {
  return [...commemorations].sort((a, b) => compareCommemorations(day, a, b));
}
