import type { Season, DayWinner } from '../calendar/types';

export interface SeasonalPropersTable {
  perAnnum: string;
  bySeason: Record<string, string>;
  byFeastId?: Record<string, string>;
}

/**
 * Shared by everything that picks a common-propers id by season with an
 * optional per-feast override (Prime's chapter responsory verse,
 * `opening-versicle.ts`'s Alleluia/Laus-tibi ending, `marian-antiphon.ts`'s
 * seasonal Marian antiphon) — a feast override wins only when that feast
 * is the day's actual *winner* (not merely commemorated), which wins over
 * season, which wins over the "per annum" default. Live and firing on
 * real season data (`calendar/temporal.ts`'s `resolveSeason`) -- not
 * waiting on anything.
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
