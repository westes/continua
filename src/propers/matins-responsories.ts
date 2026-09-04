// The per-book Matins responsory pool — see
// data/hours/matins-responsories-by-book.yml's own header for why matching
// is book-level, not citation-level, and why this is a seeded subset, not
// a full pool.
//
// This file also holds the sibling per-Common-category pool (see
// data/hours/matins-responsories-by-common.yml's own header) — used to
// fill in a real responsory for a saint's own Nocturn 2/3 patristic
// reading when that reading has no proper `responsory` of its own.
import type { LanguageCode, TranslationStatus } from '../psalter/types';

interface BilingualText {
  la?: string;
  en?: string;
}

interface ResponsoryRecord {
  r: BilingualText;
  v: BilingualText;
}

/** Shaped like hours/types.ts's ResolvedText, but this module doesn't
 * import from hours/ (propers/ is lower in the dependency graph) — callers
 * assemble the real ResolvedText themselves. The responsory's versicle is
 * folded into `text` as a second line (R./V. read together as one block in
 * this app's rendering, same convention as the octave-readings responsory
 * field). */
export interface MatinsResponsory {
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}

const modules = import.meta.glob<{ default: Record<string, ResponsoryRecord[]> }>(
  '../data/hours/matins-responsories-by-book.yml',
  { eager: true },
);

const poolByBook = new Map<string, ResponsoryRecord[]>();
for (const mod of Object.values(modules)) {
  for (const [book, entries] of Object.entries(mod.default)) {
    poolByBook.set(book, entries);
  }
}

function joinResponsory(record: ResponsoryRecord): MatinsResponsory {
  const la = record.r.la && record.v.la ? `${record.r.la}\n${record.v.la}` : record.r.la;
  const en = record.r.en && record.v.en ? `${record.r.en}\n${record.v.en}` : record.r.en;
  return {
    text: { la, en },
    status: { la: la ? 'verified' : 'missing', en: en ? 'verified' : 'missing' },
  };
}

/** Undefined when no responsory is seeded for this book yet — an honest
 * absence (see hours/types.ts's 'lesson' ResolvedPart doc comment), not a
 * placeholder. `index` cycles through the pool (e.g. the Nth reading from
 * this book this nocturn) via modulo, so a short pool still gives every
 * reading *some* responsory rather than only the first one. */
export function getResponsoryForBook(book: string, index: number): MatinsResponsory | undefined {
  const pool = poolByBook.get(book);
  if (!pool || pool.length === 0) return undefined;
  return joinResponsory(pool[index % pool.length]!);
}

interface FullTextResponsory {
  la: string;
  en: string;
}

const commonModules = import.meta.glob<{ default: Record<string, FullTextResponsory[]> }>(
  '../data/hours/matins-responsories-by-common.yml',
  { eager: true },
);

const poolByCommon = new Map<string, FullTextResponsory[]>();
for (const mod of Object.values(commonModules)) {
  for (const [commonId, entries] of Object.entries(mod.default)) {
    poolByCommon.set(commonId, entries);
  }
}

/** Same cycling convention as getResponsoryForBook, but the pooled text is
 * already the full "R. ...\n* ...\nV. ...\nR. ..." block (matching the
 * inline `responsory` convention every nocturn-readings/*.yml file uses),
 * ready to drop straight into a reading's `responsory` field — not the
 * split {r, v} shape the book pool uses. Undefined when the saint has no
 * `common` category, or that category isn't seeded (e.g. angel/evangelist/
 * vigil — see the data file's own header for why those are out of scope). */
export function getResponsoryForCommon(
  commonId: string | undefined,
  index: number,
): Partial<Record<LanguageCode, string>> | undefined {
  if (!commonId) return undefined;
  const pool = poolByCommon.get(commonId);
  if (!pool || pool.length === 0) return undefined;
  const entry = pool[index % pool.length]!;
  return { la: entry.la, en: entry.en };
}
