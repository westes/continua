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
import type { FeastClass, LiturgicalDay, TemporalCategory } from './types';
import { easterSunday } from './easter';
import { adventStart, firstSundayStrictlyAfter, sundayOnOrBefore } from './temporal';
import { addDays, daysBetween, toIsoDate } from './date-math';
import { getTemporalFeastRecord } from './temporal-feasts';
import { activeOctavesFor, octaveGoverningPrivilegedDay, resolveActiveOctave, type ActiveOctave } from './octaves';
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
  /** The season's own anchor day's rank, if it sits on the closed
   * pre-1955 duplex scale at all — Ash Wednesday (Lent's anchor) doesn't;
   * a privileged feria has no duplex-scale rank, so it's left undefined
   * and shows no parenthetical, same "omit rather than guess" convention
   * `formatRank`/`status` fields use elsewhere. */
  anchorRank?: FeastClass;
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
    anchorRank: 'duplex-1-classis',
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
    anchorRank: 'duplex-1-classis',
  },
  trinitytide: {
    anchorDate: (year) => addDays(toIsoDate(easterSunday(year)), 56),
    includeAnchorWeek: false,
    anchorName: 'Trinity Sunday',
    ordinalName: 'Trinity',
    preposition: 'after',
    anchorRank: 'duplex-1-classis',
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
function anchorDayName(day: LiturgicalDay, withRank = true): string | undefined {
  const config = ORDINAL_SEASONS[day.season];
  if (!config || config.includeAnchorWeek) {
    return undefined;
  }
  const year = Number(day.date.slice(0, 4));
  if (day.date === config.anchorDate(year)) {
    return withRank && config.anchorRank ? `${config.anchorName} (${formatRank(config.anchorRank)})` : config.anchorName;
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

/** "Third Day within the Octave of St. Lawrence" for an ordinary mid-octave
 * day (e.g. "Tertia die infra Octavam S. Laurentii Martyris"), or plain
 * "Octave of St. Lawrence" for the octave's own closing day — real DO
 * Latin distinguishes "infra octavam" (within the octave, days 2-7) from
 * "in octava" (on the octave day itself, day 8), live-verified: Aug 17
 * (St. Lawrence's closing day) titles itself "In Octava S. Laurentii
 * Martyris", not "Octava die infra Octavam...". Day 1 shouldn't normally
 * reach either branch (that day's own winner is the feast itself, handled
 * above before this is ever called) — kept simple rather than
 * special-cased for that rare edge case (see applyOctaves's own
 * `isOwnStartDay` comment in calendar/index.ts for when it can happen). */
function octaveCoreName(octave: ActiveOctave): string {
  return octave.isClosingDay ? `Octave of ${octave.name}` : `${ordinal(octave.dayNumber)} Day within the Octave of ${octave.name}`;
}

function octaveLabel(octave: ActiveOctave): string {
  return `${octaveCoreName(octave)} (${formatRank(octave.wins)})`;
}

/** Same phrasing as `octaveLabel`, but without the parenthesized rank —
 * the real DO commemoration line for a displaced octave day carries no
 * rank at all (e.g. Aug 19's real Divino Afflatu 1954 commemoration reads
 * plain "Quinta die infra Octavam S. Assumptionis Beatæ Mariæ Virginis",
 * no "~ Semiduplex"). `octaveLabel`'s own rank parenthetical only belongs
 * to an octave day when it's the day's own primary winner (rank is what
 * it *won as*, not a fact worth restating once a duplex-or-higher saint
 * has displaced it and it's just riding along as a commemoration
 * instead). */
function octaveCommemorationLabel(octave: ActiveOctave): string {
  return octaveCoreName(octave);
}

/** Every commemoration on `day`, resolved to display strings and grouped
 * by kind — the single place that decides both "is this commemoration
 * eligible to show at all here" and "how is it formatted", so every
 * caller below shares the same answer instead of each hand-rolling its
 * own filter/format pass (that duplication is exactly how Aug 19's octave
 * phrasing, Aug 17's closing-day title, and Aug 16's missing Sunday
 * commemoration ended up as three separate bugs instead of one). Callers
 * still decide their own *order* — e.g. the octave-headline branch wants
 * octaves before a commemorated saint, while a plain Sunday/feria wants a
 * commemorated saint *before* its own temporal label — since that
 * ordering reflects a real, deliberate liturgical convention per branch,
 * not an accident to unify away.
 *
 * - `sanctoral`: every commemorated saint, plain name, no rank (multiple
 *   real ones can coexist — e.g. two colliding saints on the same date —
 *   this app's own "generous commemorations" design keeps every one of
 *   them, not just the first).
 * - `temporal`: the day's own real Sunday/feria identity, if
 *   `decideOccurrence` demoted it to a commemoration (`ordinary-sunday`/
 *   `privileged-feria`/`privileged-feria-minor`) — matched by id against
 *   `resolveTemporalId(day.date)` specifically, not "any temporal-kind
 *   commemoration present", so unrelated side-notes like
 *   `applyEpiphany6Commemoration`'s fixed `post-epiphany-6` don't get
 *   mistaken for it. Rendered via `anchorDayName`/`temporalLabel`, the
 *   same machinery a primary temporal label uses, minus the rank.
 * - `octave`: every active octave other than `excludeOctaveId` (the
 *   octave already serving as the day's own headline, if any) — only
 *   when `showOctaves` is true. Live-verified this is *not* simply "is an
 *   octave active": on a Sunday or privileged feria a saint won outright
 *   against, an unrelated active octave isn't commemorated at all (Aug
 *   16's St. Joachim names only the Sunday, not St. Lawrence's/the
 *   Assumption's octaves, even though both are technically active) —
 *   octaves are only shown on `ordinary-feria` (no real standing of its
 *   own to prefer instead) or when the octave itself is governing the
 *   headline. Rendered via `octaveCommemorationLabel` — the "Nth Day
 *   within the Octave of X" phrasing, no rank.
 */
function collectCommemorations(
  day: LiturgicalDay,
  opts: { showOctaves: boolean; excludeOctaveId?: string },
): { sanctoral: string[]; temporal: string[]; octaves: string[] } {
  const temporalId = resolveTemporalId(day.date);
  const activeOctaves = opts.showOctaves ? activeOctavesFor(day.date) : [];
  const sanctoral: string[] = [];
  const temporal: string[] = [];
  const octaves: string[] = [];
  for (const c of day.commemorations) {
    if (c.kind === 'sanctoral') {
      sanctoral.push(c.name);
    } else if (c.kind === 'temporal') {
      if (c.id === temporalId) {
        temporal.push(anchorDayName(day, false) ?? temporalLabel(day));
      }
    } else if (opts.showOctaves && c.id !== opts.excludeOctaveId) {
      const octave = activeOctaves.find((a) => a.id === c.id);
      octaves.push(octave ? octaveCommemorationLabel(octave) : c.name);
    }
  }
  return { sanctoral, temporal, octaves };
}

const RANK_LABELS: Record<FeastClass, string> = {
  simplex: 'Simplex',
  vigil: 'Vigil',
  semiduplex: 'Semiduplex',
  duplex: 'Duplex',
  'duplex-majus': 'Duplex Majus',
  'duplex-2-classis': 'Duplex II Class',
  'duplex-1-classis': 'Duplex I Class',
};

/** The day's own winning saint's rank, parenthesized after their name —
 * rank was previously shown nowhere in this app's UI at all, for any
 * saint. Only the day's own *winner* gets this treatment, not every
 * commemoration, matching the "winner is primary, commemorations are
 * secondary" distinction this file already draws throughout. */
function formatRank(rank: FeastClass): string {
  return RANK_LABELS[rank];
}

/** Sundays/ferias aren't on the `FeastClass` duplex scale at all (that
 * scale is for feasts), so this is a separate, plain-string lookup rather
 * than another `formatRank` case — used for the final ordinal-temporal-
 * label fallback (weekdays, Sundays with no named-feast/anchor-day/octave
 * standing of their own). Pre-1955, an ordinary Sunday's own rank is
 * Semiduplex regardless of whether it's additionally "privileged"
 * (privilege is about resisting supersession, a property of
 * `temporalCategory`, not a higher spot on the duplex scale) — so both
 * Sunday categories share one label here. */
const TEMPORAL_CATEGORY_RANK_LABELS: Record<TemporalCategory, string> = {
  'ordinary-sunday': 'Semiduplex',
  'privileged-sunday': 'Semiduplex',
  'ordinary-feria': 'Feria',
  'privileged-feria-minor': 'Feria',
  'privileged-feria': 'Feria',
  'privileged-feria-major': 'Feria',
};

/**
 * The full "day being celebrated" label: the day's own primary identity
 * (a sanctoral winner, a named temporal feast, a season's own anchor day,
 * an octave governing the day, or the plain ordinal temporal label — in
 * that precedence order) plus whatever `collectCommemorations` finds
 * eligible to ride along with it. Each branch below only decides two
 * things: what the primary label is, and what commemoration *groups* are
 * eligible here and in what order — the actual filtering/formatting work
 * is `collectCommemorations`'s alone, shared by every branch.
 */
export function getDayLabel(day: LiturgicalDay): string {
  if (day.winner.kind === 'sanctoral') {
    // Octaves only ride along here on `ordinary-feria` — a day with real
    // standing of its own (a Sunday, a privileged feria) doesn't mention
    // an unrelated active octave even though it's technically active
    // (live-verified: Aug 16, 2026, St. Joachim wins outright on a Sunday
    // that's also within both St. Lawrence's and the Assumption's octave
    // windows, and Divino Afflatu 1954's own commemoration line names
    // only the Sunday, no octave).
    const { sanctoral, temporal, octaves } = collectCommemorations(day, {
      showOctaves: day.temporalCategory === 'ordinary-feria',
    });
    const winnerName = `${day.winner.name} (${formatRank(day.winner.rank)})`;
    return [winnerName, ...temporal, ...sanctoral, ...octaves].join(' — ');
  }

  // A named temporal feast (Christmas, Pentecost, Marian Saturday, ...)
  // shows its own name rather than the ordinal week label — same
  // "winner displaces, doesn't combine" rule a sanctoral winner gets
  // above. Most temporal ids don't have a record at all (see
  // temporal-feasts.ts) and fall through further down.
  const namedFeast = getTemporalFeastRecord(day.winner.id);
  if (namedFeast) {
    const primary = namedFeast.rank ? `${namedFeast.name} (${formatRank(namedFeast.rank)})` : namedFeast.name;
    const { sanctoral } = collectCommemorations(day, { showOctaves: false });
    return [primary, ...sanctoral].join(' — ');
  }

  // A season's own named anchor day (Trinity Sunday, Easter, Ash
  // Wednesday, Epiphany) outranks an active octave, same reasoning as
  // anchorDayName's own doc comment — checked before the octave case
  // below since Trinity Sunday, e.g., also happens to be day 8 of
  // Pentecost's octave, and the anchor name is what actually governs.
  // Existing convention: a commemorated saint *leads* here, before the
  // anchor name — not "winner first" like every branch above.
  const anchorName = anchorDayName(day);
  if (anchorName) {
    const { sanctoral } = collectCommemorations(day, { showOctaves: false });
    return [...sanctoral, anchorName].join(' — ');
  }

  // An active octave (St. Lawrence's, ...) is this day's real primary
  // identity in the live engine, not a footnote — e.g. "Tertia die infra
  // Octavam S. Laurentii Martyris", not "Wednesday in the 11th week after
  // Trinity" — but *only* when the temporal day itself has no standing of
  // its own (`ordinary-feria`), or a foreign octave's own effective rank
  // is strong enough to clear a privileged day's real threshold anyway
  // (`octaveGoverningPrivilegedDay` — the Immaculate Conception's own
  // octave outright winning several of its days against Advent's
  // privileged-feria-minor ferias, live-verified: Dec 9/10/12/14 at the
  // octave's ordinary Semiduplex, Dec 15 at its own elevated Duplex majus
  // closing day). Same gate as hours/resolve-common.ts's
  // resolveOfficeWinner and for the same reason: live-verified
  // counterexample is the Christmas Octave's own stack (Dec 30, e.g.,
  // `privileged-feria-minor`), where the real title stays the temporal
  // Sunday's own ("De Dominica Infra Octavam Nativitatis") with no octave
  // name in it at all, regardless of rank — `octaveGoverningPrivilegedDay`
  // excludes `christmastide` for exactly this reason (see its own doc
  // comment) — this label agreeing with resolveOfficeWinner about which
  // one wins is what makes "the office is Lawrence's" and "the label says
  // Lawrence" consistent instead of two independent guesses that can
  // disagree. When more than one octave is active at once
  // (resolveActiveOctave), the highest-ranked wins the headline (ties
  // broken by whichever started more recently) — every other active
  // octave still gets named too, not dropped: live-verified real case,
  // Aug 17 -- St. Lawrence's own elevated closing day wins the headline,
  // but the Assumption's own day 3 (a real, distinct, simultaneously-
  // active octave, not a duplicate of Lawrence's) still belongs in the
  // label alongside St. Hyacinth's commemoration.
  const activeOctave =
    day.temporalCategory === 'ordinary-feria' ? resolveActiveOctave(day.date) : octaveGoverningPrivilegedDay(day);
  if (activeOctave) {
    const { sanctoral, octaves } = collectCommemorations(day, { showOctaves: true, excludeOctaveId: activeOctave.id });
    const primary = octaveLabel(activeOctave);
    return [primary, ...octaves, ...sanctoral].join(' — ');
  }

  const temporal = `${temporalLabel(day)} (${TEMPORAL_CATEGORY_RANK_LABELS[day.temporalCategory]})`;
  const { sanctoral } = collectCommemorations(day, { showOctaves: false });
  return [...sanctoral, temporal].join(' — ');
}
