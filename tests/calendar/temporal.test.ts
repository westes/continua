import { describe, expect, it } from 'vitest';
import { resolveSeason } from '../../src/calendar/temporal';

// Easter 2026 = Apr 5. Reference boundaries computed by hand from that.
describe('resolveSeason', () => {
  it('resolves Advent (the Sunday nearest Nov 30) through Dec 24', () => {
    // Nov 30, 2025 is a Sunday -> Advent I starts that day.
    expect(resolveSeason('2025-11-29')).toBe('trinitytide');
    expect(resolveSeason('2025-11-30')).toBe('advent');
    expect(resolveSeason('2025-12-24')).toBe('advent');
  });

  it('resolves Christmastide across the year boundary (Dec 25 - Jan 5)', () => {
    expect(resolveSeason('2025-12-25')).toBe('christmastide');
    expect(resolveSeason('2025-12-31')).toBe('christmastide');
    expect(resolveSeason('2026-01-01')).toBe('christmastide');
    expect(resolveSeason('2026-01-05')).toBe('christmastide');
  });

  it('resolves Epiphanytide from Jan 6 until Septuagesima', () => {
    expect(resolveSeason('2026-01-06')).toBe('epiphanytide');
    // Easter 2026 is Apr 5, so Septuagesima (-63 days) is Feb 1.
    expect(resolveSeason('2026-01-31')).toBe('epiphanytide');
  });

  it('resolves the Easter-offset seasons for 2026 (Easter = Apr 5)', () => {
    expect(resolveSeason('2026-02-01')).toBe('septuagesima'); // Easter - 63
    expect(resolveSeason('2026-02-18')).toBe('lent'); // Ash Wednesday, Easter - 46
    expect(resolveSeason('2026-03-22')).toBe('passiontide'); // Easter - 14
    expect(resolveSeason('2026-04-05')).toBe('eastertide'); // Easter Sunday
    expect(resolveSeason('2026-05-14')).toBe('ascensiontide'); // Easter + 39
    expect(resolveSeason('2026-05-24')).toBe('pentecost'); // Easter + 49
    expect(resolveSeason('2026-05-31')).toBe('trinitytide'); // Easter + 56
  });

  it('resolves the Corpus Christi and Sacred Heart single-day overrides', () => {
    expect(resolveSeason('2026-06-04')).toBe('corpus-christi'); // Easter + 60
    expect(resolveSeason('2026-06-12')).toBe('sacred-heart'); // Easter + 68
    // The days immediately around them are still plain Trinitytide.
    expect(resolveSeason('2026-06-05')).toBe('trinitytide');
  });

  it('resolves plain Trinitytide between Trinity Sunday and Advent', () => {
    expect(resolveSeason('2026-09-15')).toBe('trinitytide');
  });

  it('never needs a cross-year Easter lookup for January dates', () => {
    // A year with a very early Easter (2027-03-28) still keeps Septuagesima
    // (Jan 24) safely after Epiphany (Jan 6).
    expect(resolveSeason('2027-01-06')).toBe('epiphanytide');
    expect(resolveSeason('2027-01-23')).toBe('epiphanytide');
    expect(resolveSeason('2027-01-24')).toBe('septuagesima');
  });
});
