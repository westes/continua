import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart } from './types';
import type { LiturgicalDay } from '../calendar/types';
import { resolveEveningDay } from '../calendar/vespers';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmVerses } from '../psalter';
import { getCommonProper } from '../propers';
import { getHymnDoxologyId } from './hymn-doxology';
import { getOpeningVersicleId } from './opening-versicle';
import { getMarianAntiphonId, getMarianAntiphonLabel } from './marian-antiphon';
import { isDoubleOrHigher } from './antiphon';
import { resolveCommon, appendDoxology, splitNamedAntiphon } from './resolve-common';
import complineDefinitionData from '../data/hours/compline.yml';

const complineDefinition = complineDefinitionData as HourDefinition;

// Real practice starts this at Lent proper (Ash Wednesday), not the
// preceding Septuagesima-tide — unlike the opening versicle's Alleluia
// suppression, which does start at Septuagesima (see
// data/hours/opening-by-season.yml). Two different season keys deliberately
// treated differently, not an oversight.
const LENTEN_HYMN_SEASONS = new Set(['lent', 'passiontide']);

function resolvePart(part: HourPart, day: LiturgicalDay): ResolvedPart[] {
  switch (part.kind) {
    case 'hymn': {
      // Lent replaces the whole hymn (not just its doxology) with "Christe,
      // qui lux es et dies" — self-contained, so no appendDoxology here.
      // See compline-hymn-lenten.yml for real caveats about how confident
      // to be that this actually triggers in live practice.
      if (LENTEN_HYMN_SEASONS.has(day.season)) {
        return [{ kind: 'hymn', text: resolveCommon('compline-hymn-lenten') }];
      }
      const body = resolveCommon(part.textRef.id);
      const doxology = resolveCommon(
        getHymnDoxologyId(day.season, day.winner, 'compline-hymn-doxology-per-annum'),
      );
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
    case 'nunc-dimittis': {
      const { incipit, full } = splitNamedAntiphon(getCommonProper('nunc-dimittis-antiphon').text);
      const opening = isDoubleOrHigher(day.winner) ? full : incipit;
      return [
        { kind: 'canticle', canticleId: 'nunc-dimittis', text: resolveCommon('nunc-dimittis'), antiphon: opening },
        { kind: 'antiphon', text: full },
      ];
    }
    case 'marian-antiphon': {
      const id = getMarianAntiphonId(day);
      return [{ kind: 'preces', text: resolveCommon(id), label: getMarianAntiphonLabel(id) }];
    }
    case 'canticle':
      return [{ kind: 'canticle', canticleId: part.canticleId, text: resolveCommon(part.textRef.id) }];
    // Not used by Compline — Prime-only, or milestone-4-only. Throwing
    // rather than silently dropping: if one of these ever shows up in
    // compline.yml, that's a mistake worth surfacing loudly, not hiding.
    case 'martyrology':
    case 'rule-reading':
    case 'creed':
    case 'closing-antiphon':
    case 'by-day-kind':
    case 'variable':
    case 'day-collect':
      throw new Error(`Compline's ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  // Every season/occurring-dependent part below (hymn, doxology, Preces
  // omitOnDouble, opening versicle, Nunc Dimittis rank, Marian antiphon) is
  // an evening-hour concern, so the whole ordo resolves off whichever day's
  // identity actually governs tonight — see calendar/vespers.ts. Nothing
  // here is date-literal the way Prime's Martyrology is, so there's no
  // need to keep a separate "real" day around.
  const day = resolveEveningDay(date);
  const parts = complineDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'compline', date, parts, dayLabel: getDayLabel(day) };
}
