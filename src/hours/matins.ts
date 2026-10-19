// Matins — the last hour built in this project, and structurally the most
// different from every other one (see this file's own history in TODO.md).
// Builds its ordo programmatically per day rather than resolving a static
// `data/hours/matins.yml` parts list the way every other hour does, because
// the real shape (1 nocturn on a plain ferial day vs. 3 on a Sunday or a
// Semiduplex+ feast, with a *variable* number of readings) doesn't fit
// that pattern.
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
//     common elsewhere), so this exclusion falls out of the
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
import {
  resolveDay,
  resolveTemporalId,
  monthWeekId,
  activeOctavesFor,
  isAtLeast,
} from '../calendar';
import { isInTriduum } from '../calendar/temporal';
import { getDayLabel, emberDayLabel, temporalLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getPsalmsFor, type PsalmRef } from '../psalter/distribution';
import { getScriptureVerses } from '../scripture';
import { getOpeningVersicleId } from './opening-versicle';
import { getHymnDoxologyOverrideId } from './hymn-doxology';
import { applyFlexaMark } from './antiphon';
import {
  resolveCommon,
  substituteDoxology,
  getDayCollect,
  resolveOfficeWinner,
  seasonalOfficeSuffix,
  verifiedText,
  splitNamedAntiphon,
  openingAntiphon,
  substituteName,
  officeWinnerEffectiveRank,
  resolveMinorHourAntiphonCandidates,
} from './resolve-common';
import { getSaintRecord } from '../calendar/feasts';
import { lookupPart, lookupPartTiered } from './resolve-part';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { getBiblePlanReadings } from '../propers/bible-plan';
import { getNocturnReadings, type NocturnReading } from '../propers/nocturn-readings';
import { getOctaveReading } from '../propers/octave-readings';
import { getResponsoryForCommon } from '../propers/matins-responsories';
import { getGospelIncipitFromCitation, getScriptureIncipitFromCitation } from '../propers/bible-book-incipits';
import { getMatinsSaintOverride, getMatinsCommonOverride, getMatinsPsalmodyOverride, type MatinsPsalmodyScheme } from './matins-psalmody-overrides';
import { sharedOfficeId } from './office-source';
import matinsSundayAntiphonsData from '../data/hours/matins-sunday-antiphons.yml';
import matinsSundayNocturn3OverridesData from '../data/hours/matins-sunday-nocturn3-overrides.yml';
import matinsSundayAdventOverridesData from '../data/hours/matins-sunday-advent-nocturn-overrides.yml';
import matinsSundayPaschaltideOverridesData from '../data/hours/matins-sunday-paschaltide-nocturn-overrides.yml';
import matinsSundayNamedOverridesData from '../data/hours/matins-sunday-named-nocturn-overrides.yml';
import matinsFerialAntiphonsData from '../data/hours/matins-ferial-antiphons.yml';
import matinsFerialNamedOverridesData from '../data/hours/matins-ferial-named-antiphon-overrides.yml';
import type { Weekday } from '../calendar/types';
import { isAllSouls, buildMatinsParts } from './all-souls';

type BilingualText = Partial<Record<string, string>>;
type TextStatus = Partial<Record<string, 'verified' | 'draft' | 'missing'>>;
interface SundayGroup {
  psalms: number[];
  antiphon: BilingualText;
  /** Per-language status of `antiphon`; absent means verified. */
  status?: TextStatus;
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
  /** Per-language status of `antiphon` (Nocturn 3's shared one); absent means verified. */
  antiphonStatus?: TextStatus;
  versicle: { v: BilingualText; r: BilingualText; status?: TextStatus };
}
interface MatinsSundayAntiphons {
  nocturn1: SundayNocturn;
  nocturn2: SundayNocturn;
  nocturn3: SundayNocturn;
}
const sundayAntiphons = matinsSundayAntiphonsData as unknown as MatinsSundayAntiphons;

// Septuagesima through Palm Sunday inclusive: Nocturn III takes a
// per-Sunday antiphon (and, for some of these Sundays, its own canticles/
// versicle too) instead of the plain-season "Allelúia" default — see
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

// Advent's and ordinary-Paschaltide's own Nocturns I-III overrides, each
// applied uniformly across every Sunday of the season (unlike
// sundayNocturn3Overrides above, which is keyed per-distinct-Sunday for
// Septuagesima-Palm) — see matins-sunday-advent-nocturn-overrides.yml's
// and matins-sunday-paschaltide-nocturn-overrides.yml's own headers.
// Paschaltide here means only `eastertide` (Low Sunday through the Sunday
// before Ascension) — Easter Sunday itself has its own wholly proper
// Matins (a separate, tabled gap; see TODO.md's "Easter's own octave").
// `ascensiontide`'s one Sunday (within the Octave of Ascension) has its
// own genuinely proper content too, but a *different* psalm scheme
// entirely (not a seasonal overlay on the fixed 12-psalm base) — handled
// by the per-temporalId `sundayNamedOverrides` below instead.
interface MatinsSundayNocturnOverrides {
  nocturn1: Partial<SundayNocturn>;
  nocturn2: Partial<SundayNocturn>;
  nocturn3: Partial<SundayNocturn>;
}
const sundayAdventOverrides = matinsSundayAdventOverridesData as unknown as MatinsSundayNocturnOverrides;
const sundayPaschaltideOverrides = matinsSundayPaschaltideOverridesData as unknown as MatinsSundayNocturnOverrides;

// A specific privileged Sunday whose own proper is wholesale different
// from the fixed 12-psalm/3-canticle scheme, keyed by `temporalId` — see
// matins-sunday-named-nocturn-overrides.yml's own header (currently
// `sunday-after-ascension` and `easter-sunday`). Checked ahead of the
// season-wide overrides above, though in practice they never collide (no
// season-wide override exists for `ascensiontide`).
//
// `weekdays` (2026-09-02): optional, for a `temporalId` that spans more
// calendar days than actually share this content — e.g. `easter-sunday`
// is the winner id for the *whole* Easter Octave (all 6 weekdays), but
// only Sunday/Monday/Tuesday of it are live-verified to share this exact
// proper; Wednesday-Saturday have their own different (not yet authored)
// antiphons. Omitted entirely (as `sunday-after-ascension` does) means
// "every day carrying this temporalId" — the common case for a temporal
// override whose id already maps to exactly one calendar day.
interface MatinsSundayNamedOverride extends Partial<MatinsSundayNocturnOverrides> {
  weekdays?: Weekday[];
}
const sundayNamedOverrides = matinsSundayNamedOverridesData as unknown as Record<string, MatinsSundayNamedOverride>;

/** Sunday Nocturn I/II/III content for a given day — a per-temporalId
 * named override (a specific privileged Sunday's own wholesale-different
 * proper) takes precedence over a season-wide override (Advent or
 * ordinary Paschaltide, all three nocturns), which takes precedence over
 * the plain-season default; Nocturn III additionally checks the
 * per-Sunday Septuagesima-Palm override (`sundayNocturn3For`) when none
 * of the above apply (none of the four ever overlap). */
function sundayNocturnFor(nocturnKey: 'nocturn1' | 'nocturn2' | 'nocturn3', day: LiturgicalDay, temporalId: string | undefined): SundayNocturn {
  const base = nocturnKey === 'nocturn3' ? sundayNocturn3For(temporalId) : sundayAntiphons[nocturnKey];
  const namedOverride = temporalId ? sundayNamedOverrides[temporalId]?.[nocturnKey] : undefined;
  if (namedOverride) {
    return {
      groups: namedOverride.groups ?? base.groups,
      canticles: namedOverride.canticles ?? base.canticles,
      antiphon: namedOverride.antiphon ?? base.antiphon,
      versicle: namedOverride.versicle ?? base.versicle,
    };
  }
  const seasonOverrides = day.season === 'advent' ? sundayAdventOverrides : day.season === 'eastertide' ? sundayPaschaltideOverrides : undefined;
  const override = seasonOverrides?.[nocturnKey];
  if (!override) return base;
  return {
    groups: override.groups ?? base.groups,
    canticles: override.canticles ?? base.canticles,
    antiphon: override.antiphon ?? base.antiphon,
    versicle: override.versicle ?? base.versicle,
  };
}

interface FerialGroup {
  psalms: PsalmRef[];
  antiphon: BilingualText;
}
interface FerialNocturn {
  groups: FerialGroup[];
}
type MatinsFerialAntiphons = Record<Exclude<Weekday, 'sunday'>, FerialNocturn>;
const ferialAntiphons = matinsFerialAntiphonsData as unknown as MatinsFerialAntiphons;

// Ferial-side counterpart to `MatinsSundayNamedOverride` — a temporal id
// whose own real antiphons should replace the plain per-weekday default
// in the 1-nocturn branch, reused as-is across however many weekdays
// `weekdays` names (own psalm numbers per weekday unchanged, only the
// antiphon layer swaps) rather than authored per-weekday — see
// matins-ferial-named-antiphon-overrides.yml's own header.
interface FerialNamedOverride {
  weekdays: Weekday[];
  antiphons: BilingualText[];
}
const ferialNamedOverrides = matinsFerialNamedOverridesData as unknown as Record<string, FerialNamedOverride>;

const NOCTURN_NUMERAL = ['I', 'II', 'III'] as const;

/** Combines a versicle's V. and R. lines into one rendered block — every
 * nocturn versicle in this file goes through this (previously
 * `sundayPsalmNocturn`/`sundayCanticleNocturn` only rendered the V. line,
 * silently dropping the responsory; fixed here, 2026-08-21). */
function versicleText(versicle: { v: BilingualText; r: BilingualText; status?: TextStatus }): ResolvedText {
  return withStatus(
    {
      la: `V. ${versicle.v.la}\nR. ${versicle.r.la}`,
      en: `V. ${versicle.v.en}\nR. ${versicle.r.en}`,
    },
    versicle.status,
  );
}

/** `verifiedText`, except any language named in `status` takes that
 * status instead -- how an authored override marks a self-translated
 * (`draft`) line without a separate file. */
function withStatus(text: BilingualText, status: TextStatus | undefined): ResolvedText {
  const base = verifiedText(text);
  if (!status) return base;
  const merged: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = { ...base.status };
  for (const lang of Object.keys(text)) {
    merged[lang] = status[lang] ?? 'verified';
  }
  return { text, status: merged };
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
    verseRange: ref.verses,
  }));
}

/** The invitatory antiphon's own text — same override > octave > Common-
 * category > seasonal > ferial precedence as `resolveMatinsHymn`. The
 * octave tier was originally omitted here on the reasoning that no
 * per-octave invitatory-antiphon override exists anywhere in the
 * reference source and an octave day already falls through correctly to
 * its governing saint's own Common/season tier — true for an *ordinary*
 * within-octave day, which reuses the original feast's own record as its
 * winner. It's false for an octave's own literal *closing* day, which is
 * a wholly separate sanctoral record with its own id (e.g. `all-saints`'s
 * `octave-of-all-saints`, Nov 8) and a fake `proper-to-*` `common` — that
 * record's own override lookup misses, there's no real Common to fall
 * back to, and it used to land on the plain ferial default instead of the
 * original feast's genuine proper invitatory (live-verified live-CGI
 * mismatch, 2026-09-06). Restored to match `resolveMatinsHymn`'s tier
 * exactly, since the underlying gap was the same shape.
 * Keeps the existing ferial fallback id (`matins-invitatory-antiphon`) as-
 * is rather than renaming it to match the hymn's `-ferial` convention —
 * it's already `verified` and its own header already documents itself as
 * the fallback-of-record; renaming would be pure churn.
 *
 * The octave tier itself has two different jobs depending on who already
 * won the day, and is gated accordingly (2026-09-13 fix): when a real
 * saint already won outright (`day.winner.kind === 'sanctoral'` — e.g.
 * St. Joachim, Aug 16, within both St. Lawrence's and the Assumption's
 * octaves), the octave's own invitatory is a pure bonus fallback for a
 * winner with no invitatory of his own, same as always, via a raw
 * `resolveActiveOctave` — the Sunday already lost this day at the
 * sanctoral-vs-Sunday layer, long before any octave question, so there's
 * nothing left to protect. But when nothing else contends
 * (`day.winner.kind === 'temporal'`), the octave tier is instead deciding
 * whether to synthesize a fake winner *from* the octave in the first
 * place — that's `octaveGoverningPrivilegedDay`'s own question, with its
 * own Sunday/mid-octave carve-out, not an unconditional `resolveActiveOctave`
 * (found wrong 2026-09-13: a genuine mid-octave day with no other
 * contender used to grab the octave's own invitatory regardless, even on
 * an ordinary Sunday the octave never actually won).
 *
 * Doubling (`isDoubleOrHigher`, via `openingAntiphon`) is a separate, final
 * step applied to whichever tier's text wins here — never part of content
 * selection itself. */
function resolveMatinsInvitatoryText(day: LiturgicalDay): ResolvedText {
  // The plain `{Antiphona ex Psalterio secundum tempora}` weekday cycle
  // (Psalterium/Special/Matutinum Special.txt's "Invit Trid_" block); Monday's
  // text lives at the unsuffixed `antiphon` key.
  const seasonSuffix = seasonalOfficeSuffix(day.season);
  const found = lookupPartTiered({
    day,
    hour: 'matins',
    part: 'invitatory',
    temporalKeys: [seasonSuffix, day.weekday === 'monday' ? 'antiphon' : `antiphon-${day.weekday}`].filter((k): k is string => !!k),
  });
  const winner = resolveOfficeWinner(day);
  const saint = winner.kind === 'sanctoral' ? getSaintRecord(winner.id) : undefined;
  // Common-of-a-Holy-Woman's own invitatory antiphon is a name template
  // ("beátæ N..") -- see matins-invitatory-common-of-a-holy-woman.yml.
  return found && found.tier === 'common' && saint?.invitatoryName ? substituteName(found.text, saint.invitatoryName) : (found?.text ?? { text: {}, status: { la: 'missing', en: 'missing' } });
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
    const antiphonText = withStatus(g.antiphon, g.status);
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
 * data/hours/matins-sunday-antiphons.yml's own header.
 *
 * `group.antiphon` is genuinely absent (not an authoring gap) for the
 * Archangel/Guardian Angels feasts: their own source files (e.g.
 * web/www/horas/Latin/Sancti/03-24.txt for St. Gabriel) give exactly 9
 * proper [Ant Matutinum] antiphons, all consumed across Nocturn 1 (6) and
 * Nocturn 2 (3) — live-verified none is left over for Nocturn 3, which
 * runs straight from its last reading's responsory to the Gospel with no
 * antiphon at all. Closing `antiphon` part only pushed when real text
 * exists, same "omit rather than render empty" convention as Vespers'
 * NO_VESPERS_RESPONSORY (see tests/hours/vespers.test.ts). */
function sundayCanticleNocturn(group: SundayNocturn, day: LiturgicalDay): ResolvedPart[] {
  const opening = group.antiphon ? openingAntiphon(withStatus(group.antiphon, group.antiphonStatus), resolveOfficeWinner(day)) : undefined;
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
  if (group.antiphon) {
    const { full } = splitNamedAntiphon(withStatus(group.antiphon, group.antiphonStatus));
    parts.push({ kind: 'antiphon', text: full });
  }
  parts.push({ kind: 'versicle', text: versicleText(group.versicle) });
  return parts;
}

/** A per-feast/per-Common Nocturn 3 override is normally the 3-OT-
 * canticle shape (`sundayCanticleNocturn`) every existing saint/category
 * file uses — but a real exception exists (All Saints, live-verified
 * 2026-09-05: Ps 33/60/96, each its own antiphon, not canticles at all).
 * Dispatches on which field the override actually populated rather than
 * assuming canticles unconditionally, so a `groups`-shaped Nocturn 3
 * renders as real psalms via `sundayPsalmNocturn` instead of silently
 * producing an empty antiphon and no content. */
function renderOverrideNocturn3(group: SundayNocturn, day: LiturgicalDay): ResolvedPart[] {
  return group.groups ? sundayPsalmNocturn(group, day) : sundayCanticleNocturn(group, day);
}

/** A Sunday's own psalm numbers (Nocturns 1-2) and canticles (Nocturn 3)
 * carrying a Common's antiphon text instead of the Sunday's own — for a
 * saint who wins a Sunday below the rank at which his Common's whole
 * psalmody applies. Psalmody follows the rank rule; antiphon content does
 * not (user, 2026-10-18).
 *
 * Sunday's six psalms per nocturn sit under 3 pair-antiphons while a
 * Common gives one antiphon per psalm, so the psalms are regrouped
 * one-per-antiphon when the counts match; if they don't, the Sunday's own
 * grouping is left alone rather than guessing at a mapping. The versicle
 * is the Common's, as on the weekday path. */
function sundayWithCommonAntiphons(sunday: SundayNocturn, common: SundayNocturn): SundayNocturn {
  const psalms = (sunday.groups ?? []).flatMap((g) => g.psalms);
  const commonGroups = common.groups ?? [];
  if (sunday.groups) {
    if (commonGroups.length !== psalms.length) return sunday;
    return {
      ...sunday,
      groups: commonGroups.map((g, i) => ({ ...g, psalms: [psalms[i] as number] })),
      versicle: common.versicle,
    };
  }
  return { ...sunday, antiphon: common.antiphon ?? sunday.antiphon, antiphonStatus: common.antiphonStatus, versicle: common.versicle };
}

/** The Matins hymn, chosen by the day's office winner (`resolveOfficeWinner`,
 * which already substitutes the governing feast on an octave's interior
 * days -- so an octave day is just a day whose winner is that feast, with no
 * separate octave tier): the winner's own proper hymn
 * (`matins-hymn-${overrideId}`) when authored; else the winner's single
 * Common's hymn (`matins-hymn-${SaintRecord.common}`, e.g. "Aeterna Christi
 * munera" for any Apostle with no proper hymn of his own); else, for a
 * ferial winner, the seasonal default (Advent/Lent/Passiontide/Paschaltide),
 * else the plain year-round ferial hymn. Same winner -> proper -> Common ->
 * ferial rule Lauds and Vespers follow. The one addition: a temporal-only
 * octave (Ascension, Pentecost, ...) supplies its hymn when the winner (an
 * Ember day, say) has none, as at Lauds. */
function resolveMatinsHymn(day: LiturgicalDay): ResolvedText {
  // The Monday-Saturday "week of hymns" (Somno reféctis ártubus, Consors
  // patérni lúminis, Rerum Creátor óptime, Nox atra rerum, Tu Trinitátis
  // Únitas, Summæ Deus cleméntiæ); Monday's own text lives at the unsuffixed
  // `ferial` id. Septuagesima has its own hymn ("Primo diérum ómnium"),
  // Sunday its own plain one ("Nocte surgéntes").
  const seasonSuffix = seasonalOfficeSuffix(day.season);
  const temporalKeys = [
    day.season === 'septuagesima' ? 'septuagesima' : undefined,
    seasonSuffix,
    day.weekday === 'sunday' ? 'sunday' : undefined,
    day.weekday === 'monday' ? 'ferial' : `ferial-${day.weekday}`,
  ].filter((k): k is string => !!k);
  return lookupPart({ day, hour: 'matins', part: 'hymn', temporalKeys });
}

/** The plain ferial weekday nocturn's real antiphoned psalmody — a
 * temporal winner with a matching `ferialNamedOverrides` entry (2026-09-02,
 * e.g. the Easter Octave's Wed-Sat) takes precedence and swaps in that
 * override's own antiphons via `ferialNamedAntiphonedNocturn` instead (see
 * data/hours/matins-ferial-named-antiphon-overrides.yml's own header);
 * otherwise the plain per-weekday default (see
 * data/hours/matins-ferial-antiphons.yml's own header for how each
 * weekday's groups were reconciled against psalter-distribution.yml's own
 * "editorial redistribution" of the historical per-weekday psalm set).
 * Every psalm-group carries its own antiphon (incipit-or-full opening,
 * same rank rule as Sunday's own nocturns). No versicle: an earlier
 * version of this ported a mid-list V./R. line embedded in the source
 * `Psalmi matutinum.txt`, but that line is live-verified inert there — the
 * real single-nocturn ferial office runs straight from the last psalm to
 * the Capitulum (fixed 2026-09-02, see the data file's own header). */
function ferialAntiphonedNocturn(day: LiturgicalDay): ResolvedPart[] {
  const winner = resolveOfficeWinner(day);
  const namedOverride = winner.kind === 'temporal' ? ferialNamedOverrides[winner.id] : undefined;
  if (namedOverride && namedOverride.weekdays.includes(day.weekday)) {
    return ferialNamedAntiphonedNocturn(day, namedOverride, winner);
  }
  const nocturn = ferialAntiphons[day.weekday as Exclude<Weekday, 'sunday'>];
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
        verseRange: ref.verses,
      });
    });
    parts.push({ kind: 'antiphon', text: full });
  }
  return parts;
}

/** A ferial named override's antiphons, distributed as evenly as possible
 * across the weekday's own already-fixed psalm-group count (see
 * matins-ferial-named-antiphon-overrides.yml's own header) — the psalm
 * numbers themselves are unchanged from the plain per-weekday default,
 * only the antiphon layer swaps. */
function ferialNamedAntiphonedNocturn(day: LiturgicalDay, override: FerialNamedOverride, winner: DayWinner): ResolvedPart[] {
  const nocturn = ferialAntiphons[day.weekday as Exclude<Weekday, 'sunday'>];
  const chunkSize = Math.ceil(nocturn.groups.length / override.antiphons.length);
  const parts: ResolvedPart[] = [];
  override.antiphons.forEach((antiphon, i) => {
    const chunk = nocturn.groups.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length === 0) return;
    const antiphonText = verifiedText(antiphon);
    const opening = openingAntiphon(antiphonText, winner);
    const { full } = splitNamedAntiphon(antiphonText);
    let isFirst = true;
    for (const group of chunk) {
      for (const ref of group.psalms) {
        const rawVerses = getPsalmVerses(ref.number, ref.verses).map((v): ResolvedVerse => ({ n: v.n, text: v.text, status: v.status }));
        const { verses, antiphon: partAntiphon } = applyFlexaMark(rawVerses, isFirst ? opening : undefined);
        isFirst = false;
        parts.push({ kind: 'psalm', psalmNumber: ref.number, verses, antiphon: partAntiphon, verseRange: ref.verses });
      }
    }
    parts.push({ kind: 'antiphon', text: full });
  });
  return parts;
}

/** Fallback for a Semiduplex+ weekday feast with no matins-psalmody-overrides
 * entry authored for its winner yet: the plain ferial weekday table,
 * chunked into 3 nocturns instead of 1. Bare (no antiphons, no canticles)
 * when `common` isn't given — genuinely nothing authored at all for this
 * winner, still used as-is for a duplex-majus+ winner with no Common
 * category either.
 *
 * When `common`/`commonId` *are* given (a Semiduplex- or Duplex-rank
 * winner whose Common category exists — user, 2026-08, threshold lowered
 * to Semiduplex 2026-09-02), each nocturn borrows that category's
 * own `nocturn{N}.versicle`: the ferial table only ever authors one
 * versicle for the whole (normally 1-nocturn) day, so a 3-nocturn split
 * leaves 2 of the 3 nocturns with none at all — Common's own 3 real
 * versicles are an exact fit for that gap.
 *
 * For the antiphon: Common's own Matins Nocturn 1/2 are 6 individual
 * per-psalm antiphons each written as a paraphrase of *that* psalm's own
 * opening words (e.g. Ps 4's "Invocántem exaudívit Dóminus" echoing Ps 4's
 * own "Cum invocárem exaudívit me") — laid over a *different* ferial psalm
 * they'd misquote it, so they can't be borrowed. Instead, each nocturn is
 * given the same proper -> derived-from-Lauds -> Paschaltide-common ->
 * plain-common chain `resolveMinorHourAntiphon` itself resolves for the
 * real Terce/Sext/None hours (`resolveMinorHourAntiphonCandidates`,
 * `./resolve-common`) — an active octave's own governing feast (whose id
 * `resolveOfficeWinner`/`getMinorHourOverrideId` already substitute in) is
 * therefore tried first via its own proper `{terce,sext,none}-antiphon-
 * ${id}` text, before falling to `SaintRecord.common`'s shared
 * Common antiphon (deliberately distinct from `common`, the psalm-numbers
 * Common id — a saint's minor-hour Common category isn't always the same
 * as their overall one, see `SaintRecord`'s own doc comment). Previously
 * this only ever tried the plain-common tier directly, silently leaving a
 * feast/octave's own real proper antiphon unused whenever no matching
 * generic Common file existed (fixed 2026-09-10).
 * Real, verified, and already proven non-psalm-specific by the minor hours themselves (3
 * ferial psalms of arbitrary content under one thematic antiphon,
 * live-verified against the reference engine at any rank). Terce/Sext/
 * None each carry their own distinct text per category (confirmed,
 * 2026-08-27), so this gives Nocturns 1/2/3 three genuinely different
 * real antiphons instead of one borrowed Nocturn-3-only text — user,
 * 2026-08-27: "some antiphons from the feria and some from the commons
 * feels off... use those antiphons, one per nocturn." Falls back to bare
 * (no antiphon) per nocturn when nothing in that chain is authored yet
 * (most minor-hour proper/Common files only cover a handful of
 * feasts/categories so far) — never a mismatched substitute. */
function ferialPsalmodyThreeNocturns(
  day: LiturgicalDay,
  common?: MatinsPsalmodyScheme,
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
    const candidates = resolveMinorHourAntiphonCandidates(minorHours[i]!, day);
    const antiphonText = candidates.find((c) => c && (c.status.la !== 'missing' || c.status.en !== 'missing'));
    const psalms = antiphonText ? withSingleAntiphon(chunk, antiphonText, winner) : psalmRefParts(chunk);
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
    parts.push({ kind: 'psalm', psalmNumber: ref.number, verses, antiphon: partAntiphon, verseRange: ref.verses });
  });
  parts.push({ kind: 'antiphon', text: full });
  return parts;
}

/** Every id whose own patristic/hagiographic/Gospel content should be
 * gathered for `day` — the office winner (if sanctoral), every
 * commemorated saint (a transferred-in feast already appears as `day.winner`
 * once `resolveDay` has applied the transfer, so it needs no separate
 * lookup here), and — only on a real 3-nocturn day (Sunday, or a
 * Semiduplex+ feast) — the plain temporal id itself (that Sunday's own Moralia-in-
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
function nocturnReadingIds(
  day: LiturgicalDay,
  temporalId: string,
  date: string,
  threeNocturns: boolean,
  hasTemporalNamedOverride: boolean,
): string[] {
  const ids = new Set<string>();
  // Not gated to `kind === 'sanctoral'` -- a named temporal override (e.g.
  // Immaculate Heart of Mary, calendar/movable-feasts.ts's applyMovableFeasts)
  // has its own authored nocturn-readings file keyed by its own id too,
  // distinct from the plain governing-Sunday `temporalId` gated below. But
  // on a plain ordinary feria `day.winner.id` *is* that same governing-
  // Sunday `temporalId` (the temporal cycle IS the winner), so it must go
  // through the same `hasTemporalNamedOverride` gate rather than being added
  // unconditionally.
  //
  // Deliberately `hasTemporalNamedOverride`, not the broader `threeNocturns`
  // (2026-09-09 fix): `threeNocturns` can also become true because
  // `resolveOfficeWinner` (hours/resolve-common.ts) synthesizes a sanctoral
  // winner from an active-but-too-weak-to-outright-win octave, while
  // `day.winner` itself (the real calendar winner passed in here) stays
  // `{kind: 'temporal', id: temporalId}` -- e.g. 2026-09-09, 2nd day within
  // the Nativity of the BVM's octave, St. Gorgonius (Simplex) demoted to a
  // commemoration. Using bare `threeNocturns` here wrongly read that
  // office-winner synthesis as license to pool the *plain governing week's*
  // own ferial content (post-pentecost-15's own Gregory homily, labeled
  // "for Wednesday in the 14th week after Trinity") into an octave day's
  // Matins -- a day that is by definition not a bare ferial day at all
  // (live-verified user report: "ferial and not-ferial are logically
  // separate sets"). `hasTemporalNamedOverride` only fires for a real
  // authored `sundayNamedOverrides` entry (e.g. Easter Monday/Tuesday
  // sharing Easter Sunday's own content pool under `temporalId`), the one
  // legitimate reason a `winner.kind === 'temporal'` day with
  // `id === temporalId` should still pull that id's own content.
  if (day.winner.kind === 'sanctoral' || day.winner.id !== temporalId || hasTemporalNamedOverride) {
    ids.add(day.winner.id);
  }
  // Two passes, not one: every *temporal* commemoration's id is added
  // before any *sanctoral* commemoration's, matching `day-label.ts`'s own
  // `collectCommemorations` convention (`[...temporal, ...sanctoral]`) —
  // so a reading's pool position agrees with where its own occasion is
  // named in the day's displayed label. `day.commemorations`' own array
  // order doesn't already reflect this grouping (live-verified as a real
  // bug, 2026-09-19: St. Januarius's readings listed the Vigil of St.
  // Matthew's homily before Ember Saturday's, backwards from the label's
  // own "... — Ember Saturday in September — Vigil of St. Matthew
  // (transferred)"), so it must be imposed here rather than assumed.
  for (const c of day.commemorations) {
    // Same reasoning as day.winner.id just above, but a *commemorated*
    // (not winning) temporal identity that equals the plain governing-
    // Sunday `temporalId` is exactly the "Commemoratio Feriæ" case the
    // `day.weekday === 'sunday'` gate below exists to guard (see that
    // gate's own long comment) — a Semiduplex+ saint winning outright on a
    // *weekday* (e.g. St. Joseph of Cupertino, Friday Sept 18) still has
    // `threeNocturns` true, so `c.id !== temporalId || threeNocturns`
    // alone let the week's separate governing-Sunday homily (Ambrose's,
    // live-verified 2026-09-05) sneak back into a weekday's pool through
    // this loop even though the gate below correctly kept it out of the
    // `temporalKept` block. `c.id !== temporalId` must hold on its own
    // unless today genuinely *is* that Sunday.
    if (c.kind === 'temporal' && (c.id !== temporalId || (threeNocturns && day.weekday === 'sunday'))) {
      ids.add(c.id);
    }
  }
  for (const c of day.commemorations) {
    if (c.kind === 'sanctoral') {
      ids.add(c.id);
    }
  }
  // The plain temporalId/month-week content is the *governing Sunday's own*
  // Nocturn 2/3 patristic material, real content for that Sunday itself —
  // only pooled on a real 3-nocturn day, only on the Sunday itself (see
  // below), and (as before) only when the day's own occurrence decision
  // (calendar/commemorations.ts's decideOccurrence) actually retained the
  // temporal identity in some form: the temporal cycle won outright
  // (day.winner.kind === 'temporal' -- a plain Sunday, or a named temporal
  // override like Christ the King), or it survives as a commemoration
  // alongside a sanctoral winner. Excluded: decideOccurrence's
  // `ordinary-feria` branch, where a real feast -- however low-ranked --
  // wins with zero commemorations, correctly suppressing the temporal
  // identity entirely (e.g. St. Bartholomew, duplex-2-classis, 2026-08-24
  // -- his own proper reading has no Nocturn 3 content, and without this
  // gate the leftover 13th-Sunday-after-Pentecost/month-week content
  // wrongly filled Nocturn 3 instead).
  //
  // `day.weekday === 'sunday'` gate added 2026-09-03: live-verified
  // (Tridentine 1906) that a Duplex+ saint winning outright on a *weekday*
  // that also happens to carry a temporal commemoration (e.g. St. Joseph
  // of Cupertino, Duplex, Friday Sept 18) gets no Sunday content at all --
  // the reference engine's own Nocturn III there is just the saint's own
  // Common homily (2 lessons) plus a single "Commemoratio Feriæ" lesson
  // for the displaced feria, never the week's separate governing-Sunday
  // homily (Ambrose's/Leo's, in that live case). This mechanism previously
  // fired on *any* 3-nocturn day with a surviving temporal commemoration,
  // regardless of weekday, wrongly pooling in a whole extra Sunday's worth
  // of unrelated patristic content on top of the day's own two real
  // sources. The governing Sunday's own content only belongs in the pool
  // when that Sunday *is* the day being celebrated.
  const temporalKept =
    threeNocturns &&
    day.weekday === 'sunday' &&
    (day.winner.kind === 'temporal' || day.commemorations.some((c) => c.kind === 'temporal'));
  if (temporalKept) {
    ids.add(temporalId);
    const monthWeek = monthWeekId(date);
    if (monthWeek) ids.add(`month-week-${monthWeek}`);
  }
  return [...ids];
}

/** Fallback label for a hagiographic/vita reading that carries no authored
 * `source` attribution (unlike a patristic homily, a saint's vita rarely
 * has one in the reference engine) — "On St. Pius X, Pope and Confessor",
 * from the same saint/temporal-feast record that supplies the day's own
 * display name. Same plain-string, non-bilingual convention as an authored
 * `source` (see NocturnReading.source's own doc comment): displayed as-is
 * in both language columns rather than split into {la, en}, since neither
 * the record's `name` nor `nameLa` reliably declines into the "on ___"
 * phrasing this needs. Undefined when `id` matches neither record (e.g. a
 * plain temporal id with no TemporalFeastRecord of its own). */
function fallbackHagiographicLabel(id: string): string | undefined {
  const name = getSaintRecord(id)?.name ?? getTemporalFeastRecord(id)?.name;
  if (!name) return undefined;
  return name.startsWith('The ') ? `On the ${name.slice(4)}` : `On ${name}`;
}

/** The human-readable occasion a `nocturn-readings` id stands for — a
 * saint's or named temporal feast's own display name, an Ember day's (which
 * has no `TemporalFeastRecord` of its own, see `emberDayLabel`'s own doc
 * comment), or — the most common case in the whole pool — a plain governing
 * Sunday's own temporal-cycle id (`post-pentecost-15`) or its
 * `month-week-<NNN>` half (see `nocturnReadingIds`'s `temporalKept` block),
 * which falls back to `temporalLabel`'s bare ordinal name (e.g. "The 14th
 * Sunday after Trinity" — no rank, no commemorations; that's the day
 * heading's job, not this annotation's). Used to annotate an authored
 * patristic `source` with *why* it's here, since a single day can pool
 * several ids' worth of readings (e.g. a commemorated Ember day's own
 * Gospel homily alongside the winning saint's own) and a bare "Pope St.
 * Gregory the Great, Homily 33" doesn't tell a reader which occasion that
 * homily belongs to. */
function occasionName(id: string, day: LiturgicalDay): string | undefined {
  const named = getSaintRecord(id)?.name ?? getTemporalFeastRecord(id)?.name ?? emberDayLabel(id)?.en;
  if (named) return named;
  const monthWeek = monthWeekId(day.date);
  if (id === resolveTemporalId(day.date) || (monthWeek && id === `month-week-${monthWeek}`)) {
    // Always the bare Sunday/feria name — never `getDayLabel`, which bakes
    // in the day's rank and every commemoration/transfer note. This
    // annotation names the single occasion that pooled this one reading,
    // not the whole day's heading.
    return temporalLabel(day).en;
  }
  return undefined;
}

/** Appends `(for <occasion>)` to an authored patristic `source` string,
 * when the contributing id resolves to a human-readable occasion name —
 * see `occasionName`. A no-op when `source` is undefined (the hagiographic
 * fallback case, which already names its own saint). */
function withOccasion(source: string | undefined, id: string, day: LiturgicalDay): string | undefined {
  if (!source) return source;
  const occasion = occasionName(id, day);
  return occasion ? `${source} (for ${occasion})` : source;
}

/** Normalizes reading text to one consistent paragraph-break convention
 * (a blank line, i.e. `\n\n`) regardless of which YAML block-scalar
 * style produced the raw string this pool entry came from. This app's
 * `data/propers/**` reading files use at least two different conventions
 * for the same intent (a folded `>-` scalar with a real blank line between
 * paragraphs, which YAML already folds to `\n\n`; and a literal `|` scalar
 * with one whole paragraph per physical line, which YAML preserves as a
 * single `\n` between them) — and the render path (`ui/hour-view.ts`'s
 * `white-space: pre-line`) trusts whatever newlines are already in the
 * string, so the second convention rendered with no visible paragraph gap
 * at all (live-verified 2026-09-09, part of that day's "garbled reading"
 * report). Liturgical prose in this store is never hard-wrapped
 * mid-sentence, so any bare single `\n` here is always a paragraph break,
 * never a line-wrap to preserve — safe to promote every lone `\n` to
 * `\n\n` uniformly, at the one point text enters the pool, rather than
 * requiring every future data file to match one exact YAML block style. */
function normalizeParagraphs<T extends Partial<Record<string, string>>>(text: T): T {
  const normalized: Record<string, string> = {};
  let changed = false;
  for (const [lang, value] of Object.entries(text)) {
    if (value === undefined) continue;
    const fixed = value.replace(/([^\n])\n(?!\n)/g, '$1\n\n');
    normalized[lang] = fixed;
    if (fixed !== value) changed = true;
  }
  return changed ? ({ ...text, ...normalized } as T) : text;
}

/** `index` is this reading's position among this same id's own
 * nocturn-readings (not the whole day's pool) — the cycling key for
 * `getResponsoryForCommon` when `r` has no proper `responsory` of its own,
 * same convention as the per-book pool. Common-category fallback only
 * applies to a real saint id (`getSaintRecord(id)?.common`) — a temporal or
 * octave id has no Commune category to fall back to. */
function scriptureLabel(r: NocturnReading): { la: string; en: string } | undefined {
  return getScriptureIncipitFromCitation(r.citation);
}

function nocturnReadingPart(r: NocturnReading, id: string, index: number, day: LiturgicalDay): ResolvedPart {
  const responsoryText = r.responsory ?? getResponsoryForCommon(getSaintRecord(id)?.common, index);
  return {
    kind: 'lesson',
    text: { text: normalizeParagraphs(r.text), status: r.status, citation: r.citation },
    label: withOccasion(r.source, id, day) ?? scriptureLabel(r) ?? fallbackHagiographicLabel(id),
    responsory: responsoryText ? { text: responsoryText, status: { la: 'verified', en: 'verified' } } : undefined,
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
function gospelReadingPart(
  r: NocturnReading,
  homily: NocturnReading | undefined,
  id: string,
  index: number,
  day: LiturgicalDay,
): ResolvedPart {
  const incipit = getGospelIncipitFromCitation(r.citation);
  // A responsory authored on the *homily* (the reference engine's own
  // convention — e.g. post-pentecost-16.yml's Ambrose homily, or a saint's
  // own Gospel-homily pair) belongs to the pericope+homily as a whole, not
  // just the bare Gospel text, and must fall back here before the generic
  // Common-category pool — this file's own header says a governing
  // Sunday's homily "and its responsory" are pooled together; only `r`'s
  // own field was ever checked, silently dropping every authored homily
  // responsory (found 2026-09-05 while live-verifying an unrelated report).
  const responsoryText = r.responsory ?? homily?.responsory ?? getResponsoryForCommon(getSaintRecord(id)?.common, index);
  return {
    kind: 'gospel',
    text: { text: normalizeParagraphs(r.text), status: r.status, citation: r.citation },
    source: withOccasion(r.source, id, day),
    label: incipit ? { la: incipit.la, en: incipit.en } : undefined,
    responsory: responsoryText ? { text: responsoryText, status: { la: 'verified', en: 'verified' } } : undefined,
    homily: homily
      ? {
          source: withOccasion(homily.source, id, day),
          text: { text: normalizeParagraphs(homily.text), status: homily.status, citation: homily.citation },
        }
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
function buildReadingPool(
  day: LiturgicalDay,
  temporalId: string,
  date: string,
  threeNocturns: boolean,
  hasTemporalNamedOverride: boolean,
): ResolvedPart[] {
  const parts: ResolvedPart[] = [];
  // One shared dedup set across *every* source pushed into the pool below
  // (bible-plan, octave-readings, nocturn-readings) -- previously this Set
  // only existed local to the nocturn-readings loop, so an octave reading
  // that happened to restate the same content as a separately-pooled
  // nocturn-reading (e.g. a saint's own commemoration folded into an
  // octave's Matins excerpt, live-verified 2026-09-09: St. Gorgonius'
  // biography duplicated between nativity-bvm-octave-day-2.yml and
  // nocturn-readings/st-gorgonius.yml) could never be caught. Keyed the
  // same way as before: by Latin text (falling back to English), first
  // occurrence wins.
  const seenReadingText = new Set<string>();
  const isDuplicate = (text: { la?: string; en?: string }): boolean => {
    const key = text.la ?? text.en ?? '';
    if (!key) return false;
    if (seenReadingText.has(key)) return true;
    seenReadingText.add(key);
    return false;
  };
  for (const r of getBiblePlanReadings(temporalId, day.weekday, date)) {
    const responsory = r.responsory ? { text: r.responsory, status: { la: 'verified' as const, en: 'verified' as const } } : undefined;
    // The user's own reading plan never pairs a Gospel with a homily (see
    // this file's own header) — a bare pericope, still its own 'gospel'
    // kind so it gets the same distinguishing UI treatment as a proper
    // Gospel+homily.
    const label = r.label ? { la: r.label.la ?? '', en: r.label.en ?? '' } : undefined;
    parts.push(
      r.isGospel
        ? {
            kind: 'gospel',
            text: { text: normalizeParagraphs(r.text), status: r.status, citation: r.citation },
            responsory,
            label: label ?? getGospelIncipitFromCitation(r.citation),
          }
        : { kind: 'lesson', text: { text: normalizeParagraphs(r.text), status: r.status, citation: r.citation }, responsory, label },
    );
  }
  const ids = nocturnReadingIds(day, temporalId, date, threeNocturns, hasTemporalNamedOverride);
  // Ordering is by *id priority* (winner first, then commemorations in
  // `day.commemorations` order — a winning saint's own content always
  // precedes a demoted commemoration's, matching the day-label convention
  // of listing the winner first), with one deliberate exception: the
  // temporalId itself and `month-week-${monthWeek}` are split halves of
  // ONE governing Sunday's own Nocturn 2/3 content (see
  // `nocturnReadingIds`'s `temporalKept` block) — pooling those two in
  // plain id-priority order would put the temporalId file's own Nocturn 3
  // content ahead of month-week's Nocturn 2 content, so this pair alone is
  // grouped by raw `nocturn` tag (ascending) instead. Every other id is its
  // own atomic block: previously *every* id was grouped globally by raw
  // `nocturn` tag, which wrongly sorted a winning saint's own content after
  // a demoted commemoration's whenever the commemoration's file happened to
  // use a lower tag — e.g. an Ember day's single-nocturn file always tags
  // `nocturn: 1`, sorting it ahead of a winning Duplex+ saint's own
  // nocturn:2/3 content even though the saint, not the Ember day, is what's
  // actually being celebrated (user, 2026-09-05, re: St. Joseph of
  // Cupertino/Ember Friday, Sept 18). Within a single id's own block,
  // `nocturn` tag order (== that file's own reading order) is still used to
  // order its own multiple readings relative to each other.
  const monthWeek = monthWeekId(date);
  const splitIds = new Set(threeNocturns && day.weekday === 'sunday' && monthWeek ? [temporalId, `month-week-${monthWeek}`] : []);
  let splitPriority = -1;
  const priorityOf = new Map<string, number>();
  ids.forEach((id, i) => {
    if (splitIds.has(id)) {
      if (splitPriority === -1) splitPriority = i;
      priorityOf.set(id, splitPriority);
    } else {
      priorityOf.set(id, i);
    }
  });
  const byGroup = new Map<string, ResolvedPart[]>();
  // An active octave's own Matins reading (`data/propers/octave-
  // readings/*.yml`) is either a direct Scripture excerpt (authored via
  // `passages:`, see octave-readings.ts's `isScripture`) or a patristic
  // homily/sermon (authored directly as `text:`) -- these two shapes sort
  // differently. A Scripture excerpt is the same kind of content as the
  // bible-plan readings just pushed above, not the winner's/commemorations'
  // own homiletic pool below, so it's pushed here, right after the
  // bible-plan block and ahead of everything else, rather than appended at
  // the very end (where it sat before 2026-09-05) -- user, 2026-09-05, re:
  // Nov 8 2026 (All Saints' octave closing day): the Ezekiel reading there
  // read as misplaced trailing after the day's other homilies. Scripture
  // stays grouped with Scripture regardless of who won the day. Note this
  // shifts the pool's own position-0/1/2+ split (see distributeIntoNocturns):
  // an octave Scripture reading now competes for the Nocturn 1/2 "exactly
  // one reading" slots the same as anything else at this position,
  // potentially displacing what would otherwise have landed there.
  //
  // A homily/sermon octave reading, by contrast, is homiletic content like
  // the winner's/commemorations' own nocturn readings below, so it belongs
  // in *that* priority order -- winner first, then commemorations -- not
  // hoisted ahead of the actual winning feast's own content just because it
  // happens to come from the octave mechanism (live-verified 2026-09-12: a
  // Chrysostom sermon from the Nativity-of-BVM octave, a mere commemoration
  // that day, was sorting ahead of Holy Name of Mary's own readings, the
  // real winner). Folded into `byGroup` at a priority after every id in
  // `ids`, preserving `activeOctavesFor`'s own relative order across
  // multiple simultaneous non-scripture octaves.
  let nonScriptureOctaveIndex = 0;
  for (const octave of activeOctavesFor(date)) {
    const reading = getOctaveReading(octave.id, octave.dayNumber);
    if (!reading || isDuplicate(reading.text)) continue;
    // Unlike nocturn-readings' `source` (a plain, non-bilingual string —
    // see `withOccasion`'s own doc comment), an octave reading's `source`
    // is itself `{la, en}` (2026-08 fix). The occasion name is still a
    // single plain string either way, so it's appended to both language
    // slots rather than routed through `withOccasion`.
    const occasion = occasionName(octave.id, day);
    const label = occasion
      ? {
          la: reading.source.la ? `${reading.source.la} (for ${occasion})` : reading.source.la,
          en: reading.source.en ? `${reading.source.en} (for ${occasion})` : reading.source.en,
        }
      : reading.source;
    const part: ResolvedPart = {
      kind: 'lesson',
      text: { text: normalizeParagraphs(reading.text), status: reading.status },
      label,
      responsory: reading.responsory
        ? { text: reading.responsory, status: { la: 'verified', en: 'verified' } }
        : undefined,
    };
    if (reading.isScripture) {
      parts.push(part);
    } else {
      const priority = ids.length + nonScriptureOctaveIndex++;
      const groupKey = `${priority}:0`;
      const bucket = byGroup.get(groupKey) ?? [];
      bucket.push(part);
      byGroup.set(groupKey, bucket);
    }
  }
  // The reference engine's own Tempora files sometimes independently reuse
  // the exact same excerpt across two different Sunday-numbering schemes
  // (e.g. a Pentecost-numbered Sunday and a calendar-month Sunday landing on
  // the same date — see month-week-092.yml's own header) — only one of
  // those numbering schemes is ever in force on a given real calendar, but
  // `nocturnReadingIds` can legitimately pool both ids for the *same* day
  // here, which would otherwise surface the identical reading twice in one
  // hour. Dedupe by Latin text, keeping the first (earliest-source)
  // occurrence — via the same shared `isDuplicate`/`seenReadingText` every
  // other source in this pool checks against (see this function's own
  // header), not a Set local to this loop alone.
  for (const id of ids) {
    const readings = getNocturnReadings(id);
    let commonPoolIndex = 0;
    for (let i = 0; i < readings.length; i++) {
      const reading = readings[i]!;
      if (isDuplicate(reading.text)) continue;
      const groupKey = `${priorityOf.get(id)}:${reading.nocturn}`;
      const bucket = byGroup.get(groupKey) ?? [];
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
        bucket.push(gospelReadingPart(reading, homily, id, commonPoolIndex++, day));
        if (homily) {
          i++;
          isDuplicate(homily.text);
        }
      } else {
        bucket.push(nocturnReadingPart(reading, id, commonPoolIndex++, day));
      }
      byGroup.set(groupKey, bucket);
    }
  }
  const sortedGroupKeys = [...byGroup.keys()].sort((a, b) => {
    const [aPriority, aNocturn] = a.split(':').map(Number);
    const [bPriority, bNocturn] = b.split(':').map(Number);
    return aPriority! - bPriority! || aNocturn! - bNocturn!;
  });
  for (const key of sortedGroupKeys) {
    parts.push(...byGroup.get(key)!);
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
  if (isAllSouls(date)) {
    return { hourId: 'matins', date, parts: buildMatinsParts(date), dayLabel: getDayLabel(resolveDay(date)) };
  }
  const day = resolveDay(date);
  const winner = resolveOfficeWinner(day);
  // Octave-aware: an interior octave day is judged on the octave's own
  // per-day rank, not the origin feast's full rank — see
  // resolve-common.ts's officeWinnerEffectiveRank doc comment. Fixes the
  // same class of bug 2026-09-09's Lauds/Vespers fix addressed
  // (getPsalmodyNumbersOverrideId), left un-patched here until 2026-09-10.
  const effectiveRank = officeWinnerEffectiveRank(day, winner);
  const temporalId = resolveTemporalId(date);
  // Every Sunday, unconditionally, a Semiduplex+ sanctoral winner — the
  // user's own chosen threshold (2026-08, lowered from Duplex to
  // Semiduplex 2026-09-02), not gated on whether any content is actually
  // authored yet, same "eligible, not content-gated" convention every
  // other per-feast override in this app already uses (see
  // hours/resolve-common.ts's getOfficeOverrideId) — or a temporal winner
  // whose *governing week* (`temporalId`, not `winner.id`) has its own
  // named override (2026-09-02, e.g. Easter Monday/Tuesday reusing Easter
  // Sunday's own entry; see `hasTemporalNamedOverride` below). Keyed by
  // `temporalId` rather than `winner.id` since 2026-09-06: Easter week's
  // 6 weekdays each got their own real `temporal-feasts` record (`winner.id`
  // is now `easter-monday`/`easter-tuesday`/...), but they still all share
  // one governing-week content pool (`temporalId`, always `easter-sunday`
  // for the whole octave) — matching `sundayNocturnFor`'s own lookup a few
  // lines up, which already keyed by `temporalId` for exactly this reason.
  // Unlike the sanctoral case, a plain temporal id is NOT eligible just by
  // existing — only one with an authored entry in `sundayNamedOverrides`
  // is, since ordinary temporal ferias/Sundays already have their own
  // correct path and shouldn't suddenly gain 3 nocturns. Deliberately a
  // separate check from `isDoubleOrHigher` (antiphon.ts) — that function
  // drives the unrelated antiphon-doubling rule (full vs. incipit antiphon
  // before the psalms) and stays floored at Duplex; the two thresholds
  // only coincided before this change by accident, not by shared meaning.
  // A winner's own id wins over its governing week's (Christmas Day and the
  // Epiphany are `christmas-day`/`epiphany`, while `temporalId` is the season
  // catch-all `christmas-octave-sunday`/`post-epiphany-1`).
  const namedKey = winner.kind === 'temporal' && sundayNamedOverrides[winner.id] ? winner.id : temporalId;
  const temporalNamedOverride = winner.kind === 'temporal' ? sundayNamedOverrides[namedKey] : undefined;
  const hasTemporalNamedOverride =
    temporalNamedOverride !== undefined && (temporalNamedOverride.weekdays === undefined || temporalNamedOverride.weekdays.includes(day.weekday));
  // A named movable feast that keeps its own First Vespers (the Lenten and
  // pre-Lenten Passion feasts) keeps three nocturns, with its own authored Matins
  // psalmody where there is one (data/hours/matins-psalmody-overrides/saints/,
  // or its `officeFrom`'s); every other temporal feast stays as it was.
  const temporalMatinsSource =
    winner.kind === 'temporal'
      ? (getMatinsSaintOverride(winner.id) ??
          (getTemporalFeastRecord(winner.id)?.firstVespers ? getMatinsPsalmodyOverride(sharedOfficeId(winner.id)) : undefined))
      : undefined;
  const hasTemporalProperMatins =
    temporalMatinsSource !== undefined || (winner.kind === 'temporal' && getTemporalFeastRecord(winner.id)?.firstVespers === true);
  const threeNocturns =
    day.weekday === 'sunday' ||
    (effectiveRank !== undefined && isAtLeast(effectiveRank, 'semiduplex')) ||
    hasTemporalNamedOverride ||
    hasTemporalProperMatins;
  const pool = buildReadingPool(day, temporalId, date, threeNocturns, hasTemporalNamedOverride);
  const [nocturn1Readings, nocturn2Readings, nocturn3Readings] = distributeIntoNocturns(pool, threeNocturns ? 3 : 1);

  // Tenebrae's real rubric: during the Sacred Triduum the whole opening
  // (versicle, Ps 3, Invitatory, hymn) is dropped, replaced by a silently-
  // said Pater/Ave/Credo — live-verified against both Monastic Tridentinum
  // 1617 and Divino Afflatu 1954 (Holy Thursday: "Invitatorium{omittitur}",
  // "Hymnus{omittitur}", no Ps 3 or versicle either). This app already
  // never renders that silent Pater/Ave/Credo elsewhere (see
  // data/hours/prime.yml's own header: dropped "to keep the hour
  // shorter"), so the fix here is a pure omission, not a new part kind.
  const hymnDoxologyOverrideId = getHymnDoxologyOverrideId(day);
  const hymnDoxologyOverride = hymnDoxologyOverrideId ? resolveCommon(hymnDoxologyOverrideId) : undefined;
  const parts: ResolvedPart[] = isInTriduum(day.date)
    ? []
    : [
        { kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day)) },
        { kind: 'versicle', text: resolveCommon('opening-domine-labia') },
        plainPsalm(3),
        { kind: 'section-heading', label: 'Invitatory' },
        ...invitatoryParts(day),
        { kind: 'hymn', text: substituteDoxology(resolveMatinsHymn(day), hymnDoxologyOverride) },
      ];

  // A sanctoral winner's own proper Matins psalmody takes precedence even
  // on a Sunday — live-verified 2026-09-05 (All Saints, Nov 1, a Sunday
  // that year): the source's own "Psalmi Dominica" rubric line reads as
  // if the plain Sunday psalm cursus always applies whenever a Duplex+
  // feast wins over a Sunday, but that's misleading — the live render
  // shows All Saints' own distinct proper psalms (Ps 1/4/8, 14/23/31,
  // 33/60/96), not the plain Sunday Nocturn psalms. Checked ahead of the
  // `day.weekday === 'sunday'` branch below, which otherwise unconditionally
  // wins regardless of who the day's winner is — silently making any
  // saint's own proper Matins psalmody unreachable on a Sunday.
  //
  // A saint with no proper of his own falls to his Common, the same as on
  // a weekday: the whole Common scheme at Duplex Majus and above
  // (live-verified 2026-10-18, St. Luke, a Sunday that year — his
  // Common-of-an-Evangelist psalms, antiphons and canticles, not the
  // Sunday's); below that, the Sunday's psalm numbers carrying the Common's
  // antiphon text (psalmody follows rank, antiphon content does not).
  const sundaySanctoral = day.weekday === 'sunday' && winner.kind === 'sanctoral';
  const sundaySanctoralProperOverride = sundaySanctoral ? getMatinsSaintOverride(winner.id) : undefined;
  const sundaySanctoralCommon = sundaySanctoral && !sundaySanctoralProperOverride ? getMatinsCommonOverride(winner.id) : undefined;
  const sundayCommonWholeScheme =
    sundaySanctoralCommon !== undefined && effectiveRank !== undefined && isAtLeast(effectiveRank, 'duplex-majus') ? sundaySanctoralCommon : undefined;
  const schemeBlocks = (scheme: MatinsPsalmodyScheme): [ResolvedPart[], ResolvedPart[], ResolvedPart[]] => [
    sundayPsalmNocturn(scheme.nocturn1, day),
    sundayPsalmNocturn(scheme.nocturn2, day),
    renderOverrideNocturn3(scheme.nocturn3, day),
  ];
  // Each nocturn: its heading, its psalmody, then its readings; the Te Deum and
  // its versicle close the third.
  const nocturns = (blocks: [ResolvedPart[], ResolvedPart[], ResolvedPart[]]): ResolvedPart[] => {
    const readings = [nocturn1Readings, nocturn2Readings, nocturn3Readings];
    return [
      ...blocks.flatMap((block, i) => [
        { kind: 'section-heading', label: `Nocturn ${NOCTURN_NUMERAL[i]}` } as ResolvedPart,
        ...block,
        ...(readings[i] ?? []),
      ]),
      { kind: 'te-deum', text: resolveCommon('te-deum') },
      { kind: 'versicle', text: resolveCommon('te-decet-laus') },
    ];
  };
  if (sundaySanctoralProperOverride ?? sundayCommonWholeScheme) {
    parts.push(...nocturns(schemeBlocks((sundaySanctoralProperOverride ?? sundayCommonWholeScheme) as MatinsPsalmodyScheme)));
  } else if (threeNocturns && (day.weekday === 'sunday' || hasTemporalNamedOverride)) {
    const sundayNocturn = (key: 'nocturn1' | 'nocturn2' | 'nocturn3'): SundayNocturn => {
      const base = sundayNocturnFor(key, day, namedKey);
      return sundaySanctoralCommon ? sundayWithCommonAntiphons(base, sundaySanctoralCommon[key]) : base;
    };
    parts.push(
      ...nocturns([
        sundayPsalmNocturn(sundayNocturn('nocturn1'), day),
        sundayPsalmNocturn(sundayNocturn('nocturn2'), day),
        sundayCanticleNocturn(sundayNocturn('nocturn3'), day),
      ]),
    );
  } else if (threeNocturns) {
    // A Semiduplex+ weekday feast -- genuinely different psalmody from a real
    // Sunday's. By the one first-found rule:
    //   - the saint's own scheme, any rank;
    //   - else its Common's own scheme (own psalm numbers, canticles) at
    //     Duplex Majus and above;
    //   - else the ferial psalm numbers (3-nocturn stand-in), with Common's
    //     per-nocturn versicle and each nocturn's Terce/Sext/None antiphon for
    //     that category (see ferialPsalmodyThreeNocturns).
    // A named temporal feast with its own authored Matins psalmody (the Lenten
    // Passion feasts) takes it the same way a saint does.
    const properOverride = winner.kind === 'temporal' ? temporalMatinsSource : getMatinsSaintOverride(winner.id);
    const isAboveDuplex = effectiveRank !== undefined && isAtLeast(effectiveRank, 'duplex-majus');
    const commonOverride = winner.kind === 'sanctoral' && !properOverride ? getMatinsCommonOverride(winner.id) : undefined;
    const scheme = properOverride ?? (isAboveDuplex ? commonOverride : undefined);
    parts.push(...nocturns(scheme ? schemeBlocks(scheme) : ferialPsalmodyThreeNocturns(day, isAboveDuplex ? undefined : commonOverride)));
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
