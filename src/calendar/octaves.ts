// The "generic way to commemorate an octave" — a lookback over the past
// week (a feast's own day plus up to 7 more) collecting every octave
// still active on a given date, from *both* sanctoral saints
// (calendar/feasts.ts) and temporal feasts (calendar/temporal-feasts.ts).
// Deliberately a post-processing layer over calendar/index.ts's existing
// occurrence/transfer pipeline, not a change to calendar/commemorations.ts
// itself — an octave doesn't change *how* a single day's precedence
// contest is decided, it just adds commemorations on top of whatever that
// contest already produced, and occasionally overrides the winner when a
// too-minor saint would otherwise have taken the day from it.
import type { FeastClass, OctaveConfig } from './types';
import { getSanctoralCandidatesFor, getSaintRecord } from './feasts';
import { getTemporalFeastRecord, temporalFeastIdsStartingOn } from './temporal-feasts';
import { addDays, daysBetween } from './date-math';
import { compareFeastClass } from './commemorations';

export interface ActiveOctave {
  id: string;
  name: string;
  /** Rank threshold below which the occurring saint loses the day to this octave. */
  wins: FeastClass;
  /** 1 on the feast's own day, counting up from there. */
  dayNumber: number;
}

const DEFAULT_DAYS = 8;
const DEFAULT_WINS: FeastClass = 'semiduplex';
/** How far back to look for an octave's own start date — must cover the
 * longest configured `days` a caller might use; 7 covers the standard
 * 8-day octave (day 1 = the start itself, day 8 = 7 days later). */
const LOOKBACK_DAYS = 7;

function considerCandidate(
  active: ActiveOctave[],
  seen: Set<string>,
  isoDate: string,
  startDate: string,
  id: string,
  name: string,
  octave: OctaveConfig | undefined,
): void {
  if (!octave?.enabled || seen.has(id)) {
    return;
  }
  const days = octave.days ?? DEFAULT_DAYS;
  const offset = daysBetween(startDate, isoDate);
  if (offset < 0 || offset >= days) {
    return;
  }
  seen.add(id);
  active.push({ id, name, wins: octave.wins ?? DEFAULT_WINS, dayNumber: offset + 1 });
}

/** Every octave (sanctoral or temporal) whose window covers `isoDate`,
 * oldest-started first (so a stack like Christmas/Stephen/John/Innocents
 * reads in the order each one actually began, matching how they'd be
 * listed at Matins/Lauds/Vespers). */
export function activeOctavesFor(isoDate: string): ActiveOctave[] {
  const active: ActiveOctave[] = [];
  const seen = new Set<string>();

  for (let back = LOOKBACK_DAYS; back >= 0; back--) {
    const candidateDate = addDays(isoDate, -back);

    for (const candidate of getSanctoralCandidatesFor(candidateDate)) {
      const record = getSaintRecord(candidate.id);
      if (record) {
        considerCandidate(active, seen, isoDate, candidateDate, record.id, record.name, record.octave);
      }
    }

    for (const feastId of temporalFeastIdsStartingOn(candidateDate)) {
      const record = getTemporalFeastRecord(feastId);
      if (record) {
        considerCandidate(active, seen, isoDate, candidateDate, record.id, record.name, record.octave);
      }
    }
  }

  return active;
}

/** The strictest (highest) `wins` threshold among a set of active octaves —
 * what an occurring saint needs to clear to keep the day against all of
 * them at once. */
export function strictestThreshold(octaves: ActiveOctave[]): FeastClass {
  return octaves.reduce<FeastClass>(
    (max, o) => (compareFeastClass(o.wins, max) > 0 ? o.wins : max),
    octaves[0]?.wins ?? DEFAULT_WINS,
  );
}
