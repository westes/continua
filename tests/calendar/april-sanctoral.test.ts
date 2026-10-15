import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision, and clear of
// the movable Holy Week/Easter Octave that usually overshadows several of
// them) — see data/calendar/saints/*.yml for per-saint source detail.
describe('April sanctoral pull (first pass)', () => {
  it('St. Mark wins outright with a real proper collect on an ordinary date', () => {
    const day = resolveDay('2042-04-25');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-mark',
      name: 'St. Mark, Evangelist',
      nameLa: 'Sanctus Marcus, Evangelista',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('St. Mark gets nothing at all within the Easter Octave — not even a bare commemoration — and surfaces on the 1st day of the Easter-octave backlog instead', () => {
    // Corrected 2026-09-01: nothing is ever commemorated anywhere from
    // Palm Sunday through Low Sunday, no exception for any rank (direct
    // instruction; live-verified against the Annunciation on Holy
    // Thursday and Chair of St. Peter at Antioch on Ash Wednesday, both
    // Duplex-majus+ and both transferring with zero commemoration). Per
    // further direct instruction the same day, this doesn't cascade
    // day-by-day looking for a free day: the Nth day after Low Sunday
    // celebrates the Nth candidate that cleared the backlog's own
    // duplex-majus+ floor that year (native-date order), winning
    // outright and demoting whatever would have natively been there to
    // a commemoration — see calendar/index.ts's `applyEasterOctaveBacklog`.
    // Mark (Duplex II. classis, well above the floor) is the only
    // candidate in 2030's own backlog, so he lands the 1st day after Low
    // Sunday (Apr 28 that year) outright.
    const native = resolveDay('2030-04-25');
    // 2030-04-25 is Easter+4 (Thursday of Easter week); `winner.id` is
    // this weekday's own real temporal-feasts id since 2026-09-06 (see
    // calendar/temporal-feasts/easter-thursday.yml), not the shared
    // `easter-sunday` governing-week id. The override mechanism pushes a
    // `{kind:'temporal', id:'easter-sunday'}` commemoration for the coarse
    // id it replaces, same shape every other movable feast (Ascension,
    // Corpus Christi, the Passiontide days) already does; harmless, since
    // day-label.ts's collectCommemorations deliberately drops any
    // commemoration whose id equals the plain governing weekday (see
    // tests/calendar/transfer.test.ts's own Holy Monday case for the same
    // shape).
    expect(native.winner).toEqual({ kind: 'temporal', id: 'easter-thursday' });
    expect(native.commemorations).toEqual([{ kind: 'temporal', id: 'easter-sunday' }]);
    expect(native.transferredAway?.candidate.id).toBe('st-mark');

    const landing = resolveDay('2030-04-29');
    expect(landing.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-mark',
      name: 'St. Mark, Evangelist',
      nameLa: 'Sanctus Marcus, Evangelista',
      rank: 'duplex-2-classis',
      transferredFrom: '2030-04-25',
    });
    // St. Catherine of Siena (Simplex), native to this day, is demoted to
    // a commemoration rather than winning or being skipped past.
    expect(landing.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-catherine-of-siena')).toBe(true);
  });

  it('St. Catherine of Siena wins her own day outright, now that Robert and the Cluny abbots are off the calendar', () => {
    const day = resolveDay('2043-04-29');
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'st-catherine-of-siena', name: 'St. Catherine of Siena, Virgin', nameLa: 'Sancta Catharina Senensis, Virgo', rank: 'simplex' });
    expect(day.commemorations).toEqual([]);
  });

  it('an ordinary Eastertide Sunday (not Easter Day, not within its Octave) still lets a plain Duplex saint (St. Athanasius) win outright, same as any weekday', () => {
    // 2027: May 2 is an ordinary (not privileged) Sunday in Eastertide —
    // "Duplex" wins outright there, same as data/calendar/temporal-
    // categories.yml's `ordinary-sunday` rule for any other season, with
    // the Sunday itself only noted as a commemoration, not primary.
    const sunday = resolveDay('2027-05-02');
    expect(sunday.winner).toEqual({ kind: 'sanctoral', id: 'st-athanasius', name: 'St. Athanasius, Bishop, Confessor and Doctor of the Church', nameLa: 'Sanctus Athanasius, Episcopus, Confessor et Ecclesiæ Doctor', rank: 'duplex' });
    expect(sunday.commemorations).toEqual([{ kind: 'temporal', id: 'easter-6' }]);
  });
});
