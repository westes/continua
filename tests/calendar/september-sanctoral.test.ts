import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('September sanctoral pull (first pass)', () => {
  it('St. Giles wins outright at Simplex over a genuinely unwinnable stub', () => {
    const day = resolveDay('2025-09-01');
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'st-giles', name: 'St. Giles, Abbot', nameLa: 'Sanctus Ægidius, Abbas', rank: 'simplex' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'ss-twelve-brothers', name: 'Ss. Twelve Brothers, Martyrs', nameLa: 'Duodecim Fratres, Martyres', rank: 'simplex' },
    ]);
  });

  it('the Nativity of the BVM wins outright with a real proper collect and antiphon, commemorating a real secondary saint blocked by its own day (not its octave)', () => {
    const day = resolveDay('2025-09-08');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'nativity-bvm',
      name: 'The Nativity of the Blessed Virgin Mary',
      nameLa: 'Nativitas Beatæ Mariæ Virginis',
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-hadrian', name: 'St. Hadrian, Martyr', nameLa: 'Sanctus Hadrianus, Martyr', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it("a date within the Nativity's own octave still excludes the real secondary saint the source names (Ss. Gorgonius) -- not modeled yet -- but the octave itself (now modeled, see calendar/octaves.ts) correctly commemorates through it", () => {
    const gorgoniusDay = resolveDay('2025-09-09');
    expect(gorgoniusDay.winner.kind).toBe('temporal');
    expect(gorgoniusDay.commemorations).toEqual([
      { kind: 'octave', id: 'nativity-bvm', name: 'The Nativity of the Blessed Virgin Mary', nameLa: 'Nativitas Beatæ Mariæ Virginis' },
    ]);
  });

  it('Sep 15 (day 8 of the Nativity octave) is now the Seven Sorrows of the BVM\'s own fixed day (Duplex II Classis, added per the full-year sanctoral import), which wins outright, with the Nativity octave still commemorated alongside her -- St. Nicomedes, the source\'s other named secondary for this date, still is not modeled', () => {
    const nicomedesDay = resolveDay('2025-09-15');
    expect(nicomedesDay.winner).toEqual({
      kind: 'sanctoral',
      id: 'seven-sorrows-of-the-bvm',
      name: 'The Seven Sorrows of the Blessed Virgin Mary',
      nameLa: 'Septem Dolores Beatæ Mariæ Virginis',
      rank: 'duplex-2-classis',
    });
    expect(nicomedesDay.commemorations).toEqual([
      { kind: 'octave', id: 'nativity-bvm', name: 'The Nativity of the Blessed Virgin Mary', nameLa: 'Nativitas Beatæ Mariæ Virginis' },
    ]);
  });

  it('a monastic-calendar-specific reassignment places St. Nicholas of Tolentino here, but the Nativity octave (strengthened to `wins: duplex`, 2026-08 user decision) now outranks his Semiduplex outright, commemorating him instead of losing the day to him', () => {
    const day = resolveDay('2025-09-10');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-13' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-nicholas-of-tolentino', name: 'St. Nicholas of Tolentino, Confessor', nameLa: 'Sanctus Nicolaus Tolentinas, Confessor', rank: 'semiduplex' },
      { kind: 'octave', id: 'nativity-bvm', name: 'The Nativity of the Blessed Virgin Mary', nameLa: 'Nativitas Beatæ Mariæ Virginis' },
    ]);
  });

  it('St. Matthew wins outright at Duplex II. classis with a real proper collect, distinct from his own Vigil the day before', () => {
    const vigil = resolveDay('2029-09-20');
    const day = resolveDay('2029-09-21');
    expect(vigil.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-matthew',
      name: 'Vigil of St. Matthew',
      nameLa: 'Vigilia Sancti Matthæi',
      rank: 'vigil',
    });
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-matthew',
      name: 'St. Matthew, Apostle and Evangelist',
      nameLa: 'Sanctus Matthæus, Apostolus et Evangelista',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Jerome wins outright at Duplex with a real proper collect, alone', () => {
    const day = resolveDay('2025-09-30');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-jerome',
      name: 'St. Jerome, Priest, Confessor and Doctor of the Church',
      nameLa: 'Sanctus Hieronymus, Presbyter, Confessor et Ecclesiæ Doctor',
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
