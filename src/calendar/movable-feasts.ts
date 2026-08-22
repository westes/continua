// A generic resolver for feasts pegged to a fixed day-offset from Easter
// Sunday that AREN'T themselves a Sunday, so calendar/temporal-id.ts's own
// governing-Sunday-based lookup can never find them -- e.g. Immaculate
// Heart of Mary (Easter+69, always a Saturday). Every entry is just a
// `data/calendar/temporal-feasts/<id>.yml` file with `rank` and
// `easterOffset` set (temporal-feasts.ts's own `movableTemporalFeasts`
// scans for these) -- adding the next one (an Ember/Rogation day, a
// Sacred-Heart-family Marian feast, a Lenten Friday devotion, St.
// Joseph's own Eastertide feast, ...) needs no new function here or in
// calendar/index.ts.
//
// Deliberately doesn't try to cover every movable-date pattern in this
// codebase: `christ-the-king` (last Sunday of October), `marian-saturday`
// (a generic "nothing else assigned" fallback, not date-anchored at all),
// and `christmas-octave-sunday` (whichever of Dec 26-29 is a Sunday) are
// structurally different rules, not Easter-offset ones, and stay as their
// own small functions in calendar/index.ts. A future Ember/Rogation day
// anchored to a *fixed civil date's* nearest Sunday (September/Advent
// Ember weeks, not Easter-anchored) would need a second anchor kind, not
// modeled yet -- extend `TemporalFeastRecord`/this file's own resolver
// when that's actually needed, rather than guessing at its shape now.
import type { Commemoration, DayWinner } from './types';
import { compareFeastClass } from './commemorations';
import { easterSunday } from './easter';
import { addDays, toIsoDate } from './date-math';
import { movableTemporalFeasts } from './temporal-feasts';

function dateForOffset(year: number, offset: number): string {
  return addDays(toIsoDate(easterSunday(year)), offset);
}

/**
 * Run last in resolveDay's override chain (see calendar/index.ts) so a
 * specific named movable feast always supersedes whatever generic default
 * (marian-saturday, a plain Sunday-of-week id) ran before it -- same
 * reasoning as applyChristTheKing/applyMarianSaturday's own ordering.
 * Same rank-compared, commemorate-the-loser shape those two already use:
 * a temporal winner (no real standing of its own) is always superseded; a
 * sanctoral winner keeps the day if its own rank is at least as strong as
 * the movable feast's, which is commemorated instead; otherwise the
 * movable feast wins and the displaced saint is commemorated.
 */
export function applyMovableFeasts(isoDate: string, winner: DayWinner, commemorations: Commemoration[]): DayWinner {
  const year = Number(isoDate.slice(0, 4));
  let resolvedWinner = winner;
  for (const feast of movableTemporalFeasts()) {
    if (isoDate !== dateForOffset(year, feast.easterOffset!)) {
      continue;
    }
    const rank = feast.rank ?? 'simplex';
    const FEAST_WINNER: DayWinner = { kind: 'temporal', id: feast.id };
    if (resolvedWinner.kind === 'temporal') {
      commemorations.push({ kind: 'temporal', id: resolvedWinner.id });
      resolvedWinner = FEAST_WINNER;
    } else if (compareFeastClass(resolvedWinner.rank, rank) >= 0) {
      commemorations.push({ kind: 'temporal', id: feast.id });
    } else {
      commemorations.push({ kind: 'sanctoral', id: resolvedWinner.id, name: resolvedWinner.name, rank: resolvedWinner.rank });
      resolvedWinner = FEAST_WINNER;
    }
  }
  return resolvedWinner;
}
