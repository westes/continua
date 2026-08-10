import { describe, expect, it } from 'vitest';
import { resolveEveningDay } from '../../src/calendar/vespers';

describe('resolveEveningDay', () => {
  it('anticipates tomorrow when tomorrow is a Sunday and today is a plain feria (Saturday before Advent I)', () => {
    // Nov 30, 2025 is Advent I Sunday.
    const day = resolveEveningDay('2025-11-29');
    expect(day.date).toBe('2025-11-30');
    expect(day.season).toBe('advent');
  });

  it('does not anticipate between two plain ferias', () => {
    const day = resolveEveningDay('2026-06-16'); // Tuesday, ordinary trinitytide
    expect(day.date).toBe('2026-06-16');
  });

  it('anticipates Easter from Holy Saturday', () => {
    // Easter 2026 is Apr 5, so Holy Saturday is Apr 4.
    const day = resolveEveningDay('2026-04-04');
    expect(day.date).toBe('2026-04-05');
    expect(day.season).toBe('eastertide');
  });

  it("a Sunday always keeps its own Second Vespers, even before a higher-ranked weekday feast", () => {
    // Aug 10, 2026 (Monday) is St. Lawrence, Duplex II classis — well above
    // the "has First Vespers" threshold — but Sunday never cedes.
    const day = resolveEveningDay('2026-08-09');
    expect(day.date).toBe('2026-08-09');
  });

  it('an ordinary feria before a real high-ranked feast anticipates it', () => {
    // Aug 14, 2026 (Friday) is a plain feria; Aug 15 is the Assumption,
    // Duplex I classis.
    const day = resolveEveningDay('2026-08-14');
    expect(day.date).toBe('2026-08-15');
    expect(day.winner.kind).toBe('sanctoral');
    if (day.winner.kind === 'sanctoral') {
      expect(day.winner.id).toBe('assumption');
      expect(day.winner.vespersFrom).toBe('firstVespersOfTomorrow');
    }
  });
});
