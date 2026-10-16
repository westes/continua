import { describe, it, expect } from 'vitest';
import { martyrologyAnnouncementFor } from '../../src/hours/martyrology-announcement';
import { resolveOrdo } from '../../src/hours/prime';

// [date announced, expected English announcement]
const CASES: [string, string][] = [
  ['2026-06-24', 'On the morrow we celebrate the feast of the Nativity of St. John the Baptist.'],
  ['2026-01-14', 'On the morrow we celebrate the feast of St. Hilary of Poitiers, Bishop, Confessor and Doctor of the Church.'],
  ['2026-09-24', 'On the morrow we celebrate the feast of Our Lady of Ransom.'],
  ['2027-08-23', 'On the morrow is the eve of St. Bartholomew.'],
  ['2026-12-24', 'On the morrow is the eve of Christmas.'],
  ['2026-11-08', 'On the morrow is the Octave Day of All Saints.'],
  ['2026-07-06', 'On the morrow is the Octave Day of Ss. Peter and Paul, Apostles.'],
  ['2026-08-17', 'On the morrow is the octave day of St. Lawrence, Deacon and Martyr.'],
  ['2026-12-15', 'On the morrow is the octave day of the Immaculate Conception of the Blessed Virgin Mary.'],
  ['2026-05-27', 'On the morrow we celebrate the feast of St. Bede the Venerable, Priest, Confessor and Doctor of the Church.'],
];

describe('martyrology feast announcements', () => {
  it.each(CASES)('%s: %s', (date, text) => {
    expect(martyrologyAnnouncementFor(date)?.en).toBe(text);
  });

  it('is silent for interior octave days and winners that do not opt in', () => {
    expect(martyrologyAnnouncementFor('2026-08-12')).toBeUndefined();
    expect(martyrologyAnnouncementFor('2026-10-15')).toBeUndefined();
    // The Baptist's octave day (Jul 1) falls on the Most Precious Blood,
    // Duplex I, which keeps the day and does not opt in.
    expect(martyrologyAnnouncementFor('2026-07-01')).toBeUndefined();
    expect(martyrologyAnnouncementFor('2026-06-27')).toBeUndefined();
  });

  it('prints the announcement ahead of the line in Prime, and says "same"', () => {
    const part = resolveOrdo('2026-06-23').parts.find((x) => x.kind === 'lesson' && x.label === 'Martyrology');
    const p = (part && 'text' in part ? part.text.text?.en ?? '' : '').split('\n\n');
    expect(p[1]).toBe('On the morrow we celebrate the feast of the Nativity of St. John the Baptist.');
    expect(p[2]).toBe('Upon the same 24th day of June, were born into the better life:');
  });
});
