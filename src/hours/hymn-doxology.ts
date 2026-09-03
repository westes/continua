import type { LiturgicalDay } from '../calendar/types';
import { resolveOfficeWinner } from './resolve-common';
import bySeasonData from '../data/hours/hymn-doxology-by-season.yml';
import byFeastData from '../data/hours/hymn-doxology-by-feast.yml';

const bySeason = bySeasonData as { bySeason: Record<string, string> };
const byFeast = byFeastData as { byFeastId: Record<string, string> };

const NAT_DOXOLOGY_ID = 'hymn-doxology-nat';

/**
 * Divinum Officium's own doxology() sub (specials/hymni.pl) hardcodes the
 * Assumption's octave (Aug 16-22) to the Nativity doxology, regardless of
 * season or which feast is winning that day — live-checked in the source,
 * and *not* excluded for the Monastic/Tridentine 1617 track (unlike its
 * Dec 9-15 companion rule for the Immaculate Conception's run-up, which the
 * source explicitly excludes 1570/1617/1963/altovadensis from, so that one
 * is deliberately NOT ported here). Checked directly by date, same pattern
 * as marian-antiphon.ts's isCandlemasToHolyWednesday — this window doesn't
 * line up with any `Season` value.
 */
function isAssumptionOctaveWindow(isoDate: string): boolean {
  const [, monthStr, dayStr] = isoDate.split('-');
  const month = Number(monthStr);
  const day = Number(dayStr);
  return month === 8 && day > 15 && day < 23;
}

/**
 * Resolves the common-propers id for a hymn's seasonal final doxology
 * stanza. The seasonal overrides are shared across every hymn (Divinum
 * Officium's own Doxologies.txt table is hymn-agnostic), but the per-annum
 * default is each hymn's own natural ending, so callers supply it.
 *
 * Precedence, matching hymni.pl's doxology() sub: (1) an explicit per-feast
 * override — real Divinum Officium's `winner{Doxology}`/`Rule Doxology=`
 * mechanism, e.g. the Common of the BVM's own `Doxology=Nat` rule, which is
 * why Marian Saturdays (a `kind: 'temporal'` winner, not `'sanctoral'` —
 * checked regardless of kind, unlike chapter-responsory's/opening-
 * versicle's own byFeastId tables, since a temporal id and a sanctoral id
 * never collide) get the Nativity doxology even outside Christmastide; (2)
 * the Assumption-octave date window above; (3) the season; (4) the hymn's
 * own per-annum default.
 */
export function getHymnDoxologyId(day: LiturgicalDay, perAnnumId: string): string {
  const winner = resolveOfficeWinner(day);
  const feastOverride = winner.kind === 'sanctoral' || winner.kind === 'temporal' ? byFeast.byFeastId[winner.id] : undefined;
  if (feastOverride) {
    return feastOverride;
  }
  if (isAssumptionOctaveWindow(day.date)) {
    return NAT_DOXOLOGY_ID;
  }
  return bySeason.bySeason[day.season] ?? perAnnumId;
}
