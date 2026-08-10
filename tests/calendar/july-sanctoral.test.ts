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
      rank: 'duplex-2-classis',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-christopher', name: 'St. Christopher, Martyr', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('an earlier live-query pass mis-recorded St. Apollinaris under the wrong date (a transfer artifact) — his real date is the 23rd', () => {
    const day = resolveDay('2026-07-23'); // a clean year, no Sunday collision
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-apollinaris',
      name: 'St. Apollinaris, Bishop and Martyr',
      rank: 'semiduplex',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-liborius', name: 'St. Liborius, Bishop and Confessor', rank: 'simplex' },
    ]);
  });

  it('the Vigil of St. James resolves alongside its own commemorated saint, distinct from St. James Day itself', () => {
    const day = resolveDay('2028-07-24');
    expect(day.winner.kind).toBe('sanctoral');
    // 2028's Jul 23 is a Sunday, so St. Apollinaris transfers forward into
    // this day and wins the collision against the Vigil/St. Christina —
    // real transfer+collision interaction, not a data error.
    expect(day.commemorations.map((c) => (c.kind === 'sanctoral' ? c.id : null)).sort()).toEqual([
      'st-christina',
      'vigil-of-st-james',
    ]);
  });

  it('pure octave-continuation days with no named saint at all are excluded entirely', () => {
    // 07-01 through 07-06 are St. John the Baptist's and Ss. Peter and
    // Paul's octave continuations — no independent saint, so nothing in
    // sanctoral-calendar.yml maps to them.
    const day = resolveDay('2028-07-03');
    expect(day.winner.kind).toBe('temporal');
    expect(day.commemorations).toEqual([]);
  });
});
