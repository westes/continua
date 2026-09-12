import type { ResolvedPart, ResolvedText } from './types';
import type { Commemoration, DayWinner, FeastClass, LiturgicalDay, Weekday } from '../calendar/types';
import type { ProperText } from '../propers';
import { getCommonProper, getTemporalProper } from '../propers';
import { getSaintRecord } from '../calendar/feasts';
import { resolveActiveOctave, activeOctavesFor, octaveGoverningPrivilegedDay, isAtLeast, isSundayOrFeast } from '../calendar';
import { getTemporalFeastRecord } from '../calendar/temporal-feasts';
import { resolveTemporalId } from '../calendar/temporal-id';
import { isInTriduum } from '../calendar/temporal';
import { isAllSouls, REQUIEM_GLORIA_PATRI } from './all-souls';
import { temporalLabel } from '../calendar/day-label';
import { splitAntiphon, isDoubleOrHigher } from './antiphon';
import { getLaudsSaintOverride } from './lauds-psalmody-overrides';
import vespersMagnificatAntiphonsData from '../data/hours/vespers-magnificat-antiphons.yml';
import vespersOAntiphonsData from '../data/hours/vespers-o-antiphons.yml';
import laudsVigilCommemorationAntiphonsData from '../data/hours/lauds-vigil-commemoration-antiphons.yml';

type BilingualText = Partial<Record<string, string>>;
type TranslationStatus = 'verified' | 'draft' | 'missing';
interface MagnificatWeekdayDefault {
  antiphon: BilingualText;
  status?: Partial<Record<string, TranslationStatus>>;
}
// Monday-Saturday only — Sunday has no fixed weekday default (its own
// antiphon varies by Proper of the Time; see the data file's own header).
const vespersMagnificatAntiphons = vespersMagnificatAntiphonsData as Partial<
  Record<Weekday, MagnificatWeekdayDefault>
>;
// Keyed by "MM-DD" (Dec 17-23) — see the data file's own header for why
// these seven can't live in a per-Advent-week temporal-proper file the
// way every other week's Magnificat antiphon does.
const vespersOAntiphons = vespersOAntiphonsData as Partial<Record<string, MagnificatWeekdayDefault>>;
// Monday-Saturday only — see lauds-vigil-commemoration-antiphons.yml's own
// header for why Sunday has no entry (a Vigil never reaches a
// commemoration on an ordinary Sunday in the first place).
const vigilCommemorationAntiphons = laudsVigilCommemorationAntiphonsData as Partial<Record<Weekday, MagnificatWeekdayDefault>>;

function toResolvedText(proper: ProperText): ResolvedText {
  return { text: proper.text, status: proper.status, citation: proper.citation };
}

/** Shared by every hour's resolver — looks up a common proper by id and
 * shapes it as a ResolvedText. */
export function resolveCommon(id: string): ResolvedText {
  return toResolvedText(getCommonProper(id));
}

function isMissing(t: ResolvedText): boolean {
  return t.status.la === 'missing' && t.status.en === 'missing';
}

/**
 * The one shared resolution mechanism behind every piece of content this
 * app renders — an antiphon, a chapter, a responsory, a hymn, a versicle,
 * a collect, a psalm-group's antiphon slot, all reduce to the same shape:
 * an ordered list of candidates from most to least specific, the first
 * one that isn't wholly missing wins, and there's always a real
 * `fallback` (the plain ferial/weekday default) at the bottom so the
 * chain never actually returns "missing" for content the ferial office
 * always has. Concretely that order is:
 *
 * 1. **Propers** — today's office winner's own text. An active octave is
 *    already folded in here, not a separate tier: `resolveOfficeWinner`
 *    substitutes the octave's own saint for `day.winner` upstream of
 *    every call site below, so "propers" always means "whoever is
 *    actually being prayed today," octave included.
 * 2. **Commons** — that winner's Common-category text, its own seasonal
 *    variant (e.g. `-paschaltide`) tried before the plain form.
 * 3. **Ferial** (the `fallback` argument) — today's plain weekday
 *    default, itself seasonally varied first when the season has its own
 *    text (Advent/Lent/Passiontide/Paschaltide chapters etc.) before
 *    falling to the weekday's own.
 *
 * Callers assemble the ordered candidate list themselves (which ids are
 * even eligible depends on rank/season — that eligibility logic stays at
 * each call site), then hand it to this one function instead of hand-
 * rolling their own "try this, then this" chain. Every part-type is
 * eligible for every tier by default; a tier simply resolves "missing"
 * and falls through when nothing's authored there yet or the tier
 * structurally doesn't apply (e.g. a minor hour's psalm numbers never
 * vary by Common or season) — same honest incremental-content
 * convention as everywhere else, not a reason to special-case the part.
 */
function firstAvailable(candidates: (ResolvedText | undefined)[], fallback: ResolvedText): ResolvedText {
  for (const candidate of candidates) {
    if (candidate && !isMissing(candidate)) {
      return candidate;
    }
  }
  return fallback;
}

/** `firstAvailable`, for the common case where every candidate is a plain
 * `resolveCommon(id)` lookup — pass `undefined` for any tier that isn't
 * eligible today (e.g. no common id, or the season has no variant). */
export function resolveByChain(ids: (string | undefined)[], fallback: ResolvedText): ResolvedText {
  return firstAvailable(
    ids.map((id) => (id ? resolveCommon(id) : undefined)),
    fallback,
  );
}

/**
 * Below duplex-majus, a feast's own proper psalm *numbers* never
 * substitute for the ferial cycle — only a strong-enough feast gets
 * those (each hour's own getPsalmodyOverrideFor/getOfficeOverrideId gate
 * covers that separately, and deliberately does NOT extend the Common-
 * category tier down to this rank — see its own doc comment). But a
 * saint's own authored antiphon *text* for these same psalm slots is
 * real content at *any* rank (getPsalmodyProperOverrideId's "any rank"
 * eligibility), so it's layered onto the ferial numbers here — the
 * two-tier (proper, ferial) case of the same `firstAvailable` chain
 * every other part uses, just run once per psalm-group slot instead of
 * once for the whole part. Shared by hours/lauds.ts and hours/vespers.ts,
 * which previously each kept a byte-identical copy of this as their own
 * `mergeFerialNumbersWithProperAntiphons`.
 *
 * Pairing is by index against `ferialGroups`: ferial's numbers always
 * win; each slot's antiphon comes from `properGroups`'s same-index entry
 * when authored, else stays ferial's own. Any extra `properGroups`
 * entries beyond `ferialGroups`'s count are simply unused — confirmed
 * with the user 2026-08-29 rather than assumed, since there's no rubric
 * covering this specific mismatch.
 */
export function overlayProperAntiphons<T extends { antiphon: Partial<Record<string, string>> }>(
  ferialGroups: T[],
  properGroups: { antiphon: Partial<Record<string, string>> }[] | undefined,
): T[] {
  return ferialGroups.map((g, i) => {
    const proper = properGroups?.[i]?.antiphon ? verifiedText(properGroups[i]!.antiphon) : undefined;
    return { ...g, antiphon: firstAvailable([proper], verifiedText(g.antiphon)).text };
  });
}

/**
 * A named temporal winner's own `${winner.id}-<kind>` proper, falling back
 * to the coarse governing-Sunday/weekday id (`resolveTemporalId(day.date)`
 * — what the id would have been without any override) when the winner's
 * own file hasn't been authored yet. Exists because a movable/override
 * temporal id (Corpus Christi, Maundy Thursday, ...) getting its own real
 * winner identity via `resolveOfficeWinner` doesn't guarantee every one of
 * its proper texts has actually been authored — without this, an
 * unauthored kind renders as bare `missing` instead of degrading to
 * whatever content the day would otherwise have shown (e.g. Corpus
 * Christi's own missing collect falling back to `post-pentecost-01`'s,
 * Maundy Thursday's falling back to `palm-sunday`'s). Only used for
 * `winner.kind === 'temporal'` lookups — a sanctoral winner's own
 * Common-category fallback chain is unrelated and untouched.
 */
function getTemporalProperWithFallback(winnerId: string, kind: string, day: LiturgicalDay): ProperText {
  const named = getTemporalProper(`${winnerId}-${kind}`);
  if (named.status.la !== 'missing' || named.status.en !== 'missing') {
    return named;
  }
  return getTemporalProper(`${resolveTemporalId(day.date)}-${kind}`);
}

// Named temporal winners with real standing of their own, unconditionally
// override-eligible — see hours/lauds.ts's getPsalmodyOverrideFor, which
// shares this set (imported from here, not duplicated) since it's the
// same "does this temporal identity carry its own real office" question.
export const ALWAYS_OVERRIDE_TEMPORAL_IDS = new Set([
  'marian-saturday',
  'christ-the-king',
  'christmas-octave-sunday',
  'immaculate-heart-of-mary',
  'ascension',
  'pentecost-sunday',
  'corpus-christi',
  'sacred-heart',
  'trinity-sunday',
  'circumcision',
  'holy-name-of-jesus',
  'vigil-of-christmas',
  // Passiontide: every one of the 14 days from Passion Sunday through Holy
  // Saturday has its own real identity now (see
  // calendar/movable-feasts.ts's anchor-based override for the 12 days in
  // between the two Sundays) — same "does this id carry its own real
  // office" reasoning as every other entry above.
  'passion-sunday',
  'monday-passion-week',
  'tuesday-passion-week',
  'wednesday-passion-week',
  'thursday-passion-week',
  'friday-passion-week',
  'saturday-passion-week',
  'palm-sunday',
  'monday-holy-week',
  'tuesday-holy-week',
  'spy-wednesday',
  'maundy-thursday',
  'good-friday',
  'holy-saturday',
  // Easter's own octave: Monday-Saturday of Easter week each have their
  // own real identity now (see calendar/movable-feasts.ts's anchor-based
  // override, offsets 1-6) — same "does this id carry its own real
  // office" reasoning as the Passiontide batch above. `easter-sunday`
  // itself needs no entry here (it's not one of these movable-feast
  // records; `resolveOfficeWinner` only ever sees it as a plain
  // `resolveTemporalId` fallback target, which every one of these six
  // falls back to via `getTemporalProperWithFallback` whenever a given
  // kind isn't authored for the specific weekday).
  'easter-monday',
  'easter-tuesday',
  'easter-wednesday',
  'easter-thursday',
  'easter-friday',
  'easter-saturday',
]);

/**
 * Which identity's own propers actually supply the office's content
 * (collect, Benedictus antiphon, psalmody override) — usually just
 * `day.winner`, but *not* on a day within an active octave where the
 * temporal day itself has no real standing of its own (`ordinary-feria`),
 * or where a *foreign* octave's own effective rank is strong enough to
 * clear even a privileged day's real threshold
 * (`octaveGoverningPrivilegedDay` — the Immaculate Conception's own
 * octave outright winning several of its days against Advent's
 * privileged-feria-minor ferias, live-verified: Dec 9/10/12/14 at the
 * octave's ordinary Semiduplex, Dec 15 at its own elevated Duplex majus
 * closing day) — an ordinary day within St. Lawrence's own octave, e.g.:
 * live-verified (Tridentine 1910, 2026-08-12) that the
 * chapter/responsory/hymn/versicle, psalms' antiphons, Benedictus
 * antiphon, and day collect all come from the octave's own feast
 * ("{ex Commune aut Festo}" / "{ex Proprio Sanctorum}"), not from the
 * plain temporal day underneath it.
 *
 * Deliberately excludes `christmastide` even though it's otherwise a
 * `privileged-feria-minor` season same as Advent: the Christmas Octave's
 * own stacked octaves (Christmas + Stephen + John + Holy Innocents, e.g.
 * on Dec 30) are the live-verified counterexample — that day's own
 * temporal identity ("Dominica Infra Octavam Nativitatis",
 * `privileged-feria-minor`) is itself a real, named standing, and
 * *keeps* the office ("{ex Proprio de Tempore}") regardless of any of
 * those octaves' own rank; the four octaves there each become their own
 * separate "Commemoratio Octavæ ..." block instead (not yet modeled —
 * see TODO.md), rather than any one of them taking over content the way
 * Lawrence's or the Immaculate Conception's octave does. The dividing
 * line is real standing (own temporal identity vs. a foreign octave
 * merely overlapping a season's ordinary ferias), not merely "is an
 * octave active" — see `octaveGoverningPrivilegedDay`'s own doc comment
 * for the fuller reasoning.
 *
 * `day.winner`/`day.commemorations` themselves stay exactly as
 * calendar/index.ts computed them either way — this is purely a
 * content-lookup detail, not a recomputation of who "wins." Picks the
 * oldest-started active octave with an authored saint record
 * (activeOctavesFor's own ordering) — matches calendar/day-label.ts's
 * same choice for the display label, for the same reason.
 */
export function resolveOfficeWinner(day: LiturgicalDay): DayWinner {
  if (day.winner.kind === 'sanctoral' || ALWAYS_OVERRIDE_TEMPORAL_IDS.has(day.winner.id)) {
    return day.winner;
  }
  // When more than one octave is active at once (St. Lawrence's and the
  // Assumption's genuinely overlap every Aug 16-17), resolveActiveOctave
  // picks the one that actually governs the day — see its own doc
  // comment for the precedence rule. Falls through to the plain temporal
  // default if that octave turns out to be a temporal-only one with no
  // saint record (e.g. Christmas's or Pentecost's own octave id) — no
  // sanctoral content to synthesize from those.
  const activeOctave =
    day.temporalCategory === 'ordinary-feria' ? resolveActiveOctave(day.date) : octaveGoverningPrivilegedDay(day);
  if (activeOctave) {
    const saint = getSaintRecord(activeOctave.id);
    if (saint) {
      return { kind: 'sanctoral', id: saint.id, name: saint.name, rank: saint.rank };
    }
    // A temporal-feast-only octave (Ascension's own — no saint record to
    // synthesize from, unlike Assumption's/St. Lawrence's) still needs its
    // own content recognized on interior octave days, the same way its own
    // feast day already is via the `ALWAYS_OVERRIDE_TEMPORAL_IDS` check
    // above — found 2026-09-04 via the Matins seasonal-hymn fallback
    // silently rendering the generic Paschaltide text throughout the whole
    // Ascension octave, not just a missing-content gap on the day itself.
    if (ALWAYS_OVERRIDE_TEMPORAL_IDS.has(activeOctave.id) && getTemporalFeastRecord(activeOctave.id)) {
      return { kind: 'temporal', id: activeOctave.id };
    }
  }
  return day.winner;
}

/** Like calendar/index.ts's own isSundayOrFeast, but resolveOfficeWinner-
 * aware — an octave day counts as a "feast" for this purpose too.
 * Live-verified: Prime's capitulum/Preces stay in the Sunday/feast form
 * throughout St. Lawrence's octave (2026-08-12), not just his own actual
 * day (2026-08-10) — both show the identical "ex Psalterio secundum
 * diem" 1 Tim 1:17 text. Deliberately a separate function, not a
 * replacement for the plain isSundayOrFeast: Lauds' own Cross-suffrage
 * gate (hours/lauds.ts) needs the *narrower*, non-office-aware version,
 * since Marian Saturday and an octave day both need to land on the
 * ferial side there despite not being Sunday or a sanctoral `day.winner`
 * either. */
export function isSundayOrFeastOffice(day: LiturgicalDay): boolean {
  return day.weekday === 'sunday' || resolveOfficeWinner(day).kind === 'sanctoral';
}

/**
 * A day/hour is "ferial or vigil" — the predicate both Lauds' and Vespers'
 * ferial Preces (`lauds-preces`/`vespers-preces`) key off to pick the
 * fuller Tridentine 1906/1910 litany over the short Sunday/feast one.
 * Deliberately not `isSundayOrFeast`/`isSundayOrFeastOffice` — those treat
 * any sanctoral winner, Vigils included, as a "feast." Here a Vigil needs
 * to land on the ferial side instead (per direct instruction), so it's
 * checked for explicitly: a Vigil-ranked sanctoral winner, or a bare
 * temporal winner that isn't Sunday and isn't a named temporal identity
 * like Marian Saturday or Christ the King (which aren't Sunday or a
 * sanctoral winner either, but still aren't a bare ferial office — same
 * reasoning as Lauds' own Cross-suffrage gate). Also excludes any day
 * within an active octave — live-verified (Tridentine 1910, day 3 of St.
 * Lawrence's own octave, both Lauds and Vespers): "Preces Feriales
 * {omittitur}", same exclusion the suffrages already have, for the same
 * reason — an octave day isn't a bare ferial office even though nothing
 * else is winning it outright.
 */
export function isFerialOrVigil(day: LiturgicalDay): boolean {
  const isVigil = day.winner.kind === 'sanctoral' && day.winner.rank === 'vigil';
  const isBareFeria = day.winner.kind === 'temporal' && !getTemporalFeastRecord(day.winner.id);
  const isWithinAnOctave = activeOctavesFor(day.date).length > 0;
  return day.weekday !== 'sunday' && !isWithinAnOctave && (isVigil || isBareFeria);
}

/**
 * A duplex-majus+ saint's own id, or one of the named temporal feasts in
 * ALWAYS_OVERRIDE_TEMPORAL_IDS — the same rank-eligibility test
 * hours/lauds.ts's getPsalmodyOverrideFor uses (and originally
 * duplicated), factored out here so hours/vespers.ts's own per-feast
 * office override (chapter/responsory/hymn/versicle — Vespers has no
 * psalmody-override table of its own to piggyback eligibility on, unlike
 * Lauds) can share the identical eligibility rule. Callers still decide
 * for themselves whether anything's actually been authored for the id
 * returned — same honest incremental-content convention as everywhere
 * else; this only answers "is this day's winner eligible to override at
 * all," not "does an override exist."
 */
export function getOfficeOverrideId(day: LiturgicalDay): string | undefined {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal' && ALWAYS_OVERRIDE_TEMPORAL_IDS.has(winner.id)) {
    return winner.id;
  }
  if (winner.kind === 'sanctoral' && isAtLeast(winner.rank, 'duplex-majus')) {
    return winner.id;
  }
  return undefined;
}

/**
 * The id to look up for today's winner's own *proper* Lauds/Vespers
 * psalmody antiphons (`hours/lauds.ts`'s and `hours/vespers.ts`'s own
 * `getPsalmodyOverrideFor`) — eligible at **any rank**, unlike
 * `getOfficeOverrideId` above. A saint's own authored proper antiphon
 * text isn't something rank should ever gate — rank only has standing to
 * gate the weaker, generic Common-category substitute (still looked up
 * via `getOfficeOverrideId`'s duplex-majus+ threshold, a real distinct
 * tier: same conventional psalm numbers, a generic-by-category antiphon,
 * not this feast's own text). Mirrors `getMinorHourOverrideId`'s identical
 * "any sanctoral winner is eligible, it's the caller that decides whether
 * anything's actually authored for the id" reasoning — the psalmody
 * override table previously reused `getOfficeOverrideId`'s single
 * duplex-majus+ gate for both its proper and Common tiers at once, which
 * silently discarded a proper antiphon whenever it happened to be
 * authored for a sub-duplex-majus feast (fixed 2026-08-29).
 */
export function getPsalmodyProperOverrideId(day: LiturgicalDay): string | undefined {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal' && ALWAYS_OVERRIDE_TEMPORAL_IDS.has(winner.id)) {
    return winner.id;
  }
  if (winner.kind === 'sanctoral') {
    return winner.id;
  }
  return undefined;
}

/**
 * A sanctoral office winner's octave-aware effective rank: an octave day
 * borrowing its content from `resolveOfficeWinner` (rather than being a real
 * outright `day.winner` itself) should be judged against that octave's own
 * per-day rank (`ActiveOctave.wins`, already closing-day-elevated by
 * calendar/octaves.ts), not the origin feast's own full rank — otherwise
 * every day of a strong feast's octave (e.g. the Nativity of the BVM,
 * `duplex-2-classis`) would read as duplex-majus-eligible even on an
 * ordinary octave day whose own claim is only `duplex` (2026-09-09,
 * live-verified: Gorgonius loses the day to the octave, but the octave
 * itself is only `wins: duplex` that day). Returns `undefined` for a
 * non-sanctoral winner (temporal ids never carry this ambiguity). Shared by
 * `getPsalmodyNumbersOverrideId` below (Lauds/Vespers) and
 * `hours/matins.ts`'s own psalm-number rank gates — factored out
 * 2026-09-10 after Matins was found still using the un-weakened
 * `winner.rank` directly, the same bug this file's own fix (2026-09-09)
 * had already corrected for Lauds/Vespers.
 */
export function officeWinnerEffectiveRank(day: LiturgicalDay, winner: DayWinner): FeastClass | undefined {
  if (winner.kind !== 'sanctoral') {
    return undefined;
  }
  const activeOctave =
    day.winner.kind === 'sanctoral'
      ? undefined
      : (day.temporalCategory === 'ordinary-feria' ? resolveActiveOctave(day.date) : octaveGoverningPrivilegedDay(day));
  return activeOctave?.wins ?? winner.rank;
}

/**
 * The id to look up for today's *real psalm numbers* at Lauds/Vespers —
 * unlike `getPsalmodyProperOverrideId` above, this one is rank-gated, and
 * unlike `getOfficeOverrideId`, the rank it gates on is octave-aware: an
 * octave day borrowing its content from `resolveOfficeWinner` (rather than
 * being a real outright `day.winner` itself) is judged against that
 * octave's own per-day effective rank (`ActiveOctave.wins`, already
 * closing-day-elevated by calendar/octaves.ts), not the origin feast's own
 * full rank. Without this distinction every day of a strong feast's octave
 * (e.g. the Nativity of the BVM, `duplex-2-classis`) would read as
 * duplex-majus-eligible even on an ordinary octave day whose own claim is
 * only `duplex` (2026-09-09, live-verified: Gorgonius loses the day to the
 * octave, but the octave itself is only `wins: duplex` that day, below the
 * duplex-majus cut this function enforces) — confirmed with the user
 * 2026-09-09 that octave days should be judged on the octave's own rank,
 * not the feast's.
 *
 * Deliberately separate from `getOfficeOverrideId`, which stays on the
 * origin feast's real rank for its own, unrelated consumers (Vespers'
 * non-psalmody chapter/responsory/hymn/versicle bundle, the minor-hour
 * overrides) — this function only governs which psalm *numbers* tier
 * (proper, including an octave's own governing saint, then Common
 * category) applies; the separate ungated antiphon-overlay onto ferial
 * numbers (`getPsalmodyProperOverrideId`, `mergeFerialNumbersWithProperAntiphons`)
 * is untouched by this threshold.
 */
export function getPsalmodyNumbersOverrideId(day: LiturgicalDay): string | undefined {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal' && ALWAYS_OVERRIDE_TEMPORAL_IDS.has(winner.id)) {
    return winner.id;
  }
  if (winner.kind !== 'sanctoral') {
    return undefined;
  }
  const effectiveRank = officeWinnerEffectiveRank(day, winner)!;
  return isAtLeast(effectiveRank, 'duplex-majus') ? winner.id : undefined;
}

/**
 * The id to look up for today's office winner's (resolveOfficeWinner)
 * minor-hour content (antiphon + chapter) — `${hourId}-antiphon-${id}`/
 * `${hourId}-capitulum-${id}` first (a per-saint proper file, only ever
 * authored for duplex-majus+ saints in practice), then that saint's
 * `minorHoursCommon` fallback (see resolveMinorHourAntiphon/Chapter
 * below), tried regardless of rank: live-querying the reference engine
 * directly (2026-08, the 94 `propers: null` saints' P/T/S/N pass)
 * confirmed a winning Simplex/Semiduplex saint's own minor hours *do*
 * carry proper/Common antiphons, not the plain ferial default — a real
 * liturgical fact, not an app gap. Any sanctoral winner is therefore
 * eligible here; it's `resolveMinorHourAntiphon`/`resolveMinorHourChapter`
 * that decide, per hour, whether anything's actually been authored for
 * that id (falling through to the weekday default when not). Until
 * 2026-08 this was gated at duplex-majus+ (the same threshold Lauds'
 * own *psalmody* override uses, hours/lauds.ts's getPsalmodyOverrideFor)
 * — that threshold remains correct for the *psalmody* override
 * specifically (a much bigger authored-content commitment, still
 * majus+-only), but was wrongly reused here as if it were a general
 * "is this saint's office strong enough" rule.
 * Also honors ALWAYS_OVERRIDE_TEMPORAL_IDS the same way
 * getPsalmodyOverrideFor does — a named temporal feast (`christ-the-
 * king`, `christmas-octave-sunday`) is eligible regardless of rank, since
 * it has no FeastClass to compare against in the first place.
 * Returns the id to look up, or `undefined` when nothing sanctoral or
 * named-temporal is happening today (a plain temporal day just stays on
 * its own weekday default, same as always).
 */
export function getMinorHourOverrideId(day: LiturgicalDay): string | undefined {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal' && ALWAYS_OVERRIDE_TEMPORAL_IDS.has(winner.id)) {
    return winner.id;
  }
  if (winner.kind === 'sanctoral') {
    return winner.id;
  }
  return undefined;
}

/**
 * "Tempore Paschali" — the reference engine's own window for Paschaltide
 * text changes. Deliberately the same three-season set as Compline's own
 * Marian-antiphon table (`data/hours/marian-antiphon-by-season.yml`'s
 * `eastertide`/`ascensiontide`/`pentecost` all mapping to Regina Caeli, not
 * just `eastertide` alone) — "Paschalis" runs through the end of the
 * Pentecost octave in both cases, not just to Ascension.
 *
 * RESOLVED (2026-08): the earlier version of this comment claimed only
 * Apostles/Martyr-Bishop/Several-Martyrs get a Paschaltide change at all,
 * and that Confessors/Virgins/Doctors never do. Live-querying settled
 * this more precisely, per the "St. Athanasius/allelúja" investigation
 * (TODO.md): the reference source (Commune/C1p.txt, C2p.txt, C2bp.txt,
 * C3p.txt, C3bp.txt) really does give *some* categories — Apostles,
 * Martyr, Martyr-Bishop, Several Martyrs, Pope-Martyrs — their own
 * wholesale-different Paschaltide text (often, not always, doubling the
 * alleluia as genuinely different content, confirmed by reading the raw
 * chain rather than guessing from the rendered page). But categories
 * *without* one of those (Confessor-Bishop/Doctor, Abbot, Virgin — all
 * three live-verified this pass: St. Athanasius, St. Robert, St.
 * Catherine of Siena) still change during this same window: the engine
 * mechanically appends a single ", allelúja"/", alleluia" to the closing
 * clause of the otherwise-unchanged base text. `appendPaschaltideAlleluia`
 * below models that fallback; the dedicated-chain categories are still
 * handled the older way, by trying a same-id `-paschaltide` file first
 * (only authored for `common-of-apostles` so far — the other four
 * dedicated-chain categories fall through to the mechanical suffix too
 * until someone authors their real wholesale text, which is a strictly
 * better approximation than rendering the bare non-Paschaltide default).
 */
const PASCHALTIDE_SEASONS = new Set(['eastertide', 'ascensiontide', 'pentecost']);

/** Whether `season` falls within the same broad Paschaltide window
 * `PASCHALTIDE_SEASONS` already governs elsewhere in this file (Marian
 * antiphon, Common-category text, hymn doxology) — exported so
 * hours/lauds.ts's and hours/vespers.ts's own ferial-Preces omission can
 * share the identical boundary rather than redeclaring it. */
export function isPaschaltide(season: string): boolean {
  return PASCHALTIDE_SEASONS.has(season);
}

/**
 * Which seasonal office-content suffix (if any) a day's season maps to —
 * shared by Lauds' and Vespers' own resolveOffice, both of which fall
 * back to the plain weekday default when this is undefined (and both
 * check a per-feast/octave override first, ahead of this). Paschaltide
 * covers eastertide/ascensiontide/pentecost uniformly, matching the
 * source's own single "Pasch" block for both hours — no separate
 * Ascension/Pentecost-specific chapter/hymn exists there.
 */
export function seasonalOfficeSuffix(season: string): string | undefined {
  if (season === 'advent' || season === 'lent' || season === 'passiontide') {
    return season;
  }
  if (PASCHALTIDE_SEASONS.has(season)) {
    return 'paschaltide';
  }
  return undefined;
}

/**
 * The reference engine's mechanical Paschaltide fallback for a Common
 * antiphon with no dedicated wholesale-different text of its own: a
 * single ", allelúja."/", alleluia." tacked onto the closing clause,
 * text otherwise byte-identical to the non-Paschaltide default. Live-
 * verified across three unrelated categories (St. Athanasius/Confessor-
 * Bishop, St. Robert/Abbot, St. Catherine of Siena/Virgin) — never
 * doubled, and the app's stored antiphon text already carries the
 * incipit/full split as one string with an embedded "*"
 * (`splitNamedAntiphon`/`splitAntiphon`), so appending to the very end
 * only ever lands in the "full" half, matching the reference engine's own
 * behavior exactly (its *incipit*-only rendering, sung before the psalm,
 * never carries the suffix — only the closing, full-text rendering after
 * it does).
 *
 * Skips a language whose stored text already ends in "allelúja"/
 * "alleluia" — `common-of-pope-martyrs` is the one category this
 * actually matters for: its own stored files were, unavoidably, captured
 * from a live query already inside Paschaltide (its only two members'
 * fixed dates structurally can never be queried at any other real point
 * in the calendar without landing in the Sacred Triduum instead, where
 * they're always fully transferred and never render at all — see
 * TODO.md) — so what's stored there already *is* the Paschaltide text,
 * and blindly appending here would double up.
 *
 * Deliberately scoped to antiphons only, not capitula: a capitulum's own
 * closing versicles get the same suffix in the reference engine too
 * (confirmed, St. Robert's Terce capitulum), but that text is one
 * embedded R./V. blob per language, not a clean appendable tail, and
 * reproducing that safely wasn't attempted this pass — see TODO.md.
 */
function appendPaschaltideAlleluia(resolved: ResolvedText): ResolvedText {
  const suffixByLang: Partial<Record<string, string>> = { la: 'allelúja', en: 'alleluia' };
  const text: Partial<Record<string, string>> = { ...resolved.text };
  for (const [lang, suffix] of Object.entries(suffixByLang)) {
    const t = text[lang];
    if (!t || /allel(?:úja|uia)\.?\s*$/i.test(t)) {
      continue;
    }
    text[lang] = `${t.replace(/\.\s*$/, '')}, ${suffix}.`;
  }
  return { ...resolved, text };
}

/** Applies appendPaschaltideAlleluia only when the day actually falls in
 * Paschaltide and there's real text to append it to — the shared guard
 * both resolveMinorHourAntiphon's Common fallback and getBenedictusAntiphon
 * use, so neither has to repeat the two checks inline. */
function withPaschaltideAlleluia(resolved: ResolvedText, day: LiturgicalDay): ResolvedText {
  if (!PASCHALTIDE_SEASONS.has(day.season)) {
    return resolved;
  }
  if (resolved.status.la === 'missing' && resolved.status.en === 'missing') {
    return resolved;
  }
  return appendPaschaltideAlleluia(resolved);
}

// The reference engine's own `getanthoras()` (specials.pl): when a saint
// has no dedicated per-hour minor-hour antiphon of its own, one is
// derived from that saint's 5-antiphon Lauds/Vespers set (`[Ant Laudes]`,
// which for most saints is `@:Ant Vespera`) by fixed index — Prime takes
// the first (the same antiphon as the first psalm-group), Terce/Sext the
// second/third, None the fifth (the Laudate antiphon); the fourth
// (canticle) antiphon is never used for a minor hour. vu's own
// `LaudsPsalmodyOverride` already stores that same 5-antiphon set in that
// exact order (`groups[0..2]`, `canticle`, `laudate`), so once a saint's
// Lauds proper is authored, no separate per-hour file is needed for this
// tier — same "mechanism first, content incrementally" pattern as
// everywhere else in this codebase.
const MINOR_HOUR_LAUDS_ANTIPHON_INDEX: Record<string, number> = { prime: 0, terce: 1, sext: 2, none: 4 };

function deriveMinorHourAntiphonFromLauds(hourId: string, overrideId: string): ResolvedText | undefined {
  const index = MINOR_HOUR_LAUDS_ANTIPHON_INDEX[hourId];
  if (index === undefined) {
    return undefined;
  }
  const lauds = getLaudsSaintOverride(overrideId);
  if (!lauds) {
    return undefined;
  }
  const antiphon = index === 4 ? lauds.laudate.antiphon : lauds.groups[index]?.antiphon;
  if (!antiphon) {
    return undefined;
  }
  return verifiedText(antiphon);
}

/** A Little Hour's (or Prime's) plain per-weekday antiphon, overridden by
 * a duplex-majus+ feast's own proper (`${hourId}-antiphon-${id}`) when
 * authored, then by that saint's own Lauds/Vespers antiphon set (see
 * `deriveMinorHourAntiphonFromLauds` above — a real liturgical derivation,
 * not a guess), then by that saint's shared Common (`${hourId}-antiphon-
 * ${minorHoursCommon}`, see SaintRecord's own doc comment) — tried first
 * in its Paschaltide-variant form (`${minorHoursCommon}-paschaltide`)
 * when the day falls in Paschaltide and that variant has been authored,
 * per PASCHALTIDE_SEASONS's own doc comment — when neither of the first
 * two has been authored — same honest "not gated behind whether content
 * exists, just eligible to override at all" fallback as every other
 * override in this codebase: an eligible feast with none of these
 * authored yet just falls through to the plain weekday default silently.
 * The plain (non-`-paschaltide`) Common fallback itself still picks up a
 * seasonal change in Paschaltide — see `withPaschaltideAlleluia`. (The
 * derived-from-Lauds tier does not get that treatment — see TODO.md.)
 */
/** The proper -> derived -> paschal -> common candidate list itself, split
 * out from `resolveMinorHourAntiphon` so other callers needing this exact
 * chain (e.g. Matins' `ferialPsalmodyThreeNocturns`, which has its own
 * distinct "nothing authored" fallback instead of a weekday default) can
 * reuse it via `firstAvailable` rather than re-deriving proper/common ids
 * by hand. */
export function resolveMinorHourAntiphonCandidates(hourId: string, day: LiturgicalDay): (ResolvedText | undefined)[] {
  const overrideId = getMinorHourOverrideId(day);
  const proper = overrideId ? resolveCommon(`${hourId}-antiphon-${overrideId}`) : undefined;
  const derived = overrideId ? deriveMinorHourAntiphonFromLauds(hourId, overrideId) : undefined;
  const commonId = overrideId ? getSaintRecord(overrideId)?.minorHoursCommon : undefined;
  const paschal =
    commonId && PASCHALTIDE_SEASONS.has(day.season) ? resolveCommon(`${hourId}-antiphon-${commonId}-paschaltide`) : undefined;
  const common = commonId ? withPaschaltideAlleluia(resolveCommon(`${hourId}-antiphon-${commonId}`), day) : undefined;
  return [proper, derived, paschal, common];
}

export function resolveMinorHourAntiphon(
  hourId: string,
  day: LiturgicalDay,
  weekdayDefault: Partial<Record<string, string>>,
): ResolvedText {
  // The plain weekday default (data/hours/{hour}-antiphons.yml) never
  // carries its own status field at all — always implicitly verified by
  // the file's own live-checked convention, not a guess.
  return firstAvailable(resolveMinorHourAntiphonCandidates(hourId, day), verifiedText(weekdayDefault));
}

/** Same idea as resolveMinorHourAntiphon, for the chapter
 * (`${hourId}-capitulum-${id}`, then `${hourId}-capitulum-
 * ${minorHoursCommon}`, tried Paschaltide-variant-first the same way) —
 * falls back to `fallbackId` (the plain per-annum/per-weekday one already
 * in place for that hour) when nothing eligible is authored, either
 * proper or shared-Common. */
export function resolveMinorHourChapter(hourId: string, day: LiturgicalDay, fallbackId: string): ResolvedText {
  const overrideId = getMinorHourOverrideId(day);
  const proper = overrideId ? resolveCommon(`${hourId}-capitulum-${overrideId}`) : undefined;
  const commonId = overrideId ? getSaintRecord(overrideId)?.minorHoursCommon : undefined;
  const paschal =
    commonId && PASCHALTIDE_SEASONS.has(day.season) ? resolveCommon(`${hourId}-capitulum-${commonId}-paschaltide`) : undefined;
  const common = commonId ? resolveCommon(`${hourId}-capitulum-${commonId}`) : undefined;
  return firstAvailable([proper, paschal, common], resolveCommon(fallbackId));
}

export interface OfficeBundle {
  chapter: ResolvedText;
  responsory: ResolvedText;
  hymn: ResolvedText;
  versicle: ResolvedText;
}

/**
 * The chapter/responsory/hymn/versicle bundle following Lauds'/Vespers'
 * psalmody (hours/lauds.ts's and hours/vespers.ts's own resolveOffice) —
 * a saint's own proper bundle (`${hourId}-{part}-${id}`) when authored,
 * else that saint's Common bundle (`${hourId}-{part}-${commonId}`,
 * SaintRecord's main `common` field, not `minorHoursCommon` — this is the
 * saint's overall classification, the same one driving their day collect).
 * Eligibility is deliberately rank-agnostic, `getMinorHourOverrideId`'s
 * test (any sanctoral winner, or a named ALWAYS_OVERRIDE_TEMPORAL_IDS
 * feast) rather than resolveOffice's old duplex-majus+-only gate: a
 * simplex feast's own or Common's chapter/hymn is real, distinct
 * liturgical content, not something only strong feasts are entitled to —
 * confirmed 2026-08-25 (St. Louis, King of France, simplex, was silently
 * falling all the way to the plain ferial default instead of his Common
 * of a Confessor Not Bishop). Same honest "eligible, not gated on whether
 * content exists" convention as everywhere else: returns `undefined` when
 * neither the proper nor the Common has this bundle authored yet, so the
 * caller falls through to its own seasonal/weekday default.
 *
 * `resolveChapterFor` lets Vespers reuse its own chapter lookup (which
 * itself falls back to the byte-identical Lauds capitulum file when no
 * `vespers-capitulum-<id>.yml` exists — see vespersCapitulumForOverride)
 * instead of the plain `${hourId}-capitulum-${id}` default used here.
 */
export function resolveOfficeBundle(
  hourId: string,
  day: LiturgicalDay,
  resolveChapterFor: (id: string) => ResolvedText = (id) => resolveCommon(`${hourId}-capitulum-${id}`),
): OfficeBundle | undefined {
  const overrideId = getMinorHourOverrideId(day);
  if (!overrideId) {
    return undefined;
  }
  const tryId = (id: string): OfficeBundle | undefined => {
    const chapter = resolveChapterFor(id);
    if (chapter.status.la === 'missing' && chapter.status.en === 'missing') {
      return undefined;
    }
    return {
      chapter,
      responsory: resolveResponsory(resolveCommon(`${hourId}-responsory-${id}`), day),
      hymn: resolveCommon(`${hourId}-hymn-${id}`),
      versicle: resolveCommon(`${hourId}-versicle-${id}`),
    };
  };
  const proper = tryId(overrideId);
  if (proper) {
    return proper;
  }
  const commonId = getSaintRecord(overrideId)?.common;
  return commonId ? tryId(commonId) : undefined;
}

/** Fills a Common collect template's literal `{N}` placeholders with a
 * saint's own name(s) per language (SaintRecord.collectName) — the same
 * substitution the reference source's own Commune files perform
 * (`beáti N. Confessóris tui` etc.), just resolved at authoring-adjacent
 * read time here instead of duplicating the same template text once per
 * saint who shares it. Positional: the template's `{N}` occurrences fill
 * left-to-right from `names`, in document order — most templates have
 * one, a few (two co-named saints commemorated together) have two. */
export function substituteName(text: ResolvedText, name: { la: string[]; en: string[] }): ResolvedText {
  const substituted: Partial<Record<string, string>> = {};
  for (const [lang, t] of Object.entries(text.text)) {
    if (!t) {
      continue;
    }
    const values = lang === 'la' ? name.la : lang === 'en' ? name.en : undefined;
    if (!values) {
      substituted[lang] = t;
      continue;
    }
    let i = 0;
    substituted[lang] = t.replace(/\{N\}/g, () => values[i++] ?? '{N}');
  }
  return { text: substituted, status: text.status };
}

/**
 * The day's own collect — real for the vast majority of days (a temporal
 * winner always resolves, since all 52 Sunday collects are authored and
 * ferias inherit the governing Sunday's via calendar/temporal-id.ts), a
 * Common-template collect with the saint's own name substituted in when
 * they have no proper collect of their own but a `collectCommon` fallback
 * is authored (`SaintRecord.collectCommon`/`collectName`, e.g. St. Agatha
 * and St. Lucy — a proper antiphon but a Common-sourced collect, live-
 * verified), and honestly "missing" for the remaining days a saint wins
 * outright until either is authored. `collectCommon` is the *full*
 * `resolveCommon` id already (`collect-c2`, not `c2` — no suffix gets
 * appended, unlike `minorHoursCommon` above), matching how the
 * `collect-c*.yml` files are actually named. Uses resolveOfficeWinner,
 * not the raw `day.winner` — see its own doc comment for why those two
 * differ on an octave day.
 */
export function getDayCollect(day: LiturgicalDay): ResolvedText {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal') {
    return toResolvedText(getTemporalProperWithFallback(winner.id, 'collect', day));
  }
  const saint = getSaintRecord(winner.id);
  const proper = saint?.propers ? resolveCommon(`${saint.propers}-collect`) : undefined;
  const common =
    saint?.collectCommon && saint.collectName ? substituteName(resolveCommon(saint.collectCommon), saint.collectName) : undefined;
  return firstAvailable([proper, common], { text: {}, status: { la: 'missing', en: 'missing' } });
}

/** A Vigil (`common: common-of-a-vigil`) doesn't reuse its own antiphon
 * when merely commemorated — its own source file's `[Rule]` says "Versum
 * Feria" (borrow the plain ferial day's own antiphon/versicle instead),
 * confirmed live across six different real weekdays (see
 * data/hours/lauds-vigil-commemoration-antiphons.yml's own header for the
 * dates checked) — the antiphon quotes the Benedictus canticle in weekday
 * sequence (same pattern vespers-magnificat-antiphons.yml already uses
 * for the Magnificat), same text regardless of *which* vigil, and the
 * versicle is a single fixed text (`lauds-versicle-monday.yml`'s own,
 * confirmed identical even on a live Saturday, so genuinely constant, not
 * itself weekday-keyed despite superficially matching most weekdays'
 * plain ferial versicle). Sunday has no entry — a Vigil never reaches a
 * commemoration on an ordinary Sunday in this app's own precedence rules
 * either (calendar/commemorations.ts's `ordinary-sunday` branch
 * transfers it instead), confirmed live too. */
function vigilCommemorationAntiphon(weekday: Weekday): ResolvedText | undefined {
  const entry = vigilCommemorationAntiphons[weekday];
  return entry ? (entry.status ? { text: entry.antiphon, status: entry.status } : verifiedText(entry.antiphon)) : undefined;
}

function combineCommemorationBundle(antiphon: ResolvedText, versicle: ResolvedText, collect: ResolvedText): ResolvedText {
  const text: Partial<Record<string, string>> = {};
  const status: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  for (const lang of new Set([...Object.keys(antiphon.text), ...Object.keys(versicle.text), ...Object.keys(collect.text)])) {
    const parts = [antiphon, versicle, collect].map((t) => t.text[lang]).filter((t): t is string => !!t);
    if (parts.length === 0) continue;
    text[lang] = `Ant. ${parts[0] ?? ''}\n${parts[1] ?? ''}\n${parts[2] ?? ''}`.trim();
    const statuses = [antiphon.status[lang], versicle.status[lang], collect.status[lang]].filter(
      (s): s is 'verified' | 'draft' | 'missing' => !!s,
    );
    status[lang] = statuses.reduce((worst, s) => (STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst), 'verified' as const);
  }
  return { text, status };
}

/** A sanctoral commemoration's own rendering: the fuller Ant+V/R+collect
 * bundle (`${propers}-commemoration`, e.g. st-clare-commemoration.yml)
 * when authored — live-verified this is the real shape a commemoration
 * takes, not a bare collect — falling back to just the collect alone
 * (still labeled, unlike the old unlabeled bare-collect rendering this
 * replaces) when only that's been authored, and to an honestly labeled
 * "missing" block when neither has. Always labeled ("Commemoration of St.
 * X") so an unauthored one reads as "this saint's commemoration isn't
 * written up yet," not as a mystery blank prayer. A Vigil is a special
 * case within this same fallback chain: see vigilCommemorationAntiphon's
 * own doc comment. */
function sanctoralCommemorationPart(
  commemoration: Extract<Commemoration, { kind: 'sanctoral' }>,
  weekday: Weekday,
): ResolvedPart {
  const label = `Commemoration of ${commemoration.name}`;
  const saint = getSaintRecord(commemoration.id);
  if (saint?.propers) {
    const combined = resolveCommon(`${saint.propers}-commemoration`);
    if (combined.status.la !== 'missing' || combined.status.en !== 'missing') {
      return { kind: 'preces', text: combined, label };
    }
    const properCollect = resolveCommon(`${saint.propers}-collect`);
    if (properCollect.status.la !== 'missing' || properCollect.status.en !== 'missing') {
      if (saint.common === 'common-of-a-vigil') {
        const antiphon = vigilCommemorationAntiphon(weekday);
        if (antiphon) {
          const versicle = resolveCommon('lauds-versicle-monday');
          return { kind: 'preces', text: combineCommemorationBundle(antiphon, versicle, properCollect), label };
        }
      }
      return { kind: 'preces', text: properCollect, label };
    }
  }
  if (saint?.collectCommon && saint.collectName) {
    const template = resolveCommon(saint.collectCommon);
    if (template.status.la !== 'missing' || template.status.en !== 'missing') {
      const collect = substituteName(template, saint.collectName);
      const antiphon = resolveCommon(`${saint.common}-commemoration-antiphon`);
      const versicle = resolveCommon(`lauds-versicle-${saint.common}`);
      if (antiphon.status.la !== 'missing' || antiphon.status.en !== 'missing') {
        return { kind: 'preces', text: combineCommemorationBundle(antiphon, versicle, collect), label };
      }
      return { kind: 'preces', text: collect, label };
    }
  }
  return { kind: 'preces', text: { text: {}, status: { la: 'missing', en: 'missing' } }, label };
}

/** An octave commemoration's own rendering — the fuller "Commemoratio
 * Octavæ ..." Ant+V/R+collect bundle (`${id}-octave-commemoration`, e.g.
 * christmas-day-octave-commemoration.yml), same shape and fallback
 * pattern as sanctoralCommemorationPart. No per-saint `propers`
 * indirection needed: an octave commemoration's id already is the base
 * feast/saint id (`christmas-day`, `st-stephen-protomartyr`, ...),
 * matching the proper file's own id 1:1.
 *
 * Not every octave's source carries a distinct Ant+V/R+collect bundle —
 * live-checked against the reference engine: St. Lawrence, Immaculate
 * Conception, Corpus Christi, Pentecost, and the Patronage of St. Joseph
 * have no `[Octava]` section anywhere in their own octave window, unlike
 * Christmas/Nativity-BVM/Sacred-Heart/Ascension which do. For those,
 * fall back to the feast's own plain collect alone (checking both the
 * common and temporal proper stores, since a movable feast's collect
 * lives in the latter) — same "collect alone, still labeled" fallback
 * `sanctoralCommemorationPart` already uses — rather than rendering a
 * fully empty commemoration when a real collect exists to show. */
export function octaveCommemorationPart(commemoration: Extract<Commemoration, { kind: 'octave' }>): ResolvedPart {
  const label = `Commemoration of the Octave of ${commemoration.name}`;
  const combined = resolveCommon(`${commemoration.id}-octave-commemoration`);
  if (combined.status.la !== 'missing' || combined.status.en !== 'missing') {
    return { kind: 'preces', text: combined, label };
  }
  const commonCollect = resolveCommon(`${commemoration.id}-collect`);
  if (commonCollect.status.la !== 'missing' || commonCollect.status.en !== 'missing') {
    return { kind: 'preces', text: commonCollect, label };
  }
  const temporalCollect = toResolvedText(getTemporalProper(`${commemoration.id}-collect`));
  if (temporalCollect.status.la !== 'missing' || temporalCollect.status.en !== 'missing') {
    return { kind: 'preces', text: temporalCollect, label };
  }
  return { kind: 'preces', text: { text: {}, status: { la: 'missing', en: 'missing' } }, label };
}

/** A temporal commemoration's own rendering — same fuller Ant+V/R+collect
 * shape as sanctoralCommemorationPart, for when a Sunday or privileged
 * feria with real standing of its own is commemorated in return after
 * losing outright to a Duplex+ sanctoral winner (calendar/commemorations.ts's
 * `ordinary-sunday`/`privileged-sunday`/`privileged-feria-minor` branches).
 * There's no separate `${id}-commemoration` proper-file convention for
 * temporal ids the way there is for saints, so this reuses the exact
 * antiphon/versicle the temporal day would have used had it won outright:
 * `${id}-benedictus-antiphon`/`${id}-magnificat-antiphon` (the same lookup
 * getBenedictusAntiphon/getMagnificatAntiphon use for a real temporal
 * winner) plus the plain weekday-keyed versicle every ferial/Sunday day
 * already falls back to when no override bundle applies. */
function temporalCommemorationPart(
  commemoration: Extract<Commemoration, { kind: 'temporal' }>,
  day: LiturgicalDay,
  hour: 'lauds' | 'vespers',
): ResolvedPart {
  const label = `Commemoration of ${temporalLabel(day).en}`;
  const collect = toResolvedText(getTemporalProper(`${commemoration.id}-collect`));
  const antiphon = toResolvedText(
    getTemporalProper(`${commemoration.id}-${hour === 'lauds' ? 'benedictus' : 'magnificat'}-antiphon`),
  );
  if (antiphon.status.la !== 'missing' || antiphon.status.en !== 'missing') {
    const versicleId =
      hour === 'lauds'
        ? `lauds-versicle-${day.weekday}`
        : day.weekday === 'saturday'
          ? 'vespers-versicle-saturday'
          : 'vespers-versicle-sunday-ferial';
    const versicle = resolveCommon(versicleId);
    return { kind: 'preces', text: combineCommemorationBundle(antiphon, versicle, collect), label };
  }
  if (collect.status.la !== 'missing' || collect.status.en !== 'missing') {
    return { kind: 'preces', text: collect, label };
  }
  return { kind: 'preces', text: { text: {}, status: { la: 'missing', en: 'missing' } }, label };
}

/**
 * The day's own collect, plus one more per commemoration (calendar/
 * types.ts's LiturgicalDay.commemorations) — Lauds/Vespers say all of
 * these in sequence, unlike the Little Hours' single getDayCollect.
 *
 * Simplification, not yet corrected: real practice compresses this into
 * one "Orémus" and lets only the *last* collect close with the full
 * doxology, with earlier ones trailing straight into the next ("And:").
 * Each collect file (data/propers/temporal/*-collect.yml, the per-saint
 * *-collect.yml files) already bakes in its own "Orémus."/"Per Dóminum...
 * Amen." for the single-collect case every other hour uses today, and
 * stripping that back out per-collect to chain them properly would need
 * text surgery this doesn't attempt — so on a commemorated day, each
 * collect here renders as its own complete, separate block instead.
 *
 * An octave commemoration skips rendering its own block here only when
 * it's the *specific* octave whose content resolveOfficeWinner already
 * substituted as the primary collect above (same
 * `day.temporalCategory === 'ordinary-feria'` gate, same
 * `resolveActiveOctave` pick — see resolveOfficeWinner's own doc
 * comment) — rendering it again would be a redundant repeat. Every
 * *other* simultaneously-active octave still gets its own block: e.g.
 * Aug 17, St. Lawrence's own elevated closing day and the Assumption's
 * ordinary day 3 genuinely overlap — Lawrence's own content governs the
 * primary collect (the higher-ranked of the two, resolveActiveOctave's
 * own pick), but the Assumption's octave is still real and distinct, not
 * a duplicate of Lawrence's, so it still renders its own commemoration
 * block here (once authored). On a day the temporal identity itself
 * keeps real standing (the Christmas Octave's own stacking days, e.g.
 * Dec 26-31), resolveOfficeWinner never substitutes anything, so no
 * octave is skipped and every active one renders here — the only place
 * those four octaves' real "Commemoratio Octavæ ..." content surfaces.
 */
export function getDayCollects(day: LiturgicalDay, hour: 'lauds' | 'vespers'): ResolvedPart[] {
  const parts: ResolvedPart[] = [{ kind: 'prayer', text: getDayCollect(day) }];
  // Mirrors resolveOfficeWinner's own gate: an octave only actually
  // supplied the primary collect when the day's winner itself wasn't a
  // real sanctoral feast (or one of the ALWAYS_OVERRIDE_TEMPORAL_IDS) —
  // otherwise the winner's own content stood on its own (e.g. St.
  // Bernard, Aug 20, outright beats the Assumption octave's threshold)
  // and the octave still needs its own commemoration block below.
  const substitutedOctaveId =
    day.winner.kind !== 'sanctoral' && !ALWAYS_OVERRIDE_TEMPORAL_IDS.has(day.winner.id) && day.temporalCategory === 'ordinary-feria'
      ? resolveActiveOctave(day.date)?.id
      : undefined;
  for (const commemoration of day.commemorations) {
    if (commemoration.kind === 'temporal') {
      parts.push(temporalCommemorationPart(commemoration, day, hour));
    } else if (commemoration.kind === 'sanctoral') {
      parts.push(sanctoralCommemorationPart(commemoration, day.weekday));
    } else if (commemoration.kind === 'octave' && commemoration.id !== substitutedOctaveId) {
      parts.push(octaveCommemorationPart(commemoration));
    }
  }
  return parts;
}

const SUFFRAGE_IDS = ['lauds-suffrage-cross', 'lauds-suffrage-bvm', 'lauds-suffrage-joseph', 'lauds-suffrage-apostles', 'lauds-suffrage-peace'];
const SUFFRAGE_LABELS: Record<string, string> = {
  'lauds-suffrage-cross': 'Commemoration of the Holy Cross',
  'lauds-suffrage-bvm': 'Commemoration of the Blessed Virgin Mary',
  'lauds-suffrage-joseph': 'Commemoration of St. Joseph',
  'lauds-suffrage-apostles': 'Commemoration of the Holy Apostles Peter and Paul',
  'lauds-suffrage-peace': 'For Peace',
};

/**
 * The four fixed Tridentine suffrages (Holy Cross, BVM, Joseph, Ss. Peter
 * & Paul, Peace), said after the day's collect(s) — shared by Lauds and
 * Vespers (live-verified 2026-08-25: Monastic Tridentinum 1617 renders
 * the identical "Suffragium" block, same four antiphons/prayers, after
 * *both* hours, not just Lauds — vu previously only had this mechanism
 * wired up at Lauds, an honest content gap rather than a deliberate
 * Lauds-only design). `omitOnDouble` gates the whole set at once (real
 * practice: suffrages drop on a Double-or-higher feast) — see below for
 * the caveat on what real practice also suppresses them for that isn't
 * modeled.
 */
export function resolveSuffrages(
  day: LiturgicalDay,
  omitOnDouble: boolean | undefined,
  hourId: 'lauds' | 'vespers' = 'lauds',
): ResolvedPart[] {
  // isDoubleOrHigher only ever looks at a sanctoral rank — Christ the
  // King is modeled as a named temporal winner (see
  // ALWAYS_OVERRIDE_TEMPORAL_IDS above) with no FeastClass to check at
  // all, so it needs its own explicit inclusion here. Confirmed live:
  // "Suffragium{omittitur}" — the whole set drops, same as any other
  // Double-or-higher day.
  const isChristTheKing = day.winner.kind === 'temporal' && day.winner.id === 'christ-the-king';
  // Confirmed live against Monastic Tridentinum 1617 directly (this
  // isn't a Tridentine-1906-only quirk -- the same exclusions hold
  // under the app's own primary rubric track): suffrages are omitted
  // *entirely* during Advent, Christmastide, and Passiontide (not all
  // of Lent -- ordinary Lent ferias still get them, checked directly
  // against 2026-02-20; only the last two weeks), and on any day
  // within an active octave, however low that octave's own rank is
  // -- checked directly against day 3 of St. Lawrence's own
  // (Semiduplex) octave, which still omits them despite being well
  // below the Duplex+ rank threshold below.
  const isSeasonallyExcluded = day.season === 'advent' || day.season === 'christmastide' || day.season === 'passiontide';
  const isWithinAnOctave = activeOctavesFor(day.date).length > 0;
  if (omitOnDouble && (isDoubleOrHigher(day.winner) || isChristTheKing || isSeasonallyExcluded || isWithinAnOctave)) {
    return [];
  }
  // Throughout the rest of Paschaltide, the whole ordinary 5-suffrage set
  // below collapses into a single alleluia-form "Suffragium Paschale" —
  // live-verified against both Monastic Tridentinum 1617 and Tridentine
  // 1906 directly (a plain Eastertide feria, 2026-04-20), byte-identical
  // between the two tracks. Checked after the omit-entirely gate above
  // (an active octave/Double+/Advent-Christmastide-Passiontide already
  // drops suffrages regardless of season, unaffected by this) but before
  // the ordinary per-suffrage filtering below, since this replaces that
  // filtering outright rather than adjusting it.
  if (isPaschaltide(day.season)) {
    return [{ kind: 'preces', text: resolveCommon(`${hourId}-suffrage-paschale`) }];
  }
  // "Of the Holy Cross" is the real *ferial*-office suffrage, sourced
  // from Tridentine 1906/1910 (a different track than the other four,
  // which come from Monastic 1617 -- that track has no Cross suffrage
  // at Lauds at all) -- live-verified against a plain ferial win, a
  // plain Sunday win, a low-rank saint's own win (even bare Simplex),
  // and Marian Saturday: Cross shows only when the bare temporal
  // feria itself is what's being prayed -- the exact *opposite* of
  // "Sunday or a feast of the Lord." In this app's own vocabulary,
  // that's `!isSundayOrFeast(day)` (the same ferial/festive split
  // Prime's capitulum already keys off) with one more exclusion for a
  // named temporal identity like Marian Saturday, which isn't Sunday
  // or a sanctoral winner either but still isn't a bare ferial office.
  const showCross = !isSundayOrFeast(day) && !(day.winner.kind === 'temporal' && getTemporalFeastRecord(day.winner.id));
  // "Of the Blessed Virgin Mary" is omitted specifically when the
  // day's own office is already Marian (would be redundant to
  // suffrage Mary again on her own day) -- confirmed live on Marian
  // Saturday (Simplex-strength, so it reaches this far rather than
  // being excluded outright above); the only case this app currently
  // has of a day using the Marian common below the suffrage-omitting
  // Duplex+ threshold (every actual Marian *feast* modeled so far is
  // Duplex-majus+ and already returns above).
  const isMarianSaturday = day.winner.kind === 'temporal' && day.winner.id === 'marian-saturday';
  const ids = SUFFRAGE_IDS.filter((id) => {
    if (id === 'lauds-suffrage-cross') return showCross;
    if (id === 'lauds-suffrage-bvm') return !isMarianSaturday;
    return true;
  });
  return ids.map((id) => ({
    kind: 'preces' as const,
    text: resolveCommon(id),
    label: SUFFRAGE_LABELS[id],
  }));
}

/**
 * Lauds' Benedictus antiphon, resolved the same way as getDayCollect: a
 * per-saint `${propers}-antiphon` (already authored during the sanctoral
 * pull, sourced from each saint's own raw [Ant 1] — see e.g.
 * st-lawrence-antiphon.yml) for a sanctoral winner, `${id}-benedictus-
 * antiphon` (not authored yet for any temporal id — resolves "missing",
 * same pending convention as everywhere else) for a temporal one, then
 * `saint.benedictusCommon` (`benedictus-antiphon-${benedictusCommon}.yml`,
 * see SaintRecord's own doc comment) when neither exists — run through
 * `withPaschaltideAlleluia` on the way out, so a Common-category
 * Benedictus antiphon picks up the same seasonal suffix its Prime/Terce/
 * Sext/None counterparts do (see PASCHALTIDE_SEASONS's own doc comment);
 * a saint's own unique `${propers}-antiphon` deliberately isn't — that
 * would need its own live-requery to confirm one way or the other, not
 * assumed from the Common-category finding. Uses resolveOfficeWinner, not
 * the raw `day.winner` — on an octave day this is the octave's own
 * feast's antiphon (live-verified: St. Lawrence's "In cratícula", not the
 * commemorated St. Clare's, and not the plain temporal day's), not a
 * *commemorated* saint's, which is a separate, weaker standing (see
 * getDayCollects/sanctoralCommemorationPart).
 */
export function getBenedictusAntiphon(day: LiturgicalDay): ResolvedText {
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal') {
    return toResolvedText(getTemporalProperWithFallback(winner.id, 'benedictus-antiphon', day));
  }
  const saint = getSaintRecord(winner.id);
  const proper = saint?.propers ? resolveCommon(`${saint.propers}-antiphon`) : undefined;
  const common = saint?.benedictusCommon
    ? withPaschaltideAlleluia(resolveCommon(`benedictus-antiphon-${saint.benedictusCommon}`), day)
    : undefined;
  return firstAvailable([proper, common], { text: {}, status: { la: 'missing', en: 'missing' } });
}

/**
 * Vespers' Magnificat antiphon — mirrors getBenedictusAntiphon's lookup
 * order exactly (temporal id, then a saint's own `${propers}-magnificat-
 * antiphon`, then their Common category's `magnificat-antiphon-${common}`
 * — none of that content authored yet, a separate future pass the same
 * shape as the Benedictus one was), but with two real differences: a bare
 * ferial weekday (Mon-Sat) has actual content to fall back to —
 * data/hours/vespers-magnificat-antiphons.yml's classic "quote the
 * Magnificat's own text in sequence" set — which Benedictus has no
 * equivalent of; and the O Antiphons below, checked before either the
 * temporal or sanctoral branch even runs.
 *
 * `withPaschaltideAlleluia` applied to the weekday fallback too, by
 * analogy with the Common-category treatment above; not independently
 * confirmed for this specific case.
 *
 * The O Antiphons (Dec 17-23) are checked first, unconditionally —
 * ahead of *both* the per-week `${winner.id}-magnificat-antiphon` file
 * and a real sanctoral winner's own antiphon, deliberately: this is the
 * app's own design choice (2026-08-30 user instruction), not a
 * reconstruction of any single historical rite's rubric — the reference
 * engine itself doesn't do this uniformly (its own Dec 20/21 live query
 * shows St. Thomas's own antiphon instead, see vespers-o-antiphons.yml's
 * header), but this app deliberately gives the O Antiphon absolute
 * priority for this one specific text slot on these seven dates,
 * regardless of who otherwise wins the day. Every other part of the
 * office (chapter/responsory/hymn/versicle/collect, Lauds' own Benedictus
 * antiphon) is untouched by this — a saint who wins Dec 17-23 (St.
 * Thomas, Dec 21) still gets everything else that comes with winning,
 * just not this one slot. This also means a saint's own real Magnificat
 * antiphon, once authored, is permanently unreachable on one of these
 * seven dates under *this* calendar's own construction — deliberately
 * accepted, since a saint's real antiphon is still worth having on file
 * for a differently-constructed calendar (e.g. a future user-editable
 * one) even where the shipped calendar's own precedence never surfaces
 * it here.
 */
function magnificatWeekdayDefault(day: LiturgicalDay): ResolvedText | undefined {
  const weekdayDefault = vespersMagnificatAntiphons[day.weekday];
  if (!weekdayDefault) {
    return undefined;
  }
  const resolved = weekdayDefault.status
    ? { text: weekdayDefault.antiphon, status: weekdayDefault.status }
    : verifiedText(weekdayDefault.antiphon);
  return withPaschaltideAlleluia(resolved, day);
}

export function getMagnificatAntiphon(day: LiturgicalDay): ResolvedText {
  const oAntiphon = vespersOAntiphons[day.date.slice(5)];
  if (oAntiphon) {
    return oAntiphon.status ? { text: oAntiphon.antiphon, status: oAntiphon.status } : verifiedText(oAntiphon.antiphon);
  }
  const winner = resolveOfficeWinner(day);
  if (winner.kind === 'temporal') {
    const named = toResolvedText(getTemporalProperWithFallback(winner.id, 'magnificat-antiphon', day));
    return firstAvailable([named, magnificatWeekdayDefault(day)], named);
  }
  const saint = getSaintRecord(winner.id);
  const proper = saint?.propers ? resolveCommon(`${saint.propers}-magnificat-antiphon`) : undefined;
  // A Vigil has no proper Magnificat antiphon of its own in the real rubric
  // -- its `[Rule]` block ("ex C1v; ... Laudes 2") always borrows whatever
  // the current ferial weekday's own antiphon is, live-verified across 4
  // different years (2025-2028) at the Vigil of St. Andrew's own First
  // Vespers: every one rendered "{Antiphona ex Proprio de Tempore}", never
  // a fixed Common text. So a Vigil takes the same weekday-default fallback
  // the plain temporal branch above uses, rather than falling through to
  // `magnificat-antiphon-common-of-a-vigil` (deliberately never authored --
  // there's no single fixed text to put there).
  const vigil = saint?.rank === 'vigil' ? magnificatWeekdayDefault(day) : undefined;
  const common = saint?.benedictusCommon
    ? withPaschaltideAlleluia(resolveCommon(`magnificat-antiphon-${saint.benedictusCommon}`), day)
    : undefined;
  return firstAvailable([proper, vigil, common], { text: {}, status: { la: 'missing', en: 'missing' } });
}

export function verifiedText(text: Partial<Record<string, string>>): ResolvedText {
  const status: Partial<Record<string, 'verified'>> = {};
  for (const lang of Object.keys(text)) {
    status[lang] = 'verified';
  }
  return { text, status };
}

const STATUS_RANK = { verified: 0, draft: 1, missing: 2 } as const;

// The marker convention Divinum Officium's own source data uses for a
// hymn's variable final stanza: hymni.pl's gethymn() checks whether the raw
// hymn text contains a literal asterisk, and if a doxology name was found
// for today, replaces everything from that asterisk onward with the
// resolved doxology text; otherwise the original text (asterisk and all)
// stands. Ported here as a literal "* " at the start of the stanza's own
// first line, on a new paragraph. This replaces continua's earlier approach
// of splitting each hymn into a separate body file plus a
// "*-doxology-per-annum.yml" file: that pushed a per-hymn authoring
// decision ("does this file need splitting?") onto whoever wrote each
// proper/Common hymn, and proved to actually just get skipped in practice
// (resolveOfficeBundle's proper/Common hymns never split their doxology at
// all, silently baking in whatever ending happened to be correct on the one
// date they were live-queried). One marker, one function, always called —
// a hymn with no marker (a genuinely fixed ending, e.g. Ave Maris Stella,
// Verbum Supernum Prodiens) just passes through unchanged, exactly like the
// source's own conditional substitution.
const DOXOLOGY_MARKER = '\n\n* ';

/**
 * Splices a season/feast/Common-specific doxology into a hymn's text where
 * its own marker (`DOXOLOGY_MARKER` above) sits, or leaves the hymn
 * completely unchanged when no marker is present (a fixed, non-swappable
 * ending) or no override applies for today (`getHymnDoxologyOverrideId`
 * returned `undefined` — the hymn's own marker-delimited default stands,
 * with the marker itself stripped for display). Safe to call on every
 * hymn — ferial, proper, Common, or octave alike — regardless of whether
 * that particular hymn happens to carry the marker.
 */
export function substituteDoxology(hymn: ResolvedText, override: ResolvedText | undefined): ResolvedText {
  const text: Partial<Record<string, string>> = {};
  const status: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  for (const lang of Object.keys(hymn.text)) {
    const original = hymn.text[lang];
    const markerIndex = original?.indexOf(DOXOLOGY_MARKER) ?? -1;
    if (!original || markerIndex === -1) {
      text[lang] = original;
      status[lang] = hymn.status[lang];
      continue;
    }
    const before = original.slice(0, markerIndex);
    const ownEnding = original.slice(markerIndex + DOXOLOGY_MARKER.length);
    const overrideText = override?.text[lang];
    text[lang] = `${before}\n\n${overrideText ?? ownEnding}`;
    const hymnStatus = hymn.status[lang] ?? 'missing';
    const overrideStatus = overrideText ? (override?.status[lang] ?? 'missing') : hymnStatus;
    status[lang] = STATUS_RANK[overrideStatus] > STATUS_RANK[hymnStatus] ? overrideStatus : hymnStatus;
  }
  return { text, status };
}

/** Splits a bilingual antiphon (one string per language, each with an
 * embedded "*") into its incipit and full forms, per language — each
 * prefixed "Ant. " inline, the same way "V."/"R." are baked directly into
 * versicle text rather than rendered as a separate UI marker.
 *
 * Takes the antiphon's real status and carries it through to both
 * outputs unchanged — previously hardcoded `verified` on everything it
 * touched regardless of the source's actual status (`verifiedText()`),
 * so a `draft` antiphon (e.g. St. Scholastica's, self-translated — see
 * TODO.md) silently lost its "unverified draft text" marker
 * (`src/ui/styles.css`'s `.text-draft`, a dashed underline + tooltip)
 * the moment it passed through here — which every antiphon does, since
 * this is the shared incipit/full split used by every hour. */
export function splitNamedAntiphon(antiphon: ResolvedText): {
  incipit: ResolvedText;
  full: ResolvedText;
} {
  const incipitText: Partial<Record<string, string>> = {};
  const fullText: Partial<Record<string, string>> = {};
  const incipitStatus: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  const fullStatus: Partial<Record<string, 'verified' | 'draft' | 'missing'>> = {};
  for (const [lang, t] of Object.entries(antiphon.text)) {
    if (!t) {
      continue;
    }
    const split = splitAntiphon(t);
    incipitText[lang] = `Ant. ${split.incipit}`;
    fullText[lang] = `Ant. ${split.full}`;
    const status = antiphon.status[lang] ?? 'missing';
    incipitStatus[lang] = status;
    fullStatus[lang] = status;
  }
  return { incipit: { text: incipitText, status: incipitStatus }, full: { text: fullText, status: fullStatus } };
}

/** The antiphon actually shown *before* a psalm/canticle: full text on a
 * Double-rank winner or higher, incipit only below that (see
 * `isDoubleOrHigher`'s own doc comment for the underlying rule) — the one
 * idiom every hour's psalmody independently repeated (`splitNamedAntiphon`
 * + `isDoubleOrHigher(...) ? full : incipit`) before being centralized
 * here. The closing repeat after the psalm/canticle is always `full`,
 * unconditionally, at each call site — this helper only decides the
 * opening. */
export function openingAntiphon(antiphon: ResolvedText, winner: DayWinner): ResolvedText {
  const { incipit, full } = splitNamedAntiphon(antiphon);
  return isDoubleOrHigher(winner) ? full : incipit;
}

/** Fixed wording, same as lauds.ts's weekday-canticle Gloria Patri —
 * appended after every psalm (hours/index.ts) except during the Sacred
 * Triduum. Not "verified" via verifiedText() because it's boilerplate
 * used everywhere, not a sourced proper text. */
const GLORIA_PATRI: BilingualText = {
  la: 'Glória Patri, et Fílio, * et Spirítui Sancto.\nSicut erat in princípio, et nunc, et semper, * et in sǽcula sæculórum. Amen.',
  en: 'Glory be to the Father, and to the Son, * and to the Holy Ghost.\nAs it was in the beginning, is now, * and ever shall be, world without end. Amen.',
};

/** The closing Gloria Patri for a psalm, or `undefined` during the Sacred
 * Triduum (calendar/temporal.ts's isInTriduum) when it's omitted
 * entirely — not just seasonally varied wording, an actual omission. */
export function resolveGloriaPatri(day: LiturgicalDay): ResolvedText | undefined {
  if (isInTriduum(day.date)) {
    return undefined;
  }
  // The Office of the Dead's "Requiem gloria" rubric — All Souls' Day
  // substitutes "Réquiem ætérnam/Et lux perpétua" for the ordinary Gloria
  // Patri after every psalm and canticle, all day — see hours/all-souls.ts.
  if (isAllSouls(day.date)) {
    return REQUIEM_GLORIA_PATRI;
  }
  return verifiedText(GLORIA_PATRI);
}

// The responsory's own closing Gloria is a DIFFERENT rule from the psalm/
// canticle one above: wider window (all of Passiontide, Passion Sunday
// through Holy Saturday -- `season === 'passiontide'` already covers
// exactly that span, no separate date-window helper needed), and it
// doesn't apply to a Sancti (saint) feast's own day even within that
// window -- live-verified: St. Joseph (Duplex I, 2027-03-19, landing in
// Passiontide that year) keeps "In manus tuas"'s Gloria at Compline, while
// an ordinary ferial day in the same window (2027-03-15) omits it, at both
// Compline and Prime's chapter-responsory.
//
// Every currently-authored responsory -- Gloria-bearing or already
// Gloria-free (e.g. lauds-responsory-passiontide.yml, a genuinely
// different proper-of-season chant, not a stripped copy of the ordinary
// one) -- ends the same way regardless: a short "R. [repetenda]" after
// the verse, then (only when shown) this same fixed Gloria line, then
// always a final "R. [full repetenda]" line. So the two forms differ by
// exactly one known, fixed-wording line -- omitting it is a filter, not a
// data migration.
const RESPONSORY_GLORIA_LINE: BilingualText = {
  la: 'V. Glória Patri, et Fílio, * et Spirítui Sancto.',
  en: 'V. Glory be to the Father, and to the Son, * and to the Holy Ghost.',
};

export function omitResponsoryGloria(day: LiturgicalDay): boolean {
  return day.season === 'passiontide' && day.winner.kind !== 'sanctoral';
}

/** Strips the responsory's closing Gloria line from `text` when the day
 * calls for its omission (see omitResponsoryGloria); returns `text`
 * unchanged otherwise. Safe to call on already-Gloria-free text (e.g. the
 * proper-of-season responsories) -- the line just won't be found. */
export function resolveResponsory(text: ResolvedText, day: LiturgicalDay): ResolvedText {
  if (!omitResponsoryGloria(day)) {
    return text;
  }
  const stripped: Partial<Record<string, string>> = {};
  for (const [lang, t] of Object.entries(text.text)) {
    const gloriaLine = RESPONSORY_GLORIA_LINE[lang];
    stripped[lang] = t && gloriaLine ? t.split('\n').filter((line) => line !== gloriaLine).join('\n') : t;
  }
  return { ...text, text: stripped };
}
