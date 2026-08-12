// Sanctoral occurrence resolution: given a date, which saint(s) are
// assigned via data/calendar/sanctoral-calendar.yml's day -> saint-id
// mapping, and their rank from data/calendar/saints/<id>.yml. See
// calendar/temporal.ts for the separate temporal-cycle resolution, and
// calendar/commemorations.ts for how a candidate returned here actually
// gets weighed against the day's temporal standing.
//
// Doesn't resolve clashes *among* multiple saints sharing a date — real
// practice has its own precedence/commemoration rules for that too, not
// modeled here. If a day has more than one candidate, calendar/index.ts
// just picks the highest-ranked as the day's sole sanctoral contender.
import type { FeastClass, OctaveConfig } from './types';
import sanctoralCalendarData from '../data/calendar/sanctoral-calendar.yml';

export interface SaintRecord {
  id: string;
  name: string;
  rank: FeastClass;
  common: string;
  propers: string | null;
  /** Fallback id for Prime/Terce/Sext/None's antiphon/chapter when this
   * saint has no proper file of their own for a given hour (see
   * hours/resolve-common.ts's resolveMinorHourAntiphon/Chapter) — a
   * *different* id than `common` above, deliberately: live-verified that
   * the minor hours don't always draw from the same Common category as
   * the saint's overall classification. E.g. both Chair of St. Peter
   * feasts are `common: common-of-an-apostle` (Peter's own rank/collect
   * classification), but their Prime/Terce/Sext/None content is drawn
   * from the Common of a Confessor Bishop instead (Peter considered as
   * bishop, for that specific commemoration) — `minorHoursCommon:
   * common-of-a-confessor-bishop` captures that without corrupting the
   * saint's real `common` field. Absent for saints with no shared-Common
   * minor-hour content (either fully proper, or not yet authored).
   */
  minorHoursCommon?: string;
  /** See calendar/types.ts's OctaveConfig doc comment. Absent for the vast
   * majority of saints — only ones with a real octave declare it. */
  octave?: OctaveConfig;
}

const sanctoralCalendar = sanctoralCalendarData as { days: Record<string, string[]> };

const saintModules = import.meta.glob<{ default: SaintRecord }>('../data/calendar/saints/*.yml', {
  eager: true,
});

const saintsById = new Map<string, SaintRecord>();
for (const mod of Object.values(saintModules)) {
  saintsById.set(mod.default.id, mod.default);
}

export interface SanctoralCandidate {
  id: string;
  name: string;
  rank: FeastClass;
}

/** Which saint(s) (if any) are assigned to this date. `isoDate`'s year is ignored — the sanctoral cycle repeats every civil year. */
/** The saint's full record — used when something more than id/name/rank is
 * needed, e.g. hours/resolve-common.ts's getDayCollect looking up whether
 * a real collect has been authored for a winning saint. */
export function getSaintRecord(id: string): SaintRecord | undefined {
  return saintsById.get(id);
}

export function getSanctoralCandidatesFor(isoDate: string): SanctoralCandidate[] {
  const monthDay = isoDate.slice(5);
  const ids = sanctoralCalendar.days[monthDay] ?? [];
  return ids.map((id) => {
    const saint = saintsById.get(id);
    if (!saint) {
      throw new Error(`sanctoral-calendar.yml references unknown saint id '${id}'`);
    }
    return { id: saint.id, name: saint.name, rank: saint.rank };
  });
}
