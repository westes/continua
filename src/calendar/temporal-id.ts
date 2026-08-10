// Maps any date to one of the 52 canonical temporal-propers ids already
// authored in data/propers/temporal/*.yml — the "which Sunday's collect
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
// Two known, deliberately unfixed gaps: the ferias between Christmas Day
// and the Sunday within its octave, and between Epiphany and its own
// first Sunday, fall back to that season's first named Sunday a few days
// early — Christmas Day's and Epiphany's own collects aren't authored as
// separate temporal-propers entries (only Sunday collects were pulled), so
// this is a deliberate approximation, not an oversight. Likewise, a real
// overflow year (early Easter, more than 24 weeks between Trinity and
// Advent) would traditionally reuse the unused post-Epiphany Sundays'
// collects for the excess weeks — not modeled; this just clamps at
// post-pentecost-24.
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
for (let n = 1; n <= 24; n++) {
  EASTER_OFFSET_IDS.push([56 + 7 * (n - 1), `post-pentecost-${String(n).padStart(2, '0')}`]);
}
const EASTER_OFFSET_ID_MAP = new Map(EASTER_OFFSET_IDS);
const MAX_EASTER_OFFSET = EASTER_OFFSET_IDS[EASTER_OFFSET_IDS.length - 1]![0];
const MAX_EASTER_OFFSET_ID = EASTER_OFFSET_IDS[EASTER_OFFSET_IDS.length - 1]![1];

export function resolveTemporalId(isoDate: string): string {
  const season = resolveSeason(isoDate);
  const year = Number(isoDate.slice(0, 4));

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
  const offset = easterOffsetOf(sundayOnOrBefore(isoDate));
  if (offset > MAX_EASTER_OFFSET) {
    return MAX_EASTER_OFFSET_ID;
  }
  return EASTER_OFFSET_ID_MAP.get(offset) ?? 'septuagesima';
}
