import { describe, expect, it } from 'vitest';
import { getOctaveReading } from '../../src/propers';

describe('getOctaveReading', () => {
  it('resolves a real reading for a day that has one, collapsed into one continuous text', () => {
    const reading = getOctaveReading('st-lawrence', 2);
    expect(reading?.source).toBe('Sermo sancti Augustíni Epíscopi.');
    expect(reading?.text.la).toContain('Beatissimi Laurentii Martyris');
    expect(reading?.text.en).toContain('most blessed Martyr, Lawrence');
    expect(reading?.status.la).toBe('verified');
    expect(reading?.status.en).toBe('verified');
    expect(reading?.responsory?.la).toContain('Levíta Lauréntius');
  });

  it('is undefined, not a placeholder, for a day with no reading authored', () => {
    expect(getOctaveReading('st-lawrence', 6)).toBeUndefined(); // Assumption's own day
    expect(getOctaveReading('st-lawrence', 1)).toBeUndefined(); // the feast's own day, not an octave reading
    expect(getOctaveReading('st-lawrence', 99)).toBeUndefined();
  });

  it('resolves the fuller reading for the octave\'s own concluding day distinctly from ordinary days', () => {
    const reading = getOctaveReading('st-lawrence', 8);
    expect(reading?.text.la).toContain('Ecclesiástici');
  });

  it('marks a reading with no sourced English translation as honestly missing, not duplicating the Latin', () => {
    const reading = getOctaveReading('st-lawrence', 3);
    expect(reading?.status.en).toBe('missing');
    expect(reading?.text.en).toBeUndefined();
  });
});
