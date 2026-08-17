import { describe, expect, it } from 'vitest';
import { resolveTemporalId } from '../../src/calendar/temporal-id';
import { resolveDay } from '../../src/calendar';

describe('resolveTemporalId — post-Pentecost overflow', () => {
  // 2026: Easter 2026-04-05 -> only post-epiphany-1..5 occur before
  // Septuagesima, so post-pentecost-24 through 27 (5 real weeks between
  // XXIII and the last Sunday) resume as Epiphany V and VI before landing
  // on the fixed final Sunday. Confirmed against the reference engine's
  // own DivinumOfficium/Date.pm getweek() (Pent/Epi arithmetic), not just
  // hand-derived.
  it('resumes the skipped post-Epiphany Sundays in order before the fixed last Sunday', () => {
    expect(resolveTemporalId('2026-11-07')).toBe('post-pentecost-23');
    expect(resolveTemporalId('2026-11-14')).toBe('post-epiphany-5');
    expect(resolveTemporalId('2026-11-21')).toBe('post-epiphany-6');
    expect(resolveTemporalId('2026-11-28')).toBe('post-pentecost-24');
  });

  it('does not resume anything in a non-overflow year (all 6 post-Epiphany Sundays occurred)', () => {
    // 1943: Easter 1943-04-25, latest possible-ish Easter -> all 6
    // post-Epiphany Sundays occur, so post-pentecost climbs past 24
    // without ever touching Epiphany content, capping at the fixed id.
    expect(resolveTemporalId('1943-11-21')).toBe('post-pentecost-24');
  });
});

describe('post-Epiphany VI commemoration on the Saturday before Septuagesima', () => {
  it('fires only when Epiphany V was the last Sunday to occur (2022, 2025)', () => {
    const day2022 = resolveDay('2022-02-12');
    expect(day2022.commemorations).toContainEqual({ kind: 'temporal', id: 'post-epiphany-6' });

    const day2025 = resolveDay('2025-02-15');
    expect(day2025.commemorations).toContainEqual({ kind: 'temporal', id: 'post-epiphany-6' });
  });

  it('does not fire when all 6 post-Epiphany Sundays occurred (1943)', () => {
    const day = resolveDay('1943-02-20');
    expect(day.commemorations).not.toContainEqual({ kind: 'temporal', id: 'post-epiphany-6' });
  });
});
