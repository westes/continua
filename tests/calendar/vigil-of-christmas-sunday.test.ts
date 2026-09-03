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

  it("Matins Nocturn 3 carries the Vigil's own Gospel (Matt 1:18-21, St. Jerome's homily) and, per this project's generous-commemorations design (the same reason Lauds above shows both collects), Advent 4's own commemorated Gospel (Luke 3:1-6, Pope St. Gregory the Great's homily) too -- still using the Sunday's fixed psalm table throughout", () => {
    const matins = resolveOrdo('matins', '2023-12-24');
    const gospels = matins.parts.filter((p) => p.kind === 'gospel');
    expect(gospels).toHaveLength(2);
    const vigilGospel = gospels.find((g) => g.kind === 'gospel' && g.text.citation?.la === 'Matt 1:18-21');
    expect(vigilGospel?.kind).toBe('gospel');
    if (vigilGospel?.kind === 'gospel') {
      expect(vigilGospel.text.status.la).toBe('verified');
      expect(vigilGospel.homily?.source).toContain('Jerome');
      expect(vigilGospel.homily?.text.status.la).toBe('verified');
    }
    const advent4Gospel = gospels.find((g) => g.kind === 'gospel' && g.text.citation?.la === 'Luc 3:1-6');
    expect(advent4Gospel?.kind).toBe('gospel');
    if (advent4Gospel?.kind === 'gospel') {
      expect(advent4Gospel.text.status.la).toBe('verified');
      expect(advent4Gospel.homily?.source).toContain('Gregory');
      expect(advent4Gospel.homily?.text.status.la).toBe('verified');
    }
    // Nocturns 1-2 keep the ordinary Sunday psalm table (Ps 20-31),
    // unaffected by which id won -- hours/matins.ts's threeNocturns/
    // sundayPsalmNocturn path is keyed by day.weekday, not day.winner.id.
    const psalmCount = matins.parts.filter((p) => p.kind === 'psalm').length;
    expect(psalmCount).toBeGreaterThan(0);
  });
});
