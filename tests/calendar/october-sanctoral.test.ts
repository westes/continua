import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('October sanctoral pull (first pass)', () => {
  it('a monastic-calendar-specific addition (Ss. Placid and Companions, St. Benedict\'s own disciple) wins outright, deliberately lowered to Simplex', () => {
    const day = resolveDay('2026-10-05');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-placid-and-companions',
      name: 'Ss. Placid and Companions, Martyrs',
      nameLa: 'Sanctus Placidus et Socii, Martyres',
      rank: 'simplex',
    });
    expect(day.commemorations).toEqual([]);
  });

  it('Our Lady of the Rosary wins Oct 7 at Duplex II. classis, with St. Marcus commemorated (St. Justina is deliberately off-calendar)', () => {
    const day = resolveDay('2025-10-07');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'our-lady-of-the-rosary',
      name: 'Our Lady of the Rosary',
      nameLa: 'Beata Maria Virgo a Rosario',
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-marcus', name: 'St. Marcus, Pope and Confessor', nameLa: 'Sanctus Marcus, Papa et Confessor', rank: 'simplex' },
    ]);
  });

  it('St. Gall, a monastic-calendar-specific addition, wins outright at Duplex, alone', () => {
    const day = resolveDay('2025-10-16');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-gall',
      name: 'St. Gall, Abbot',
      nameLa: 'Sanctus Gallus, Abbas',
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([]);
  });

  it('St. Luke wins outright at Duplex II. classis with a real proper collect, alone', () => {
    const day = resolveDay('2025-10-18');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-luke',
      name: 'St. Luke, Evangelist',
      nameLa: 'Sanctus Lucas, Evangelista',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('Ss. Simon and Jude win outright at Duplex II. classis with a real proper collect, distinct from their own Vigil the day before', () => {
    const vigil = resolveDay('2025-10-27');
    const day = resolveDay('2025-10-28');
    expect(vigil.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-ss-simon-and-jude',
      name: 'Vigil of Ss. Simon and Jude',
      nameLa: 'Vigilia Sanctorum Simonis et Judæ',
      rank: 'vigil',
    });
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-simon-and-jude',
      name: 'Ss. Simon and Jude, Apostles',
      nameLa: 'Sancti Simon et Judas, Apostoli',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('the Vigil of All Saints resolves distinctly from All Saints itself the next day', () => {
    const vigil = resolveDay('2025-10-31');
    const day = resolveDay('2025-11-01');
    expect(vigil.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-all-saints',
      name: 'Vigil of All Saints',
      nameLa: 'Vigilia Omnium Sanctorum',
      rank: 'vigil',
    });
    expect(getDayCollect(vigil).status.en).toBe('verified');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'all-saints',
      name: 'All Saints',
      nameLa: 'Omnes Sancti',
      rank: 'duplex-1-classis',
    });
  });
});
