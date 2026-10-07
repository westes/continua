import { getSaintRecord } from '../calendar/feasts';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';

/** The second id whose authored office content a feast falls back to, part by
 * part, after its own: a named temporal feast's `officeFrom` (Easter Monday
 * shares Easter Sunday's), or a saint's `propers` id when it differs from the
 * saint id (St. Michael, Sept 29, shares the Apparition's). */
export function sharedOfficeId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const temporal = getTemporalFeastRecord(id)?.officeFrom;
  if (temporal) return temporal;
  const propers = getSaintRecord(id)?.propers;
  return propers && propers !== id ? propers : undefined;
}
