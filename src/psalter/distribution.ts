import type { HourId } from '../hours/types';
import type { Weekday } from '../calendar/types';
import distributionData from '../data/psalter-distribution.yml';

type DistributionTable = Partial<Record<HourId, Partial<Record<Weekday, number[]>>>>;

const distribution = distributionData as DistributionTable;

/** Placeholder distribution — see data/psalter-distribution.yml for caveats. */
export function getPsalmNumbersFor(hourId: HourId, weekday: Weekday): number[] {
  return distribution[hourId]?.[weekday] ?? [];
}
