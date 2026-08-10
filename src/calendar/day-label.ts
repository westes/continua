// "Day being celebrated" label — combines an ordinal week-within-season
// label (pure date arithmetic on the season anchors already computed
// elsewhere in calendar/) with a feast name when
// calendar/commemorations.ts's occurrence decision says one applies.
//
// Counting convention is Trinity-counted ("Nth Sunday/week after Trinity"),
// not Divinum Officium's own "after Pentecost" counting — a deliberate
// choice, one week off from Pentecost-counting for the same date. Meant to
// become a configurable choice later (the same day->id indirection
// philosophy already used for the sanctoral calendar), not hardcoded here
// forever — just not built yet.
import type { LiturgicalDay } from './types';
import { easterSunday } from './easter';
import { adventStart } from './temporal';
import { addDays, daysBetween, toIsoDate } from './date-math';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${n}th`;
  }
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay(); // 0 = Sunday
}

/** The first Sunday strictly after `isoDate` (even if `isoDate` is itself a Sunday). */
function firstSundayStrictlyAfter(isoDate: string): string {
  const dow = weekdayOf(isoDate);
  return addDays(isoDate, dow === 0 ? 7 : 7 - dow);
}

function sundayOnOrBefore(isoDate: string): string {
  return addDays(isoDate, -weekdayOf(isoDate));
}

interface OrdinalSeason {
  /** ISO date of the season's own anchor day, for a given calendar year. */
  anchorDate(year: number): string;
  /** Advent: the anchor Sunday itself is "week 1". Trinity/Epiphany/Easter/
   * Lent: the anchor is its own named day, excluded from the count — the
   * numbered weeks start the following Sunday. */
  includeAnchorWeek: boolean;
  /** Used in "Weekday after {anchorName}" for the anchor's own partial week. */
  anchorName: string;
  /** Used in "the Nth Sunday/week {preposition} {ordinalName}". */
  ordinalName: string;
  preposition: 'after' | 'of';
}

const ORDINAL_SEASONS: Partial<Record<string, OrdinalSeason>> = {
  advent: {
    anchorDate: adventStart,
    includeAnchorWeek: true,
    anchorName: 'Advent',
    ordinalName: 'Advent',
    preposition: 'of',
  },
  epiphanytide: {
    anchorDate: (year) => `${year}-01-06`,
    includeAnchorWeek: false,
    anchorName: 'Epiphany',
    ordinalName: 'Epiphany',
    preposition: 'after',
  },
  lent: {
    anchorDate: (year) => addDays(toIsoDate(easterSunday(year)), -46),
    includeAnchorWeek: false,
    anchorName: 'Ash Wednesday',
    ordinalName: 'Lent',
    preposition: 'of',
  },
  eastertide: {
    anchorDate: (year) => toIsoDate(easterSunday(year)),
    includeAnchorWeek: false,
    anchorName: 'Easter',
    ordinalName: 'Easter',
    preposition: 'after',
  },
  trinitytide: {
    anchorDate: (year) => addDays(toIsoDate(easterSunday(year)), 56),
    includeAnchorWeek: false,
    anchorName: 'Trinity Sunday',
    ordinalName: 'Trinity',
    preposition: 'after',
  },
};

function temporalLabel(day: LiturgicalDay): string {
  const weekdayName = capitalize(day.weekday);
  const config = ORDINAL_SEASONS[day.season];
  if (!config) {
    // No ordinal convention modeled for this season (Septuagesima-tide,
    // Passiontide, Ascensiontide, Pentecost, Christmastide, the
    // Corpus-Christi/Sacred-Heart single-day seasons) — their few days
    // mostly have their own proper names rather than ordinal counting, so
    // this fallback is expected to be seen, not a gap to fill later.
    return `${weekdayName} in ${capitalize(day.season.replace(/-/g, ' '))}`;
  }

  const year = Number(day.date.slice(0, 4));
  const anchor = config.anchorDate(year);
  if (!config.includeAnchorWeek && day.date === anchor) {
    // The anchor day itself (Ash Wednesday, Epiphany, Easter Sunday,
    // Trinity Sunday) is its own named day, not "day after itself" — only
    // reachable here at all when nothing in `occurring` already covers it
    // (none of these are modeled as sanctoral entries yet). Advent's own
    // anchor (Advent I Sunday) doesn't take this branch — it's already
    // "the 1st Sunday of Advent" via the ordinal path below.
    return config.anchorName;
  }

  const firstNumberedSunday = config.includeAnchorWeek ? anchor : firstSundayStrictlyAfter(anchor);
  if (day.date < firstNumberedSunday) {
    return `${weekdayName} after ${config.anchorName}`;
  }

  const weeksSince = daysBetween(firstNumberedSunday, sundayOnOrBefore(day.date)) / 7;
  const ordinalStr = ordinal(weeksSince + 1);
  if (day.weekday === 'sunday') {
    return `The ${ordinalStr} Sunday ${config.preposition} ${config.ordinalName}`;
  }
  return `${weekdayName} in the ${ordinalStr} week ${config.preposition} ${config.ordinalName}`;
}

/**
 * The full "day being celebrated" label: a feast name when
 * calendar/commemorations.ts says the day has one, combined with (or
 * replaced by) the ordinal temporal label depending on whether the feast
 * won outright or was merely commemorated. See the plan discussion this
 * came from for the three cases.
 */
export function getDayLabel(day: LiturgicalDay): string {
  const winner = day.occurring.find((feast) => !feast.commemorated);
  if (winner) {
    return winner.name;
  }

  const temporal = temporalLabel(day);
  const commemorated = day.occurring.find((feast) => feast.commemorated);
  return commemorated ? `${commemorated.name} — ${temporal}` : temporal;
}
