import type { ResolvedOrdo } from './types';

// Milestone 4, alongside Lauds — also has the first/second-Vespers overlap
// wrinkle (see OccurringFeast.vespersFrom). Not built yet.
export function resolveOrdo(date: string): ResolvedOrdo {
  return { hourId: 'vespers', date, parts: [], notImplemented: true };
}
