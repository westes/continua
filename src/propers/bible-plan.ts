// The user's own continuous scripture-reading plan, one contributor among
// several to Matins' pooled reading list (see hours/matins.ts's header and
// TODO.md's Matins section) — deliberately not the historical per-day
// lectionary. Most rows key off the same (temporalId, weekday) pair every
// other content store in this project already uses to identify a day, but
// the source TSV's Christmastide/Epiphanytide stretch (Dec 25 - Jan 13)
// keys off a fixed calendar date (MM-DD) instead, since that stretch is
// read straight through regardless of which temporal Sunday governs the
// day. The two key types can both apply to the same date (e.g. a Sunday
// after Epiphany landing inside Jan 1-13) — `getBiblePlanReadings` checks
// both and pools whatever each produces, rather than one overriding the
// other.
//
// Only a small, growable subset is authored so far — this is the mechanism
// build, not the full-calendar content pass (~390 rows total in the
// source TSV); see TODO.md for what's deferred. Every entry not yet
// authored here simply resolves to no readings (honest absence, not a
// placeholder) — matins.ts's reading pool just has nothing from this
// source that day.
import type { LanguageCode, TranslationStatus } from '../psalter/types';
import { resolvePassages, type ScriptureCitation } from './octave-readings';
import { getResponsoryForBook } from './matins-responsories';
import { getBookIncipit } from './bible-book-incipits';
import { canonicalBook } from '../scripture';
import { adventStart } from '../calendar/temporal';
import { addDays, daysBetween } from '../calendar/date-math';
import type { Weekday } from '../calendar/types';

const GOSPEL_BOOKS = new Set(['matt', 'mark', 'luke', 'john']);

export interface BiblePlanReading {
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
  citation: Partial<Record<LanguageCode, string>>;
  /** True when every passage in this reading is from one of the four
   * Gospels — the user's own plan deliberately never assigns one on a
   * Sunday (confirmed 2026-08, not a gap) — see hours/matins.ts for how
   * this combines with the day's own proper Gospel+homily, when one
   * exists, rather than replacing it. */
  isGospel: boolean;
  /** Matched loosely by the reading's own (first) book against
   * data/hours/matins-responsories-by-book.yml — undefined when nothing's
   * seeded for that book yet, an honest absence, not a placeholder. */
  responsory?: Partial<Record<LanguageCode, string>>;
  /** The traditional "Léctio libri..."/"A reading from..." incipit for the
   * reading's own (first) book — see bible-book-incipits.ts. Undefined only
   * for an abbreviation that map doesn't recognize, which shouldn't happen
   * for anything actually under src/data/scripture. */
  label?: Partial<Record<LanguageCode, string>>;
}

interface BiblePlanReadingRecord {
  passages: ScriptureCitation[];
  /** Set explicitly when the cited passages aren't in src/data/scripture
   * yet (the common case until the full Vulgate/Douay-Rheims import
   * lands) — mirrors octave-readings.ts's own convention rather than
   * inferring "missing" from empty resolved text, since a genuinely short
   * authored passage could otherwise look indistinguishable from an
   * unauthored one. */
  status?: Partial<Record<LanguageCode, TranslationStatus>>;
}

interface BiblePlanDayRecord {
  /** Mutually exclusive with `calendarDate` — a row keys off one or the
   * other, never both (see this file's header). */
  temporalId?: string;
  weekday?: string;
  /** "MM-DD", for the Dec 25 - Jan 13 stretch that reads straight through
   * regardless of which temporal Sunday governs the day. */
  calendarDate?: string;
  readings: BiblePlanReadingRecord[];
}

function citationLabel(citation: ScriptureCitation): string {
  const book = citation.book.charAt(0).toUpperCase() + citation.book.slice(1);
  return citation.verses ? `${book} ${citation.chapter}:${citation.verses}` : `${book} ${citation.chapter}`;
}

/** Collapses consecutive same-book, whole-chapter passages (e.g. Job 34, 35,
 * 36, 37 — the source data authors one entry per chapter) into a compact
 * "Book start-end" range, since `citationLabel` alone would otherwise
 * produce a separate "Book N" for each chapter. Verse-qualified citations
 * never merge into a range. */
function formatCitationLabel(passages: ScriptureCitation[]): string {
  const segments: string[] = [];
  let i = 0;
  while (i < passages.length) {
    const start = passages[i]!;
    if (start.verses) {
      segments.push(citationLabel(start));
      i++;
      continue;
    }
    let j = i;
    while (
      j + 1 < passages.length &&
      passages[j + 1]!.book === start.book &&
      !passages[j + 1]!.verses &&
      passages[j + 1]!.chapter === passages[j]!.chapter + 1
    ) {
      j++;
    }
    const book = start.book.charAt(0).toUpperCase() + start.book.slice(1);
    segments.push(j > i ? `${book} ${start.chapter}-${passages[j]!.chapter}` : `${book} ${start.chapter}`);
    i = j + 1;
  }
  return segments.join('; ');
}

function isGospelReading(passages: ScriptureCitation[]): boolean {
  return passages.every((p) => GOSPEL_BOOKS.has(p.book));
}

function resolveReading(record: BiblePlanReadingRecord, bookIndex: number): BiblePlanReading {
  const text = resolvePassages(record.passages);
  const status = record.status ?? {
    la: text.la ? 'verified' : 'missing',
    en: text.en ? 'verified' : 'missing',
  };
  const citationLabelText = formatCitationLabel(record.passages);
  const firstBook = record.passages[0]?.book;
  const canonicalFirstBook = firstBook ? canonicalBook(firstBook) : undefined;
  const responsory = canonicalFirstBook ? getResponsoryForBook(canonicalFirstBook, bookIndex)?.text : undefined;
  const incipit = canonicalFirstBook ? getBookIncipit(canonicalFirstBook) : undefined;
  return {
    text,
    status,
    citation: { la: citationLabelText, en: citationLabelText },
    isGospel: isGospelReading(record.passages),
    responsory,
    label: incipit ? { la: incipit.la, en: incipit.en } : undefined,
  };
}

const modules = import.meta.glob<{ default: BiblePlanDayRecord }>('../data/hours/bible-plan/*.yml', {
  eager: true,
});

const readingsByTemporalKey = new Map<string, BiblePlanReading[]>();
const readingsByCalendarDate = new Map<string, BiblePlanReading[]>();
for (const mod of Object.values(modules)) {
  const { temporalId, weekday, calendarDate, readings } = mod.default;
  // Cycles independently per book (not per reading) so two same-day
  // readings from the same book don't collide on the pool's first entry —
  // see matins-responsories.ts's own cycling doc comment.
  const seenPerBook = new Map<string, number>();
  const resolved = readings.map((record) => {
    const book = record.passages[0]?.book ?? '';
    const index = seenPerBook.get(book) ?? 0;
    seenPerBook.set(book, index + 1);
    return resolveReading(record, index);
  });
  if (calendarDate) {
    readingsByCalendarDate.set(calendarDate, resolved);
  } else {
    readingsByTemporalKey.set(`${temporalId}-${weekday}`, resolved);
  }
}

const WEEKDAYS: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Advent's own reading plan (`advent-1-sunday` through `advent-4-saturday`,
 * 28 rows, one per day of a full 4-week Advent) is longer than Advent
 * itself ever actually runs: Advent's last real day is Dec 23 (Dec 24 is
 * the Vigil of Christmas's own temporal id, calendar/temporal-id.ts) but
 * Advent 1 Sunday falls anywhere from Nov 27 to Dec 3 (the Sunday nearest
 * Nov 30) — even in the longest possible Advent (Advent 1 Sunday = Nov 27,
 * 27 real days before Dec 24) the 28th planned reading never lands on its
 * own natural date, and in the shortest (Advent 1 Sunday = Dec 3, 21 real
 * days) the entire last week's worth (7 readings) never does. Rather than
 * silently drop that content, whatever didn't land on its own natural date
 * carries forward one reading per day starting Christmas Day itself,
 * pooled alongside whatever Christmastide's own calendar-dated rows
 * already have for that day (never replacing them) — same "every
 * contributing source pools, none override" design as everywhere else in
 * this file and in hours/matins.ts's own reading-pool assembly. User
 * direction, 2026-09-05: "for advent only, we need to show all of those
 * chapters," accepting the spillover into Christmastide as the trade-off.
 *
 * Real day-by-day for `date`'s own year: the pool has no calendar-year
 * awareness anywhere else (temporal ids are already year-independent), so
 * this is the one place in this file that computes real dates. */
function adventCarryoverReadings(date: string): BiblePlanReading[] {
  const year = Number(date.slice(0, 4));
  const christmasDay = `${year}-12-25`;
  const daysAfterChristmas = daysBetween(christmasDay, date);
  if (daysAfterChristmas < 0) return [];

  const vigilOfChristmas = `${year}-12-24`;
  const start = adventStart(year);
  const skippedKeys: string[] = [];
  for (let i = 0; i < 28; i++) {
    if (addDays(start, i) >= vigilOfChristmas) {
      const week = Math.floor(i / 7) + 1;
      skippedKeys.push(`advent-${week}-${WEEKDAYS[i % 7]}`);
    }
  }
  const key = skippedKeys[daysAfterChristmas];
  return key ? (readingsByTemporalKey.get(key) ?? []) : [];
}

/** Every reading this plan contributes to Matins' pooled reading list for
 * `date` — the (temporalId, weekday) row, the fixed-calendar-date row (if
 * any), and (Christmas Day onward) any Advent reading bumped past its own
 * natural date by a short Advent that year (see `adventCarryoverReadings`)
 * — all pooled together rather than one overriding another, since more
 * than one can genuinely apply to the same date (see this file's header).
 * Empty array, not undefined, when nothing's authored for this day yet —
 * every caller already treats "no readings" as a valid, renderable state
 * (see hours/matins.ts), so there's no separate "missing entirely" signal
 * to preserve here the way getOctaveReading needs `undefined` for. */
export function getBiblePlanReadings(temporalId: string, weekday: string, date: string): BiblePlanReading[] {
  const byTemporal = readingsByTemporalKey.get(`${temporalId}-${weekday}`) ?? [];
  const byCalendarDate = readingsByCalendarDate.get(date.slice(5)) ?? [];
  const carryover = adventCarryoverReadings(date);
  return [...byTemporal, ...byCalendarDate, ...carryover];
}
