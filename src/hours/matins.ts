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
//     commemorated saint's own patristic/hagiographic/Gospel content, and
//     every active octave's own reading — is gathered into one ordered
//     pool (`buildReadingPool`), then slotted across however many
//     nocturns the day's psalmody has (`distributeIntoNocturns`), with no
//     reading kind pinned to a particular nocturn number. On a 3-nocturn
//     day the slotting is front-light: Nocturn 1 gets one reading,
//     Nocturn 2 gets one, and Nocturn 3 absorbs the rest of the pool,
//     however large (user, 2026-08) — not an even chunking of the pool. A
//     pool of only one reading total goes in Nocturn 3, not Nocturn 1.
//     The plain temporal day's own content (a governing Sunday's Moralia-
//     in-Job-style patristic homily and its responsory) is pooled only on
//     a real 3-nocturn day, not reused verbatim on the week's ferias
//     (user, 2026-09-01: a plain feria showing that Sunday's own
//     already-read homily and responsory read as a mechanism bug, not a
//     deliberate rereading) — a 1-nocturn feria draws only on its own
//     day's content (the reading plan, any saint/octave content specific
//     to that date).
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
import type { LiturgicalDay, DayWinner } from '../calendar/types';
import { resolveDay, resolveTemporalId, monthWeekId, activeOctavesFor, resolveActiveOctave, isAtLeast } from '../calendar';
import { isInTriduum } from '../calendar/temporal';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getPsalmsFor, type PsalmRef } from '../psalter/distribution';
import { getScriptureVerses } from '../scripture';
import { getOpeningVersicleId } from './opening-versicle';
import { isDoubleOrHigher, applyFlexaMark } from './antiphon';
import {
  resolveCommon,
  getDayCollect,
  getOfficeOverrideId,
  resolveOfficeWinner,
  seasonalOfficeSuffix,
  verifiedText,
  splitNamedAntiphon,
  openingAntiphon,
  substituteName,
} from './resolve-common';
import { getSaintRecord } from '../calendar/feasts';
import { getBiblePlanReadings } from '../propers/bible-plan';
import { getNocturnReadings, type NocturnReading } from '../propers/nocturn-readings';
import { getOctaveReading } from '../propers/octave-readings';
import { getMatinsSaintOverride, getMatinsCommonOverride, type MatinsPsalmodyScheme } from './matins-psalmody-overrides';
import matinsSundayAntiphonsData from '../data/hours/matins-sunday-antiphons.yml';
import matinsSundayNocturn3OverridesData from '../data/hours/matins-sunday-nocturn3-overrides.yml';
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

// Septuagesima through Palm Sunday inclusive: Nocturn III takes a
// per-Sunday antiphon (and, for some of these Sundays, its own canticles/
// versicle too) instead of the plain-season "Allelúja" default — see
// data/hours/matins-sunday-nocturn3-overrides.yml's own header.
type SundayNocturn3Overrides = Record<string, Partial<SundayNocturn>>;
const sundayNocturn3Overrides = matinsSundayNocturn3OverridesData as unknown as SundayNocturn3Overrides;

function sundayNocturn3For(temporalId: string | undefined): SundayNocturn {
  const base = sundayAntiphons.nocturn3;
  const override = temporalId ? sundayNocturn3Overrides[temporalId] : undefined;
  if (!override) return base;
  return {
    canticles: override.canticles ?? base.canticles,
    antiphon: override.antiphon ?? base.antiphon,
    versicle: override.versicle ?? base.versicle,
  };
}

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

/** `plainPsalm` plus the given antiphon, with the flexa mark (see
 * hours/antiphon.ts's `applyFlexaMark`) applied to the first verse against
 * that antiphon — a no-op when `antiphon` is undefined. */
function psalmPartWithAntiphon(number: number, rawAntiphon: ResolvedText | undefined): PsalmPart {
  const base = plainPsalm(number);
  const { verses, antiphon } = applyFlexaMark(base.verses, rawAntiphon);
  return { ...base, antiphon, verses };
}

function psalmRefParts(refs: PsalmRef[]): ResolvedPart[] {
  return refs.map((ref) => ({
    kind: 'psalm' as const,
    psalmNumber: ref.number,
    verses: getPsalmVerses(ref.number, ref.verses).map((v): ResolvedVerse => ({ n: v.n, text: v.text, status: v.status })),
  }));
}

/** The invitatory antiphon's own text — same override > Common-category >
 * seasonal > ferial precedence as `resolveMatinsHymn`, minus the octave
 * tier: no per-octave invitatory-antiphon override exists anywhere in the
 * reference source (unlike the hymn, which genuinely persists all week on
 * some octaves) — an octave day already falls through correctly to its
 * governing saint's own Common/season tier here, so adding an octave tier
 * would have nothing to fire on. Keeps the existing ferial fallback id
 * (`matins-invitatory-antiphon`) as-is rather than renaming it to match
 * the hymn's `-ferial` convention — it's already `verified` and its own
 * header already documents itself as the fallback-of-record; renaming
 * would be pure churn.
 *
 * Doubling (`isDoubleOrHigher`, via `openingAntiphon`) is a separate, final
 * step applied to whichever tier's text wins here — never part of content
 * selection itself. */
function resolveMatinsInvitatoryText(day: LiturgicalDay): ResolvedText {
  const overrideId = getOfficeOverrideId(day);
  if (overrideId) {
    const proper = resolveCommon(`matins-invitatory-${overrideId}`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
  }
  const winner = resolveOfficeWinner(day);
  const saint = winner.kind === 'sanctoral' ? getSaintRecord(winner.id) : undefined;
  const commonId = saint?.common;
  if (commonId) {
    const common = resolveCommon(`matins-invitatory-${commonId}`);
    if (common.status.la !== 'missing' || common.status.en !== 'missing') {
      // Common-of-a-Holy-Woman's own invitatory antiphon is a name
      // template ("beátæ N..") -- the only Common invitatory antiphon
      // currently in use that needs one (see matins-invitatory-common-
      // of-a-holy-woman.yml's own header). Same substituteName idiom
      // getDayCollect already uses for collectCommon/collectName.
      return saint?.invitatoryName ? substituteName(common, saint.invitatoryName) : common;
    }
  }
  const seasonSuffix = seasonalOfficeSuffix(day.season);
  if (seasonSuffix) {
    const seasonal = resolveCommon(`matins-invitatory-${seasonSuffix}`);
    if (seasonal.status.la !== 'missing' || seasonal.status.en !== 'missing') {
      return seasonal;
    }
  }
  return resolveCommon('matins-invitatory-antiphon');
}

/** The Invitatory (Ps 94) — real practice interleaves its antiphon as a
 * repeating refrain between verse groups; per direct instruction this app
 * frames it like any other psalm antiphon instead (one opening, one full
 * repeat after) — see data/propers/common/matins-invitatory-antiphon.yml's
 * own header. */
function invitatoryParts(day: LiturgicalDay): ResolvedPart[] {
  const text = resolveMatinsInvitatoryText(day);
  const opening = openingAntiphon(text, resolveOfficeWinner(day));
  const { full } = splitNamedAntiphon(text);
  return [
    psalmPartWithAntiphon(94, opening),
    { kind: 'antiphon', text: full },
  ];
}

/** Sunday's fixed 12-psalm psalmody for Nocturns 1-2 (Ps 20-31, 3
 * antiphons per nocturn each framing a pair of psalms) — see
 * data/hours/matins-sunday-antiphons.yml's own header for sourcing. */
function sundayPsalmNocturn(group: SundayNocturn, day: LiturgicalDay): ResolvedPart[] {
  const parts: ResolvedPart[] = [];
  for (const g of group.groups ?? []) {
    const antiphonText = verifiedText(g.antiphon);
    const opening = openingAntiphon(antiphonText, resolveOfficeWinner(day));
    const { full } = splitNamedAntiphon(antiphonText);
    g.psalms.forEach((n, i) => {
      parts.push(psalmPartWithAntiphon(n, i === 0 ? opening : undefined));
    });
    parts.push({ kind: 'antiphon', text: full });
  }
  parts.push({ kind: 'versicle', text: versicleText(group.versicle) });
  return parts;
}

/** Nocturn 3's 3 fixed OT canticles under one shared antiphon — see
 * data/hours/matins-sunday-antiphons.yml's own header. */
function sundayCanticleNocturn(group: SundayNocturn, day: LiturgicalDay): ResolvedPart[] {
  const antiphonText = verifiedText(group.antiphon ?? {});
  const opening = openingAntiphon(antiphonText, resolveOfficeWinner(day));
  const { full } = splitNamedAntiphon(antiphonText);
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
 * when authored; else, on a day within an active octave whose own feast
 * has a hymn authored, that octave's hymn (`matins-hymn-${octave.id}`) —
 * see below; else the winner's Common-of-Saints hymn (`matins-hymn-
 * ${commonId}`, via `SaintRecord.common`, e.g. "Aeterna Christi munera"
 * for any Apostle with no proper hymn of his own — same category-lookup
 * pattern as matins-psalmody-overrides.ts's getMatinsPsalmodyOverride);
 * else falls to a *seasonal* default (Advent/Lent/Passiontide/
 * Paschaltide, none authored yet), else the plain year-round ferial hymn —
 * override > octave > Common > season > ferial. Common slots between
 * octave and season: an octave's own proper hymn is more specific than any
 * Common and must keep winning; a Common-of-Saints hymn is more specific
 * than a bare season and must win over it.
 *
 * Concrete motivating case (user, 2026-08-21/22): the Assumption's octave
 * (`Sancti/08-21bmv.txt`'s own `[Rule] ex Sancti/08-15`) genuinely keeps
 * the feast's own proper hymn all week — a claim this comment already
 * made before the octave tier below actually existed, which only ever
 * fired on Aug 15 itself (the one day `overrideId` literally *is*
 * `assumption`). Every other octave day (16, 17, 19, 20, 21, each with
 * its own named saint who has no Matins hymn of their own authored) fell
 * straight through to the plain ferial hymn instead. This is a deliberate
 * departure from the reference engine, which doesn't do this either
 * (Monastic 1617's own octave days have no `[Hymnus Matutinum]` override
 * at all, live-checked 2026-08-22) — not a restoration of source
 * behavior, just this project's own generous octave design (see
 * "Not a reconstruction" in the repo's CLAUDE.md) applied to the hymn the
 * same way it's already applied to readings/commemorations elsewhere. */
function resolveMatinsHymn(day: LiturgicalDay): ResolvedText {
  const overrideId = getOfficeOverrideId(day);
  if (overrideId) {
    const proper = resolveCommon(`matins-hymn-${overrideId}`);
    if (proper.status.la !== 'missing' || proper.status.en !== 'missing') {
      return proper;
    }
  }
  const octave = resolveActiveOctave(day.date);
  if (octave) {
    const octaveHymn = resolveCommon(`matins-hymn-${octave.id}`);
    if (octaveHymn.status.la !== 'missing' || octaveHymn.status.en !== 'missing') {
      return octaveHymn;
    }
  }
  // Common-of-Saints tier (2026-08): a winning saint with no proper hymn of
  // his own (most of them) still often shares a real, generic hymn with
  // every other saint of his Common (e.g. "Aeterna Christi munera" for any
  // Apostle) — same getSaintRecord(id)?.common lookup already proven by
  // matins-psalmody-overrides.ts's getMatinsPsalmodyOverride. Keyed off the
  // actual winner, not `overrideId` above: `getOfficeOverrideId` only
  // returns an id for duplex-majus+ winners (an eligibility gate for the
  // per-saint-proper tier), so reusing it here would silently skip this
  // tier for any lower-ranked sanctoral winner.
  const winner = resolveOfficeWinner(day);
  const commonId = winner.kind === 'sanctoral' ? getSaintRecord(winner.id)?.common : undefined;
  if (commonId) {
    const commonHymn = resolveCommon(`matins-hymn-${commonId}`);
    if (commonHymn.status.la !== 'missing' || commonHymn.status.en !== 'missing') {
      return commonHymn;
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
  const winner = resolveOfficeWinner(day);
  const parts: ResolvedPart[] = [];
  for (const group of nocturn.groups) {
    const antiphonText = verifiedText(group.antiphon);
    const opening = openingAntiphon(antiphonText, winner);
    const { full } = splitNamedAntiphon(antiphonText);
    group.psalms.forEach((ref, i) => {
      const rawVerses = getPsalmVerses(ref.number, ref.verses).map((v): ResolvedVerse => ({ n: v.n, text: v.text, status: v.status }));
      const { verses, antiphon } = applyFlexaMark(rawVerses, i === 0 ? opening : undefined);
      parts.push({
        kind: 'psalm',
        psalmNumber: ref.number,
        verses,
        antiphon,
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
 * entry authored for its winner yet: the plain ferial weekday table,
 * chunked into 3 nocturns instead of 1. Bare (no antiphons, no canticles)
 * when `common` isn't given — genuinely nothing authored at all for this
 * winner, still used as-is for a duplex-majus+ winner with no Common
 * category either.
 *
 * When `common`/`commonId` *are* given (a duplex-rank winner whose Common
 * category exists — user, 2026-08), each nocturn borrows that category's
 * own `nocturn{N}.versicle`: the ferial table only ever authors one
 * versicle for the whole (normally 1-nocturn) day, so a 3-nocturn split
 * leaves 2 of the 3 nocturns with none at all — Common's own 3 real
 * versicles are an exact fit for that gap.
 *
 * For the antiphon: Common's own Matins Nocturn 1/2 are 6 individual
 * per-psalm antiphons each written as a paraphrase of *that* psalm's own
 * opening words (e.g. Ps 4's "Invocántem exaudívit Dóminus" echoing Ps 4's
 * own "Cum invocárem exaudívit me") — laid over a *different* ferial psalm
 * they'd misquote it, so they can't be borrowed. Instead, each nocturn
 * gets `SaintRecord.minorHoursCommon`'s own Terce/Sext/None antiphon
 * (`{terce,sext,none}-antiphon-${minorHoursCommon}`) — the same per-saint
 * field `resolveMinorHourAntiphon` itself uses, deliberately distinct
 * from `common` (a saint's minor-hour Common category isn't always the
 * same as their overall one — see `SaintRecord`'s own doc comment).
 * Real, verified, and already proven non-psalm-specific by the minor hours themselves (3
 * ferial psalms of arbitrary content under one thematic antiphon,
 * live-verified against the reference engine at any rank). Terce/Sext/
 * None each carry their own distinct text per category (confirmed,
 * 2026-08-27), so this gives Nocturns 1/2/3 three genuinely different
 * real antiphons instead of one borrowed Nocturn-3-only text — user,
 * 2026-08-27: "some antiphons from the feria and some from the commons
 * feels off... use those antiphons, one per nocturn." Falls back to bare
 * (no antiphon) per nocturn when that particular hour+category combo
 * isn't authored yet (most minor-hour Common files only cover a handful
 * of categories so far) — never a mismatched substitute. */
function ferialPsalmodyThreeNocturns(
  day: LiturgicalDay,
  common?: MatinsPsalmodyScheme,
  commonId?: string,
): [ResolvedPart[], ResolvedPart[], ResolvedPart[]] {
  const refs = getPsalmsFor('matins', day.weekday);
  const size = Math.ceil(refs.length / 3);
  const refChunks: [PsalmRef[], PsalmRef[], PsalmRef[]] = [
    refs.slice(0, size),
    refs.slice(size, size * 2),
    refs.slice(size * 2),
  ];
  if (!common) {
    return refChunks.map((chunk) => psalmRefParts(chunk)) as [ResolvedPart[], ResolvedPart[], ResolvedPart[]];
  }
  const winner = resolveOfficeWinner(day);
  const nocturnVersicles = [common.nocturn1.versicle, common.nocturn2.versicle, common.nocturn3.versicle];
  const minorHours = ['terce', 'sext', 'none'] as const;
  return refChunks.map((chunk, i) => {
    const antiphonText = commonId ? resolveCommon(`${minorHours[i]}-antiphon-${commonId}`) : undefined;
    const authored = antiphonText && (antiphonText.status.la !== 'missing' || antiphonText.status.en !== 'missing');
    const psalms = authored ? withSingleAntiphon(chunk, antiphonText!, winner) : psalmRefParts(chunk);
    return [...psalms, { kind: 'versicle', text: versicleText(nocturnVersicles[i]!) }];
  }) as [ResolvedPart[], ResolvedPart[], ResolvedPart[]];
}

/** Wraps a flat list of psalm refs in one opening/closing antiphon — the
 * shape `sundayCanticleNocturn` already uses for its own single antiphon
 * over several canticles, reused here for `ferialPsalmodyThreeNocturns`'s
 * borrowed Terce/Sext/None antiphon over ferial psalms. */
function withSingleAntiphon(refs: PsalmRef[], antiphonText: ResolvedText, winner: DayWinner): ResolvedPart[] {
  const opening = openingAntiphon(antiphonText, winner);
  const { full } = splitNamedAntiphon(antiphonText);
  const parts: ResolvedPart[] = [];
  refs.forEach((ref, i) => {
    const rawVerses = getPsalmVerses(ref.number, ref.verses).map((v): ResolvedVerse => ({ n: v.n, text: v.text, status: v.status }));
    const { verses, antiphon: partAntiphon } = applyFlexaMark(rawVerses, i === 0 ? opening : undefined);
    parts.push({ kind: 'psalm', psalmNumber: ref.number, verses, antiphon: partAntiphon });
  });
  parts.push({ kind: 'antiphon', text: full });
  return parts;
}

/** Every id whose own patristic/hagiographic/Gospel content should be
 * gathered for `day` — the office winner (if sanctoral), every
 * commemorated saint (a transferred-in feast already appears as `day.winner`
 * once `resolveDay` has applied the transfer, so it needs no separate
 * lookup here), and — only on a real 3-nocturn day (Sunday, or a Duplex+
 * feast) — the plain temporal id itself (that Sunday's own Moralia-in-
 * Job-style commentary) plus, for dates from the 1st Sunday of August
 * through the eve of Advent, the calendar-month/week id (`month-week-<id>`,
 * calendar/month-week-id.ts's monthWeekId): the real historical Nocturn 2
 * for the later post-Pentecost Sundays is keyed by civil calendar month,
 * not Easter offset (see that function's own header for why), so it's
 * pooled here as a second, independent source alongside `temporalId`.
 * Restricting both to `threeNocturns` (user, 2026-09-01 bug report: a
 * plain Tuesday's Matins was reusing the governing Sunday's own Nocturn 3
 * homily *and* its responsory verbatim) — a ferial 1-nocturn day now only
 * draws on its own day's content (the user's scripture-plan reading, any
 * saint/octave content specific to that date), not the Sunday's own
 * already-read homiletic material. */
function nocturnReadingIds(day: LiturgicalDay, temporalId: string, date: string, threeNocturns: boolean): string[] {
  const ids = new Set<string>();
  // Not gated to `kind === 'sanctoral'` -- a named temporal override (e.g.
  // Immaculate Heart of Mary, calendar/movable-feasts.ts's applyMovableFeasts)
  // has its own authored nocturn-readings file keyed by its own id too,
  // distinct from the plain governing-Sunday `temporalId` gated below. But
  // on a plain ordinary feria `day.winner.id` *is* that same governing-
  // Sunday `temporalId` (the temporal cycle IS the winner), so it must go
  // through the same `threeNocturns` gate rather than being added
  // unconditionally.
  if (day.winner.kind === 'sanctoral' || day.winner.id !== temporalId || threeNocturns) {
    ids.add(day.winner.id);
  }
  for (const c of day.commemorations) {
    // Same reasoning as day.winner.id just above.
    if (c.kind === 'sanctoral' || (c.kind === 'temporal' && (c.id !== temporalId || threeNocturns))) ids.add(c.id);
  }
  // The plain temporalId/month-week content is the *governing Sunday's own*
  // Nocturn 2/3 patristic material, real content for that Sunday itself —
  // only pooled on a real 3-nocturn day, and (as before) only when the
  // day's own occurrence decision (calendar/commemorations.ts's
  // decideOccurrence) actually retained the temporal identity in some form:
  // the temporal cycle won outright (day.winner.kind === 'temporal' -- a
  // plain Sunday, or a named temporal override like Christ the King), or it
  // survives as a commemoration alongside a sanctoral winner. Excluded:
  // decideOccurrence's `ordinary-feria` branch, where a real feast --
  // however low-ranked -- wins with zero commemorations, correctly
  // suppressing the temporal identity entirely (e.g. St. Bartholomew,
  // duplex-2-classis, 2026-08-24 -- his own proper reading has no Nocturn
  // 3 content, and without this gate the leftover 13th-Sunday-after-
  // Pentecost/month-week content wrongly filled Nocturn 3 instead).
  const temporalKept =
    threeNocturns && (day.winner.kind === 'temporal' || day.commemorations.some((c) => c.kind === 'temporal'));
  if (temporalKept) {
    ids.add(temporalId);
    const monthWeek = monthWeekId(date);
    if (monthWeek) ids.add(`month-week-${monthWeek}`);
  }
  return [...ids];
}

function nocturnReadingPart(r: NocturnReading): ResolvedPart {
  return {
    kind: 'lesson',
    text: { text: r.text, status: r.status, citation: r.citation },
    label: r.source,
    responsory: r.responsory ? { text: r.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
  };
}

/** Builds a single atomic 'gospel' pool entry from a Gospel-flagged
 * NocturnReading, folding in `homily` (the immediately following reading in
 * the same array, when it's a genuine separate homily on this pericope —
 * see `buildReadingPool`'s own pairing check) as a nested field rather than
 * a second pool entry. This is what makes the pairing structural: a single
 * ResolvedPart can't be split across two nocturns by `distributeIntoNocturns`,
 * whereas two adjacent pool entries could be (and, before this, sometimes
 * were). */
function gospelReadingPart(r: NocturnReading, homily: NocturnReading | undefined): ResolvedPart {
  return {
    kind: 'gospel',
    text: { text: r.text, status: r.status, citation: r.citation },
    source: r.source,
    responsory: r.responsory ? { text: r.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
    homily: homily
      ? { source: homily.source, text: { text: homily.text, status: homily.status, citation: homily.citation } }
      : undefined,
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
function buildReadingPool(day: LiturgicalDay, temporalId: string, date: string, threeNocturns: boolean): ResolvedPart[] {
  const parts: ResolvedPart[] = [];
  for (const r of getBiblePlanReadings(temporalId, day.weekday, date)) {
    const responsory = r.responsory ? { text: r.responsory, status: { la: 'verified' as const, en: 'verified' as const } } : undefined;
    // The user's own reading plan never pairs a Gospel with a homily (see
    // this file's own header) — a bare pericope, still its own 'gospel'
    // kind so it gets the same distinguishing UI treatment as a proper
    // Gospel+homily.
    parts.push(
      r.isGospel
        ? { kind: 'gospel', text: { text: r.text, status: r.status, citation: r.citation }, responsory }
        : { kind: 'lesson', text: { text: r.text, status: r.status, citation: r.citation }, responsory },
    );
  }
  // Grouped by the reading's own `nocturn` tag (ascending), not by which id
  // contributed it — a later post-Pentecost Sunday's Nocturn 2 now comes
  // from a different source (the month-week id) than its Nocturn 3 (its own
  // temporalId file), and pooling in plain id order would put that Nocturn
  // 3 content ahead of the Nocturn 2 content supplied by a later-processed
  // id. Within each nocturn-number group, id order (and each file's own
  // reading order) is preserved, matching this pool's usual priority rule.
  // Not hardcoded to [2, 3]: Ember days' own nocturn-readings files use
  // `nocturn: 1` (their single-nocturn structure), so every tag present
  // must be handled, not just the usual Sunday/feast pair.
  const ids = nocturnReadingIds(day, temporalId, date, threeNocturns);
  const byNocturn = new Map<number, ResolvedPart[]>();
  for (const id of ids) {
    const readings = getNocturnReadings(id);
    for (let i = 0; i < readings.length; i++) {
      const reading = readings[i]!;
      const bucket = byNocturn.get(reading.nocturn) ?? [];
      if (reading.isGospel) {
        // A genuine separate homily on this pericope is the very next
        // reading in the same file, in the same nocturn, not itself flagged
        // as a Gospel — the established authoring convention (see
        // src/propers/nocturn-readings.ts's own header and this file's
        // 'gospel' ResolvedPart doc comment). When found, fold it in and
        // skip it as its own pool entry so the pair can never be split
        // apart by distributeIntoNocturns.
        const next = readings[i + 1];
        const homily = next && !next.isGospel && next.nocturn === reading.nocturn ? next : undefined;
        bucket.push(gospelReadingPart(reading, homily));
        if (homily) i++;
      } else {
        bucket.push(nocturnReadingPart(reading));
      }
      byNocturn.set(reading.nocturn, bucket);
    }
  }
  for (const nocturnNumber of [...byNocturn.keys()].sort((a, b) => a - b)) {
    parts.push(...byNocturn.get(nocturnNumber)!);
  }
  for (const octave of activeOctavesFor(date)) {
    const reading = getOctaveReading(octave.id, octave.dayNumber);
    if (reading) {
      parts.push({
        kind: 'lesson',
        text: { text: reading.text, status: reading.status },
        label: reading.source,
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
  const pool = buildReadingPool(day, temporalId, date, threeNocturns);
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
    parts.push(...sundayCanticleNocturn(sundayNocturn3For(temporalId), day));
    parts.push(...(nocturn3Readings ?? []));
    parts.push({ kind: 'te-deum', text: resolveCommon('te-deum') });
    parts.push({ kind: 'versicle', text: resolveCommon('te-decet-laus') });
  } else if (threeNocturns) {
    // A Duplex+ weekday feast — genuinely different psalmody from a real
    // Sunday's, not the same content reused.
    //   - Saint-specific proper: use its own full scheme, any rank.
    //   - No proper, rank duplex-majus+: Common's own full scheme (own
    //     psalm numbers, canticles) if authored; else the fully bare
    //     ferialPsalmodyThreeNocturns stand-in. Unaffected by the
    //     duplex-and-below carve-out below (user, 2026-08).
    //   - No proper, rank exactly duplex (the floor of 3-nocturn
    //     eligibility): ferial psalm numbers, not Common's own — but
    //     Common's per-nocturn versicle, and each nocturn's own Terce/
    //     Sext/None antiphon for that category, if authored (see
    //     ferialPsalmodyThreeNocturns's own doc comment for why those
    //     three, not Common's own Matins Nocturn antiphons).
    const properOverride = winner.kind === 'sanctoral' ? getMatinsSaintOverride(winner.id) : undefined;
    const isAboveDuplex = winner.kind === 'sanctoral' && isAtLeast(winner.rank, 'duplex-majus');
    const commonOverride = winner.kind === 'sanctoral' && !properOverride ? getMatinsCommonOverride(winner.id) : undefined;
    if (properOverride) {
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[0]}` });
      parts.push(...sundayPsalmNocturn(properOverride.nocturn1, day));
      parts.push(...(nocturn1Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[1]}` });
      parts.push(...sundayPsalmNocturn(properOverride.nocturn2, day));
      parts.push(...(nocturn2Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[2]}` });
      parts.push(...sundayCanticleNocturn(properOverride.nocturn3, day));
      parts.push(...(nocturn3Readings ?? []));
    } else if (isAboveDuplex && commonOverride) {
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[0]}` });
      parts.push(...sundayPsalmNocturn(commonOverride.nocturn1, day));
      parts.push(...(nocturn1Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[1]}` });
      parts.push(...sundayPsalmNocturn(commonOverride.nocturn2, day));
      parts.push(...(nocturn2Readings ?? []));
      parts.push({ kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[2]}` });
      parts.push(...sundayCanticleNocturn(commonOverride.nocturn3, day));
      parts.push(...(nocturn3Readings ?? []));
    } else {
      const commonId = !isAboveDuplex && winner.kind === 'sanctoral' ? getSaintRecord(winner.id)?.minorHoursCommon : undefined;
      const [n1, n2, n3] = ferialPsalmodyThreeNocturns(day, isAboveDuplex ? undefined : commonOverride, commonId);
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
    parts.push({ kind: 'versicle', text: resolveCommon('te-decet-laus') });
  } else {
    parts.push(...ferialAntiphonedNocturn(day));
    parts.push(...(nocturn1Readings ?? []));
    parts.push({ kind: 'chapter', text: resolveCommon('matins-capitulum-ferial') });
  }

  // Short litany (Kyrie eleison x3) + Pater noster, reusing the same fixed
  // block Lauds/Vespers use (`lauds-short-litany`) rather than a Matins-named
  // duplicate. Unlike Lauds' and Vespers' own preces, this is unconditional
  // here — no ferial/Sunday swap, never omitted — per the user's explicit
  // choice for Matins.
  parts.push({ kind: 'preces', text: resolveCommon('lauds-short-litany') });

  parts.push({ kind: 'prayer', text: getDayCollect(day) });

  // Conclusio: live-verified against Divinum Officium (Monastic Tridentinum
  // 1617) to be byte-identical to `lauds-conclusio` (Domine exaudi / Benedicamus
  // Domino / Fidelium animae) — same reuse Vespers already makes (see
  // data/hours/vespers.yml's own header). Not dropped in the Triduum: the
  // Triduum only omits the opening block (see isInTriduum comment above).
  parts.push({ kind: 'preces', text: resolveCommon('lauds-conclusio') });

  return { hourId: 'matins', date, parts, dayLabel: getDayLabel(day) };
}
