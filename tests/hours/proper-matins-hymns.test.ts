import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// Proper Matins hymns the Common used to stand in for, found by the 2026-10
// hymn sweep against the reference engine's own Monastic 1617 Matins output.
const matinsHymn = (date: string) => {
  const part = resolveOrdo('matins', date).parts.find((p) => p.kind === 'hymn');
  return part && 'text' in part ? part.text.text : { la: '', en: '' };
};

describe('proper Matins hymns', () => {
  it.each([
    ['2027-06-30', 'Commemoration of St. Paul', 'Doctor egrégie Paule', 'Our souls\' great teacher'],
    ['2027-08-01', "St. Peter's Chains", 'Quodcúmque vinclis super terram', 'whatever thou shalt bind'],
    ['2027-01-18', 'the Chair of St. Peter at Rome', 'Quodcúmque in orbe néxibus', 'whatever thou shalt bind'],
    ['2033-03-21', 'St. Benedict', 'Quidquid antíqui cecinére vates', 'ancient prophets'],
  ])('%s %s', (date, _name, la, en) => {
    const h = matinsHymn(date);
    expect(h.la).toContain(la);
    expect(h.en).toContain(en);
  });
});
