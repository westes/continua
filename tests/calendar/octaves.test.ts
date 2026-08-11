import { describe, expect, it } from 'vitest';
import { activeOctavesFor, strictestThreshold } from '../../src/calendar/octaves';

describe('activeOctavesFor', () => {
  it('finds nothing outside any octave window', () => {
    expect(activeOctavesFor('2026-07-15')).toEqual([]);
  });

  it("finds a saint's own octave on its own day (day 1) and through day 8, not on day 9", () => {
    const day1 = activeOctavesFor('2026-08-10'); // St. Lawrence's own day
    expect(day1).toEqual([{ id: 'st-lawrence', name: 'St. Lawrence, Martyr', wins: 'semiduplex', dayNumber: 1 }]);

    const day8 = activeOctavesFor('2026-08-17');
    expect(day8).toEqual([{ id: 'st-lawrence', name: 'St. Lawrence, Martyr', wins: 'semiduplex', dayNumber: 8 }]);

    expect(activeOctavesFor('2026-08-18')).toEqual([]);
  });

  it("Pentecost's octave uses its own configured threshold (duplex), not the default (semiduplex)", () => {
    const octaves = activeOctavesFor('2026-05-29'); // within Pentecost's octave, 2026
    expect(octaves).toEqual([{ id: 'pentecost-sunday', name: 'Pentecost', wins: 'duplex', dayNumber: 6 }]);
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
