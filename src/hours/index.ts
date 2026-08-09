import type { HourId, ResolvedOrdo } from './types';
import { HOUR_IDS } from './types';
import * as prime from './prime';
import * as compline from './compline';
import * as terce from './terce';
import * as sext from './sext';
import * as none from './none';
import * as lauds from './lauds';
import * as vespers from './vespers';
import * as matins from './matins';

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

export function resolveOrdo(hourId: HourId, date: string): ResolvedOrdo {
  return registry[hourId](date);
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
