import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect } from '../../src/hours/resolve-common';

describe('getDayCollect', () => {
  it('resolves a real, verified collect for an ordinary Sunday', () => {
    const day = resolveDay('2026-08-09'); // post-pentecost-11
    const collect = getDayCollect(day);
    expect(collect.status.la).toBe('verified');
    expect(collect.status.en).toBe('verified');
    expect(collect.text.en).toContain('Let us pray.');
  });

  it('resolves a real, verified collect for a ferial day via its governing Sunday', () => {
    const day = resolveDay('2026-06-14'); // post-pentecost-03's Sunday
    const collect = getDayCollect(day);
    expect(collect.status.la).toBe('verified');
  });

  it('resolves as honestly missing for a saint with no authored propers yet', () => {
    const day = resolveDay('2026-08-10'); // St. Lawrence wins outright, propers: null
    expect(day.winner.kind).toBe('sanctoral');
    const collect = getDayCollect(day);
    expect(collect.status.la).toBe('missing');
    expect(collect.status.en).toBe('missing');
  });
});
