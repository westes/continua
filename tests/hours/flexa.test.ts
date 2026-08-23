import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

describe('resolveOrdo("matins", ...) flexa mark on Ps 20', () => {
  it("marks where today's opening antiphon leaves off, in both the antiphon itself and Ps 20's first verse (Sunday Matins, Nocturn 1, 2026-08-23)", () => {
    const ordo = resolveOrdo('matins', '2026-08-23');
    const ps20 = ordo.parts.find((p) => p.kind === 'psalm' && p.psalmNumber === 20);
    expect(ps20).toBeDefined();
    if (ps20?.kind !== 'psalm') throw new Error('expected a psalm part');
    const firstVerse = ps20.verses[0];
    expect(firstVerse?.text.la).toContain('‡');
    expect(firstVerse?.text.en).toContain('‡');
    expect(ps20.antiphon?.text.la).toContain('‡');
    expect(ps20.antiphon?.text.en).toContain('‡');
  });
});
