// The reference engine's own "calendar-month/week" Matins-reading identity
// (e.g. "081" = 1st Sunday of August) — genuinely anchored to the civil
// calendar, NOT Easter-offset like every other id in temporal-id.ts. Real
// Nocturn 2 patristic content for the later post-Pentecost Sundays lives
// in the reference engine's Tempora/<MMN>-0.txt files (August-November),
// keyed this way, not by post-pentecost-NN — which month/week id governs a
// given date shifts every year with Easter's date, so there is no fixed
// post-pentecost-NN <-> month-week correspondence to hard-code. See
// hours/matins.ts's buildReadingPool, which pools this id's own authored
// content (data/propers/nocturn-readings/month-week-<id>.yml) alongside
// the ordinary temporalId-keyed pool, same dual-key precedent as
// propers/bible-plan.ts's Dec25-Jan13 calendar-date stretch.
//
// Ported from DivinumOfficium's own Date.pm::monthday() sub, Tridentine/
// pre-1955 rubrics (this app's baseline throughout — see
// calendar/temporal.ts's resolveTemporalCategory and its neighbors for the
// same choice made elsewhere). Concretely, "pre-1955" here means
// Date.pm's own $modernstyle flag is false: no 1960-rubric October
// week-III vanishing (that adjustment is entirely modernstyle-gated, so
// simply never applies here), and November's backward-from-Advent
// recount still applies for week > 0 (that part is NOT modernstyle-gated
// in the source) but its extra "collapse week 1 into week 0" step is
// skipped (that step *is* modernstyle-only).
import { addDays, dayOfWeek, daysBetween } from './date-math';
import { adventStart, sundayOnOrBefore } from './temporal';

/** The Sunday that "counts as" the 1st Sunday of `month` for this
 * reckoning: the Sunday on-or-before the 1st, unless the 1st falls
 * Thu-Sat (in which case that partial first week has fewer than 4 days in
 * `month`, so it's skipped in favor of the following Sunday). */
function firstSundayOfLiturgicalMonth(year: number, month: number): string {
  const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const sunday = sundayOnOrBefore(firstOfMonth);
  return dayOfWeek(firstOfMonth) >= 4 ? addDays(sunday, 7) : sunday;
}

/**
 * `"MMN"` (month, 2 digits; week, 1 digit — e.g. `"081"`), or `undefined`
 * if `isoDate` falls outside the reckoning's range (before the 1st Sunday
 * of August, or on/after Advent's start). Only ever non-undefined for
 * August through the eve of Advent.
 */
export function monthWeekId(isoDate: string): string | undefined {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  if (month < 7) return undefined;

  let litMonth = 0;
  const firstSundays: Partial<Record<number, string>> = {};
  for (let m = 8; m <= 12; m++) {
    const firstSunday = firstSundayOfLiturgicalMonth(year, m);
    firstSundays[m] = firstSunday;
    if (isoDate >= firstSunday) {
      litMonth = m;
    } else {
      break;
    }
  }
  if (litMonth === 0) return undefined;

  const advent = adventStart(year);
  if (litMonth > 10 && isoDate >= advent) return undefined;

  let week = Math.floor(daysBetween(firstSundays[litMonth]!, isoDate) / 7);

  // November: renumbered by counting backward from Advent rather than
  // forward from November's own 1st Sunday, for every week after the
  // first — real rubric, not modernstyle-gated (see header comment).
  if (litMonth === 11 && week > 0) {
    week = 4 - Math.floor((daysBetween(isoDate, advent) - 1) / 7);
  }

  return `${String(litMonth).padStart(2, '0')}${week + 1}`;
}
