import type { HourId, ResolvedText } from './types';
import type { LiturgicalDay } from '../calendar/types';
import { getSaintRecord } from '../calendar/feasts';
import { resolveActiveOctave } from '../calendar';
import { sharedOfficeId } from './office-source';
import {
  COMMON_BUNDLE_ALIAS,
  PASCHALTIDE_SEASONS,
  getMinorHourOverrideId,
  resolveCommon,
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
 * 3. a temporal-only octave's own file (Ascension's, Pentecost's: no saint
 *    record, so winner resolution can't substitute it);
 * 4. the hour's temporal keys (season, weekday...), most to least specific --
 *    what a ferial or Sunday winner is made of.
 *
 * At every step the Paschaltide file (`${id}-paschaltide`, in Paschaltide)
 * and the Vespers file (`${id}-first`/`-second`) are tried before the base
 * file. Nothing authored anywhere returns `missing`: a gap shows as a gap.
 */
export type PartKind = 'hymn';

const FILE_PART: Record<PartKind, string> = { hymn: 'hymn' };

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

/** The winner-keyed ids to try, most specific first. */
function winnerIds(day: LiturgicalDay): string[] {
  const overrideId = getMinorHourOverrideId(day);
  if (!overrideId) {
    return [];
  }
  const ids = [overrideId, sharedOfficeId(overrideId)];
  const commonId = getSaintRecord(overrideId)?.common;
  if (commonId) {
    ids.push(commonId, COMMON_BUNDLE_ALIAS[commonId]);
  }
  return ids.filter((id): id is string => !!id);
}

export function lookupPart({ day, hour, part, temporalKeys, variant, ignoreWinner }: PartRequest): ResolvedText {
  const prefix = `${hour}-${FILE_PART[part]}-`;
  const ids = ignoreWinner ? [] : [...winnerIds(day)];
  const octave = resolveActiveOctave(day.date);
  if (octave && !getSaintRecord(octave.id)) {
    ids.push(octave.id);
  }
  ids.push(...temporalKeys);
  const paschal = PASCHALTIDE_SEASONS.has(day.season);
  for (const id of ids) {
    const candidates = [paschal ? `${id}-paschaltide` : undefined, variant ? `${id}-${variant}` : undefined, id];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const text = resolveCommon(prefix + candidate);
      if (isReal(text)) {
        return text;
      }
    }
  }
  return MISSING;
}
