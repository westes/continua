import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveEveningDay } from '../calendar/vespers';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getOpeningVersicleId } from './opening-versicle';
import { isDoubleOrHigher } from './antiphon';
import {
  resolveCommon,
  getDayCollects,
  getMagnificatAntiphon,
  splitNamedAntiphon,
  resolveOfficeWinner,
  verifiedText,
  seasonalOfficeSuffix,
  isFerialOrVigil,
  getOfficeOverrideId,
} from './resolve-common';
import vespersDefinitionData from '../data/hours/vespers.yml';
import vespersAntiphonsData from '../data/hours/vespers-antiphons.yml';

const vespersDefinition = vespersDefinitionData as HourDefinition;

type BilingualText = Partial<Record<string, string>>;
/** A whole psalm, or a `{number, verses}` verse-range slice of one — same
 * shape as psalter/distribution.ts's PsalmRef, needed here (unlike Lauds'
 * plain `psalms: number[]`) because two of the week's groups split a
 * single psalm into two ranges under one shared antiphon — see
 * vespers-antiphons.yml's own header. */
type PsalmRefLike = number | { number: number; verses?: string };
interface VespersGroup {
  psalms: PsalmRefLike[];
  antiphon: BilingualText;
}
interface VespersDay {
  groups: VespersGroup[];
}
const vespersAntiphons = vespersAntiphonsData as Record<Weekday, VespersDay>;

function normalizePsalmRef(ref: PsalmRefLike): { number: number; verses?: string } {
  return typeof ref === 'number' ? { number: ref } : ref;
}

/** One group's worth of psalm(s) under one shared antiphon — the antiphon
 * opens (incipit-or-full) before the first psalm/verse-range and repeats
 * in full once, after the last. Mirrors lauds.ts's psalmParts, extended
 * for verse-range entries (see PsalmRefLike). */
function psalmParts(group: VespersGroup, day: LiturgicalDay): ResolvedPart[] {
  const { incipit, full } = splitNamedAntiphon(verifiedText(group.antiphon));
  const opening = isDoubleOrHigher(resolveOfficeWinner(day)) ? full : incipit;
  const refs = group.psalms.map(normalizePsalmRef);
  const parts: ResolvedPart[] = refs.map((ref, i) => ({
    kind: 'psalm' as const,
    psalmNumber: ref.number,
    antiphon: i === 0 ? opening : undefined,
    verses: getPsalmVerses(ref.number, ref.verses).map((v) => ({ n: v.n, text: v.text, status: v.status })),
  }));
  parts.push({ kind: 'antiphon', text: full });
  return parts;
}

/** The 4 weekday-variable psalm groups — no fixed leading/trailing psalm
 * the way Lauds has (Ps 66 / the Laudate psalms); Vespers is just these 4
 * groups in sequence. No per-feast override mechanism yet — see
 * hours/types.ts's 'vespers-psalmody' doc comment. */
function resolvePsalmody(day: LiturgicalDay): ResolvedPart[] {
  const wd = vespersAntiphons[day.weekday];
  return wd.groups.flatMap((group) => psalmParts(group, day));
}

function vespersCapitulumId(weekday: Weekday): string {
  return weekday === 'saturday' ? 'vespers-capitulum-saturday' : 'vespers-capitulum-sunday-ferial';
}

function vespersResponsoryId(weekday: Weekday): string {
  if (weekday === 'sunday') return 'vespers-responsory-sunday';
  if (weekday === 'saturday') return 'vespers-responsory-saturday';
  return 'vespers-responsory-ferial';
}

function vespersVersicleId(weekday: Weekday): string {
  return weekday === 'saturday' ? 'vespers-versicle-saturday' : 'vespers-versicle-sunday-ferial';
}

/** A per-feast override's chapter: `vespers-capitulum-${id}` when
 * authored, else the already-authored `lauds-capitulum-${id}` directly —
 * live-verified across all 30 duplex-majus+ saints/named-temporal ids
 * with a Vespers office override (2026-08 sweep, `command=prayVespera`,
 * each saint's own already-established clean date): the capitulum is
 * byte-identical between Lauds and Vespers for every one of them, a real
 * Monastic-rite fact (the reading doesn't change between the two hours,
 * only the responsory/hymn/versicle do), not a coincidence specific to
 * the ones checked. So no `vespers-capitulum-<id>.yml` files were
 * authored at all — this falls straight through to the Lauds one instead
 * of duplicating identical content into a second file per id. */
function vespersCapitulumForOverride(id: string): ResolvedText {
  const proper = resolveCommon(`vespers-capitulum-${id}`);
  if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
    return proper;
  }
  return resolveCommon(`lauds-capitulum-${id}`);
}

/** The chapter/responsory/hymn/versicle bundle following the psalmody —
 * see hours/types.ts's 'vespers-office' doc comment. A duplex-majus+
 * saint's own proper bundle (chapter via vespersCapitulumForOverride
 * above, responsory/hymn/versicle via `vespers-{part}-${id}`), or one of
 * the named temporal feasts eligible via resolve-common.ts's
 * getOfficeOverrideId, wins first when authored — same eligible-but-not-
 * gated-on-content pattern as Lauds' resolveOffice, just without a
 * psalmody-override table of its own to piggyback eligibility on
 * (Vespers has no per-feast psalmody override mechanism — see TODO.md).
 * Falls to a *seasonal* default next (Advent/Lent/Passiontide/
 * Paschaltide — see resolve-common.ts's seasonalOfficeSuffix), and only
 * then the plain weekday default — a feast's own override always wins
 * over the season it happens to fall in, same as everywhere else in this
 * codebase. */
function resolveOffice(day: LiturgicalDay): ResolvedPart[] {
  const overrideId = getOfficeOverrideId(day);
  if (overrideId) {
    const chapter = vespersCapitulumForOverride(overrideId);
    if (chapter.status.la !== 'missing' || chapter.status.en !== 'missing') {
      return [
        { kind: 'chapter', text: chapter },
        { kind: 'responsory', text: resolveCommon(`vespers-responsory-${overrideId}`) },
        { kind: 'hymn', text: resolveCommon(`vespers-hymn-${overrideId}`) },
        { kind: 'versicle', text: resolveCommon(`vespers-versicle-${overrideId}`) },
      ];
    }
  }
  const seasonSuffix = seasonalOfficeSuffix(day.season);
  const key = seasonSuffix ?? day.weekday;
  return [
    {
      kind: 'chapter',
      text: resolveCommon(seasonSuffix ? `vespers-capitulum-${key}` : vespersCapitulumId(day.weekday)),
    },
    {
      kind: 'responsory',
      text: resolveCommon(seasonSuffix ? `vespers-responsory-${key}` : vespersResponsoryId(day.weekday)),
    },
    { kind: 'hymn', text: resolveCommon(`vespers-hymn-${key}`) },
    {
      kind: 'versicle',
      text: resolveCommon(seasonSuffix ? `vespers-versicle-${key}` : vespersVersicleId(day.weekday)),
    },
  ];
}

function resolvePart(part: HourPart, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) }];
    case 'vespers-psalmody':
      return resolvePsalmody(day);
    case 'vespers-office':
      return resolveOffice(day);
    case 'magnificat': {
      const { incipit, full } = splitNamedAntiphon(getMagnificatAntiphon(day));
      const opening = isDoubleOrHigher(resolveOfficeWinner(day)) ? full : incipit;
      return [
        { kind: 'canticle', canticleId: 'magnificat', text: resolveCommon('magnificat'), antiphon: opening },
        { kind: 'antiphon', text: full },
      ];
    }
    case 'vespers-preces': {
      const id = isFerialOrVigil(day) ? 'vespers-preces-feriales' : 'lauds-short-litany';
      return [{ kind: 'preces', text: resolveCommon(id) }];
    }
    case 'day-collects':
      return getDayCollects(day);
    case 'preces':
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'versicle':
    case 'chapter':
    case 'responsory':
    case 'prayer':
      return [{ kind: part.kind, text: resolveCommon(part.textRef.id) }];
    // Not used by Vespers.
    case 'hymn':
    case 'lesson':
    case 'psalm':
    case 'canticle':
    case 'martyrology':
    case 'rule-reading':
    case 'creed':
    case 'closing-antiphon':
    case 'by-day-kind':
    case 'variable':
    case 'day-collect':
    case 'nunc-dimittis':
    case 'lauds-psalmody':
    case 'lauds-office':
    case 'benedictus':
    case 'suffrages':
    case 'lauds-preces':
    case 'marian-antiphon':
      throw new Error(`Vespers' ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  // Every part below is an evening-hour concern, same reasoning as
  // Compline — resolves off whichever day's identity actually governs
  // tonight, including the cross-day commemoration folded into
  // day.commemorations by resolveEveningDay itself (see calendar/
  // vespers.ts) — getDayCollects picks that up for free, no special
  // handling needed here.
  const day = resolveEveningDay(date);
  const parts = vespersDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'vespers', date, parts, dayLabel: getDayLabel(day) };
}
