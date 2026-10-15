import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('July sanctoral pull (first pass)', () => {
  it('St. James the Greater wins outright at Duplex II. classis with a real proper collect, beating a genuinely unwinnable stub', () => {
    const day = resolveDay('2028-07-25');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-james-the-greater',
      name: 'St. James the Greater, Apostle',
      nameLa: 'Sanctus Jacobus Major, Apostolus',
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-christopher', name: 'St. Christopher, Martyr', nameLa: 'Sanctus Christophorus, Martyr', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('the Vigil of St. James wins its own day, commemorating the Simplex saint who shares it', () => {
    const day = resolveDay('2028-07-24');
    expect(day.winner.kind).toBe('sanctoral');
    expect(day.winner).toMatchObject({ id: 'vigil-of-st-james', rank: 'vigil' });
    expect(day.commemorations.map((c) => (c.kind === 'sanctoral' ? c.id : null))).toEqual(['st-christina']);
  });

  it('Ss. Symphorosa and Her Seven Sons win their own day outright, alone since Camillus de Lellis left the calendar', () => {
    const day = resolveDay('2028-07-18'); // a Tuesday, no Sunday collision
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-symphorosa-and-seven-sons',
      name: 'Ss. Symphorosa and Her Seven Sons, Martyrs',
      nameLa: 'Sancta Symphorosa et Septem Filii Ejus, Martyres',
      rank: 'simplex',
    });
    expect(day.commemorations).toEqual([]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('pure octave-continuation days with no named saint at all are excluded entirely', () => {
    // 07-01 through 07-08 mostly turned out to have real independent
    // content after all (see vu-sanctoral-sweep-progress memory) --
    // Most Precious Blood, the Visitation, St. Leo II, St. Anthony Mary
    // Zaccaria, the Octave Day of Ss. Peter and Paul itself, Ss. Cyril
    // and Methodius, and St. Elizabeth of Portugal are all now mapped.
    // 07-04 and 07-09, within those same two octaves, genuinely have no
    // independent content in the reference engine and remain excluded.
    const day = resolveDay('2028-07-04');
    expect(day.winner.kind).toBe('temporal');
    expect(day.commemorations).toEqual([]);
  });
});
