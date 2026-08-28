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

  it('genuinely unwinnable stubs correctly lose to their real competitor, now that both are modeled', () => {
    // Ss. Alexander/Eventius/Theodulus/Juvenal always lose to the Finding
    // of the Holy Cross (May 3) in real practice — both are now modeled
    // (see finding-of-the-holy-cross.yml), so the collision engine
    // correctly demotes the stub to a commemoration instead of letting it
    // win by default.
    const may3 = resolveDay('2033-05-03');
    expect(may3.winner).toEqual({
      kind: 'sanctoral',
      id: 'finding-of-the-holy-cross',
      name: 'The Finding of the Holy Cross',
      rank: 'duplex-2-classis',
    });
    expect(may3.commemorations).toEqual([
      {
        kind: 'sanctoral',
        id: 'ss-alexander-eventius-theodulus-and-juvenal',
        name: 'Ss. Alexander I, Eventius, and Theodulus, Martyrs, and Juvenal, Bishop and Confessor',
        rank: 'simplex',
      },
    ]);

    // St. Pudentiana always loses to St. Peter Celestine (May 19, also fixed-date) —
    // this one *is* modeled (both are real sanctoral records), so it
    // resolves correctly. 2033, not 2038: in 2038 May 19 falls on the
    // closing day of the Patronage of St. Joseph's own movable octave
    // (data/calendar/temporal-feasts/patronage-of-st-joseph.yml, added
    // 2026-08-28), whose Duplex threshold ties Celestine's own rank — the
    // app's own documented closing-day tie-break (calendar/index.ts's
    // applyOctaves) then favors the octave, correctly displacing Celestine
    // into a commemoration that year. Not a bug; just the wrong year to
    // prove this particular tie-break with now that a real rival exists.
    const may19 = resolveDay('2033-05-19');
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

  it('a saint with no proper collect of his own resolves via the Common of an Abbot instead', () => {
    const day = resolveDay('2038-05-22'); // St. Romanus, Abbot
    expect(day.winner).toEqual({ kind: 'sanctoral', id: 'st-romanus-abbot', name: 'St. Romanus, Abbot', rank: 'duplex' });
    expect(getDayCollect(day).status.en).toBe('verified');
  });
});
