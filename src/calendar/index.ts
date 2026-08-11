import type { Commemoration, DayWinner, LiturgicalDay, SanctoralIdentity, TemporalCategory } from './types';
import { weekdayOf } from './weekday';
import { resolveSeason, resolveTemporalCategory, sundayOnOrBefore } from './temporal';
import { resolveTemporalId } from './temporal-id';
import { getSanctoralCandidatesFor } from './feasts';
import { decideOccurrence, isAtLeast, type OccurrenceResult } from './commemorations';
import { resolveCollision } from './collision';
import { addDays } from './date-math';
import { activeOctavesFor, strictestThreshold } from './octaves';

/**
 * A day's occurrence considered on its own — no awareness of what an
 * adjacent day might be trying to transfer in. `resolveDay` calls this for
 * the date itself *and* for yesterday/tomorrow (to check for an inbound
 * transfer) without ever recursing into their own adjacent-day checks —
 * that's what keeps this from being mutually recursive.
 */
function resolveNativeOccurrence(isoDate: string): { temporalCategory: TemporalCategory; result: OccurrenceResult } {
  const weekday = weekdayOf(isoDate);
  const season = resolveSeason(isoDate);
  const temporalCategory = resolveTemporalCategory(isoDate, season, weekday);
  const temporalId = resolveTemporalId(isoDate);

  // Multiple saints sharing a date is its own small occurrence contest,
  // resolved the same way a transfer landing is — see calendar/collision.ts.
  const candidates = getSanctoralCandidatesFor(isoDate);
  let topCandidate: SanctoralIdentity | null = null;
  const clashCommemorations: Commemoration[] = [];
  for (const candidate of candidates) {
    if (!topCandidate) {
      topCandidate = candidate;
      continue;
    }
    const collision = resolveCollision(candidate, topCandidate);
    clashCommemorations.push(...collision.commemorations);
    if (collision.winner.kind === 'sanctoral') {
      topCandidate = { id: collision.winner.id, name: collision.winner.name, rank: collision.winner.rank };
    }
  }

  const result = decideOccurrence(temporalCategory, temporalId, topCandidate);
  result.commemorations.push(...clashCommemorations);
  return { temporalCategory, result };
}

function applyIncomingTransfer(
  candidate: SanctoralIdentity,
  temporalCategory: TemporalCategory,
  winner: DayWinner,
  commemorations: Commemoration[],
): DayWinner {
  if (temporalCategory === 'privileged-feria-major') {
    // Deferred: a transfer landing on one of these (the concrete case is
    // Holy Week, right after Palm Sunday) needs its own Easter-date-keyed
    // lookup table, the same way the reference engine handles it — not
    // modeled yet. The transfer is simply not delivered here rather than
    // guessed at. The lesser privileged-feria tier doesn't need this —
    // ordinary collision/transfer logic is fine there, same as any
    // ordinary-sunday landing.
    return winner;
  }
  if (winner.kind === 'temporal') {
    // Found via real data: a transferred-in Simplex saint was blindly
    // winning outright even when it landed on a privileged Sunday (Trinity
    // Sunday, specifically) — the arriving candidate needs to go through
    // the *same* precedence rules a native occurrence would have used,
    // not just take over because nothing else was assigned here.
    const decided = decideOccurrence(temporalCategory, winner.id, candidate);
    commemorations.push(...decided.commemorations);
    // If the candidate fails here too (decided.transfer set), that's a
    // transfer chain — not modeled, same "not delivered rather than
    // guessed at" stance as the privileged-feria-major case above.
    return decided.winner;
  }
  const collision = resolveCollision(candidate, winner);
  commemorations.push(...collision.commemorations);
  return collision.winner;
}

/**
 * Resolves everything about a given day *except* hour content — weekday,
 * season, temporal precedence category, and the day's real winner plus
 * whatever's commemorated alongside it (calendar/commemorations.ts,
 * calendar/collision.ts, calendar/transfer signaling all feed into this).
 */
export function resolveDay(isoDate: string): LiturgicalDay {
  const weekday = weekdayOf(isoDate);
  const season = resolveSeason(isoDate);
  const { temporalCategory, result } = resolveNativeOccurrence(isoDate);

  let winner = result.winner;
  const commemorations = [...result.commemorations];

  const yesterday = resolveNativeOccurrence(addDays(isoDate, -1));
  if (yesterday.result.transfer?.direction === 'forward') {
    winner = applyIncomingTransfer(yesterday.result.transfer.candidate, temporalCategory, winner, commemorations);
  }
  const tomorrow = resolveNativeOccurrence(addDays(isoDate, 1));
  if (tomorrow.result.transfer?.direction === 'backward') {
    winner = applyIncomingTransfer(tomorrow.result.transfer.candidate, temporalCategory, winner, commemorations);
  }

  winner = applyOctaves(isoDate, winner, commemorations);
  winner = applyMarianSaturday(isoDate, weekday, temporalCategory, winner, commemorations);
  winner = applyChristTheKing(isoDate, winner, commemorations);

  return { date: isoDate, weekday, season, temporalCategory, winner, commemorations };
}

/** The Sunday on or before Oct 31 — always lands in October since Oct 31
 * is at most 6 days after the month's last Sunday. */
function lastSundayOfOctober(year: number): string {
  return sundayOnOrBefore(`${year}-10-31`);
}

/**
 * Per direct instruction: the last Sunday of October is always Christ the
 * King, full stop — unlike every other layer in this file, nothing here
 * loses gracefully or gets a rank check; whatever was winning (a plain
 * numbered Sunday after Pentecost in every ordinary year, but modeled
 * generally in case a high-ranked sanctoral candidate is ever assigned to
 * that date too) is demoted straight to a commemoration. Confirmed live
 * (see data/calendar/temporal-feasts/christ-the-king.yml): Duplex I.
 * classis, well above anything that could contest it under this
 * project's own calendar.
 */
function applyChristTheKing(isoDate: string, winner: DayWinner, commemorations: Commemoration[]): DayWinner {
  const year = Number(isoDate.slice(0, 4));
  if (isoDate !== lastSundayOfOctober(year)) {
    return winner;
  }
  if (winner.kind === 'temporal') {
    commemorations.push({ kind: 'temporal', id: winner.id });
  } else {
    commemorations.push({ kind: 'sanctoral', id: winner.id, name: winner.name, rank: winner.rank });
  }
  return { kind: 'temporal', id: 'christ-the-king' };
}

/**
 * Layered on top of everything above, same spirit as applyOctaves: never
 * changes decideOccurrence's own rules, just relabels the result on a free
 * Saturday. Real standing of its own (per direct instruction, mirrors
 * privileged-feria-minor exactly) — a Semiduplex-or-higher saint still
 * wins outright and this never applies; a Simplex (or Vigil) saint loses
 * to it and is commemorated instead, same as an Advent feria would demote
 * one. `ordinary-feria` is the only category this touches — every
 * privileged season/day (Ember Saturdays, Advent, Lent, ...) already has
 * its own real standing and keeps it untouched.
 *
 * The relabel (not just leaving `winner` as the plain temporal id) is
 * what lets getDayLabel/getBenedictusAntiphon/getDayCollects/getLaudsPsalmodyOverride
 * all recognize this day as "Our Lady's Saturday" rather than an
 * anonymous feria — see data/calendar/temporal-feasts/marian-saturday.yml.
 *
 * Also gated on no octave being active: `ordinary-feria` isn't only "a
 * genuinely free Saturday" — Pentecost's own Ember Saturday is
 * deliberately classified this way too (see data/calendar/temporal-
 * categories.yml), specifically so the octave layer above can reach it.
 * Found via a real regression: without this gate, Pentecost's Ember
 * Saturday got relabeled "Our Lady's Saturday" right out from under the
 * octave commemoration that's supposed to govern it.
 */
function applyMarianSaturday(
  isoDate: string,
  weekday: ReturnType<typeof weekdayOf>,
  temporalCategory: TemporalCategory,
  winner: DayWinner,
  commemorations: Commemoration[],
): DayWinner {
  if (weekday !== 'saturday' || temporalCategory !== 'ordinary-feria' || activeOctavesFor(isoDate).length > 0) {
    return winner;
  }
  const MARIAN_SATURDAY: DayWinner = { kind: 'temporal', id: 'marian-saturday' };
  if (winner.kind === 'temporal') {
    return MARIAN_SATURDAY;
  }
  if (isAtLeast(winner.rank, 'semiduplex')) {
    return winner;
  }
  commemorations.push({ kind: 'sanctoral', id: winner.id, name: winner.name, rank: winner.rank });
  return MARIAN_SATURDAY;
}

/**
 * Layered on top of everything above, not part of it: an octave doesn't
 * change how a single day's own precedence contest is decided, it just
 * (a) adds a commemoration for every octave still active on this date, and
 * (b) occasionally overrides the winner when the occurring saint is too
 * minor to clear the strictest active octave's threshold, in which case
 * the day reverts to its own temporal identity and the saint is
 * commemorated instead — same "demoted, not dropped" shape as every other
 * commemoration rule in this file.
 */
function applyOctaves(isoDate: string, winner: DayWinner, commemorations: Commemoration[]): DayWinner {
  const octaves = activeOctavesFor(isoDate);
  if (octaves.length === 0) {
    return winner;
  }

  let resolvedWinner = winner;
  if (winner.kind === 'sanctoral' && !isAtLeast(winner.rank, strictestThreshold(octaves))) {
    const isOneOfTheseOctaves = octaves.some((o) => o.id === winner.id);
    if (!isOneOfTheseOctaves) {
      commemorations.push({ kind: 'sanctoral', id: winner.id, name: winner.name, rank: winner.rank });
      resolvedWinner = { kind: 'temporal', id: resolveTemporalId(isoDate) };
    }
  }

  for (const octave of octaves) {
    const isSelf = resolvedWinner.kind === 'sanctoral' && resolvedWinner.id === octave.id;
    // An octave's own day-1, when nothing displaced it, already *is* that
    // feast (via the day's own temporal identity) — commemorating it
    // again alongside itself would be redundant.
    const isOwnStartDay = octave.dayNumber === 1 && resolvedWinner.kind === 'temporal';
    if (!isSelf && !isOwnStartDay) {
      commemorations.push({ kind: 'octave', id: octave.id, name: octave.name });
    }
  }

  return resolvedWinner;
}

/**
 * The Sunday/feast-vs-ferial split that several hours' propers key off of
 * (Prime's capitulum and Preces, so far): a plain weekday with nothing else
 * going on gets the "ferial" form, Sunday or a winning feast gets the
 * fuller "Sunday/feast" form.
 */
export function isSundayOrFeast(day: LiturgicalDay): boolean {
  return day.weekday === 'sunday' || day.winner.kind === 'sanctoral';
}

export { compareFeastClass, isAtLeast, decideOccurrence } from './commemorations';
export { resolveCollision } from './collision';
export { resolveTemporalId } from './temporal-id';
export { activeOctavesFor, strictestThreshold } from './octaves';
export type { ActiveOctave } from './octaves';
export type {
  LiturgicalDay,
  DayWinner,
  Commemoration,
  SanctoralIdentity,
  Season,
  Weekday,
  FeastClass,
  TemporalCategory,
  OctaveConfig,
} from './types';
