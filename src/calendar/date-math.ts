// Small ISO-date ("YYYY-MM-DD") arithmetic helpers shared by easter.ts and
// temporal.ts. Parsed/formatted as UTC midnight throughout, same convention
// as weekday.ts, so results don't shift with the caller's local timezone.

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export function toIsoDate(date: CalendarDate): string {
  const mm = String(date.month).padStart(2, '0');
  const dd = String(date.day).padStart(2, '0');
  return `${date.year}-${mm}-${dd}`;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  const from = new Date(`${fromIsoDate}T00:00:00Z`).getTime();
  const to = new Date(`${toIsoDate}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

/** 0 = Sunday, ..., 6 = Saturday. */
export function dayOfWeek(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}
