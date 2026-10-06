// User-level overrides for feast ranks. The shipped rank lives with each
// feast record (data/calendar/saints/*.yml, data/calendar/temporal-feasts/
// *.yml) and stays the default; an override is a separate layer keyed by
// feast id (ids are unique across saints and temporal feasts) and applied
// once, inside the record getters in calendar/feasts.ts and
// calendar/temporal-feasts.ts -- so every consumer (collision,
// commemorations, octaves, movable feasts, the hours layer) sees the
// effective rank without knowing overrides exist.
//
// `rank` is the feast's own precedence class; `octaveWins` is its octave's
// ordinary `wins` threshold (OctaveConfig.wins) -- two separate knobs, since
// a user may want to demote a feast without changing how strongly its
// octave resists rival saints. Where overrides are persisted and edited is
// the calendar editor's concern; this module only holds the live map.
import type { FeastClass, OctaveConfig } from './types';

export interface RankOverride {
  rank?: FeastClass;
  octaveWins?: FeastClass;
}

let overrides: Readonly<Record<string, RankOverride>> = {};

export function setRankOverrides(next: Record<string, RankOverride>): void {
  overrides = next;
}

export function getRankOverrides(): Readonly<Record<string, RankOverride>> {
  return overrides;
}

/** Returns `record` itself when nothing overrides it (the common case, so
 * no per-call allocation), else a shallow copy with the effective values. */
export function withRankOverride<T extends { id: string; rank?: FeastClass; octave?: OctaveConfig }>(record: T): T {
  const o = overrides[record.id];
  if (!o) {
    return record;
  }
  const next: T = { ...record };
  // `vigil` is a different kind of day, not just a different tier: it
  // transfers backward instead of forward (commemorations.ts's
  // transferDirectionOf) and is tied to the feast it precedes (`vigilOf`).
  // So a rank override may neither make a feast a vigil nor stop a vigil
  // being one; such an override is ignored here, in the mechanism, rather
  // than left to whatever edits the map.
  if (o.rank !== undefined && (o.rank === 'vigil') === (record.rank === 'vigil')) {
    next.rank = o.rank;
  }
  if (o.octaveWins !== undefined && record.octave) {
    next.octave = { ...record.octave, wins: o.octaveWins };
  }
  return next;
}
