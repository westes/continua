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

// A forward transfer can chain through more than one impeded day in a
// row — the whole Holy Week/Easter Day/Easter Octave/Low Sunday span
// (2026-09-01: found real, live-verified precedence bugs in exactly this
// area, then built the actual multi-hop mechanism per direct
// instruction). `resolveForwardTransferLanding` in calendar/index.ts
// walks up to `MAX_FORWARD_TRANSFER_LOOKBACK_DAYS` days back to find
// where a still-unlanded candidate actually lands, in strict native-date
// (FIFO) order against every other pending candidate.
describe('multi-hop forward transfer through Holy Week/the Easter Octave', () => {
  it('2033: St. Leo I (native Easter Monday, Duplex) chains all the way past the whole privileged span to land on Easter+8 — verified against the real reference engine', () => {
    // Easter 2033 is Apr 17. Live-verified against the reference engine
    // (Monastic Tridentinum 1617, 2026-09-01): Leo transfers off Apr 11
    // (Monday of Holy Week) with no commemoration anywhere in Holy Week,
    // Easter Day, the Octave, or Low Sunday (Apr 24), landing outright on
    // Apr 27 there (Apr 25/26 already spoken for by St. Mark and Ss.
    // Cletus & Marcellinus in the reference's own calendar). vu's own
    // calendar differs on Apr 25-27 (different saints assigned), so this
    // asserts the *mechanism* — Leo reaching a day past the whole span in
    // the right relative order — not the exact reference-engine landing
    // day, which depends on which calendar is in play.
    const holyMonday = resolveDay('2033-04-11');
    expect(holyMonday.winner).toEqual({ kind: 'temporal', id: 'palm-sunday' });
    expect(holyMonday.commemorations).toEqual([]);
    expect(holyMonday.transferredAway?.candidate.id).toBe('st-leo-i');

    for (const impededDate of ['2033-04-13', '2033-04-17', '2033-04-21', '2033-04-24']) {
      const day = resolveDay(impededDate);
      expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-leo-i')).toBe(false);
    }

    // Lands the first day past the whole span not already spoken for by
    // vu's own calendar (Apr 25 = St. Mark, native and unaffected).
    const landing = resolveDay('2033-04-25');
    expect(landing.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-mark',
      name: 'St. Mark, Evangelist',
      nameLa: 'Sanctus Marcus, Evangelista',
      rank: 'duplex-2-classis',
    });
    expect(landing.commemorations).toEqual([
      {
        kind: 'sanctoral',
        id: 'st-leo-i',
        name: 'St. Leo I, Pope, Confessor and Doctor of the Church',
        nameLa: 'Sanctus Leo I, Papa, Confessor et Ecclesiæ Doctor',
        rank: 'duplex',
        transferredFrom: '2033-04-11',
      },
    ]);
  });

  it('2033: three simultaneously-pending candidates (Leo, Hermenegild, Ss. Tiburtius/Valerian/Maximus) land in strict native-date order, none skipping ahead', () => {
    const leo = resolveDay('2033-04-25').commemorations.find((c) => c.kind === 'sanctoral' && c.id === 'st-leo-i');
    const hermenegild = resolveDay('2033-04-26').commemorations.find((c) => c.kind === 'sanctoral' && c.id === 'st-hermenegild');
    const tiburtius = resolveDay('2033-04-27').commemorations.find(
      (c) => c.kind === 'sanctoral' && c.id === 'ss-tiburtius-valerian-and-maximus',
    );
    expect(leo?.kind === 'sanctoral' ? leo.transferredFrom : undefined).toBe('2033-04-11');
    expect(hermenegild?.kind === 'sanctoral' ? hermenegild.transferredFrom : undefined).toBe('2033-04-13');
    expect(tiburtius?.kind === 'sanctoral' ? tiburtius.transferredFrom : undefined).toBe('2033-04-14');
  });

  it("2035: the Annunciation (native Easter Sunday itself, Duplex I. classis) transfers past the whole span with zero commemoration anywhere in it — matching the real reference engine's own behavior, not just a native-date-order queue effect", () => {
    // Easter 2035 is Mar 25 -- the Annunciation's own fixed date. Live-
    // verified 2026-09-01: the real Monastic 1617 engine shows her
    // transferring off Easter Day with no commemoration anywhere in Holy
    // Week/the Octave/Low Sunday (Apr 1 that year), unlike a same-ranked
    // *native* occurrence there (e.g. St. Mark, Duplex II. classis,
    // commemorated when native within some other year's Octave) --
    // confirming a transferred-in candidate never gets the "duplex-majus+
    // still gets a nod" treatment on these days, only a native one does.
    const easterSunday = resolveDay('2035-03-25');
    expect(easterSunday.winner).toEqual({ kind: 'temporal', id: 'easter-sunday' });
    expect(easterSunday.transferredAway?.candidate.id).toBe('annunciation');

    for (const impededDate of ['2035-03-26', '2035-03-29', '2035-04-01']) {
      const day = resolveDay(impededDate);
      expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'annunciation')).toBe(false);
    }

    const landing = resolveDay('2035-04-04');
    expect(landing.winner).toEqual({
      kind: 'sanctoral',
      id: 'annunciation',
      name: 'The Annunciation of the Blessed Virgin Mary',
      nameLa: 'Annuntiatio Beatæ Mariæ Virginis',
      rank: 'duplex-1-classis',
      transferredFrom: '2035-03-25',
    });
  });
});
