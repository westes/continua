import type { LanguageCode, TranslationStatus } from '../psalter/types';

/** One canonical Regula reading, keyed by its first (Jan–May) calendar date —
 * see data/regula/table.yml for how real dates map onto these. */
export interface RegulaReading {
  canonicalDate: string;
  /** e.g. "Caput 67: De frátribus in viam diréctis" */
  label: Partial<Record<LanguageCode, string>>;
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}
