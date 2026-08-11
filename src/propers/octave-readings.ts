// Matins readings for octave days — a separate small store from
// common/temporal propers because these are keyed by
// `${octaveId}-octave-day-${dayNumber}` (day 1 = the feast's own day, not
// normally authored here since that day already has its own real content
// elsewhere) rather than a flat id, and because unlike a collect, a
// day's worth of historical lessons (usually 3, sometimes 9) is
// deliberately collapsed into one continuous reading here rather than kept
// broken up the way the sources present it — a project-specific
// simplification, not how these are actually prayed historically.
import type { LanguageCode, TranslationStatus } from '../psalter/types';

export interface OctaveReadingText {
  id: string;
  /** Attribution for the reading — author and work, e.g. "St. John
   * Damascene, 2nd Sermon on the Dormition of the Mother of God". Not
   * itself translated/localized. */
  source: string;
  text: Partial<Record<LanguageCode, string>>;
  /** The first responsory following the reading in the source, where one
   * was found — which one to use when several lessons (and several
   * responsories) collapse into a single reading is an open question
   * (2026-08 discussion); "the first one" is the working answer. Omitting
   * the closing Gloria Patri outside Septuagesima-Holy Saturday is a
   * rendering concern, not captured here. */
  responsory?: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}

const octaveReadingModules = import.meta.glob<{ default: OctaveReadingText }>(
  '../data/propers/octave-readings/*.yml',
  { eager: true },
);

const octaveReadingsById = new Map<string, OctaveReadingText>();
for (const mod of Object.values(octaveReadingModules)) {
  octaveReadingsById.set(mod.default.id, mod.default);
}

/** Undefined, not a "missing" placeholder, when this octave day has no
 * reading authored — normal and expected (not every day has one), unlike
 * getCommonProper/getTemporalProper's ids, which are always expected to
 * resolve to *something* eventually. */
export function getOctaveReading(octaveId: string, dayNumber: number): OctaveReadingText | undefined {
  return octaveReadingsById.get(`${octaveId}-octave-day-${dayNumber}`);
}
