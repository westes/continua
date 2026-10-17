import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { HOUR_IDS } from '../../src/hours/types';
import { isAllSouls } from '../../src/calendar/day-label';

function collectStatuses(value: unknown, statuses: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v) => collectStatuses(v, statuses));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'status' && v && typeof v === 'object') {
        statuses.push(...Object.values(v as Record<string, string>));
      } else {
        collectStatuses(v, statuses);
      }
    }
  }
}

describe('All Souls’ Day (Nov 2) — Office of the Dead', () => {
  for (const date of ['2026-11-02', '2027-11-02']) {
    for (const hourId of HOUR_IDS) {
      it(`${hourId} on ${date} has no missing text`, () => {
        const ordo = resolveOrdo(hourId, date);
        const statuses: string[] = [];
        collectStatuses(ordo.parts, statuses);
        expect(statuses.length).toBeGreaterThan(0);
        expect(statuses).not.toContain('missing');
      });
    }
  }

  it('does not affect Nov 1 First Vespers of All Saints', () => {
    const ordo = resolveOrdo('vespers', '2026-11-01');
    const label = ordo.dayLabel?.en ?? '';
    expect(label.toLowerCase()).not.toContain('all souls');
  });
});

describe('All Souls on a Sunday', () => {
  it('moves to Monday Nov 3 when Nov 2 is a Sunday (2025), and stays on Nov 2 otherwise', () => {
    expect(isAllSouls('2026-11-02')).toBe(true);
    expect(isAllSouls('2025-11-02')).toBe(false);
    expect(isAllSouls('2025-11-03')).toBe(true);
  });
});
