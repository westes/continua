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
import type { FeastClass } from './types';
import sanctoralCalendarData from '../data/calendar/sanctoral-calendar.yml';

interface SaintRecord {
  id: string;
  name: string;
  rank: FeastClass;
  common: string;
  propers: string | null;
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
