import type { LanguageCode, TranslationStatus } from '../psalter/types';

/** Keyed by MM-DD — the martyrology repeats every civil year, same as the
 * sanctoral calendar, and for the same reason (see calendar/types.ts). */
export interface MartyrologyEntry {
  monthDay: string;
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}
