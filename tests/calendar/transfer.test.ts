import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';

describe('transfer mechanism (resolveDay integration)', () => {
  // The Vigil of St. Lawrence (Aug 9) is a real content entry specifically
  // added to exercise this — Aug 9, 2026 is a Sunday, so the vigil (rank
  // 'vigil') can't win or be commemorated there (see
  // commemorations.ts's ordinary-sunday rule) and must transfer backward.
  it('a vigil impeded by an ordinary Sunday transfers backward to Saturday, leaving the Sunday untouched', () => {
    const saturday = resolveDay('2026-08-08');
    const sunday = resolveDay('2026-08-09');
    const monday = resolveDay('2026-08-10');

    expect(saturday.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-lawrence',
      name: 'Vigil of St. Lawrence',
      rank: 'vigil',
    });
    expect(saturday.commemorations).toEqual([]);

    // The Sunday's own resolution is exactly as if the vigil didn't exist.
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-11' });
    expect(sunday.commemorations).toEqual([]);

    // St. Lawrence's own day (Monday) is unaffected by the backward transfer.
    expect(monday.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-lawrence',
      name: 'St. Lawrence, Martyr',
      rank: 'duplex-2-classis',
    });
  });
});
