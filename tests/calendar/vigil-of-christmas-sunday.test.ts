import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveOrdo } from '../../src/hours';

// Advent 4's own Sunday lands on Dec 24 (its latest possible date) roughly
// every few years -- 2023 and 2028 are the two nearest examples. Per direct
// instruction (2026-08): the Vigil of Christmas's own identity governs that
// day (matching the reference engine's own rule -- Duplex I classis, never
// displaced even by a privileged Sunday), with Advent 4 itself commemorated
// alongside it -- a deliberate departure from the reference engine's own
// `no commemoratio` for this exact collision, since the Sundays of Advent
// have real standing of their own. See calendar/index.ts's
// applyAdventFourVigilCommemoration and calendar/temporal-id.ts's own
// `vigil-of-christmas` case.
describe('Advent 4 Sunday landing on Dec 24 (the Vigil of Christmas)', () => {
  it('2023-12-24: Vigil wins, Advent 4 commemorated', () => {
    const day = resolveDay('2023-12-24');
    expect(day.weekday).toBe('sunday');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'vigil-of-christmas' });
    expect(day.commemorations).toEqual([{ kind: 'temporal', id: 'advent-4' }]);
  });

  it('2028-12-24: same shape, a second real occurrence', () => {
    const day = resolveDay('2028-12-24');
    expect(day.weekday).toBe('sunday');
    expect(day.winner).toEqual({ kind: 'temporal', id: 'vigil-of-christmas' });
    expect(day.commemorations).toEqual([{ kind: 'temporal', id: 'advent-4' }]);
  });

  it("Lauds carries both collects (Vigil's own, then Advent 4's commemorated) and the Vigil's own proper antiphons/Benedictus antiphon", () => {
    const lauds = resolveOrdo('lauds', '2023-12-24');
    const collects = lauds.parts.filter((p) => p.kind === 'prayer');
    expect(collects).toHaveLength(2);
    for (const c of collects) {
      if (c.kind !== 'prayer') continue;
      expect(c.text.status.la).toBe('verified');
      expect(c.text.status.en).toBe('verified');
    }
    expect(collects[0]!.kind === 'prayer' ? collects[0]!.text.text.la : undefined).toContain(
      'Deus, qui nos redemptiónis nostræ',
    );
    expect(collects[1]!.kind === 'prayer' ? collects[1]!.text.text.la : undefined).toContain(
      'Excita, quǽsumus, Dómine',
    );

    const benedictus = lauds.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'benedictus');
    expect(benedictus?.kind).toBe('canticle');
    if (benedictus?.kind === 'canticle') {
      expect(benedictus.antiphon?.text.la).toContain('Oriétur');
      expect(benedictus.antiphon?.status.la).toBe('verified');
    }
  });

  it("Matins Nocturn 3 carries the Vigil's own Gospel (Matt 1:18-21) with St. Jerome's homily, still using the Sunday's fixed psalm table throughout", () => {
    const matins = resolveOrdo('matins', '2023-12-24');
    const gospels = matins.parts.filter((p) => p.kind === 'gospel');
    expect(gospels).toHaveLength(1);
    const gospel = gospels[0]!;
    expect(gospel.kind).toBe('gospel');
    if (gospel.kind === 'gospel') {
      expect(gospel.text.citation?.la).toBe('Matt 1:18-21');
      expect(gospel.text.status.la).toBe('verified');
      expect(gospel.homily?.source).toContain('Jerome');
      expect(gospel.homily?.text.status.la).toBe('verified');
    }
    // Nocturns 1-2 keep the ordinary Sunday psalm table (Ps 20-31),
    // unaffected by which id won -- hours/matins.ts's threeNocturns/
    // sundayPsalmNocturn path is keyed by day.weekday, not day.winner.id.
    const psalmCount = matins.parts.filter((p) => p.kind === 'psalm').length;
    expect(psalmCount).toBeGreaterThan(0);
  });
});
