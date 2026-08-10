import type { LiturgicalDay, OccurringFeast } from './types';
import { weekdayOf } from './weekday';
import { resolveSeason, resolveTemporalCategory } from './temporal';
import { getSanctoralCandidatesFor } from './feasts';
import { decideOccurrence, compareFeastClass } from './commemorations';

/**
 * Resolves everything about a given day *except* hour content — weekday,
 * season, temporal precedence category, and any occurring feast. All real
 * now: `occurring` combines calendar/feasts.ts's sanctoral candidates (if
 * more than one shares a date, the highest-ranked wins that contest too —
 * clashes *among* saints aren't otherwise modeled) with
 * calendar/commemorations.ts's occurrence decision. A feast that's fully
 * superseded (not even commemorated) doesn't appear in `occurring` at all.
 */
export function resolveDay(isoDate: string): LiturgicalDay {
  const weekday = weekdayOf(isoDate);
  const season = resolveSeason(isoDate);
  const temporalCategory = resolveTemporalCategory(isoDate, season, weekday);

  const candidates = getSanctoralCandidatesFor(isoDate);
  let topCandidate = candidates[0] ?? null;
  for (const candidate of candidates) {
    if (compareFeastClass(candidate.rank, topCandidate!.rank) > 0) {
      topCandidate = candidate;
    }
  }

  const occurring: OccurringFeast[] = [];
  if (topCandidate) {
    const { winner, commemorated } = decideOccurrence(temporalCategory, topCandidate.rank);
    if (winner === 'sanctoral' || commemorated) {
      occurring.push({
        id: topCandidate.id,
        name: topCandidate.name,
        rank: topCandidate.rank,
        commemorated: winner === 'temporal',
      });
    }
  }

  return { date: isoDate, weekday, season, temporalCategory, occurring };
}

/**
 * The Sunday/feast-vs-ferial split that several hours' propers key off of
 * (Prime's capitulum and Preces, so far): a plain weekday with nothing else
 * going on gets the "ferial" form, Sunday or an occurring feast gets the
 * fuller "Sunday/feast" form. `occurring` is always [] until milestone 4, so
 * today this reduces to "is it Sunday" — but the feast-override branch is
 * real, not a stub, and will start firing the moment feasts do.
 */
export function isSundayOrFeast(day: LiturgicalDay): boolean {
  return day.weekday === 'sunday' || day.occurring.length > 0;
}

export type { LiturgicalDay, OccurringFeast, Season, Weekday, FeastClass, TemporalCategory } from './types';
