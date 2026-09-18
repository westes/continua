// Ember days (Quatuor Temporum) are privileged ferias, not named feasts —
// structurally different from calendar/movable-feasts.ts's rank-contest
// table. The precedence side (whether an occurring saint outranks the
// feria) is already handled generically by resolveTemporalCategory
// (both September's and Advent's Ember days get their own
// `privileged-feria-ember` entry there, Duplex threshold, split out from
// plain Advent ferias 2026-09-18) feeding the ordinary decideOccurrence
// contest -- this file ONLY handles content
// identity: relabeling the day's own temporal id so an Ember day's real,
// distinct proper content (collect, Matins readings) gets found instead
// of inheriting whatever Sunday governs that week, the same way
// applyMarianSaturday/applyChristmasOctaveSunday relabel a feria's own id
// for the same reason.
import type { Commemoration, DayWinner } from './types';
import { septemberEmberDayOffset, adventEmberDayOffset } from './temporal';
import { activeOctavesFor } from './octaves';
import { resolveTemporalId } from './temporal-id';

const SEPTEMBER_EMBER_IDS: Record<number, string> = {
  3: 'ember-september-wednesday',
  5: 'ember-september-friday',
  6: 'ember-september-saturday',
};
const ADVENT_EMBER_IDS: Record<number, string> = {
  3: 'ember-advent-wednesday',
  5: 'ember-advent-friday',
  6: 'ember-advent-saturday',
};

function emberIdFor(isoDate: string): string | undefined {
  const septemberOffset = septemberEmberDayOffset(isoDate);
  if (septemberOffset !== undefined) {
    return SEPTEMBER_EMBER_IDS[septemberOffset];
  }
  const adventOffset = adventEmberDayOffset(isoDate);
  if (adventOffset !== undefined) {
    return ADVENT_EMBER_IDS[adventOffset];
  }
  return undefined;
}

/**
 * Run after applyOctaves, same gate that function's own doc comment and
 * applyMarianSaturday both rely on: an active octave (the Nativity of the
 * BVM's, Sep 8-15, can genuinely overlap a late-anchored September Ember
 * week in some years) already has real standing of its own and shouldn't
 * be silently relabeled out from under it.
 *
 * Two cases, mirroring how a "Commemoratio ad Laudes tantum" reads
 * live against the reference engine: if the feria itself is what's
 * winning (`winner.kind === 'temporal'`, i.e. resolveTemporalCategory's
 * `privileged-feria-ember` Duplex threshold already beat whatever saint
 * was there, or nothing was there at all), its id is swapped for the
 * Ember day's own — real content gets found where it wouldn't otherwise
 * be. If a saint won outright instead (Duplex+, strong enough to clear
 * that threshold), the winner is left alone but the Ember day is still
 * commemorated alongside it, so its own collect/readings still surface
 * (this app doesn't model the "Laudes only" hour-scoping nuance — same
 * simplification level as every other commemoration here, not a new gap).
 *
 * That second case runs *after* `decideOccurrence` already pushed a plain
 * `{ kind: 'temporal', id: <today's ordinary weekday id> }` commemoration
 * of its own (the `privileged-feria-ember` branch's "the feria itself is
 * commemorated in return" — there's only one Friday, and today it's this
 * Ember Friday, not a separate anonymous one) — relabeling that existing
 * entry to the Ember id, rather than pushing a second one alongside it, is
 * what keeps the day from showing two commemorations of the same feria
 * under two different names (fixed 2026-09-19, live-reported: a Duplex+
 * saint winning outright on September Ember Friday showed both
 * "Commemoration of Friday in the 15th week after Trinity" and
 * "Commemoration of Ember Friday in September").
 */
export function applyEmberDay(isoDate: string, winner: DayWinner, commemorations: Commemoration[]): DayWinner {
  if (activeOctavesFor(isoDate).length > 0) {
    return winner;
  }
  const emberId = emberIdFor(isoDate);
  if (!emberId) {
    return winner;
  }
  if (winner.kind === 'temporal') {
    return { kind: 'temporal', id: emberId };
  }
  const plainId = resolveTemporalId(isoDate);
  const existingIndex = commemorations.findIndex((c) => c.kind === 'temporal' && c.id === plainId);
  if (existingIndex >= 0) {
    commemorations[existingIndex] = { kind: 'temporal', id: emberId };
  } else {
    commemorations.push({ kind: 'temporal', id: emberId });
  }
  return winner;
}
