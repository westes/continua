import type { Season, OccurringFeast } from '../calendar/types';
import { resolveSeasonalPropersId } from './seasonal-propers';
import bySeasonData from '../data/hours/prime-opening-by-season.yml';

const bySeason = bySeasonData as { perAnnum: string; bySeason: Record<string, string> };

/** Resolves the common-propers id for the opening versicle's ending (Allelúja vs. Laus tibi). */
export function getOpeningVersicleId(season: Season, occurring: OccurringFeast[]): string {
  return resolveSeasonalPropersId(season, occurring, bySeason);
}
