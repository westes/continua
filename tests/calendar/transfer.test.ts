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

  // Found via real data (the May sanctoral pull): a transferred-in
  // candidate was blindly winning outright whenever the receiving day's
  // own native winner was temporal, regardless of that day's own
  // precedence category — so a transferred-in Simplex was overwriting
  // Trinity Sunday itself instead of going through the same ordinary-
  // Sunday rule a native candidate would have.
  it('a simplex saint impeded by a privileged feria transfers forward and is merely commemorated, not made to win, on the ordinary Sunday it lands on', () => {
    // St. Felix I (May 30, Simplex) is impeded by that date's own
    // Pentecost Ember Saturday (privileged-feria-major) and transfers
    // forward into Trinity Sunday 2026 (May 31, an ordinary Sunday).
    const saturday = resolveDay('2026-05-30');
    const sunday = resolveDay('2026-05-31');

    expect(saturday.winner).toEqual({ kind: 'temporal', id: 'pentecost-sunday' });
    expect(saturday.commemorations).toEqual([]);

    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-01' });
    expect(sunday.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-felix-i', name: 'St. Felix I, Pope and Martyr', rank: 'simplex' },
    ]);
  });
});
