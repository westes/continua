import type { OccurringFeast } from '../calendar/types';

export interface SplitAntiphon {
  incipit: string;
  full: string;
}

/**
 * Antiphon text is stored as one string with an embedded "*" marking where
 * the incipit (the "half antiphon") ends — the same convention Divinum
 * Officium's own data uses, so no separate half/full fields are needed.
 *
 * The "*" is kept in `full` (by explicit choice — it's a meaningful chant
 * mark, not just an incipit-boundary artifact, even though the reference
 * engine's own rendering happens to strip it there).
 */
export function splitAntiphon(text: string): SplitAntiphon {
  const starIndex = text.indexOf('*');
  if (starIndex === -1) {
    return { incipit: text, full: text };
  }
  const before = text.slice(0, starIndex).trim();
  const after = text.slice(starIndex + 1).trim();
  return { incipit: before.replace(/,$/, '.'), full: `${before} * ${after}` };
}

/**
 * Real practice: the antiphon is said in full both before and after the
 * psalms on a Double-rank feast or higher; below that, only the incipit is
 * said before the psalms (the full text is always said after, regardless
 * of rank).
 *
 * FeastRank is an open string with no defined hierarchy yet (see
 * calendar/types.ts), and `occurring` is always [] until milestone 4 wires
 * up real feast data — so this can only ever return false today. That's
 * the *correct* answer for every day currently reachable (a plain ferial
 * day is below Double), not a stub papering over missing logic; it starts
 * doing real work the moment FeastRank has an ordering to compare against.
 */
export function isDoubleOrHigher(_occurring: OccurringFeast[]): boolean {
  return false;
}
