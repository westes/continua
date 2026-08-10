// Computus (the date of Easter, and everything the temporal cycle hangs off
// of it — Septuagesima, Ash Wednesday, Ascension, Pentecost, Trinity Sunday).
//
// This is the Anonymous Gregorian algorithm (a.k.a. Meeus/Jones/Butcher),
// valid for the whole Gregorian era (1583 onward). Hand-rolled rather than
// pulling in a dependency: it's ~15 lines of pure integer arithmetic with a
// long history of independent verification (see calendar/easter.test.ts),
// not something that benefits from a library's abstraction or maintenance
// surface for an app with zero runtime dependencies otherwise.
import type { CalendarDate } from './date-math';

export function easterSunday(year: number): CalendarDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  const month = Math.floor(n / 31);
  const day = (n % 31) + 1;
  return { year, month, day };
}
