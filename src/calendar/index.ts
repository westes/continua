import type { Commemoration, DayWinner, LiturgicalDay, SanctoralIdentity, TemporalCategory } from './types';
import { weekdayOf } from './weekday';
import { resolveSeason, resolveTemporalCategory } from './temporal';
import { resolveTemporalId } from './temporal-id';
import { getSanctoralCandidatesFor } from './feasts';
import { decideOccurrence, type OccurrenceResult } from './commemorations';
import { resolveCollision } from './collision';
import { addDays } from './date-math';

/**
 * A day's occurrence considered on its own — no awareness of what an
 * adjacent day might be trying to transfer in. `resolveDay` calls this for
 * the date itself *and* for yesterday/tomorrow (to check for an inbound
 * transfer) without ever recursing into their own adjacent-day checks —
 * that's what keeps this from being mutually recursive.
 */
function resolveNativeOccurrence(isoDate: string): { temporalCategory: TemporalCategory; result: OccurrenceResult } {
  const weekday = weekdayOf(isoDate);
  const season = resolveSeason(isoDate);
  const temporalCategory = resolveTemporalCategory(isoDate, season, weekday);
  const temporalId = resolveTemporalId(isoDate);

  // Multiple saints sharing a date is its own small occurrence contest,
  // resolved the same way a transfer landing is — see calendar/collision.ts.
  const candidates = getSanctoralCandidatesFor(isoDate);
  let topCandidate: SanctoralIdentity | null = null;
  const clashCommemorations: Commemoration[] = [];
  for (const candidate of candidates) {
    if (!topCandidate) {
      topCandidate = candidate;
      continue;
    }
    const collision = resolveCollision(candidate, topCandidate);
    clashCommemorations.push(...collision.commemorations);
    if (collision.winner.kind === 'sanctoral') {
      topCandidate = { id: collision.winner.id, name: collision.winner.name, rank: collision.winner.rank };
    }
  }

  const result = decideOccurrence(temporalCategory, temporalId, topCandidate);
  result.commemorations.push(...clashCommemorations);
  return { temporalCategory, result };
}

function applyIncomingTransfer(
  candidate: SanctoralIdentity,
  temporalCategory: TemporalCategory,
  winner: DayWinner,
  commemorations: Commemoration[],
): DayWinner {
  if (temporalCategory === 'privileged-feria') {
    // Deferred: a transfer landing on a privileged feria (the concrete
    // case is Holy Week, right after Palm Sunday) needs its own
    // Easter-date-keyed lookup table, the same way the reference engine
    // handles it — not modeled yet. The transfer is simply not delivered
    // here rather than guessed at.
    return winner;
  }
  if (winner.kind === 'temporal') {
    return { kind: 'sanctoral', id: candidate.id, name: candidate.name, rank: candidate.rank };
  }
  const collision = resolveCollision(candidate, winner);
  commemorations.push(...collision.commemorations);
  return collision.winner;
}

/**
 * Resolves everything about a given day *except* hour content — weekday,
 * season, temporal precedence category, and the day's real winner plus
 * whatever's commemorated alongside it (calendar/commemorations.ts,
 * calendar/collision.ts, calendar/transfer signaling all feed into this).
 */
export function resolveDay(isoDate: string): LiturgicalDay {
  const weekday = weekdayOf(isoDate);
  const season = resolveSeason(isoDate);
  const { temporalCategory, result } = resolveNativeOccurrence(isoDate);

  let winner = result.winner;
  const commemorations = [...result.commemorations];

  const yesterday = resolveNativeOccurrence(addDays(isoDate, -1));
  if (yesterday.result.transfer?.direction === 'forward') {
    winner = applyIncomingTransfer(yesterday.result.transfer.candidate, temporalCategory, winner, commemorations);
  }
  const tomorrow = resolveNativeOccurrence(addDays(isoDate, 1));
  if (tomorrow.result.transfer?.direction === 'backward') {
    winner = applyIncomingTransfer(tomorrow.result.transfer.candidate, temporalCategory, winner, commemorations);
  }

  return { date: isoDate, weekday, season, temporalCategory, winner, commemorations };
}

/**
 * The Sunday/feast-vs-ferial split that several hours' propers key off of
 * (Prime's capitulum and Preces, so far): a plain weekday with nothing else
 * going on gets the "ferial" form, Sunday or a winning feast gets the
 * fuller "Sunday/feast" form.
 */
export function isSundayOrFeast(day: LiturgicalDay): boolean {
  return day.weekday === 'sunday' || day.winner.kind === 'sanctoral';
}

export { compareFeastClass, isAtLeast, decideOccurrence } from './commemorations';
export { resolveCollision } from './collision';
export { resolveTemporalId } from './temporal-id';
export type {
  LiturgicalDay,
  DayWinner,
  Commemoration,
  SanctoralIdentity,
  Season,
  Weekday,
  FeastClass,
  TemporalCategory,
} from './types';
