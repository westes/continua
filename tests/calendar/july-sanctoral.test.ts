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

  it('an earlier live-query pass mis-recorded St. Apollinaris under the wrong date (a transfer artifact) — his real date is the 23rd', () => {
    const day = resolveDay('2026-07-23'); // a clean year, no Sunday collision
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-apollinaris',
      name: 'St. Apollinaris, Bishop and Martyr',
      nameLa: 'Sanctus Apollinaris, Episcopus et Martyr',
      rank: 'semiduplex',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-liborius', name: 'St. Liborius, Bishop and Confessor', nameLa: 'Sanctus Liborius, Episcopus et Confessor', rank: 'simplex' },
    ]);
  });

  it('the Vigil of St. James resolves alongside its own commemorated saint, distinct from St. James Day itself', () => {
    const day = resolveDay('2028-07-24');
    expect(day.winner.kind).toBe('sanctoral');
    // 2028's Jul 23 is a Sunday, so St. Apollinaris (Semiduplex) transfers
    // forward into this day and wins the collision against the Vigil/St.
    // Christina — per direct instruction, a Semiduplex feast on an
    // ordinary Sunday transfers rather than being commemorated in place.
    expect(day.commemorations.map((c) => (c.kind === 'sanctoral' ? c.id : null)).sort()).toEqual([
      'st-christina',
      'vigil-of-st-james',
    ]);
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
