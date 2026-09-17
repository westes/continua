import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmsFor } from '../psalter/distribution';
import { getPsalmVerses } from '../psalter';
import { getOpeningVersicleId } from './opening-versicle';
import { isInTriduum } from '../calendar/temporal';
import { getHymnDoxologyOverrideId } from './hymn-doxology';
import { applyFlexaMark } from './antiphon';
import {
  resolveCommon,
  getDayCollect,
  openingAntiphon,
  resolveOfficeWinner,
  resolveMinorHourAntiphon,
  resolveMinorHourChapter,
  substituteDoxology,
  isFerialOrVigil,
} from './resolve-common';
import { isAllSouls, buildSextParts } from './all-souls';
import sextDefinitionData from '../data/hours/sext.yml';
import antiphonsData from '../data/hours/sext-antiphons.yml';

const sextDefinition = sextDefinitionData as HourDefinition;
const antiphons = antiphonsData as Record<Weekday, Partial<Record<string, string>>>;

function resolvePart(part: HourPart, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      // Real Tenebrae/Triduum rubric: this versicle's own baked-in Gloria
      // Patri means the whole thing is dropped, not seasonally varied —
      // same as matins.ts's opening block and compline.ts's own versicle.
      if (isInTriduum(day.date)) {
        return [];
      }
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day)) }];
    case 'hymn': {
      const hymn = resolveCommon(part.textRef.id);
      const overrideId = getHymnDoxologyOverrideId(day);
      return [{ kind: 'hymn', text: substituteDoxology(hymn, overrideId ? resolveCommon(overrideId) : undefined) }];
    }
    case 'chapter':
      return [{ kind: 'chapter', text: resolveMinorHourChapter('sext', day, part.textRef.id) }];
    case 'day-collect':
      return [{ kind: 'prayer', text: getDayCollect(day) }];
    case 'preces':
      if (part.ferialOnly && !isFerialOrVigil(day)) return [];
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'variable': {
      // Only 'by-weekday' applies here — one antiphon framing all three
      // psalms, no closing repeat (unlike Prime): confirmed directly
      // against the engine, Capitulum follows the third psalm immediately.
      const psalmRefs = getPsalmsFor('sext', day.weekday);
      const opening = openingAntiphon(resolveMinorHourAntiphon('sext', day, antiphons[day.weekday]), resolveOfficeWinner(day));
      return psalmRefs.map((ref, i) => {
        const rawVerses = getPsalmVerses(ref.number, ref.verses).map((v) => ({ n: v.n, text: v.text, status: v.status }));
        const { verses, antiphon } = applyFlexaMark(rawVerses, i === 0 ? opening : undefined);
        return {
          kind: 'psalm' as const,
          psalmNumber: ref.number,
          antiphon,
          verses,
          verseRange: ref.verses,
        };
      });
    }
    // Not used by Sext.
    case 'prayer':
    case 'responsory':
    case 'versicle':
    case 'psalm':
    case 'canticle':
    case 'lesson':
    case 'martyrology':
    case 'rule-reading':
    case 'by-day-kind':
    case 'creed':
    case 'closing-antiphon':
    case 'nunc-dimittis':
    case 'marian-antiphon':
    case 'lauds-psalmody':
    case 'lauds-office':
    case 'benedictus':
    case 'suffrages':
    case 'lauds-preces':
    case 'day-collects':
    case 'vespers-psalmody':
    case 'vespers-office':
    case 'magnificat':
    case 'vespers-preces':
      throw new Error(`Sext's ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  if (isAllSouls(date)) {
    return { hourId: 'sext', date, parts: buildSextParts(), dayLabel: getDayLabel(resolveDay(date)) };
  }
  const day = resolveDay(date);
  const parts = sextDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'sext', date, parts, dayLabel: getDayLabel(day) };
}
