import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { resolveOrdo } from '../../src/hours';
import { resolveEveningDay } from '../../src/calendar/vespers';
import { getMagnificatAntiphon } from '../../src/hours/resolve-common';
import { lookupPart } from '../../src/hours/resolve-part';

// First vs Second Vespers: `<base>-first` / `<base>-second` content ids
// override `<base>` for the matching evening only (see hours/resolve-
// common.ts's withVespersVariant). Anticipation is detected in
// hours/vespers.ts's resolveOrdo as `day.date !== date`.
const vespers = (date: string) => JSON.stringify(resolveOrdo('vespers', date));

describe('First vs Second Vespers variants', () => {
  it('Assumption: its Magnificat antiphon follows the evening (engine-verified: Virgo prudentíssima at First, Hódie María Virgo at Second Vespers)', () => {
    expect(vespers('2026-08-14')).toContain('Virgo prudentíssima');
    expect(vespers('2026-08-15')).toContain('Hódie * María Virgo cælos ascéndit');
    expect(vespers('2026-08-15')).not.toContain('Virgo prudentíssima');
  });

  it("Apparition of the Immaculate BVM: own hymn only at Second Vespers", () => {
    expect(vespers('2026-02-11')).toContain('Omnis expértem máculæ');
    expect(vespers('2026-02-10')).not.toContain('Omnis expértem máculæ');
  });

  it('Seven Founders of the Servite Order: own hymn only at Second Vespers', () => {
    expect(vespers('2026-02-12')).toContain('Matris sub almæ númine');
    expect(vespers('2026-02-11')).not.toContain('Matris sub almæ númine');
  });

  it("a proper feast's Magnificat antiphon follows the evening (Nativity of the BVM: Sept 7 first, Sept 8 second)", () => {
    expect(vespers('2026-09-07')).toContain('Gloriósæ');
    expect(vespers('2026-09-07')).not.toContain('Natívitas tua');
    expect(vespers('2026-09-08')).toContain('Natívitas tua');
  });

  it("a Common's Magnificat antiphon follows the evening too (BVM Common: 'Sancta María, succúrre' first, 'Beátam me dicent' second)", () => {
    // Our Lady of the Snows (Aug 5) is Common-only (`propers: null`); its
    // own Second Vespers is displaced by the Transfiguration's First, so
    // exercise the lookup directly rather than through the evening.
    const day = resolveDay('2026-08-05');
    expect(getMagnificatAntiphon(day, 'first').text.la).toContain('succúrre míseris');
    expect(getMagnificatAntiphon(day, 'second').text.la).toContain('Beátam me dicent');
    expect(getMagnificatAntiphon(day).text.la).toContain('Beátam me dicent');
    expect(vespers('2026-08-04')).toContain('succúrre míseris');
  });

  // First date in a few years where this evening is governed by `id`.
  const eveningOf = (mmdd: string, id: string): string => {
    for (let y = 2025; y <= 2040; y++) {
      const date = `${y}-${mmdd}`;
      if (resolveEveningDay(date).winner.id === id) return date;
    }
    throw new Error(`no ${id} evening found for ${mmdd}`);
  };

  it("St. Agnes: Second Vespers psalm antiphons are the explicit Monastic set (Congaudéte at Ps 126); Magnificat is [Ant 1] both evenings", () => {
    const second = vespers(eveningOf('01-21', 'st-agnes'));
    expect(second).toContain('Congaudéte mecum');
    expect(second).toContain('Beáta Agnes * in médio flammárum');
    expect(second).not.toContain('Benedíco te, * Pater Dómini mei');
    const first = vespers(eveningOf('01-20', 'st-agnes'));
    expect(first).toContain('Beáta Agnes * in médio flammárum');
    expect(first).not.toContain('Stans beáta Agnes');
  });

  it("St. Lawrence (engine-verified): First Vespers psalms 109/110/111/112 with the Gloria et honóre versicle and Levíta Magnificat; Second Vespers 109/111/112/115, Levíta versicle, Beátus Magnificat", () => {
    const psalmsOf = (iso: string) =>
      resolveOrdo('vespers', iso).parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : 0));
    expect(psalmsOf('2026-08-09')).toEqual([109, 110, 111, 112]);
    expect(psalmsOf('2026-08-10')).toEqual([109, 111, 112, 115]);
    expect(vespers('2026-08-09')).toContain('Glória et honóre coronásti');
    expect(vespers('2026-08-09')).toContain('Levíta Lauréntius * bonum opus');
    expect(vespers('2026-08-10')).toContain('Beátus Lauréntius * orábat, dicens: Grátias');
    expect(vespers('2026-08-10')).not.toContain('Misit Dóminus');
  });

  it("Purification: First Vespers psalm antiphons are the Christmas-cycle set, Second Vespers Simeon's", () => {
    expect(vespers('2026-02-01')).toContain('O admirábile commércium');
    expect(vespers('2026-02-02')).toContain('Símeon justus');
    expect(vespers('2026-02-02')).not.toContain('O admirábile commércium');
  });

  // St. Martina and St. Thérèse never govern an evening of their own (St. John
  // Bosco / Guardian Angels / St. Francis always outrank them), so their
  // Vespers content is exercised through the lookup directly.
  const bundle = (iso: string, variant: 'first' | 'second') => {
    const day = resolveDay(iso);
    const part = (p: 'hymn' | 'versicle') => lookupPart({ day, hour: 'vespers', part: p, temporalKeys: [], variant });
    return { hymn: part('hymn'), versicle: part('versicle') };
  };

  it("St. Martina: her own hymn only at Second Vespers; First Vespers takes the Common's, with her own Lauds hymn", () => {
    expect(bundle('2026-01-30', 'second').hymn.text.la).toContain('Tu natále solum');
    expect(bundle('2026-01-30', 'first').hymn.text.la).not.toContain('Tu natále solum');
    expect(JSON.stringify(resolveOrdo('lauds', '2026-01-30'))).toContain('Tu natále solum');
    expect(JSON.stringify(resolveOrdo('matins', '2026-01-30'))).toContain('Martínæ célebri');
  });

  it("St. Thérèse: First/Second Vespers hymn and versicle pairs differ", () => {
    const first = bundle('2026-10-03', 'first');
    const second = bundle('2026-10-03', 'second');
    expect(first.hymn.text.la).toContain('Nomen decúsque');
    expect(second.hymn.text.la).toContain('Luce divína');
    expect(first.versicle.text.la).toContain('Ego autem in Dómino gaudébo');
    expect(second.versicle.text.la).toContain('Manus Dómini confortávit te');
    expect(getMagnificatAntiphon(resolveDay('2026-10-03'), 'first').text.la).toContain('Ego Dóminus * sponsábo');
    expect(getMagnificatAntiphon(resolveDay('2026-10-03'), 'second').text.la).toContain('Benedíctus Dóminus, * quia hódie');
  });
});
