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

// The old (pre-1955) rank scale, six levels, low to high. Deliberately a
// closed union rather than an open string like Season — the whole point of
// calendar/commemorations.ts's decideOccurrence is to compare two of these
// with explicit, readable rules, which only works if the set of values is
// fixed and known. See calendar/types.ts's TemporalCategory doc comment for
// the other half of that comparison.
export type FeastClass = 'simplex' | 'semiduplex' | 'duplex' | 'duplex-majus' | 'duplex-2-classis' | 'duplex-1-classis';

// A day's own precedence class *before* any sanctoral feast is considered —
// i.e. what the temporal cycle alone says this day is entitled to. This is
// coarser than `season` on purpose: several different seasons share the
// same precedence behavior (Advent/Septuagesima/Lent/Passiontide Sundays
// are all "privileged" in the same way; Epiphanytide/Trinitytide Sundays
// are all "ordinary" in the same way), and decideOccurrence only cares
// about that behavior, not which season produced it. See
// data/calendar/temporal-categories.yml for which season maps to which
// category — reconstructed from general knowledge of the pre-1955
// tradition, not yet verified against a primary source, so expect
// corrections.
export type TemporalCategory = 'ordinary-feria' | 'privileged-feria' | 'ordinary-sunday' | 'privileged-sunday';

export interface OccurringFeast {
  id: string;
  name: string;
  rank: FeastClass;
  commemorated: boolean;
  // Set by calendar/vespers.ts's resolveEveningDay when this feast's First
  // Vespers is being anticipated this evening (i.e. this OccurringFeast
  // belongs to *tomorrow*, but is winning tonight's Vespers/Compline).
  vespersFrom?: 'today' | 'firstVespersOfTomorrow';
}

export interface LiturgicalDay {
  /** ISO date, e.g. "2026-08-09" */
  date: string;
  weekday: Weekday;
  /** Real temporal-cycle season, computed via calendar/temporal.ts. */
  season: Season;
  /** This day's own precedence class, before any sanctoral feast wins or loses against it. */
  temporalCategory: TemporalCategory;
  /** The feast(s) actually occurring — real, via calendar/feasts.ts + calendar/commemorations.ts. */
  occurring: OccurringFeast[];
}
