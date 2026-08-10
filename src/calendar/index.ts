import type { LiturgicalDay } from './types';
import { weekdayOf } from './weekday';
import { resolveSeason } from './temporal';

/**
 * Resolves everything about a given day *except* hour content — weekday,
 * season, and any occurring feasts. Season is real (see
 * calendar/temporal.ts); occurring feasts are still a stub until
 * calendar/feasts.ts lands (the sanctoral calendar — which saint, if any,
 * is kept on a given day, and Double-vs-not ranking — is a separate,
 * larger project from temporal-cycle season resolution).
 */
export function resolveDay(isoDate: string): LiturgicalDay {
  return {
    date: isoDate,
    weekday: weekdayOf(isoDate),
    season: resolveSeason(isoDate),
    occurring: [],
  };
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

export type { LiturgicalDay, OccurringFeast, Season, Weekday, FeastRank } from './types';
