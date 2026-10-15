import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision, and clear of
// the movable Corpus Christi Octave / generic Saturday-of-Mary votive that
// usually overshadow a couple of them) — see data/calendar/saints/*.yml
// for per-saint source detail.
describe('June sanctoral pull (first pass)', () => {
  it('Ss. Peter and Paul win outright at Duplex I. classis with a real proper collect and antiphon', () => {
    const day = resolveDay('2035-06-29');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-peter-and-paul',
      name: 'Ss. Peter and Paul, Apostles',
      nameLa: 'Sancti Petrus et Paulus, Apostoli',
      rank: 'duplex-1-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('a saint normally blocked by the generic Saturday-of-Mary votive wins independently once the date falls on another weekday', () => {
    const day = resolveDay('2028-06-12'); // a Monday
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-leo-iii',
      name: 'St. Leo III, Pope and Confessor',
      nameLa: 'Sanctus Leo III, Papa et Confessor',
      rank: 'simplex',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('three distinct Pauline feasts this pull has found all resolve as separate records', () => {
    const conversion = resolveDay('2026-01-25');
    const peterAndPaul = resolveDay('2035-06-29');
    const commemoration = resolveDay('2035-06-30');
    const ids = [conversion, peterAndPaul, commemoration].map((d) =>
      d.winner.kind === 'sanctoral' ? d.winner.id : null,
    );
    expect(ids).toEqual(['conversion-of-st-paul', 'ss-peter-and-paul', 'commemoration-of-st-paul']);
  });

  it('St. Irenaeus (a genuinely open calendar gap -- nothing previously won June 28) wins outright at Duplex with a real proper collect, no active octave nearby to contest him', () => {
    const day = resolveDay('2035-06-28');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-irenaeus',
      name: 'St. Irenaeus, Bishop and Martyr',
      nameLa: 'Sanctus Irenæus, Episcopus et Martyr',
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('the Nativity of St. John the Baptist wins outright at Duplex I. classis, distinct from his Vigil the day before', () => {
    const vigil = resolveDay('2035-06-23');
    const nativity = resolveDay('2035-06-24');
    expect(vigil.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-john-the-baptist',
      name: 'Vigil of St. John the Baptist',
      nameLa: 'Vigilia Sancti Joannis Baptistæ',
      rank: 'vigil',
    });
    expect(nativity.winner).toEqual({
      kind: 'sanctoral',
      id: 'nativity-of-st-john-the-baptist',
      name: 'The Nativity of St. John the Baptist',
      nameLa: 'Nativitas Sancti Joannis Baptistæ',
      rank: 'duplex-1-classis',
    });
  });
});
