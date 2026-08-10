// Precedence/occurrence resolution: given a day's temporal-cycle standing
// (calendar/types.ts's TemporalCategory) and a candidate sanctoral feast (if
// any), which one is actually kept, what (if anything) is commemorated
// alongside it, and whether the candidate needs to be transferred to an
// adjacent day instead (see calendar/transfer.ts for what actually happens
// with that signal).
//
// Modeled as explicit rules per category, not a numeric-weight comparison
// like the reference engine's occurrence()/concurrence() — see
// data/calendar/temporal-categories.yml's header for why. Verified in part
// against real dates (the Sunday-vs-Duplex threshold below was corrected
// after finding St. Anthony Abbot, plain Duplex, outright winning against
// an ordinary Sunday in the real Monastic 1617 engine — a genuine
// correction, not a guess); the rest is the result of a design discussion,
// not yet independently verified against a primary source.

import type { Commemoration, DayWinner, FeastClass, SanctoralIdentity, TemporalCategory } from './types';

const FEAST_CLASS_ORDER: FeastClass[] = [
  'simplex',
  'vigil',
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

/** Vigils belong to the day *before* their feast, so an impeded vigil is
 * shifted backward rather than forward like everything else — see
 * calendar/transfer.ts. */
function transferDirectionOf(rank: FeastClass): 'forward' | 'backward' {
  return rank === 'vigil' ? 'backward' : 'forward';
}

export interface OccurrenceResult {
  /** This day's own resolution, with the candidate absent if it's being transferred. */
  winner: DayWinner;
  commemorations: Commemoration[];
  /** Set when `sanctoral` doesn't win or get commemorated here at all — it
   * needs to be resolved against an adjacent day instead. */
  transfer?: { candidate: SanctoralIdentity; direction: 'forward' | 'backward' };
}

function sanctoralCommemoration(candidate: SanctoralIdentity): Commemoration {
  return { kind: 'sanctoral', id: candidate.id, name: candidate.name, rank: candidate.rank };
}

function sanctoralWinner(candidate: SanctoralIdentity): DayWinner {
  return { kind: 'sanctoral', id: candidate.id, name: candidate.name, rank: candidate.rank };
}

/**
 * `temporalId` is this day's own temporal-propers id (see
 * calendar/temporal-id.ts) — needed so a temporal winner or commemoration
 * can actually be looked up later (`propers.getTemporalProper`), not just
 * named "temporal" in the abstract.
 */
export function decideOccurrence(
  temporal: TemporalCategory,
  temporalId: string,
  sanctoral: SanctoralIdentity | null,
): OccurrenceResult {
  const temporalWinner: DayWinner = { kind: 'temporal', id: temporalId };
  if (!sanctoral) {
    return { winner: temporalWinner, commemorations: [] };
  }

  switch (temporal) {
    case 'ordinary-feria':
      // An ordinary feria has no standing of its own to defend — any real
      // feast, however low-ranked, is kept in its place.
      return { winner: sanctoralWinner(sanctoral), commemorations: [] };

    case 'privileged-feria':
      // Preferred to any feast whatsoever; admits no commemoration except
      // one of the very highest class.
      return {
        winner: temporalWinner,
        commemorations: isAtLeast(sanctoral.rank, 'duplex-1-classis') ? [sanctoralCommemoration(sanctoral)] : [],
      };

    case 'ordinary-sunday':
      if (isAtLeast(sanctoral.rank, 'duplex')) {
        // Duplex+ wins outright; the Sunday itself is commemorated in return.
        return { winner: sanctoralWinner(sanctoral), commemorations: [{ kind: 'temporal', id: temporalId }] };
      }
      if (sanctoral.rank === 'simplex') {
        // Too minor to warrant its own day, but a plain commemoration
        // doesn't cheapen it the way it would a Semiduplex.
        return { winner: temporalWinner, commemorations: [sanctoralCommemoration(sanctoral)] };
      }
      // Semiduplex or Vigil: no room here at all, in either direction —
      // better to preserve the feast whole on another day than downgrade
      // it to a bare commemoration.
      return {
        winner: temporalWinner,
        commemorations: [],
        transfer: { candidate: sanctoral, direction: transferDirectionOf(sanctoral.rank) },
      };

    case 'privileged-sunday':
      if (isAtLeast(sanctoral.rank, 'duplex-majus')) {
        // Never displaced, but a sufficiently high feast still gets a nod.
        return { winner: temporalWinner, commemorations: [sanctoralCommemoration(sanctoral)] };
      }
      // Below duplex-majus, a privileged Sunday wants nothing at all —
      // not even the bare commemoration an ordinary Sunday would allow a
      // Simplex — so everything here transfers.
      return {
        winner: temporalWinner,
        commemorations: [],
        transfer: { candidate: sanctoral, direction: transferDirectionOf(sanctoral.rank) },
      };
  }
}
