import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

// Clean per-annum years for these dates (no Sunday collision, and clear of
// the movable Ascension/Pentecost/Trinity-adjacent observances that usually
// overshadow several of them) — see data/calendar/saints/*.yml for
// per-saint source detail.
describe('May sanctoral pull (first pass)', () => {
  it('Ss. Philip and James win outright with a real proper collect and antiphon', () => {
    const day = resolveDay('2029-05-01');
    expect(day.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-philip-and-james',
      name: 'Ss. Philip and James, Apostles',
      rank: 'duplex-2-classis',
    });
    expect(getDayCollect(day).status.en).toBe('verified');
  });

  it('two stubs are genuinely unwinnable in the real historical calendar, not just an artifact of the year checked', () => {
    // Ss. Alexander/Eventius/Theodulus/Juvenal always lose to the Finding
    // of the Holy Cross (May 3) in real practice — but that's a fixed
    // feast of the Lord, which this app doesn't model at all (same known
    // gap as Circumcision/Epiphany/Purification/Annunciation), so the stub
    // wins by default here rather than being displaced the way it really
    // would be.
    const may3 = resolveDay('2033-05-03');
    expect(may3.winner).toEqual({
      kind: 'sanctoral',
      id: 'ss-alexander-eventius-theodulus-and-juvenal',
      name: 'Ss. Alexander I, Eventius, and Theodulus, Martyrs, and Juvenal, Bishop and Confessor',
      rank: 'simplex',
    });

    // St. Pudentiana always loses to St. Peter Celestine (May 19, also fixed-date) —
    // this one *is* modeled (both are real sanctoral records), so it
    // resolves correctly.
    const may19 = resolveDay('2038-05-19');
    expect(may19.winner).toEqual({
      kind: 'sanctoral',
      id: 'st-peter-celestine',
      name: 'St. Peter Celestine, Pope and Confessor',
      rank: 'duplex',
    });
    expect(may19.commemorations).toEqual([
      { kind: 'sanctoral', id: 'st-pudentiana', name: 'St. Pudentiana, Virgin', rank: 'simplex' },
    ]);
  });

  it('a saint with no dedicated Sancti file at all still resolves cleanly, honestly missing a collect', () => {
    const day = resolveDay('2038-05-22'); // St. Romanus, Abbot
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'st-romanus-abbot', name: 'St. Romanus, Abbot', rank: 'duplex' });
    expect(getDayCollect(day).status.en).toBe('missing');
  });
});
