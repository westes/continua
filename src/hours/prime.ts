import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay, isSundayOrFeast } from '../calendar';
import { getPsalmsFor } from '../psalter/distribution';
import { getPsalmVerses } from '../psalter';
import { getCommonProper } from '../propers';
import { getMartyrologyEntryFor } from '../martyrology';
import { getRegulaReadingFor } from '../regula';
import { getChapterResponsoryId } from './chapter-responsory';
import { getHymnDoxologyId } from './hymn-doxology';
import { getOpeningVersicleId } from './opening-versicle';
import { splitAntiphon, isDoubleOrHigher } from './antiphon';
import primeDefinitionData from '../data/hours/prime.yml';
import antiphonsData from '../data/hours/prime-antiphons.yml';

const primeDefinition = primeDefinitionData as HourDefinition;
const antiphons = antiphonsData as Record<Weekday, Partial<Record<string, string>>>;

function resolveCommon(id: string): ResolvedText {
  const proper = getCommonProper(id);
  return { text: proper.text, status: proper.status, citation: proper.citation };
}

function verifiedText(text: Partial<Record<string, string>>): ResolvedText {
  const status: Partial<Record<string, 'verified'>> = {};
  for (const lang of Object.keys(text)) {
    status[lang] = 'verified';
  }
  return { text, status };
}

const STATUS_RANK = { verified: 0, draft: 1, missing: 2 } as const;

/** Joins a hymn's body with its (seasonally-variable) final doxology
 * stanza, per language — status is the worse of the two per language. */
function appendDoxology(body: ResolvedText, doxology: ResolvedText): ResolvedText {
  const text: Partial<Record<string, string>> = { ...body.text };
  const status: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = { ...body.status };
  for (const lang of Object.keys(doxology.text)) {
    const doxText = doxology.text[lang];
    if (doxText) {
      text[lang] = text[lang] ? `${text[lang]}\n\n${doxText}` : doxText;
    }
    const bodyStatus = status[lang] ?? 'missing';
    const doxStatus = doxology.status[lang] ?? 'missing';
    status[lang] = STATUS_RANK[doxStatus] > STATUS_RANK[bodyStatus] ? doxStatus : bodyStatus;
  }
  return { text, status };
}

/** Splits a weekday's stored antiphon (one string per language, each with
 * an embedded "*") into its incipit and full forms, per language — each
 * prefixed "Ant. " inline, the same way "V."/"R." are baked directly into
 * versicle text rather than rendered as a separate UI marker. */
function splitWeekdayAntiphon(weekday: Weekday): { incipit: ResolvedText; full: ResolvedText } {
  const incipitText: Partial<Record<string, string>> = {};
  const fullText: Partial<Record<string, string>> = {};
  for (const [lang, text] of Object.entries(antiphons[weekday])) {
    if (!text) {
      continue;
    }
    const split = splitAntiphon(text);
    incipitText[lang] = `Ant. ${split.incipit}`;
    fullText[lang] = `Ant. ${split.full}`;
  }
  return { incipit: verifiedText(incipitText), full: verifiedText(fullText) };
}

function resolvePart(part: HourPart, date: string, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'hymn': {
      const body = resolveCommon(part.textRef.id);
      const doxology = resolveCommon(getHymnDoxologyId(day.season, day.occurring));
      return [{ kind: 'hymn', text: appendDoxology(body, doxology) }];
    }
    case 'chapter':
    case 'responsory':
    case 'versicle':
    case 'prayer':
      return [{ kind: part.kind, text: resolveCommon(part.textRef.id) }];
    case 'preces':
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'lesson':
      return [{ kind: 'lesson', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.occurring)) }];
    case 'creed':
      // Real Divinum Officium's actual inclusion rule tangles together
      // rank, commemorations, and version-specific rubrics in a way that
      // isn't worth replicating exactly — this is the honest simplification:
      // Sunday and not a Double-or-higher feast. Octaves aren't modeled at
      // all yet (milestone 4), so they can't suppress it either, same as
      // isDoubleOrHigher's own limitation.
      if (day.weekday !== 'sunday' || isDoubleOrHigher(day.occurring)) {
        return [];
      }
      return [{ kind: 'lesson', text: resolveCommon('athanasian-creed'), label: 'Athanasian Creed' }];
    case 'closing-antiphon':
      return [{ kind: 'antiphon', text: splitWeekdayAntiphon(day.weekday).full }];
    case 'variable':
      if (part.resolve === 'by-season') {
        // Currently only the chapter responsory's verse uses this — see
        // hours/chapter-responsory.ts. by-feast-rank doesn't apply to Prime.
        return [{ kind: 'responsory', text: resolveCommon(getChapterResponsoryId(day.season, day.occurring)) }];
      }
      {
        const psalmRefs = getPsalmsFor('prime', day.weekday);
        const { incipit, full } = splitWeekdayAntiphon(day.weekday);
        // Full text on a Double-or-higher feast, otherwise just the incipit
        // — see hours/antiphon.ts. The full repeat comes later, after the
        // Creed (see 'closing-antiphon'), not tacked onto the last psalm.
        const opening = isDoubleOrHigher(day.occurring) ? full : incipit;
        return psalmRefs.map((ref, i) => ({
          kind: 'psalm' as const,
          psalmNumber: ref.number,
          antiphon: i === 0 ? opening : undefined,
          verses: getPsalmVerses(ref.number, ref.verses).map((v) => ({ n: v.n, text: v.text, status: v.status })),
        }));
      }
    case 'psalm':
      return [
        {
          kind: 'psalm',
          psalmNumber: part.psalmNumber,
          verses: getPsalmVerses(part.psalmNumber, part.verses).map((v) => ({
            n: v.n,
            text: v.text,
            status: v.status,
          })),
        },
      ];
    case 'canticle':
      return [{ kind: 'canticle', canticleId: part.canticleId }];
    case 'by-day-kind': {
      const ref = isSundayOrFeast(day) ? part.sundayOrFeastRef : part.ferialRef;
      if (part.resolvedKind === 'preces') {
        return [{ kind: 'preces', text: resolveCommon(ref.id), label: part.label }];
      }
      return [{ kind: part.resolvedKind, text: resolveCommon(ref.id) }];
    }
    case 'martyrology': {
      const entry = getMartyrologyEntryFor(date);
      return [{ kind: 'lesson', text: { text: entry.text, status: entry.status }, label: 'Martyrology' }];
    }
    case 'rule-reading': {
      const reading = getRegulaReadingFor(date);
      const label = reading.label.en ?? reading.label.la;
      return [
        { kind: 'preces', text: resolveCommon('prime-regula-blessing') },
        { kind: 'lesson', text: { text: reading.text, status: reading.status }, label },
        { kind: 'preces', text: resolveCommon('prime-lesson-close') },
      ];
    }
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const parts = primeDefinition.parts.flatMap((part) => resolvePart(part, date, day));
  return { hourId: 'prime', date, parts };
}
