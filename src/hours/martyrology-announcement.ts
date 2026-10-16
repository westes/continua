import type { LanguageCode } from '../psalter/types';
import { resolveDay, resolveActiveOctave } from '../calendar';
import { getSaintRecord } from '../calendar/feasts';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { resolveOfficeWinner } from './resolve-common';

/**
 * The Martyrology's announcement of the feast (or octave day) kept on
 * `isoDate` — the date the Martyrology entry is *for*, i.e. the morrow of
 * the day it's read — or undefined when there's nothing to announce.
 *
 * Only the day's office winner announces: a commemoration never does, and a
 * feast the user's calendar doesn't keep never gets here at all. An octave
 * announces only on its closing day (and only when it wins); its interior
 * days stay silent, as in the reference.
 */
export function martyrologyAnnouncementFor(
  isoDate: string,
): Partial<Record<LanguageCode, string>> | undefined {
  const winner = resolveOfficeWinner(resolveDay(isoDate));
  const record = winner.kind === 'sanctoral' ? getSaintRecord(winner.id) : getTemporalFeastRecord(winner.id);
  if (!record) return undefined;

  const octave = resolveActiveOctave(isoDate);
  if (octave && octave.id === winner.id && octave.dayNumber > 1) {
    return octave.isClosingDay ? record.octave?.closingDayAnnouncement : undefined;
  }
  return record.martyrologyAnnouncement;
}
