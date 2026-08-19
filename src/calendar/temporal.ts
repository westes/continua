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
import type { Season, TemporalCategory, Weekday } from './types';
import { easterSunday } from './easter';
import { addDays, daysBetween, dayOfWeek, toIsoDate } from './date-math';
import fixedDateData from '../data/calendar/fixed-date-calendar.yml';
import easterOffsetsData from '../data/calendar/easter-offsets.yml';
import temporalCategoriesData from '../data/calendar/temporal-categories.yml';

const fixedDates = fixedDateData as { dates: Record<string, string> };
const easterOffsets = easterOffsetsData as {
  ranges: { season: string; fromOffset: number }[];
  days?: Record<string, string>;
};
const temporalCategories = temporalCategoriesData as {
  bySeason: Record<string, { sunday: TemporalCategory; feria: TemporalCategory }>;
  offsets?: Record<string, TemporalCategory>;
  offsetRanges?: { fromOffset: number; toOffset: number; category: TemporalCategory }[];
  fixedDates?: Record<string, TemporalCategory>;
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
export function adventStart(year: number): string {
  const nov30 = `${year}-11-30`;
  const dow = dayOfWeek(nov30);
  const delta = dow <= 3 ? -dow : 7 - dow;
  return addDays(nov30, delta);
}

/**
 * The Sunday on or before `isoDate` — "which week does this feria belong
 * to." Shared by calendar/day-label.ts (display) and, eventually, whatever
 * resolves temporal-propers content ids (calendar/types.ts's `PropersRef`
 * `source: 'temporal'` branch) — both need the same "which Sunday governs
 * this feria" answer, just for different purposes, so it lives here rather
 * than in either consumer.
 */
export function sundayOnOrBefore(isoDate: string): string {
  return addDays(isoDate, -dayOfWeek(isoDate));
}

/** The first Sunday strictly after `isoDate`, even if `isoDate` is itself a Sunday. */
export function firstSundayStrictlyAfter(isoDate: string): string {
  const dow = dayOfWeek(isoDate);
  return addDays(isoDate, dow === 0 ? 7 : 7 - dow);
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

/** Days from Easter Sunday (negative = before, 0 = Easter, positive = after) for the given date's own year. */
export function easterOffsetOf(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  return daysBetween(toIsoDate(easterSunday(year)), isoDate);
}

/** The Sacred Triduum: Maundy/Holy Thursday through Holy Saturday
 * (inclusive). Doesn't line up with `season` (which resolves this window
 * to 'passiontide', same as the two weeks before it) — see
 * hours/marian-antiphon.ts's isCandlemasToHolyWednesday for the same
 * direct-date-check pattern used for another window `season` can't
 * represent. Gloria Patri is omitted after psalms only in this narrower
 * window, not throughout Passiontide/Holy Week generally. */
export function isInTriduum(isoDate: string): boolean {
  const offset = easterOffsetOf(isoDate);
  return offset >= -3 && offset <= -1;
}

/**
 * A day's precedence category under the temporal cycle alone — see
 * calendar/types.ts's TemporalCategory doc comment and
 * data/calendar/temporal-categories.yml for the reconstruction caveat.
 *
 * Sundays never fall on any of the offset/fixed-date overrides below (Ash
 * Wednesday, Holy Week, the Easter/Pentecost octaves' weekdays, and the
 * Christmas vigil are all, by construction, not Sundays) except possibly
 * the Christmas vigil (Dec 24 can land on a Sunday) — and a Sunday's own
 * privileged/ordinary status should win in that case regardless, so
 * Sundays are resolved straight from `bySeason` without consulting the
 * overrides at all.
 */
export function resolveTemporalCategory(isoDate: string, season: Season, weekday: Weekday): TemporalCategory {
  const bySeasonEntry = temporalCategories.bySeason[season];
  const base = bySeasonEntry ? (weekday === 'sunday' ? bySeasonEntry.sunday : bySeasonEntry.feria) : 'ordinary-feria';
  if (weekday === 'sunday') {
    return base;
  }

  const fixedOverride = temporalCategories.fixedDates?.[isoDate.slice(5)];
  if (fixedOverride) {
    return fixedOverride;
  }

  const offset = easterOffsetOf(isoDate);

  const singleOverride = temporalCategories.offsets?.[String(offset)];
  if (singleOverride) {
    return singleOverride;
  }

  for (const range of temporalCategories.offsetRanges ?? []) {
    if (offset >= range.fromOffset && offset <= range.toOffset) {
      return range.category;
    }
  }

  return base;
}
