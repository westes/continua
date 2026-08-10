import type { Season, DayWinner } from '../calendar/types';
import { resolveSeasonalPropersId } from './seasonal-propers';
import bySeasonData from '../data/hours/prime-chapter-responsory-by-season.yml';
import byFeastData from '../data/hours/prime-chapter-responsory-by-feast.yml';

const bySeason = bySeasonData as { perAnnum: string; bySeason: Record<string, string> };
const byFeast = byFeastData as { byFeastId: Record<string, string> };

/** Resolves the common-propers id for the chapter responsory's variable verse. */
export function getChapterResponsoryId(season: Season, winner: DayWinner): string {
  return resolveSeasonalPropersId(season, winner, { ...bySeason, byFeastId: byFeast.byFeastId });
}
