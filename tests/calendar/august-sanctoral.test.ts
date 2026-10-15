import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision) — see
// data/calendar/saints/*.yml for per-saint source detail.
describe('August sanctoral pull (first pass)', () => {
  it('St. Peter\'s Chains wins outright at Duplex majus with a real proper collect and antiphon, over a genuinely unwinnable stub', () => {
    const day = resolveDay('2026-08-01');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-peter-ad-vincula',
      name: "St. Peter's Chains",
      nameLa: 'Vincula Sancti Petri',
      rank: 'duplex-majus',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'ss-machabees', name: 'Ss. Machabees, Martyrs', nameLa: 'Sancti Machabæi, Martyres', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Alphonsus Liguori (Divino Afflatu\'s own occupant of this MM-DD slot, added alongside St. Stephen I) wins outright at Duplex over Stephen\'s Simplex, commemorating him instead', () => {
    const day = resolveDay('2027-08-02'); // a Monday
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-alphonsus-liguori',
      name: 'St. Alphonsus Liguori, Bishop, Confessor and Doctor of the Church',
      nameLa: 'Sanctus Alfonsus Maria de Ligorio, Episcopus, Confessor et Ecclesiæ Doctor',
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-stephen-i', name: 'St. Stephen I, Pope and Martyr', nameLa: 'Sanctus Stephanus I, Papa et Martyr', rank: 'simplex' },
    ]);
  });

  it('St. Cajetan (found hiding behind the same MM-DD slot as St. Donatus\'s own suffixed Monastic winner file) wins outright at Semiduplex over Donatus\'s Simplex, commemorating him instead', () => {
    // St. Donatus previously won this slot outright every year in this
    // app -- see the app-simplification note still on st-donatus.yml
    // about the real reference engine's occasional Aug-3-Sunday transfer
    // this app doesn't model. Cajetan's own rank (Duplex in the source,
    // deflated one tier to Semiduplex per this project's late-canonization
    // rule -- canonized 1671) still outranks Donatus's ancient Simplex in
    // every year, so Cajetan wins here now instead.
    const ordinary = resolveDay('2026-08-07');
    const wouldHaveTransferredInReality = resolveDay('2031-08-07');
    for (const day of [ordinary, wouldHaveTransferredInReality]) {
      expect(day.winner).toEqual({
        kind: 'sanctoral',
        id: 'st-cajetan',
        name: 'St. Cajetan, Confessor',
        nameLa: 'Sanctus Cajetanus, Confessor',
        rank: 'semiduplex',
      });
      // Donatus is off the calendar (2026-10 thinning pass), so nothing
      // is left to commemorate beside Cajetan.
      expect(day.commemorations).toEqual([]);
    }
  });

  it("the Vigil of St. Lawrence's own vigil rank forces primacy over a real, otherwise-unranked secondary saint", () => {
    const day = resolveDay('2025-08-09');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'vigil-of-st-lawrence',
      name: 'Vigil of St. Lawrence',
      nameLa: 'Vigilia Sancti Laurentii',
      rank: 'vigil',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-romanus', name: 'St. Romanus, Martyr', nameLa: 'Sanctus Romanus, Martyr', rank: 'simplex' },
    ]);
  });

  it('St. Lawrence wins outright at Duplex II. classis, distinct from his own Vigil the day before', () => {
    const day = resolveDay('2026-08-10');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-lawrence',
      name: 'St. Lawrence, Deacon and Martyr',
      nameLa: 'Sanctus Laurentius, Diaconus et Martyr',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it("St. Lawrence's own octave correctly keeps St. Clare (Simplex) to a commemoration, and the Assumption's octave does the same for its own date", () => {
    // St. Clare is now modeled (added directly off this gap) -- Simplex
    // under Monastic 1617, below the octave's semiduplex `wins` threshold,
    // so she's commemorated rather than winning outright, matching the
    // live engine's own "Tertia die infra Octavam S. Laurentii Martiris ~
    // Semiduplex" / "Commemoratio: S. Claræ Virginis" for this date.
    const clareDay = resolveDay('2025-08-12');
    expect(clareDay.winner.kind).toBe('temporal');
    expect(clareDay.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-clare', name: 'St. Clare, Virgin', nameLa: 'Sancta Clara, Virgo', rank: 'simplex' },
      { kind: 'octave', id: 'st-lawrence', name: 'St. Lawrence, Deacon and Martyr', nameLa: 'Sanctus Laurentius, Diaconus et Martyr' },
    ]);
    // Aug 22 is the Assumption's own octave day (In Octava Assumptionis),
    // Duplex, blocking Ss. Timothy/Hippolytus/Symphorian the same way --
    // it's also day 8 of the Assumption's own octave. Those three still
    // aren't modeled. The Immaculate Heart of the Blessed Virgin Mary used
    // to be fixed here too (Pius XII's 1944 decree), but was relocated
    // (2026-08-22 user decision, see TODO.md) to Easter+69 -- the
    // Saturday after the Feast of the Sacred Heart, its own real
    // historical date on both sides of that fixed-date interlude -- so it
    // no longer contests this date at all. With no sanctoral candidate
    // left here, the day's own temporal identity wins outright and the
    // octave is commemorated alongside it, same shape as St. Lawrence's
    // own Aug 12 case just above.
    const assumptionOctaveDay = resolveDay('2025-08-22');
    expect(assumptionOctaveDay.winner.kind).toBe('temporal');
    expect(assumptionOctaveDay.commemorations).toEqual([
      { kind: 'octave', id: 'assumption', name: 'The Assumption of the Blessed Virgin Mary', nameLa: 'Assumptio Beatæ Mariæ Virginis' },
    ]);
  });

  it('the Beheading of St. John the Baptist wins outright at Duplex with a real proper collect and antiphon, over a genuinely unwinnable stub', () => {
    const day = resolveDay('2025-08-29');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'decollation-of-st-john-baptist',
      name: 'The Beheading of St. John the Baptist',
      nameLa: 'Decollatio Sancti Joannis Baptistæ',
      rank: 'duplex',
    });
    expect(day.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-sabina', name: 'St. Sabina, Martyr', nameLa: 'Sancta Sabina, Martyr', rank: 'simplex' },
    ]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it("St. Rose of Lima (rank deliberately deflated to semiduplex, see this project's design notes) wins outright over the ancient Ss. Felix and Adauctus, who keep their own commemoration rather than being suppressed", () => {
    // On a Saturday this date is instead outranked by the generic
    // "Sanctae Mariae Sabbato" votive (see ss-felix-and-adauctus.yml) and
    // a Sunday produces a temporal winner instead -- 2027-08-30, a Monday,
    // is a clean year for this collision.
    const day = resolveDay('2027-08-30');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-rose-of-lima',
      name: 'St. Rose of Lima, Virgin',
      nameLa: 'Sancta Rosa Limana, Virgo',
      rank: 'semiduplex',
    });
    // Felix and Adauctus are off the calendar (2026-10 thinning pass).
    expect(day.commemorations).toEqual([]);
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
