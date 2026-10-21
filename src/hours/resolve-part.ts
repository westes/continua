import type { HourId, ResolvedText } from './types';
import type { DayWinner, LiturgicalDay } from '../calendar/types';
import { getSaintRecord } from '../calendar/feasts';
import { activeOctavesFor, resolveActiveOctave } from '../calendar';
import vespersOAntiphonsData from '../data/hours/vespers-o-antiphons.yml';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { sharedOfficeId } from './office-source';
import {
  COMMON_BUNDLE_ALIAS,
  deriveMinorHourAntiphonFromLauds,
  PASCHALTIDE_SEASONS,
  getMinorHourOverrideId,
  resolveCommon,
  resolveOfficeWinner,
  verifiedText,
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
export type PartKind = 'hymn' | 'chapter' | 'responsory' | 'versicle' | 'antiphon' | 'benedictus' | 'magnificat' | 'lectio' | 'invitatory' | 'collect';

const FILE_PART: Record<PartKind, string> = {
  collect: 'collect',
  lectio: 'lectio',
  invitatory: 'invitatory',
  benedictus: 'benedictus-antiphon',
  magnificat: 'magnificat-antiphon',
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
  /** The calendar date the hour belongs to when it isn't `day.date` (an
   * evening that anticipates tomorrow's First Vespers), for date overrides. */
  date?: string;
  /** Inline default text (not a file) for a non-saint winner when nothing is
   * authored: the ferial Magnificat antiphons, the weekday antiphons. */
  fallback?: () => ResolvedText | undefined;
  /** The slot falls to the season's text for a saint too, not only for a
   * ferial day (Prime's short reading: the time's own when the feast has none). */
  seasonalForSaints?: boolean;
  /** Look up for this feast instead of the day's winner: a commemoration
   * takes its own feast's text (at Vespers, of the commemorated evening). */
  winner?: DayWinner;
  /** A further file tried before each base file (`<id>-<suffix>`): the
   * Vespers collect some Lent days have of their own. */
  suffix?: string;
}

/** Texts that win a slot on a calendar date whoever wins the day: key is
 * `${hour}.${part}`, then `MM-DD`. The seven O Antiphons win the Vespers
 * Magnificat on Dec 17-23 even where a saint wins the rest of the day. */
export interface DateOverride {
  antiphon: Partial<Record<string, string>>;
  status?: Partial<Record<string, 'verified' | 'draft' | 'missing'>>;
}
const DATE_OVERRIDES: Record<string, Partial<Record<string, DateOverride>>> = {
  'vespers.magnificat': vespersOAntiphonsData as Partial<Record<string, DateOverride>>,
};

const MISSING: ResolvedText = { text: {}, status: { la: 'missing', en: 'missing' } };

function isReal(t: ResolvedText): boolean {
  return t.status.la !== 'missing' || t.status.en !== 'missing';
}

/** The winner-keyed ids to try: the feast's own (and its shared office's),
 * then its Common's. */
function winnerIds(day: LiturgicalDay, winner?: DayWinner): { proper: string[]; common: string[] } {
  const overrideId = winner ? winner.id : getMinorHourOverrideId(day);
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
export function isAbsentByDesign(day: LiturgicalDay, hour: HourId, part: PartKind, given?: DayWinner): boolean {
  const winner = given ?? resolveOfficeWinner(day);
  const noParts =
    winner.kind === 'sanctoral' ? getSaintRecord(winner.id)?.noParts : getTemporalFeastRecord(winner.id)?.noParts;
  return !!noParts?.includes(`${hour}-${FILE_PART[part]}`);
}

/** Where a looked-up text came from: the feast's own file (or its shared
 * office's, or a temporal octave's), the antiphon derived from its Lauds set,
 * its Common's file, or the hour's temporal key. `paschalFile` is true when
 * the text is a Paschaltide variant file, which needs no further Alleluia. */
export type PartTier = 'dated' | 'proper' | 'derived' | 'common' | 'temporal' | 'fallback';

export interface FoundPart {
  text: ResolvedText;
  tier: PartTier;
  paschalFile: boolean;
}

export function lookupPart(request: PartRequest): ResolvedText {
  return lookupPartTiered(request)?.text ?? MISSING;
}

/** `isFeast`: a saint (other than a Vigil) never takes the weekday's text. */
export function isFeastWinner(day: LiturgicalDay, given?: DayWinner): boolean {
  const winner = given ?? resolveOfficeWinner(day);
  return winner.kind === 'sanctoral' && winner.rank !== 'vigil';
}

export function lookupPartTiered({ day, hour, part, temporalKeys, variant, ignoreWinner, date, fallback, seasonalForSaints, winner, suffix }: PartRequest): FoundPart | undefined {
  if (!ignoreWinner && isAbsentByDesign(day, hour, part, winner)) {
    return undefined;
  }
  // A date override is the day's own slot; a commemoration keeps its feast's.
  const override = winner ? undefined : DATE_OVERRIDES[`${hour}.${part}`]?.[(date ?? day.date).slice(5)];
  if (override) {
    const text = override.status
      ? { text: override.antiphon, status: override.status as ResolvedText['status'] }
      : verifiedText(override.antiphon);
    return { text, tier: 'dated', paschalFile: false };
  }
  // The Paschaltide Second Vespers file of a Magnificat antiphon exists only
  // for Second Vespers.
  const paschal = PASCHALTIDE_SEASONS.has(day.season) && !(part === 'magnificat' && variant === 'first');
  const sibling = WINNER_SIBLING_HOUR[hour]?.[part];
  const find = (h: HourId, id: string, tier: PartTier): FoundPart | undefined => {
    const prefix = part === 'benedictus' || part === 'magnificat' || part === 'collect' ? `${FILE_PART[part]}-` : `${h}-${FILE_PART[part]}-`;
    // An octave's interior days can carry their own text (`<id>-d<N>`).
    const octaveDay = activeOctavesFor(day.date).find((o) => o.id === id && o.dayNumber >= 2);
    const candidates = [
      octaveDay ? `${id}-d${octaveDay.dayNumber}` : undefined,
      paschal ? `${id}-paschaltide` : undefined,
      variant ? `${id}-${variant}` : undefined,
      suffix ? `${id}-${suffix}` : undefined,
      id,
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const text = resolveCommon(prefix + candidate);
      if (isReal(text)) {
        return { text, tier, paschalFile: candidate.endsWith('-paschaltide') || /-d\d+$/.test(candidate) };
      }
    }
    return undefined;
  };
  const ids = ignoreWinner ? { proper: [], common: [] } : winnerIds(day, winner);
  // A temporal-only octave supplies its hymn alone: the Sunday within it
  // keeps its own chapter, responsory and versicle (Ascension's octave
  // Sunday's chapter genuinely differs from Ascension Day's).
  const octave = part === 'hymn' || part === 'invitatory' ? resolveActiveOctave(day.date) : undefined;
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
  // a cue to borrow the weekday's text. The responsory is the exception: the
  // monastic Lauds/Vespers responsory is the day's ordinary one whenever the
  // feast supplies none (proper, then Common, then ferial).
  for (const key of isFeastWinner(day, winner) && !ignoreWinner && !seasonalForSaints && part !== 'responsory' ? [] : temporalKeys) {
    const found = find(hour, key, 'temporal');
    if (found) {
      return found;
    }
  }
  const inline = isFeastWinner(day, winner) && !ignoreWinner ? undefined : fallback?.();
  return inline && isReal(inline) ? { text: inline, tier: 'fallback', paschalFile: false } : undefined;
}
