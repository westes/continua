import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart } from './types';
import type { LiturgicalDay, Weekday } from '../calendar/types';
import { resolveDay } from '../calendar';
import { getDayLabel } from '../calendar/day-label';
import { getPsalmsFor } from '../psalter/distribution';
import { getPsalmVerses } from '../psalter';
import { getOpeningVersicleId } from './opening-versicle';
import { isInTriduum } from '../calendar/temporal';
import { getHymnDoxologyOverrideId } from './hymn-doxology';
import { lookupPart } from './resolve-part';
import { applyFlexaMark } from './antiphon';
import {
  resolveCommon,
  getDayCollect,
  openingAntiphon,
  resolveOfficeWinner,
  resolveMinorHourAntiphon,
  splitNamedAntiphon,
  substituteDoxology,
  isFerialOrVigil,
} from './resolve-common';
import { isAllSouls, buildTerceParts } from './all-souls';
import terceDefinitionData from '../data/hours/terce.yml';
import antiphonsData from '../data/hours/terce-antiphons.yml';

const terceDefinition = terceDefinitionData as HourDefinition;
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
      // Pentecost's octave (Sunday through the following Saturday) swaps
      // Terce's whole hymn to "Veni Creátor Spíritus" -- a real, source-
      // confirmed whole-hymn override, not just a doxology-stanza swap.
      // Sext/None have no such override in the source and are unaffected.
      // Also matches Pentecost's own 3 Ember days (calendar/ember-days.ts)
      // by id prefix, not just the bare 'pentecost-sunday' office winner:
      // those days are still genuinely within the Octave and should keep
      // this swap, but since 2026-09-19 (once they got real content of
      // their own and were added to resolveOfficeWinner's own
      // ALWAYS_OVERRIDE_TEMPORAL_IDS exemption, hours/resolve-common.ts)
      // they no longer report 'pentecost-sunday' as their own office-
      // content winner. Deliberately not switched to a direct
      // activeOctavesFor(day.date) octave-window check instead: that
      // window is a raw 8-day span which -- pre-existing, unrelated to
      // this fix -- technically still covers Trinity Sunday itself
      // (offset 56, the octave's own would-be "day 8"), and only
      // resolveOfficeWinner's own higher-priority 'trinity-sunday' entry
      // in that same exemption set keeps Trinity Sunday out of this swap;
      // reusing that existing precedence is simpler and safer here than
      // re-deriving "is this day really still inside the Octave" from
      // scratch.
      const winnerId = resolveOfficeWinner(day).id;
      const hymnId = winnerId === 'pentecost-sunday' || winnerId.startsWith('ember-pentecost-') ? 'terce-hymn-pentecost-week' : part.textRef.id;
      const hymn = resolveCommon(hymnId);
      const overrideId = getHymnDoxologyOverrideId(day);
      return [{ kind: 'hymn', text: substituteDoxology(hymn, overrideId ? resolveCommon(overrideId) : undefined) }];
    }
    case 'chapter':
      return [{ kind: 'chapter', text: lookupPart({ day, hour: 'terce', part: 'chapter', temporalKeys: [part.textRef.id.replace('terce-capitulum-', '')] }) }];
    case 'day-collect':
      return [{ kind: 'prayer', text: getDayCollect(day) }];
    case 'preces':
      if (part.ferialOnly && !isFerialOrVigil(day)) return [];
      return [{ kind: 'preces', text: resolveCommon(part.textRef.id), label: part.label }];
    case 'closing-antiphon':
      return [{ kind: 'antiphon', text: splitNamedAntiphon(resolveMinorHourAntiphon('terce', day, antiphons[day.weekday])).full }];
    case 'variable': {
      // Only 'by-weekday' applies here — one antiphon framing all three
      // psalms: incipit on the first, full repeat after the third (the
      // 'closing-antiphon' part below), as the reference engine's
      // antetpsalm does.
      const psalmRefs = getPsalmsFor('terce', day.weekday);
      const opening = openingAntiphon(resolveMinorHourAntiphon('terce', day, antiphons[day.weekday]), resolveOfficeWinner(day));
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
      throw new Error(`Terce's ordo doesn't support a '${part.kind}' part`);
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  if (isAllSouls(date)) {
    return { hourId: 'terce', date, parts: buildTerceParts(), dayLabel: getDayLabel(resolveDay(date)) };
  }
  const day = resolveDay(date);
  const parts = terceDefinition.parts.flatMap((part) => resolvePart(part, day));
  return { hourId: 'terce', date, parts, dayLabel: getDayLabel(day) };
}
