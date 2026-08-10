import type { Season, DayWinner } from '../calendar/types';
import { resolveSeasonalPropersId } from './seasonal-propers';
import bySeasonData from '../data/hours/hymn-doxology-by-season.yml';
import byFeastData from '../data/hours/hymn-doxology-by-feast.yml';

const bySeason = bySeasonData as { bySeason: Record<string, string> };
const byFeast = byFeastData as { byFeastId: Record<string, string> };

/**
 * Resolves the common-propers id for a hymn's seasonal final doxology
 * stanza. The seasonal overrides are shared across every hymn (Divinum
 * Officium's own Doxologies.txt table is hymn-agnostic), but the per-annum
 * default is each hymn's own natural ending, so callers supply it.
 */
export function getHymnDoxologyId(season: Season, winner: DayWinner, perAnnumId: string): string {
  return resolveSeasonalPropersId(season, winner, {
    perAnnum: perAnnumId,
    bySeason: bySeason.bySeason,
    byFeastId: byFeast.byFeastId,
  });
}
