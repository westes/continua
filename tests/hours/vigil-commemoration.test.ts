import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// A Vigil's mere commemoration (as opposed to winning outright, which
// uses its own real antiphon — see data/propers/common/vigil-of-st-
// lawrence-antiphon.yml etc.) doesn't reuse that antiphon at all: its own
// source file's [Rule] says "Versum Feria" — borrow the plain ferial
// day's own antiphon/versicle instead. Live-verified (Monastic
// Tridentinum 1617) across six real weekdays: the antiphon quotes the
// Benedictus canticle in weekday sequence (same shape as Vespers' own
// Magnificat-antiphon weekday default), the versicle is a single fixed
// text. See hours/resolve-common.ts's vigilCommemorationAntiphon and
// data/hours/lauds-vigil-commemoration-antiphons.yml's own header for the
// exact dates checked.
describe('a Vigil\'s mere commemoration (not winning outright)', () => {
  it('2028-08-14 (Monday): Vigil of the Assumption commemorated under the Sunday-cycle feria, Monday\'s own Benedictus-verse antiphon', () => {
    const lauds = resolveOrdo('lauds', '2028-08-14');
    const commem = lauds.parts.find((p) => p.kind === 'preces' && p.label?.includes('Vigil of the Assumption'));
    expect(commem?.kind === 'preces' ? commem.text.text.la : undefined).toContain('Benedíctus Dóminus, Deus Israël.');
    expect(commem?.kind === 'preces' ? commem.text.text.la : undefined).toContain('Repléti sumus mane misericórdia tua');
    expect(commem?.kind === 'preces' ? commem.text.text.la : undefined).toContain('Deus, qui virginálem aulam'); // its own real collect, unchanged
    expect(commem?.kind === 'preces' ? commem.text.status.la : undefined).toBe('verified');
  });

  it('2029-08-14 (Tuesday) vs. 2030-08-14 (Wednesday): the same Vigil of the Assumption gets a different antiphon on a different weekday, same fixed versicle', () => {
    const tuesday = resolveOrdo('lauds', '2029-08-14');
    const wednesday = resolveOrdo('lauds', '2030-08-14');
    const tueCommem = tuesday.parts.find((p) => p.kind === 'preces' && p.label?.includes('Vigil of the Assumption'));
    const wedCommem = wednesday.parts.find((p) => p.kind === 'preces' && p.label?.includes('Vigil of the Assumption'));
    const tueText = tueCommem?.kind === 'preces' ? tueCommem.text.text.la : undefined;
    const wedText = wedCommem?.kind === 'preces' ? wedCommem.text.text.la : undefined;
    expect(tueText).toContain('Eréxit nobis');
    expect(wedText).toContain('De manu ómnium qui odérunt nos');
    expect(tueText).toContain('Repléti sumus mane misericórdia tua');
    expect(wedText).toContain('Repléti sumus mane misericórdia tua');
  });

  it('2033-08-14 (a real Sunday): the Vigil is never even commemorated — a Vigil transfers off an ordinary Sunday, matching the live reference exactly', () => {
    const lauds = resolveOrdo('lauds', '2033-08-14');
    const commem = lauds.parts.find((p) => p.kind === 'preces' && p.label?.includes('Vigil of the Assumption'));
    expect(commem).toBeUndefined();
  });
});
