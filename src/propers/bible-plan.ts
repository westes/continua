// The user's own continuous scripture-reading plan for Matins Nocturn 1 —
// deliberately not the historical per-day lectionary (see hours/matins.ts's
// header and TODO.md's Matins section): a personal year-round reading plan,
// keyed by the same (temporalId, weekday) pair every other content store in
// this project already uses to identify a day, sourced from a TSV the user
// maintains outside this repo. Replaces the historical Nocturn-1 lesson
// count entirely — a *variable* number of readings per day, no RB summer
// contraction (see calendar/temporal-id.ts's resolveTemporalId for the
// id scheme this keys off).
//
// Only a small, growable subset is authored so far — this is the mechanism
// build, not the full-calendar content pass (~390 rows total in the
// source TSV); see TODO.md for what's deferred. Every entry not yet
// authored here simply resolves to no readings (honest absence, not a
// placeholder) — matins.ts falls back to whatever nocturn-2/3 content
// exists for the day, or renders nothing for Nocturn 1 on a day with
// neither.
import type { LanguageCode, TranslationStatus } from '../psalter/types';
import { resolvePassages, type ScriptureCitation } from './octave-readings';
import { getResponsoryForBook } from './matins-responsories';

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
  temporalId: string;
  weekday: string;
  readings: BiblePlanReadingRecord[];
}

function citationLabel(citation: ScriptureCitation): string {
  const book = citation.book.charAt(0).toUpperCase() + citation.book.slice(1);
  return citation.verses ? `${book} ${citation.chapter}:${citation.verses}` : `${book} ${citation.chapter}`;
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
  const label = record.passages.map(citationLabel).join('; ');
  const firstBook = record.passages[0]?.book;
  const responsory = firstBook ? getResponsoryForBook(firstBook, bookIndex)?.text : undefined;
  return {
    text,
    status,
    citation: { la: label, en: label },
    isGospel: isGospelReading(record.passages),
    responsory,
  };
}

const modules = import.meta.glob<{ default: BiblePlanDayRecord }>('../data/hours/bible-plan/*.yml', {
  eager: true,
});

const readingsByKey = new Map<string, BiblePlanReading[]>();
for (const mod of Object.values(modules)) {
  const { temporalId, weekday, readings } = mod.default;
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
  readingsByKey.set(`${temporalId}-${weekday}`, resolved);
}

/** Empty array, not undefined, when nothing's authored for this day yet —
 * every caller already treats "no readings" as a valid, renderable state
 * (see hours/matins.ts), so there's no separate "missing entirely" signal
 * to preserve here the way getOctaveReading needs `undefined` for. */
export function getBiblePlanReadings(temporalId: string, weekday: string): BiblePlanReading[] {
  return readingsByKey.get(`${temporalId}-${weekday}`) ?? [];
}
