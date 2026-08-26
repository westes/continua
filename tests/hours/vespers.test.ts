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
    // 2026-03-02 is a Monday in Lent, before Passiontide -- deliberately
    // not 03-03, whose own evening (as of the Common-of-a-Martyr-Bishop
    // office-bundle authoring below) now correctly anticipates St. Lucius
    // I's First Vespers on 03-04 instead of falling through to this
    // seasonal default; 03-02's own evening has no adjacent sanctoral
    // saint at all, so it stays a clean plain-Lent proof.
    const ordo = resolveOrdo('vespers', '2026-03-02');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Joel 2:17');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Audi, benígne Cónditor');
  });

  it("uses Common-of-a-Martyr-Bishop's real office bundle, not the ferial default, for a Simplex saint's First Vespers", () => {
    // St. Zephyrinus (Aug 26, Simplex, common-of-a-martyr-bishop) claims
    // First Vespers over St. Louis's Aug 25 -- see calendar/vespers.ts's
    // hasFirstVespers comments. Before this Common's Lauds/Vespers bundle
    // was authored, the missing chapter/hymn made the whole bundle
    // resolve to undefined, silently falling through to the plain ferial
    // default -- live-verified against Divinum Officium's `votive=C2b`
    // view instead of a real saint's own day, same reasoning as Common-
    // of-a-Confessor-Not-Bishop's own proof (see vespers-hymn-common-of-
    // a-martyr-bishop.yml's header).
    const ordo = resolveOrdo('vespers', '2026-08-25');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Jas 1:12');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Deus tuórum mílitum');
    for (const part of ordo.parts) {
      if (part.kind === 'chapter' || part.kind === 'responsory' || part.kind === 'hymn' || part.kind === 'versicle') {
        expect(part.text.status.la).toBe('verified');
        expect(part.text.status.en).toBe('verified');
      }
    }
  });

  it("uses Common-of-Several-Martyrs' real office bundle on Ss. Placid and Companions' own day (Duplex II. classis, keeps own Vespers)", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617)
    // votive=C3 -- see vespers-hymn-common-of-several-martyrs.yml's header.
    const ordo = resolveOrdo('vespers', '2026-10-05');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Wis 3:1-3');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Sanctórum méritis ínclyta gáudia');
    for (const part of ordo.parts) {
      if (part.kind === 'chapter' || part.kind === 'responsory' || part.kind === 'hymn' || part.kind === 'versicle') {
        expect(part.text.status.la).toBe('verified');
        expect(part.text.status.en).toBe('verified');
      }
    }
  });

  it("uses Common-of-a-Confessor-Bishop's real office bundle for St. Ubald's First Vespers", () => {
    // St. Ubald (May 16, Semiduplex, common-of-a-confessor-bishop) claims
    // First Vespers over May 15's own evening (no stronger rival that
    // year). Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617) votive=C4 -- see vespers-hymn-common-of-a-confessor-bishop.yml's
    // header.
    const ordo = resolveOrdo('vespers', '2026-05-15');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 44:16-17');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Iste Conféssor Dómini sacrátus');
  });

  it("uses common-of-a-confessor's real office bundle for St. Joseph's First Vespers, not the ferial default", () => {
    // St. Joseph (Mar 19, Duplex, `common: common-of-a-confessor` --
    // vu's own data label for what's really the Common-of-a-Confessor-
    // Not-Bishop category, confirmed live 2026-08-26) claims First
    // Vespers over Mar 18's own evening. See lauds-capitulum-common-of-
    // a-confessor.yml's header for the fuller finding.
    const ordo = resolveOrdo('vespers', '2026-03-18');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 31:8-9');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Iste Conféssor Dómini sacrátus');
  });

  it("uses common-of-an-abbot's real office bundle for St. Maurus's First Vespers, not the ferial default", () => {
    // St. Maurus (Jan 15, Duplex II. classis, common-of-an-abbot -- live-
    // verified 2026-08-26 to be Common-of-a-Confessor-Not-Bishop's own
    // content, see lauds-capitulum-common-of-an-abbot.yml's header)
    // claims First Vespers over Jan 14's own evening.
    const ordo = resolveOrdo('vespers', '2026-01-14');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 31:8-9');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Iste Conféssor Dómini sacrátus');
  });

  it("uses common-of-a-virgin(-martyr)'s real office bundle for St. Praxedes's First Vespers, not the ferial default", () => {
    // St. Praxedes (Jul 21, Simplex, plain common-of-a-virgin -- see
    // lauds-capitulum-common-of-a-virgin.yml's header) claims First
    // Vespers over Jul 20's own evening.
    const ordo = resolveOrdo('vespers', '2026-07-20');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('2 Cor 10:17-18');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Jesu, coróna Vírginum');
  });

  it("uses common-of-a-confessor-doctor's real office bundle for St. Robert Bellarmine's First Vespers", () => {
    // St. Robert Bellarmine (May 13, Duplex, common-of-a-confessor-
    // doctor -- live-verified 2026-08-26 to be Common-of-a-Confessor-
    // Bishop's own content, see lauds-capitulum-common-of-a-confessor-
    // doctor.yml's header) claims First Vespers over May 12's own
    // evening.
    const ordo = resolveOrdo('vespers', '2026-05-12');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 44:16-17');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Iste Conféssor Dómini sacrátus');
  });

  it("uses common-of-an-apostle's real office bundle for the Beheading of St. John the Baptist's First Vespers", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617)
    // votive=C1 -- see vespers-hymn-common-of-an-apostle.yml's header.
    const ordo = resolveOrdo('vespers', '2026-08-28');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Eph 2:19-20');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Exsúltet cælum láudibus');
  });

  it("uses common-of-a-widow's real office bundle for St. Margaret of Scotland's First Vespers", () => {
    // St. Margaret of Scotland (Jun 10, Semiduplex, common-of-a-widow --
    // live-verified 2026-08-26 to be real content identical to Common-
    // of-a-Holy-Woman's, see lauds-capitulum-common-of-a-holy-woman.yml's
    // header) claims First Vespers over Jun 9's own evening.
    const ordo = resolveOrdo('vespers', '2026-06-09');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Prov 31:10-11');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Fortem viríli péctore');
  });

  it("uses common-of-the-bvm's real office bundle for Our Lady of Mount Carmel's First Vespers", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617)
    // votive=C11 -- see vespers-hymn-common-of-the-bvm.yml's header.
    const ordo = resolveOrdo('vespers', '2026-07-15');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 24:14');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Ave maris stella');
  });

  it("renders Passiontide's seasonal office, with the Gloria Patri omitted from the responsory", () => {
    // 2026-03-30 is Holy Monday (Passion Sunday 2026-03-22 through Holy
    // Saturday 2026-04-04) -- deliberately not 03-25, the Annunciation's
    // own fixed date, whose evening now correctly resolves to real
    // Common-of-the-BVM content instead of falling through to this
    // seasonal default (the Annunciation's own proper content isn't
    // imported yet, so this is still an interim improvement, not final).
    const ordo = resolveOrdo('vespers', '2026-03-30');
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

  it('uses the fuller Tridentine 1906/1910 ferial Preces on a plain ferial day, not the short Sunday/feast litany', () => {
    // Psalm 50 (Miserere), present in the live render, is deliberately
    // dropped from this app's own text (2026-08) — 'Ego dixi' is the next
    // versicle after where the psalm used to sit, still unique to the
    // fuller ferial form vs. the short litany.
    const ordo = resolveOrdo('vespers', '2026-06-16');
    const preces = ordo.parts.find((p) => p.kind === 'preces' && p.text.text.la?.includes('Kýrie, eléison'));
    expect(preces?.kind === 'preces' ? preces.text.text.la : undefined).toContain('Ego dixi: Dómine, miserére mei');
    expect(preces?.kind === 'preces' ? preces.text.text.en : undefined).toContain('I said: Lord, be merciful');
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
    // 2026-04-18 is in eastertide (Easter 2026-04-05) -- deliberately not
    // 04-20, whose own evening (as of the Common-of-a-Confessor-Bishop
    // office-bundle authoring below) now correctly anticipates St.
    // Anselm's First Vespers on 04-21 instead of falling through to this
    // seasonal default; 04-18's own evening has no adjacent sanctoral
    // saint at all, so it stays a clean plain-Paschaltide proof.
    const ordo = resolveOrdo('vespers', '2026-04-18');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Rom 6:9-10');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Ad cenam Agni próvidi');
    const versicle = ordo.parts.find((p) => p.kind === 'versicle' && p.text.text.la?.includes('Mane nobíscum'));
    expect(versicle).toBeDefined();
  });
});

describe('resolveOrdo("vespers", ...) responsory Gloria omission', () => {
  // Same shared mechanism/rule as Lauds' — see tests/hours/lauds.test.ts's
  // and tests/hours/compline.test.ts's own describe blocks.
  it('has no Gloria on a ferial Passiontide day, has one on an ordinary date', () => {
    const passiontideResponsory = resolveOrdo('vespers', '2027-03-15').parts.find((p) => p.kind === 'responsory');
    const ordinaryResponsory = resolveOrdo('vespers', '2026-08-20').parts.find((p) => p.kind === 'responsory');
    expect(passiontideResponsory?.kind === 'responsory' ? passiontideResponsory.text.text.la : undefined).not.toContain(
      'Glória Patri',
    );
    expect(ordinaryResponsory?.kind === 'responsory' ? ordinaryResponsory.text.text.la : undefined).toContain('Glória Patri');
  });
});
