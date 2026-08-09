/** Formats an ISO date as e.g. "Sunday, August 9, 2026" — always in UTC so
 * it matches calendar/weekday.ts's interpretation regardless of the
 * viewer's local timezone. */
export function formatDateLong(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function hourLabel(hourId: string): string {
  return hourId.charAt(0).toUpperCase() + hourId.slice(1);
}
