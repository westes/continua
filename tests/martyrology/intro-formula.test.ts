import { describe, it, expect } from 'vitest';
import { getMartyrologyEntryFor } from '../../src/martyrology';

const FORMULA = /^Upon the (same )?\d+(st|nd|rd|th) day of [A-Z][a-z]+, were born into the better life:$/;

function paragraphs(isoDate: string): string[] {
  return (getMartyrologyEntryFor(isoDate).text.en ?? '').split('\n\n');
}

describe('martyrology day intro', () => {
  it('opens the day with the "born into the better life" line (2026-10-15, read on the 14th)', () => {
    const p = paragraphs('2026-10-14');
    expect(p[1]).toBe('Upon the 15th day of October, were born into the better life:');
    expect(p[2]).toMatch(/^At Avila, in Spain/);
  });

  it('prints it exactly once on every day of the year', () => {
    for (let m = 1; m <= 12; m++) {
      const days = new Date(Date.UTC(2027, m, 0)).getUTCDate();
      for (let d = 1; d <= days; d++) {
        const iso = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hits = paragraphs(iso).filter((x) => FORMULA.test(x));
        expect(hits.length, iso).toBe(1);
      }
    }
  });

  it("follows the feast's own elogium and says 'same' when the date leads with one", () => {
    // Dec 24 reads Dec 25: Christmas's own elogium first, then the line.
    const p = paragraphs('2026-12-24');
    const at = p.findIndex((x) => FORMULA.test(x));
    expect(p[at]).toMatch(/^Upon the same 25th day of December/);
    expect(at).toBeGreaterThan(1);
  });
});
