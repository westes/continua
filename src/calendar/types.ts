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

// The old (pre-1955) rank scale, low to high. Deliberately a closed union
// rather than an open string like Season — the whole point of
// calendar/commemorations.ts's decideOccurrence is to compare two of these
// with explicit, readable rules, which only works if the set of values is
// fixed and known. See calendar/types.ts's TemporalCategory doc comment for
// the other half of that comparison.
//
// `vigil` sits between `simplex` and `semiduplex` on purpose — it's the
// same strength as `simplex` for the "does this win against a Sunday"
// question (both lose and get transferred rather than fighting the day
// directly), but ranks strictly above `simplex` for the *separate*
// "two saints collide on the same landing day" comparison
// (calendar/collision.ts). One ordering serves both; see the design
// discussion in project history for why that isn't a coincidence.
export type FeastClass =
  | 'simplex'
  | 'vigil'
  | 'semiduplex'
  | 'duplex'
  | 'duplex-majus'
  | 'duplex-2-classis'
  | 'duplex-1-classis';

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
// `privileged-feria` and `privileged-feria-major` are two real, distinct
// tiers (confirmed by finding a plain Duplex saint, St. Gregory the Great,
// outright winning against a Lenten Ember Saturday in the real Monastic
// 1617 engine, which the original single-tier model wrongly forbade) —
// see calendar/commemorations.ts's rules for `privileged-feria` (behaves
// like `ordinary-sunday`: Duplex+ wins outright) vs `privileged-feria-major`
// (behaves like `privileged-sunday`: never displaced at all, confirmed by
// checking St. Mark, Duplex II. classis, merely commemorated rather than
// winning within the Easter Octave). See data/calendar/temporal-
// categories.yml for exactly which days fall in which tier — some of that
// split (e.g. whether Pentecost's own Ember days share Lent's lesser tier
// or Easter's major one) is still a reconstructed guess, not verified.
// `privileged-feria-minor` is a third, weaker tier, added during the
// December sanctoral pull after finding Advent's own ordinary (non-Ember)
// ferias have real standing of their own in the live engine — a Simplex
// saint (e.g. St. Bibiana, Dec 2) is merely commemorated there, while a
// Semiduplex+ saint (e.g. St. Nicholas, Dec 6) wins outright with the
// feria itself commemorated in return — neither of which the original
// `ordinary-feria` fallback (any saint wins, nothing ever commemorated)
// could represent. Lent's own ordinary ferias are documented as sharing
// this same real-world property but are NOT switched to this tier yet —
// unverified this session, left as `ordinary-feria` pending a future check.
export type TemporalCategory =
  | 'ordinary-feria'
  | 'privileged-feria-minor'
  | 'privileged-feria'
  | 'privileged-feria-major'
  | 'ordinary-sunday'
  | 'privileged-sunday';

export interface SanctoralIdentity {
  id: string;
  name: string;
  rank: FeastClass;
}

/**
 * Attached to a saint's own record (calendar/feasts.ts's SaintRecord) or a
 * temporal feast's (calendar/temporal-feasts.ts's TemporalFeastRecord) to
 * declare that it carries an octave — commemorated daily for `days` days
 * after its own feast, layered on top of whatever normally wins each of
 * those days. `enabled: false` (or the field simply absent) means no
 * octave; `{ enabled: true }` alone is valid and uses every default below,
 * satisfying the "turned on but no octave data authored yet" case —
 * calendar/octaves.ts is the "generic way to commemorate an octave" that
 * makes that minimal declaration meaningful on its own.
 *
 * Matins readings, where sourced, are looked up separately by convention
 * (propers/octave-readings.ts's `getOctaveReading(octaveId, dayNumber)`,
 * id `${octaveId}-octave-day-${dayNumber}`) rather than declared here —
 * they vary day to day within a single octave (confirmed: the Assumption's
 * own octave gives different patristic sermon excerpts on day 2 vs. day
 * 5), so there's no single id to put on this config, and it's normal for
 * some days to have none authored at all.
 */
export interface OctaveConfig {
  enabled: boolean;
  /** Length of the octave in days, inclusive of the feast's own day. Default 8. */
  days?: number;
  /** Rank threshold: an occurring saint at this rank or higher keeps the
   * day for itself (the octave is merely commemorated back); below it, the
   * octave wins the day instead and the saint is commemorated. Default
   * 'semiduplex' — i.e. only a Simplex loses to the octave — matching
   * every octave checked so far except Pentecost's (see
   * data/calendar/temporal-feasts/pentecost-sunday.yml), which is
   * stricter (`duplex`). */
  wins?: FeastClass;
  /** The octave's own effective rank on its *last* day specifically (the
   * "in Octava" closing day) instead of `wins` — live-verified as a real,
   * general pattern rather than a per-saint quirk: both St. Lawrence's
   * own Aug 17 and the Assumption's own Aug 22 show as Duplex, elevated
   * above their otherwise-Semiduplex ordinary in-between days. Default
   * 'duplex'. Feeds both the rival-saint threshold (calendar/octaves.ts's
   * `strictestThreshold`) and octave-vs-octave precedence
   * (`resolveActiveOctave`) on that one day. */
  closingDayRank?: FeastClass;
}

export type DayWinner =
  | { kind: 'temporal'; id: string }
  | ({
      kind: 'sanctoral';
      // Set by calendar/vespers.ts's resolveEveningDay when this feast's
      // First Vespers is being anticipated this evening (i.e. this feast
      // belongs to *tomorrow*, but is winning tonight's Vespers/Compline).
      vespersFrom?: 'firstVespersOfTomorrow';
    } & SanctoralIdentity);

/**
 * A day can have more than one of these at once (a transferred feast can
 * displace a native saint who then also gets commemorated, alongside the
 * Sunday whose own occurrence pushed the transfer in the first place, or —
 * since octaves were modeled — several overlapping octaves stacking on one
 * date, e.g. Christmas + St. Stephen + St. John all commemorated together
 * within the Christmas Octave) — hence a list, not a single flag.
 */
export type Commemoration =
  | { kind: 'temporal'; id: string }
  | ({
      kind: 'sanctoral';
      // Set by calendar/vespers.ts's resolveEveningDay when this
      // commemoration exists only because Vespers/Compline crossed a day
      // boundary (First Vespers anticipation, or a kept Second Vespers
      // still noting the displaced neighbor) — 'today' for the real
      // Divino Afflatu "commemoratio de præcedenti" case, 'tomorrow' for
      // "commemoratio de sequenti". Left unset for an ordinary same-day
      // commemoration (a real collision, an octave day, etc.), which
      // carries no such qualifier.
      vespersNote?: 'today' | 'tomorrow';
    } & SanctoralIdentity)
  | { kind: 'octave'; id: string; name: string };

export interface LiturgicalDay {
  /** ISO date, e.g. "2026-08-09" */
  date: string;
  weekday: Weekday;
  /** Real temporal-cycle season, computed via calendar/temporal.ts. */
  season: Season;
  /** This day's own precedence class, before any sanctoral feast wins or loses against it. */
  temporalCategory: TemporalCategory;
  /** Whichever office actually governs the day. */
  winner: DayWinner;
  /** Everything else commemorated alongside the winner — see the doc comment on Commemoration. */
  commemorations: Commemoration[];
}
