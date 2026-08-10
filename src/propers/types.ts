import type { LanguageCode, TranslationStatus } from '../psalter/types';

/** One fixed (non-day-variable) text used across hours — a hymn, a collect, a
 * whole Preces block, etc. Keyed by id, matching PropersRef.id. */
export interface ProperText {
  id: string;
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
  /** e.g. "1 Tim 1:17" — set when this proper is a scripture quotation. */
  citation?: Partial<Record<LanguageCode, string>>;
}
