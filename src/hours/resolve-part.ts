import type { HourId, ResolvedText } from './types';
import type { LiturgicalDay } from '../calendar/types';
import { getSaintRecord } from '../calendar/feasts';
import { resolveActiveOctave } from '../calendar';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { sharedOfficeId } from './office-source';
import {
  COMMON_BUNDLE_ALIAS,
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
export type PartKind = 'hymn' | 'chapter' | 'responsory' | 'versicle';

const FILE_PART: Record<PartKind, string> = {
  hymn: 'hymn',
  chapter: 'capitulum',
  responsory: 'responsory',
  versicle: 'versicle',
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

/** Whether the day's winner deliberately has no such part (`noParts` in its
 * feast record) -- as opposed to simply not having it authored yet. */
export function isAbsentByDesign(day: LiturgicalDay, hour: HourId, part: PartKind): boolean {
  const winner = resolveOfficeWinner(day);
  const noParts =
    winner.kind === 'sanctoral' ? getSaintRecord(winner.id)?.noParts : getTemporalFeastRecord(winner.id)?.noParts;
  return !!noParts?.includes(`${hour}-${FILE_PART[part]}`);
}

export function lookupPart({ day, hour, part, temporalKeys, variant, ignoreWinner }: PartRequest): ResolvedText {
  if (!ignoreWinner && isAbsentByDesign(day, hour, part)) {
    return MISSING;
  }
  const paschal = PASCHALTIDE_SEASONS.has(day.season);
  const sibling = WINNER_SIBLING_HOUR[hour]?.[part];
  const find = (h: HourId, id: string): ResolvedText | undefined => {
    const prefix = `${h}-${FILE_PART[part]}-`;
    const candidates = [paschal ? `${id}-paschaltide` : undefined, variant ? `${id}-${variant}` : undefined, id];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const text = resolveCommon(prefix + candidate);
      if (isReal(text)) {
        return text;
      }
    }
    return undefined;
  };
  const winnerKeyed = ignoreWinner ? [] : [...winnerIds(day)];
  // A temporal-only octave supplies its hymn alone: the Sunday within it
  // keeps its own chapter, responsory and versicle (Ascension's octave
  // Sunday's chapter genuinely differs from Ascension Day's).
  const octave = part === 'hymn' ? resolveActiveOctave(day.date) : undefined;
  if (octave && !getSaintRecord(octave.id)) {
    winnerKeyed.push(octave.id);
  }
  for (const id of winnerKeyed) {
    const found = find(hour, id) ?? (sibling ? find(sibling, id) : undefined);
    if (found) {
      return found;
    }
  }
  // A saint is not a ferial day (a Vigil is: it takes the weekday's text): if nothing of its own or its Common is authored, that is a
  // gap to show, not a cue to borrow the weekday's text.
  const winner = resolveOfficeWinner(day);
  const isFeast = winner.kind === 'sanctoral' && winner.rank !== 'vigil';
  for (const key of isFeast && !ignoreWinner ? [] : temporalKeys) {
    const found = find(hour, key);
    if (found) {
      return found;
    }
  }
  return MISSING;
}
