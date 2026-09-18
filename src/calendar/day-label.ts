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
// name) carry an optional `nameLa` field alongside the required English
// `name` — see calendar/types.ts's `SanctoralIdentity.nameLa` doc comment.
// Authored for essentially every saint/octave/named-feast as of 2026-08-31
// (see TODO.md); `biName` still falls back to the English string as the
// `la` value for the rare unauthored case (same "surface real text rather
// than block on missing" convention used elsewhere in this app), rather
// than leaving Latin mode showing blanks. The closed, mechanism-level
// vocabulary here (weekdays, ranks, season/ordinal phrasing) has always
// had real Latin authored, independent of this.
import type { Commemoration, FeastClass, LiturgicalDay, TemporalCategory, Weekday } from './types';
import { easterSunday } from './easter';
import { adventStart, firstSundayStrictlyAfter, sundayOnOrBefore } from './temporal';
import { addDays, daysBetween, toIsoDate } from './date-math';
import { getTemporalFeastRecord, movableTemporalFeasts } from './temporal-feasts';
import { activeOctavesFor, octaveGoverningPrivilegedDay, resolveActiveOctave, type ActiveOctave } from './octaves';
import { resolveTemporalId } from './temporal-id';
import { compareCommemorations } from './commemoration-order';
import { getSaintRecord } from './feasts';

export interface Bi {
  en: string;
  la: string;
  [lang: string]: string;
}

function bi(en: string, la: string): Bi {
  return { en, la };
}

/** A proper name (saint, octave, named temporal feast) with an optional
 * authored Latin form — falls back to the English string when `nameLa`
 * hasn't been authored yet, same convention as `biFallback` above. */
export function biName(name: string, nameLa: string | undefined): Bi {
  return { en: name, la: nameLa ?? name };
}

/** Like `biName`, but prefers an explicit, curated short form (`titleName`/
 * `titleNameLa` — see `calendar/feasts.ts`'s `SaintRecord.titleName` doc
 * comment) when one has been authored, for browser-tab-title use only
 * (`getDayTitleName`). `titleNameLa` is its own opt-in, independent of
 * whether `titleName` is set — a short English form doesn't imply a short
 * Latin one is wanted or even sensible, so the Latin side just falls back
 * to the ordinary `nameLa`/`name` chain when it's absent. */
function biTitleName(name: string, nameLa: string | undefined, titleName: string | undefined, titleNameLa: string | undefined): Bi {
  return { en: titleName ?? name, la: titleNameLa ?? nameLa ?? name };
}

function joinBi(items: Bi[], sep = ' — '): Bi {
  return { en: items.map((i) => i.en).join(sep), la: items.map((i) => i.la).join(sep) };
}

/**
 * The 6 Ember-day ids (calendar/ember-days.ts) are deliberately *not* in
 * temporal-feasts.ts's named-feast table — they're privileged ferias, not
 * rank-contesting movable feasts (see that file's own doc comment), and
 * that table's `getTemporalFeastRecord` also doubles as resolve-
 * common.ts's `isFerialOrVigil` bareness check, so adding them there
 * would silently turn off their own ferial Preces (their `[Rule]` block
 * is literally "Preces Feriales"). A small standalone lookup here instead
 * — Latin names read straight from each day's own `[Officium]` header
 * (Tempora/093-{3,5,6}.txt, Tempora/Adv3-{3,5,6}.txt).
 *
 * Without this, an Ember day never named itself anywhere in the UI: not
 * as the primary label when it wins outright (fell through to the plain
 * "Wednesday in the Nth week after Trinity"/"In the Nth week of Advent"
 * wording with no Ember mention at all), and not as a commemoration when
 * demoted (collectCommemorations's temporal branch only ever matched
 * `resolveTemporalId(day.date)`, never an Ember-relabeled id) — live-
 * verified as a real, user-visible gap, 2026-09-03.
 */
const EMBER_DAY_NAMES: Record<string, Bi> = {
  'ember-september-wednesday': bi('Ember Wednesday in September', 'Feria Quarta Quattuor Temporum Septembris'),
  'ember-september-friday': bi('Ember Friday in September', 'Feria Sexta Quattuor Temporum Septembris'),
  'ember-september-saturday': bi('Ember Saturday in September', 'Sabbato Quattuor Temporum Septembris'),
  'ember-advent-wednesday': bi('Ember Wednesday in Advent', 'Feria IV Quattuor Temporum in Adventu'),
  'ember-advent-friday': bi('Ember Friday in Advent', 'Feria VI Quattuor Temporum in Adventu'),
  'ember-advent-saturday': bi('Ember Saturday in Advent', 'Sabbato Quattuor Temporum in Adventu'),
};

export function emberDayLabel(id: string): Bi | undefined {
  return EMBER_DAY_NAMES[id];
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

/** All Souls' Day (Nov 2) — the Office of the Dead. This is a pure
 * hour-level override (see hours/all-souls.ts), with no calendar-level
 * winner/octave of its own, so without the `getDayLabel` check that uses
 * this, Nov 2 falls through to the calendar's real answer — "Octave of
 * All Saints (2nd Day)" — which is calendar-accurate but not what's
 * actually being prayed that day. */
export function isAllSouls(date: string): boolean {
  return date.slice(5) === '11-02';
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

/** The three named Sundays/weeks of Septuagesima-tide, keyed by
 * `resolveTemporalId`'s own governing-Sunday id — see `temporalLabel`'s
 * `!config` fallback for why this is needed at all. */
const SEPTUAGESIMATIDE_NAMES: Record<string, Bi> = {
  septuagesima: bi('Septuagesima', 'Septuagesima'),
  sexagesima: bi('Sexagesima', 'Sexagesima'),
  quinquagesima: bi('Quinquagesima', 'Quinquagesima'),
};

/**
 * Trinitytide's ordinal display can't be pure "weeks since Trinity's own
 * first Sunday" arithmetic once the season gets late enough — see
 * temporal-id.ts's own post-Pentecost-XXIII-plus branch. Two cases, both
 * driven by `resolveTemporalId` directly (the same mechanism the content
 * layer already trusts, rather than re-deriving the wdist arithmetic here
 * a second time, so the label can never disagree with what's actually
 * rendered underneath):
 *   - A resumed post-Epiphany Sunday/week (an overflow year's skipped
 *     Epiphany Sundays, reappearing here) — reads "after Epiphany,
 *     resumed", not the next Trinity-counted number in line and not a
 *     bare "after Epiphany" (which would look identical to an ordinary,
 *     in-season post-Epiphany Sunday).
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
      ? bi(`The ${ordinal(n)} Sunday after Epiphany, resumed`, `Dominica ${ordinalLa(n)} post Epiphaniam, resumpta`)
      : bi(
          `${weekdayName.en} in the ${ordinal(n)} week after Epiphany, resumed`,
          `${weekdayName.la} in hebdomada ${ordinalLa(n)} post Epiphaniam, resumpta`,
        );
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

/**
 * Which Easter-anchored movable-feast record's own `anchor` date exactly
 * matches `isoDate`, independent of who actually won that day —
 * `calendar/movable-feasts.ts`'s `applyMovableFeasts` runs this same
 * match to decide `day.winner`, but `temporalLabel` deliberately doesn't
 * consult `day.winner` at all (see its own doc comment), so a caller that
 * only has a plain temporal identity in mind (a saint's own commemoration
 * line naming what they displaced, `hours/matins.ts`'s `occasionName`)
 * needs this same lookup done independently. Scoped to `{kind: 'easter'}`
 * anchors only — the other anchor kinds (`nth-sunday-of-month`, etc.)
 * have no caller here yet; extend if one needs it.
 */
function easterAnchoredFeastFor(isoDate: string): ReturnType<typeof getTemporalFeastRecord> {
  const year = Number(isoDate.slice(0, 4));
  const easter = toIsoDate(easterSunday(year));
  for (const feast of movableTemporalFeasts()) {
    if (feast.anchor?.kind === 'easter' && addDays(easter, feast.anchor.offset) === isoDate) {
      return feast;
    }
  }
  return undefined;
}

/** The plain temporal/Sunday-or-feria name only (ordinal week/season
 * phrasing, e.g. "The Twenty-fourth Sunday after Pentecost"), independent of
 * who actually won the day — i.e. what the day would be called if the
 * temporal cycle were the winner. Exported for callers (e.g.
 * `hours/matins.ts`'s `occasionName`) that want to name the governing
 * Sunday/feria without repeating a sanctoral winner's own rank-qualified
 * label from `getDayLabel`. */
export function temporalLabel(day: LiturgicalDay): Bi {
  const trinitytideOverride = trinitytideOverrideLabel(day);
  if (trinitytideOverride) {
    return trinitytideOverride;
  }

  const weekdayName = weekdayLabel(day);
  const config = ORDINAL_SEASONS[day.season];
  if (!config) {
    // Septuagesima-tide's own three named Sundays/weeks (Septuagesima,
    // Sexagesima, Quinquagesima) all share the single coarse `septuagesima`
    // `Season` bucket (easter-offsets.yml's ranges only change at Lent), so
    // `day.season` alone can't tell them apart — falling through to the
    // generic seasonName branch below named every one of them
    // "Septuagesima" regardless of which week it actually was. Distinguish
    // them via `resolveTemporalId`, the same governing-Sunday-offset id the
    // content layer already keys off, so this can never disagree with what
    // collect/propers are actually in effect that week.
    if (day.season === 'septuagesima') {
      const name = SEPTUAGESIMATIDE_NAMES[resolveTemporalId(day.date)];
      if (name) {
        return day.weekday === 'sunday'
          ? bi(`${name.en} Sunday`, `Dominica in ${name.la}`)
          : bi(`${weekdayName.en} in ${name.en} week`, `${weekdayName.la} in ${name.la}`);
      }
    }
    // Passiontide: every one of the 14 days from Passion Sunday through
    // Holy Saturday now has its own real temporal-feasts record (fixed
    // 2026-09-06 — see calendar/movable-feasts.ts's Passiontide override
    // doc comment), found here independent of `day.winner` via
    // `easterAnchoredFeastFor`, the same way `resolveTemporalId` above is
    // used independent of the winner for Septuagesima-tide. This must run
    // before the generic seasonName fallback below, which is what used to
    // render every single one of these 14 days as an undifferentiated
    // "Weekday in Passiontide".
    if (day.season === 'passiontide') {
      const feast = easterAnchoredFeastFor(day.date);
      if (feast) {
        return biName(feast.name, feast.nameLa);
      }
    }
    // No ordinal convention modeled for this season (Ascensiontide,
    // Pentecost, Christmastide, the Corpus-Christi/Sacred-Heart single-day
    // seasons) — their few days mostly have their own proper names rather
    // than ordinal counting, so this fallback is expected to be seen, not
    // a gap to fill later. No authored Latin season name exists for these
    // yet, so `la` falls back to the same
    // English season word.
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

// Lowercases a feast's own leading "The" article when it's embedded
// mid-phrase after "Octave of" — the raw `name` field ("The Nativity of
// the Blessed Virgin Mary") is written to stand alone as a feast title
// (capital "The"), so composing it in place produces a stray,
// ungrammatical mid-sentence capital ("...Octave of The Nativity...").
// The article itself is still grammatically required ("Octave of the
// Nativity", not "Octave of Nativity"), just not capitalized there. Latin
// has no articles, so this only ever needs to run on the English side.
function lowercaseLeadingArticle(name: string): string {
  return name.replace(/^The\b/, 'the');
}

// An em dash (`joinBi`'s ' — ' separator) reads as "here's a new,
// separate thing" — that's exactly right for stitching a headline to an
// unrelated commemoration riding alongside it, but wrong for a day count
// that's just a detail *of* the same headline (2026-09-09 user
// correction). A trailing parenthetical is this app's own established
// convention for exactly that kind of same-headline detail already (every
// branch appends its rank the same way, e.g. "St. Jerome (Duplex)") — day
// count and rank fold into one parenthetical together (`appendParen`)
// rather than stacking two separate ones.
function appendParen(base: Bi, parts: readonly (Bi | undefined)[]): Bi {
  const present = parts.filter((p): p is Bi => p !== undefined);
  if (present.length === 0) return base;
  return bi(`${base.en} (${present.map((p) => p.en).join(', ')})`, `${base.la} (${present.map((p) => p.la).join(', ')})`);
}

/** The octave's own day count as a standalone fragment ("3rd Day" /
 * "Dies Tertia"), for `appendParen` to fold into whichever headline needs
 * it — `undefined` on the octave's own closing day, which doesn't carry a
 * day count at all (see `octaveCoreName`'s doc comment for why). */
function octaveDayPhrase(octave: ActiveOctave): Bi | undefined {
  return octave.isClosingDay ? undefined : bi(`${ordinal(octave.dayNumber)} Day`, `Dies ${ordinalLa(octave.dayNumber)}`);
}

/** "Octave of St. Lawrence" for an ordinary mid-octave day ("Octava S.
 * Laurentii Martyris") or the octave's own closing day ("In Octava S.
 * Laurentii Martyris") — real DO Latin distinguishes "infra octavam"
 * (within the octave, days 2-7) from "in octava" (on the octave day
 * itself, day 8), live-verified: Aug 17 (St. Lawrence's closing day)
 * titles itself "In Octava S. Laurentii Martyris", not "Octava die infra
 * Octavam...". Day 1 shouldn't normally reach either branch (that day's
 * own winner is the feast itself, handled above before this is ever
 * called) — kept simple rather than special-cased for that rare edge case
 * (see applyOctaves's own `isOwnStartDay` comment in calendar/index.ts for
 * when it can happen). Falls back to the English name for `la` too when
 * the octave's own record has no authored `nameLa` yet (see file header).
 * Bare — no day count, no rank; every caller folds those in itself via
 * `appendParen`/`octaveDayPhrase`, since which of them belongs depends on
 * context (a commemoration gets the day count but not the rank; the
 * primary headline gets both; the title gets the day count but a curated
 * short name instead of the full one — see `octaveTitleName`). */
function octaveCoreName(octave: ActiveOctave): Bi {
  const name = biName(octave.name, octave.nameLa);
  const octaveOf = bi(`Octave of ${lowercaseLeadingArticle(name.en)}`, `Octava ${name.la}`);
  return octave.isClosingDay ? bi(octaveOf.en, `In ${octaveOf.la}`) : octaveOf;
}

function octaveLabel(octave: ActiveOctave): Bi {
  return appendParen(octaveCoreName(octave), [octaveDayPhrase(octave), formatRank(octave.wins)]);
}

/** Same phrasing as `octaveLabel`, but without the rank — the real DO
 * commemoration line for a displaced octave day carries no rank at all
 * (e.g. Aug 19's real Divino Afflatu 1954 commemoration reads plain
 * "Quinta die infra Octavam S. Assumptionis Beatæ Mariæ Virginis", no
 * "~ Semiduplex"). `octaveLabel`'s own rank only belongs to an octave day
 * when it's the day's own primary winner (rank is what it *won as*, not a
 * fact worth restating once a duplex-or-higher saint has displaced it and
 * it's just riding along as a commemoration instead) — the day count,
 * unlike the rank, still belongs here regardless (it's not a "won as"
 * fact, just which day of the octave this is). */
function octaveCommemorationLabel(octave: ActiveOctave): Bi {
  return appendParen(octaveCoreName(octave), [octaveDayPhrase(octave)]);
}

/** `getDayTitleName`'s own octave form — "Octave of {short name}", plus
 * the day count (2026-09-09 user correction: "Octave of X" alone doesn't
 * say *which* day of the octave this is, and that's real information a
 * tab title shouldn't drop just because the name needed shortening).
 * Prefers `titleName` when the octave's own source record authored one
 * (see `calendar/feasts.ts`'s `SaintRecord.titleName` doc comment). */
function octaveTitleName(octave: ActiveOctave): Bi {
  const name = biTitleName(octave.name, octave.nameLa, octave.titleName, octave.titleNameLa);
  const core = bi(`Octave of ${octave.titleName ? name.en : lowercaseLeadingArticle(name.en)}`, `Octava ${name.la}`);
  const withIn = octave.isClosingDay ? bi(core.en, `In ${core.la}`) : core;
  return appendParen(withIn, [octaveDayPhrase(octave)]);
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
 *   them, not just the first). `la` uses the saint's own `nameLa` when
 *   authored, else falls back to the same English name (see file header).
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
 *   headline. Rendered via `octaveCommemorationLabel` — the "Octave of X
 *   (Nth Day)" phrasing, no rank.
 */
/** Sort key alongside each rendered `Bi`, so the merged list below can be
 * ordered "most recent date first" (see commemoration-order.ts) across
 * every kind at once — a plain kind-grouped concatenation (the previous
 * design) can't interleave e.g. a temporal and an octave commemoration by
 * real date, only by which bucket they landed in. */
interface CommemorationItem {
  c: Commemoration;
  bi: Bi;
}

function collectCommemorations(
  day: LiturgicalDay,
  opts: { showOctaves: boolean; excludeOctaveId?: string; includeTemporal?: boolean },
): Bi[] {
  const temporalId = resolveTemporalId(day.date);
  const activeOctaves = opts.showOctaves ? activeOctavesFor(day.date) : [];
  const items: CommemorationItem[] = [];
  for (const c of day.commemorations) {
    if (c.kind === 'sanctoral') {
      const name = biName(c.name, c.nameLa);
      if (c.vespersNote) {
        items.push({
          c,
          bi: bi(`${name.en} (${CROSS_DAY_VESPERS_LABELS[c.vespersNote].en})`, `${name.la} (${CROSS_DAY_VESPERS_LABELS[c.vespersNote].la})`),
        });
      } else if (c.transferredFrom) {
        // Same "arrived via transfer, not natively due here" signal as a
        // transferred-in *winner* gets — a reader shouldn't need to already
        // know this saint's real date to realize a mere commemoration here
        // is standing in for a transfer, not this date's own natural
        // sanctoral standing.
        items.push({ c, bi: bi(`${name.en} (${TRANSFERRED_LABEL.en})`, `${name.la} (${TRANSFERRED_LABEL.la})`) });
      } else {
        items.push({ c, bi: name });
      }
    } else if (c.kind === 'temporal' && opts.includeTemporal) {
      // `c.id === temporalId` (the plain governing weekday, e.g. "Saturday
      // in the 15th week after Trinity") is deliberately never shown here:
      // this function only ever runs to list *secondary* identities
      // alongside an already-displayed primary winner (a plain temporal
      // day that wins outright never reaches `day.commemorations` at all —
      // its own name is the header itself, via a different branch of
      // `getDayLabel`). Once something else is already being celebrated,
      // restating "this is also just the Nth ordinary weekday" tells the
      // reader nothing they don't already know from the winner+rank shown
      // — unlike a *named* temporal identity (an Ember day, a vigil), which
      // genuinely adds information. Not Ember-specific (a 2026-09-05 first
      // pass wrongly scoped this to "only when an Ember commemoration is
      // also present" — user, 2026-09-05: "it has nothing to do with
      // ember-ness"); this plain generic label is dropped unconditionally
      // whenever it shows up as a mere commemoration on an ordinary
      // ferial weekday, Ember day or not.
      //
      // A commemorated *Sunday* is the one exception (user, 2026-09-05):
      // unlike a plain ferial Tuesday, "this is also a Sunday" is real
      // information a reader can't infer from the winner+rank alone — it's
      // why the Sunday's own collect is being said at all (getDayCollects'
      // temporalCommemorationPart), and nothing else in the header hints
      // at it. Shown via the same plain, rank-free `temporalLabel` a
      // winning Sunday would use for itself.
      if (c.id !== temporalId) {
        // Ember days first (their own separate small lookup, pre-dating
        // this one), then any other named temporal identity with a real
        // `temporal-feasts` record (a Passiontide day, a Vigil, ...) —
        // added 2026-09-06: found via live-checking St. Gabriel/the
        // Annunciation winning outright on a Passiontide feria that a
        // commemoration should still surface a real name for the
        // commemorated feria couldn't correctly appear at all (this
        // branch previously only recognized Ember days, silently
        // dropping every other named temporal commemoration).
        const emberName = emberDayLabel(c.id);
        const feast = emberName ? undefined : getTemporalFeastRecord(c.id);
        if (emberName) {
          items.push({ c, bi: emberName });
        } else if (feast) {
          items.push({ c, bi: biName(feast.name, feast.nameLa) });
        }
      } else if (day.weekday === 'sunday') {
        items.push({ c, bi: temporalLabel(day) });
      } else if (c.name) {
        // Cross-day Vespers/Compline case (commemorationOfDisplacedPredecessor):
        // `day` here is tomorrow, not the actual displaced Sunday, so
        // `day.weekday === 'sunday'` above can't fire even though this
        // commemoration genuinely is of a Sunday — the commemoration already
        // carries its own real bilingual label for exactly this reason.
        items.push({ c, bi: biName(c.name, c.nameLa) });
      }
    } else if (c.kind === 'octave' && opts.showOctaves && c.id !== opts.excludeOctaveId) {
      const octave = activeOctaves.find((a) => a.id === c.id);
      items.push({ c, bi: octave ? octaveCommemorationLabel(octave) : biName(c.name, c.nameLa) });
    }
  }
  return [...items].sort((a, b) => compareCommemorations(day, a.c, b.c)).map((i) => i.bi);
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

/** Appended after a transferred-in winner's name/rank, before any
 * commemorations — same shape as a rank parenthetical. Distinct wording
 * from `TRANSFERRED_AWAY_LABEL` below on purpose: this winner's own rank
 * parenthetical sits right next to it ("St. X (Duplex, transferred)"), so
 * plain "transferred" already reads as "arrived via transfer" in context —
 * but on the origin date there's no rank alongside it to anchor that
 * reading, so the away-note spells out the direction explicitly instead of
 * relying on that same subtlety a first-time reader wouldn't have. */
const TRANSFERRED_LABEL = bi('transferred', 'translata');

/** See `TRANSFERRED_LABEL`'s doc comment for why this is worded differently. */
const TRANSFERRED_AWAY_LABEL = bi('transferred away', 'translata alio');

/** For `day.transferredAway.landed === false` — a candidate impeded within
 * the Easter span too weak for the backlog floor, which never actually
 * lands anywhere (see `transferredAway`'s own doc comment). Distinct
 * wording from `TRANSFERRED_AWAY_LABEL`: that one promises the office
 * moved elsewhere; this one is honest that it simply didn't happen this
 * year. */
const OMITTED_LABEL = bi('omitted this year', 'omissa hoc anno');

/** "St. X (transferred away)" / "St. X (omitted this year)" note for a
 * date whose own native sanctoral candidate (`day.transferredAway`)
 * couldn't be kept here — appended after everything else `getDayLabel`
 * already found for this date's real winner/commemorations, since the
 * departure is a footnote about a *different* saint, not part of this
 * date's own identity. When `landed` is true, deliberately names no
 * landing date (see `transferredAway`'s own doc comment) — the point is
 * just to tell a reader "not an omission, this office moved elsewhere,"
 * not to claim a specific destination that a later, unmodeled transfer
 * chain could make wrong. When `landed` is false, there is no elsewhere
 * to be vague about, so the note says so plainly instead. */
function transferredAwayNote(day: LiturgicalDay): Bi | undefined {
  if (!day.transferredAway) {
    return undefined;
  }
  const name = biName(day.transferredAway.candidate.name, day.transferredAway.candidate.nameLa);
  const label = day.transferredAway.landed ? TRANSFERRED_AWAY_LABEL : OMITTED_LABEL;
  return bi(`${name.en} (${label.en})`, `${name.la} (${label.la})`);
}

function withTransferNote(day: LiturgicalDay, items: Bi[]): Bi[] {
  const note = transferredAwayNote(day);
  return note ? [...items, note] : items;
}

/**
 * The full "day being celebrated" label, as its individual entries: the
 * day's own primary identity (a sanctoral winner, a named temporal feast,
 * a season's own anchor day, an octave governing the day, or the plain
 * ordinal temporal label — in that precedence order) first, followed by
 * whatever `collectCommemorations` finds eligible to ride along with it,
 * and finally a transfer-away note if one applies. Each branch below only
 * decides two things: what the primary label is, and what commemoration
 * *groups* are eligible here and in what order — the actual
 * filtering/formatting work is `collectCommemorations`'s alone, shared by
 * every branch.
 *
 * Exported (2026-09-16, replacing an earlier design that only ever
 * returned these already flattened into one ` — `-joined string) so a
 * caller that wants to show each entry as its own line — `ui/day-nav.ts`'s
 * header, per user feedback that the em-dash-joined run-on line was hard
 * to scan — can render the list directly instead of re-splitting
 * `getDayLabel`'s joined string back apart. `getDayLabel` itself is kept,
 * unchanged in behavior, as a thin `joinBi` wrapper around this — every
 * existing consumer that wants the single joined string (the browser tab
 * title's own `' — '`-split fallback, tests asserting on joined text)
 * still gets exactly the same value as before.
 */
export function getDayLabelItems(day: LiturgicalDay): Bi[] {
  if (isAllSouls(day.date)) {
    // Rank: the reference engine's Sancti/11-02.txt carries two [Rank]
    // entries — plain "Duplex" and, gated behind `rubrica 196` (the 1960
    // rubrics reform), "I. classis". vu's rubric baseline is Divino
    // Afflatu 1954, predating that reform, so plain "Duplex" applies.
    // The same source file lists "Commemoratio" among what's omitted this
    // day (`Omit Incipit Hymnus Capitulum Lectio Preces Commemoratio
    // Suffragium`) — the historical office drops All Saints' still-active
    // octave outright — but vu's generous-commemorations design (see
    // this project's "Not a reconstruction" note) deliberately keeps it
    // anyway, same `collectCommemorations` machinery every other headline
    // branch here uses, same octave-headline ordering (primary, then
    // octaves, then any other commemoration).
    const rank = formatRank('duplex');
    const primary = bi(`All Souls' Day (${rank.en})`, `In Commemoratióne Ómnium Fidélium Defunctórum (${rank.la})`);
    const commemorations = collectCommemorations(day, { showOctaves: true });
    return withTransferNote(day, [primary, ...commemorations]);
  }
  if (day.winner.kind === 'sanctoral') {
    // Octaves only ride along here on `ordinary-feria` — a day with real
    // standing of its own (a Sunday, a privileged feria) doesn't mention
    // an unrelated active octave even though it's technically active
    // (live-verified: Aug 16, 2026, St. Joachim wins outright on a Sunday
    // that's also within both St. Lawrence's and the Assumption's octave
    // windows, and Divino Afflatu 1954's own commemoration line names
    // only the Sunday, no octave).
    const commemorations = collectCommemorations(day, {
      showOctaves: day.temporalCategory === 'ordinary-feria',
      includeTemporal: true,
    });
    const rank = formatRank(day.winner.rank);
    const winnerName = biName(day.winner.name, day.winner.nameLa);
    const winner = day.winner.transferredFrom
      ? bi(`${winnerName.en} (${rank.en}, ${TRANSFERRED_LABEL.en})`, `${winnerName.la} (${rank.la}, ${TRANSFERRED_LABEL.la})`)
      : bi(`${winnerName.en} (${rank.en})`, `${winnerName.la} (${rank.la})`);
    return withTransferNote(day, [winner, ...commemorations]);
  }

  // A named temporal feast (Christmas, Pentecost, Marian Saturday, ...)
  // shows its own name rather than the ordinal week label — same
  // "winner displaces, doesn't combine" rule a sanctoral winner gets
  // above. Most temporal ids don't have a record at all (see
  // temporal-feasts.ts) and fall through further down.
  const namedFeast = getTemporalFeastRecord(day.winner.id);
  if (namedFeast) {
    const name = biName(namedFeast.name, namedFeast.nameLa);
    const primary = namedFeast.rank
      ? bi(`${name.en} (${formatRank(namedFeast.rank).en})`, `${name.la} (${formatRank(namedFeast.rank).la})`)
      : name;
    const commemorations = collectCommemorations(day, { showOctaves: false });
    return withTransferNote(day, [primary, ...commemorations]);
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
    const commemorations = collectCommemorations(day, { showOctaves: false });
    return withTransferNote(day, [anchorName, ...commemorations]);
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
    const commemorations = collectCommemorations(day, { showOctaves: true, excludeOctaveId: activeOctave.id });
    const primary = octaveLabel(activeOctave);
    return withTransferNote(day, [primary, ...commemorations]);
  }

  const temporalRank = TEMPORAL_CATEGORY_RANK_LABELS[day.temporalCategory];
  const label = (day.winner.kind === 'temporal' ? emberDayLabel(day.winner.id) : undefined) ?? temporalLabel(day);
  const temporal = bi(`${label.en} (${temporalRank.en})`, `${label.la} (${temporalRank.la})`);
  // An active-but-not-governing octave (a mere mid-octave day within an
  // otherwise ordinary Sunday, e.g. — see octaveGoverningPrivilegedDay's
  // 2026-09-13 carve-out) still rides along as a commemoration here, same
  // as every other headline branch above — except during christmastide,
  // where the Christmas Octave's own stacked octaves are deliberately
  // never named at all, even as a commemoration (see the governing-octave
  // branch's own doc comment for why).
  const commemorations = collectCommemorations(day, { showOctaves: day.season !== 'christmastide' });
  return withTransferNote(day, [temporal, ...commemorations]);
}

/**
 * The full "day being celebrated" label as a single ` — `-joined bilingual
 * string — kept for existing consumers that want one flat string
 * (`ui/format.ts`'s `documentTitle`, which splits it back on `' — '` to
 * recover just the primary celebration; tests asserting on joined text).
 * New display code that wants to show each entry on its own line should
 * use `getDayLabelItems` instead — see its own doc comment for why.
 */
export function getDayLabel(day: LiturgicalDay): Partial<Record<string, string>> {
  return joinBi(getDayLabelItems(day));
}

/**
 * The day's own primary identity, alone — no rank, no commemorations, no
 * transfer note — for the browser tab title (`ui/format.ts`'s
 * `documentTitle`) specifically. Mirrors `getDayLabel`'s own primary-
 * selection precedence (All Souls > sanctoral winner > named temporal
 * feast > season anchor day > governing octave > plain ordinal label) so
 * the title always names whatever the header's own headline names, just
 * without the trailing detail — but unlike `getDayLabel`, prefers each
 * record's authored `titleName`/`titleNameLa` (see `calendar/feasts.ts`'s
 * `SaintRecord.titleName` doc comment) over the full name wherever one
 * exists, since a curated short form is exactly what a tab title wants
 * and the header text doesn't. Returns `undefined` for the plain-ordinal
 * fallback branch (e.g. "Wednesday in the 11th week after Trinity") —
 * that branch has no named record to shorten and is already short enough
 * in practice, so `documentTitle` falls back to its own generic role-
 * clause-stripping/truncation of `getDayLabel`'s output for it instead of
 * duplicating that logic here too. */
export function getDayTitleName(day: LiturgicalDay): Bi | undefined {
  if (isAllSouls(day.date)) {
    return bi("All Souls' Day", 'In Commemoratióne Ómnium Fidélium Defunctórum');
  }
  if (day.winner.kind === 'sanctoral') {
    const record = getSaintRecord(day.winner.id);
    return biTitleName(day.winner.name, day.winner.nameLa, record?.titleName, record?.titleNameLa);
  }
  const namedFeast = getTemporalFeastRecord(day.winner.id);
  if (namedFeast) {
    return biTitleName(namedFeast.name, namedFeast.nameLa, namedFeast.titleName, namedFeast.titleNameLa);
  }
  const anchorName = anchorDayName(day);
  if (anchorName) {
    return anchorName;
  }
  const activeOctave =
    day.temporalCategory === 'ordinary-feria' ? resolveActiveOctave(day.date) : octaveGoverningPrivilegedDay(day);
  if (activeOctave) {
    return octaveTitleName(activeOctave);
  }
  return undefined;
}
