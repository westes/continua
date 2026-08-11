import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('December sanctoral pull (first pass, 12/12)', () => {
  it('a Simplex saint on an ordinary Advent feria is only ever commemorated, the feria itself staying primary', () => {
    const day = resolveDay('2025-12-02');
    expect(day.winner.kind).toBe('temporal');
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-bibiana', name: 'St. Bibiana, Virgin and Martyr', rank: 'simplex' },
    ]);
    // The feria wins, so the day's collect is the governing Sunday's own
    // (already authored), not St. Bibiana's (which has none) -- the
    // commemoration is real but doesn't change which collect is prayed.
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('a Semiduplex saint wins outright over an ordinary Advent feria, which is commemorated in return, with a real proper collect', () => {
    const day = resolveDay('2025-12-06');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-nicholas',
      name: 'St. Nicholas, Bishop and Confessor',
      rank: 'semiduplex',
    });
    expect(day.commemorations.length).toBe(1);
    expect(day.commemorations[0]?.kind).toBe('temporal');
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('the Immaculate Conception wins outright with a real proper collect and antiphon, backfilled this month', () => {
    const day = resolveDay('2025-12-08');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'immaculate-conception',
      name: 'The Immaculate Conception of the Blessed Virgin Mary',
      rank: 'duplex-1-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Thomas the Apostle wins outright with a real proper collect and antiphon, distinct from his own Vigil on Advent Ember Saturday', () => {
    const day = resolveDay('2026-12-21');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-thomas-apostle',
      name: 'St. Thomas, Apostle',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('the Christmas Octave "Comites Christi" days each win outright with real propers, the Octave day commemorated in return', () => {
    const stephen = resolveDay('2025-12-26');
    const john = resolveDay('2025-12-27');
    const innocents = resolveDay('2026-12-28');
    expect(stephen.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-stephen-protomartyr',
      name: 'St. Stephen, Protomartyr',
      rank: 'duplex-2-classis',
    });
    expect(john.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-john-apostle',
      name: 'St. John, Apostle and Evangelist',
      rank: 'duplex-2-classis',
    });
    expect(innocents.winner).toEqual({
      kind: 'sanctoral',
      id: 'holy-innocents',
      name: 'The Holy Innocents, Martyrs',
      rank: 'duplex-2-classis',
    });
    for (const day of [stephen, john, innocents]) {
      expect(day.commemorations.length).toBe(1);
      expect(day.commemorations[0]?.kind).toBe('temporal');
      expect(getDayCollect(day).status.en).toBe('verified');
    }
  });

  it('St. Thomas of Canterbury, only Semiduplex, still wins outright within the Christmas Octave -- the concrete case behind this month\'s temporal-category fix', () => {
    const day = resolveDay('2025-12-29');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-thomas-becket',
      name: 'St. Thomas of Canterbury, Bishop and Martyr',
      rank: 'semiduplex',
    });
    expect(day.commemorations.length).toBe(1);
    expect(day.commemorations[0]?.kind).toBe('temporal');
  });
});
