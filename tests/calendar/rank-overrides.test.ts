import { afterEach, describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { activeOctavesFor } from '../../src/calendar/octaves';
import { getSaintRecord } from '../../src/calendar/feasts';
import { setRankOverrides } from '../../src/calendar/rank-overrides';

afterEach(() => setRankOverrides({}));

describe('rank overrides', () => {
  it('change nothing when the override map is empty', () => {
    const day = resolveDay('2026-04-22');
    expect(day.winner).toMatchObject({ kind: 'temporal', id: 'patronage-of-st-joseph' });
  });

  it("a feast's rank alone doesn't weaken its octave: Day 1 of the Patronage octave still outranks Soter and Caius", () => {
    setRankOverrides({ 'patronage-of-st-joseph': { rank: 'simplex' } });
    expect(resolveDay('2026-04-22').winner).toMatchObject({ kind: 'temporal', id: 'patronage-of-st-joseph' });
  });

  it('demoting both rank and octaveWins on the Patronage of St. Joseph lets a sanctoral feast win, with it commemorated', () => {
    expect(resolveDay('2026-04-22').winner).toMatchObject({ kind: 'temporal', id: 'patronage-of-st-joseph' });
    setRankOverrides({ 'patronage-of-st-joseph': { rank: 'simplex', octaveWins: 'simplex' } });
    const day = resolveDay('2026-04-22');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'ss-soter-and-caius' });
    expect(day.commemorations).toContainEqual({ kind: 'temporal', id: 'patronage-of-st-joseph' });
  });

  it('a saint override changes a closing-day octave tie-break (2038-05-19: Celestine vs. the Patronage octave)', () => {
    expect(resolveDay('2038-05-19').winner).not.toMatchObject({ id: 'st-peter-celestine' });
    setRankOverrides({ 'st-peter-celestine': { rank: 'duplex-1-classis' } });
    expect(resolveDay('2038-05-19').winner).toMatchObject({ kind: 'sanctoral', id: 'st-peter-celestine', rank: 'duplex-1-classis' });
  });

  it("an octaveWins override changes an octave's ordinary threshold but not its closing-day rank", () => {
    const interior = '2026-04-24';
    const before = activeOctavesFor(interior).find((o) => o.id === 'patronage-of-st-joseph');
    expect(before?.wins).not.toBe('simplex');
    setRankOverrides({ 'patronage-of-st-joseph': { octaveWins: 'simplex' } });
    expect(activeOctavesFor(interior).find((o) => o.id === 'patronage-of-st-joseph')?.wins).toBe('simplex');
    const closing = activeOctavesFor('2026-04-29').find((o) => o.id === 'patronage-of-st-joseph');
    expect(closing?.isClosingDay).toBe(true);
    expect(closing?.wins).not.toBe('simplex');
  });

  it('ignores an override that would make a feast a vigil, or stop a vigil being one', () => {
    setRankOverrides({
      'st-peter-celestine': { rank: 'vigil' },
      'vigil-of-st-matthew': { rank: 'duplex' },
    });
    expect(getSaintRecord('st-peter-celestine')?.rank).toBe('duplex');
    expect(getSaintRecord('vigil-of-st-matthew')?.rank).toBe('vigil');
  });

  it('still allows an override between two non-vigil ranks', () => {
    setRankOverrides({ 'st-peter-celestine': { rank: 'simplex' } });
    expect(getSaintRecord('st-peter-celestine')?.rank).toBe('simplex');
  });
});
