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
// against real dates: the Sunday-vs-Duplex threshold was corrected after
// finding St. Anthony Abbot, plain Duplex, outright winning against an
// ordinary Sunday in the real Monastic 1617 engine, and privileged-feria
// was later split into two real tiers after finding St. Gregory the Great,
// also plain Duplex, outright winning against a Lenten Ember Saturday
// (which the original single-tier model wrongly forbade) while St. Mark,
// Duplex II. classis, only ever gets commemorated — never wins outright —
// within the Easter Octave. The rest is the result of a design discussion,
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

/**
 * The minimum rank a real sanctoral candidate needs to win each temporal
 * category outright, per `decideOccurrence`'s own branches above —
 * factored out so calendar/octaves.ts can ask the identical question of an
 * *octave*'s own effective standing (not a real occurring saint) on a day
 * where nothing else won. `undefined` where nothing ever wins outright no
 * matter how high-ranked (`privileged-feria-major`/`privileged-sunday` —
 * Ash Wednesday, Holy Week, a privileged Sunday — only ever get a
 * commemoration at best, per those branches above). `ordinary-feria` has
 * no real threshold at all (any real content wins), included here as
 * `'simplex'` (the weakest real rank) only for completeness — callers
 * needing that case already have their own unconditional path and don't
 * need to call this. */
export function minimumOutrightWinningRank(category: TemporalCategory): FeastClass | undefined {
  switch (category) {
    case 'ordinary-feria':
      return 'simplex';
    case 'privileged-feria-minor':
      return 'semiduplex';
    case 'privileged-feria':
    case 'ordinary-sunday':
      return 'duplex';
    case 'privileged-feria-major':
    case 'privileged-sunday':
      return undefined;
  }
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

    case 'privileged-feria-minor':
      // Advent's own ordinary ferias (verified: St. Bibiana, Simplex,
      // merely commemorated under an Advent feria; St. Nicholas,
      // Semiduplex, wins outright with the feria commemorated in return).
      // Weaker than `privileged-feria`'s Duplex+ threshold — Semiduplex is
      // already enough here — and unlike every other feria tier, nothing
      // ever transfers: whichever side loses still gets a commemoration.
      if (isAtLeast(sanctoral.rank, 'semiduplex')) {
        return { winner: sanctoralWinner(sanctoral), commemorations: [{ kind: 'temporal', id: temporalId }] };
      }
      return { winner: temporalWinner, commemorations: [sanctoralCommemoration(sanctoral)] };

    case 'privileged-feria':
      // The lesser of the two privileged-feria tiers (Ember days outside
      // Holy Week/the Easter Octave, etc.) — behaves exactly like an
      // ordinary Sunday: real standing of its own, but not enough to
      // resist a sufficiently ranked feast the way privileged-feria-major
      // does.
      if (isAtLeast(sanctoral.rank, 'duplex')) {
        return { winner: sanctoralWinner(sanctoral), commemorations: [{ kind: 'temporal', id: temporalId }] };
      }
      if (sanctoral.rank === 'simplex') {
        return { winner: temporalWinner, commemorations: [sanctoralCommemoration(sanctoral)] };
      }
      return {
        winner: temporalWinner,
        commemorations: [],
        transfer: { candidate: sanctoral, direction: transferDirectionOf(sanctoral.rank) },
      };

    case 'privileged-feria-major':
      // Ash Wednesday, Holy Week, the Easter Octave, the Vigil of
      // Christmas — never displaced, same as privileged-sunday.
      if (isAtLeast(sanctoral.rank, 'duplex-majus')) {
        return { winner: temporalWinner, commemorations: [sanctoralCommemoration(sanctoral)] };
      }
      return {
        winner: temporalWinner,
        commemorations: [],
        transfer: { candidate: sanctoral, direction: transferDirectionOf(sanctoral.rank) },
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
      // per direct instruction, an ordinary Sunday's own standing pushes
      // a Semiduplex feast off to the next open day (typically the
      // Monday right after) rather than downgrading it to a bare
      // commemoration. This `transfer` signal is only half of the
      // mechanism: it's just this day noting "I couldn't hold onto this
      // candidate." The other half — a later day actually claiming a
      // transferred-in candidate — lives entirely in calendar/index.ts's
      // resolveDay: for *every* date it resolves, it independently
      // recomputes `resolveNativeOccurrence` for both the day before and
      // the day after, checks whether *that* neighbor's own native
      // occurrence produced a `transfer` pointed this direction, and only
      // then folds it in via `applyIncomingTransfer`. So "Monday looks
      // back at the sanctoral calendar to see if Sunday's own candidate
      // needs a home" isn't a separate mechanism to build — it's the
      // existing generic transfer-consumption check, which already runs
      // for every day regardless of category.
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
