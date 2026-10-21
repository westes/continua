// Matins readings for octave days — a separate small store from
// common/temporal propers because these are keyed by
// `${octaveId}-octave-day-${dayNumber}` (day 1 = the feast's own day, not
// normally authored here since that day already has its own real content
// elsewhere) rather than a flat id, and because unlike a collect, a
// day's worth of historical lessons (usually 3, sometimes 9) is
// deliberately collapsed into one continuous reading here rather than kept
// broken up the way the sources present it — a project-specific
// simplification, not how these are actually prayed historically.
import type { LanguageCode, TranslationStatus } from '../psalter/types';
import { getScriptureVerses } from '../scripture';
import { octaveReadingRecords } from './store';

/** A citation into scripture/index.ts's own store — `verses` e.g. "1-13",
 * omitted for a whole (authored) chapter. */
export interface ScriptureCitation {
  book: string;
  chapter: number;
  verses?: string;
}

export interface OctaveReadingText {
  id: string;
  /** Attribution for the reading — author and work, e.g. "St. John
   * Damascene, 2nd Sermon on the Dormition of the Mother of God". Bilingual
   * like everything else here since it's rendered as the reading's own
   * heading in both language columns (2026-08-21 fix: it used to be a bare
   * Latin incipit shown verbatim in the English column too). */
  source: Partial<Record<LanguageCode, string>>;
  text: Partial<Record<LanguageCode, string>>;
  /** The first responsory following the reading in the source, where one
   * was found — which one to use when several lessons (and several
   * responsories) collapse into a single reading is an open question
   * (2026-08 discussion); "the first one" is the working answer. Omitting
   * the closing Gloria Patri outside Septuagesima-Holy Saturday is a
   * rendering concern, not captured here. */
  responsory?: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
  /** True when this reading is a direct Scripture passage (authored via
   * `passages:`), false when it's a homily/sermon authored directly as
   * `text:` — see OctaveReadingRecord's own doc comment below. Read by
   * matins.ts's buildReadingPool to decide whether the reading groups with
   * plain Scripture (ahead of homiletic content) or with the day's
   * homiletic content (in winner/commemoration priority order). */
  isScripture: boolean;
}

/**
 * The shape actually authored in the octave-readings sections of data/<lang>/propers/*.yml: either
 * `text` directly (patristic prose that isn't scripture itself, embedded
 * per this project's usual duplication convention — 2026-08 decision: "we
 * actually want the scripture there in the way those readings cite it" for
 * quotes *within* prose, so those stay inline) or `passages`, a "pull this
 * passage" reference into the scripture store for readings that
 * are scripture start to finish — each entry becomes its own paragraph, in
 * order, letting a reading built from several verse ranges (e.g. three
 * consecutive Nocturn-I lessons) keep its original paragraph breaks.
 * Exactly one of the two is present; `getOctaveReading` always hands
 * callers a fully-resolved `OctaveReadingText` regardless of which was
 * used, so nothing downstream needs to know the difference.
 */
interface OctaveReadingRecord {
  id: string;
  source: Partial<Record<LanguageCode, string>>;
  text?: Partial<Record<LanguageCode, string>>;
  passages?: ScriptureCitation[];
  responsory?: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}

/** Exported for reuse by src/propers/bible-plan.ts and
 * src/propers/nocturn-readings.ts, which need the same "pull several
 * scripture passages and join them as paragraphs" behavior for Matins
 * readings outside the octave-day-keyed store this file owns. */
export function resolvePassages(passages: ScriptureCitation[]): Partial<Record<LanguageCode, string>> {
  const laParagraphs: string[] = [];
  const enParagraphs: string[] = [];
  for (const citation of passages) {
    const verses = getScriptureVerses(citation.book, citation.chapter, citation.verses);
    const la = verses
      .map((v) => v.text.la)
      .filter((s): s is string => !!s)
      .join(' ');
    const en = verses
      .map((v) => v.text.en)
      .filter((s): s is string => !!s)
      .join(' ');
    if (la) laParagraphs.push(la);
    if (en) enParagraphs.push(en);
  }
  const result: Partial<Record<LanguageCode, string>> = {};
  if (laParagraphs.length) result.la = laParagraphs.join('\n\n');
  if (enParagraphs.length) result.en = enParagraphs.join('\n\n');
  return result;
}

function resolveReading(record: OctaveReadingRecord): OctaveReadingText {
  const { passages, text, ...rest } = record;
  return { ...rest, text: text ?? (passages ? resolvePassages(passages) : {}), isScripture: !!passages };
}

const octaveReadingsById = new Map<string, OctaveReadingText>();
for (const [id, record] of octaveReadingRecords) {
  octaveReadingsById.set(id, resolveReading(record as unknown as OctaveReadingRecord));
}

/** Undefined, not a "missing" placeholder, when this octave day has no
 * reading authored — normal and expected (not every day has one), unlike
 * getCommonProper/getTemporalProper's ids, which are always expected to
 * resolve to *something* eventually. */
export function getOctaveReading(octaveId: string, dayNumber: number): OctaveReadingText | undefined {
  return octaveReadingsById.get(`${octaveId}-octave-day-${dayNumber}`);
}
