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

describe('All Souls Matins antiphons', () => {
  it('repeats each of the nine psalm antiphons in full, with its half-line *, after its psalm', () => {
    const ordo = resolveOrdo('matins', '2026-11-02');
    const groups = ordo.parts.filter((p) => p.kind === 'nocturn-psalmody');
    expect(groups).toHaveLength(3);
    for (const g of groups) {
      if (g.kind !== 'nocturn-psalmody') continue;
      expect(g.psalms.map((p) => p.kind)).toEqual(['psalm', 'antiphon', 'psalm', 'antiphon', 'psalm', 'antiphon']);
      for (const p of g.psalms) {
        if (p.kind === 'antiphon') {
          expect(p.text.text.la).toContain('*');
          expect(p.text.text.en).toContain('*');
        }
      }
    }
  });
});

describe('All Souls on a Sunday', () => {
  it('moves to Monday Nov 3 when Nov 2 is a Sunday (2025), and stays on Nov 2 otherwise', () => {
    expect(isAllSouls('2026-11-02')).toBe(true);
    expect(isAllSouls('2025-11-02')).toBe(false);
    expect(isAllSouls('2025-11-03')).toBe(true);
  });
});

describe('All Souls commemorated at Vespers of All Saints', () => {
  it('has a clean label and text in both languages', () => {
    const parts = resolveOrdo('vespers', '2026-11-01').parts as { label?: string; text?: { text: Record<string, string>; status: Record<string, string> } }[];
    const part = parts.find((p) => p.label?.includes('Faithful Departed'));
    expect(part?.label).toBe('Commemoration of All the Faithful Departed');
    expect(part?.text?.status.la).not.toBe('missing');
    expect(part?.text?.status.en).not.toBe('missing');
    expect(part?.text?.text.en).toContain('Maker and the Redeemer');
  });
});
