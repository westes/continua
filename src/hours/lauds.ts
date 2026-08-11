import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getCanticle } from './lauds-canticles';
import { getOpeningVersicleId } from './opening-versicle';
import { getMarianAntiphonId, getMarianAntiphonLabel } from './marian-antiphon';
import { isDoubleOrHigher } from './antiphon';
import { resolveCommon, getDayCollects, getBenedictusAntiphon, splitNamedAntiphon } from './resolve-common';
import laudsDefinitionData from '../data/hours/lauds.yml';
import laudsAntiphonsData from '../data/hours/lauds-antiphons.yml';

const laudsDefinition = laudsDefinitionData as HourDefinition;

type BilingualText = Partial<Record<string, string>>;
interface LaudsGroup {
  psalms: number[];
  antiphon: BilingualText;
}
interface LaudsWeekdayAntiphons {
  groups: LaudsGroup[];
  canticle: { id: string; antiphon: BilingualText };
  laudate: { antiphon: BilingualText };
}
const laudsAntiphons = laudsAntiphonsData as Record<Weekday, LaudsWeekdayAntiphons>;

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
  const parts: ResolvedPart[] = numbers.map((number, i) => ({
    kind: 'psalm' as const,
    psalmNumber: number,
    antiphon: i === 0 ? opening : undefined,
    verses: getPsalmVerses(number).map((v) => ({ n: v.n, text: v.text, status: v.status })),
  }));
  parts.push({ kind: 'antiphon', text: splitNamedAntiphon(antiphon).full });
  return parts;
}

const STATUS_RANK = { verified: 0, draft: 1, missing: 2 } as const;

/** Joins a canticle's verse array into one flowing text block, the same
 * shape nunc-dimittis/benedictus already use — Lauds' weekday canticles
 * are stored verse-by-verse (see lauds-canticles.ts) purely because that's
 * how they were transcribed, not because callers need per-verse access.
 * Appends the fixed Gloria Patri line every canticle ends with in real
 * practice, same wording as benedictus.yml's own trailing line. */
function canticleText(canticleId: string): ResolvedText {
  const canticle = getCanticle(canticleId);
  const text: Partial<Record<string, string>> = {};
  const status: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  const GLORIA = {
    la: 'V. Glória Patri, et Fílio, * et Spirítui Sancto.\nR. Sicut erat in princípio, et nunc, et semper, * et in sǽcula sæculórum. Amen.',
    en: 'V. Glory be to the Father, and to the Son, * and to the Holy Ghost.\nR. As it was in the beginning, is now, * and ever shall be, world without end. Amen.',
  };
  for (const lang of ['la', 'en'] as const) {
    const lines = canticle.verses.map((v) => v.text[lang]).filter((t): t is string => Boolean(t));
    if (lines.length === 0) {
      continue;
    }
    text[lang] = `${lines.join('\n')}\n${GLORIA[lang]}`;
    let worst: 'verified' | 'draft' | 'missing' = 'verified';
    for (const v of canticle.verses) {
      const s = v.status[lang] ?? 'missing';
      if (STATUS_RANK[s] > STATUS_RANK[worst]) {
        worst = s;
      }
    }
    status[lang] = worst;
  }
  return { text, status };
}

/** Ps 66 through the Laudate psalms — see hours/types.ts's 'lauds-psalmody'
 * doc comment for the scope and the known Commune-override gap. */
function resolvePsalmody(day: LiturgicalDay): ResolvedPart[] {
  const wd = laudsAntiphons[day.weekday];
  const opening = (antiphon: BilingualText) => {
    const { incipit, full } = splitNamedAntiphon(antiphon);
    return isDoubleOrHigher(day.winner) ? full : incipit;
  };
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
  parts.push({
    kind: 'canticle',
    canticleId: canticle.id,
    antiphon: opening(wd.canticle.antiphon),
    text: canticleText(canticle.id),
  });
  parts.push({ kind: 'antiphon', text: splitNamedAntiphon(wd.canticle.antiphon).full });
  parts.push(...psalmParts([148, 149, 150], wd.laudate.antiphon, opening(wd.laudate.antiphon)));
  return parts;
}

function resolveOffice(weekday: Weekday): ResolvedPart[] {
  return [
    { kind: 'chapter', text: resolveCommon(capitulumId(weekday)) },
    { kind: 'responsory', text: resolveCommon(`lauds-responsory-${weekday}`) },
    { kind: 'hymn', text: resolveCommon(`lauds-hymn-${weekday}`) },
    { kind: 'versicle', text: resolveCommon(`lauds-versicle-${weekday}`) },
  ];
}

const SUFFRAGES = ['lauds-suffrage-cross', 'lauds-suffrage-bvm', 'lauds-suffrage-apostles', 'lauds-suffrage-peace'];
const SUFFRAGE_LABELS: Record<string, string> = {
  'lauds-suffrage-cross': 'Of the Holy Cross',
  'lauds-suffrage-bvm': 'Of the Blessed Virgin Mary',
  'lauds-suffrage-apostles': 'Of the Holy Apostles Peter and Paul',
  'lauds-suffrage-peace': 'For Peace',
};

function resolvePart(part: HourPart, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) }];
    case 'lauds-psalmody':
      return resolvePsalmody(day);
    case 'lauds-office':
      return resolveOffice(day.weekday);
    case 'benedictus': {
      const { incipit, full } = splitNamedAntiphon(getBenedictusAntiphon(day).text);
      const opening = isDoubleOrHigher(day.winner) ? full : incipit;
      return [
        { kind: 'canticle', canticleId: 'benedictus', text: resolveCommon('benedictus'), antiphon: opening },
        { kind: 'antiphon', text: full },
      ];
    }
    case 'preces':
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'day-collects':
      return getDayCollects(day).map((text) => ({ kind: 'prayer' as const, text }));
    case 'suffrages':
      if (part.omitOnDouble && isDoubleOrHigher(day.winner)) {
        return [];
      }
      return SUFFRAGES.map((id) => ({
        kind: 'preces' as const,
        text: resolveCommon(id),
        label: SUFFRAGE_LABELS[id],
      }));
    case 'versicle':
    case 'chapter':
    case 'responsory':
    case 'prayer':
      return [{ kind: part.kind, text: resolveCommon(part.textRef.id) }];
    case 'marian-antiphon': {
      const id = getMarianAntiphonId(day);
      return [{ kind: 'preces', text: resolveCommon(id), label: getMarianAntiphonLabel(id) }];
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
      throw new Error(`Lauds' ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const parts = laudsDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'lauds', date, parts, dayLabel: getDayLabel(day) };
}
