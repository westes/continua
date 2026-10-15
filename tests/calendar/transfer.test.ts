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
  it('a vigil impeded by an ordinary Sunday transfers backward to Saturday', () => {
    const saturday = resolveDay('2026-08-08');
    const sunday = resolveDay('2026-08-09');
    const monday = resolveDay('2026-08-10');

    // Ss. Cyriacus, Largus and Smaragdus (the real feast that used to be
    // here for the vigil to collide with) left the calendar in the 2026-10
    // thinning pass, so the vigil lands on a free Saturday.
    expect(saturday.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-lawrence',
      name: 'Vigil of St. Lawrence',
      nameLa: 'Vigilia Sancti Laurentii',
      rank: 'vigil',
      transferredFrom: '2026-08-09',
    });
    expect(saturday.commemorations).toEqual([]);

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
      name: 'St. Lawrence, Deacon and Martyr',
      nameLa: 'Sanctus Laurentius, Diaconus et Martyr',
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
  // Winner id updated 2026-09-19: Pentecost's own Ember Saturday
  // (calendar/ember-days.ts) now carries its own real content instead of
  // inheriting the plain 'pentecost-sunday' id — the outcome (Felix
  // caught below the octave's Duplex threshold, commemorated in place
  // alongside the Octave itself) is unchanged, only the winning id is.
  it("St. Felix I, below Pentecost's octave threshold, is commemorated in place on his own day rather than transferring anywhere", () => {
    const saturday = resolveDay('2026-05-30');
    const sunday = resolveDay('2026-05-31');

    expect(saturday.winner).toEqual({ kind: 'temporal', id: 'ember-pentecost-saturday' });
    expect(saturday.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-felix-i', name: 'St. Felix I, Pope and Martyr', nameLa: 'Sanctus Felix I, Papa et Martyr', rank: 'simplex' },
      { kind: 'octave', id: 'pentecost-sunday', name: 'Pentecost', nameLa: 'Dominica Pentecostes' },
    ]);

    // Felix doesn't reach Trinity Sunday at all now. Trinity Sunday 2026
    // (May 31) is also the Queenship of the Blessed Virgin Mary's own
    // fixed day (Duplex II Classis). Trinity Sunday used to be modeled as
    // plain `ordinary-sunday` (no special first-class standing of its
    // own), so the Duplex+ Queenship won outright there -- fixed
    // 2026-09-04 with a real `trinity-sunday` temporal-feast record,
    // `unconditional: true` (a principal Sunday shouldn't lose to a
    // same-rank fixed-date collision, same shape as christ-the-king.yml).
    // Trinity Sunday now wins outright; the Queenship, the day's own
    // plain temporal id, and Pentecost's octave are all commemorated in
    // return.
    expect(sunday.winner).toEqual({ kind: 'temporal', id: 'trinity-sunday' });
    expect(sunday.commemorations).toEqual([
      { kind: 'temporal', id: 'post-pentecost-01' },
      { kind: 'octave', id: 'pentecost-sunday', name: 'Pentecost', nameLa: 'Dominica Pentecostes' },
      { kind: 'sanctoral', id: 'queenship-of-the-bvm', name: 'The Queenship of the Blessed Virgin Mary', nameLa: 'Beata Maria Virgo Regina', rank: 'duplex-2-classis' },
    ]);
  });
});

// Anything impeded anywhere from Palm Sunday through Low Sunday
// (2026-09-01: found real, live-verified precedence bugs in exactly this
// area) doesn't cascade day-by-day looking for the next free day — per
// direct instruction, that's not this app's mechanism (it already has
// real precedent for stacking commemorations, and rejected both a
// same-day batch and an open-ended search). Instead: only candidates at
// or above `EASTER_OCTAVE_BACKLOG_FLOOR` (duplex-majus) are worth
// carrying forward at all — anything weaker simply lapses for the year,
// no trace, same as it already gets none within the span itself. Of
// those that clear the floor, the Nth day after Low Sunday celebrates
// the Nth one (native-date order), winning outright — no rank fight —
// and demoting whatever would have natively been there to a
// commemoration. See calendar/index.ts's `applyEasterOctaveBacklog`.
describe('the Easter-octave backlog (Palm Sunday through Low Sunday)', () => {
  it('2033: nothing impeded that year clears the duplex-majus floor, so the backlog is empty and every impeded candidate simply lapses', () => {
    // Easter 2033 is Apr 17, Low Sunday Apr 24. Every candidate vu's own
    // calendar puts inside that span this year (St. Leo I, Duplex;
    // St. Hermenegild, Semiduplex; Ss. Tiburtius/Valerian/Maximus,
    // Simplex; St. Anselm, Duplex; Ss. Soter & Caius, Semiduplex;
    // St. George, Semiduplex; St. Fidelis of Sigmaringen, Duplex) is
    // below duplex-majus.
    const holyMonday = resolveDay('2033-04-11');
    // Monday of Holy Week now has its own real winner id (see
    // calendar/movable-feasts.ts's Passiontide-day override, 2026-09-06)
    // rather than inheriting Palm Sunday's own coarse id — the override
    // mechanism pushes a `{kind:'temporal', id:'palm-sunday'}`
    // commemoration for the coarse id it replaces, same shape every other
    // movable feast (Ascension, Corpus Christi) already does; harmless,
    // since day-label.ts's collectCommemorations deliberately drops any
    // commemoration whose id equals the plain governing weekday.
    expect(holyMonday.winner).toEqual({ kind: 'temporal', id: 'monday-holy-week' });
    expect(holyMonday.commemorations).toEqual([{ kind: 'temporal', id: 'palm-sunday' }]);
    expect(holyMonday.transferredAway?.candidate.id).toBe('st-leo-i');
    // Below the backlog floor, so he never actually lands anywhere --
    // `landed` should say so rather than implying an unnamed elsewhere.
    expect(holyMonday.transferredAway?.landed).toBe(false);

    for (const afterLowSunday of ['2033-04-25', '2033-04-26', '2033-04-27', '2033-04-28', '2033-04-29']) {
      const day = resolveDay(afterLowSunday);
      const ids = ['st-leo-i', 'st-hermenegild', 'ss-tiburtius-valerian-and-maximus', 'st-anselm', 'ss-soter-and-caius', 'st-george', 'st-fidelis-of-sigmaringen'];
      expect(day.commemorations.some((c) => c.kind === 'sanctoral' && ids.includes(c.id))).toBe(false);
      expect(day.winner.kind === 'sanctoral' ? ids.includes(day.winner.id) : false).toBe(false);
    }
  });

  it('2035: four candidates clear the floor (St. Joseph, St. Benedict, St. Gabriel the Archangel, the Annunciation) and land on the 1st/2nd/3rd/4th day after Low Sunday, in native-date order, each demoting that day\'s own native winner to a commemoration', () => {
    // Easter 2035 is Mar 25 (the Annunciation's own fixed date), Low
    // Sunday Apr 1. St. Benedict (native Mar 21, Duplex I. classis),
    // St. Gabriel the Archangel (native Mar 24, Duplex majus), and the
    // Annunciation (native Mar 25, Duplex I. classis) are all impeded
    // and all clear the floor — live-verified 2026-09-01 that the
    // Annunciation herself gets zero commemoration anywhere in the span.
    const easterSunday = resolveDay('2035-03-25');
    expect(easterSunday.winner).toEqual({ kind: 'temporal', id: 'easter-sunday' });
    expect(easterSunday.transferredAway?.candidate.id).toBe('annunciation');
    // Duplex I. classis clears the backlog floor and really does land
    // three days after Low Sunday (asserted below), so `landed` is true.
    expect(easterSunday.transferredAway?.landed).toBe(true);
    for (const impededDate of ['2035-03-21', '2035-03-24', '2035-03-26', '2035-03-29', '2035-04-01']) {
      const day = resolveDay(impededDate);
      expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'annunciation')).toBe(false);
    }

    const day1 = resolveDay('2035-04-02');
    expect(day1.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-joseph',
      name: 'St. Joseph, Spouse of the Blessed Virgin Mary, Confessor',
      nameLa: 'Sanctus Josephus, Sponsus Beatæ Mariæ Virginis, Confessor',
      rank: 'duplex-majus',
      transferredFrom: '2035-03-19',
    });

    const day2 = resolveDay('2035-04-03');
    expect(day2.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-benedict',
      name: 'St. Benedict, Abbot (Transitus)',
      nameLa: 'Sanctus Benedictus, Abbas (Transitus)',
      rank: 'duplex-1-classis',
      transferredFrom: '2035-03-21',
    });

    const day3 = resolveDay('2035-04-04');
    expect(day3.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-gabriel-archangel',
      name: 'St. Gabriel the Archangel',
      nameLa: 'Sanctus Gabriel Archangelus',
      rank: 'duplex-majus',
      transferredFrom: '2035-03-24',
    });
    expect(day3.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-isidore-of-seville')).toBe(true);

    const day4 = resolveDay('2035-04-05');
    expect(day4.winner).toEqual({
      kind: 'sanctoral',
      id: 'annunciation',
      name: 'The Annunciation of the Blessed Virgin Mary',
      nameLa: 'Annuntiatio Beatæ Mariæ Virginis',
      rank: 'duplex-1-classis',
      transferredFrom: '2035-03-25',
    });
    expect(day4.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-vincent-ferrer')).toBe(true);

    // The backlog is exhausted after 4 days -- the 5th day after Low
    // Sunday resolves with no override at all.
    const day5 = resolveDay('2035-04-06');
    expect(day5.winner.kind === 'sanctoral' ? day5.winner.transferredFrom : undefined).toBeUndefined();
  });
});
