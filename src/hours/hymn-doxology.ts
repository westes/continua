import type { Season, OccurringFeast } from '../calendar/types';
import { resolveSeasonalPropersId } from './seasonal-propers';
import bySeasonData from '../data/hours/hymn-doxology-by-season.yml';
import byFeastData from '../data/hours/hymn-doxology-by-feast.yml';

const bySeason = bySeasonData as { perAnnum: string; bySeason: Record<string, string> };
const byFeast = byFeastData as { byFeastId: Record<string, string> };

/** Resolves the common-propers id for a hymn's seasonal final doxology stanza. */
export function getHymnDoxologyId(season: Season, occurring: OccurringFeast[]): string {
  return resolveSeasonalPropersId(season, occurring, { ...bySeason, byFeastId: byFeast.byFeastId });
}
