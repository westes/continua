import { describe, expect, it } from 'vitest';
import { weekdayOf } from '../../src/calendar/weekday';
import { resolveDay } from '../../src/calendar';

describe('weekdayOf', () => {
  it('resolves a known Sunday', () => {
    // 2026-08-09 is a Sunday.
    expect(weekdayOf('2026-08-09')).toBe('sunday');
  });

  it('resolves each day of a full week correctly', () => {
    const expected = [
      ['2026-08-09', 'sunday'],
      ['2026-08-10', 'monday'],
      ['2026-08-11', 'tuesday'],
      ['2026-08-12', 'wednesday'],
      ['2026-08-13', 'thursday'],
      ['2026-08-14', 'friday'],
      ['2026-08-15', 'saturday'],
    ] as const;
    for (const [date, weekday] of expected) {
      expect(weekdayOf(date)).toBe(weekday);
    }
  });

  it('is not affected by the local timezone offset', () => {
    // Regression guard: resolving via `new Date(isoDate)` without pinning to
    // UTC would give different weekdays depending on the host's timezone.
    expect(weekdayOf('2026-01-01')).toBe('thursday');
  });
});

describe('resolveDay', () => {
  it('resolves a plain Sunday with no occurring feast', () => {
    const day = resolveDay('2026-08-09');
    expect(day.date).toBe('2026-08-09');
    expect(day.weekday).toBe('sunday');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-11' });
    expect(day.commemorations).toEqual([]);
  });
});
