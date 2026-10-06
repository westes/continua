// Resolves a temporal feast's `anchor` (temporal-feasts.ts's MovableAnchor)
// to a concrete civil date in a given year. Shared by
// calendar/movable-feasts.ts (the feast's own day) and temporal-feasts.ts's
// temporalFeastIdsStartingOn (where its octave begins), so both read the
// same placement from the feast's yml instead of keeping their own copy.
import type { MovableAnchor } from './temporal-feasts';
import { easterSunday } from './easter';
import { addDays, toIsoDate } from './date-math';
import { adventStart, sundayOnOrAfter, sundayOnOrBefore } from './temporal';

function lastDayOfMonth(year: number, month: number): string {
  const nextMonthFirst = month === 12 ? toIsoDate({ year: year + 1, month: 1, day: 1 }) : toIsoDate({ year, month: month + 1, day: 1 });
  return addDays(nextMonthFirst, -1);
}

/** The Nth Sunday of `month` (`nth: -1` for "last"), or the Nth Sunday
 * counting from Advent's own start (always a Sunday itself, so "1st
 * Sunday of Advent" is exactly `adventStart`) -- the two calendar-
 * anchored kinds share one "count Sundays from an anchor date" shape,
 * just with a different anchor. `{ kind: 'easter' }` needs no such
 * counting at all: Easter Sunday is already a known, fixed anchor, so any
 * day pegged to it (Sunday or weekday alike) is just a direct offset. */
export function dateForAnchor(year: number, anchor: MovableAnchor): string {
  switch (anchor.kind) {
    case 'easter':
      return addDays(toIsoDate(easterSunday(year)), anchor.offset);
    case 'nth-sunday-of-month': {
      if (anchor.nth === -1) {
        return sundayOnOrBefore(lastDayOfMonth(year, anchor.month));
      }
      const firstSunday = sundayOnOrAfter(toIsoDate({ year, month: anchor.month, day: 1 }));
      return addDays(firstSunday, 7 * (anchor.nth - 1));
    }
    case 'nth-sunday-of-advent':
      return addDays(adventStart(year), 7 * (anchor.nth - 1));
    case 'fixed-date':
      return toIsoDate({ year, month: anchor.month, day: anchor.day });
  }
}
