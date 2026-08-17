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
import { adventStart, firstSundayStrictlyAfter, sundayOnOrBefore } from './temporal';
import { addDays, daysBetween, toIsoDate } from './date-math';
import { getTemporalFeastRecord } from './temporal-feasts';
import { resolveActiveOctave, type ActiveOctave } from './octaves';
import { resolveTemporalId } from './temporal-id';

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

/** The anchor day itself (Ash Wednesday, Epiphany, Easter Sunday, Trinity
 * Sunday) is its own named day, not "day after itself" — and outranks
 * everything else this module computes (an active octave, an ordinal week
 * label), since it's the day's real primary identity in the live engine
 * too (e.g. Trinity Sunday is also technically day 8 of Pentecost's own
 * octave, but nobody calls it that). Advent's own anchor (Advent I Sunday)
 * doesn't take this branch — it's already "the 1st Sunday of Advent" via
 * the ordinal path below. */
function anchorDayName(day: LiturgicalDay): string | undefined {
  const config = ORDINAL_SEASONS[day.season];
  if (!config || config.includeAnchorWeek) {
    return undefined;
  }
  const year = Number(day.date.slice(0, 4));
  if (day.date === config.anchorDate(year)) {
    return config.anchorName;
  }
  return undefined;
}

/** The fixed final Sunday of the liturgical year (temporal-id.ts's
 * `post-pentecost-24`) always carries "Sunday XXIV after Pentecost"'s own
 * formulary, regardless of how many Sundays actually elapsed since
 * Trinity — confirmed by scanning every year 1900-2100, every single one
 * lands on this id for its own last Sunday before Advent, never a raw
 * elapsed-week count. This app's Trinity-counted display is one week off
 * from that Pentecost-counted id (Trinity Sunday itself = post-pentecost-
 * 01 = the display's own uncounted anchor day), so the fixed display
 * ordinal here is XXIV - 1 = 23, not whatever a plain "weeks since
 * Trinity" calculation would produce. */
const FIXED_LAST_SUNDAY_ORDINAL = 23;

/**
 * Trinitytide's ordinal display can't be pure "weeks since Trinity's own
 * first Sunday" arithmetic once the season gets late enough — see
 * temporal-id.ts's own post-Pentecost-XXIII-plus branch. Two cases, both
 * driven by `resolveTemporalId` directly (the same mechanism the content
 * layer already trusts, rather than re-deriving the wdist arithmetic here
 * a second time, so the label can never disagree with what's actually
 * rendered underneath):
 *   - A resumed post-Epiphany Sunday/week (an overflow year's skipped
 *     Epiphany Sundays, reappearing here) — reads "after Epiphany", not
 *     the next Trinity-counted number in line.
 *   - The fixed final Sunday/week of the year itself — always the fixed
 *     23rd-after-Trinity ordinal (see FIXED_LAST_SUNDAY_ORDINAL above),
 *     every year, not just overflow ones.
 * Only ever fires within trinitytide, since that's the only season
 * resolveTemporalId can return either of these ids for a date outside
 * their own native season.
 */
function trinitytideOverrideLabel(day: LiturgicalDay): string | undefined {
  if (day.season !== 'trinitytide') {
    return undefined;
  }
  const id = resolveTemporalId(day.date);
  const weekdayName = capitalize(day.weekday);

  const epiphanyMatch = id.match(/^post-epiphany-(\d)$/);
  if (epiphanyMatch) {
    const n = Number(epiphanyMatch[1]);
    return day.weekday === 'sunday'
      ? `The ${ordinal(n)} Sunday after Epiphany`
      : `${weekdayName} in the ${ordinal(n)} week after Epiphany`;
  }

  if (id === 'post-pentecost-24') {
    return day.weekday === 'sunday'
      ? `The ${ordinal(FIXED_LAST_SUNDAY_ORDINAL)} Sunday after Trinity`
      : `${weekdayName} in the ${ordinal(FIXED_LAST_SUNDAY_ORDINAL)} week after Trinity`;
  }

  return undefined;
}

function temporalLabel(day: LiturgicalDay): string {
  const trinitytideOverride = trinitytideOverrideLabel(day);
  if (trinitytideOverride) {
    return trinitytideOverride;
  }

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
  const anchorName = anchorDayName(day);
  if (anchorName) {
    return anchorName;
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

/** "Third Day within the Octave of St. Lawrence" — the real DO title an
 * octave day carries on its own (e.g. "Tertia die infra Octavam S.
 * Laurentii Martyris") when nothing else has displaced it. Day 1 shouldn't
 * normally reach this (that day's own winner is the feast itself, handled
 * above before this is ever called) — kept simple rather than
 * special-cased for that rare edge case (see applyOctaves's own
 * `isOwnStartDay` comment in calendar/index.ts for when it can happen). */
function octaveLabel(octave: ActiveOctave): string {
  return `${ordinal(octave.dayNumber)} Day within the Octave of ${octave.name}`;
}

/**
 * The full "day being celebrated" label: a feast name when
 * calendar/commemorations.ts says the day has one, combined with (or
 * replaced by) the ordinal temporal label depending on whether the feast
 * won outright or was merely commemorated. See the plan discussion this
 * came from for the three cases.
 */
export function getDayLabel(day: LiturgicalDay): string {
  if (day.winner.kind === 'sanctoral') {
    return day.winner.name;
  }

  // A named temporal feast (Christmas, Pentecost, Marian Saturday, ...)
  // shows its own name rather than the ordinal week label — same
  // "winner displaces, doesn't combine" rule a sanctoral winner gets
  // above. Most temporal ids don't have a record at all (see
  // temporal-feasts.ts) and fall through to the ordinal label as before.
  const namedFeast = getTemporalFeastRecord(day.winner.id);
  if (namedFeast) {
    return namedFeast.name;
  }

  const commemoratedSaint = day.commemorations.find((c) => c.kind === 'sanctoral');

  // A season's own named anchor day (Trinity Sunday, Easter, Ash
  // Wednesday, Epiphany) outranks an active octave, same reasoning as
  // anchorDayName's own doc comment — checked before the octave case
  // below since Trinity Sunday, e.g., also happens to be day 8 of
  // Pentecost's octave, and the anchor name is what actually governs.
  const anchorName = anchorDayName(day);
  if (anchorName) {
    return commemoratedSaint ? `${commemoratedSaint.name} — ${anchorName}` : anchorName;
  }

  // An active octave (St. Lawrence's, ...) is this day's real primary
  // identity in the live engine, not a footnote — e.g. "Tertia die infra
  // Octavam S. Laurentii Martyris", not "Wednesday in the 11th week after
  // Trinity" — but *only* when the temporal day itself has no standing of
  // its own (`ordinary-feria`), same gate as hours/resolve-common.ts's
  // resolveOfficeWinner and for the same reason: live-verified
  // counterexample is the Christmas Octave's own stack (Dec 30, e.g.,
  // `privileged-feria-minor`), where the real title stays the temporal
  // Sunday's own ("De Dominica Infra Octavam Nativitatis") with no octave
  // name in it at all — this label agreeing with resolveOfficeWinner
  // about which one wins is what makes "the office is Lawrence's" and
  // "the label says Lawrence" consistent instead of two independent
  // guesses that can disagree. When more than one octave is active at
  // once (resolveActiveOctave), the highest-ranked wins the headline
  // (ties broken by whichever started more recently) — the others still
  // ride along as ordinary octave commemorations, just not separately
  // named here.
  const activeOctave = day.temporalCategory === 'ordinary-feria' ? resolveActiveOctave(day.date) : undefined;
  if (activeOctave) {
    const primary = octaveLabel(activeOctave);
    return commemoratedSaint ? `${primary} — ${commemoratedSaint.name}` : primary;
  }

  const temporal = temporalLabel(day);
  return commemoratedSaint ? `${commemoratedSaint.name} — ${temporal}` : temporal;
}
