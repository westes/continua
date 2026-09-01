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

/** The Sunday nearest `isoDate` — ties (exactly 3-4 days either way can't
 * happen; a week has one middle point, Wednesday, which is always closer
 * to one side or the other) resolved the usual "nearest" way: on or
 * before if `isoDate` is Sun-Wed, the next one if Thu-Sat. Shared by
 * `adventStart` (nearest Nov 30) and calendar/ember-days.ts's own
 * September Ember anchor (nearest Sept 14). */
export function nearestSunday(isoDate: string): string {
  const dow = dayOfWeek(isoDate);
  const delta = dow <= 3 ? -dow : 7 - dow;
  return addDays(isoDate, delta);
}

/** The Sunday nearest Nov 30 (St. Andrew's Day) — Advent's real start rule. */
export function adventStart(year: number): string {
  return nearestSunday(`${year}-11-30`);
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

/** The Sunday on or after `isoDate` — `isoDate` itself, if it's already a
 * Sunday. Used by calendar/movable-feasts.ts's "Nth Sunday of month"
 * anchor (the 1st Sunday of a month counts the month's own 1st day if
 * that's a Sunday, unlike firstSundayStrictlyAfter above). */
export function sundayOnOrAfter(isoDate: string): string {
  const dow = dayOfWeek(isoDate);
  return dow === 0 ? isoDate : addDays(isoDate, 7 - dow);
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

const SEPTEMBER_EMBER_OFFSETS = [3, 5, 6]; // Wed, Fri, Sat after the anchor Sunday
const ADVENT_EMBER_OFFSETS = [3, 5, 6]; // Wed, Fri, Sat after the 3rd Sunday of Advent

/** The Sunday nearest Sept 14 (Exaltation of the Holy Cross) — anchors
 * September's Ember days, same "nearest" rule as Advent's own start.
 * Live-verified (2026, 2019) against the reference engine: genuinely
 * "nearest," not "3rd Sunday of the calendar month" — those two
 * computations disagree in some years (e.g. 2025). */
export function septemberEmberAnchor(year: number): string {
  return nearestSunday(`${year}-09-14`);
}

/** Which of September's 3 Ember-day offsets (3/5/6 = Wed/Fri/Sat)
 * `isoDate` is, if any — shared by resolveTemporalCategory below (the
 * precedence side: these get `privileged-feria-minor`) and
 * calendar/ember-days.ts (the content-id side: each gets its own proper
 * collect/readings instead of inheriting the governing Sunday's). */
export function septemberEmberDayOffset(isoDate: string): number | undefined {
  const year = Number(isoDate.slice(0, 4));
  const anchor = septemberEmberAnchor(year);
  return SEPTEMBER_EMBER_OFFSETS.find((offset) => addDays(anchor, offset) === isoDate);
}

/** Which of Advent's 3 Ember-day offsets `isoDate` is, if any. Unlike
 * September's, this doesn't need its own resolveTemporalCategory entry —
 * Advent's ordinary `privileged-feria-minor` season default already
 * covers it (no live evidence found that Advent Ember days need a
 * stronger tier) — but it still needs its own content id, same as
 * September's, hence still exported for calendar/ember-days.ts. */
export function adventEmberDayOffset(isoDate: string): number | undefined {
  const year = Number(isoDate.slice(0, 4));
  const thirdAdventSunday = addDays(adventStart(year), 14);
  return ADVENT_EMBER_OFFSETS.find((offset) => addDays(thirdAdventSunday, offset) === isoDate);
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
 * overrides at all. The one deliberate exception is Easter Sunday itself
 * (offset 0): `eastertide`'s own `bySeason` default is `ordinary-sunday`
 * (live-verified for the *ordinary* Sundays that follow it — see that
 * entry's own comment), but Easter Day needs the stronger
 * `privileged-sunday` tier instead (live-verified 2026-09-01: the
 * Annunciation, Duplex I. classis, transfers off Easter Day itself in
 * years they coincide, the same "transfers, no exception" behavior as
 * every other privileged-sunday case) — checked directly here rather
 * than via `offsets`, since offsets are never consulted for a Sunday.
 */
export function resolveTemporalCategory(isoDate: string, season: Season, weekday: Weekday): TemporalCategory {
  const bySeasonEntry = temporalCategories.bySeason[season];
  const base = bySeasonEntry ? (weekday === 'sunday' ? bySeasonEntry.sunday : bySeasonEntry.feria) : 'ordinary-feria';
  if (weekday === 'sunday') {
    if (season === 'eastertide' && easterOffsetOf(isoDate) === 0) {
      return 'privileged-sunday';
    }
    return base;
  }

  const fixedOverride = temporalCategories.fixedDates?.[isoDate.slice(5)];
  if (fixedOverride) {
    return fixedOverride;
  }

  // September Ember days: live-verified privileged-feria-minor (Ss.
  // Cornelius & Cyprian, Semiduplex, won outright there with the feria
  // demoted to a commemoration) — see septemberEmberDayOffset's own doc
  // comment for why this can't be expressed as a plain Easter offset or
  // fixed MM-DD the way every other override in this function is.
  if (septemberEmberDayOffset(isoDate) !== undefined) {
    return 'privileged-feria-minor';
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
