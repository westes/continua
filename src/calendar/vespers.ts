// First vs. Second Vespers: whether an evening hour (Vespers, Compline)
// belongs to *today* (Second Vespers, closing today's own office) or
// anticipates *tomorrow* (First Vespers of a higher-ranking day) — e.g.
// Alma Redemptoris Mater starting at Compline the Saturday evening before
// Advent I, not on Advent Sunday itself. See calendar/commemorations.ts for
// the sibling temporal-vs-sanctoral decision this mirrors.
//
// Same reconstruction caveat as commemorations.ts/temporal-categories.yml:
// best-effort, not sourced from a primary text for this era, expect
// corrections.
import type { LiturgicalDay } from './types';
import { resolveDay } from './index';
import { addDays } from './date-math';
import { easterOffsetOf } from './temporal';
import { isAtLeast } from './commemorations';

/**
 * Fixed/movable "feasts of the Lord" load-bearing elsewhere in this app
 * (season boundaries, hours/marian-antiphon.ts's Candlemas window) but not
 * yet modeled as real sanctoral/occurring entries — listed explicitly here
 * so they still participate in First Vespers eligibility, rather than
 * silently having none. Not a general mechanism, just this short, known
 * list; a real sanctoral entry for any of these would make this
 * redundant for that one date once added.
 */
function isMajorFixedFeastOfTheLord(isoDate: string): boolean {
  const monthDay = isoDate.slice(5);
  if (monthDay === '12-25' || monthDay === '01-06' || monthDay === '02-02') {
    return true; // Christmas, Epiphany, Candlemas
  }
  const offset = easterOffsetOf(isoDate);
  return offset === 0 || offset === 39 || offset === 60 || offset === 68; // Easter, Ascension, Corpus Christi, Sacred Heart
}

/** Does this day's evening claim First Vespers at all (for the day *after* it)? */
function hasFirstVespers(day: LiturgicalDay): boolean {
  if (day.weekday === 'sunday' || isMajorFixedFeastOfTheLord(day.date)) {
    return true;
  }
  return day.winner.kind === 'sanctoral' && isAtLeast(day.winner.rank, 'duplex-majus');
}

/** Does this day keep its own Second Vespers regardless of what tomorrow is? */
function keepsOwnSecondVespers(day: LiturgicalDay): boolean {
  if (
    day.weekday === 'sunday' ||
    day.temporalCategory === 'privileged-feria-minor' ||
    day.temporalCategory === 'privileged-feria' ||
    day.temporalCategory === 'privileged-feria-major' ||
    isMajorFixedFeastOfTheLord(day.date)
  ) {
    return true;
  }
  return day.winner.kind === 'sanctoral' && isAtLeast(day.winner.rank, 'duplex-2-classis');
}

function anticipated(tomorrow: LiturgicalDay): LiturgicalDay {
  if (tomorrow.winner.kind === 'sanctoral') {
    return { ...tomorrow, winner: { ...tomorrow.winner, vespersFrom: 'firstVespersOfTomorrow' } };
  }
  return tomorrow;
}

/**
 * Resolves which day's identity actually governs this evening's office.
 * Returns `resolveDay(isoDate)` unchanged unless tomorrow has First
 * Vespers *and* today doesn't keep its own Second Vespers regardless — in
 * which case returns tomorrow's `LiturgicalDay`, with `vespersFrom:
 * 'firstVespersOfTomorrow'` set on its winner (if sanctoral) so callers
 * can tell the difference from an ordinary day.
 *
 * One deliberate absolute exception, caught by a failing test: a day on
 * `isMajorFixedFeastOfTheLord`'s list always wins tomorrow's Vespers,
 * *before* checking whether today would otherwise keep its own — Easter
 * displaces even Holy Saturday's privileged-feria status (the classic
 * case: the Vigil already belongs to Easter, not to Holy Saturday), and
 * would likewise displace an actual Sunday if one ever landed on Dec 24 or
 * an Ember Saturday. This is why it's a short, explicit list rather than a
 * threshold: these particular days are understood to be *absolute*.
 */
export function resolveEveningDay(isoDate: string): LiturgicalDay {
  const today = resolveDay(isoDate);
  const tomorrow = resolveDay(addDays(isoDate, 1));

  if (isMajorFixedFeastOfTheLord(tomorrow.date)) {
    return anticipated(tomorrow);
  }
  if (keepsOwnSecondVespers(today)) {
    return today;
  }
  if (!hasFirstVespers(tomorrow)) {
    return today;
  }
  return anticipated(tomorrow);
}
