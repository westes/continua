import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveEveningDay } from '../calendar/vespers';
import { weekdayOf } from '../calendar/weekday';
import { resolveDay } from '../calendar';
import { lookupPart } from './resolve-part';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getOpeningVersicleId } from './opening-versicle';
import { isInTriduum, easterOffsetOf } from '../calendar/temporal';
import { getHymnDoxologyOverrideId } from './hymn-doxology';
import { getVespersSaintOverride, getVespersCommonOverride } from './vespers-psalmody-overrides';
import { applyFlexaMark } from './antiphon';
import { paschalizeAntiphon, paschalizeResponsory, paschalizeVersicle, usesAlleluiaDismissal } from './paschal-alleluia';
import {
  isSeasonalProperSunday,
  resolveCommon,
  substituteDoxology,
  getDayCollects,
  getMagnificatAntiphon,
  splitNamedAntiphon,
  openingAntiphon,
  resolveOfficeWinner,
  verifiedText,
  seasonalOfficeSuffix,
  isFerialOrVigil,
  getPsalmodyProperOverrideId,
  getPsalmodyNumbersOverrideId,
  resolveResponsory,
  resolveOfficeBundle,
  withVespersVariant,
  type VespersVariant,
  resolveSuffrages,
  isPaschaltide,
  overlayProperAntiphons,
} from './resolve-common';
import { isAllSouls, buildVespersParts } from './all-souls';
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
  const antiphonText = verifiedText(isPaschaltide(day.season) ? paschalizeAntiphon(group.antiphon) : group.antiphon);
  const opening = openingAntiphon(antiphonText, resolveOfficeWinner(day));
  const { full } = splitNamedAntiphon(antiphonText);
  const refs = group.psalms.map(normalizePsalmRef);
  const parts: ResolvedPart[] = refs.map((ref, i) => {
    const rawVerses = getPsalmVerses(ref.number, ref.verses).map((v) => ({ n: v.n, text: v.text, status: v.status }));
    const { verses, antiphon } = applyFlexaMark(rawVerses, i === 0 ? opening : undefined);
    return {
      kind: 'psalm' as const,
      psalmNumber: ref.number,
      antiphon,
      verses,
      verseRange: ref.verses,
    };
  });
  parts.push({ kind: 'antiphon', text: full });
  return parts;
}

/** Two independent tiers, tried in order — same split as hours/lauds.ts's
 * own getPsalmodyOverrideFor, see its doc comment for the full rationale.
 * Substitutes psalm *numbers*, not just antiphons, so only applies when
 * resolve-common.ts's getPsalmodyNumbersOverrideId says the day is
 * eligible (duplex-majus+, octave-aware) — see resolvePsalmody below for
 * the sub-threshold case, which merges tier 1's antiphons onto the ferial
 * numbers instead of calling this at all:
 *
 * 1. **Proper** — this feast's (or, on an octave day, that octave's own
 *    governing saint's) authored psalmody, via getVespersSaintOverride.
 * 2. **Common category** — per hours/vespers-psalmody-overrides.ts's own
 *    doc comment, genuinely per-Common here (the psalm *numbers*
 *    themselves differ by Common, not just the antiphons, unlike Lauds)
 *    — via getVespersCommonOverride.
 *
 * Eligibility follows the evening's governing `day` — a First Vespers of a
 * feast should get that feast's own psalms, same as it gets that feast's
 * own office. Falls back to `undefined` for an eligible feast with no
 * override authored in either tier, same honest incremental-content
 * convention as everywhere else. */
function getPsalmodyOverrideFor(day: LiturgicalDay, variant: VespersVariant): VespersDay | undefined {
  const id = getPsalmodyNumbersOverrideId(day);
  if (!id) {
    return undefined;
  }
  return getVespersSaintOverride(id, variant) ?? getVespersCommonOverride(id, isPaschaltide(day.season), variant);
}

/** Below duplex-majus, mirrors hours/lauds.ts's identical
 * mergeFerialNumbersWithProperAntiphons — real proper psalm numbers stay
 * gated at duplex-majus+, but real antiphon text (proper when authored,
 * else the saint's Common-category antiphons — same two tiers
 * getPsalmodyOverrideFor uses above) is still layered onto the ferial
 * numbers, paired by index against `ferial`'s own groups (extra `proper`
 * groups beyond `ferial`'s count go unused — same confirmed convention as
 * Lauds). */
function mergeFerialNumbersWithProperAntiphons(ferial: VespersDay, proper: VespersDay): VespersDay {
  return { groups: overlayProperAntiphons(ferial.groups, proper.groups) };
}

/** The 4 weekday-variable psalm groups — no fixed leading/trailing psalm
 * the way Lauds has (Ps 66 / the Laudate psalms); Vespers is just these 4
 * groups in sequence, substituted wholesale by getPsalmodyOverrideFor
 * above when eligible. Deliberately keyed off `weekday` (today's actual
 * calendar weekday), not `day.weekday`, for the plain-ferial-fallback
 * case — `day` may be tomorrow's identity when tonight anticipates First
 * Vespers (see resolveEveningDay), but the ferial psalm cycle has no
 * per-feast override of its own and must stay on today's place in the
 * fixed 6-day rotation regardless of whose office governs the evening's
 * propers. `day` is still threaded into psalmParts for antiphon-fullness
 * resolution, which does care who governs tonight. */
function resolvePsalmody(day: LiturgicalDay, weekday: Weekday, variant: VespersVariant): ResolvedPart[] {
  const ferial = vespersAntiphons[weekday];
  let wd: VespersDay;
  if (getPsalmodyNumbersOverrideId(day) && !(variant === 'first' && day.weekday === 'sunday' && weekday === 'saturday' && isSeasonalProperSunday(day))) {
    wd = getPsalmodyOverrideFor(day, variant) ?? ferial;
  } else {
    const properId = getPsalmodyProperOverrideId(day);
    const proper = properId
      ? (getVespersSaintOverride(properId, variant) ?? getVespersCommonOverride(properId, isPaschaltide(day.season), variant))
      : undefined;
    wd = proper ? mergeFerialNumbersWithProperAntiphons(ferial, proper) : ferial;
  }
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
function vespersCapitulumForOverride(id: string, variant?: VespersVariant): ResolvedText {
  const proper = withVespersVariant(`vespers-capitulum-${id}`, variant, resolveCommon(`vespers-capitulum-${id}`));
  if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
    return proper;
  }
  return resolveCommon(`lauds-capitulum-${id}`);
}

/** The chapter/responsory/hymn/versicle bundle following the psalmody —
 * see hours/types.ts's 'vespers-office' doc comment. Any sanctoral
 * winner's (or named-temporal feast's) own proper bundle (chapter via
 * vespersCapitulumForOverride above, responsory/hymn/versicle via
 * `vespers-{part}-${id}`), else their Common's bundle, wins first when
 * authored — resolve-common.ts's resolveOfficeBundle, deliberately
 * rank-agnostic (2026-08-25: matches Lauds' identical change, ditto for
 * the same reason — a simplex feast's Common office is real content),
 * not gated at duplex-majus+ the way this hour's lack of its own
 * psalmody-override table might otherwise suggest (Vespers has no
 * per-feast psalmody override mechanism — see TODO.md; that's unrelated
 * to this bundle's own eligibility). Falls to a *seasonal* default next
 * (Advent/Lent/Passiontide/Paschaltide — see resolve-common.ts's
 * seasonalOfficeSuffix), and only then the plain weekday default — a
 * feast's own override always wins over the season it happens to fall
 * in, same as everywhere else in this codebase. */
function resolveOffice(day: LiturgicalDay, weekday: Weekday, variant: VespersVariant): ResolvedPart[] {
  const parts = resolveOfficeParts(day, weekday, variant);
  if (!isPaschaltide(day.season)) return parts;
  return parts.map((p) =>
    p.kind === 'responsory'
      ? { ...p, text: paschalizeResponsory(p.text) }
      : p.kind === 'versicle'
        ? { ...p, text: paschalizeVersicle(p.text) }
        : p,
  );
}

function resolveOfficeParts(day: LiturgicalDay, weekday: Weekday, variant: VespersVariant): ResolvedPart[] {
  const hymnDoxologyOverrideId = getHymnDoxologyOverrideId(day);
  const hymnDoxologyOverride = hymnDoxologyOverrideId ? resolveCommon(hymnDoxologyOverrideId) : undefined;
  // First Vespers of a Sunday is said on Saturday evening: the engine takes
  // the Saturday's own (or the season's) responsory, hymn and versicle there,
  // with only the Magnificat -- and, for the seasonal Sundays with a proper
  // chapter, the chapter -- belonging to the Sunday.
  const saturdayEvening = variant === 'first' && day.weekday === 'sunday' && weekday === 'saturday';
  const seasonalSunday = isSeasonalProperSunday(day);
  const seasonSuffix = seasonalOfficeSuffix(day.season);
  const officeWeekday = saturdayEvening ? weekday : day.weekday;
  const key = seasonSuffix ?? officeWeekday;
  // First Vespers of a seasonal proper Sunday takes the Saturday's own (or
  // the season's) hymn, not the Sunday's.
  const hymn = substituteDoxology(
    lookupPart({ day, hour: 'vespers', part: 'hymn', temporalKeys: [key], variant, ignoreWinner: saturdayEvening && seasonalSunday }),
    hymnDoxologyOverride,
  );
  const bundle = saturdayEvening && seasonalSunday ? undefined : resolveOfficeBundle('vespers', day, (id) => vespersCapitulumForOverride(id, variant), variant);
  if (bundle) {
    const parts: ResolvedPart[] = [{ kind: 'chapter', text: bundle.chapter }];
    // The Sacred Heart's own Vespers genuinely has no responsory at all in
    // the source, same as its own Lauds — see lauds.ts's identical check.
    if (bundle.responsory.status.la !== 'missing' || bundle.responsory.status.en !== 'missing') {
      parts.push({ kind: 'responsory', text: bundle.responsory });
    }
    parts.push(
      { kind: 'hymn', text: hymn },
      { kind: 'versicle', text: bundle.versicle },
    );
    return parts;
  }
  const ownChapter = saturdayEvening && seasonalSunday ? vespersCapitulumForOverride(day.winner.id, variant) : undefined;
  const chapter =
    ownChapter && (ownChapter.status.la !== 'missing' || ownChapter.status.en !== 'missing')
      ? ownChapter
      : resolveCommon(seasonSuffix ? `vespers-capitulum-${key}` : vespersCapitulumId(officeWeekday));
  return [
    { kind: 'chapter', text: chapter },
    {
      kind: 'responsory',
      text: resolveResponsory(resolveCommon(seasonSuffix ? `vespers-responsory-${key}` : vespersResponsoryId(officeWeekday)), day),
    },
    { kind: 'hymn', text: hymn },
    {
      kind: 'versicle',
      text: resolveCommon(seasonSuffix ? `vespers-versicle-${key}` : vespersVersicleId(officeWeekday)),
    },
  ];
}

function resolvePart(part: HourPart, day: LiturgicalDay, weekday: Weekday, variant: VespersVariant, date: string): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      // Real Tenebrae/Triduum rubric: this versicle's own baked-in Gloria
      // Patri means the whole thing is dropped, not seasonally varied —
      // same as matins.ts's opening block and compline.ts's own versicle.
      // `day` here is already resolveEveningDay's possibly-anticipated
      // identity, so Holy Saturday evening (already Easter's own First
      // Vespers) correctly keeps it rather than being wrongly suppressed.
      if (isInTriduum(day.date)) {
        return [];
      }
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day)) }];
    case 'vespers-psalmody':
      return resolvePsalmody(day, weekday, variant);
    case 'vespers-office':
      return resolveOffice(day, weekday, variant);
    case 'magnificat': {
      const antiphonText = getMagnificatAntiphon(day, variant, date);
      const opening = openingAntiphon(antiphonText, resolveOfficeWinner(day));
      const { full } = splitNamedAntiphon(antiphonText);
      return [
        { kind: 'canticle', canticleId: 'magnificat', text: resolveCommon('magnificat'), antiphon: opening },
        { kind: 'antiphon', text: full },
      ];
    }
    case 'vespers-preces': {
      // Throughout Paschaltide, the whole ferial-Preces litany drops
      // entirely rather than being replaced by anything — see lauds.ts's
      // identical 'lauds-preces' case for the live-verification detail.
      if (isFerialOrVigil(day) && isPaschaltide(day.season)) {
        return [];
      }
      const id = isFerialOrVigil(day) ? 'vespers-preces-feriales' : 'lauds-short-litany';
      return [{ kind: 'preces', text: resolveCommon(id) }];
    }
    case 'day-collects':
      return getDayCollects(day, 'vespers');
    case 'suffrages':
      return resolveSuffrages(day, part.omitOnDouble, 'vespers');
    case 'preces': {
      const id =
        part.textRef.id === 'lauds-conclusio' && usesAlleluiaDismissal('vespers', date, day.date)
          ? 'lauds-conclusio-alleluia'
          : part.textRef.id;
      return [{ kind: 'preces', text: resolveCommon(id), label: part.label }];
    }
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
    case 'lauds-preces':
    case 'marian-antiphon':
      throw new Error(`Vespers' ordo doesn't support a '${part.kind}' part`);
  }
}

/** Holy Saturday evening (engine: "Sabbato Sancto special Paschal Vespera"):
 * a single psalm (116) under a triple Alleluia, the Magnificat, the Easter
 * postcommunion as collect, and the double-Alleluia dismissal -- no opening
 * versicle, chapter, hymn, responsory, versicle, Preces or suffrages. */
function holySaturdayVespersParts(day: LiturgicalDay): ResolvedPart[] {
  const magnificat = resolveCommon('holy-saturday-vespers-magnificat-antiphon');
  const opening = openingAntiphon(magnificat, resolveOfficeWinner(day));
  const { full } = splitNamedAntiphon(magnificat);
  return [
    ...psalmParts({ psalms: [116], antiphon: resolveCommon('holy-saturday-vespers-antiphon').text }, day),
    { kind: 'canticle', canticleId: 'magnificat', text: resolveCommon('magnificat'), antiphon: opening },
    { kind: 'antiphon', text: full },
    { kind: 'preces', text: resolveCommon('holy-saturday-vespers-exaudi') },
    { kind: 'prayer', text: resolveCommon('holy-saturday-vespers-collect') },
    { kind: 'preces', text: resolveCommon('lauds-conclusio-alleluia') },
  ];
}

/** Maundy Thursday / Good Friday Vespers: engine omits the chapter,
 * responsory, hymn and versicle ("omittitur"), the Preces, the commemoration
 * and suffrages, and the closing versicles; what remains is the psalmody,
 * the Magnificat and the day's own silent-ending collect. */
function triduumVespersParts(parts: ResolvedPart[]): ResolvedPart[] {
  const drop = new Set(['chapter', 'responsory', 'hymn', 'versicle', 'preces']);
  const kept = parts.filter((p) => !drop.has(p.kind));
  const firstPrayer = kept.findIndex((p) => p.kind === 'prayer');
  return kept.filter((p, i) => p.kind !== 'prayer' || i === firstPrayer);
}

export function resolveOrdo(date: string): ResolvedOrdo {
  // Only Nov 2's own (Second) Vespers is the Office of the Dead — Nov 1
  // evening stays First Vespers of All Saints unaffected (per user
  // instruction: All Souls' Day has no First Vespers of its own; keyed on
  // `date` itself, not resolveEveningDay's possibly-anticipated identity,
  // since there's no "tomorrow anticipates All Souls" case to handle).
  if (isAllSouls(date)) {
    return { hourId: 'vespers', date, parts: buildVespersParts(date), dayLabel: getDayLabel(resolveDay(date)) };
  }
  // Every part below is an evening-hour concern, same reasoning as
  // Compline — resolves off whichever day's identity actually governs
  // tonight, including the cross-day commemoration folded into
  // day.commemorations by resolveEveningDay itself (see calendar/
  // vespers.ts) — getDayCollects picks that up for free, no special
  // handling needed here.
  const day = resolveEveningDay(date);
  // Today's own weekday, independent of the possibly-anticipated `day`
  // above — see resolvePsalmody's doc comment for why psalm selection
  // must not follow the evening's borrowed identity.
  const weekday = weekdayOf(date);
  // `day` is tomorrow's identity exactly when tonight anticipates its
  // First Vespers (resolveEveningDay), today's own otherwise -- so a date
  // mismatch is the one reliable test, covering temporal feasts too (the
  // `winner.vespersFrom` tag is only ever set on sanctoral winners).
  const variant: VespersVariant = day.date === date ? 'second' : 'first';
  const offset = easterOffsetOf(date);
  if (offset === -1) {
    return { hourId: 'vespers', date, parts: holySaturdayVespersParts(day), dayLabel: getDayLabel(day) };
  }
  const parts = vespersDefinition.parts.flatMap((part) => resolvePart(part, day, weekday, variant, date));
  if (offset === -2 || offset === -3) {
    return { hourId: 'vespers', date, parts: triduumVespersParts(parts), dayLabel: getDayLabel(day) };
  }
  return { hourId: 'vespers', date, parts, dayLabel: getDayLabel(day) };
}
