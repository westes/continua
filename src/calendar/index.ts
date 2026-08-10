import type { LiturgicalDay } from './types';
import { weekdayOf } from './weekday';

/**
 * Resolves everything about a given day *except* hour content — weekday,
 * season, and any occurring feasts. Season and occurring feasts are stubs
 * until calendar/easter.ts and calendar/feasts.ts land at milestone 4;
 * hours that only need weekday (Prime, Compline, Terce, Sext, None) can
 * already rely on this fully.
 */
export function resolveDay(isoDate: string): LiturgicalDay {
  return {
    date: isoDate,
    weekday: weekdayOf(isoDate),
    // Placeholder string, not a real resolution — real season/temporal-id
    // lookup (data/calendar/easter-offsets.yml + fixed-date-calendar.yml)
    // lands at milestone 4.
    season: 'trinitytide',
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
