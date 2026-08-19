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
import { resolveGloriaPatri } from './resolve-common';

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

/** Attaches the closing Gloria Patri to every plain psalm part (recursing
 * into 'nocturn-psalmody' groups), so no per-hour builder has to remember
 * to do it — and so the Sacred Triduum omission (resolveGloriaPatri) is
 * enforced in exactly one place rather than once per hour file. */
function withGloriaPatri(parts: ResolvedPart[], gloriaPatri: ResolvedText | undefined): ResolvedPart[] {
  return parts.map((part) => {
    if (part.kind === 'psalm') {
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
  const gloriaPatri = resolveGloriaPatri(resolveDay(date));
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
