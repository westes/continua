import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayCollect, splitNamedAntiphon } from '../../src/hours/resolve-common';
import type { LiturgicalDay } from '../../src/calendar/types';

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

  it('resolves as honestly missing for a saint with neither a proper collect nor a Common fallback authored', () => {
    // Every real saint in data/calendar/saints/*.yml now has either a
    // proper collect or a collectCommon fallback (see TODO.md's
    // Kalendaria-table pull, 2026-08) -- so this exercises the "missing"
    // path with a synthetic winner rather than hunting for a real
    // example that no longer exists.
    const day: LiturgicalDay = {
      date: '2026-01-01',
      weekday: 'thursday',
      season: 'trinitytide',
      temporalCategory: 'ordinary-feria',
      winner: { kind: 'sanctoral', id: 'example-confessor', name: 'Example Confessor (placeholder)', rank: 'simplex' },
      commemorations: [],
    };
    const collect = getDayCollect(day);
    expect(collect.status.la).toBe('missing');
    expect(collect.status.en).toBe('missing');
  });
});

describe('splitNamedAntiphon', () => {
  it('carries a verified status through to both the incipit and full forms', () => {
    const { incipit, full } = splitNamedAntiphon({
      text: { la: 'Foo * bar baz.', en: 'Foo * bar baz.' },
      status: { la: 'verified', en: 'verified' },
    });
    expect(incipit.status).toEqual({ la: 'verified', en: 'verified' });
    expect(full.status).toEqual({ la: 'verified', en: 'verified' });
  });

  it('carries a draft status through to both forms, per language -- the bug this fixes: it used to hardcode verified on everything regardless of the source status, silently dropping the "unverified draft text" UI marker (src/ui/styles.css .text-draft) from every draft antiphon', () => {
    const { incipit, full } = splitNamedAntiphon({
      text: { la: 'Foo * bar baz.', en: 'Foo * bar baz.' },
      status: { la: 'verified', en: 'draft' },
    });
    expect(incipit.status).toEqual({ la: 'verified', en: 'draft' });
    expect(full.status).toEqual({ la: 'verified', en: 'draft' });
  });

  it("reflects St. Scholastica's own real draft-English antiphon end to end, through Lauds", async () => {
    const { resolveOrdo } = await import('../../src/hours/lauds');
    const ordo = resolveOrdo('2029-02-10'); // St. Scholastica, a clean year
    const idx = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    const canticle = ordo.parts[idx];
    const repeat = ordo.parts[idx + 1];
    expect(canticle?.kind === 'canticle' ? canticle.antiphon?.status.en : undefined).toBe('draft');
    expect(repeat?.kind === 'antiphon' ? repeat.text.status.en : undefined).toBe('draft');
  });
});
