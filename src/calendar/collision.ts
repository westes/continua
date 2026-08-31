// Resolves two sanctoral candidates wanting the same day — the case
// calendar/feasts.ts explicitly doesn't cover (it just picks the
// higher-ranked of several native candidates and drops the rest) and that
// calendar/commemorations.ts doesn't cover either (that's temporal-vs-
// sanctoral, this is sanctoral-vs-sanctoral). This is specifically what a
// transferred feast (calendar/transfer.ts) runs into when its landing day
// already has a native saint — never triggered by a plain ferial landing,
// since a genuinely empty day isn't a collision at all.
//
// Same ordering as commemorations.ts's FeastClass scale, which is exactly
// the point: `duplex > semiduplex > vigil > simplex` is that scale, not a
// separate one — see calendar/types.ts's FeastClass doc comment.
import type { Commemoration, DayWinner, SanctoralIdentity } from './types';
import { compareFeastClass } from './commemorations';

export interface CollisionResult {
  winner: DayWinner;
  commemorations: Commemoration[];
}

function asWinner(candidate: SanctoralIdentity): DayWinner {
  return { kind: 'sanctoral', id: candidate.id, name: candidate.name, nameLa: candidate.nameLa, rank: candidate.rank };
}

function asCommemoration(candidate: SanctoralIdentity): Commemoration {
  return { kind: 'sanctoral', id: candidate.id, name: candidate.name, nameLa: candidate.nameLa, rank: candidate.rank };
}

/**
 * `incoming` is the transferred candidate; `native` is whoever already
 * occupies the landing day. The loser is always commemorated — unlike
 * commemorations.ts's Sunday rules, there's no rank threshold below which
 * it gets nothing; a real named feast landing anywhere always leaves a
 * trace. Ties favor `native` — the incoming feast is the guest here.
 */
export function resolveCollision(incoming: SanctoralIdentity, native: SanctoralIdentity): CollisionResult {
  const winner = compareFeastClass(incoming.rank, native.rank) > 0 ? incoming : native;
  const loser = winner === incoming ? native : incoming;
  return { winner: asWinner(winner), commemorations: [asCommemoration(loser)] };
}
