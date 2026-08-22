// Matins — the last hour built in this project, and structurally the most
// different from every other one (see this file's own history in TODO.md).
// Builds its ordo programmatically per day rather than resolving a static
// `data/hours/matins.yml` parts list the way every other hour does, because
// the real shape (1 nocturn on a plain ferial day vs. 3 on a Sunday or a
// Duplex+ feast, with a *variable* number of readings) doesn't fit that
// pattern.
//
// Critical framing (see memory `vu-not-a-reconstruction` / `vu-matins-
// design`, and TODO.md's own Matins section): this is NOT a historical
// reconstruction. The reference engine's Monastic 1617 data is a content
// and structure source, not a spec to reproduce — several real, deliberate
// departures from it are built in here:
//   - Readings are pool-assembled, not fixed-slotted (user, 2026-08,
//     superseding this file's original "Nocturn 1 = plan, Nocturns 2-3 =
//     patristic" design): every source that can contribute for the day —
//     the user's own scripture-reading plan (src/propers/bible-plan.ts,
//     a *variable* number of readings, not the historical fixed 3 or the
//     Rule's own "summer" contraction, deliberately not reproduced —
//     this app reads in full year-round), the office winner's and every
//     commemorated saint's own patristic/hagiographic/Gospel content, the
//     plain temporal day's own content, and every active octave's own
//     reading — is gathered into one ordered pool (`buildReadingPool`),
//     then slotted across however many nocturns the day's psalmody has
//     (`distributeIntoNocturns`), with no reading kind pinned to a
//     particular nocturn number. On a 3-nocturn day the slotting is
//     front-light: Nocturn 1 gets one reading, Nocturn 2 gets one, and
//     Nocturn 3 absorbs the rest of the pool, however large (user, 2026-08)
//     — not an even chunking of the pool. A pool of only one reading total
//     goes in Nocturn 3, not Nocturn 1.
//   - Where the historical office splits one continuous source across
//     several numbered lessons, this app recombines them into one reading
//     (see src/propers/octave-readings.ts's resolvePassages / src/propers/
//     nocturn-readings.ts) — split only where the underlying source
//     genuinely changes (e.g. a Gospel pericope vs. the homily on it).
//   - The *number* of nocturns (1 vs. 3) is still gated at Duplex-and-higher
//     (plus every Sunday, unconditionally) — the user's own choice
//     (2026-08), not the historical Rule's own more permissive threshold.
//     This is a psalmody-structure decision only; it no longer limits which
//     days get patristic reading content authored — a sub-Duplex day's
//     single nocturn can and should include patristic/hagiographic content
//     from the pool whenever it's been sourced for that day (user, 2026-08:
//     "patristic readings for every saint where we can source one, not
//     just duplex+").
//   - A Gospel reading is sourced from exactly two places: the user's own
//     plan (flagged via BiblePlanReading.isGospel — never present on a
//     Sunday, a deliberate editorial choice in the user's own plan, not a
//     gap) and the day's own genuine *proper* Gospel+homily (src/propers/
//     nocturn-readings.ts). A Common-of-Saints fallback Gospel is
//     deliberately never used here — nocturn-readings.ts has no
//     Common-fallback mechanism at all (unlike collectCommon/
//     benedictusCommon elsewhere), so this exclusion falls out of the
//     store's own shape rather than needing special-case code.
//   - Every commemorated saint (not just the office winner) and every
//     active octave contributes its own reading to the pool, when
//     authored — "be generous, not winner-takes-all" (user, 2026-08) —
//     mirroring getDayCollects's own "one collect per commemoration"
//     pattern, applied to readings instead.
//
// Only a small, growable slice of content is authored so far (one clean
// ferial day, one clean Sunday) — this is the mechanism build, not the
// full-calendar content pass. See TODO.md for what's deferred.
import type { ResolvedOrdo, ResolvedPart, ResolvedText, ResolvedVerse } from './types';
import type { LiturgicalDay } from '../calendar/types';
import { resolveDay, resolveTemporalId, activeOctavesFor } from '../calendar';
import { isInTriduum } from '../calendar/temporal';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getPsalmsFor, type PsalmRef } from '../psalter/distribution';
import { getScriptureVerses } from '../scripture';
import { getOpeningVersicleId } from './opening-versicle';
import { isDoubleOrHigher } from './antiphon';
import {
  resolveCommon,
  getDayCollect,
  getOfficeOverrideId,
  resolveOfficeWinner,
  seasonalOfficeSuffix,
  verifiedText,
  splitNamedAntiphon,
} from './resolve-common';
import { getBiblePlanReadings } from '../propers/bible-plan';
import { getNocturnReadings, type NocturnReading } from '../propers/nocturn-readings';
import { getOctaveReading } from '../propers/octave-readings';
import { getMatinsPsalmodyOverride } from './matins-psalmody-overrides';
import matinsSundayAntiphonsData from '../data/hours/matins-sunday-antiphons.yml';
import matinsFerialAntiphonsData from '../data/hours/matins-ferial-antiphons.yml';
import type { Weekday } from '../calendar/types';

type BilingualText = Partial<Record<string, string>>;
interface SundayGroup {
  psalms: number[];
  antiphon: BilingualText;
}
interface ScriptureRef {
  book: string;
  chapter: number;
  verses?: string;
}
interface SundayNocturn {
  groups?: SundayGroup[];
  // Usually one ref per canticle; more than one when the source cites a
  // single canticle across a chapter boundary (e.g. St. Lawrence's own
  // Nocturn 3, "Eccli 14:22;15:3-4;15:6" — one canticle, two Sirach
  // chapters) — concatenated in order, not rendered as separate
  // canticles, matching how the source itself presents it as one entry
  // under one heading.
  canticles?: { refs: ScriptureRef[] }[];
  antiphon?: BilingualText;
  versicle: { v: BilingualText; r: BilingualText };
}
interface MatinsSundayAntiphons {
  nocturn1: SundayNocturn;
  nocturn2: SundayNocturn;
  nocturn3: SundayNocturn;
}
const sundayAntiphons = matinsSundayAntiphonsData as unknown as MatinsSundayAntiphons;

interface FerialGroup {
  psalms: PsalmRef[];
  antiphon: BilingualText;
  versicle?: { v: BilingualText; r: BilingualText };
}
interface FerialNocturn {
  groups: FerialGroup[];
}
type MatinsFerialAntiphons = Record<Exclude<Weekday, 'sunday'>, FerialNocturn>;
const ferialAntiphons = matinsFerialAntiphonsData as unknown as MatinsFerialAntiphons;

const NOCTURN_NUMERAL = ['I', 'II', 'III'] as const;

/** Combines a versicle's V. and R. lines into one rendered block — every
 * nocturn versicle in this file goes through this (previously
 * `sundayPsalmNocturn`/`sundayCanticleNocturn` only rendered the V. line,
 * silently dropping the responsory; fixed here, 2026-08-21). */
function versicleText(versicle: { v: BilingualText; r: BilingualText }): ResolvedText {
  return verifiedText({
    la: `V. ${versicle.v.la}\nR. ${versicle.r.la}`,
    en: `V. ${versicle.v.en}\nR. ${versicle.r.en}`,
  });
}

type PsalmPart = Extract<ResolvedPart, { kind: 'psalm' }>;

function plainPsalm(number: number): PsalmPart {
  return {
    kind: 'psalm',
    psalmNumber: number,
    verses: getPsalmVerses(number).map((v): ResolvedVerse => ({ n: v.n, text: v.text, status: v.status })),
  };
}

function psalmRefParts(refs: PsalmRef[]): ResolvedPart[] {
  return refs.map((ref) => ({
    kind: 'psalm' as const,
    psalmNumber: ref.number,
    verses: getPsalmVerses(ref.number, ref.verses).map((v): ResolvedVerse => ({ n: v.n, text: v.text, status: v.status })),
  }));
}

/** The Invitatory (Ps 94) — real practice interleaves its antiphon as a
 * repeating refrain between verse groups; per direct instruction this app
 * frames it like any other psalm antiphon instead (one opening, one full
 * repeat after) — see data/propers/common/matins-invitatory-antiphon.yml's
 * own header. */
function invitatoryParts(day: LiturgicalDay): ResolvedPart[] {
  const { incipit, full } = splitNamedAntiphon(resolveCommon('matins-invitatory-antiphon'));
  const opening = isDoubleOrHigher(resolveOfficeWinner(day)) ? full : incipit;
  return [
    { ...plainPsalm(94), antiphon: opening },
    { kind: 'antiphon', text: full },
  ];
}

/** Sunday's fixed 12-psalm psalmody for Nocturns 1-2 (Ps 20-31, 3
 * antiphons per nocturn each framing a pair of psalms) — see
 * data/hours/matins-sunday-antiphons.yml's own header for sourcing. */
function sundayPsalmNocturn(group: SundayNocturn, day: LiturgicalDay): ResolvedPart[] {
  const parts: ResolvedPart[] = [];
  for (const g of group.groups ?? []) {
    const { incipit, full } = splitNamedAntiphon(verifiedText(g.antiphon));
    const opening = isDoubleOrHigher(resolveOfficeWinner(day)) ? full : incipit;
    g.psalms.forEach((n, i) => {
      parts.push({ ...plainPsalm(n), antiphon: i === 0 ? opening : undefined });
    });
    parts.push({ kind: 'antiphon', text: full });
  }
  parts.push({ kind: 'versicle', text: versicleText(group.versicle) });
  return parts;
}

/** Nocturn 3's 3 fixed OT canticles under one shared antiphon — see
 * data/hours/matins-sunday-antiphons.yml's own header. */
function sundayCanticleNocturn(group: SundayNocturn, day: LiturgicalDay): ResolvedPart[] {
  const { incipit, full } = splitNamedAntiphon(verifiedText(group.antiphon ?? {}));
  const opening = isDoubleOrHigher(resolveOfficeWinner(day)) ? full : incipit;
  const parts: ResolvedPart[] = (group.canticles ?? []).map((c, i) => {
    const verses = c.refs.flatMap((ref) => getScriptureVerses(ref.book, ref.chapter, ref.verses));
    const text: BilingualText = {
      la: verses.map((v) => v.text.la).filter(Boolean).join(' '),
      en: verses.map((v) => v.text.en).filter(Boolean).join(' '),
    };
    return {
      kind: 'canticle' as const,
      canticleId: c.refs.map((ref) => `${ref.book}-${ref.chapter}${ref.verses ? `-${ref.verses}` : ''}`).join('_'),
      text: verifiedText(text),
      antiphon: i === 0 ? opening : undefined,
    };
  });
  parts.push({ kind: 'antiphon', text: full });
  parts.push({ kind: 'versicle', text: versicleText(group.versicle) });
  return parts;
}

/** The Matins hymn — a duplex-majus+ saint's or eligible named temporal
 * feast's own proper hymn (`matins-hymn-${overrideId}`, via the same
 * getOfficeOverrideId eligibility Lauds/Vespers' own resolveOffice uses),
 * when authored, else falls to a *seasonal* default (Advent/Lent/
 * Passiontide/Paschaltide, none authored yet), else the plain year-round
 * ferial hymn — same override > season > ferial precedence every other
 * hour's own office bundle uses (see lauds.ts's resolveOffice), just never
 * wired up here before. Concrete motivating case (user, 2026-08-21): the
 * Assumption's octave (`Sancti/08-21bmv.txt`'s own `[Rule] ex Sancti/
 * 08-15`) genuinely keeps the feast's own proper hymn all week, not the
 * ferial one this always rendered previously. */
function resolveMatinsHymn(day: LiturgicalDay): ResolvedText {
  const overrideId = getOfficeOverrideId(day);
  if (overrideId) {
    const proper = resolveCommon(`matins-hymn-${overrideId}`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
  }
  const seasonSuffix = seasonalOfficeSuffix(day.season);
  if (seasonSuffix) {
    const seasonal = resolveCommon(`matins-hymn-${seasonSuffix}`);
    if (seasonal.status.la !== 'missing' || seasonal.status.en !== 'missing') {
      return seasonal;
    }
  }
  return resolveCommon('matins-hymn-ferial');
}

function ferialPsalmody(day: LiturgicalDay): ResolvedPart[] {
  return psalmRefParts(getPsalmsFor('matins', day.weekday));
}

/** The plain ferial weekday nocturn's real antiphoned psalmody (see
 * data/hours/matins-ferial-antiphons.yml's own header for how each
 * weekday's groups/versicle were reconciled against psalter-
 * distribution.yml's own "editorial redistribution" of the historical
 * per-weekday psalm set). Every psalm-group carries its own antiphon
 * (incipit-or-full opening, same rank rule as Sunday's own nocturns), and
 * exactly one group per weekday carries a versicle+responsory, rendered
 * as one combined V./R. block via `versicleText`. */
function ferialAntiphonedNocturn(day: LiturgicalDay): ResolvedPart[] {
  const nocturn = ferialAntiphons[day.weekday as Exclude<Weekday, 'sunday'>];
  const isDouble = isDoubleOrHigher(resolveOfficeWinner(day));
  const parts: ResolvedPart[] = [];
  for (const group of nocturn.groups) {
    const { incipit, full } = splitNamedAntiphon(verifiedText(group.antiphon));
    const opening = isDouble ? full : incipit;
    group.psalms.forEach((ref, i) => {
      parts.push({
        kind: 'psalm',
        psalmNumber: ref.number,
        verses: getPsalmVerses(ref.number, ref.verses).map((v): ResolvedVerse => ({ n: v.n, text: v.text, status: v.status })),
        antiphon: i === 0 ? opening : undefined,
      });
    });
    parts.push({ kind: 'antiphon', text: full });
    if (group.versicle) {
      parts.push({ kind: 'versicle', text: versicleText(group.versicle) });
    }
  }
  return parts;
}

/** Fallback for a Duplex+ weekday feast with no matins-psalmody-overrides
 * entry authored for its winner yet (most of them, until the bulk-content
 * pass — see hours/matins-psalmody-overrides.ts's own doc comment): the
 * plain ferial weekday table, chunked into 3 nocturns instead of 1 (no
 * antiphons, no canticles — that content doesn't exist for the ferial
 * table at all, unlike a real per-category override). Direct instruction:
 * never blank, but honestly not that saint's own real proper psalmody
 * until it's authored. */
function ferialPsalmodyThreeNocturns(day: LiturgicalDay): [ResolvedPart[], ResolvedPart[], ResolvedPart[]] {
  const psalms = ferialPsalmody(day);
  const size = Math.ceil(psalms.length / 3);
  return [psalms.slice(0, size), psalms.slice(size, size * 2), psalms.slice(size * 2)];
}

/** Every id whose own patristic/hagiographic/Gospel content should be
 * gathered for `day` — the office winner (if sanctoral), every
 * commemorated saint (a transferred-in feast already appears as `day.winner`
 * once `resolveDay` has applied the transfer, so it needs no separate
 * lookup here), and the plain temporal id itself (for an ordinary day's own
 * patristic content, e.g. a plain Sunday's Moralia-in-Job-style
 * commentary) — deliberately inclusive, not just the winner, per the
 * user's own "be generous, not winner-takes-all" instruction (2026-08). */
function nocturnReadingIds(day: LiturgicalDay, temporalId: string): string[] {
  const ids = new Set<string>();
  // Not gated to `kind === 'sanctoral'` -- a named temporal override (e.g.
  // Immaculate Heart of Mary, calendar/index.ts's applyImmaculateHeart)
  // has its own authored nocturn-readings file keyed by its own id too,
  // distinct from the plain governing-Sunday `temporalId` added below.
  // Harmless to include unconditionally: on an ordinary day `day.winner.id`
  // already equals `temporalId`, so the Set just dedupes.
  ids.add(day.winner.id);
  for (const c of day.commemorations) {
    if (c.kind === 'sanctoral') ids.add(c.id);
  }
  ids.add(temporalId);
  return [...ids];
}

function nocturnReadingPart(r: NocturnReading): ResolvedPart {
  return {
    kind: 'lesson',
    text: { text: r.text, status: r.status, citation: r.citation },
    label: r.source,
    isGospel: r.isGospel,
    responsory: r.responsory ? { text: r.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
  };
}

/** The full pool of readings available for `day` — every source that can
 * contribute (see this file's header): the user's own scripture-plan
 * readings, the office winner's and every commemorated saint's own
 * patristic/hagiographic/Gospel content, the plain temporal id's own
 * content (e.g. an ordinary Sunday's patristic commentary), and every
 * currently active octave's own reading. No source is pinned to a
 * particular nocturn — `distributeIntoNocturns` slots the whole pool
 * across however many nocturns the day's psalmody has, per the user's own
 * "assemble everything, then slot it in" instruction (2026-08), a
 * deliberate departure from this file's earlier "Nocturn 1 = plan,
 * Nocturns 2-3 = patristic" design. Order here is preserved by
 * `distributeIntoNocturns`, so it doubles as reading priority: the user's
 * own scripture reading first, then each id's authored content in its own
 * file order (patristic commentary typically precedes a Gospel+homily —
 * see data/propers/nocturn-readings/*.yml), then active octaves. */
function buildReadingPool(day: LiturgicalDay, temporalId: string, date: string): ResolvedPart[] {
  const parts: ResolvedPart[] = [];
  for (const r of getBiblePlanReadings(temporalId, day.weekday, date)) {
    parts.push({
      kind: 'lesson',
      text: { text: r.text, status: r.status, citation: r.citation },
      isGospel: r.isGospel,
      responsory: r.responsory ? { text: r.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
    });
  }
  for (const id of nocturnReadingIds(day, temporalId)) {
    for (const reading of getNocturnReadings(id)) {
      parts.push(nocturnReadingPart(reading));
    }
  }
  for (const octave of activeOctavesFor(date)) {
    const reading = getOctaveReading(octave.id, octave.dayNumber);
    if (reading) {
      parts.push({
        kind: 'lesson',
        text: { text: reading.text, status: reading.status },
        label: reading.source,
        isGospel: false,
        responsory: reading.responsory
          ? { text: reading.responsory, status: { la: 'verified', en: 'verified' } }
          : undefined,
      });
    }
  }
  return parts;
}

/** Splits `pool` across `nocturnCount` nocturns. A single nocturn takes the
 * whole pool. Three nocturns use a front-light, back-heavy split — Nocturn 1
 * gets exactly one reading, Nocturn 2 gets exactly one, and Nocturn 3
 * absorbs everything else, however many that is (user, 2026-08: "nocturn,
 * one reading, nocturn, one reading, nocturn, remaining readings") — a
 * deliberate departure from evenly chunking the pool, and from the
 * historical fixed lesson-count-per-nocturn scheme. Special case: a pool
 * with only one reading total puts it in Nocturn 3, not Nocturn 1 — a bare
 * single reading reads better closing the hour than opening it. */
function distributeIntoNocturns(pool: ResolvedPart[], nocturnCount: number): ResolvedPart[][] {
  if (nocturnCount === 1) return [pool];
  const chunks: ResolvedPart[][] =
    pool.length <= 1 ? [[], [], pool] : [[pool[0]!], [pool[1]!], pool.slice(2)];
  return chunks.map((chunk, i) => chunk.map((part) => ({ ...part, nocturn: i + 1 })));
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const winner = resolveOfficeWinner(day);
  const temporalId = resolveTemporalId(date);
  // Every Sunday, unconditionally, or a Duplex+ sanctoral winner — the
  // user's own chosen threshold (2026-08), not gated on whether any
  // content is actually authored yet, same "eligible, not content-gated"
  // convention every other per-feast override in this app already uses
  // (see hours/resolve-common.ts's getOfficeOverrideId).
  const threeNocturns = day.weekday === 'sunday' || isDoubleOrHigher(winner);
  const pool = buildReadingPool(day, temporalId, date);
  const [nocturn1Readings, nocturn2Readings, nocturn3Readings] = distributeIntoNocturns(pool, threeNocturns ? 3 : 1);

  // Tenebrae's real rubric: during the Sacred Triduum the whole opening
  // (versicle, Ps 3, Invitatory, hymn) is dropped, replaced by a silently-
  // said Pater/Ave/Credo — live-verified against both Monastic Tridentinum
  // 1617 and Divino Afflatu 1954 (Holy Thursday: "Invitatorium{omittitur}",
  // "Hymnus{omittitur}", no Ps 3 or versicle either). This app already
  // never renders that silent Pater/Ave/Credo elsewhere (see
  // data/hours/prime.yml's own header: dropped "to keep the hour
  // shorter"), so the fix here is a pure omission, not a new part kind.
  const parts: ResolvedPart[] = isInTriduum(day.date)
    ? []
    : [
        { kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) },
        plainPsalm(3),
        { kind: 'section-heading', label: 'Invitatory' },
        ...invitatoryParts(day),
        { kind: 'hymn', text: resolveMatinsHymn(day) },
      ];

  if (threeNocturns && day.weekday === 'sunday') {
    parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[0]}` });
    parts.push(...sundayPsalmNocturn(sundayAntiphons.nocturn1, day));
    parts.push(...(nocturn1Readings ?? []));
    parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[1]}` });
    parts.push(...sundayPsalmNocturn(sundayAntiphons.nocturn2, day));
    parts.push(...(nocturn2Readings ?? []));
    parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[2]}` });
    parts.push(...sundayCanticleNocturn(sundayAntiphons.nocturn3, day));
    parts.push(...(nocturn3Readings ?? []));
    parts.push({ kind: 'te-deum', text: resolveCommon('te-deum') });
  } else if (threeNocturns) {
    // A Duplex+ weekday feast — genuinely different psalmody from a real
    // Sunday's, not the same content reused. getMatinsPsalmodyOverride
    // itself does the proper -> Common -> (nothing) tiering; only the
    // final "nothing authored at all" tier — the plain ferial weekday
    // table, redistributed into 3 nocturns — lives here (see
    // hours/matins-psalmody-overrides.ts's own doc comment for the full
    // three-tier picture).
    const override = winner.kind === 'sanctoral' ? getMatinsPsalmodyOverride(winner.id) : undefined;
    if (override) {
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[0]}` });
      parts.push(...sundayPsalmNocturn(override.nocturn1, day));
      parts.push(...(nocturn1Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[1]}` });
      parts.push(...sundayPsalmNocturn(override.nocturn2, day));
      parts.push(...(nocturn2Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[2]}` });
      parts.push(...sundayCanticleNocturn(override.nocturn3, day));
      parts.push(...(nocturn3Readings ?? []));
    } else {
      const [n1, n2, n3] = ferialPsalmodyThreeNocturns(day);
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[0]}` });
      parts.push(...n1);
      parts.push(...(nocturn1Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[1]}` });
      parts.push(...n2);
      parts.push(...(nocturn2Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[2]}` });
      parts.push(...n3);
      parts.push(...(nocturn3Readings ?? []));
    }
    parts.push({ kind: 'te-deum', text: resolveCommon('te-deum') });
  } else {
    parts.push(...ferialAntiphonedNocturn(day));
    parts.push(...(nocturn1Readings ?? []));
    parts.push({ kind: 'chapter', text: resolveCommon('matins-capitulum-ferial') });
  }

  parts.push({ kind: 'prayer', text: getDayCollect(day) });

  // Conclusio: live-verified against Divinum Officium (Monastic Tridentinum
  // 1617) to be byte-identical to `lauds-conclusio` (Domine exaudi / Benedicamus
  // Domino / Fidelium animae) — same reuse Vespers already makes (see
  // data/hours/vespers.yml's own header). Not dropped in the Triduum: the
  // Triduum only omits the opening block (see isInTriduum comment above).
  parts.push({ kind: 'preces', text: resolveCommon('lauds-conclusio') });

  return { hourId: 'matins', date, parts, dayLabel: getDayLabel(day) };
}
