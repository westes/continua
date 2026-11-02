import type { ResolvedPart } from './types';
import { getOctaveReadings } from '../propers/octave-readings';
import { getGospelIncipitFromCitation } from '../propers/bible-book-incipits';

export interface OctavePart {
  part: ResolvedPart;
  /** Direct Scripture (sorts with the bible-plan readings in Matins' pool). */
  isScripture: boolean;
}

/** Every Matins reading authored for one octave day as display parts: plain
 * lessons, and each Gospel pericope fused with the homily right after it
 * into one atomic 'gospel' part (so it can never be split across nocturns).
 * Shared by the ordinary Matins pool and All Souls' own Matins. */
export function octaveReadingParts(
  octaveId: string,
  dayNumber: number,
  occasion: string | undefined,
  normalize: <T extends Partial<Record<string, string>>>(text: T) => T,
  isDuplicate: (text: Partial<Record<string, string>>) => boolean = () => false,
): OctavePart[] {
  const readings = getOctaveReadings(octaveId, dayNumber);
  const out: OctavePart[] = [];
  const labelOf = (source: { la?: string; en?: string }) =>
    occasion
      ? {
          la: source.la ? `${source.la} (for ${occasion})` : source.la,
          en: source.en ? `${source.en} (for ${occasion})` : source.en,
        }
      : source;
  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i]!;
    if (isDuplicate(reading.text)) continue;
    if (reading.isGospel) {
      const next = readings[i + 1];
      const homily = next && !next.isGospel && next.id.endsWith('-gospel-homily') ? next : undefined;
      if (homily) {
        i++;
        isDuplicate(homily.text);
      }
      const incipit = getGospelIncipitFromCitation(reading.citation);
      out.push({
        isScripture: false,
        part: {
          kind: 'gospel',
          text: { text: normalize(reading.text), status: reading.status, citation: reading.citation },
          label: incipit ? { la: incipit.la, en: incipit.en } : undefined,
          responsory: reading.responsory ? { text: reading.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
          homily: homily
            ? { source: labelOf(homily.source), text: { text: normalize(homily.text), status: homily.status } }
            : undefined,
        },
      });
      continue;
    }
    out.push({
      isScripture: reading.isScripture,
      part: {
        kind: 'lesson',
        text: { text: normalize(reading.text), status: reading.status },
        label: labelOf(reading.source),
        responsory: reading.responsory ? { text: reading.responsory, status: { la: 'verified', en: 'verified' } } : undefined,
      },
    });
  }
  return out;
}
