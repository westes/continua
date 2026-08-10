import type { Psalm } from './types';

// @rollup/plugin-yaml parses each .yml into a plain object at build time —
// no YAML parser shipped to the client.
const modules = import.meta.glob<{ default: Psalm }>('../data/psalms/*.yml', {
  eager: true,
});

const psalms = new Map<number, Psalm>();
for (const mod of Object.values(modules)) {
  psalms.set(mod.default.number, mod.default);
}

/**
 * Content-authoring the full psalter (verified Latin+English for every
 * psalm) is a separate, ongoing task — an unauthored psalm resolves as a
 * single pending "verse" rather than throwing, so an ordo can still render
 * around it.
 */
export function getPsalm(number: number): Psalm {
  return (
    psalms.get(number) ?? {
      number,
      verses: [{ n: 1, text: {}, status: { la: 'missing', en: 'missing' } }],
    }
  );
}

/**
 * @param verseRange e.g. "2-19" — Vulgate verse numbers, inclusive. Whole
 * psalm (Monday's Ps 1/2/6, say) when omitted; a slice of a longer psalm
 * (the Monastic Prime distribution splits Pss 9, 17, and 118 across days)
 * when given.
 */
export function getPsalmVerses(number: number, verseRange?: string): Psalm['verses'] {
  const psalm = getPsalm(number);
  if (!verseRange) {
    return psalm.verses;
  }
  const [startStr, endStr] = verseRange.split('-');
  const start = Number(startStr);
  const end = endStr ? Number(endStr) : start;
  return psalm.verses.filter((v) => v.n >= start && v.n <= end);
}

export type { Psalm, PsalmVerse, LanguageCode, TranslationStatus } from './types';
