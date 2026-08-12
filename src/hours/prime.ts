import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay, isSundayOrFeast } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmsFor } from '../psalter/distribution';
import { getPsalmVerses } from '../psalter';
import { getMartyrologyEntryFor } from '../martyrology';
import { getRegulaReadingFor } from '../regula';
import { getChapterResponsoryId } from './chapter-responsory';
import { getHymnDoxologyId } from './hymn-doxology';
import { getOpeningVersicleId } from './opening-versicle';
import { isDoubleOrHigher } from './antiphon';
import { resolveCommon, appendDoxology, splitNamedAntiphon } from './resolve-common';
import primeDefinitionData from '../data/hours/prime.yml';
import antiphonsData from '../data/hours/prime-antiphons.yml';

const primeDefinition = primeDefinitionData as HourDefinition;
const antiphons = antiphonsData as Record<Weekday, Partial<Record<string, string>>>;

function resolvePart(part: HourPart, date: string, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'hymn': {
      const body = resolveCommon(part.textRef.id);
      const doxology = resolveCommon(getHymnDoxologyId(day.season, day.winner, 'hymn-doxology-per-annum'));
      return [{ kind: 'hymn', text: appendDoxology(body, doxology) }];
    }
    case 'chapter':
    case 'responsory':
    case 'versicle':
    case 'prayer':
      return [{ kind: part.kind, text: resolveCommon(part.textRef.id) }];
    case 'preces':
      if (part.omitOnDouble && isDoubleOrHigher(day.winner)) {
        return [];
      }
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'lesson':
      return [{ kind: 'lesson', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) }];
    case 'creed':
      // Real Divinum Officium's actual inclusion rule tangles together
      // rank, commemorations, and version-specific rubrics in a way that
      // isn't worth replicating exactly — this is the honest simplification:
      // Sunday and not a Double-or-higher feast. Octaves aren't modeled at
      // all yet (milestone 4), so they can't suppress it either, same as
      // isDoubleOrHigher's own limitation.
      if (day.weekday !== 'sunday' || isDoubleOrHigher(day.winner)) {
        return [];
      }
      return [{ kind: 'lesson', text: resolveCommon('athanasian-creed'), label: 'Athanasian Creed' }];
    case 'closing-antiphon':
      return [{ kind: 'antiphon', text: splitNamedAntiphon(antiphons[day.weekday]).full }];
    case 'variable':
      if (part.resolve === 'by-season') {
        // Currently only the chapter responsory's verse uses this — see
        // hours/chapter-responsory.ts. by-feast-rank doesn't apply to Prime.
        return [{ kind: 'responsory', text: resolveCommon(getChapterResponsoryId(day.season, day.winner)) }];
      }
      {
        const psalmRefs = getPsalmsFor('prime', day.weekday);
        const { incipit, full } = splitNamedAntiphon(antiphons[day.weekday]);
        // Full text on a Double-or-higher feast, otherwise just the incipit
        // — see hours/antiphon.ts. The full repeat comes later, after the
        // Creed (see 'closing-antiphon'), not tacked onto the last psalm.
        const opening = isDoubleOrHigher(day.winner) ? full : incipit;
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
      return [{ kind: 'canticle', canticleId: part.canticleId, text: resolveCommon(part.textRef.id) }];
    case 'by-day-kind': {
      if (part.omitOnDouble && isDoubleOrHigher(day.winner)) {
        return [];
      }
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
        { kind: 'preces', text: resolveCommon('lesson-close') },
      ];
    }
    // Not used by Prime — Compline-only, or Little-Hours-only.
    case 'nunc-dimittis':
    case 'marian-antiphon':
    case 'day-collect':
    case 'lauds-psalmody':
    case 'lauds-office':
    case 'benedictus':
    case 'suffrages':
    case 'lauds-preces':
    case 'day-collects':
      throw new Error(`Prime's ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const parts = primeDefinition.parts.flatMap((part) => resolvePart(part, date, day));
  return { hourId: 'prime', date, parts, dayLabel: getDayLabel(day) };
}
