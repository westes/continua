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
//   - Nocturn 1 is always the user's own continuous scripture-reading plan
//     (src/propers/bible-plan.ts), never the historical per-day lectionary
//     — a *variable* number of readings, not the historical fixed 3 (or 1,
//     in the source's own "summer" contraction — deliberately not
//     reproduced here; this app reads in full year-round).
//   - Where the historical office splits one continuous source across
//     several numbered lessons, this app recombines them into one reading
//     (see src/propers/octave-readings.ts's resolvePassages / src/propers/
//     nocturn-readings.ts) — split only where the underlying source
//     genuinely changes (e.g. a Gospel pericope vs. the homily on it).
//   - Nocturn 3 is gated at Duplex-and-higher (plus every Sunday,
//     unconditionally) — the user's own choice (2026-08), not the
//     historical Rule's own more permissive threshold.
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
//     active octave gets its own Nocturn 2/3 contribution, when authored —
//     "be generous, not winner-takes-all" (user, 2026-08) — mirroring
//     getDayCollects's own "one collect per commemoration" pattern, applied
//     to readings instead.
//
// Only a small, growable slice of content is authored so far (one clean
// ferial day, one clean Sunday) — this is the mechanism build, not the
// full-calendar content pass. See TODO.md for what's deferred.
import type { ResolvedOrdo, ResolvedPart, ResolvedVerse } from './types';
import type { LiturgicalDay } from '../calendar/types';
import { resolveDay, resolveTemporalId, activeOctavesFor } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getPsalmsFor, type PsalmRef } from '../psalter/distribution';
import { getScriptureVerses } from '../scripture';
import { getOpeningVersicleId } from './opening-versicle';
import { isDoubleOrHigher } from './antiphon';
import { resolveCommon, getDayCollect, resolveOfficeWinner, verifiedText, splitNamedAntiphon } from './resolve-common';
import { getBiblePlanReadings } from '../propers/bible-plan';
import { getNocturnReadings, type NocturnReading } from '../propers/nocturn-readings';
import { getOctaveReading } from '../propers/octave-readings';
import matinsSundayAntiphonsData from '../data/hours/matins-sunday-antiphons.yml';

type BilingualText = Partial<Record<string, string>>;
interface SundayGroup {
  psalms: number[];
  antiphon: BilingualText;
}
interface SundayNocturn {
  groups?: SundayGroup[];
  canticles?: { book: string; chapter: number; verses?: string }[];
  antiphon?: BilingualText;
  versicle: { v: BilingualText; r: BilingualText };
}
interface MatinsSundayAntiphons {
  nocturn1: SundayNocturn;
  nocturn2: SundayNocturn;
  nocturn3: SundayNocturn;
}
const sundayAntiphons = matinsSundayAntiphonsData as unknown as MatinsSundayAntiphons;

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
  parts.push({ kind: 'versicle', text: verifiedText({ la: group.versicle.v.la, en: group.versicle.v.en }) });
  return parts;
}

/** Nocturn 3's 3 fixed OT canticles under one shared antiphon — see
 * data/hours/matins-sunday-antiphons.yml's own header. */
function sundayCanticleNocturn(group: SundayNocturn, day: LiturgicalDay): ResolvedPart[] {
  const { incipit, full } = splitNamedAntiphon(verifiedText(group.antiphon ?? {}));
  const opening = isDoubleOrHigher(resolveOfficeWinner(day)) ? full : incipit;
  const parts: ResolvedPart[] = (group.canticles ?? []).map((c, i) => {
    const verses = getScriptureVerses(c.book, c.chapter, c.verses);
    const text: BilingualText = {
      la: verses.map((v) => v.text.la).filter(Boolean).join(' '),
      en: verses.map((v) => v.text.en).filter(Boolean).join(' '),
    };
    return {
      kind: 'canticle' as const,
      canticleId: `${c.book}-${c.chapter}${c.verses ? `-${c.verses}` : ''}`,
      text: verifiedText(text),
      antiphon: i === 0 ? opening : undefined,
    };
  });
  parts.push({ kind: 'antiphon', text: full });
  parts.push({ kind: 'versicle', text: verifiedText(group.versicle.v) });
  return parts;
}

function ferialPsalmody(day: LiturgicalDay): ResolvedPart[] {
  return psalmRefParts(getPsalmsFor('matins', day.weekday));
}

/** Nocturn 1 — always the user's own reading plan, on every kind of day
 * (see this file's header). Empty when nothing's authored for this
 * (temporalId, weekday) yet — an honest absence, not a placeholder. */
function nocturn1ReadingParts(temporalId: string, day: LiturgicalDay): ResolvedPart[] {
  const readings = getBiblePlanReadings(temporalId, day.weekday);
  return readings.map((r) => ({
    kind: 'lesson',
    text: { text: r.text, status: r.status, citation: r.citation },
    nocturn: 1,
    isGospel: r.isGospel,
    responsory: r.responsory ? { text: r.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
  }));
}

/** Every id whose own Nocturn 2/3 content should be gathered for `day` —
 * the office winner (if sanctoral), every commemorated saint, and the
 * plain temporal id itself (for an ordinary day's own patristic content,
 * e.g. a plain Sunday's Moralia-in-Job-style commentary) — deliberately
 * inclusive, not just the winner, per the user's own "be generous, not
 * winner-takes-all" instruction (2026-08). */
function nocturnReadingIds(day: LiturgicalDay, temporalId: string): string[] {
  const ids = new Set<string>();
  if (day.winner.kind === 'sanctoral') ids.add(day.winner.id);
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
    nocturn: r.nocturn,
    isGospel: r.isGospel,
    responsory: r.responsory ? { text: r.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
  };
}

/** Nocturns 2-3's patristic/hagiographic/Gospel content for a 3-nocturn
 * day — gathered from every relevant id (see nocturnReadingIds) plus every
 * currently active octave's own already-authored octave-day reading (see
 * src/propers/octave-readings.ts — built well ahead of this file, never
 * wired to anything until now). Filtered to the requested nocturn number. */
function nocturnReadingParts(nocturn: number, day: LiturgicalDay, temporalId: string, date: string): ResolvedPart[] {
  const parts: ResolvedPart[] = [];
  for (const id of nocturnReadingIds(day, temporalId)) {
    for (const reading of getNocturnReadings(id)) {
      if (reading.nocturn === nocturn) parts.push(nocturnReadingPart(reading));
    }
  }
  if (nocturn === 2) {
    for (const octave of activeOctavesFor(date)) {
      const reading = getOctaveReading(octave.id, octave.dayNumber);
      if (reading) {
        parts.push({
          kind: 'lesson',
          text: { text: reading.text, status: reading.status },
          label: reading.source,
          nocturn: 2,
          isGospel: false,
          responsory: reading.responsory
            ? { text: reading.responsory, status: { la: 'verified', en: 'verified' } }
            : undefined,
        });
      }
    }
  }
  return parts;
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

  const parts: ResolvedPart[] = [
    { kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) },
    plainPsalm(3),
    ...invitatoryParts(day),
    { kind: 'hymn', text: resolveCommon('matins-hymn-ferial') },
  ];

  if (threeNocturns) {
    parts.push(...sundayPsalmNocturn(sundayAntiphons.nocturn1, day));
    parts.push(...nocturn1ReadingParts(temporalId, day));
    parts.push(...sundayPsalmNocturn(sundayAntiphons.nocturn2, day));
    parts.push(...nocturnReadingParts(2, day, temporalId, date));
    parts.push(...sundayCanticleNocturn(sundayAntiphons.nocturn3, day));
    parts.push(...nocturnReadingParts(3, day, temporalId, date));
    parts.push({ kind: 'te-deum', text: resolveCommon('te-deum') });
  } else {
    parts.push(...ferialPsalmody(day));
    parts.push(...nocturn1ReadingParts(temporalId, day));
    parts.push({ kind: 'chapter', text: resolveCommon('matins-capitulum-ferial') });
  }

  parts.push({ kind: 'prayer', text: getDayCollect(day) });

  return { hourId: 'matins', date, parts, dayLabel: getDayLabel(day) };
}
