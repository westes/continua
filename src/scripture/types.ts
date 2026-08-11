import type { LanguageCode, TranslationStatus } from '../psalter/types';

export interface ScriptureVerse {
  n: number;
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}

/** One chapter of one (non-Psalm) book — Vulgate/Douay-Rheims numbering and
 * versification, same convention as psalter/types.ts's Psalm, kept as a
 * separate store rather than folded into it (2026-08 discussion: "the
 * psalms kind of work differently even if the logic is the same, they do
 * need their own store"). `book` is a short citation-style abbreviation
 * (e.g. "ezek", "cant", "sir", "act", "joel", "sap") matching how these
 * passages are already cited throughout this project's propers. */
export interface ScriptureChapter {
  book: string;
  chapter: number;
  verses: ScriptureVerse[];
}
