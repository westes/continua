import type { ScriptureChapter, ScriptureVerse } from './types';

// Mirrors psalter/index.ts's own loading pattern exactly, one directory
// over — see that file for why (@rollup/plugin-yaml parses at build time,
// no YAML parser shipped to the client).
const modules = import.meta.glob<{ default: ScriptureChapter }>('../data/scripture/*.yml', {
  eager: true,
});

const chapters = new Map<string, ScriptureChapter>();
for (const mod of Object.values(modules)) {
  chapters.set(`${mod.default.book}-${mod.default.chapter}`, mod.default);
}

/** The bulk-imported store (src/data/scripture/**) keys books by their
 * Vulgate-numbering abbreviation (matching the convention octave-readings.ts
 * content already used, e.g. "sap", "ezek", "jac"), but bible-plan.ts's
 * ~390-row TSV import used common English abbreviations for the books where
 * the two conventions diverge (Samuel/Kings/Chronicles/Esdras numbering,
 * John/Luke/Mark/Judges/Jonah/Joshua names). Aliased here, at the lookup
 * layer, rather than rewriting every bible-plan YAML row, so citations
 * (bible-plan.ts's citationLabel) keep displaying the familiar English form
 * while the store lookup still finds the real chapter. */
const BOOK_ALIASES: Record<string, string> = {
  '1sam': '1reg',
  '2sam': '2reg',
  '1kgs': '3reg',
  '2kgs': '4reg',
  '1chr': '1par',
  '2chr': '2par',
  ezra: '1esdr',
  neh: '2esdr',
  '1macc': '1mach',
  '2macc': '2mach',
  hag: 'agg',
  hos: 'osee',
  zech: 'zach',
  zeph: 'soph',
  titus: 'tit',
  jas: 'jac',
  jdt: 'jdth',
  josh: 'jos',
  judg: 'jdc',
  jonah: 'jon',
  john: 'joan',
  '1john': '1joan',
  '2john': '2joan',
  '3john': '3joan',
  luke: 'luc',
  mark: 'marc',
  mic: 'mich',
  jude: 'jud',
  obad: 'abd',
  philem: 'phlm',
};

export function getScriptureChapter(book: string, chapter: number): ScriptureChapter | undefined {
  return chapters.get(`${BOOK_ALIASES[book] ?? book}-${chapter}`);
}

/**
 * @param verseRange e.g. "2-19" — inclusive. Whole (authored) chapter when
 * omitted. Unauthored book/chapter combinations resolve to an empty array
 * rather than throwing — content-authoring the full non-Psalm scripture
 * corpus is an ongoing, incremental task, same "resolve as pending"
 * stance as everywhere else, not a error condition.
 */
export function getScriptureVerses(book: string, chapter: number, verseRange?: string): ScriptureVerse[] {
  const found = getScriptureChapter(book, chapter);
  if (!found) {
    return [];
  }
  if (!verseRange) {
    return found.verses;
  }
  const [startStr, endStr] = verseRange.split('-');
  const start = Number(startStr);
  const end = endStr ? Number(endStr) : start;
  return found.verses.filter((v) => v.n >= start && v.n <= end);
}

export type { ScriptureChapter, ScriptureVerse } from './types';
