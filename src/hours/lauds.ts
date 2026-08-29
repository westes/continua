import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getCanticle } from './lauds-canticles';
import { getLaudsSaintOverride, getLaudsCommonOverride, type LaudsPsalmodyOverride } from './lauds-psalmody-overrides';
import { getOpeningVersicleId } from './opening-versicle';
import { getMarianAntiphonId, getMarianAntiphonLabel } from './marian-antiphon';
import { applyFlexaMark } from './antiphon';
import {
  resolveCommon,
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
 * Two independent tiers, tried in order:
 *
 * 1. **Proper** — this feast's own authored antiphons (per-feast, not
 *    per-Common — explicit choice), eligible at *any rank* via
 *    resolve-common.ts's getPsalmodyProperOverrideId. A saint's own real
 *    proper text is never gated behind rank — see that function's own
 *    doc comment for why this used to be wrongly bundled with tier 2's
 *    gate (fixed 2026-08-29).
 * 2. **Common category** — a generic-by-category substitute, still
 *    gated at duplex-majus+ via getOfficeOverrideId (a real, distinct,
 *    weaker tier: same conventional psalm numbers, not this feast's own
 *    text).
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
  return { text, status, citation: { la: canticle.citation, en: canticle.citation } };
}

/** Ps 66 through the Laudate psalms — see hours/types.ts's 'lauds-psalmody'
 * doc comment for the scope, and getPsalmodyOverrideFor above for when the
 * plain weekday default below gets substituted. */
function resolvePsalmody(day: LiturgicalDay): ResolvedPart[] {
  const wd = getPsalmodyOverrideFor(day) ?? laudsAntiphons[day.weekday];
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
    { kind: 'hymn', text: resolveCommon(`lauds-hymn-${key}`) },
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
