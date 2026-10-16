import type { LanguageCode } from '../psalter/types';
import { resolveDay, resolveActiveOctave } from '../calendar';
import { getSaintRecord } from '../calendar/feasts';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { resolveOfficeWinner } from './resolve-common';

/** "St. Monica" and "Our Lady" stand alone; "The Annunciation" and
 * "Dedication of ..." take a lowercase "the". */
function withArticle(name: string): string {
  if (/^(St\.|Ss\.|Our )/.test(name)) return name;
  if (/^The /.test(name)) return `the ${name.slice(4)}`;
  return `the ${name}`;
}

/**
 * The Martyrology's announcement of the feast (or octave day) kept on
 * `isoDate` — the date the Martyrology entry is *for*, i.e. the morrow of
 * the day it's read — or undefined when there's nothing to announce.
 *
 * Only the day's office winner announces, and only if its record opts in
 * (`martyrologyAnnouncement`, or `closingDayAnnouncement` on its octave): a
 * commemoration never does, and a feast the user's calendar doesn't keep
 * never gets here at all. An octave announces only on its closing day (and
 * only when it wins); its interior days stay silent, as in the reference.
 * The wording is generated from the record's name, English only.
 */
export function martyrologyAnnouncementFor(
  isoDate: string,
): Partial<Record<LanguageCode, string>> | undefined {
  const winner = resolveOfficeWinner(resolveDay(isoDate));
  const record = winner.kind === 'sanctoral' ? getSaintRecord(winner.id) : getTemporalFeastRecord(winner.id);
  if (!record) return undefined;

  const octave = resolveActiveOctave(isoDate);
  if (octave && octave.id === winner.id && octave.dayNumber > 1) {
    return octave.isClosingDay && record.octave?.closingDayAnnouncement
      ? { en: `On the morrow is the octave day of ${withArticle(record.name)}.` }
      : undefined;
  }
  if (!record.martyrologyAnnouncement) return undefined;
  if (/^Vigil of /.test(record.name)) {
    return { en: `On the morrow is the eve of ${record.name.replace(/^Vigil of /, '')}.` };
  }
  if (/^(The )?Octave Day of /.test(record.name)) {
    return { en: `On the morrow is ${withArticle(record.name)}.` };
  }
  return { en: `On the morrow we celebrate the feast of ${withArticle(record.name)}.` };
}
