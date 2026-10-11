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
import { resolveActiveOctave, octaveGoverningPrivilegedDay, type ActiveOctave } from './octaves';
import { addDays } from './date-math';
import { easterOffsetOf } from './temporal';
import { compareFeastClass, isAtLeast, minimumOutrightWinningRank } from './commemorations';
import { temporalLabel } from './day-label';
import { getSaintRecord } from './feasts';
import { getTemporalFeastRecord } from './temporal-feasts';

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

/** The octave whose office governs a temporal day (an octave interior or
 * closing day standing in for the season's feria), if any. An octave day
 * competes at Vespers by its own `wins` rank, and only its closing day has
 * First Vespers (engine: "No prima Vespera" on interior octave days). */
function governingOctave(day: LiturgicalDay): ActiveOctave | undefined {
  if (day.winner.kind === 'sanctoral') {
    return undefined;
  }
  return day.temporalCategory === 'ordinary-feria' ? resolveActiveOctave(day.date) : octaveGoverningPrivilegedDay(day);
}

/** Does this day's evening claim First Vespers at all (for the day *after* it)? */
function hasFirstVespers(day: LiturgicalDay): boolean {
  if (day.weekday === 'sunday' || isMajorFixedFeastOfTheLord(day.date)) {
    return true;
  }
  // Live-verified (2026-08): Ss. Cyriacus/Largus/Smaragdus (Aug 8, plain
  // Semiduplex) claims First Vespers over St. Donatus's Aug 7 — "Vespera
  // de sequenti" in the real Monastic 1617 engine. Originally thought
  // Semiduplex was the actual cutoff, but re-verified 2026-08-25: St.
  // Zephyrinus (Aug 26, plain Simplex) likewise claims First Vespers over
  // St. Louis's Aug 25 (also Simplex) — "Vespera de sequenti; nihil de
  // præcedenti" — so *any* real sanctoral winner, however low-ranked,
  // clears this bar; there's no rank floor at all, only the separate
  // keepsOwnSecondVespers question of whether the day *before* it
  // outranks the claim. Every FeastClass (including `vigil`, untested
  // directly but the same "lowest tier" logic) now qualifies.
  return day.winner.kind === 'sanctoral';
}

/** Does this day keep its own Second Vespers regardless of what tomorrow is?
 * `privileged-sunday`, `privileged-feria-major`/`-minor`/`-ember`/`-advent`,
 * `privileged-feria`, and a major fixed feast of the Lord all stay genuine, rank-independent
 * absolutes here — each already has its own live-verified Vespers behavior
 * (Advent's Dec 2 seasonal content regardless of Dec 3's rank; St. Gregory
 * the Great keeping his own Vespers into a privileged Lent Sunday, etc.)
 * that doesn't come from a rank comparison and shouldn't be disturbed by one.
 *
 * `ordinary-sunday` is the one exception, and only when today's own winner
 * is still the bare Sunday (not already a sanctoral winner that beat the
 * Sunday outright — that case is decided by the sanctoral-vs-sanctoral/
 * Saturday-side comparisons in `resolveEveningDay` instead). An ordinary
 * Sunday should behave like any other day for *this* question rather than
 * being a special absolute: it keeps its own Second Vespers only if tomorrow
 * doesn't have a real sanctoral winner ranked at or above
 * `commemorations.ts`'s `minimumOutrightWinningRank('ordinary-sunday')`
 * (`duplex`) — the same, already-verified threshold that lets a plain Duplex
 * win an ordinary Sunday's daytime office outright (St. Anthony Abbot).
 * Treating every Sunday as absolute here, regardless of rank, was the actual
 * bug behind 2026-09-13 (ordinary Sunday) wrongly keeping Second Vespers
 * over 2026-09-14's Exaltation of the Holy Cross, `duplex-majus`. */
function keepsOwnSecondVespers(today: LiturgicalDay, tomorrow: LiturgicalDay): boolean {
  if (isMajorFixedFeastOfTheLord(today.date)) {
    return true;
  }
  // A bare privileged feria (an Advent, Lent or Passion weekday, an Ember
  // Saturday, Easter-octave Saturday...) has no claim against tomorrow's
  // Sunday: Saturday evening is First Vespers of that Sunday (engine, e.g.
  // 2026-12-05 "Dominica II Adventus", 2027-04-03 "Dominica in Albis",
  // 2027-05-15 "Dominica Pentecostes", all "Vespera de sequenti").
  if (today.winner.kind === 'temporal' && tomorrow.weekday === 'sunday' && today.temporalCategory !== 'privileged-sunday') {
    return false;
  }
  if (today.temporalCategory !== 'ordinary-sunday') {
    return (
      today.temporalCategory === 'privileged-sunday' ||
      today.temporalCategory === 'privileged-feria-minor' ||
      today.temporalCategory === 'privileged-feria-ember' ||
      today.temporalCategory === 'privileged-feria-advent' ||
      today.temporalCategory === 'privileged-feria' ||
      today.temporalCategory === 'privileged-feria-major' ||
      today.temporalCategory === 'privileged-feria-major-commemorating'
    );
  }
  if (today.winner.kind === 'sanctoral') {
    return false;
  }
  const threshold = minimumOutrightWinningRank('ordinary-sunday')!;
  return !(tomorrow.winner.kind === 'sanctoral' && isAtLeast(tomorrow.winner.rank, threshold));
}

/**
 * Today lost the evening to tomorrow's First Vespers — is today still
 * commemorated there? Not if it's Simplex (or a bare temporal winner,
 * with no standing of its own — same "no standing to defend" idea
 * commemorations.ts's `ordinary-feria` case already uses during the
 * day). Live-verified:
 *   - Aug 8 -> 9 (Ss. Cyriaci/Largi/Smaragdi, Semiduplex, before an
 *     ordinary Sunday): today loses the evening, today is still
 *     commemorated ("commemoratio de præcedenti").
 *   - Aug 7 -> 8 (St. Donatus, Simplex, before Ss. Cyriaci/etc.): today
 *     loses the evening and is *not* commemorated ("nihil de
 *     præcedenti") — pins down the Simplex exclusion specifically for
 *     this direction.
 *
 * A `temporal` loser (an `ordinary-sunday`/`privileged-feria`/
 * `privileged-feria-minor` that lost to a following Duplex+ sanctoral
 * winner — see `keepsOwnSecondVespers`) is commemorated the same way its
 * daytime office already is (`commemorations.ts`'s matching branches push a
 * `{kind: 'temporal', ...}` commemoration, rendered by
 * `resolve-common.ts`'s `temporalCommemorationPart`) — except `ordinary-
 * feria`, which has no standing of its own to defend either way, same idea
 * as the Simplex exclusion above.
 */
function commemorationOfDisplacedPredecessor(today: LiturgicalDay): Commemoration | undefined {
  const loser = today.winner;
  if (loser.kind === 'sanctoral') {
    if (loser.rank === 'simplex') {
      return undefined;
    }
    return { kind: 'sanctoral', id: loser.id, name: loser.name, nameLa: loser.nameLa, rank: loser.rank, vespersNote: 'today' };
  }
  if (today.temporalCategory === 'ordinary-feria') {
    return undefined;
  }
  const label = temporalLabel(today);
  return { kind: 'temporal', id: loser.id, name: label.en, nameLa: label.la };
}

/**
 * Today keeps its own Second Vespers regardless — is tomorrow still
 * commemorated there? Unlike the reverse direction above, Simplex is
 * NOT excluded here: live-verified Aug 24 -> 25 (St. Bartholomew,
 * Duplex II. classis, keeps his own evening; St. Louis, Simplex, on
 * Aug 25) still reads "commemoratio de sequenti" — the same asymmetry
 * this file's earlier version only guessed at by symmetry with the
 * other direction and flagged as unverified. Also verified with a
 * non-Simplex loser: Jul 25 -> 26 (St. James, Duplex II. classis, kept
 * second Vespers regardless; St. Anne, Duplex, loses the evening but is
 * still commemorated).
 *
 * `winner` (today's own, the one actually keeping this evening) can
 * refuse the commemoration outright via its own record's
 * `forbidsSuccessorCommemoration` — the feast-side mirror of the
 * day-side privilege calendar/commemorations.ts already models (see that
 * field's own doc comment, on both SaintRecord and TemporalFeastRecord,
 * for why this is a flag rather than a rank threshold). Checked on
 * whichever kind of record `winner` actually is — set today only on
 * `sacred-heart` (a `temporal` winner), the live-verified case that
 * motivated this field; every sanctoral saint is still unset, a no-op
 * until a specific date is verified and flagged.
 */
function commemorationOfDisplacedSuccessor(winner: DayWinner, loser: DayWinner): Commemoration | undefined {
  if (loser.kind !== 'sanctoral') {
    return undefined;
  }
  const forbids =
    winner.kind === 'sanctoral' ? getSaintRecord(winner.id)?.forbidsSuccessorCommemoration : getTemporalFeastRecord(winner.id)?.forbidsSuccessorCommemoration;
  if (forbids) {
    return undefined;
  }
  return { kind: 'sanctoral', id: loser.id, name: loser.name, nameLa: loser.nameLa, rank: loser.rank, vespersNote: 'tomorrow' };
}

function tagVespersFrom(tomorrow: LiturgicalDay): LiturgicalDay {
  if (tomorrow.winner.kind !== 'sanctoral') {
    return tomorrow;
  }
  return { ...tomorrow, winner: { ...tomorrow.winner, vespersFrom: 'firstVespersOfTomorrow' } };
}

/** Today's own Vigil isn't commemorated alongside the very feast it's the
 * eve of — e.g. Nov 29's Vigil of St. Andrew shouldn't also show up next
 * to St. Andrew himself once this evening has already adopted his First
 * Vespers, whether St. Andrew governs it outright or is merely
 * commemorated there himself (2025-11-30: he's only commemorated under
 * Advent I, a `privileged-sunday`, per commemorations.ts's own threshold
 * — the Vigil would otherwise show up redundantly alongside him even
 * though neither one is tomorrow's actual winner). Matched via each
 * Vigil's own explicit `vigilOf` field (calendar/feasts.ts's
 * `SaintRecord`) against tomorrow's winner *and* its commemorations, not
 * date adjacency or name-guessing — several vigils' own ids don't map
 * cleanly to their feast's id (`vigil-of-the-assumption` vs `assumption`,
 * `vigil-of-st-james` vs `st-james-the-greater`), so this needs the
 * explicit link. Scoped to this evening-anticipation merge specifically,
 * not `commemorationOfDisplacedPredecessor` itself — the reverse direction
 * (`keepsOwnSecondVespers`, commemorating *tomorrow's* Vigil while today
 * keeps its own Vespers) can't hit this collision: a Vigil dated tomorrow
 * belongs to a feast the day after tomorrow, never today. */
function isVigilOfTomorrow(today: LiturgicalDay, tomorrow: LiturgicalDay): boolean {
  if (today.winner.kind !== 'sanctoral' || today.winner.rank !== 'vigil') {
    return false;
  }
  const feastId = getSaintRecord(today.winner.id)?.vigilOf;
  if (!feastId) {
    return false;
  }
  return (
    (tomorrow.winner.kind === 'sanctoral' && tomorrow.winner.id === feastId) ||
    tomorrow.commemorations.some((c) => c.kind === 'sanctoral' && c.id === feastId)
  );
}

/** The ordinary anticipation path: tag tomorrow's identity, then layer in
 * today's commemoration if it's eligible (see
 * commemorationOfDisplacedPredecessor). Not used by the
 * isMajorFixedFeastOfTheLord override below — whether Christmas/
 * Easter/etc. commemorate the day they're displacing is a separate,
 * unverified question (these may well suppress it the way
 * privileged-sunday/privileged-feria-major do during the day — see
 * commemorations.ts), so it deliberately doesn't inherit this behavior. */
function anticipated(today: LiturgicalDay, tomorrow: LiturgicalDay): LiturgicalDay {
  const tagged = tagVespersFrom(tomorrow);
  // A plain temporal day yielding to tomorrow's Sunday (or other temporal
  // feast) is not commemorated there (engine: Saturday Dec 5 -> "Dominica II
  // Adventus", no commemoration line).
  const temporalToTemporal = today.winner.kind === 'temporal' && tomorrow.winner.kind === 'temporal';
  const commemoration = isVigilOfTomorrow(today, tomorrow) || temporalToTemporal ? undefined : commemorationOfDisplacedPredecessor(today);
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
 * `commemorations` when it's eligible (see
 * commemorationOfDisplacedPredecessor/-Successor) — except under the
 * isMajorFixedFeastOfTheLord override just below, which doesn't apply
 * that at all yet.
 *
 * One deliberate absolute exception, caught by a failing test: a day on
 * `isMajorFixedFeastOfTheLord`'s list always wins tomorrow's Vespers,
 * *before* checking whether today would otherwise keep its own — Easter
 * displaces even Holy Saturday's privileged-feria status (the classic
 * case: the Vigil already belongs to Easter, not to Holy Saturday), and
 * would likewise displace an actual Sunday if one ever landed on Dec 24 or
 * an Ember Saturday. This is why it's a short, explicit list rather than a
 * threshold: these particular days are understood to be *absolute*.
 *
 * When neither side is covered by an absolute case and both today and
 * tomorrow have a real sanctoral winner, the rubric's actual rule applies:
 * direct rank comparison, with today keeping its own Second Vespers only if
 * it *strictly* outranks tomorrow — an exact tie goes to tomorrow ("a
 * Capitulo fit de sequenti cum commemoratione praecedentis"). Note this
 * checks tomorrow's actual *winner*, not merely whether tomorrow's calendar
 * weekday is Sunday — a plain Duplex can itself outright win an ordinary
 * Sunday's daytime office (see commemorations.ts's header comment, e.g. St.
 * Anne beating an ordinary Sunday on 2026-07-26), in which case it's that
 * Duplex's own rank being compared, not some notion of "Sunday's rank".
 * When tomorrow's winner is genuinely the Sunday itself (`kind !==
 * 'sanctoral'`), today's sufficiently high sanctoral rank
 * (`duplex-2-classis`+) still claims the evening outright per the rubric's
 * "Duplex always keeps both Vespers" rule — handled by the
 * `isAtLeast`-style fallback below, same floor as before, just no longer
 * applied when tomorrow also has a real (comparable) sanctoral winner.
 */
export function resolveEveningDay(isoDate: string): LiturgicalDay {
  const today = resolveDay(isoDate);
  const tomorrow = resolveDay(addDays(isoDate, 1));

  if (isMajorFixedFeastOfTheLord(tomorrow.date)) {
    return tagVespersFrom(tomorrow);
  }

  // An octave day governing today competes by the octave's own rank: against
  // another octave day tomorrow (ties stay with the incumbent), and, on its
  // closing day, against tomorrow's Sunday at that Sunday's own threshold
  // (engine: Aug 22 octave day of the Assumption keeps Second Vespers over
  // the following Sunday, which is commemorated).
  const todayOctave = governingOctave(today);
  const tomorrowOctave = governingOctave(tomorrow);
  let octaveDecision: boolean | undefined;
  if (todayOctave && tomorrow.winner.kind !== 'sanctoral') {
    if (tomorrowOctave) {
      octaveDecision = compareFeastClass(todayOctave.wins, tomorrowOctave.wins) >= 0;
    } else if (todayOctave.isClosingDay && tomorrow.weekday === 'sunday') {
      const min = minimumOutrightWinningRank(tomorrow.temporalCategory);
      octaveDecision = !!min && compareFeastClass(todayOctave.wins, min) >= 0;
    }
  }

  let todayWins: boolean;
  if (octaveDecision !== undefined) {
    todayWins = octaveDecision;
  } else if (keepsOwnSecondVespers(today, tomorrow)) {
    todayWins = true;
  } else if (today.winner.kind === 'sanctoral' && tomorrow.winner.kind === 'sanctoral') {
    todayWins = compareFeastClass(today.winner.rank, tomorrow.winner.rank) > 0;
  } else if (governingOctave(today) && tomorrow.winner.kind === 'sanctoral') {
    todayWins = compareFeastClass(governingOctave(today)!.wins, tomorrow.winner.rank) > 0;
  } else if (today.winner.kind === 'sanctoral' && isAtLeast(today.winner.rank, 'duplex-2-classis')) {
    todayWins = true;
  } else {
    todayWins = !(hasFirstVespers(tomorrow) || governingOctave(tomorrow)?.isClosingDay);
  }

  if (todayWins) {
    // Today wins outright, but tomorrow is still commemorated here as
    // long as it's a real sanctoral winner — see
    // commemorationOfDisplacedSuccessor's own doc comment for why this
    // direction doesn't exclude Simplex the way the reverse one does.
    const commemoration = commemorationOfDisplacedSuccessor(today.winner, tomorrow.winner);
    if (commemoration) {
      return { ...today, commemorations: [...today.commemorations, commemoration] };
    }
    if (octaveDecision && tomorrow.weekday === 'sunday' && tomorrow.winner.kind === 'temporal' && !tomorrowOctave) {
      const label = temporalLabel(tomorrow);
      return {
        ...today,
        commemorations: [...today.commemorations, { kind: 'temporal', id: tomorrow.winner.id, name: label.en, nameLa: label.la }],
      };
    }
    return today;
  }
  return anticipated(today, tomorrow);
}
