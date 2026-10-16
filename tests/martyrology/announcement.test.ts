import { describe, it, expect } from 'vitest';
import { martyrologyAnnouncementFor } from '../../src/hours/martyrology-announcement';
import { resolveOrdo } from '../../src/hours/prime';

describe('martyrology feast announcements', () => {
  it('prints a feast\'s announcement ahead of the line, and says "same"', () => {
    // Prime on Jun 23 reads Jun 24, kept as the Nativity of St. John the Baptist.
    const part = resolveOrdo('2026-06-23').parts.find((x) => x.kind === 'lesson' && x.label === 'Martyrology');
    const p = (part && 'text' in part ? part.text.text?.en ?? '' : '').split('\n\n');
    expect(p[1]).toMatch(/^The morrow is the birthday of the holy Baptist John/);
    expect(p[2]).toBe('Upon the same 24th day of June, were born into the better life:');
  });

  it('announces only the day\'s winner', () => {
    expect(martyrologyAnnouncementFor('2026-06-24')?.en).toMatch(/birthday of the holy Baptist/);
    // Oct 15: Teresa has no authored announcement.
    expect(martyrologyAnnouncementFor('2026-10-15')).toBeUndefined();
    // Nov 1 (All Saints) is not announced by the Eve's text.
    expect(martyrologyAnnouncementFor('2026-11-01')?.en ?? '').not.toMatch(/Eve of All/);
  });

  it('announces an octave day as its own feast when it wins', () => {
    expect(martyrologyAnnouncementFor('2026-11-08')?.en).toMatch(/Octave of All Saints/);
  });
});
