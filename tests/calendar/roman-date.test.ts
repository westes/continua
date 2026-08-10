import { describe, expect, it } from 'vitest';
import { romanDateLatin } from '../../src/calendar/roman-date';

describe('romanDateLatin', () => {
  it('names the day itself for Kalends/Nones/Ides', () => {
    expect(romanDateLatin(1, 1, 2026)).toBe('Kaléndis Januárii');
    expect(romanDateLatin(1, 5, 2026)).toBe('Nonis Januárii');
    expect(romanDateLatin(1, 13, 2026)).toBe('Idibus Januárii');
  });

  it('uses the MMJO exception (March/May/July/October Nones=7, Ides=15)', () => {
    expect(romanDateLatin(3, 7, 2026)).toBe('Nonis Mártii');
    expect(romanDateLatin(3, 15, 2026)).toBe('Idibus Mártii');
  });

  it('counts backward from the next fixed point, verified against real Martyrology headings', () => {
    // Christmas Eve and Christmas Day are the textbook examples.
    expect(romanDateLatin(12, 24, 2026)).toBe('Nono Kaléndas Januárii');
    expect(romanDateLatin(12, 25, 2026)).toBe('Octávo Kaléndas Januárii');
    // Tomorrow's Martyrology entry for 2026-08-25's Prime.
    expect(romanDateLatin(8, 26, 2026)).toBe('Séptimo Kaléndas Septémbris');
  });

  it('uses "Pridie" for the day immediately before a fixed point', () => {
    expect(romanDateLatin(12, 31, 2026)).toBe('Prídie Kaléndas Januárii');
    expect(romanDateLatin(1, 4, 2026)).toBe('Prídie Nonas Januárii');
    expect(romanDateLatin(1, 12, 2026)).toBe('Prídie Idus Januárii');
  });

  it('treats Feb 29 as a repeat of Feb 24 (the historical "bis sextus")', () => {
    expect(romanDateLatin(2, 29, 2028)).toBe(romanDateLatin(2, 24, 2028));
    expect(romanDateLatin(2, 29, 2028)).toBe('Sexto Kaléndas Mártii');
  });
});
