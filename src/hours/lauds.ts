import type { ResolvedOrdo } from './types';

// Milestone 4 — first hour needing real sanctoral occurrence + rank/commemoration
// resolution (calendar/feasts.ts, calendar/easter.ts). Not built yet.
export function resolveOrdo(date: string): ResolvedOrdo {
  return { hourId: 'lauds', date, parts: [], notImplemented: true };
}
