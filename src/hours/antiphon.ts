import type { OccurringFeast } from '../calendar/types';
import { isAtLeast } from '../calendar/commemorations';

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
 * Only asks whether the day's *winning* feast (not a merely-commemorated
 * one) is Double-or-higher — a privileged Sunday with nothing occurring,
 * or a commemorated low-rank saint, both correctly return false here. A
 * Sunday being "privileged" doesn't by itself make this true; that's a
 * `TemporalCategory` question, not a `FeastClass` one.
 */
export function isDoubleOrHigher(occurring: OccurringFeast[]): boolean {
  const winner = occurring.find((feast) => !feast.commemorated);
  return winner ? isAtLeast(winner.rank, 'duplex') : false;
}
