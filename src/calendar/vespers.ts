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
import type { Commemoration, DayWinner, LiturgicalDay } from './types';
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
  // Live-verified (2026-08): Ss. Cyriacus/Largus/Smaragdus (Aug 8, plain
  // Semiduplex) claims First Vespers over St. Donatus's Aug 7 — "Vespera
  // de sequenti" in the real Monastic 1617 engine — so Semiduplex clears
  // this bar, not duplex-majus as originally guessed (unverified at the
  // time). Matches keepsOwnSecondVespers's own privileged-feria-minor
  // threshold just below, which uses the same cutoff.
  return day.winner.kind === 'sanctoral' && isAtLeast(day.winner.rank, 'semiduplex');
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

/**
 * Whichever of today/tomorrow does *not* govern tonight's Vespers is still
 * commemorated there, unless it's Simplex (or a bare temporal winner, with
 * no standing of its own — same "no standing to defend" idea
 * commemorations.ts's `ordinary-feria` case already uses during the day).
 * Live-verified both directions, 2026-08:
 *   - Aug 8 -> 9 (Ss. Cyriaci/Largi/Smaragdi, Semiduplex, before an
 *     ordinary Sunday): today loses the evening, today is still
 *     commemorated ("commemoratio de præcedenti").
 *   - Jul 25 -> 26 (St. James, Duplex II. classis, kept second Vespers
 *     regardless): tomorrow (St. Anne) loses the evening but is still
 *     commemorated ("commemoratio de sequenti").
 *   - Aug 7 -> 8 (St. Donatus, Simplex, before Ss. Cyriaci/etc.): today
 *     loses the evening and is *not* commemorated ("nihil de
 *     præcedenti") — the one live case pinning down the Simplex
 *     exclusion specifically, not just inferred from the daytime rule.
 * Not yet checked against a case where the losing side is Simplex on the
 * *winning* side of the pair (i.e. today keeps its own Vespers and
 * tomorrow is the Simplex one) — inferred to behave the same way by
 * symmetry with the daytime rule, not independently live-verified.
 */
function commemorationOf(loser: DayWinner): Commemoration | undefined {
  if (loser.kind !== 'sanctoral' || loser.rank === 'simplex') {
    return undefined;
  }
  return { kind: 'sanctoral', id: loser.id, name: loser.name, rank: loser.rank };
}

function tagVespersFrom(tomorrow: LiturgicalDay): LiturgicalDay {
  if (tomorrow.winner.kind !== 'sanctoral') {
    return tomorrow;
  }
  return { ...tomorrow, winner: { ...tomorrow.winner, vespersFrom: 'firstVespersOfTomorrow' } };
}

/** The ordinary anticipation path: tag tomorrow's identity, then layer in
 * today's commemoration if it's eligible (see commemorationOf). Not used
 * by the isMajorFixedFeastOfTheLord override below — whether Christmas/
 * Easter/etc. commemorate the day they're displacing is a separate,
 * unverified question (these may well suppress it the way
 * privileged-sunday/privileged-feria-major do during the day — see
 * commemorations.ts), so it deliberately doesn't inherit this behavior. */
function anticipated(today: LiturgicalDay, tomorrow: LiturgicalDay): LiturgicalDay {
  const tagged = tagVespersFrom(tomorrow);
  const commemoration = commemorationOf(today.winner);
  if (!commemoration) {
    return tagged;
  }
  return { ...tagged, commemorations: [...tagged.commemorations, commemoration] };
}

/**
 * Resolves which day's identity actually governs this evening's office.
 * Returns `resolveDay(isoDate)` unchanged unless tomorrow has First
 * Vespers *and* today doesn't keep its own Second Vespers regardless — in
 * which case returns tomorrow's `LiturgicalDay`, with `vespersFrom:
 * 'firstVespersOfTomorrow'` set on its winner (if sanctoral) so callers
 * can tell the difference from an ordinary day. Either way, whichever side
 * doesn't govern the evening is folded into the returned day's own
 * `commemorations` when it's eligible (see commemorationOf) — except
 * under the isMajorFixedFeastOfTheLord override just below, which doesn't
 * apply that at all yet.
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
    return tagVespersFrom(tomorrow);
  }
  if (keepsOwnSecondVespers(today)) {
    // Today wins outright, but tomorrow can still be commemorated here if
    // it clears its own bar (live-verified: St. James, Duplex II.
    // classis, keeps his own Second Vespers on Jul 25 and still
    // commemorates St. Anne's Jul 26 — see commemorationOf).
    const commemoration = commemorationOf(tomorrow.winner);
    return commemoration ? { ...today, commemorations: [...today.commemorations, commemoration] } : today;
  }
  if (!hasFirstVespers(tomorrow)) {
    return today;
  }
  return anticipated(today, tomorrow);
}
