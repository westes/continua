import { describe, expect, it } from 'vitest';
import { activeOctavesFor, strictestThreshold, resolveActiveOctave, pickWinningOctave } from '../../src/calendar/octaves';
import type { ActiveOctave } from '../../src/calendar/octaves';

describe('activeOctavesFor', () => {
  it('finds nothing outside any octave window', () => {
    expect(activeOctavesFor('2026-07-15')).toEqual([]);
  });

  it("finds a saint's own octave on its own day (day 1) and through day 8, not on day 9", () => {
    const day1 = activeOctavesFor('2026-08-10'); // St. Lawrence's own day
    expect(day1).toEqual([
      { id: 'st-lawrence', name: 'St. Lawrence, Martyr', wins: 'semiduplex', dayNumber: 1, isClosingDay: false },
    ]);

    // Aug 17 is also day 3 of the Assumption's own octave (started Aug 15) --
    // the two run concurrently this time of year. Day 8 is Lawrence's own
    // closing day ("in Octava"), elevated to duplex -- live-verified real
    // pattern, not a per-saint quirk (see calendar/types.ts's OctaveConfig).
    const day8 = activeOctavesFor('2026-08-17');
    expect(day8).toEqual([
      { id: 'st-lawrence', name: 'St. Lawrence, Martyr', wins: 'duplex', dayNumber: 8, isClosingDay: true },
      {
        id: 'assumption',
        name: 'The Assumption of the Blessed Virgin Mary',
        wins: 'duplex',
        dayNumber: 3,
        isClosingDay: false,
      },
    ]);

    // Aug 23: past both Lawrence's (ended Aug 17) and the Assumption's
    // (ended Aug 22) windows.
    expect(activeOctavesFor('2026-08-23')).toEqual([]);
  });

  it("Pentecost's octave uses its own configured threshold (duplex), not the default (semiduplex)", () => {
    const octaves = activeOctavesFor('2026-05-29'); // within Pentecost's octave, 2026
    expect(octaves).toEqual([
      { id: 'pentecost-sunday', name: 'Pentecost', wins: 'duplex', dayNumber: 6, isClosingDay: false },
    ]);
    expect(strictestThreshold(octaves)).toBe('duplex');
  });

  it('stacks multiple active octaves oldest-started first', () => {
    const octaves = activeOctavesFor('2033-12-29'); // St. Thomas of Canterbury's day
    expect(octaves.map((o) => o.id)).toEqual([
      'christmas-day',
      'st-stephen-protomartyr',
      'st-john-apostle',
      'holy-innocents',
    ]);
    expect(octaves.map((o) => o.dayNumber)).toEqual([5, 4, 3, 2]);
  });
});

describe('resolveActiveOctave / pickWinningOctave -- overlapping-octave precedence', () => {
  it('returns undefined when no octave is active, and the sole octave when only one is', () => {
    expect(resolveActiveOctave('2026-07-15')).toBeUndefined();
    expect(resolveActiveOctave('2026-08-10')?.id).toBe('st-lawrence');
  });

  it("St. Lawrence's own elevated closing day (duplex) wins the closing-day tie-break over the Assumption's ordinary day 3 (also duplex) on their one real overlap, Aug 17", () => {
    const winner = resolveActiveOctave('2026-08-17');
    expect(winner?.id).toBe('st-lawrence');
    expect(winner?.wins).toBe('duplex');
  });

  it("gives way to the Assumption once Lawrence's own octave has ended (Aug 18-22)", () => {
    expect(resolveActiveOctave('2026-08-18')?.id).toBe('assumption');
  });

  // pickWinningOctave directly, since no real equal-rank overlap exists yet
  // in this app's own calendar to exercise the tie-break against live data.
  const higher = (dayNumber: number): ActiveOctave => ({
    id: 'higher',
    name: 'Higher',
    wins: 'duplex',
    dayNumber,
    isClosingDay: false,
  });
  const lower = (dayNumber: number): ActiveOctave => ({
    id: 'lower',
    name: 'Lower',
    wins: 'semiduplex',
    dayNumber,
    isClosingDay: false,
  });
  const equalA = (dayNumber: number): ActiveOctave => ({
    id: 'equal-a',
    name: 'Equal A',
    wins: 'duplex',
    dayNumber,
    isClosingDay: false,
  });
  const equalB = (dayNumber: number): ActiveOctave => ({
    id: 'equal-b',
    name: 'Equal B',
    wins: 'duplex',
    dayNumber,
    isClosingDay: false,
  });

  it('picks the higher-ranked octave regardless of order or start date', () => {
    expect(pickWinningOctave([lower(2), higher(6)])?.id).toBe('higher');
    expect(pickWinningOctave([higher(6), lower(2)])?.id).toBe('higher');
  });

  it('on a tied rank, picks the more recently started octave (smaller dayNumber) -- per direct instruction: day 1 of a newly started octave needs to be fully present, the whole point of it starting; the older, tied-rank octave loses and is commemorated instead', () => {
    // equalB started later (day 2, vs equalA's day 5 -- fewer days have
    // passed since it began) and should win the tie.
    expect(pickWinningOctave([equalA(5), equalB(2)])?.id).toBe('equal-b');
    expect(pickWinningOctave([equalB(2), equalA(5)])?.id).toBe('equal-b');
  });
});
