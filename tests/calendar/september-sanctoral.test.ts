import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail. Exception:
// the Sept 1 collision test deliberately uses 2025 *because* Aug 31
// falls on Sunday that year — see its own comment.
describe('September sanctoral pull (first pass)', () => {
  it('Sept 1 is a plain ferial day -- St. Giles and Ss. Twelve Brothers deliberately dropped from the calendar (user decision, 2026-09-01), files kept on disk for possible restoration', () => {
    const day = resolveDay('2026-09-01');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-14' });
    expect(day.commemorations).toEqual([]);
  });

  it('in a year where Aug 31 falls on Sunday, St. Raymond Nonnatus (semiduplex) loses outright to the Sunday and transfers forward onto Sept 1, winning there uncontested now that the native Sept 1 saints are dropped from the calendar', () => {
    const day = resolveDay('2025-09-01');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-raymond-nonnatus',
      name: 'St. Raymond Nonnatus, Confessor',
      nameLa: 'Sanctus Raymundus Nonnatus, Confessor',
      rank: 'semiduplex',
      transferredFrom: '2025-08-31',
    });
    expect(day.commemorations).toEqual([]);
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

  it("St. Gorgonius (real Simplex source rank, an ancient martyr so no rank deflation applies) is now a real sanctoral entry on Sept 9, but the Nativity octave's own `wins: duplex` threshold (well above his Simplex) still outranks him outright -- demoted to a commemoration alongside the octave itself, day reverting to its own temporal identity, same fate as St. Nicholas of Tolentino's own Sept 10 entry below", () => {
    const gorgoniusDay = resolveDay('2025-09-09');
    expect(gorgoniusDay.winner.kind).toBe('temporal');
    expect(gorgoniusDay.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-gorgonius', name: 'St. Gorgonius, Martyr', nameLa: 'Sanctus Gorgonius, Martyr', rank: 'simplex' },
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
      { kind: 'sanctoral', id: 'st-nicholas-of-tolentino', name: 'St. Nicholas of Tolentino, Priest', nameLa: 'Sanctus Nicolaus Tolentinas, Presbyter', rank: 'semiduplex' },
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
      name: 'St. Jerome, Priest and Doctor of the Church',
      nameLa: 'Sanctus Hieronymus, Presbyter et Ecclesiæ Doctor',
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
