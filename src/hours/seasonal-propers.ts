import type { Season, OccurringFeast } from '../calendar/types';

export interface SeasonalPropersTable {
  perAnnum: string;
  bySeason: Record<string, string>;
  byFeastId?: Record<string, string>;
}

/**
 * Shared by everything that picks a common-propers id by season with a
 * per-feast override (the chapter responsory's verse, the hymn doxology,
 * and presumably more once milestone 4 lands) — feast overrides win over
 * season, which wins over the "per annum" default. `occurring` is always
 * [] until milestone 4, so today this always returns a season match or
 * perAnnum.
 */
export function resolveSeasonalPropersId(
  season: Season,
  occurring: OccurringFeast[],
  table: SeasonalPropersTable,
): string {
  for (const feast of occurring) {
    const override = table.byFeastId?.[feast.id];
    if (override) {
      return override;
    }
  }
  return table.bySeason[season] ?? table.perAnnum;
}
