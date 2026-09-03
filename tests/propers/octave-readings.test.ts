import { describe, expect, it } from 'vitest';
import { getOctaveReading } from '../../src/propers';

describe('getOctaveReading', () => {
  it('resolves a real reading for a day that has one, collapsed into one continuous text', () => {
    const reading = getOctaveReading('st-lawrence', 2);
    expect(reading?.source.la).toBe('Sermo sancti Augustíni Epíscopi.');
    expect(reading?.source.en).toBe('Sermon of St. Augustine, Bishop');
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

  it('resolves a reading declared as scripture passages into continuous text, one paragraph per passage', () => {
    const reading = getOctaveReading('all-saints', 2);
    const paragraphs = reading?.text.la?.split('\n\n') ?? [];
    expect(paragraphs.length).toBe(3);
    expect(paragraphs[0]).toContain('Et factum est');
    expect(reading?.text.en).toContain('Now it came to pass');
  });

  it('resolves a scripture passage reading that spans two chapters', () => {
    const reading = getOctaveReading('all-saints', 7);
    const paragraphs = reading?.text.la?.split('\n\n') ?? [];
    expect(paragraphs.length).toBe(3); // Ezek 15:1-5, 15:6-8, 16:1-5
    expect(paragraphs[2]).toContain('notas fac Jerúsalem');
  });
});
