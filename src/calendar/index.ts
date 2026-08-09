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

export type { LiturgicalDay, OccurringFeast, Season, Weekday, FeastRank } from './types';
