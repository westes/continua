import type { LanguageCode, TranslationStatus } from '../psalter/types';

/** Keyed by MM-DD — the martyrology repeats every civil year, same as the
 * sanctoral calendar, and for the same reason (see calendar/types.ts). */
export interface MartyrologyEntry {
  monthDay: string;
  /** How many of the day's leading English paragraphs are the feast's own
   * elogium, which the day's "were born into the better life" line follows
   * rather than precedes (the reference's Titulus pointing at an entry).
   * Default 0. */
  leadEntries?: number;
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}
