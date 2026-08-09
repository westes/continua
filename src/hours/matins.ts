import type { ResolvedOrdo } from './types';

// Milestone 5, most complex. Needs its own resolution path (reading-candidate
// pool + rank/season-driven slotting), not the static parts-array pattern the
// other hours use — see the plan's "Matins schema seam" note. Not built yet.
export function resolveOrdo(date: string): ResolvedOrdo {
  return { hourId: 'matins', date, parts: [], notImplemented: true };
}
