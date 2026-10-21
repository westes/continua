// Maps any date to one of the 52 canonical temporal-propers ids already
// authored in the entries of data/<lang>/propers/*.yml flagged `temporal` — the "which Sunday's collect
// governs this date" question. A feria always inherits the collect of the
// Sunday on or before it (real rubric: the ferias of a week use that
// week's own Sunday collect), so this is really "find the governing
// Sunday, then name it."
//
// Deliberately Pentecost/offset-based, not Trinity-counted — this is
// content-storage identity, kept independent of whatever counting
// convention calendar/day-label.ts displays on screen. See that file's
// header and propers/index.ts's getTemporalProper for the fuller version
// of this reasoning.
//
// One known, deliberately unfixed gap: the ferias between Christmas Day
// and the Sunday within its octave, and between Epiphany and its own
// first Sunday, fall back to that season's first named Sunday a few days
// early — Christmas Day's and Epiphany's own collects aren't authored as
// separate temporal-propers entries (only Sunday collects were pulled), so
// this is a deliberate approximation, not an oversight.
//
// Overflow years (Easter early enough that fewer than 6 Sundays after
// Epiphany occur before Septuagesima cuts in) are handled below: the
// skipped post-Epiphany Sundays "resume" after Sunday XXIII after
// Pentecost, in their own numeric order, right before the fixed final
// Sunday of the year (always Sunday XXIV's own formulary, regardless of
// how many Sundays actually elapsed since Pentecost). Ported directly
// from the reference engine's own `getweek()`
// (DivinumOfficium/Date.pm) — same rubric, same arithmetic (weeks-until-
// Advent, not a separately-tracked count of skipped Epiphany Sundays);
// confirmed against that source rather than re-derived by hand.
import { resolveSeason, sundayOnOrBefore, firstSundayStrictlyAfter, adventStart, easterOffsetOf } from './temporal';
import { daysBetween } from './date-math';

const EASTER_OFFSET_IDS: [number, string][] = [
  [-63, 'septuagesima'],
  [-56, 'sexagesima'],
  [-49, 'quinquagesima'],
  [-42, 'lent-1'],
  [-35, 'lent-2'],
  [-28, 'lent-3'],
  [-21, 'lent-4'],
  [-14, 'passion-sunday'],
  [-7, 'palm-sunday'],
  [0, 'easter-sunday'],
  [7, 'easter-octave'],
  [14, 'easter-3'],
  [21, 'easter-4'],
  [28, 'easter-5'],
  [35, 'easter-6'],
  [42, 'sunday-after-ascension'],
  [49, 'pentecost-sunday'],
];
// Sundays I-XXII after Pentecost only — XXIII and XXIV are handled by
// resolvePostPentecost23Plus below, since (unlike I-XXII) which id a given
// week gets can depend on distance-to-Advent, not just its own offset.
for (let n = 1; n <= 22; n++) {
  EASTER_OFFSET_IDS.push([56 + 7 * (n - 1), `post-pentecost-${String(n).padStart(2, '0')}`]);
}
const EASTER_OFFSET_ID_MAP = new Map(EASTER_OFFSET_IDS);

/**
 * A governing Sunday at or beyond Pentecost week XXIII. `pentecostWeek` is
 * the reference engine's own `$n` (1 = Trinity Sunday, verified against
 * DivinumOfficium/Date.pm and its Tempora/PentNN file naming).
 */
function resolvePostPentecost23Plus(governingSunday: string, year: number, pentecostWeek: number): string {
  const wdist = Math.floor((daysBetween(governingSunday, adventStart(year)) + 6) / 7);
  if (wdist < 2) {
    return 'post-pentecost-24';
  }
  if (pentecostWeek === 23) {
    return 'post-pentecost-23';
  }
  return `post-epiphany-${8 - wdist}`;
}

export function resolveTemporalId(isoDate: string): string {
  const season = resolveSeason(isoDate);
  const year = Number(isoDate.slice(0, 4));

  // The Vigil of Christmas (Dec 24) has its own real proper content
  // (collect, Lauds antiphons, Matins Gospel+homily nocturn) distinct from
  // Advent 4's own — see the collect section of data/<lang>/propers/vigil-of-christmas.yml
  // and the nocturn-readings section of data/<lang>/propers/vigil-of-christmas.yml, both
  // transcribed directly from the reference engine's Sancti/12-24.txt.
  // Applies even when Dec 24 itself is Advent 4's own Sunday — per direct
  // instruction (2026-08), the Vigil's own identity (rank/collect/Lauds
  // antiphons) governs that day too, with Advent 4 folded in as a
  // commemoration instead (calendar/index.ts's
  // applyAdventFourVigilCommemoration) rather than the reference engine's
  // own `no commemoratio` rule. Matins' three-nocturn Sunday psalmody is
  // unaffected either way — it's driven by `day.weekday`, not by this id
  // (hours/matins.ts's own `threeNocturns` check), so Advent 4's "Psalmi
  // Dominica" standing survives this id swap for free.
  if (isoDate.slice(5) === '12-24') {
    return 'vigil-of-christmas';
  }

  if (season === 'advent') {
    const start = adventStart(year);
    const n = Math.round(daysBetween(start, sundayOnOrBefore(isoDate)) / 7) + 1;
    return `advent-${Math.min(n, 4)}`;
  }

  if (season === 'christmastide') {
    return 'christmas-octave-sunday';
  }

  if (season === 'epiphanytide') {
    const firstSunday = firstSundayStrictlyAfter(`${year}-01-06`);
    if (isoDate < firstSunday) {
      return 'post-epiphany-1';
    }
    const n = Math.round(daysBetween(firstSunday, sundayOnOrBefore(isoDate)) / 7) + 1;
    return `post-epiphany-${Math.min(n, 6)}`;
  }

  // Everything else (Septuagesima-tide through Trinitytide) is Easter-
  // anchored — find the governing Sunday and map its own offset directly,
  // regardless of which `season` bucket the feria itself falls in (the
  // ferias right after Ash Wednesday genuinely reuse Quinquagesima's
  // collect, crossing what resolveSeason calls two different seasons).
  const governingSunday = sundayOnOrBefore(isoDate);
  const offset = easterOffsetOf(governingSunday);
  const pentecostWeek = Math.round((offset - 49) / 7);
  if (pentecostWeek >= 23) {
    return resolvePostPentecost23Plus(governingSunday, year, pentecostWeek);
  }
  return EASTER_OFFSET_ID_MAP.get(offset) ?? 'septuagesima';
}
