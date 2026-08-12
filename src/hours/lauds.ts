import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay, isAtLeast, isSundayOrFeast, activeOctavesFor } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { getPsalmVerses } from '../psalter';
import { getCanticle } from './lauds-canticles';
import { getLaudsPsalmodyOverride, type LaudsPsalmodyOverride } from './lauds-psalmody-overrides';
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

// Named temporal winners with real standing of their own, unconditionally
// override-eligible (no rank check — they aren't "a saint" competing with
// the weekday default the way one is, and neither carries a FeastClass at
// all since DayWinner's temporal variant never does). Grows one entry at
// a time as each is built, same as everywhere else in this codebase.
const ALWAYS_OVERRIDE_TEMPORAL_IDS = new Set(['marian-saturday', 'christ-the-king']);

/**
 * A duplex-majus+ saint's own proper psalmody (per-feast, not per-Common —
 * explicit choice), or one of the named temporal feasts above. Falls back
 * to `undefined` — the plain weekday default — for a duplex-majus+ saint
 * with no override authored yet, same honest incremental-content
 * convention as everywhere else in this codebase; it's not gated behind
 * whether content exists, just behind whether it's *eligible* to override
 * at all.
 */
function getPsalmodyOverrideFor(day: LiturgicalDay): LaudsPsalmodyOverride | undefined {
  if (day.winner.kind === 'temporal' && ALWAYS_OVERRIDE_TEMPORAL_IDS.has(day.winner.id)) {
    return getLaudsPsalmodyOverride(day.winner.id);
  }
  if (day.winner.kind === 'sanctoral' && isAtLeast(day.winner.rank, 'duplex-majus')) {
    return getLaudsPsalmodyOverride(day.winner.id);
  }
  return undefined;
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

const GLORIA_PATRI = {
  la: 'V. Glória Patri, et Fílio, * et Spirítui Sancto.\nR. Sicut erat in princípio, et nunc, et semper, * et in sǽcula sæculórum. Amen.',
  en: 'V. Glory be to the Father, and to the Son, * and to the Holy Ghost.\nR. As it was in the beginning, is now, * and ever shall be, world without end. Amen.',
};

/** Joins a canticle's verse array (or a `[start, end)` slice of it — see
 * Saturday's split canticle below) into one flowing text block, the same
 * shape nunc-dimittis/benedictus already use — Lauds' weekday canticles
 * are stored verse-by-verse (see lauds-canticles.ts) purely because that's
 * how they were transcribed, not because callers need per-verse access.
 * Appends the fixed Gloria Patri line every canticle (or canticle part)
 * ends with in real practice, same wording as benedictus.yml's own
 * trailing line. */
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
    text[lang] = `${lines.join('\n')}\n${GLORIA_PATRI[lang]}`;
    let worst: 'verified' | 'draft' | 'missing' = 'verified';
    for (const v of verses) {
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
 * doc comment for the scope, and getPsalmodyOverrideFor above for when the
 * plain weekday default below gets substituted. */
function resolvePsalmody(day: LiturgicalDay): ResolvedPart[] {
  const wd = getPsalmodyOverrideFor(day) ?? laudsAntiphons[day.weekday];
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
  const canticleOpening = opening(wd.canticle.antiphon);
  const canticleClosing = splitNamedAntiphon(wd.canticle.antiphon).full;
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

/** A duplex-majus+/Marian-Saturday override's own capitulum/responsory/
 * hymn/versicle (data/propers/common/lauds-{part}-${id}.yml), when
 * authored — most overrides only bother with the psalmody (see
 * getPsalmodyOverrideFor) and leave this bundle at its plain weekday
 * default, which is exactly what falls back here when the id-keyed
 * capitulum doesn't exist (same dual-missing-status "not authored"
 * signal used throughout this codebase, not a special case). */
function resolveOffice(day: LiturgicalDay): ResolvedPart[] {
  const overrideId = getPsalmodyOverrideFor(day)?.id;
  if (overrideId) {
    const chapter = resolveCommon(`lauds-capitulum-${overrideId}`);
    if (chapter.status.la !== 'missing' || chapter.status.en !== 'missing') {
      return [
        { kind: 'chapter', text: chapter },
        { kind: 'responsory', text: resolveCommon(`lauds-responsory-${overrideId}`) },
        { kind: 'hymn', text: resolveCommon(`lauds-hymn-${overrideId}`) },
        { kind: 'versicle', text: resolveCommon(`lauds-versicle-${overrideId}`) },
      ];
    }
  }
  return [
    { kind: 'chapter', text: resolveCommon(capitulumId(day.weekday)) },
    { kind: 'responsory', text: resolveCommon(`lauds-responsory-${day.weekday}`) },
    { kind: 'hymn', text: resolveCommon(`lauds-hymn-${day.weekday}`) },
    { kind: 'versicle', text: resolveCommon(`lauds-versicle-${day.weekday}`) },
  ];
}

const SUFFRAGES = [
  'lauds-suffrage-cross',
  'lauds-suffrage-bvm',
  'lauds-suffrage-joseph',
  'lauds-suffrage-apostles',
  'lauds-suffrage-peace',
];
const SUFFRAGE_LABELS: Record<string, string> = {
  'lauds-suffrage-cross': 'Of the Holy Cross',
  'lauds-suffrage-bvm': 'Of the Blessed Virgin Mary',
  'lauds-suffrage-joseph': 'Of St. Joseph',
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
      return resolveOffice(day);
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
    case 'suffrages': {
      // isDoubleOrHigher only ever looks at a sanctoral rank — Christ the
      // King is modeled as a named temporal winner (see
      // ALWAYS_OVERRIDE_TEMPORAL_IDS above) with no FeastClass to check at
      // all, so it needs its own explicit inclusion here. Confirmed live:
      // "Suffragium{omittitur}" — the whole set drops, same as any other
      // Double-or-higher day.
      const isChristTheKing = day.winner.kind === 'temporal' && day.winner.id === 'christ-the-king';
      // Confirmed live against Monastic Tridentinum 1617 directly (this
      // isn't a Tridentine-1906-only quirk -- the same exclusions hold
      // under the app's own primary rubric track): suffrages are omitted
      // *entirely* during Advent, Christmastide, and Passiontide (not all
      // of Lent -- ordinary Lent ferias still get them, checked directly
      // against 2026-02-20; only the last two weeks), and on any day
      // within an active octave, however low that octave's own rank is
      // -- checked directly against day 3 of St. Lawrence's own
      // (Semiduplex) octave, which still omits them despite being well
      // below the Duplex+ rank threshold below.
      const isSeasonallyExcluded = day.season === 'advent' || day.season === 'christmastide' || day.season === 'passiontide';
      const isWithinAnOctave = activeOctavesFor(day.date).length > 0;
      if (part.omitOnDouble && (isDoubleOrHigher(day.winner) || isChristTheKing || isSeasonallyExcluded || isWithinAnOctave)) {
        return [];
      }
      // "Of the Holy Cross" is the real *ferial*-office suffrage, sourced
      // from Tridentine 1906/1910 (a different track than the other four,
      // which come from Monastic 1617 -- that track has no Cross suffrage
      // at Lauds at all) -- live-verified against a plain ferial win, a
      // plain Sunday win, a low-rank saint's own win (even bare Simplex),
      // and Marian Saturday: Cross shows only when the bare temporal
      // feria itself is what's being prayed -- the exact *opposite* of
      // "Sunday or a feast of the Lord." In this app's own vocabulary,
      // that's `!isSundayOrFeast(day)` (the same ferial/festive split
      // Prime's capitulum already keys off) with one more exclusion for a
      // named temporal identity like Marian Saturday, which isn't Sunday
      // or a sanctoral winner either but still isn't a bare ferial office.
      const showCross = !isSundayOrFeast(day) && !(day.winner.kind === 'temporal' && getTemporalFeastRecord(day.winner.id));
      // "Of the Blessed Virgin Mary" is omitted specifically when the
      // day's own office is already Marian (would be redundant to
      // suffrage Mary again on her own day) -- confirmed live on Marian
      // Saturday (Simplex-strength, so it reaches this far rather than
      // being excluded outright above); the only case this app currently
      // has of a day using the Marian common below the suffrage-omitting
      // Duplex+ threshold (every actual Marian *feast* modeled so far is
      // Duplex-majus+ and already returns above).
      const isMarianSaturday = day.winner.kind === 'temporal' && day.winner.id === 'marian-saturday';
      const ids = SUFFRAGES.filter((id) => {
        if (id === 'lauds-suffrage-cross') return showCross;
        if (id === 'lauds-suffrage-bvm') return !isMarianSaturday;
        return true;
      });
      return ids.map((id) => ({
        kind: 'preces' as const,
        text: resolveCommon(id),
        label: SUFFRAGE_LABELS[id],
      }));
    }
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
