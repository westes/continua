import type { Season, DayWinner } from '../calendar/types';

export interface SeasonalPropersTable {
  perAnnum: string;
  bySeason: Record<string, string>;
  byFeastId?: Record<string, string>;
}

/**
 * Shared by everything that picks a common-propers id by season with a
 * per-feast override (the chapter responsory's verse, the hymn doxology,
 * and presumably more once milestone 4 lands) — a feast override wins only
 * when that feast is the day's actual *winner* (not merely commemorated),
 * which wins over season, which wins over the "per annum" default.
 */
export function resolveSeasonalPropersId(season: Season, winner: DayWinner, table: SeasonalPropersTable): string {
  if (winner.kind === 'sanctoral') {
    const override = table.byFeastId?.[winner.id];
    if (override) {
      return override;
    }
  }
  return table.bySeason[season] ?? table.perAnnum;
}
