import type { HourId } from '../hours/types';
import type { Weekday } from '../calendar/types';
import distributionData from '../data/psalter-distribution.yml';

/** A whole psalm, or (per data/psalter-distribution.yml's "N(a-b)" notation)
 * a verse-range slice of one — the Monastic distribution splits several
 * psalms (9, 17, 118) across adjacent days/hours. */
export interface PsalmRef {
  number: number;
  verses?: string;
}

type DistributionTable = Partial<Record<HourId, Partial<Record<Weekday, PsalmRef[]>>>>;

const distribution = distributionData as DistributionTable;

export function getPsalmsFor(hourId: HourId, weekday: Weekday): PsalmRef[] {
  return distribution[hourId]?.[weekday] ?? [];
}
