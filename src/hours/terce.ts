import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmsFor } from '../psalter/distribution';
import { getPsalmVerses } from '../psalter';
import { getOpeningVersicleId } from './opening-versicle';
import { isDoubleOrHigher } from './antiphon';
import { resolveCommon, getDayCollect, splitNamedAntiphon } from './resolve-common';
import terceDefinitionData from '../data/hours/terce.yml';
import antiphonsData from '../data/hours/terce-antiphons.yml';

const terceDefinition = terceDefinitionData as HourDefinition;
const antiphons = antiphonsData as Record<Weekday, Partial<Record<string, string>>>;

function resolvePart(part: HourPart, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'opening-versicle':
      return [{ kind: 'versicle', text: resolveCommon(getOpeningVersicleId(day.season, day.winner)) }];
    case 'hymn':
      // Self-contained, no appendDoxology — see terce-hymn.yml.
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
      const psalmRefs = getPsalmsFor('terce', day.weekday);
      const { incipit, full } = splitNamedAntiphon(antiphons[day.weekday]);
      const opening = isDoubleOrHigher(day.winner) ? full : incipit;
      return psalmRefs.map((ref, i) => ({
        kind: 'psalm' as const,
        psalmNumber: ref.number,
        antiphon: i === 0 ? opening : undefined,
        verses: getPsalmVerses(ref.number, ref.verses).map((v) => ({ n: v.n, text: v.text, status: v.status })),
      }));
    }
    // Not used by Terce.
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
      throw new Error(`Terce's ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const parts = terceDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'terce', date, parts, dayLabel: getDayLabel(day) };
}
