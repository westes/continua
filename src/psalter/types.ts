/** e.g. "la", "en" — open-ended so a third language is a data change, not a schema change. */
export type LanguageCode = string;

export type TranslationStatus = 'verified' | 'draft' | 'missing';

export interface PsalmVerse {
  n: number;
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}

/** Keyed by Vulgate/Gallican numbering, not Hebrew/modern numbering. */
export interface Psalm {
  number: number;
  verses: PsalmVerse[];
}
