import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// Every id with an authored Vespers office override (2026-08 sweep) —
// same ids, same clean per-saint dates already established for each
// one's Lauds office-bundle override — see hours/vespers.ts's
// vespersCapitulumForOverride. One live `command=prayVespera` query each,
// Monastic Tridentinum 1617 except christ-the-king (Monastic Divino
// 1930, same as its Lauds counterpart).
const VESPERS_OFFICE_OVERRIDE_DATES: Record<string, string> = {
  'all-saints': '2026-11-01',
  'apparition-of-st-michael': '2026-05-08',
  assumption: '2026-08-15',
  'chair-of-st-peter-at-antioch': '2029-02-22',
  'chair-of-st-peter-at-rome': '2029-01-18',
  'christ-the-king': '2026-10-25',
  'conversion-of-st-paul': '2026-01-25',
  'holy-innocents': '2029-12-28',
  'immaculate-conception': '2026-12-08',
  'nativity-bvm': '2026-09-08',
  'nativity-of-st-john-the-baptist': '2026-06-24',
  'ss-peter-and-paul': '2026-06-29',
  'ss-philip-and-james': '2026-05-01',
  'ss-simon-and-jude': '2025-10-28',
  'st-andrew': '2026-11-30',
  'st-barnabas': '2035-06-11',
  'st-bartholomew': '2026-08-24',
  'st-james-the-greater': '2028-07-25',
  'st-john-apostle': '2029-12-27',
  'st-john-before-the-latin-gate': '2029-05-06',
  'st-lawrence': '2026-08-10',
  'st-luke': '2025-10-18',
  'st-mark': '2026-04-25',
  'st-martin-of-tours': '2026-11-11',
  'st-matthew': '2026-09-21',
  'st-matthias': '2029-02-24',
  'st-peter-ad-vincula': '2026-08-01',
  'st-scholastica': '2026-02-10',
  'st-stephen-protomartyr': '2029-12-26',
  'st-thomas-apostle': '2026-12-21',
};

describe('resolveOrdo("vespers", ...) office-override sweep', () => {
  it.each(Object.entries(VESPERS_OFFICE_OVERRIDE_DATES))(
    "resolves %s's own chapter/responsory/hymn/versicle bundle through the real mechanism, not just checking the YAML files exist",
    (id, date) => {
      const ordo = resolveOrdo('vespers', date);
      const chapter = ordo.parts.find((p) => p.kind === 'chapter');
      const responsory = ordo.parts.find((p) => p.kind === 'responsory');
      const hymn = ordo.parts.find((p) => p.kind === 'hymn');
      const versicle = ordo.parts.find((p) => p.kind === 'versicle');
      for (const part of [chapter, responsory, hymn, versicle]) {
        expect(part, `${id}: part missing from resolved ordo`).toBeDefined();
        const status = part && 'text' in part ? part.text.status : undefined;
        expect(status?.la, `${id}: Latin unexpectedly missing`).not.toBe('missing');
        expect(status?.en, `${id}: English unexpectedly missing`).not.toBe('missing');
      }
    },
  );
});

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
    // Not 2026-08-20: that date's own first Vespers is now claimed by
    // St. Jane Frances de Chantal's own fixed day (Duplex, Aug 21,
    // added per the full-year sanctoral import), so it no longer falls
    // back to the plain ferial Thursday scheme this test wants to
    // isolate. 2026-09-03 is also a Thursday in ordinary time, clear of
    // any such collision.
    const ordo = resolveOrdo('vespers', '2026-09-03');
    const psalmParts = ordo.parts.filter((p) => p.kind === 'psalm');
    const numbers = psalmParts.map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([138, 138, 139, 140]);

    const [firstHalf, secondHalf] = psalmParts;
    expect(firstHalf?.kind === 'psalm' ? firstHalf.verses.every((v) => v.n >= 1 && v.n <= 10) : false).toBe(true);
    expect(secondHalf?.kind === 'psalm' ? secondHalf.verses.every((v) => v.n >= 11 && v.n <= 24) : false).toBe(true);
    expect(secondHalf?.kind === 'psalm' ? secondHalf.antiphon : undefined).toBeUndefined();
  });

  it("uses the Assumption's own per-feast office override on her own Saturday, not the plain Saturday weekday default", () => {
    // 2026-08-15 is a Saturday and the Assumption (Duplex I. classis) —
    // well above keepsOwnSecondVespers's threshold, so it keeps its own
    // Vespers (weekday stays 'saturday') rather than ceding to tomorrow —
    // and well above getOfficeOverrideId's duplex-majus+ threshold too,
    // so her own authored chapter/responsory/hymn/versicle bundle
    // (vespers-{part}-assumption.yml, live-verified 2026-08) wins over the
    // plain Saturday default, same chapter text as her already-authored
    // lauds-capitulum-assumption.yml (see hours/vespers.ts's
    // vespersCapitulumForOverride).
    const ordo = resolveOrdo('vespers', '2026-08-15');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 24:11-12');

    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).not.toContain('O lux beáta Trínitas');

    const versicle = ordo.parts.find((p) => p.kind === 'versicle' && p.text.text.la?.includes('Exaltáta est sancta Dei Génitrix'));
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

  it("renders each of the Christmas Octave's own stacked 'Commemoratio Octavæ' blocks on a day the temporal office itself keeps standing", () => {
    // 2033-12-30 -- one day past the '2033-12-29' stacking fixture already
    // used in tests/calendar/octaves.test.ts (St. Thomas of Canterbury's
    // day, itself outside this app's calendar so the day stays plain
    // temporal). All four of Christmas/Stephen/John/Holy Innocents' own
    // octaves are active and none of them wins the day outright (the
    // temporal day itself, "privileged-feria-minor", keeps the office) --
    // see hours/resolve-common.ts's getDayCollects, kind === 'octave'
    // branch, and its own doc comment for why this is the one case an
    // octave commemoration renders its own Ant+V/R+collect block here.
    const ordo = resolveOrdo('vespers', '2033-12-30');
    const octaveParts = ordo.parts.filter(
      (p): p is Extract<typeof p, { kind: 'preces' }> => p.kind === 'preces' && (p.label?.includes('Octave of') ?? false),
    );
    expect(octaveParts.map((p) => p.label).sort()).toEqual(
      [
        'Commemoration of the Octave of Christmas',
        'Commemoration of the Octave of The Holy Innocents, Martyrs',
        'Commemoration of the Octave of St. John, Apostle and Evangelist',
        'Commemoration of the Octave of St. Stephen, Protomartyr',
      ].sort(),
    );
    for (const part of octaveParts) {
      expect(part.text.status.la).toBe('verified');
      expect(part.text.status.en).toBe('verified');
    }
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
