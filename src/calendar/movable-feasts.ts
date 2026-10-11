// A generic resolver for feasts whose own date isn't reachable through
// calendar/temporal-id.ts's ordinary governing-Sunday lookup -- either
// because the feast itself isn't a Sunday (Immaculate Heart of Mary,
// Easter+69, always a Saturday), or because its occurrence rule (last
// Sunday of a month, unconditional) doesn't fit the plain rank-contest
// every other day goes through (Christ the King).
//
// Every entry is just a `data/calendar/temporal-feasts/<id>.yml` file with
// `rank` and `anchor` set (temporal-feasts.ts's own `movableTemporalFeasts`
// scans for these) -- adding the next one (an Ember/Rogation day, a
// Sacred-Heart-family Marian feast, a Lenten Friday devotion, St. Joseph's
// own Eastertide feast, ...) needs no new function here or in
// calendar/index.ts, just a new anchor value on that new file.
//
// Deliberately doesn't try to cover every movable-date pattern in this
// codebase: `marian-saturday` (a generic "nothing else assigned" fallback,
// not date-anchored at all) and `christmas-octave-sunday` (whichever of
// Dec 26-29 is a Sunday, a fixed-date-*range* search rather than a
// Nth-Sunday-from-an-anchor one) are structurally different rules and stay
// as their own small functions in calendar/index.ts.
import type { Commemoration, DayWinner } from './types';
import { compareFeastClass } from './commemorations';
import { movableTemporalFeasts } from './temporal-feasts';
import { dateForAnchor } from './anchors';

/**
 * Run last in resolveDay's override chain (see calendar/index.ts) so a
 * specific named movable feast always supersedes whatever generic default
 * (marian-saturday, a plain Sunday-of-week id) ran before it.
 *
 * Two occurrence rules, per feast: the ordinary one is rank-compared,
 * commemorate-the-loser (a temporal winner, with no real standing of its
 * own, is always superseded; a sanctoral winner keeps the day if its own
 * rank is at least as strong, commemorating the movable feast instead;
 * otherwise the movable feast wins and the displaced saint is
 * commemorated) -- same shape applyMarianSaturday already uses. The
 * `unconditional` rule (Christ the King) skips the rank contest entirely
 * and always wins, commemorating whatever it displaces regardless of
 * strength.
 */
export function applyMovableFeasts(isoDate: string, winner: DayWinner, commemorations: Commemoration[]): DayWinner {
  const year = Number(isoDate.slice(0, 4));
  let resolvedWinner = winner;
  // Lowest rank first: a feast with a rank (a Lenten Friday's Passion feast)
  // lands on the same date as the unranked feria record of that day, and must
  // be applied after it so it displaces it and commemorates it, not the
  // other way round. The sort is stable, so equal ranks keep file order.
  const feasts = [...movableTemporalFeasts()].sort(
    (a, b) => compareFeastClass(a.rank ?? 'simplex', b.rank ?? 'simplex'),
  );
  for (const feast of feasts) {
    if (isoDate !== dateForAnchor(year, feast.anchor!)) {
      continue;
    }
    const FEAST_WINNER: DayWinner = { kind: 'temporal', id: feast.id };
    if (feast.unconditional) {
      if (resolvedWinner.kind === 'temporal') {
        commemorations.push({ kind: 'temporal', id: resolvedWinner.id });
      } else {
        commemorations.push({ kind: 'sanctoral', id: resolvedWinner.id, name: resolvedWinner.name, nameLa: resolvedWinner.nameLa, rank: resolvedWinner.rank });
      }
      resolvedWinner = FEAST_WINNER;
      continue;
    }
    const rank = feast.rank ?? 'simplex';
    if (resolvedWinner.kind === 'temporal') {
      // Not commemorated when the record says the displaced id is just the
      // governing-week catch-all this feast replaces on its own day
      // (Christmas Day over "Friday in Christmastide", the Epiphany over
      // `post-epiphany-1`, Low Sunday over `easter-octave`).
      if (!feast.suppressDisplacedCommemoration) {
        commemorations.push({ kind: 'temporal', id: resolvedWinner.id });
      }
      resolvedWinner = FEAST_WINNER;
    } else if (compareFeastClass(resolvedWinner.rank, rank) >= 0) {
      commemorations.push({ kind: 'temporal', id: feast.id });
    } else {
      commemorations.push({ kind: 'sanctoral', id: resolvedWinner.id, name: resolvedWinner.name, nameLa: resolvedWinner.nameLa, rank: resolvedWinner.rank });
      resolvedWinner = FEAST_WINNER;
    }
  }
  return resolvedWinner;
}
