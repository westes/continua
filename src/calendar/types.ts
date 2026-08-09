export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

// Deliberately an open string, not a hardcoded union. Which temporal-id a
// given day resolves to — and what it's *called* ("trinitytide" vs "time
// after pentecost") — is a property of data/calendar/easter-offsets.yml and
// fixed-date-calendar.yml, not a compile-time decision. This is what
// actually resolves the "opinionated but configurable" tension: the opinion
// (trinitytide) lives in editable data, not in a TS enum you'd recompile to
// change.
export type Season = string;

// Open-ended on purpose — the actual ranking scheme (double/semidouble/simple,
// or whatever the finalized rank system turns out to be) is a rule decision for
// milestone 4, not a type decision for milestone 0.
export type FeastRank = string;

export interface OccurringFeast {
  id: string;
  name: string;
  rank: FeastRank;
  commemorated: boolean;
  // Placeholder for the first/second-Vespers overlap wrinkle — unresolved until
  // milestone 4 actually needs it.
  vespersFrom?: 'today' | 'firstVespersOfTomorrow';
}

export interface LiturgicalDay {
  /** ISO date, e.g. "2026-08-09" */
  date: string;
  weekday: Weekday;
  /**
   * Real season resolution depends on Easter's date (see calendar/easter.ts,
   * not implemented until milestone 4). Until then this is a placeholder and
   * must not be trusted by any hour's logic.
   */
  season: Season;
  /** Always [] until milestone 4 wires up calendar/feasts.ts. */
  occurring: OccurringFeast[];
}
