// Ember days (Quatuor Temporum) are privileged ferias, not named feasts —
// structurally different from calendar/movable-feasts.ts's rank-contest
// table. The precedence side (whether an occurring saint outranks the
// feria) is already handled generically, but via two different paths for
// the 4 quarters: September's and Advent's Ember days get their own
// `privileged-feria-ember` entry in resolveTemporalCategory (Duplex
// threshold, split out from plain Advent ferias 2026-09-18), while Lent's
// (temporal-categories.yml's plain `offsets` table) and Pentecost's
// (pentecost-sunday.yml's Octave `wins: duplex`) already land at the same
// Duplex tier through mechanism that predates this file and needed no
// Ember-specific addition -- this file ONLY handles content identity:
// relabeling the day's own temporal id so an Ember day's real, distinct
// proper content (collect, Matins readings) gets found instead of
// inheriting whatever Sunday governs that week, the same way
// applyMarianSaturday/applyChristmasOctaveSunday relabel a feria's own id
// for the same reason.
import type { Commemoration, DayWinner } from './types';
import { septemberEmberDayOffset, adventEmberDayOffset, lentEmberDayOffset, pentecostEmberDayOffset } from './temporal';
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
const LENT_EMBER_IDS: Record<number, string> = {
  '-39': 'ember-lent-wednesday',
  '-37': 'ember-lent-friday',
  '-36': 'ember-lent-saturday',
};
const PENTECOST_EMBER_IDS: Record<number, string> = {
  52: 'ember-pentecost-wednesday',
  54: 'ember-pentecost-friday',
  55: 'ember-pentecost-saturday',
};

// Pentecost's own governing octave id -- see applyEmberDay's doc comment
// for why this needs to be exempted from the "an active octave already
// has real standing of its own" gate, unlike every other octave that gate
// is meant to defer to.
const PENTECOST_OCTAVE_ID = 'pentecost-sunday';

function emberIdFor(isoDate: string): string | undefined {
  const septemberOffset = septemberEmberDayOffset(isoDate);
  if (septemberOffset !== undefined) {
    return SEPTEMBER_EMBER_IDS[septemberOffset];
  }
  const adventOffset = adventEmberDayOffset(isoDate);
  if (adventOffset !== undefined) {
    return ADVENT_EMBER_IDS[adventOffset];
  }
  const lentOffset = lentEmberDayOffset(isoDate);
  if (lentOffset !== undefined) {
    return LENT_EMBER_IDS[lentOffset];
  }
  const pentecostOffset = pentecostEmberDayOffset(isoDate);
  if (pentecostOffset !== undefined) {
    return PENTECOST_EMBER_IDS[pentecostOffset];
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
 * Pentecost is a deliberate exception to that gate, not an oversight:
 * unlike September's occasional, genuinely-foreign BVM-octave overlap,
 * Pentecost's own 3 Ember days fall *inside Pentecost's own Octave*
 * every single year by construction (offsets 52/54/55, well within the
 * Octave's 50-55 range) — `activeOctavesFor` would therefore always
 * report Pentecost's own octave as active there, and the plain "defer to
 * whatever octave is running" gate would permanently suppress Pentecost's
 * Ember content if applied unconditionally. The gate's actual purpose —
 * don't relabel out from under a *different*, competing octave's own
 * standing — still applies to Pentecost's Ember days too (nothing else is
 * known to overlap them, but the check costs nothing), so only the
 * Pentecost octave itself is exempted, not octaves generally.
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
 * "Commemoration of Ember Friday in September"). Lent's Ember days never
 * collide with an active octave at all (no octave's offsets ever reach
 * Lent's first week), so this case is untested for Lent specifically but
 * follows the same logic.
 */
export function applyEmberDay(isoDate: string, winner: DayWinner, commemorations: Commemoration[]): DayWinner {
  const emberId = emberIdFor(isoDate);
  if (!emberId) {
    return winner;
  }
  const isPentecostEmber = emberId.startsWith('ember-pentecost-');
  const foreignOctaveActive = activeOctavesFor(isoDate).some(
    (octave) => !(isPentecostEmber && octave.id === PENTECOST_OCTAVE_ID),
  );
  if (foreignOctaveActive) {
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
