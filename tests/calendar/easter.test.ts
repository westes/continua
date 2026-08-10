import { describe, expect, it } from 'vitest';
import { easterSunday } from '../../src/calendar/easter';
import { toIsoDate } from '../../src/calendar/date-math';

// Reference dates are public record (Western/Gregorian Easter Sunday),
// spanning different centuries and both early and late extremes.
const KNOWN_EASTER_DATES: Record<number, string> = {
  1583: '1583-04-10', // first year the Gregorian algorithm is valid
  1900: '1900-04-15',
  1954: '1954-04-18',
  2000: '2000-04-23',
  2019: '2019-04-21',
  2020: '2020-04-12',
  2021: '2021-04-04',
  2022: '2022-04-17',
  2023: '2023-04-09',
  2024: '2024-03-31', // one of the earliest possible dates
  2025: '2025-04-20',
  2026: '2026-04-05',
  2027: '2027-03-28',
  2028: '2028-04-16',
  2038: '2038-04-25', // one of the latest possible dates
  2100: '2100-03-28',
};

describe('easterSunday', () => {
  for (const [year, expected] of Object.entries(KNOWN_EASTER_DATES)) {
    it(`resolves ${year} to ${expected}`, () => {
      expect(toIsoDate(easterSunday(Number(year)))).toBe(expected);
    });
  }
});
