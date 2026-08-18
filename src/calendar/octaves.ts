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
  /** This octave's own effective rank *today* — the ordinary `wins`
   * threshold on every day except its own closing day, where it's
   * `closingDayRank` instead (see calendar/types.ts's OctaveConfig).
   * Doubles as both "how strong a rival saint must be to displace this
   * octave" and "this octave's own strength when compared against
   * another simultaneously-active octave" (resolveActiveOctave) — same
   * underlying question, two different comparison partners. */
  wins: FeastClass;
  /** 1 on the feast's own day, counting up from there. */
  dayNumber: number;
  /** Whether `dayNumber` is this octave's own final ("in Octava") day —
   * i.e. whether `wins` above came from `closingDayRank` rather than the
   * ordinary `wins` config. Used by calendar/index.ts's applyOctaves to
   * decide which side a *tied* rank favors — see its own doc comment. */
  isClosingDay: boolean;
}

const DEFAULT_DAYS = 8;
const DEFAULT_WINS: FeastClass = 'semiduplex';
const DEFAULT_CLOSING_DAY_RANK: FeastClass = 'duplex';
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
  const dayNumber = offset + 1;
  const isClosingDay = dayNumber === days;
  const wins = isClosingDay ? (octave.closingDayRank ?? DEFAULT_CLOSING_DAY_RANK) : (octave.wins ?? DEFAULT_WINS);
  active.push({ id, name, wins, dayNumber, isClosingDay });
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

/**
 * Which single active octave actually governs a day's own content/label
 * when more than one is active at once (this app's first real case: St.
 * Lawrence's, Aug 10-17, and the Assumption's, Aug 15-22, genuinely
 * overlap every year) and no rival saint has already displaced all of
 * them outright (that's calendar/index.ts's applyOctaves — this only
 * runs octave-vs-octave). Per direct instruction:
 *
 * - Highest effective rank (`wins`, already elevated on either octave's
 *   own closing day) wins outright.
 * - Tied rank: the more recently *started* octave wins (smaller
 *   `dayNumber` today) — the reasoning given was that day 1 of a newly
 *   started octave needs to be fully present, which is the whole point
 *   of it starting; the older octave that's already been running is
 *   commemorated instead, same as any octave that loses this comparison.
 *
 * Undefined when no octave is active at all. Every other active octave
 * still gets commemorated regardless of which one wins here — this
 * function only decides whose *content* (and day-label name) governs,
 * not who gets left out of the commemoration list entirely (see
 * calendar/index.ts's applyOctaves, unchanged by this).
 */
export function resolveActiveOctave(isoDate: string): ActiveOctave | undefined {
  return pickWinningOctave(activeOctavesFor(isoDate));
}

/** The comparison itself, factored out from resolveActiveOctave so the
 * precedence rule (rank, then recency) is directly unit-testable against
 * synthetic ActiveOctave data — no real equal-rank overlap exists yet in
 * this app's own calendar to exercise the tie-break against. */
export function pickWinningOctave(active: ActiveOctave[]): ActiveOctave | undefined {
  return active.reduce<ActiveOctave | undefined>((best, candidate) => {
    if (!best) {
      return candidate;
    }
    const rankCmp = compareFeastClass(candidate.wins, best.wins);
    if (rankCmp > 0) {
      return candidate;
    }
    if (rankCmp < 0) {
      return best;
    }
    return candidate.dayNumber < best.dayNumber ? candidate : best;
  }, undefined);
}
