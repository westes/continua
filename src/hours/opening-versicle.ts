import type { LiturgicalDay } from '../calendar/types';
import { resolveSeasonalPropersId } from './seasonal-propers';
import { resolveOfficeWinner } from './resolve-common';
import bySeasonData from '../data/hours/opening-by-season.yml';

const bySeason = bySeasonData as { perAnnum: string; bySeason: Record<string, string> };

/** Resolves the common-propers id for the opening versicle's ending (Allelúja
 * vs. Laus tibi). Takes the whole `day` (not a bare `season`/`winner` pair)
 * so it always feeds `resolveOfficeWinner(day)` into the lookup — this
 * content is currently season-only (no `byFeastId` table exists here) so an
 * octave-governed winner is a no-op today, but this keeps the one rule
 * ("always resolveOfficeWinner, never raw day.winner") uniform across every
 * content lookup rather than leaving it to each caller. */
export function getOpeningVersicleId(day: LiturgicalDay): string {
  return resolveSeasonalPropersId(day.season, resolveOfficeWinner(day), bySeason);
}
