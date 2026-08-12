import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmsFor } from '../psalter/distribution';
import { getPsalmVerses } from '../psalter';
import { getOpeningVersicleId } from './opening-versicle';
import { isDoubleOrHigher } from './antiphon';
import { resolveCommon, getDayCollect, splitNamedAntiphon } from './resolve-common';
import sextDefinitionData from '../data/hours/sext.yml';
import antiphonsData from '../data/hours/sext-antiphons.yml';

const sextDefinition = sextDefinitionData as HourDefinition;
const antiphons = antiphonsData as Record<Weekday, Partial<Record<string, string>>>;

function resolvePart(part: HourPart, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) }];
    case 'hymn':
      // Self-contained, no appendDoxology — see sext-hymn.yml.
      return [{ kind: 'hymn', text: resolveCommon(part.textRef.id) }];
    case 'chapter':
      return [{ kind: 'chapter', text: resolveCommon(part.textRef.id) }];
    case 'day-collect':
      return [{ kind: 'prayer', text: getDayCollect(day) }];
    case 'preces':
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'variable': {
      // Only 'by-weekday' applies here — one antiphon framing all three
      // psalms, no closing repeat (unlike Prime): confirmed directly
      // against the engine, Capitulum follows the third psalm immediately.
      const psalmRefs = getPsalmsFor('sext', day.weekday);
      const { incipit, full } = splitNamedAntiphon(antiphons[day.weekday]);
      const opening = isDoubleOrHigher(day.winner) ? full : incipit;
      return psalmRefs.map((ref, i) => ({
        kind: 'psalm' as const,
        psalmNumber: ref.number,
        antiphon: i === 0 ? opening : undefined,
        verses: getPsalmVerses(ref.number, ref.verses).map((v) => ({ n: v.n, text: v.text, status: v.status })),
      }));
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
      throw new Error(`Sext's ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const parts = sextDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'sext', date, parts, dayLabel: getDayLabel(day) };
}
