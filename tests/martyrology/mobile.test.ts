import { describe, it, expect } from 'vitest';
import { getMartyrologyEntryFor } from '../../src/martyrology';

// Prime reads tomorrow's entry, so each `today` below is the eve of the
// feast it announces. Easter 2026 is April 5.
const CASES: [string, string, string][] = [
  ['2026-11-28', 'Domínica prima Advéntus', 'Advent I'],
  ['2026-01-01', 'Nóminis Jesu', 'Holy Name (Jan 2)'],
  ['2026-02-17', 'Dies Cínerum', 'Ash Wednesday'],
  ['2026-03-26', 'Septem Dolórum', 'Seven Sorrows, Passion Friday'],
  ['2026-04-04', 'Solémnitas solemnitátum', 'Easter, read on Holy Saturday'],
  ['2026-04-21', 'Solémnitas sancti Joseph', 'Patronage of St. Joseph'],
  ['2026-05-13', 'Ascénsio Dómini', 'Ascension'],
  ['2026-05-23', 'Dies Pentecóstes', 'Pentecost'],
  ['2026-06-03', 'Córporis Christi', 'Corpus Christi'],
  ['2026-10-24', 'Dómini nostri Jesu Christi Regis', 'Christ the King'],
];

describe('martyrology moveable entries', () => {
  it.each(CASES)('%s announces %s (%s)', (today, la) => {
    const entry = getMartyrologyEntryFor(today);
    expect(entry.text.la).toContain(la);
    expect(entry.text.en).toBeTruthy();
    expect(entry.status.la).toBe('verified');
  });

  it('places the moveable entry between the heading and the fixed entries', () => {
    const paragraphs = (getMartyrologyEntryFor('2026-02-17').text.la ?? '').split('\n\n');
    expect(paragraphs[0]).toContain('Anno Dómini');
    expect(paragraphs[1]).toContain('Dies Cínerum');
    expect(paragraphs.length).toBeGreaterThan(2);
  });

  it('adds nothing on an ordinary day', () => {
    expect(getMartyrologyEntryFor('2026-02-10').text.la).not.toContain('Dies Cínerum');
  });
});
