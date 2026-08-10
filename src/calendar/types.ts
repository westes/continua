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
//
// A real limitation this doesn't fully solve: a single `season` string can
// only hold one mutually-exclusive value per day, but several independent
// liturgical windows overlap without sharing boundaries. For example, on a
// real day between Candlemas (Feb 2) and Ash Wednesday, Compline's Marian
// antiphon should already be Ave Regina Caelorum, but Lent's Alleluia
// suppression and hymn swap shouldn't have started yet — two things that
// are both true at once, which one `season` value can't represent.
//
// Real season resolution now exists (calendar/temporal.ts, calendar/easter.ts),
// and the Marian-antiphon case above is handled — but not by adding a
// `season` value for it. hours/marian-antiphon.ts checks the real date
// directly instead of going through `season` at all for that one window.
// That's a fine, scoped fix for one known overlap; it isn't a general
// solution. If another mechanism turns up with the same shape (a window
// that doesn't nest inside one `season` bucket), reach for the same
// pattern — a direct date check bypassing `season` — rather than trying to
// force `season` to hold two truths at once. Only worth generalizing into
// several independent named windows/flags on `LiturgicalDay` itself if a
// third case shows up and the duplication starts to hurt.
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
  /** Real temporal-cycle season, computed via calendar/temporal.ts. */
  season: Season;
  /** Always [] until milestone 4 wires up calendar/feasts.ts. */
  occurring: OccurringFeast[];
}
