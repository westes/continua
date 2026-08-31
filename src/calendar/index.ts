import type { Commemoration, DayWinner, LiturgicalDay, SanctoralIdentity, TemporalCategory } from './types';
import { weekdayOf } from './weekday';
import { resolveSeason, resolveTemporalCategory } from './temporal';
import { resolveTemporalId } from './temporal-id';
import { getSanctoralCandidatesFor } from './feasts';
import { decideOccurrence, compareFeastClass, type OccurrenceResult } from './commemorations';
import { resolveCollision } from './collision';
import { addDays, toIsoDate } from './date-math';
import { easterSunday } from './easter';
import { activeOctavesFor, strictestThreshold } from './octaves';
import { applyMovableFeasts } from './movable-feasts';
import { applyEmberDay } from './ember-days';

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
      topCandidate = {
        id: collision.winner.id,
        name: collision.winner.name,
        nameLa: collision.winner.nameLa,
        rank: collision.winner.rank,
      };
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
  winner = applyEmberDay(isoDate, winner, commemorations);
  winner = applyMarianSaturday(isoDate, weekday, temporalCategory, winner, commemorations);
  winner = applyChristmasOctaveSunday(isoDate, weekday, winner, commemorations);
  winner = applyMovableFeasts(isoDate, winner, commemorations);
  applyEpiphany6Commemoration(isoDate, commemorations);
  applyAdventFourVigilCommemoration(isoDate, weekday, commemorations);

  return { date: isoDate, weekday, season, temporalCategory, winner, commemorations };
}

/**
 * Real rubric, confirmed 2026-08: when the 6th Sunday after Epiphany is
 * bumped by Septuagesima — i.e. only in years where the 5th Sunday after
 * Epiphany was the last one to actually occur — it's commemorated on the
 * Saturday immediately before Septuagesima, on top of whatever else that
 * Saturday already resolved to. Distinct from (and doesn't imply) the
 * later "resumed post-Epiphany Sunday" transfer handled in
 * temporal-id.ts's post-Pentecost overflow branch — that one applies to
 * *every* skipped post-Epiphany Sunday, not just VI; this Saturday
 * commemoration is VI's alone. Purely additive: no `Commemoration` variant
 * needed beyond the existing `{ kind: 'temporal' }` one, since
 * hours/resolve-common.ts's getDayCollects already resolves any temporal
 * commemoration's own `${id}-collect` for free.
 */
function applyEpiphany6Commemoration(isoDate: string, commemorations: Commemoration[]): void {
  const year = Number(isoDate.slice(0, 4));
  const septuagesimaStart = addDays(toIsoDate(easterSunday(year)), -63);
  const saturdayBeforeSeptuagesima = addDays(septuagesimaStart, -1);
  if (isoDate !== saturdayBeforeSeptuagesima) {
    return;
  }
  const lastEpiphanySunday = addDays(septuagesimaStart, -7);
  if (resolveTemporalId(lastEpiphanySunday) !== 'post-epiphany-5') {
    return;
  }
  commemorations.push({ kind: 'temporal', id: 'post-epiphany-6' });
}

/**
 * When Advent 4's own Sunday lands on Dec 24 (its latest possible date),
 * `resolveTemporalId` already gives that day the Vigil of Christmas's own
 * identity (`vigil-of-christmas` — collect, Lauds antiphons, Matins Gospel
 * nocturn), matching the reference engine's own rule that the Vigil's rank
 * governs. Per direct instruction (2026-08), unlike the reference engine's
 * own `no commemoratio` for this exact day, Advent 4 itself is still
 * commemorated here — the Sundays of Advent have real standing of their
 * own, distinct from an ordinary saint quietly ceding to a Vigil. Purely
 * additive, same shape as applyEpiphany6Commemoration just above: no new
 * `Commemoration` variant needed, `getDayCollects` already resolves any
 * `{ kind: 'temporal' }` commemoration's own `${id}-collect` for free.
 * `advent-4` is hardcoded rather than recomputed because Dec 24 always
 * falls at or after Advent's own 4th Sunday by construction (it's the
 * latest date Advent's 4th Sunday can ever land on).
 */
function applyAdventFourVigilCommemoration(
  isoDate: string,
  weekday: ReturnType<typeof weekdayOf>,
  commemorations: Commemoration[],
): void {
  if (isoDate.slice(5) === '12-24' && weekday === 'sunday') {
    commemorations.push({ kind: 'temporal', id: 'advent-4' });
  }
}

/**
 * Per direct instruction, scoped to exactly Dec 26-30 — every year
 * contains exactly one real Sunday somewhere in that 5-day window.
 *
 * On whichever of Dec 26-29 it actually falls, Nat1-0 (the Sunday within
 * the Octave of the Nativity) always wins outright, full stop — no rank
 * check at all, a deliberate departure from what Monastic 1617 itself
 * does there (a Duplex-II-classis saint — Stephen/John/Innocents — beats
 * the Sunday there in the real engine; see TODO.md). The displaced
 * saint isn't even commemorated in place; he reappears in full on Dec
 * 30 instead — the block's one date with no fixed saint of its own —
 * rather than the general privileged-sunday transfer/commemorate split
 * used everywhere else. Dec 30 itself, on a year it's the *actual*
 * Sunday (nothing displaced), resolves normally: Nat1-0 wins clean since
 * nothing was ever assigned there to begin with.
 */
function applyChristmasOctaveSunday(
  isoDate: string,
  weekday: ReturnType<typeof weekdayOf>,
  winner: DayWinner,
  commemorations: Commemoration[],
): DayWinner {
  const [year, monthStr, dayStr] = isoDate.split('-');
  if (monthStr !== '12') {
    return winner;
  }
  const day = Number(dayStr);

  if (day >= 26 && day <= 29 && weekday === 'sunday') {
    // The displaced saint isn't commemorated in place (per this
    // function's own doc comment, "he reappears in full on Dec 30
    // instead") — strip the sanctoral commemoration `decideOccurrence`
    // already pushed for him before this override ran, the same
    // candidate the Dec 30 branch below will look up again to revive.
    // Only became reachable once `commemorations.ts`'s `ordinary-sunday`
    // case started commemorating Semiduplex/Simplex in place instead of
    // transferring them (see its own doc comment) — before that fix, a
    // `transfer` signal carried the candidate forward instead of a
    // commemoration, so there was nothing here to strip.
    const displaced = getSanctoralCandidatesFor(isoDate)[0];
    if (displaced) {
      const idx = commemorations.findIndex((c) => c.kind === 'sanctoral' && c.id === displaced.id);
      if (idx !== -1) {
        commemorations.splice(idx, 1);
      }
    }
    return { kind: 'temporal', id: 'christmas-octave-sunday' };
  }

  if (day === 30) {
    for (let d = 26; d <= 29; d++) {
      const candidateDate = `${year}-12-${String(d).padStart(2, '0')}`;
      if (weekdayOf(candidateDate) !== 'sunday') {
        continue;
      }
      const displaced = getSanctoralCandidatesFor(candidateDate)[0];
      if (!displaced) {
        break;
      }
      // Drop the now-redundant "Octave of <displaced>" commemoration —
      // applyOctaves already pushed one above, using Dec 30's *original*
      // temporal winner; now that the displaced saint is winning the day
      // outright instead, commemorating his own octave alongside himself
      // would be the same redundancy applyOctaves' own `isSelf` check
      // already avoids on a saint's actual day.
      const idx = commemorations.findIndex((c) => c.kind === 'octave' && c.id === displaced.id);
      if (idx !== -1) {
        commemorations.splice(idx, 1);
      }
      return { kind: 'sanctoral', id: displaced.id, name: displaced.name, nameLa: displaced.nameLa, rank: displaced.rank };
    }
  }

  return winner;
}

/**
 * Layered on top of everything above, same spirit as applyOctaves: never
 * changes decideOccurrence's own rules, just relabels the result on a free
 * Saturday. Real standing of its own, but only really a Simplex-strength
 * one (per direct instruction, refined from an earlier "mirrors
 * privileged-feria-minor exactly" pass that also swept in Vigils, which
 * turned out wrong: a Vigil keeps forcing its own primacy on a Saturday
 * the same way it already does any other day, same as Simplex always has
 * — see calendar/commemorations.ts's own transferDirectionOf for Vigil's
 * usual special standing elsewhere) — a Simplex saint alone loses to it
 * and is commemorated instead; anything Semiduplex-or-higher, or a Vigil,
 * still wins outright and this never applies. `ordinary-feria` is the
 * only category this touches — every privileged season/day (Ember
 * Saturdays, Advent, Lent, ...) already has its own real standing and
 * keeps it untouched.
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
  if (winner.rank !== 'simplex') {
    return winner;
  }
  commemorations.push({ kind: 'sanctoral', id: winner.id, name: winner.name, nameLa: winner.nameLa, rank: winner.rank });
  return MARIAN_SATURDAY;
}

/**
 * Layered on top of everything above, not part of it: an octave doesn't
 * change how a single day's own precedence contest is decided, it just
 * (a) adds a commemoration for every octave still active on this date, and
 * (b) occasionally overrides the winner when the occurring saint doesn't
 * outrank the strictest active octave's threshold, in which case the day
 * reverts to its own temporal identity and the saint is commemorated
 * instead — same "demoted, not dropped" shape as every other
 * commemoration rule in this file.
 *
 * A *tie against an octave's own elevated closing day* goes to the
 * octave, not the occurring saint — live-verified counterexample: St.
 * Hyacinth (plain Duplex, Aug 17) against St. Lawrence's own octave
 * closing day that same date (also Duplex, via `closingDayRank`'s
 * default) — the reference engine's own alternate block for that date is
 * titled "Commemoratio S. Hyacinthi Confessoris", i.e. Hyacinth is the
 * one merely commemorated there, Lawrence's own elevated closing day
 * keeps the office. Matches this file's own `collision.ts` precedent for
 * the analogous sanctoral-vs-sanctoral tie ("Ties favor `native` — the
 * incoming feast is the guest here"): the closing day is the
 * already-running incumbent's own elevated day, an occurring saint is
 * the guest, and a guest needs to actually outrank it to displace it,
 * not just match it.
 *
 * A tie against an *ordinary* (non-closing) octave day's threshold still
 * favors the occurring saint, unchanged from the original behavior —
 * confirmed by two already-verified, live-sourced counterexamples this
 * file's own tests carry: St. Thomas of Canterbury (plain Semiduplex,
 * Dec 29) wins outright against the Christmas Octave's own ordinary
 * `wins: semiduplex` default that day (not its closing day, Jan 1), and
 * St. Nicholas of Tolentino (plain Semiduplex, Sep 10) likewise against
 * the Nativity of the BVM's octave (day 3 of 8, not closing). Only a
 * closing day's own elevated rank carries the "already the incumbent"
 * weight that breaks a tie in the octave's favor.
 */
function applyOctaves(isoDate: string, winner: DayWinner, commemorations: Commemoration[]): DayWinner {
  const octaves = activeOctavesFor(isoDate);
  if (octaves.length === 0) {
    return winner;
  }

  let resolvedWinner = winner;
  if (winner.kind === 'sanctoral') {
    const threshold = strictestThreshold(octaves);
    const cmp = compareFeastClass(winner.rank, threshold);
    const tiedAgainstClosingDay = cmp === 0 && octaves.some((o) => o.isClosingDay && compareFeastClass(o.wins, threshold) === 0);
    if (cmp < 0 || tiedAgainstClosingDay) {
      const isOneOfTheseOctaves = octaves.some((o) => o.id === winner.id);
      if (!isOneOfTheseOctaves) {
        commemorations.push({ kind: 'sanctoral', id: winner.id, name: winner.name, nameLa: winner.nameLa, rank: winner.rank });
        resolvedWinner = { kind: 'temporal', id: resolveTemporalId(isoDate) };
      }
    }
  }

  for (const octave of octaves) {
    const isSelf = resolvedWinner.kind === 'sanctoral' && resolvedWinner.id === octave.id;
    // An octave's own day-1, when nothing displaced it, already *is* that
    // feast (via the day's own temporal identity) — commemorating it
    // again alongside itself would be redundant.
    const isOwnStartDay = octave.dayNumber === 1 && resolvedWinner.kind === 'temporal';
    if (!isSelf && !isOwnStartDay) {
      commemorations.push({ kind: 'octave', id: octave.id, name: octave.name, nameLa: octave.nameLa });
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

export { compareFeastClass, isAtLeast, decideOccurrence, minimumOutrightWinningRank } from './commemorations';
export { resolveCollision } from './collision';
export { resolveTemporalId } from './temporal-id';
export { monthWeekId } from './month-week-id';
export { activeOctavesFor, strictestThreshold, resolveActiveOctave, octaveGoverningPrivilegedDay } from './octaves';
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
