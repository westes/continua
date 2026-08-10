import type { LiturgicalDay } from '../calendar/types';
import { easterSunday } from '../calendar/easter';
import { addDays, toIsoDate } from '../calendar/date-math';
import { resolveSeasonalPropersId } from './seasonal-propers';
import bySeasonData from '../data/hours/marian-antiphon-by-season.yml';

const bySeason = bySeasonData as { perAnnum: string; bySeason: Record<string, string> };

const AVE_REGINA_CAELORUM_ID = 'marian-antiphon-ave-regina-caelorum';

/**
 * Ave Regina Caelorum's real window (Candlemas through Wednesday of Holy
 * Week) doesn't line up with any of the mutually-exclusive `season` values
 * the rest of the app uses (it starts mid-Epiphanytide and ends mid-Lent
 * or mid-Passiontide, depending on the year) — see calendar/types.ts's
 * Season doc comment for the general overlapping-windows problem this is
 * one instance of. Rather than force `season` to represent it, this checks
 * the real date directly, bypassing the by-season table for this one case.
 * The Triduum (Maundy Thursday through Holy Saturday) that follows isn't
 * specially handled — it falls through to whatever `season` resolves to
 * there (currently 'passiontide', not a key in marian-antiphon-by-season's
 * bySeason table, so it lands on the perAnnum default), which is a known,
 * separate gap, not something this fix claims to solve.
 */
function isCandlemasToHolyWednesday(isoDate: string): boolean {
  const year = Number(isoDate.slice(0, 4));
  const candlemas = `${year}-02-02`;
  const maundyThursday = addDays(toIsoDate(easterSunday(year)), -3);
  return isoDate >= candlemas && isoDate < maundyThursday;
}

/** Resolves the common-propers id for Compline's closing Marian antiphon. */
export function getMarianAntiphonId(day: LiturgicalDay): string {
  if (isCandlemasToHolyWednesday(day.date)) {
    return AVE_REGINA_CAELORUM_ID;
  }
  return resolveSeasonalPropersId(day.season, day.winner, bySeason);
}

const LABELS: Record<string, string> = {
  'marian-antiphon-alma-redemptoris-advent': 'Alma Redemptoris Mater',
  'marian-antiphon-alma-redemptoris-nativity': 'Alma Redemptoris Mater',
  'marian-antiphon-ave-regina-caelorum': 'Ave Regina Caelorum',
  'marian-antiphon-regina-caeli': 'Regina Caeli',
  'marian-antiphon-salve-regina': 'Salve Regina',
};

/** The real, singable name of whichever antiphon getMarianAntiphonId picked. */
export function getMarianAntiphonLabel(id: string): string {
  return LABELS[id] ?? 'Marian Antiphon';
}
