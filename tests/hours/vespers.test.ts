import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

describe('resolveOrdo("vespers", ...)', () => {
  it('is implemented and resolves Sunday psalmody in order', () => {
    // 2026-08-16 is a Sunday, in ordinary time — no First Vespers claim
    // from the following Monday (a plain feria), so this stays Sunday's
    // own Second Vespers.
    const ordo = resolveOrdo('vespers', '2026-08-16');
    expect(ordo.notImplemented).toBeUndefined();
    expect(ordo.hourId).toBe('vespers');

    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([109, 110, 111, 112]);
  });

  it('joins Ps 115 and 116 under one shared antiphon on Monday', () => {
    // 2026-08-17 is a Monday, in ordinary time.
    const ordo = resolveOrdo('vespers', '2026-08-17');
    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm');
    const numbers = psalmParts.map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([113, 114, 115, 116, 128]);

    // Ps 116 (the second half of the joined pair) carries no antiphon of
    // its own — only Ps 115 (the group's first entry) does.
    const ps115 = psalmParts[2];
    const ps116 = psalmParts[3];
    expect(ps115?.kind === 'psalm' ? ps115.antiphon : undefined).toBeDefined();
    expect(ps116?.kind === 'psalm' ? ps116.antiphon : undefined).toBeUndefined();
  });

  it('splits Ps 138 into two verse-ranges under one shared antiphon on Thursday', () => {
    // 2026-08-20 is a Thursday, in ordinary time.
    const ordo = resolveOrdo('vespers', '2026-08-20');
    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm');
    const numbers = psalmParts.map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([138, 138, 139, 140]);

    const [firstHalf, secondHalf] = psalmParts;
    expect(firstHalf?.kind === 'psalm' ? firstHalf.verses.every((v) => v.n >= 1 && v.n <= 10) : false).toBe(true);
    expect(secondHalf?.kind === 'psalm' ? secondHalf.verses.every((v) => v.n >= 11 && v.n <= 24) : false).toBe(true);
    expect(secondHalf?.kind === 'psalm' ? secondHalf.antiphon : undefined).toBeUndefined();
  });

  it("resolves Saturday's own distinct chapter, responsory, hymn, and versicle", () => {
    // 2026-08-15 is a Saturday and the Assumption (Duplex I. classis) —
    // well above keepsOwnSecondVespers's threshold, so it keeps its own
    // Vespers (weekday stays 'saturday') rather than ceding to tomorrow.
    // No per-feast Vespers-office override exists yet (see hours/
    // vespers.ts), so the plain Saturday weekday default still renders
    // here regardless of the Assumption's own rank — exactly what this
    // test wants to check.
    const ordo = resolveOrdo('vespers', '2026-08-15');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Rom 11:33');

    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('O lux beáta Trínitas');

    const versicle = ordo.parts.find((p) => p.kind === 'versicle' && p.text.text.la?.includes('Vespertína'));
    expect(versicle).toBeDefined();
  });

  it('falls back to the classic weekday-default Magnificat antiphon on a bare ferial', () => {
    // 2026-06-16 is a Tuesday, plain ordinary trinitytide, no saint, no
    // active octave (same date already used by calendar/vespers.test.ts's
    // "does not anticipate between two plain ferias").
    const ordo = resolveOrdo('vespers', '2026-06-16');
    const magnificatIndex = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'magnificat');
    expect(magnificatIndex).toBeGreaterThanOrEqual(0);
    const magnificat = ordo.parts[magnificatIndex];
    expect(magnificat?.kind === 'canticle' ? magnificat.text.text.la : undefined).toContain('Magníficat ✠ ánima mea');
    // The closing full-antiphon repeat is the very next part.
    const closingAntiphon = ordo.parts[magnificatIndex + 1];
    expect(closingAntiphon?.kind === 'antiphon' ? closingAntiphon.text.text.la : undefined).toContain('Exsúltet');
  });

  it('folds the cross-day Vespers commemoration into day-collects (St. James keeps Vespers, St. Anne commemorated)', () => {
    // St. Christopher (same-day collision, commemorated under James
    // already at the calendar level) and St. Anne (the cross-day Vespers
    // commemoration from calendar/vespers.ts) are both sanctoral, so both
    // render as 'preces' parts (see resolve-common.ts's
    // sanctoralCommemorationPart) — only a *temporal* commemoration
    // renders as 'prayer'.
    const ordo = resolveOrdo('vespers', '2026-07-25');
    const collectParts = ordo.parts.filter((p) => p.kind === 'prayer' || p.kind === 'preces');
    // James's own collect ('prayer') + Christopher's + Anne's commemorations ('preces').
    expect(collectParts.length).toBeGreaterThanOrEqual(3);
    const anne = ordo.parts.find((p) => p.kind === 'preces' && p.label?.includes('Anne'));
    expect(anne).toBeDefined();
  });

  it("renders Advent's seasonal chapter/hymn/versicle instead of the plain weekday default", () => {
    // 2025-12-02 is a Tuesday in Advent (St. Bibiana, Simplex, merely
    // commemorated — the day's own winner stays temporal either way).
    const ordo = resolveOrdo('vespers', '2025-12-02');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Gen 49:10');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Cónditor alme síderum');
    const versicle = ordo.parts.find((p) => p.kind === 'versicle' && p.text.text.la?.includes('Roráte'));
    expect(versicle).toBeDefined();
  });

  it("renders Lent's seasonal office", () => {
    // 2026-03-03 is a Tuesday in Lent, before Passiontide.
    const ordo = resolveOrdo('vespers', '2026-03-03');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Joel 2:17');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Audi, benígne Cónditor');
  });

  it("renders Passiontide's seasonal office, with the Gloria Patri omitted from the responsory", () => {
    // 2026-03-25 is a Wednesday in Passiontide (Passion Sunday 2026-03-22
    // through Holy Saturday 2026-04-04).
    const ordo = resolveOrdo('vespers', '2026-03-25');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Jer 11:20');
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).not.toContain('Glória Patri');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Vexílla Regis pródeunt');
  });

  it('includes the Kyrie + Our Father lead-in right after the Magnificat, before the day collect (either form)', () => {
    // 2026-06-16 is a Tuesday, plain ordinary trinitytide -- same bare
    // ferial already used above for the Magnificat weekday-default test.
    const ordo = resolveOrdo('vespers', '2026-06-16');
    const litanyIndex = ordo.parts.findIndex((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    const magnificatIndex = ordo.parts.findIndex((p) => p.kind === 'canticle' && p.canticleId === 'magnificat');
    const collectIndex = ordo.parts.findIndex((p) => p.kind === 'prayer');
    expect(litanyIndex).toBeGreaterThan(magnificatIndex);
    expect(collectIndex).toBeGreaterThan(litanyIndex);
  });

  it('uses the fuller Tridentine 1906/1910 ferial Preces (with Psalm 50) on a plain ferial day, not the short Sunday/feast litany', () => {
    const ordo = resolveOrdo('vespers', '2026-06-16');
    const preces = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(preces?.kind === 'preces' ? preces.text.text.la : undefined).toContain('Miserére mei, Deus');
    expect(preces?.kind === 'preces' ? preces.text.text.en : undefined).toContain('Have mercy on me, O God');
  });

  it("uses the short Sunday/feast litany, without Psalm 50, on a Sunday and on a real saint's own winning day", () => {
    // 2026-08-16 is a plain temporal Sunday -- no First Vespers claim from
    // the following Monday (a plain feria), so this stays Sunday's own.
    const sunday = resolveOrdo('vespers', '2026-08-16');
    const sundayPreces = sunday.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(sundayPreces?.kind === 'preces' ? sundayPreces.text.text.la : undefined).not.toContain('Psalmus 50');

    // 2026-08-15 is the Assumption (Duplex I. classis), a real saint's own
    // Saturday -- same date already used above for the weekday-office test.
    const saintsDay = resolveOrdo('vespers', '2026-08-15');
    const saintsDayPreces = saintsDay.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(saintsDayPreces?.kind === 'preces' ? saintsDayPreces.text.text.la : undefined).not.toContain('Psalmus 50');
  });

  it("renders Paschaltide's seasonal office, sharing its chapter with Lauds", () => {
    // 2026-04-20 is in eastertide (Easter 2026-04-05).
    const ordo = resolveOrdo('vespers', '2026-04-20');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Rom 6:9-10');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Ad cenam Agni próvidi');
    const versicle = ordo.parts.find((p) => p.kind === 'versicle' && p.text.text.la?.includes('Mane nobíscum'));
    expect(versicle).toBeDefined();
  });
});
