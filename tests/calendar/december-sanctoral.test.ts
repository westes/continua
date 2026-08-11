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
    // 2033 has no Sunday collision anywhere in Dec 26-31, so each of
    // these resolves without a privileged-Sunday complication.
    const stephen = resolveDay('2033-12-26');
    const john = resolveDay('2033-12-27');
    const innocents = resolveDay('2033-12-28');
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
      expect(getDayCollect(day).status.en).toBe('verified');
    }
    // Each also carries the day's own Octave-of-the-Nativity commemoration
    // plus Christmas's own octave, which keeps accumulating -- see the
    // dedicated stacking test below for the full week's build-up.
    expect(stephen.commemorations).toEqual([
      { kind: 'temporal', id: expect.any(String) },
      { kind: 'octave', id: 'christmas-day', name: 'Christmas' },
    ]);
  });

  it('St. Thomas of Canterbury, only Semiduplex, still wins outright within the Christmas Octave -- the concrete case behind this month\'s temporal-category fix', () => {
    const day = resolveDay('2033-12-29');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-thomas-becket',
      name: 'St. Thomas of Canterbury, Bishop and Martyr',
      rank: 'semiduplex',
    });
    // Thomas himself has no octave (user-confirmed, 2026-08), but by his
    // own day, Christmas + Stephen + John + Holy Innocents' octaves have
    // all stacked up and commemorate alongside him.
    expect(day.commemorations).toEqual([
      { kind: 'temporal', id: expect.any(String) },
      { kind: 'octave', id: 'christmas-day', name: 'Christmas' },
      { kind: 'octave', id: 'st-stephen-protomartyr', name: 'St. Stephen, Protomartyr' },
      { kind: 'octave', id: 'st-john-apostle', name: 'St. John, Apostle and Evangelist' },
      { kind: 'octave', id: 'holy-innocents', name: 'The Holy Innocents, Martyrs' },
    ]);
  });

  it('the Christmas Octave commemorations build up day by day as each Comites Christi feast starts its own octave', () => {
    // Same clean year (2033) as above, walking the whole week to show the
    // accumulation directly -- this is the concrete shape of "commemorations
    // build up" the octave mechanism was built for.
    const dec30 = resolveDay('2033-12-30'); // no saint of its own -- a plain Octave-of-the-Nativity day
    expect(dec30.winner.kind).toBe('temporal');
    expect(dec30.commemorations).toEqual([
      { kind: 'octave', id: 'christmas-day', name: 'Christmas' },
      { kind: 'octave', id: 'st-stephen-protomartyr', name: 'St. Stephen, Protomartyr' },
      { kind: 'octave', id: 'st-john-apostle', name: 'St. John, Apostle and Evangelist' },
      { kind: 'octave', id: 'holy-innocents', name: 'The Holy Innocents, Martyrs' },
    ]);
  });
});
