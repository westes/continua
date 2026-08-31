import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';

describe('transfer mechanism (resolveDay integration)', () => {
  // The Vigil of St. Lawrence (Aug 9) is a real content entry specifically
  // added to exercise this — Aug 9, 2026 is a Sunday, so the vigil (rank
  // 'vigil') can't win or be commemorated there (see
  // commemorations.ts's ordinary-sunday rule) and must transfer backward.
  // Since the August pull, Aug 8 is no longer an empty landing day — Ss.
  // Cyriacus, Largus, and Smaragdus (Semiduplex, a fixed, non-movable
  // date) natively occupy it every year, so the backward-transferred
  // vigil runs into collision.ts's sanctoral-vs-sanctoral rules instead of
  // landing untouched: Semiduplex outranks 'vigil' on the shared
  // FeastClass scale, so Cyriacus wins and the vigil is commemorated
  // rather than displacing him — real transfer+collision interaction, not
  // a data error, same class of finding as July's Apollinaris/Vigil-of-
  // St.-James case.
  it('a vigil impeded by an ordinary Sunday transfers backward to Saturday and collides with the real feast already there', () => {
    const saturday = resolveDay('2026-08-08');
    const sunday = resolveDay('2026-08-09');
    const monday = resolveDay('2026-08-10');

    expect(saturday.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-cyriacus-largus-and-smaragdus',
      name: 'Ss. Cyriacus, Largus, and Smaragdus, Martyrs',
      nameLa: 'Sancti Cyriacus, Largus et Smaragdus, Martyres',
      rank: 'semiduplex',
    });
    expect(saturday.commemorations).toEqual([
      {
        kind: 'sanctoral',
        id: 'vigil-of-st-lawrence',
        name: 'Vigil of St. Lawrence',
        nameLa: 'Vigilia Sancti Laurentii',
        rank: 'vigil',
        transferredFrom: '2026-08-09',
      },
    ]);

    // The Sunday's own winner is unaffected by the vigil, but St. Romanus
    // (the vigil's own stub secondary, see st-romanus.yml) still surfaces
    // as a commemoration here: he lost his own local clash against the
    // vigil before the vigil transferred away, and that loss stands
    // independently of the transfer -- confirmed against the live
    // reference engine, which shows the same commemoration on this date.
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'post-pentecost-11' });
    expect(sunday.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-romanus', name: 'St. Romanus, Martyr', nameLa: 'Sanctus Romanus, Martyr', rank: 'simplex' },
    ]);

    // St. Lawrence's own day (Monday) is unaffected by the backward transfer.
    expect(monday.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-lawrence',
      name: 'St. Lawrence, Martyr',
      nameLa: 'Sanctus Laurentius, Martyr',
      rank: 'duplex-2-classis',
    });
  });

  // Originally found via real data (the May sanctoral pull): a
  // transferred-in candidate was blindly winning outright whenever the
  // receiving day's own native winner was temporal, regardless of that
  // day's own precedence category — so a transferred-in Simplex was
  // overwriting Trinity Sunday itself instead of going through the same
  // ordinary-Sunday rule a native candidate would have. That fix (in
  // applyIncomingTransfer) is unchanged and still covered here, but the
  // concrete St. Felix I / Trinity Sunday scenario that first surfaced it
  // no longer demonstrates a *transfer* at all: since the octave
  // mechanism (calendar/octaves.ts) was added, Pentecost's own Ember
  // Saturday is no longer classified `privileged-feria-major` (see
  // data/calendar/temporal-categories.yml), so Felix now wins his own day
  // outright under the permissive `ordinary-feria` default — then gets
  // caught and commemorated in place by Pentecost's octave itself
  // (threshold: duplex), never even reaching a transfer. He simply
  // doesn't appear on Trinity Sunday at all anymore. Kept here anyway as
  // a still-useful demonstration of the octave layer's own override path.
  it("St. Felix I, below Pentecost's octave threshold, is commemorated in place on his own day rather than transferring anywhere", () => {
    const saturday = resolveDay('2026-05-30');
    const sunday = resolveDay('2026-05-31');

    expect(saturday.winner).toEqual({ kind: 'temporal', id: 'pentecost-sunday' });
    expect(saturday.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-felix-i', name: 'St. Felix I, Pope and Martyr', nameLa: 'Sanctus Felix I, Papa et Martyr', rank: 'simplex' },
      { kind: 'octave', id: 'pentecost-sunday', name: 'Pentecost', nameLa: 'Dominica Pentecostes' },
    ]);

    // Felix doesn't reach Trinity Sunday at all now. Trinity Sunday 2026
    // (May 31) is also the Queenship of the Blessed Virgin Mary's own
    // fixed day (Duplex II Classis) -- since this app models Trinitytide
    // Sundays as plain `ordinary-sunday` (no special first-class standing
    // of their own, see temporal-categories.yml), a Duplex+ sanctoral
    // feast wins outright here per the normal ordinary-Sunday rule, with
    // both the day's own temporal id and Pentecost's octave commemorated
    // in return.
    expect(sunday.winner).toEqual({
      kind: 'sanctoral',
      id: 'queenship-of-the-bvm',
      name: 'The Queenship of the Blessed Virgin Mary',
      nameLa: 'Beata Maria Virgo Regina',
      rank: 'duplex-2-classis',
    });
    expect(sunday.commemorations).toEqual([
      { kind: 'temporal', id: 'post-pentecost-01' },
      { kind: 'octave', id: 'pentecost-sunday', name: 'Pentecost', nameLa: 'Dominica Pentecostes' },
    ]);
  });
});
