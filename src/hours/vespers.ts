import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveEveningDay } from '../calendar/vespers';
import { weekdayOf } from '../calendar/weekday';
import { resolveActiveOctave, resolveDay } from '../calendar';
import { getSaintRecord } from '../calendar/feasts';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getOpeningVersicleId } from './opening-versicle';
import { getHymnDoxologyId } from './hymn-doxology';
import { getVespersSaintOverride, getVespersCommonOverride } from './vespers-psalmody-overrides';
import { applyFlexaMark } from './antiphon';
import {
  resolveCommon,
  appendDoxology,
  getDayCollects,
  getMagnificatAntiphon,
  splitNamedAntiphon,
  openingAntiphon,
  resolveOfficeWinner,
  verifiedText,
  seasonalOfficeSuffix,
  isFerialOrVigil,
  getOfficeOverrideId,
  getPsalmodyProperOverrideId,
  resolveResponsory,
  resolveOfficeBundle,
  resolveSuffrages,
  isPaschaltide,
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
  const antiphonText = verifiedText(group.antiphon);
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
 * Substitutes psalm *numbers*, not just antiphons, so only applies for a
 * duplex-majus+ (or named-temporal) feast — see resolvePsalmody below for
 * the sub-duplex-majus case, which merges tier 1's antiphons onto the
 * ferial numbers instead of calling this at all:
 *
 * 1. **Proper** — this feast's own authored psalmody, via resolve-
 *    common.ts's getPsalmodyProperOverrideId.
 * 2. **Common category** — per hours/vespers-psalmody-overrides.ts's own
 *    doc comment, genuinely per-Common here (the psalm *numbers*
 *    themselves differ by Common, not just the antiphons, unlike Lauds)
 *    — gated at duplex-majus+ via getOfficeOverrideId.
 *
 * Eligibility follows the evening's governing `day` (same
 * resolveOfficeWinner-based test as the chapter/responsory/hymn/versicle
 * bundle below) — a First Vespers of a feast should get that feast's own
 * psalms, same as it gets that feast's own office. Falls back to
 * `undefined` for an eligible feast with no override authored in either
 * tier, same honest incremental-content convention as everywhere else. */
function getPsalmodyOverrideFor(day: LiturgicalDay): VespersDay | undefined {
  const properId = getPsalmodyProperOverrideId(day);
  const proper = properId ? getVespersSaintOverride(properId) : undefined;
  if (proper) {
    return proper;
  }
  const categoryId = getOfficeOverrideId(day);
  return categoryId ? getVespersCommonOverride(categoryId) : undefined;
}

/** Below duplex-majus, mirrors hours/lauds.ts's identical
 * mergeFerialNumbersWithProperAntiphons — real proper psalm numbers stay
 * gated at duplex-majus+, but a saint's own authored antiphon text is
 * still layered onto the ferial numbers when authored, paired by index
 * against `ferial`'s own groups (extra `proper` groups beyond `ferial`'s
 * count go unused — same confirmed convention as Lauds). */
function mergeFerialNumbersWithProperAntiphons(ferial: VespersDay, proper: VespersDay): VespersDay {
  return {
    groups: ferial.groups.map((g, i) => ({ psalms: g.psalms, antiphon: proper.groups[i]?.antiphon ?? g.antiphon })),
  };
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
function resolvePsalmody(day: LiturgicalDay, weekday: Weekday): ResolvedPart[] {
  const ferial = vespersAntiphons[weekday];
  let wd: VespersDay;
  if (getOfficeOverrideId(day)) {
    wd = getPsalmodyOverrideFor(day) ?? ferial;
  } else {
    const properId = getPsalmodyProperOverrideId(day);
    const proper = properId ? getVespersSaintOverride(properId) : undefined;
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
function vespersCapitulumForOverride(id: string): ResolvedText {
  const proper = resolveCommon(`vespers-capitulum-${id}`);
  if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
    return proper;
  }
  return resolveCommon(`lauds-capitulum-${id}`);
}

/**
 * Every plain-default Vespers hymn's own closing doxology stanza (split
 * out into `vespers-hymn-${key}-doxology-per-annum.yml`) is re-attached
 * here through the seasonal mechanism (hours/hymn-doxology.ts) — Sunday's
 * hymn ("Lucis Creator") is the one case in Lauds/Vespers/Matins' whole
 * weekday-default set whose Monastic source text carries a real "*"
 * seasonal-substitution marker (live-checked 2026-09-03), but every other
 * key is wired the same way anyway as a deliberate broadening beyond the
 * source: this project isn't a reconstruction (see the repo's CLAUDE.md),
 * and the doxology is a natural, low-cost way to keep every hour visibly
 * in step with the season — e.g. the plain weekday hymns used all through
 * Christmastide/Epiphanytide/Corpus Christi/Sacred Heart (no
 * `seasonalOfficeSuffix` covers those) previously stayed on their generic
 * per-annum ending throughout. Each key's own natural ending is preserved
 * as its per-annum default, so a season/feast with no override (e.g.
 * Advent, Lent — the source itself never swaps those) reproduces the
 * exact original text. See lauds.ts's identical resolveLaudsHymn. */
function resolveVespersHymn(day: LiturgicalDay, key: string): ResolvedText {
  // A temporal-feast-only octave (Ascension's own) still needs its own
  // hymn recognized directly here, bypassing octaveGoverningPrivilegedDay's
  // privileged-Sunday gate — see lauds.ts's identical resolveLaudsHymn for
  // the full story. Guarded to saint-less octaves only: a saint-based
  // octave (Assumption's, St. Lawrence's) already reaches its own content
  // through resolveOfficeWinner's existing synthesis without this.
  const octave = resolveActiveOctave(day.date);
  if (octave && !getSaintRecord(octave.id)) {
    const octaveHymn = resolveCommon(`vespers-hymn-${octave.id}`);
    if (octaveHymn.status.la !== 'missing' || octaveHymn.status.en !== 'missing') {
      return octaveHymn;
    }
  }
  const body = resolveCommon(`vespers-hymn-${key}`);
  const doxology = resolveCommon(getHymnDoxologyId(day, `vespers-hymn-${key}-doxology-per-annum`));
  return appendDoxology(body, doxology);
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
function resolveOffice(day: LiturgicalDay): ResolvedPart[] {
  const bundle = resolveOfficeBundle('vespers', day, vespersCapitulumForOverride);
  if (bundle) {
    const parts: ResolvedPart[] = [{ kind: 'chapter', text: bundle.chapter }];
    // The Sacred Heart's own Vespers genuinely has no responsory at all in
    // the source, same as its own Lauds — see lauds.ts's identical check.
    if (bundle.responsory.status.la !== 'missing' || bundle.responsory.status.en !== 'missing') {
      parts.push({ kind: 'responsory', text: bundle.responsory });
    }
    parts.push({ kind: 'hymn', text: bundle.hymn }, { kind: 'versicle', text: bundle.versicle });
    return parts;
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
      text: resolveResponsory(resolveCommon(seasonSuffix ? `vespers-responsory-${key}` : vespersResponsoryId(day.weekday)), day),
    },
    { kind: 'hymn', text: resolveVespersHymn(day, key) },
    {
      kind: 'versicle',
      text: resolveCommon(seasonSuffix ? `vespers-versicle-${key}` : vespersVersicleId(day.weekday)),
    },
  ];
}

function resolvePart(part: HourPart, day: LiturgicalDay, weekday: Weekday): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) }];
    case 'vespers-psalmody':
      return resolvePsalmody(day, weekday);
    case 'vespers-office':
      return resolveOffice(day);
    case 'magnificat': {
      const antiphonText = getMagnificatAntiphon(day);
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
    case 'lauds-preces':
    case 'marian-antiphon':
      throw new Error(`Vespers' ordo doesn't support a '${part.kind}' part`);
  }
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
  const parts = vespersDefinition.parts.flatMap((part) => resolvePart(part, day, weekday));
  return { hourId: 'vespers', date, parts, dayLabel: getDayLabel(day) };
}
