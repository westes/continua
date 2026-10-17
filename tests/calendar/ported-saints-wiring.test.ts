import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveOrdo } from '../../src/hours';
import { HOUR_IDS } from '../../src/hours/types';
import { martyrologyAnnouncementFor } from '../../src/hours/martyrology-announcement';

// Saints ported from the reference and then placed on the calendar at the
// user's request (2026-10-17), each with a year in which it wins its day.
const WINS: [string, string, string[]][] = [
  ['2026-02-09', 'st-cyril-of-alexandria', ['st-apollonia', 'st-zosimus']],
  ['2026-03-04', 'st-casimir', []],
  ['2026-04-14', 'st-justin-martyr', []],
  ['2026-05-01', 'st-joseph-the-worker', []],
  ['2026-05-11', 'ss-philip-and-james', []],
  ['2027-05-26', 'st-philip-neri', []],
  ['2026-10-16', 'st-hedwig', []],
  ['2026-11-14', 'st-josaphat', ['st-martin-i']],
  ['2026-11-24', 'st-john-of-the-cross', []],
  ['2026-12-04', 'st-peter-chrysologus', ['st-barbara']],
];
// Simplex saints that always sit under a higher feast on their day.
const COMMEMORATED: [string, string, string][] = [
  ['2026-01-23', 'st-raymond-of-penafort', 'betrothal-of-the-bvm'],
  ['2026-07-02', 'ss-processus-and-martinian', 'visitation-of-the-bvm'],
  ['2026-11-09', 'st-theodore-martyr', 'dedication-of-the-basilica-of-the-most-holy-savior'],
];

describe('ported saints on the calendar', () => {
  it.each(WINS)('%s: %s wins', (date, id, commemorated) => {
    const day = resolveDay(date);
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id });
    const ids = day.commemorations.map((c) => ('id' in c ? c.id : ''));
    for (const c of commemorated) expect(ids).toContain(c);
  });

  it.each(COMMEMORATED)('%s: %s is commemorated under %s', (date, id, winner) => {
    const day = resolveDay(date);
    expect(day.winner).toMatchObject({ id: winner });
    expect(day.commemorations.some((c) => 'id' in c && c.id === id)).toBe(true);
  });

  it('St. Martin I is Simplex, so Josaphat holds Nov 14', () => {
    expect(resolveDay('2026-11-14').commemorations).toMatchObject([{ id: 'st-martin-i', rank: 'simplex' }]);
  });

  it('announces a newly placed saint the evening before', () => {
    expect(martyrologyAnnouncementFor('2027-05-01')?.en).toBe(
      'On the morrow we celebrate the feast of St. Joseph the Worker.',
    );
  });

  it.each([
    ['2026-05-01', 'St. Joseph the Worker'],
    ['2026-05-11', 'Ss. Philip and James'],
    ['2026-02-09', 'St. Cyril of Alexandria'],
  ])('%s (%s): every hour renders with nothing missing', (date) => {
    for (const hour of HOUR_IDS) {
      const ordo = resolveOrdo(hour, date);
      expect(JSON.stringify(ordo)).not.toMatch(/"status":\{[^}]*"missing"/);
    }
  });
});
