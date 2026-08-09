import type { Weekday } from './types';

const WEEKDAYS: readonly Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * @param isoDate "YYYY-MM-DD". Parsed as UTC midnight so the weekday doesn't
 * shift depending on the caller's local timezone.
 */
export function weekdayOf(isoDate: string): Weekday {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = WEEKDAYS[date.getUTCDay()];
  if (!day) {
    throw new Error(`invalid ISO date: ${isoDate}`);
  }
  return day;
}
