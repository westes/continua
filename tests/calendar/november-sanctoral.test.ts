import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('November sanctoral pull (first pass)', () => {
  it('All Saints wins outright with a real proper collect, backfilled this month', () => {
    const day = resolveDay('2025-11-01');
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'all-saints', name: 'All Saints', nameLa: 'Omnes Sancti', rank: 'duplex-1-classis' });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Martin of Tours wins outright at Duplex majus with a real proper collect and antiphon, alone', () => {
    const day = resolveDay('2025-11-11');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-martin-of-tours',
      name: 'St. Martin of Tours, Bishop and Confessor',
      nameLa: 'Sanctus Martinus Turonensis, Episcopus et Confessor',
      rank: 'duplex-majus',
    });
    expect(day.commemorations).toEqual([]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Martin I, Pope, holds the 14th (St. Emilian, who displaced him in the monastic table, has left the calendar)', () => {
    const martinIDay = resolveDay('2025-11-14');
    expect(martinIDay.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-martin-i',
      name: 'St. Martin I, Pope and Martyr',
      nameLa: 'Sanctus Martinus I, Papa et Martyr',
      rank: 'semiduplex',
    });
  });

  it('St. Clement transfers forward to the next day whenever his own date falls on a Sunday -- a single-day transfer this app models correctly, unlike August\'s multi-day-skip case', () => {
    // Per direct instruction: a Semiduplex feast (St. Clement) on an
    // ordinary Sunday transfers to the next open day rather than being
    // commemorated in place.
    const clean = resolveDay('2032-11-23'); // Nov 23, 2032 is not a Sunday
    expect(clean.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-clement',
      name: 'St. Clement I, Pope and Martyr',
      nameLa: 'Sanctus Clemens I, Papa et Martyr',
      rank: 'semiduplex',
    });
    const onceASunday = resolveDay('2025-11-23'); // a Sunday
    expect(onceASunday.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-24' });
    expect(onceASunday.commemorations).toEqual([]);
    // St. Clement transfers into the free Monday, Nov 24.
    const followingDay = resolveDay('2025-11-24');
    expect(followingDay.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-clement',
      name: 'St. Clement I, Pope and Martyr',
      nameLa: 'Sanctus Clemens I, Papa et Martyr',
      rank: 'semiduplex',
      transferredFrom: '2025-11-23',
    });
    expect(followingDay.commemorations).toEqual([]);
  });

  it('St. Andrew wins outright at Duplex II. classis with a real proper collect and antiphon, commemorating the Advent feria itself in years his fixed date falls within Advent', () => {
    // 2026-11-30 is also the Monday within Advent I's own week that year
    // (privileged-feria-advent, see calendar/types.ts) -- the Advent feria
    // is commemorated back, confirmed against the live reference engine.
    const day = resolveDay('2026-11-30');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-andrew',
      name: 'St. Andrew, Apostle',
      nameLa: 'Sanctus Andreas, Apostolus',
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([{ kind: 'temporal', id: 'advent-1' }]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
