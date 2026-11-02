// Display citations ("Ezek 1:1-9", "Job 34-37") for a list of scripture
// passages -- the one place that turns authored `passages:` into the line a
// scripture reading shows under its heading, for every source that authors
// readings this way (the bible plan, octave readings).
import { canonicalBook } from '../scripture';
import type { LanguageCode } from '../psalter/types';
import type { ScriptureCitation } from './octave-readings';

/** Capitalizes a book abbreviation for display, correctly handling a
 * leading ordinal digit (bible-plan.ts's book keys, both the raw English-
 * style ones authored in the TSV and canonicalBook's Vulgate-style ones,
 * both put the digit directly against the letters — "1sam", "1reg" — with
 * no space to capitalize past) by inserting the space and capitalizing
 * the letters that follow it instead of the digit itself. */
function formatBookAbbrev(book: string): string {
  const ordinal = book.match(/^(\d+)(.+)$/);
  if (ordinal) {
    const [, num, rest] = ordinal;
    return `${num} ${rest!.charAt(0).toUpperCase()}${rest!.slice(1)}`;
  }
  return book.charAt(0).toUpperCase() + book.slice(1);
}

/** `lang: 'en'` displays the book as authored (bible-plan.ts's own TSV
 * import already prefers the familiar English abbreviation where it
 * diverges from the Vulgate one — see scripture/index.ts's BOOK_ALIASES
 * comment); `lang: 'la'` runs it through `canonicalBook` first so the
 * Latin column gets the real Vulgate form instead ("1 Reg" not "1 Sam"). */
function citationLabel(citation: ScriptureCitation, lang: 'la' | 'en'): string {
  const book = formatBookAbbrev(lang === 'la' ? canonicalBook(citation.book) : citation.book);
  return citation.verses ? `${book} ${citation.chapter}:${citation.verses}` : `${book} ${citation.chapter}`;
}

/** Joins back-to-back verse ranges of one chapter ("1:1-3", "1:4-6", "1:7-9")
 * into the single range they make up ("1:1-9"); anything not strictly
 * contiguous is left as authored. */
function mergeContiguousVerses(passages: ScriptureCitation[]): ScriptureCitation[] {
  const out: ScriptureCitation[] = [];
  for (const p of passages) {
    const prev = out[out.length - 1];
    const range = (v: string | undefined) => {
      const m = v?.match(/^(\d+)(?:-(\d+))?$/);
      return m ? ([Number(m[1]), Number(m[2] ?? m[1])] as const) : undefined;
    };
    const a = prev && prev.book === p.book && prev.chapter === p.chapter ? range(prev.verses) : undefined;
    const b = a ? range(p.verses) : undefined;
    if (prev && a && b && b[0] === a[1] + 1) {
      out[out.length - 1] = { ...prev, verses: `${a[0]}-${b[1]}` };
    } else {
      out.push(p);
    }
  }
  return out;
}

/** Collapses consecutive same-book, whole-chapter passages (e.g. Job 34, 35,
 * 36, 37 — the source data authors one entry per chapter) into a compact
 * "Book start-end" range, since `citationLabel` alone would otherwise
 * produce a separate "Book N" for each chapter. Verse-qualified citations
 * never merge into a range. Grouping compares passages' raw (English-side)
 * `book` key regardless of `lang` — the same passages merge the same way
 * in both languages, only the displayed book name differs. */
function formatCitationLabel(rawPassages: ScriptureCitation[], lang: 'la' | 'en'): string {
  const passages = mergeContiguousVerses(rawPassages);
  const segments: string[] = [];
  let i = 0;
  while (i < passages.length) {
    const start = passages[i]!;
    if (start.verses) {
      segments.push(citationLabel(start, lang));
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
    const book = formatBookAbbrev(lang === 'la' ? canonicalBook(start.book) : start.book);
    segments.push(j > i ? `${book} ${start.chapter}-${passages[j]!.chapter}` : `${book} ${start.chapter}`);
    i = j + 1;
  }
  return segments.join('; ');
}

/** The bilingual citation for a reading made of `passages`. */
export function formatCitation(passages: ScriptureCitation[]): Partial<Record<LanguageCode, string>> {
  return { la: formatCitationLabel(passages, 'la'), en: formatCitationLabel(passages, 'en') };
}
