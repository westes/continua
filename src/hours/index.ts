import type { HourId, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import { HOUR_IDS } from './types';
import * as prime from './prime';
import * as compline from './compline';
import * as terce from './terce';
import * as sext from './sext';
import * as none from './none';
import * as lauds from './lauds';
import * as vespers from './vespers';
import * as matins from './matins';
import { resolveDay } from '../calendar';
import { resolveEveningDay } from '../calendar/vespers';
import { resolveGloriaPatri } from './resolve-common';

// Vespers and Compline resolve their *content* off resolveEveningDay's
// possibly-anticipated identity (e.g. Holy Saturday evening is already
// Easter's own First Vespers/Compline — see resolveEveningDay's doc
// comment), so the Gloria Patri's Sacred Triduum omission has to be
// checked against that same governing day, not the raw calendar date —
// otherwise Easter's anticipated evening offices would wrongly lose their
// Gloria Patri as if they were still Holy Saturday's.
const EVENING_HOURS = new Set<HourId>(['vespers', 'compline']);

type Resolver = (date: string) => ResolvedOrdo;

// Uniform on purpose — even though terce/sext/none are structurally
// identical, callers never branch on which hour they're asking for.
const registry: Record<HourId, Resolver> = {
  prime: prime.resolveOrdo,
  compline: compline.resolveOrdo,
  terce: terce.resolveOrdo,
  sext: sext.resolveOrdo,
  none: none.resolveOrdo,
  lauds: lauds.resolveOrdo,
  vespers: vespers.resolveOrdo,
  matins: matins.resolveOrdo,
};

/** Attaches the closing Gloria Patri to every plain psalm and canticle part
 * (recursing into 'nocturn-psalmody' groups), so no per-hour builder has to
 * remember to do it — and so the Sacred Triduum omission
 * (resolveGloriaPatri) is enforced in exactly one place rather than once
 * per hour file. Live-verified (Divino Afflatu 1954, Tridentine 1906) that
 * canticles (e.g. Benedictus at Lauds of Holy Thursday) follow the exact
 * same Triduum-only omission as plain psalms — not a separate rule. */
function withGloriaPatri(parts: ResolvedPart[], gloriaPatri: ResolvedText | undefined): ResolvedPart[] {
  return parts.map((part) => {
    if (part.kind === 'psalm' || part.kind === 'canticle') {
      return { ...part, gloriaPatri };
    }
    if (part.kind === 'nocturn-psalmody') {
      return { ...part, psalms: withGloriaPatri(part.psalms, gloriaPatri) };
    }
    return part;
  });
}

export function resolveOrdo(hourId: HourId, date: string): ResolvedOrdo {
  const ordo = registry[hourId](date);
  const day = EVENING_HOURS.has(hourId) ? resolveEveningDay(date) : resolveDay(date);
  const gloriaPatri = resolveGloriaPatri(day);
  return { ...ordo, parts: withGloriaPatri(ordo.parts, gloriaPatri) };
}

export { HOUR_IDS };
export type {
  HourId,
  HourDefinition,
  HourPart,
  ResolvedOrdo,
  ResolvedPart,
  ResolvedText,
  ResolvedVerse,
  PropersRef,
} from './types';
