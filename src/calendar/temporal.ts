// Temporal-cycle occurrence resolution: given a date, which season applies.
// Combines two independent anchor systems that hand off to each other once
// a year, right around Epiphanytide -> Septuagesima:
//   - Christmas-relative (data/calendar/fixed-date-calendar.yml): Advent,
//     Christmastide, Epiphanytide. Advent's start is "the Sunday nearest
//     Nov 30", not a plain fixed date, so that rule lives in code here.
//   - Easter-relative (data/calendar/easter-offsets.yml, via
//     calendar/easter.ts): Septuagesima through the end of Trinitytide.
//
// Does NOT resolve occurring feasts (calendar/feasts.ts, still a stub) —
// a season is the temporal-cycle backdrop a day sits on; which saint (if
// any) is being kept that day, and whether it outranks the season, is a
// separate, larger project.
import type { Season } from './types';
import { easterSunday } from './easter';
import { addDays, daysBetween, toIsoDate } from './date-math';
import fixedDateData from '../data/calendar/fixed-date-calendar.yml';
import easterOffsetsData from '../data/calendar/easter-offsets.yml';

const fixedDates = fixedDateData as { dates: Record<string, string> };
const easterOffsets = easterOffsetsData as {
  ranges: { season: string; fromOffset: number }[];
  days?: Record<string, string>;
};

function fixedDateFor(id: string): { month: number; day: number } {
  const entry = Object.entries(fixedDates.dates).find(([, value]) => value === id);
  if (!entry) {
    throw new Error(`fixed-date-calendar.yml has no entry for '${id}'`);
  }
  const [monthStr, dayStr] = entry[0].split('-');
  return { month: Number(monthStr), day: Number(dayStr) };
}

const CHRISTMAS = fixedDateFor('christmas-day');
const EPIPHANY = fixedDateFor('epiphany');

/** The Sunday nearest Nov 30 (St. Andrew's Day) — Advent's real start rule. */
function adventStart(year: number): string {
  const nov30 = `${year}-11-30`;
  const dow = new Date(`${nov30}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const delta = dow <= 3 ? -dow : 7 - dow;
  return addDays(nov30, delta);
}

function seasonFromEasterOffset(offset: number): Season {
  const dayOverride = easterOffsets.days?.[String(offset)];
  if (dayOverride) {
    return dayOverride;
  }
  const sorted = [...easterOffsets.ranges].sort((a, b) => a.fromOffset - b.fromOffset);
  const first = sorted[0];
  if (!first) {
    throw new Error('easter-offsets.yml has no ranges');
  }
  let season: Season = first.season;
  for (const range of sorted) {
    if (offset >= range.fromOffset) {
      season = range.season;
    }
  }
  return season;
}

export function resolveSeason(isoDate: string): Season {
  const [, monthStr, dayStr] = isoDate.split('-');
  const month = Number(monthStr);
  const day = Number(dayStr);
  const year = Number(isoDate.slice(0, 4));

  // Advent: the Sunday nearest Nov 30 through Dec 24.
  const advent = adventStart(year);
  const isChristmasDayOrLater = month === CHRISTMAS.month && day >= CHRISTMAS.day;
  if (isoDate >= advent && !isChristmasDayOrLater) {
    return 'advent';
  }

  // Christmastide: Christmas Day through Jan 5, wrapping across the civil
  // year boundary (so checked as two separate month/day windows, not one
  // date range).
  if (isChristmasDayOrLater || (month === 1 && day < EPIPHANY.day)) {
    return 'christmastide';
  }

  // Epiphanytide: Epiphany until Septuagesima cuts in. Septuagesima's
  // earliest possible date (Jan 18, when Easter falls on its earliest
  // possible date, Mar 22) is always after Epiphany, so no year-rollover
  // Easter lookup is ever needed to make this comparison.
  const easterIso = toIsoDate(easterSunday(year));
  const septuagesimaStart = addDays(easterIso, -63);
  if (isoDate < septuagesimaStart) {
    return 'epiphanytide';
  }

  return seasonFromEasterOffset(daysBetween(easterIso, isoDate));
}
