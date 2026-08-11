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

export function getScriptureChapter(book: string, chapter: number): ScriptureChapter | undefined {
  return chapters.get(`${book}-${chapter}`);
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
