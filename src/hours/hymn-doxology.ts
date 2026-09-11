import type { LiturgicalDay } from '../calendar/types';
import { getSaintRecord } from '../calendar/feasts';
import { resolveOfficeWinner } from './resolve-common';
import bySeasonData from '../data/hours/hymn-doxology-by-season.yml';
import byFeastData from '../data/hours/hymn-doxology-by-feast.yml';

const bySeason = bySeasonData as { bySeason: Record<string, string> };
const byFeast = byFeastData as { byFeastId: Record<string, string>; byCommonId: Record<string, string> };

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
 * stanza, or `undefined` when no override applies — matching hymni.pl's
 * own `doxology()` sub, whose `$dname` is simply empty in that case, so no
 * substitution happens and the hymn's own baked-in ending stands (see
 * `substituteDoxology` in resolve-common.ts). There is no "per-annum
 * default id" here anymore: a hymn's own natural ending is just part of its
 * own text (after the `*` marker), not a separate id this function needs
 * to know about — see resolve-common.ts's `substituteDoxology` doc comment
 * for the marker convention itself.
 *
 * Precedence, matching hymni.pl's doxology() sub: (1) an explicit per-feast
 * override — real Divinum Officium's `winner{Doxology}`/`Rule Doxology=`
 * mechanism on the feast's own rule, e.g. Transfiguration's own
 * `Doxology=Epi`, or Marian Saturday's `Doxology=Nat` (a `kind: 'temporal'`
 * winner, not `'sanctoral'` — checked regardless of kind, unlike chapter-
 * responsory's/opening-versicle's own byFeastId tables, since a temporal id
 * and a sanctoral id never collide); (2) a `Doxology=` rule set at the
 * *Common* level instead of the feast's own — e.g. every Common of the BVM
 * sets `Doxology=Nat`, inherited by any saint using that Common regardless
 * of the saint's own id (`byCommonId`, keyed by `SaintRecord.common`,
 * mirroring resolveOfficeBundle's own `getSaintRecord(id)?.common`
 * fallback pattern in resolve-common.ts); (3) the Assumption-octave date
 * window above; (4) the season; (5) no override — the hymn's own marker-
 * delimited default stands.
 *
 * Octave days need no separate handling here: `resolveOfficeWinner` above
 * already substitutes the governing octave's saint/feast id in place of a
 * plain-ferial `day.winner` on interior octave days (resolve-common.ts),
 * for any octave with a real saint record or listed in
 * ALWAYS_OVERRIDE_TEMPORAL_IDS (corpus-christi/sacred-heart both are) — so
 * tiers (1)/(2) above already see nativity-bvm/corpus-christi/sacred-heart
 * etc. as `winner` throughout their own octaves, not just on their anchor
 * day. Don't reintroduce an extra day.commemorations/resolveActiveOctave
 * scan here — that would just reimplement what resolveOfficeWinner already
 * does correctly.
 */
export function getHymnDoxologyOverrideId(day: LiturgicalDay): string | undefined {
  const winner = resolveOfficeWinner(day);
  const feastOverride = winner.kind === 'sanctoral' || winner.kind === 'temporal' ? byFeast.byFeastId[winner.id] : undefined;
  if (feastOverride) {
    return feastOverride;
  }
  const commonOverride = winner.kind === 'sanctoral' ? byFeast.byCommonId[getSaintRecord(winner.id)?.common ?? ''] : undefined;
  if (commonOverride) {
    return commonOverride;
  }
  if (isAssumptionOctaveWindow(day.date)) {
    return NAT_DOXOLOGY_ID;
  }
  return bySeason.bySeason[day.season];
}
