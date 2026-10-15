import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision; for Mar 4/9
// specifically, clear of the movable Lenten ferias that usually overshadow
// them) — see data/calendar/saints/*.yml for per-saint source detail.
describe('March sanctoral pull (first pass)', () => {
  it('St. Joseph wins outright with a real proper collect and antiphon', () => {
    const day = resolveDay('2033-03-19');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-joseph',
      name: 'St. Joseph, Spouse of the Blessed Virgin Mary, Confessor',
      nameLa: 'Sanctus Josephus, Sponsus Beatæ Mariæ Virginis, Confessor',
      rank: 'duplex-majus',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('the Forty Holy Martyrs (one feast, several martyrs) resolve like any other saint', () => {
    const day = resolveDay('2033-03-10');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'forty-holy-martyrs',
      name: 'The Forty Holy Martyrs',
      nameLa: 'Quadraginta Sancti Martyres',
      rank: 'semiduplex',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it("St. Benedict wins outright at Duplex I. classis, with a proper collect (English self-translated, no source rendering exists)", () => {
    const day = resolveDay('2033-03-21');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-benedict',
      name: 'St. Benedict, Abbot (Transitus)',
      nameLa: 'Sanctus Benedictus, Abbas (Transitus)',
      rank: 'duplex-1-classis',
    });
    expect(getDayCollect(day).status.la).toBe('verified');
    expect(getDayCollect(day).status.en).toBe('draft');
  });
});
