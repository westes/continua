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
    // Not 2026-08-09 (also a Sunday): since the August sanctoral pull, that
    // date does carry a real commemoration (St. Romanus, impeded from
    // winning by the Vigil of St. Lawrence, itself impeded by the Sunday
    // and transferred away — see tests/calendar/transfer.test.ts, and
    // confirmed against the live reference engine, which shows the same
    // commemoration despite the vigil's own absence that day). Also not
    // 2026-10-04 (moved here from there): since the October pull, that
    // date is St. Francis's own day (Duplex), which wins outright even on
    // an ordinary Sunday.
    // Not 2026-11-15 either (moved here from there): since the November
    // pull, that date is St. Albert the Great's own day (Duplex), same
    // reason. 2026-09-06 (post-pentecost-15) is genuinely clean.
    const day = resolveDay('2026-09-06');
    expect(day.date).toBe('2026-09-06');
    expect(day.weekday).toBe('sunday');
    expect(day.winner.kind).toBe('temporal');
    expect(day.commemorations).toEqual([]);
  });
});
