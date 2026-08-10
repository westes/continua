import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';
import type { LiturgicalDay } from '../../src/calendar/types';

describe('getDayLabel — ordinal temporal label', () => {
  it("labels an anchor's own partial week as \"Weekday after {Anchor}\"", () => {
    // Trinity Sunday 2026 is May 31.
    expect(getDayLabel(resolveDay('2026-06-01'))).toBe('Monday after Trinity Sunday');
    expect(getDayLabel(resolveDay('2026-01-07'))).toBe('Wednesday after Epiphany'); // Epiphany 2026 is a Tuesday
  });

  it('names the anchor day itself, not "day after itself"', () => {
    expect(getDayLabel(resolveDay('2026-05-31'))).toBe('Trinity Sunday');
    expect(getDayLabel(resolveDay('2026-04-05'))).toBe('Easter');
    expect(getDayLabel(resolveDay('2026-02-18'))).toBe('Ash Wednesday');
  });

  it('gives the correct week-after-Trinity ordinal', () => {
    // Trinity Sunday 2026 is May 31; Jul 6 falls 5 full weeks after the
    // first Sunday-after-Trinity (Jun 7).
    expect(getDayLabel(resolveDay('2026-07-06'))).toBe('Monday in the 5th week after Trinity');
  });

  it("Advent's own anchor Sunday is already week 1, not a separate anchor-week case", () => {
    expect(getDayLabel(resolveDay('2025-11-30'))).toBe('The 1st Sunday of Advent');
    expect(getDayLabel(resolveDay('2025-12-01'))).toBe('Monday in the 1st week of Advent');
  });

  it('falls back to weekday + season name for seasons with no ordinal convention modeled', () => {
    expect(getDayLabel(resolveDay('2026-05-15'))).toContain('in Ascensiontide');
  });
});

describe('getDayLabel — feast name combination', () => {
  const base: LiturgicalDay = {
    date: '2026-06-15',
    weekday: 'monday',
    season: 'trinitytide',
    temporalCategory: 'ordinary-feria',
    occurring: [],
  };

  it('shows just the feast name when it wins outright', () => {
    const day: LiturgicalDay = {
      ...base,
      occurring: [{ id: 'x', name: 'St. Ereden', rank: 'duplex', commemorated: false }],
    };
    expect(getDayLabel(day)).toBe('St. Ereden');
  });

  it('shows both, feast first, when the feast is merely commemorated', () => {
    const day: LiturgicalDay = {
      ...base,
      occurring: [{ id: 'x', name: 'St. Ereden', rank: 'duplex-2-classis', commemorated: true }],
    };
    expect(getDayLabel(day)).toBe('St. Ereden — Monday in the 2nd week after Trinity');
  });

  it('shows just the temporal label when nothing is occurring at all', () => {
    expect(getDayLabel(base)).toBe('Monday in the 2nd week after Trinity');
  });
});
