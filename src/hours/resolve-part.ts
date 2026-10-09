import type { HourId, ResolvedText } from './types';
import type { LiturgicalDay } from '../calendar/types';
import { getSaintRecord } from '../calendar/feasts';
import { resolveActiveOctave } from '../calendar';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { sharedOfficeId } from './office-source';
import {
  COMMON_BUNDLE_ALIAS,
  deriveMinorHourAntiphonFromLauds,
  PASCHALTIDE_SEASONS,
  getMinorHourOverrideId,
  resolveCommon,
  resolveOfficeWinner,
  type VespersVariant,
} from './resolve-common';

/**
 * The one lookup behind every single-text slot (a hymn, and -- as each is
 * migrated -- a chapter, versicle, responsory, antiphon...): given the day's
 * office winner and the hour, find the authored file. Pure selection, never
 * edits text; adjustments (the hymn doxology swap, the Paschaltide Alleluia)
 * are a separate layer applied to the result by the caller.
 *
 * Files are named `${hour}-${part}-${id}`. The winner is always
 * `resolveOfficeWinner(day)` (which already substitutes an octave's
 * governing feast), so an octave day needs no tier of its own. The chain is:
 *
 * 1. the winner's own file, then the file of the feast it shares an office
 *    with (`sharedOfficeId`, e.g. the Octave Day of All Saints -> All Saints);
 * 2. for a saint, its single `common` (then that Common's bundle alias);
 * 3. for a hymn, a temporal-only octave's own file (Ascension's, Pentecost's:
 *    no saint record, so winner resolution can't substitute it);
 * 4. for a ferial or Sunday winner, the hour's temporal keys (season,
 *    weekday...), most to least specific. A saint or named feast never takes
 *    these: with nothing authored it returns `missing`.
 *
 * At every step the Paschaltide file (`${id}-paschaltide`, in Paschaltide)
 * and the Vespers file (`${id}-first`/`-second`) are tried before the base
 * file. Nothing authored anywhere returns `missing`: a gap shows as a gap.
 */
export type PartKind = 'hymn' | 'chapter' | 'responsory' | 'versicle' | 'antiphon';

const FILE_PART: Record<PartKind, string> = {
  hymn: 'hymn',
  chapter: 'capitulum',
  responsory: 'responsory',
  versicle: 'versicle',
  antiphon: 'antiphon',
};

/** A winner-keyed Vespers chapter reuses the Lauds file when it has none of
 * its own: the capitulum is byte-identical between the two hours for every
 * feast with an office of its own (live-verified, 2026-08), so no
 * `vespers-capitulum-<id>.yml` was authored for them. */
const WINNER_SIBLING_HOUR: Partial<Record<HourId, Partial<Record<PartKind, HourId>>>> = {
  vespers: { chapter: 'lauds' },
};

export interface PartRequest {
  day: LiturgicalDay;
  hour: HourId;
  part: PartKind;
  /** The hour's temporal-day file keys (the tail after `${hour}-${part}-`),
   * most to least specific: what a ferial or Sunday winner is made of. */
  temporalKeys: string[];
  /** Which Vespers, where a `-first`/`-second` file exists. */
  variant?: VespersVariant;
  /** Skip the winner-keyed steps and use the temporal keys alone: the
   * Saturday evening before a seasonal proper Sunday takes the Saturday's
   * own hymn, not the Sunday's. */
  ignoreWinner?: boolean;
}

const MISSING: ResolvedText = { text: {}, status: { la: 'missing', en: 'missing' } };

function isReal(t: ResolvedText): boolean {
  return t.status.la !== 'missing' || t.status.en !== 'missing';
}

/** The winner-keyed ids to try: the feast's own (and its shared office's),
 * then its Common's. */
function winnerIds(day: LiturgicalDay): { proper: string[]; common: string[] } {
  const overrideId = getMinorHourOverrideId(day);
  if (!overrideId) {
    return { proper: [], common: [] };
  }
  const commonId = getSaintRecord(overrideId)?.common;
  return {
    proper: [overrideId, sharedOfficeId(overrideId)].filter((id): id is string => !!id),
    common: [commonId, commonId ? COMMON_BUNDLE_ALIAS[commonId] : undefined].filter((id): id is string => !!id),
  };
}

/** Whether the day's winner deliberately has no such part (`noParts` in its
 * feast record) -- as opposed to simply not having it authored yet. */
export function isAbsentByDesign(day: LiturgicalDay, hour: HourId, part: PartKind): boolean {
  const winner = resolveOfficeWinner(day);
  const noParts =
    winner.kind === 'sanctoral' ? getSaintRecord(winner.id)?.noParts : getTemporalFeastRecord(winner.id)?.noParts;
  return !!noParts?.includes(`${hour}-${FILE_PART[part]}`);
}

/** Where a looked-up text came from: the feast's own file (or its shared
 * office's, or a temporal octave's), the antiphon derived from its Lauds set,
 * its Common's file, or the hour's temporal key. `paschalFile` is true when
 * the text is a Paschaltide variant file, which needs no further Alleluia. */
export type PartTier = 'proper' | 'derived' | 'common' | 'temporal';

export interface FoundPart {
  text: ResolvedText;
  tier: PartTier;
  paschalFile: boolean;
}

export function lookupPart(request: PartRequest): ResolvedText {
  return lookupPartTiered(request)?.text ?? MISSING;
}

/** `isFeast`: a saint (other than a Vigil) never takes the weekday's text. */
export function isFeastWinner(day: LiturgicalDay): boolean {
  const winner = resolveOfficeWinner(day);
  return winner.kind === 'sanctoral' && winner.rank !== 'vigil';
}

export function lookupPartTiered({ day, hour, part, temporalKeys, variant, ignoreWinner }: PartRequest): FoundPart | undefined {
  if (!ignoreWinner && isAbsentByDesign(day, hour, part)) {
    return undefined;
  }
  const paschal = PASCHALTIDE_SEASONS.has(day.season);
  const sibling = WINNER_SIBLING_HOUR[hour]?.[part];
  const find = (h: HourId, id: string, tier: PartTier): FoundPart | undefined => {
    const prefix = `${h}-${FILE_PART[part]}-`;
    const candidates = [paschal ? `${id}-paschaltide` : undefined, variant ? `${id}-${variant}` : undefined, id];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const text = resolveCommon(prefix + candidate);
      if (isReal(text)) {
        return { text, tier, paschalFile: candidate.endsWith('-paschaltide') };
      }
    }
    return undefined;
  };
  const ids = ignoreWinner ? { proper: [], common: [] } : winnerIds(day);
  // A temporal-only octave supplies its hymn alone: the Sunday within it
  // keeps its own chapter, responsory and versicle (Ascension's octave
  // Sunday's chapter genuinely differs from Ascension Day's).
  const octave = part === 'hymn' ? resolveActiveOctave(day.date) : undefined;
  for (const id of ids.proper) {
    const found = find(hour, id, 'proper') ?? (sibling ? find(sibling, id, 'proper') : undefined);
    if (found) {
      return found;
    }
  }
  // A minor-hour antiphon can be derived from the feast's own Lauds set.
  if (part === 'antiphon') {
    for (const id of ids.proper) {
      const derived = deriveMinorHourAntiphonFromLauds(hour, id);
      if (derived) {
        return { text: derived, tier: 'derived', paschalFile: false };
      }
    }
  }
  for (const id of ids.common) {
    const found = find(hour, id, 'common') ?? (sibling ? find(sibling, id, 'common') : undefined);
    if (found) {
      return found;
    }
  }
  if (octave && !getSaintRecord(octave.id)) {
    const found = find(hour, octave.id, 'proper');
    if (found) {
      return found;
    }
  }
  // A saint is not a ferial day (a Vigil is: it takes the weekday's text): if
  // nothing of its own or its Common is authored, that is a gap to show, not
  // a cue to borrow the weekday's text.
  for (const key of isFeastWinner(day) && !ignoreWinner ? [] : temporalKeys) {
    const found = find(hour, key, 'temporal');
    if (found) {
      return found;
    }
  }
  return undefined;
}
