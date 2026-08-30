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
//
// Bilingual: every label is built as a `Bi` (`{en, la}`) pair throughout.
// Proper names (a saint's name, an octave's name, a named temporal feast's
// name) have no authored Latin form anywhere in `data/` today — those use
// the English string as their own `la` value too (same "surface real text
// rather than block on missing" convention used elsewhere in this app),
// rather than leaving Latin mode showing blanks. Only the closed,
// mechanism-level vocabulary here (weekdays, ranks, season/ordinal
// phrasing) has real Latin authored.
import type { FeastClass, LiturgicalDay, TemporalCategory, Weekday } from './types';
import { easterSunday } from './easter';
import { adventStart, firstSundayStrictlyAfter, sundayOnOrBefore } from './temporal';
import { addDays, daysBetween, toIsoDate } from './date-math';
import { getTemporalFeastRecord } from './temporal-feasts';
import { activeOctavesFor, octaveGoverningPrivilegedDay, resolveActiveOctave, type ActiveOctave } from './octaves';
import { resolveTemporalId } from './temporal-id';

interface Bi {
  en: string;
  la: string;
  [lang: string]: string;
}

function bi(en: string, la: string): Bi {
  return { en, la };
}

/** A proper name with no authored Latin form yet — the English string
 * stands in for `la` too. See file-header note. */
function biFallback(name: string): Bi {
  return { en: name, la: name };
}

function joinBi(items: Bi[], sep = ' — '): Bi {
  return { en: items.map((i) => i.en).join(sep), la: items.map((i) => i.la).join(sep) };
}

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

// Feminine Latin ordinal adjectives (agreeing with "Dominica"/"Hebdomada"/
// "die", all feminine) — covers 1st through 24th, the full range this app
// ever counts to (Trinitytide's fixed last week is the 23rd). Not a general
// Latin-numerals utility, just this app's own closed display vocabulary.
const ORDINAL_LA = [
  '',
  'prima',
  'secunda',
  'tertia',
  'quarta',
  'quinta',
  'sexta',
  'septima',
  'octava',
  'nona',
  'decima',
  'undecima',
  'duodecima',
  'decima tertia',
  'decima quarta',
  'decima quinta',
  'decima sexta',
  'decima septima',
  'decima octava',
  'decima nona',
  'vicesima',
  'vicesima prima',
  'vicesima secunda',
  'vicesima tertia',
  'vicesima quarta',
];

function ordinalLa(n: number): string {
  return ORDINAL_LA[n] ?? `${n}a`;
}

const WEEKDAY_LABELS: Record<Weekday, Bi> = {
  sunday: bi('Sunday', 'Dominica'),
  monday: bi('Monday', 'Feria Secunda'),
  tuesday: bi('Tuesday', 'Feria Tertia'),
  wednesday: bi('Wednesday', 'Feria Quarta'),
  thursday: bi('Thursday', 'Feria Quinta'),
  friday: bi('Friday', 'Feria Sexta'),
  saturday: bi('Saturday', 'Sabbato'),
};

function weekdayLabel(day: LiturgicalDay): Bi {
  return WEEKDAY_LABELS[day.weekday];
}

interface OrdinalSeason {
  /** ISO date of the season's own anchor day, for a given calendar year. */
  anchorDate(year: number): string;
  /** Advent: the anchor Sunday itself is "week 1". Trinity/Epiphany/Easter/
   * Lent: the anchor is its own named day, excluded from the count — the
   * numbered weeks start the following Sunday. */
  includeAnchorWeek: boolean;
  /** Used in "Weekday after {anchorName}" for the anchor's own partial week,
   * and as the anchor day's own standalone name. */
  anchorName: Bi;
  /** Used in "the Nth Sunday/week {preposition} {ordinalName}". For
   * `preposition: 'of'`, `ordinalName.la` is already the correct genitive
   * form (glued directly after the ordinal, no linking word — Latin
   * idiom). For `preposition: 'after'`, `ordinalName.la` is the form used
   * after "post" (traditionally accusative, or an idiomatic fixed phrase
   * like "post Cineres"). */
  ordinalName: Bi;
  preposition: 'after' | 'of';
  /** The season's own anchor day's rank, if it sits on the closed
   * pre-1955 duplex scale at all — Ash Wednesday (Lent's anchor) doesn't;
   * a privileged feria has no duplex-scale rank, so it's left undefined
   * and shows no parenthetical, same "omit rather than guess" convention
   * `formatRank`/`status` fields use elsewhere. */
  anchorRank?: FeastClass;
  /** Advent and Lent only: once the header always shows the day's weekday
   * on its own, repeating it at the front of this label is redundant — so
   * those two seasons drop it here, in both languages. Every other season
   * keeps the weekday prefix (explicit, narrower scope decision). */
  dropWeekdayPrefix?: boolean;
}

const ORDINAL_SEASONS: Partial<Record<string, OrdinalSeason>> = {
  advent: {
    anchorDate: adventStart,
    includeAnchorWeek: true,
    anchorName: bi('Advent', 'Adventus'),
    // Genitive of 4th-declension "adventus" is also "Adventus" — no
    // linking word needed: "Hebdomada II Adventus".
    ordinalName: bi('Advent', 'Adventus'),
    preposition: 'of',
    dropWeekdayPrefix: true,
  },
  epiphanytide: {
    anchorDate: (year) => `${year}-01-06`,
    includeAnchorWeek: false,
    anchorName: bi('Epiphany', 'Epiphania'),
    // Accusative, for "post Epiphaniam".
    ordinalName: bi('Epiphany', 'Epiphaniam'),
    preposition: 'after',
    anchorRank: 'duplex-1-classis',
  },
  lent: {
    anchorDate: (year) => addDays(toIsoDate(easterSunday(year)), -46),
    includeAnchorWeek: false,
    anchorName: bi('Ash Wednesday', 'Feria Quarta Cinerum'),
    // Genitive of 1st-declension "Quadragesima": "Hebdomada II
    // Quadragesimae". The pre-Lent-I days use the real traditional idiom
    // "post Cineres" instead (see temporalLabel below), not this field.
    ordinalName: bi('Lent', 'Quadragesimae'),
    preposition: 'of',
    dropWeekdayPrefix: true,
  },
  eastertide: {
    anchorDate: (year) => toIsoDate(easterSunday(year)),
    includeAnchorWeek: false,
    anchorName: bi('Easter', 'Pascha'),
    // "Pascha" is indeclinable — same form after "post".
    ordinalName: bi('Easter', 'Pascha'),
    preposition: 'after',
    anchorRank: 'duplex-1-classis',
  },
  trinitytide: {
    anchorDate: (year) => addDays(toIsoDate(easterSunday(year)), 56),
    includeAnchorWeek: false,
    anchorName: bi('Trinity Sunday', 'Dominica Sanctissimae Trinitatis'),
    // Accusative, for "post Sanctissimam Trinitatem" — this app's own
    // Trinity-counted convention (see file header), not the historical
    // Pentecost-counted "post Pentecosten".
    ordinalName: bi('Trinity', 'Sanctissimam Trinitatem'),
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
function anchorDayName(day: LiturgicalDay, withRank = true): Bi | undefined {
  const config = ORDINAL_SEASONS[day.season];
  if (!config || config.includeAnchorWeek) {
    return undefined;
  }
  const year = Number(day.date.slice(0, 4));
  if (day.date === config.anchorDate(year)) {
    return withRank && config.anchorRank
      ? bi(`${config.anchorName.en} (${formatRank(config.anchorRank).en})`, `${config.anchorName.la} (${formatRank(config.anchorRank).la})`)
      : config.anchorName;
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
 * their own native season. Trinitytide isn't in the weekday-drop set, so
 * both languages keep their weekday prefix here.
 */
function trinitytideOverrideLabel(day: LiturgicalDay): Bi | undefined {
  if (day.season !== 'trinitytide') {
    return undefined;
  }
  const id = resolveTemporalId(day.date);
  const weekdayName = weekdayLabel(day);

  const epiphanyMatch = id.match(/^post-epiphany-(\d)$/);
  if (epiphanyMatch) {
    const n = Number(epiphanyMatch[1]);
    return day.weekday === 'sunday'
      ? bi(`The ${ordinal(n)} Sunday after Epiphany`, `Dominica ${ordinalLa(n)} post Epiphaniam`)
      : bi(`${weekdayName.en} in the ${ordinal(n)} week after Epiphany`, `${weekdayName.la} in hebdomada ${ordinalLa(n)} post Epiphaniam`);
  }

  if (id === 'post-pentecost-24') {
    return day.weekday === 'sunday'
      ? bi(
          `The ${ordinal(FIXED_LAST_SUNDAY_ORDINAL)} Sunday after Trinity`,
          `Dominica ${ordinalLa(FIXED_LAST_SUNDAY_ORDINAL)} post Sanctissimam Trinitatem`,
        )
      : bi(
          `${weekdayName.en} in the ${ordinal(FIXED_LAST_SUNDAY_ORDINAL)} week after Trinity`,
          `${weekdayName.la} in hebdomada ${ordinalLa(FIXED_LAST_SUNDAY_ORDINAL)} post Sanctissimam Trinitatem`,
        );
  }

  return undefined;
}

function temporalLabel(day: LiturgicalDay): Bi {
  const trinitytideOverride = trinitytideOverrideLabel(day);
  if (trinitytideOverride) {
    return trinitytideOverride;
  }

  const weekdayName = weekdayLabel(day);
  const config = ORDINAL_SEASONS[day.season];
  if (!config) {
    // No ordinal convention modeled for this season (Septuagesima-tide,
    // Passiontide, Ascensiontide, Pentecost, Christmastide, the
    // Corpus-Christi/Sacred-Heart single-day seasons) — their few days
    // mostly have their own proper names rather than ordinal counting, so
    // this fallback is expected to be seen, not a gap to fill later. No
    // authored Latin season name exists for these yet, so `la` falls back
    // to the same English season word.
    const seasonName = capitalize(day.season.replace(/-/g, ' '));
    return bi(`${weekdayName.en} in ${seasonName}`, `${weekdayName.la} in ${seasonName}`);
  }

  const year = Number(day.date.slice(0, 4));
  const anchor = config.anchorDate(year);
  const anchorName = anchorDayName(day);
  if (anchorName) {
    return anchorName;
  }

  const firstNumberedSunday = config.includeAnchorWeek ? anchor : firstSundayStrictlyAfter(anchor);
  if (day.date < firstNumberedSunday) {
    // Lent's own pre-Lent-I days use the real traditional idiom "post
    // Cineres" rather than the season's genitive `ordinalName` (which is
    // built for the "of Lent" construction, not "after Ash Wednesday").
    const afterAnchorLa = day.season === 'lent' ? 'Cineres' : config.anchorName.la;
    return config.dropWeekdayPrefix
      ? bi(`After ${config.anchorName.en}`, `Post ${afterAnchorLa}`)
      : bi(`${weekdayName.en} after ${config.anchorName.en}`, `${weekdayName.la} post ${afterAnchorLa}`);
  }

  const weeksSince = daysBetween(firstNumberedSunday, sundayOnOrBefore(day.date)) / 7;
  const ordinalStr = ordinal(weeksSince + 1);
  const ordinalStrLa = ordinalLa(weeksSince + 1);
  if (day.weekday === 'sunday') {
    return config.preposition === 'of'
      ? bi(`The ${ordinalStr} Sunday of ${config.ordinalName.en}`, `Dominica ${ordinalStrLa} ${config.ordinalName.la}`)
      : bi(`The ${ordinalStr} Sunday after ${config.ordinalName.en}`, `Dominica ${ordinalStrLa} post ${config.ordinalName.la}`);
  }
  const weekPhraseLa =
    config.preposition === 'of' ? `hebdomada ${ordinalStrLa} ${config.ordinalName.la}` : `hebdomada ${ordinalStrLa} post ${config.ordinalName.la}`;
  return config.dropWeekdayPrefix
    ? bi(`In the ${ordinalStr} week ${config.preposition} ${config.ordinalName.en}`, `In ${weekPhraseLa}`)
    : bi(`${weekdayName.en} in the ${ordinalStr} week ${config.preposition} ${config.ordinalName.en}`, `${weekdayName.la} in ${weekPhraseLa}`);
}

/** "Third Day within the Octave of St. Lawrence" for an ordinary mid-octave
 * day ("Tertia die infra Octavam S. Laurentii Martyris"), or plain "Octave
 * of St. Lawrence" for the octave's own closing day ("In Octava S.
 * Laurentii Martyris") — real DO Latin distinguishes "infra octavam"
 * (within the octave, days 2-7) from "in octava" (on the octave day
 * itself, day 8), live-verified: Aug 17 (St. Lawrence's closing day)
 * titles itself "In Octava S. Laurentii Martyris", not "Octava die infra
 * Octavam...". Day 1 shouldn't normally reach either branch (that day's
 * own winner is the feast itself, handled above before this is ever
 * called) — kept simple rather than special-cased for that rare edge case
 * (see applyOctaves's own `isOwnStartDay` comment in calendar/index.ts for
 * when it can happen). The octave's own `name` has no authored Latin form
 * (see file header), so both languages currently show the same name text
 * — only the surrounding phrasing differs. */
function octaveCoreName(octave: ActiveOctave): Bi {
  return octave.isClosingDay
    ? bi(`Octave of ${octave.name}`, `In Octava ${octave.name}`)
    : bi(`${ordinal(octave.dayNumber)} Day within the Octave of ${octave.name}`, `${ordinalLa(octave.dayNumber)} die infra Octavam ${octave.name}`);
}

function octaveLabel(octave: ActiveOctave): Bi {
  const core = octaveCoreName(octave);
  const rank = formatRank(octave.wins);
  return bi(`${core.en} (${rank.en})`, `${core.la} (${rank.la})`);
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
function octaveCommemorationLabel(octave: ActiveOctave): Bi {
  return octaveCoreName(octave);
}

/** Real Divino Afflatu phrasing for a commemoration that only exists
 * because Vespers/Compline crossed a day boundary — "commemoratio de
 * præcedenti" (today, riding along on tomorrow's anticipated First
 * Vespers) or "commemoratio de sequenti" (tomorrow, riding along on
 * today's kept Second Vespers), per horascommon.pl. See
 * `Commemoration`'s `vespersNote` field (calendar/types.ts) and
 * calendar/vespers.ts's two `commemorationOfDisplaced*` functions, the
 * only place that sets it. */
const CROSS_DAY_VESPERS_LABELS: Record<'today' | 'tomorrow', Bi> = {
  today: bi('of today', 'de præcedenti'),
  tomorrow: bi('of tomorrow', 'de sequenti'),
};

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
 *   them, not just the first). No authored Latin saint names exist yet
 *   (see file header), so `la` falls back to the same English name.
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
): { sanctoral: Bi[]; temporal: Bi[]; octaves: Bi[] } {
  const temporalId = resolveTemporalId(day.date);
  const activeOctaves = opts.showOctaves ? activeOctavesFor(day.date) : [];
  const sanctoral: Bi[] = [];
  const temporal: Bi[] = [];
  const octaves: Bi[] = [];
  for (const c of day.commemorations) {
    if (c.kind === 'sanctoral') {
      const name = biFallback(c.name);
      sanctoral.push(
        c.vespersNote
          ? bi(`${name.en} (${CROSS_DAY_VESPERS_LABELS[c.vespersNote].en})`, `${name.la} (${CROSS_DAY_VESPERS_LABELS[c.vespersNote].la})`)
          : name,
      );
    } else if (c.kind === 'temporal') {
      if (c.id === temporalId) {
        temporal.push(anchorDayName(day, false) ?? temporalLabel(day));
      }
    } else if (opts.showOctaves && c.id !== opts.excludeOctaveId) {
      const octave = activeOctaves.find((a) => a.id === c.id);
      octaves.push(octave ? octaveCommemorationLabel(octave) : biFallback(c.name));
    }
  }
  return { sanctoral, temporal, octaves };
}

const RANK_LABELS: Record<FeastClass, Bi> = {
  simplex: bi('Simplex', 'Simplex'),
  vigil: bi('Vigil', 'Vigilia'),
  semiduplex: bi('Semiduplex', 'Semiduplex'),
  duplex: bi('Duplex', 'Duplex'),
  'duplex-majus': bi('Duplex Majus', 'Duplex Majus'),
  'duplex-2-classis': bi('Duplex II Class', 'Duplex II. Classis'),
  'duplex-1-classis': bi('Duplex I Class', 'Duplex I. Classis'),
};

/** The day's own winning saint's rank, parenthesized after their name —
 * rank was previously shown nowhere in this app's UI at all, for any
 * saint. Only the day's own *winner* gets this treatment, not every
 * commemoration, matching the "winner is primary, commemorations are
 * secondary" distinction this file already draws throughout. */
function formatRank(rank: FeastClass): Bi {
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
 * Sunday categories share one label here. Both "Semiduplex" and "Feria"
 * are already the real Latin words, so `en`/`la` coincide here too. */
const TEMPORAL_CATEGORY_RANK_LABELS: Record<TemporalCategory, Bi> = {
  'ordinary-sunday': bi('Semiduplex', 'Semiduplex'),
  'privileged-sunday': bi('Semiduplex', 'Semiduplex'),
  'ordinary-feria': bi('Feria', 'Feria'),
  'privileged-feria-minor': bi('Feria', 'Feria'),
  'privileged-feria': bi('Feria', 'Feria'),
  'privileged-feria-major': bi('Feria', 'Feria'),
};

/**
 * Explicit "which Vespers is this" status, for the Vespers hour header —
 * distinct from `getDayLabel`'s name/rank/commemoration text, which is
 * silent about *why* a given identity governs tonight (a reader has to
 * already know, e.g., that St. Zephyrinus falls on tomorrow's date to
 * realize this evening is anticipating him). Pass the result of
 * `calendar/vespers.ts`'s `resolveEveningDay`, not a plain `resolveDay`,
 * plus the originally-requested date — comparing the two directly (rather
 * than checking `winner.vespersFrom`, which only ever gets set for a
 * *sanctoral* tomorrow-winner, see `vespers.ts`'s `tagVespersFrom`) is
 * what makes this correct even when tomorrow's winner is `temporal` (e.g.
 * an ordinary Sunday winning outright over a merely-commemorated Simplex
 * saint) — a case `winner.vespersFrom` can never detect since that field
 * doesn't exist on the temporal variant of `DayWinner` at all.
 */
export function getVespersStatusLabel(day: LiturgicalDay, requestedDate: string): Bi {
  if (day.date !== requestedDate) {
    return bi('First Vespers (of tomorrow)', 'Vesperæ de sequenti');
  }
  return bi('Second Vespers (of today)', 'Vesperæ de hodierno');
}

/**
 * The full "day being celebrated" label: the day's own primary identity
 * (a sanctoral winner, a named temporal feast, a season's own anchor day,
 * an octave governing the day, or the plain ordinal temporal label — in
 * that precedence order) plus whatever `collectCommemorations` finds
 * eligible to ride along with it. Each branch below only decides two
 * things: what the primary label is, and what commemoration *groups* are
 * eligible here and in what order — the actual filtering/formatting work
 * is `collectCommemorations`'s alone, shared by every branch. Returns a
 * `Partial<Record<string, string>>` keyed by language code (`en`/`la`),
 * the same convention `hours/types.ts`'s `ResolvedText`/`ResolvedVerse`
 * already use.
 */
export function getDayLabel(day: LiturgicalDay): Partial<Record<string, string>> {
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
    const rank = formatRank(day.winner.rank);
    const winnerName = biFallback(day.winner.name);
    const winner = bi(`${winnerName.en} (${rank.en})`, `${winnerName.la} (${rank.la})`);
    return joinBi([winner, ...temporal, ...sanctoral, ...octaves]);
  }

  // A named temporal feast (Christmas, Pentecost, Marian Saturday, ...)
  // shows its own name rather than the ordinal week label — same
  // "winner displaces, doesn't combine" rule a sanctoral winner gets
  // above. Most temporal ids don't have a record at all (see
  // temporal-feasts.ts) and fall through further down.
  const namedFeast = getTemporalFeastRecord(day.winner.id);
  if (namedFeast) {
    const name = biFallback(namedFeast.name);
    const primary = namedFeast.rank
      ? bi(`${name.en} (${formatRank(namedFeast.rank).en})`, `${name.la} (${formatRank(namedFeast.rank).la})`)
      : name;
    const { sanctoral } = collectCommemorations(day, { showOctaves: false });
    return joinBi([primary, ...sanctoral]);
  }

  // A season's own named anchor day (Trinity Sunday, Easter, Ash
  // Wednesday, Epiphany) outranks an active octave, same reasoning as
  // anchorDayName's own doc comment — checked before the octave case
  // below since Trinity Sunday, e.g., also happens to be day 8 of
  // Pentecost's octave, and the anchor name is what actually governs.
  // Winner first, same as every other branch here — the anchor day is
  // what's actually being celebrated even when a lesser saint rides along.
  const anchorName = anchorDayName(day);
  if (anchorName) {
    const { sanctoral } = collectCommemorations(day, { showOctaves: false });
    return joinBi([anchorName, ...sanctoral]);
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
    return joinBi([primary, ...octaves, ...sanctoral]);
  }

  const temporalRank = TEMPORAL_CATEGORY_RANK_LABELS[day.temporalCategory];
  const label = temporalLabel(day);
  const temporal = bi(`${label.en} (${temporalRank.en})`, `${label.la} (${temporalRank.la})`);
  const { sanctoral } = collectCommemorations(day, { showOctaves: false });
  return joinBi([temporal, ...sanctoral]);
}
