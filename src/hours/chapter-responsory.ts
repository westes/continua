import type { LiturgicalDay } from '../calendar/types';
import { resolveSeasonalPropersId } from './seasonal-propers';
import { resolveOfficeWinner } from './resolve-common';
import bySeasonData from '../data/hours/prime-chapter-responsory-by-season.yml';
import byFeastData from '../data/hours/prime-chapter-responsory-by-feast.yml';

const bySeason = bySeasonData as { perAnnum: string; bySeason: Record<string, string> };
const byFeast = byFeastData as { byFeastId: Record<string, string> };

/** Resolves the common-propers id for the chapter responsory's variable
 * verse. Takes the whole `day` and always feeds `resolveOfficeWinner(day)`
 * into the lookup, not raw `day.winner` — `byFeastId` here is currently
 * empty (not yet populated, unlike the structurally feast-invariant
 * opening versicle), so this closes a real latent gap: once a feast
 * override is added, an octave-governed winner will already be seen
 * correctly rather than silently missed. */
export function getChapterResponsoryId(day: LiturgicalDay): string {
  return resolveSeasonalPropersId(day.season, resolveOfficeWinner(day), { ...bySeason, byFeastId: byFeast.byFeastId });
}
