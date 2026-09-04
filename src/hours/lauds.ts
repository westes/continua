import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay, resolveActiveOctave } from '../calendar';
import { getSaintRecord } from '../calendar/feasts';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getCanticle, type CanticleVerse } from './lauds-canticles';
import { getLaudsSaintOverride, getLaudsCommonOverride, type LaudsPsalmodyOverride } from './lauds-psalmody-overrides';
import { getOpeningVersicleId } from './opening-versicle';
import { getHymnDoxologyId } from './hymn-doxology';
import { getMarianAntiphonId, getMarianAntiphonLabel } from './marian-antiphon';
import { applyFlexaMark } from './antiphon';
import {
  resolveCommon,
  appendDoxology,
  getDayCollects,
  getBenedictusAntiphon,
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
} from './resolve-common';
import laudsDefinitionData from '../data/hours/lauds.yml';
import laudsAntiphonsData from '../data/hours/lauds-antiphons.yml';

const laudsDefinition = laudsDefinitionData as HourDefinition;

type BilingualText = Partial<Record<string, string>>;
interface LaudsGroup {
  psalms: number[];
  antiphon: BilingualText;
}
/** Shared by both the plain per-weekday default (data/hours/lauds-
 * antiphons.yml) and a duplex-majus+/Marian-Saturday override (hours/
 * lauds-psalmody-overrides.ts) — resolvePsalmody doesn't care which one
 * produced it. */
interface PsalmodyBlock {
  groups: LaudsGroup[];
  // `split`: verse count of the canticle's first part, when it's said in
  // two pieces (own Gloria Patri each) rather than continuously — see
  // lauds-antiphons.yml's saturday.canticle comment. Only Saturday's
  // plain default uses this today; no override needs it yet.
  canticle: { id: string; antiphon: BilingualText; split?: number };
  laudate: { antiphon: BilingualText };
}
const laudsAntiphons = laudsAntiphonsData as Record<Weekday, PsalmodyBlock>;

/**
 * Two independent tiers, tried in order, for a duplex-majus+ (or named-
 * temporal) feast eligible to substitute its own psalm *numbers*, not
 * just its antiphons — see resolvePsalmody below for the sub-duplex-majus
 * case, which merges tier 1's antiphon text onto the ferial numbers
 * instead of calling this at all:
 *
 * 1. **Proper** — this feast's own authored antiphons+numbers (per-feast,
 *    not per-Common — explicit choice), via resolve-common.ts's
 *    getPsalmodyProperOverrideId.
 * 2. **Common category** — a generic-by-category substitute, gated at
 *    duplex-majus+ via getOfficeOverrideId (a real, distinct, weaker
 *    tier: same conventional psalm numbers, not this feast's own text).
 *
 * Falls back to `undefined` — the plain weekday default — for an eligible
 * feast with no override authored yet in either tier, same honest
 * incremental-content convention as everywhere else in this codebase;
 * it's not gated behind whether content exists, just behind whether it's
 * *eligible* to override at all.
 *
 * Both id-eligibility functions check resolveOfficeWinner(day), not the
 * raw `day.winner` — on an octave day this is the octave's own feast
 * (e.g. St. Lawrence, days 2-8 of his own octave), which is exactly what
 * should supply the psalmody override there too, live-verified alongside
 * the collect/Benedictus-antiphon fix (see resolve-common.ts's
 * resolveOfficeWinner doc comment).
 */
function getPsalmodyOverrideFor(day: LiturgicalDay): LaudsPsalmodyOverride | undefined {
  const properId = getPsalmodyProperOverrideId(day);
  const proper = properId ? getLaudsSaintOverride(properId) : undefined;
  if (proper) {
    return proper;
  }
  const categoryId = getOfficeOverrideId(day);
  return categoryId ? getLaudsCommonOverride(categoryId) : undefined;
}

/**
 * Below duplex-majus, a feast's own proper psalm *numbers* never
 * substitute for the ferial cycle (real Tridentine/Monastic rubric: only
 * a strong-enough feast gets proper psalms — a lesser one keeps the
 * ferial psalmody unchanged and gets its own proper text only at the
 * Benedictus antiphon and chapter/responsory/hymn/versicle bundle,
 * already-separate rank-agnostic mechanisms in resolve-common.ts). But a
 * saint's own authored antiphon text for these same psalm slots is still
 * real content worth showing (getPsalmodyProperOverrideId's own "any
 * rank" eligibility) — so it's layered onto the ferial numbers here
 * instead of being discarded outright.
 *
 * A proper override's own group count doesn't always match the ferial
 * weekday's (e.g. Saturday's Monastic 2-group split vs. the usual 3), so
 * pairing is by index against `ferial`'s own groups/canticle/laudate:
 * ferial's numbers (and canticle id/split) always win; each slot's
 * antiphon comes from `proper`'s same-index entry when one exists, else
 * stays ferial's own. Any extra `proper` groups beyond `ferial`'s count
 * are simply unused — confirmed with the user 2026-08-29 rather than
 * assumed, since there's no rubric covering this specific mismatch.
 */
function mergeFerialNumbersWithProperAntiphons(ferial: PsalmodyBlock, proper: LaudsPsalmodyOverride): PsalmodyBlock {
  return {
    groups: ferial.groups.map((g, i) => ({ psalms: g.psalms, antiphon: proper.groups[i]?.antiphon ?? g.antiphon })),
    canticle: { ...ferial.canticle, antiphon: proper.canticle?.antiphon ?? ferial.canticle.antiphon },
    laudate: { antiphon: proper.laudate?.antiphon ?? ferial.laudate.antiphon },
  };
}

// Mon-Fri share one capitulum verbatim (confirmed against the live engine
// — see lauds-capitulum-ferial.yml); Sunday and Saturday each have their
// own.
function capitulumId(weekday: Weekday): string {
  if (weekday === 'sunday') {
    return 'lauds-capitulum-sunday';
  }
  if (weekday === 'saturday') {
    return 'lauds-capitulum-saturday';
  }
  return 'lauds-capitulum-ferial';
}

function psalmParts(numbers: number[], antiphon: BilingualText, opening: ResolvedText): ResolvedPart[] {
  const parts: ResolvedPart[] = numbers.map((number, i) => {
    const rawVerses = getPsalmVerses(number).map((v) => ({ n: v.n, text: v.text, status: v.status }));
    const { verses, antiphon: psalmAntiphon } = applyFlexaMark(rawVerses, i === 0 ? opening : undefined);
    return {
      kind: 'psalm' as const,
      psalmNumber: number,
      antiphon: psalmAntiphon,
      verses,
    };
  });
  parts.push({ kind: 'antiphon', text: splitNamedAntiphon(verifiedText(antiphon)).full });
  return parts;
}

const STATUS_RANK = { verified: 0, draft: 1, missing: 2 } as const;

/** The general rule is that a citation must match whatever verses are
 * actually being displayed — not "the whole canticle's citation,
 * always." A full canticle's stored `citation` already satisfies that
 * (canticleText below only calls this helper for a `slice`), including
 * cases a formula couldn't reconstruct — canticum-trium-puerorum's
 * "Dan 3:57-88,56" is a non-contiguous liturgical splice, its last verse
 * (`n: "3:56"`) coming after verse 88 in display order, not after it
 * numerically. Only Saturday's split Deuteronomy canticle ever shows
 * fewer than all of a canticle's verses, so it's the only case needing
 * this: book name from the canticle's base citation (its first word),
 * verse range from the slice's own first/last `n` values (e.g.
 * "32:1"/"32:32" -> "Deut 32:1-32") — showing the full "1-65" range on
 * both halves would mislabel whichever half isn't actually being said. */
function sliceCitation(baseCitation: string, verses: CanticleVerse[]): string {
  const book = baseCitation.split(' ')[0] ?? baseCitation;
  const first = verses[0]?.n;
  const last = verses[verses.length - 1]?.n;
  if (!first || !last) {
    return baseCitation;
  }
  const lastVerse = last.split(':')[1] ?? last;
  return `${book} ${first}-${lastVerse}`;
}

/** Joins a canticle's verse array (or a `[start, end)` slice of it — see
 * Saturday's split canticle below) into one flowing text block, the same
 * shape nunc-dimittis/benedictus already use — Lauds' weekday canticles
 * are stored verse-by-verse (see lauds-canticles.ts) purely because that's
 * how they were transcribed, not because callers need per-verse access.
 * Does NOT append a closing Gloria Patri — that's attached centrally
 * (hours/index.ts) as its own 'canticle' field, same as every other
 * canticle/psalm, so the Sacred Triduum omission only has to be handled
 * in one place. */
function canticleText(canticleId: string, slice?: [number, number]): ResolvedText {
  const canticle = getCanticle(canticleId);
  const verses = slice ? canticle.verses.slice(slice[0], slice[1]) : canticle.verses;
  const text: Partial<Record<string, string>> = {};
  const status: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  for (const lang of ['la', 'en'] as const) {
    const lines = verses.map((v) => v.text[lang]).filter((t): t is string => Boolean(t));
    if (lines.length === 0) {
      continue;
    }
    text[lang] = lines.join('\n');
    let worst: 'verified' | 'draft' | 'missing' = 'verified';
    for (const v of verses) {
      const s = v.status[lang] ?? 'missing';
      if (STATUS_RANK[s] > STATUS_RANK[worst]) {
        worst = s;
      }
    }
    status[lang] = worst;
  }
  const citation = slice ? sliceCitation(canticle.citation, verses) : canticle.citation;
  return { text, status, citation: { la: citation, en: citation } };
}

/** Ps 66 through the Laudate psalms — see hours/types.ts's 'lauds-psalmody'
 * doc comment for the scope, getPsalmodyOverrideFor above for when the
 * plain weekday default gets substituted wholesale (numbers and
 * antiphons together, duplex-majus+ only), and
 * mergeFerialNumbersWithProperAntiphons for the sub-duplex-majus case
 * (ferial numbers, a saint's own antiphon text layered on top). */
function resolvePsalmody(day: LiturgicalDay): ResolvedPart[] {
  const ferial = laudsAntiphons[day.weekday];
  let wd: PsalmodyBlock;
  if (getOfficeOverrideId(day)) {
    wd = getPsalmodyOverrideFor(day) ?? ferial;
  } else {
    const properId = getPsalmodyProperOverrideId(day);
    const proper = properId ? getLaudsSaintOverride(properId) : undefined;
    wd = proper ? mergeFerialNumbersWithProperAntiphons(ferial, proper) : ferial;
  }
  const winner = resolveOfficeWinner(day);
  const opening = (antiphon: BilingualText) => openingAntiphon(verifiedText(antiphon), winner);
  const parts: ResolvedPart[] = [
    {
      kind: 'psalm',
      psalmNumber: 66,
      verses: getPsalmVerses(66).map((v) => ({ n: v.n, text: v.text, status: v.status })),
    },
  ];
  for (const group of wd.groups) {
    parts.push(...psalmParts(group.psalms, group.antiphon, opening(group.antiphon)));
  }
  const canticle = getCanticle(wd.canticle.id);
  const canticleOpening = opening(wd.canticle.antiphon);
  const canticleClosing = splitNamedAntiphon(verifiedText(wd.canticle.antiphon)).full;
  if (wd.canticle.split) {
    // Said in two pieces, own Gloria Patri each, one shared antiphon
    // framing both (opening before the first, full repeated only after
    // the second) — see lauds-antiphons.yml's saturday.canticle comment.
    parts.push({
      kind: 'canticle',
      canticleId: canticle.id,
      antiphon: canticleOpening,
      text: canticleText(canticle.id, [0, wd.canticle.split]),
    });
    parts.push({
      kind: 'canticle',
      canticleId: canticle.id,
      text: canticleText(canticle.id, [wd.canticle.split, canticle.verses.length]),
    });
  } else {
    parts.push({
      kind: 'canticle',
      canticleId: canticle.id,
      antiphon: canticleOpening,
      text: canticleText(canticle.id),
    });
  }
  parts.push({ kind: 'antiphon', text: canticleClosing });
  parts.push(...psalmParts([148, 149, 150], wd.laudate.antiphon, opening(wd.laudate.antiphon)));
  return parts;
}

/**
 * Every plain-default Lauds hymn's own closing doxology stanza (split out
 * into `lauds-hymn-${key}-doxology-per-annum.yml`) is re-attached here
 * through the seasonal mechanism (hours/hymn-doxology.ts) rather than kept
 * as fixed text — a deliberate broadening beyond the reference source
 * (whose Monastic weekday/seasonal Lauds hymns mostly don't vary their own
 * doxology by season at all, live-checked 2026-09-03): this project isn't
 * a reconstruction (see the repo's CLAUDE.md), and a hymn's closing
 * doxology is a natural, low-cost way to keep every hour visibly in step
 * with the season — e.g. the plain weekday hymns used all through
 * Christmastide/Epiphanytide/Corpus Christi/Sacred Heart (no
 * `seasonalOfficeSuffix` covers those) previously stayed on their generic
 * per-annum ending throughout; now they pick up Nat/Epi/Corp/Heart like
 * Prime/Compline already did. Each `key`'s own natural ending is preserved
 * as that key's per-annum default, so a season/feast with no override
 * (e.g. Advent, Lent — the source itself never swaps those) reproduces the
 * exact original text.
 */
function resolveLaudsHymn(day: LiturgicalDay, key: string): ResolvedText {
  // A temporal-feast-only octave (Ascension's own — no saint record, so
  // resolveOfficeWinner's own octave-synthesis can't help here on a
  // privileged Sunday, whose `octaveGoverningPrivilegedDay` gate is
  // correctly closed to a real *saint* overriding it but wrongly also
  // closes the *octave's own* hymn — live-verified wrong: "Dominica infra
  // Octavam Ascensionis" still uses Ascension's own hymn/responsory, just
  // with its own distinct proper chapter) still needs its own hymn
  // recognized here directly via resolveActiveOctave (no privileged-
  // Sunday gate) — checked before the plain season/weekday fallback, but
  // deliberately not touched at the chapter/responsory/versicle level:
  // this Sunday's own chapter genuinely differs from Ascension Day's own,
  // so folding the whole bundle through the octave id would be wrong.
  const octave = resolveActiveOctave(day.date);
  if (octave && !getSaintRecord(octave.id)) {
    const octaveHymn = resolveCommon(`lauds-hymn-${octave.id}`);
    if (octaveHymn.status.la !== 'missing' || octaveHymn.status.en !== 'missing') {
      return octaveHymn;
    }
  }
  const body = resolveCommon(`lauds-hymn-${key}`);
  const doxology = resolveCommon(getHymnDoxologyId(day, `lauds-hymn-${key}-doxology-per-annum`));
  return appendDoxology(body, doxology);
}

/** Any sanctoral winner's (or named-temporal feast's) own capitulum/
 * responsory/hymn/versicle (data/propers/common/lauds-{part}-${id}.yml),
 * else their Common's (`${part}-${common}`), when authored — see
 * resolve-common.ts's resolveOfficeBundle for the eligibility/fallback
 * rule (deliberately rank-agnostic as of 2026-08-25: a simplex feast's
 * Common chapter/hymn is real content, not gated behind duplex-majus+
 * like the psalmody override above is). Falls to a *seasonal* default
 * next (Advent/Lent/Passiontide/Paschaltide — see resolve-common.ts's
 * seasonalOfficeSuffix), and only then the plain weekday default — a
 * feast's own override always wins over the season it happens to fall
 * in, same as everywhere else in this codebase. */
function resolveOffice(day: LiturgicalDay): ResolvedPart[] {
  const bundle = resolveOfficeBundle('lauds', day);
  if (bundle) {
    return [
      { kind: 'chapter', text: bundle.chapter },
      { kind: 'responsory', text: bundle.responsory },
      { kind: 'hymn', text: bundle.hymn },
      { kind: 'versicle', text: bundle.versicle },
    ];
  }
  const seasonSuffix = seasonalOfficeSuffix(day.season);
  const key = seasonSuffix ?? day.weekday;
  return [
    { kind: 'chapter', text: resolveCommon(seasonSuffix ? `lauds-capitulum-${key}` : capitulumId(day.weekday)) },
    { kind: 'responsory', text: resolveResponsory(resolveCommon(`lauds-responsory-${key}`), day) },
    { kind: 'hymn', text: resolveLaudsHymn(day, key) },
    { kind: 'versicle', text: resolveCommon(`lauds-versicle-${key}`) },
  ];
}

function resolvePart(part: HourPart, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) }];
    case 'lauds-psalmody':
      return resolvePsalmody(day);
    case 'lauds-office':
      return resolveOffice(day);
    case 'benedictus': {
      const antiphonText = getBenedictusAntiphon(day);
      const opening = openingAntiphon(antiphonText, resolveOfficeWinner(day));
      const { full } = splitNamedAntiphon(antiphonText);
      return [
        { kind: 'canticle', canticleId: 'benedictus', text: resolveCommon('benedictus'), antiphon: opening },
        { kind: 'antiphon', text: full },
      ];
    }
    case 'preces':
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'day-collects':
      return getDayCollects(day);
    case 'suffrages':
      return resolveSuffrages(day, part.omitOnDouble);
    case 'versicle':
    case 'chapter':
    case 'responsory':
    case 'prayer':
      return [{ kind: part.kind, text: resolveCommon(part.textRef.id) }];
    case 'marian-antiphon': {
      const id = getMarianAntiphonId(day);
      return [{ kind: 'preces', text: resolveCommon(id), label: getMarianAntiphonLabel(id) }];
    }
    case 'lauds-preces': {
      const id = isFerialOrVigil(day) ? 'lauds-preces-feriales' : 'lauds-short-litany';
      return [{ kind: 'preces', text: resolveCommon(id) }];
    }
    // Not used by Lauds.
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
    case 'vespers-psalmody':
    case 'vespers-office':
    case 'magnificat':
    case 'vespers-preces':
      throw new Error(`Lauds' ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const parts = laudsDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'lauds', date, parts, dayLabel: getDayLabel(day) };
}
