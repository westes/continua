// Precedence/occurrence resolution: given a day's temporal-cycle standing
// (calendar/types.ts's TemporalCategory) and a candidate sanctoral feast (if
// any), which one is actually kept, and whether the loser is commemorated.
//
// Modeled as explicit rules per category, not a numeric-weight comparison
// like the reference engine's occurrence()/concurrence() — see
// data/calendar/temporal-categories.yml's header for why. The thresholds
// below are a best-effort reconstruction of the pre-1955 tradition (partly
// grounded in General Rubrics §15/§16/§23, though that document is itself a
// later, differently-numbered edition — see that file's header), not
// verified against a primary source for this exact era. Expect corrections.

import type { FeastClass, TemporalCategory } from './types';

const FEAST_CLASS_ORDER: FeastClass[] = [
  'simplex',
  'semiduplex',
  'duplex',
  'duplex-majus',
  'duplex-2-classis',
  'duplex-1-classis',
];

export function compareFeastClass(a: FeastClass, b: FeastClass): number {
  return FEAST_CLASS_ORDER.indexOf(a) - FEAST_CLASS_ORDER.indexOf(b);
}

export function isAtLeast(rank: FeastClass, threshold: FeastClass): boolean {
  return compareFeastClass(rank, threshold) >= 0;
}

export interface OccurrenceResult {
  winner: 'temporal' | 'sanctoral';
  commemorated: boolean;
}

/**
 * `sanctoral === null` means no feast is assigned to this date at all —
 * temporal wins trivially, nothing to decide.
 */
export function decideOccurrence(temporal: TemporalCategory, sanctoral: FeastClass | null): OccurrenceResult {
  if (!sanctoral) {
    return { winner: 'temporal', commemorated: false };
  }

  switch (temporal) {
    case 'ordinary-feria':
      // An ordinary feria has no standing of its own to defend — any real
      // feast, however low-ranked, is kept in its place.
      return { winner: 'sanctoral', commemorated: false };

    case 'privileged-feria':
      // "These ferias are preferred to any feasts whatsoever, and they
      // admit of no commemoration, except one of the privileged class"
      // (General Rubrics §23) — read here as: only the very highest class
      // even gets a mention.
      return { winner: 'temporal', commemorated: isAtLeast(sanctoral, 'duplex-1-classis') };

    case 'ordinary-sunday':
      // An ordinary Sunday yields outright only to the highest class; a
      // Double of the 2nd Class or a Greater Double is kept as a
      // commemoration instead of displacing the Sunday; anything lower
      // isn't even mentioned.
      if (isAtLeast(sanctoral, 'duplex-1-classis')) {
        return { winner: 'sanctoral', commemorated: false };
      }
      return { winner: 'temporal', commemorated: isAtLeast(sanctoral, 'duplex-majus') };

    case 'privileged-sunday':
      // "A Sunday of the 1st class is preferred to any feast whatsoever"
      // (General Rubrics §15) — never displaced; commemorated only if the
      // feast is otherwise of the very top ranks.
      return { winner: 'temporal', commemorated: isAtLeast(sanctoral, 'duplex-2-classis') };
  }
}
