// Matins Nocturn 2/3 readings for regular (non-octave-day) Sunday and
// Duplex+ feast days — extends src/propers/octave-readings.ts's own
// "combine several historical lessons into one reading, per real source
// change" pattern to ordinary days, not just the days *within* an octave
// that file already covers. Kept as a separate store (not folded into
// octave-readings.ts) because the id scheme is flat (a saint id or a
// temporal id, not `${octaveId}-octave-day-${n}`) and because a day can
// have several of these active at once — see hours/matins.ts, which
// loops every commemorated saint (calendar/types.ts's
// LiturgicalDay.commemorations) and every calendar/octaves.ts
// activeOctavesFor(date) entry, not just the office winner, per the
// user's own "be generous, not winner-takes-all" instruction (2026-08).
import type { LanguageCode, TranslationStatus } from '../psalter/types';
import { nocturnReadingRecords } from './store';

export interface NocturnReading {
  nocturn: number;
  isGospel: boolean;
  /** Attribution, e.g. "St. Gregory the Great, Moralia in Job, Bk. 9" —
   * absent for a bare Gospel pericope (the citation itself is enough). */
  source?: string;
  citation?: Partial<Record<LanguageCode, string>>;
  text: Partial<Record<LanguageCode, string>>;
  responsory?: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}

interface NocturnReadingsFile {
  id: string;
  readings: NocturnReading[];
}

const readingsById = new Map<string, NocturnReading[]>();
for (const [id, record] of nocturnReadingRecords) {
  readingsById.set(id, (record as unknown as NocturnReadingsFile).readings);
}

/** Empty array, not undefined — a saint/temporal id with nothing authored
 * here yet is the common case during this build's incremental content
 * pass (see TODO.md), not an error; callers just get nothing to render
 * for that id's own Nocturn 2/3 contribution. `id` is a saint id or a
 * temporal id (calendar/temporal-id.ts's resolveTemporalId), matched
 * exactly as `resolveOfficeWinner`/`day.commemorations` entries name it. */
export function getNocturnReadings(id: string): NocturnReading[] {
  return readingsById.get(id) ?? [];
}
