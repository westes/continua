import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('September sanctoral pull (first pass)', () => {
  it('St. Giles wins outright at Simplex over a genuinely unwinnable stub', () => {
    const day = resolveDay('2025-09-01');
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'st-giles', name: 'St. Giles, Abbot', rank: 'simplex' });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'ss-twelve-brothers', name: 'Ss. Twelve Brothers, Martyrs', rank: 'simplex' },
    ]);
  });

  it('the Nativity of the BVM wins outright with a real proper collect and antiphon, commemorating a real secondary saint blocked by its own day (not its octave)', () => {
    const day = resolveDay('2025-09-08');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'nativity-bvm',
      name: 'The Nativity of the Blessed Virgin Mary',
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-hadrian', name: 'St. Hadrian, Martyr', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it("dates within the Nativity's own octave still exclude the real secondary saints the source names (Ss. Gorgonius, Nicomedes) -- neither is modeled yet -- but the octave itself (now modeled, see calendar/octaves.ts) correctly commemorates through it", () => {
    const gorgoniusDay = resolveDay('2025-09-09');
    expect(gorgoniusDay.winner.kind).toBe('temporal');
    expect(gorgoniusDay.commemorations).toEqual([
      { kind: 'octave', id: 'nativity-bvm', name: 'The Nativity of the Blessed Virgin Mary' },
    ]);
    // Sep 15 is also day 8 of the Nativity's own octave (started Sep 8).
    const nicomedesDay = resolveDay('2025-09-15');
    expect(nicomedesDay.winner.kind).toBe('temporal');
    expect(nicomedesDay.commemorations).toEqual([
      { kind: 'octave', id: 'nativity-bvm', name: 'The Nativity of the Blessed Virgin Mary' },
    ]);
  });

  it('a monastic-calendar-specific reassignment replaces what the base Tridentine table treats as a plain Nativity-octave continuation', () => {
    const day = resolveDay('2025-09-10');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-nicholas-of-tolentino',
      name: 'St. Nicholas of Tolentino, Confessor',
      rank: 'semiduplex',
    });
  });

  it('St. Matthew wins outright at Duplex II. classis with a real proper collect, distinct from his own Vigil the day before', () => {
    const vigil = resolveDay('2029-09-20');
    const day = resolveDay('2029-09-21');
    expect(vigil.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-matthew',
      name: 'Vigil of St. Matthew',
      rank: 'vigil',
    });
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-matthew',
      name: 'St. Matthew, Apostle and Evangelist',
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
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
