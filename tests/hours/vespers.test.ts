import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { getVespersCommonOverride } from '../../src/hours/vespers-psalmody-overrides';

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
  'st-stephen-protomartyr': '2029-12-26',
  'st-thomas-apostle': '2026-12-21',
  // Not 'st-scholastica' (Feb 10): her own Second Vespers can never
  // actually render on the calendar. Feb 11's Apparition of the
  // Immaculate BVM ties her own duplex-majus rank, and vu's concurrentia
  // tie-break gives the evening to tomorrow's First Vespers every single
  // year (both are fixed dates) — confirmed 2026-09-08 while authoring
  // apparition-of-the-immaculate-bvm's own bundle content, which is what
  // this date actually now exercises instead.
  'apparition-of-the-immaculate-bvm': '2026-02-10',
};

// Ids with a real, source-confirmed absence of any Vespers responsory at
// all (not an authoring gap) — same "genuinely missing, not unauthored"
// pattern as the Sacred Heart's own Lauds/Vespers, which resolveOffice
// deliberately omits the responsory part for rather than rendering an
// empty one.
const NO_VESPERS_RESPONSORY = new Set(['apparition-of-the-immaculate-bvm']);

describe('resolveOrdo("vespers", ...) office-override sweep', () => {
  it.each(Object.entries(VESPERS_OFFICE_OVERRIDE_DATES))(
    "resolves %s's own chapter/responsory/hymn/versicle bundle through the real mechanism, not just checking the YAML files exist",
    (id, date) => {
      const ordo = resolveOrdo('vespers', date);
      const chapter = ordo.parts.find((p) => p.kind === 'chapter');
      const responsory = ordo.parts.find((p) => p.kind === 'responsory');
      const hymn = ordo.parts.find((p) => p.kind === 'hymn');
      const versicle = ordo.parts.find((p) => p.kind === 'versicle');
      const parts = NO_VESPERS_RESPONSORY.has(id) ? [chapter, hymn, versicle] : [chapter, responsory, hymn, versicle];
      if (NO_VESPERS_RESPONSORY.has(id)) {
        expect(responsory, `${id}: expected no responsory part at all`).toBeUndefined();
      }
      for (const part of parts) {
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
    // Not 2026-08-17 (the closing day of St. Lawrence's own octave, Aug
    // 10-17, Duplex II. classis) and not 2026-09-28 either (that Monday
    // evening anticipates St. Michael's own First Vespers, Sept 29,
    // Duplex I. classis) -- now that Vespers has its own duplex-majus+
    // psalmody override (2026-08-28), both evenings correctly pick up a
    // Common's own psalms instead of the plain ferial Monday set, same as
    // Lauds' own octave-day override already did. 2026-10-12 is a Monday
    // clear of any such collision.
    const ordo = resolveOrdo('vespers', '2026-10-12');
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

  it("uses Common-of-an-Apostle's own psalmody on St. Bartholomew's own day (Duplex II. classis, keeps own Vespers)", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617,
    // votive=C1), 2026-08-28 -- see data/hours/vespers-psalmody-overrides/
    // categories/common-of-an-apostle.yml's own header. St. Bartholomew
    // has no proper Vespers psalmody of his own authored yet, so this is
    // his Common's own tier, not a per-feast override.
    const ordo = resolveOrdo('vespers', '2026-08-24');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([109, 112, 115, 138]);
  });

  it('falls back to plain ferial Monday psalms on St. Lawrence\'s octave closing day (no explicit closingDayRank)', () => {
    // 2026-08-17 is the closing day of St. Lawrence's own octave (Aug
    // 10-17, Duplex II. classis) -- but his own octave config never sets
    // closingDayRank, so calendar/octaves.ts's DEFAULT_CLOSING_DAY_RANK
    // ('duplex') is the octave's own effective rank that day, not his
    // real duplex-2-classis rank. getPsalmodyNumbersOverrideId gates on
    // that octave-day rank (2026-09-09 fix, confirmed with the user), and
    // 'duplex' is below the duplex-majus cut -- so the Common-of-a-Martyr
    // psalmody tier doesn't apply here. No octave in this app's own
    // calendar currently sets closingDayRank/wins to duplex-majus+, so
    // every octave day (other than the origin feast's own actual day)
    // falls back to the plain ferial scheme the same way.
    const ordo = resolveOrdo('vespers', '2026-08-17');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([113, 114, 115, 116, 128]);
  });

  it('falls back to plain ferial Wednesday psalms on day 2 of the Nativity of the BVM\'s octave (2026-09-09), not the Nativity\'s own proper psalms', () => {
    // St. Gorgonius (simplex) is the only real sanctoral candidate on
    // Sept 9, but he loses the day to the Nativity's own octave (Sept
    // 8-15). Before the 2026-09-09 fix, resolveOfficeWinner synthesized
    // the Nativity's own full rank (duplex-2-classis) for every day of
    // its octave, so this day wrongly read as duplex-majus+ eligible and
    // pulled the Nativity's own proper psalms ([92, 99, 62], see
    // data/hours/vespers-psalmody-overrides/saints/nativity-bvm.yml).
    // getPsalmodyNumbersOverrideId now uses the octave's own per-day
    // rank (wins: duplex here, below duplex-majus) instead, so this
    // falls back to the plain ferial Wednesday scheme.
    const ordo = resolveOrdo('vespers', '2026-09-09');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([134, 135, 136, 137]);
  });

  it("uses Common-of-a-Confessor-Bishop's own psalmody for St. Martin of Tours's First Vespers", () => {
    // Not 2026-11-11 (his own day itself): St. Emilian (Nov 12, plain
    // Duplex, below this override's duplex-majus+ threshold) claims First
    // Vespers over Martin's own evening (Martin, Duplex Majus, falls
    // short of keepsOwnSecondVespers's duplex-2-classis+ floor) -- so
    // Nov 11's own evening resolves to Emilian's (below-threshold, plain
    // ferial) identity instead, not Martin's. 2026-11-10 anticipates
    // Martin's own First Vespers instead (Ss. Tryphon and Companions,
    // Nov 10, plain Simplex, doesn't keep its own evening either), so
    // that evening's governing day is Martin's, duplex-majus, eligible.
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617,
    // votive=C4), 2026-08-28 -- see data/hours/vespers-psalmody-overrides/
    // categories/common-of-a-confessor-bishop.yml's own header.
    const ordo = resolveOrdo('vespers', '2026-11-10');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([109, 111, 112, 131]);
  });

  it("uses Guardian Angels' own proper psalmody on her First Vespers, same psalm numbers as Common-of-an-Angel", () => {
    // Not Guardian Angels' own day itself (Oct 2, Duplex Majus): she
    // falls short of keepsOwnSecondVespers's duplex-2-classis+ floor, and
    // Oct 3 (St. Therese of Lisieux, plain Duplex, below this override's
    // own threshold) claims First Vespers over her own evening, so Oct 2
    // itself resolves to the plain ferial Friday default instead. Oct 1
    // (St. Remigius, Simplex, doesn't keep his own evening either)
    // anticipates Guardian Angels' own First Vespers instead, which does
    // carry the override.
    //
    // Correction (2026-09-08): an earlier note here claimed her real
    // Vespers antiphons were St. Michael's own, byte-for-byte -- checking
    // the raw source file directly (Sancti/10-02.txt's own [Ant Vespera])
    // showed that was wrong; she has her own genuinely distinct proper
    // antiphons (see guardian-angels.yml). Psalm numbers happen to be the
    // same as Common-of-an-Angel's own ("Psalmi Dominica", 109-112) —
    // same feast, own text, borrowed numbers pattern seen elsewhere.
    const ordo = resolveOrdo('vespers', '2026-10-01');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([109, 110, 111, 112]);
    const firstPsalm = ordo.parts.find((p) => p.kind === 'psalm');
    expect(firstPsalm?.kind === 'psalm' ? firstPsalm.antiphon?.text.la : undefined).toContain('Angelis suis');
  });

  it("uses Common-of-a-Dedication's own psalmody on the Dedication of the Basilica of the Most Holy Saviour's own day", () => {
    // Nov 9, Duplex II. classis -- keeps its own evening regardless of
    // tomorrow (Ss. Tryphon and Companions, Simplex). Live-verified
    // against Divinum Officium (Monastic Tridentinum 1617, votive=C8),
    // 2026-08-28 -- genuinely its own scheme, not shared with any other
    // Common (see the category file's own header).
    const ordo = resolveOrdo('vespers', '2026-11-09');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([109, 110, 111, 147]);
  });

  it("uses Common-of-an-Apostle's own psalmody on St. Mark Evangelist's own day, via the common-of-an-evangelist alias", () => {
    // St. Mark (Apr 25, Duplex II. classis, common: common-of-an-
    // evangelist) has no per-feast Vespers override authored -- his own
    // reference-engine rule file says "ex C1a", and votive=C1a returned
    // byte-identical Lauds/Vespers psalmody to plain votive=C1
    // (2026-08-28), so common-of-an-evangelist is aliased onto
    // common-of-an-apostle rather than duplicated (see
    // data/hours/vespers-psalmody-overrides/categories/
    // common-of-an-apostle.yml's own header).
    const ordo = resolveOrdo('vespers', '2026-04-25');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([109, 112, 115, 138]);
  });

  it('aliases common-of-several-women-martyrs onto common-of-a-holy-woman for Vespers psalmody', () => {
    // No majus+ saint on this calendar actually carries this Common yet
    // (Ss. Perpetua and Felicity, the only one, are plain Duplex --
    // below this override's threshold), so this can't be exercised via
    // resolveOrdo/a real date; test the alias wiring directly instead.
    // Ss. Perpetua and Felicity's own reference-engine file says "vide
    // C7b", and votive=C7b returned these same four psalm numbers/
    // antiphons as plain votive=C7 (2026-08-28) -- only the Magnificat
    // antiphon differs, a separate mechanism from this psalmody table.
    const override = getVespersCommonOverride('ss-perpetua-and-felicity');
    expect(override?.id).toBe('common-of-a-holy-woman');
    expect(override?.groups.map((g) => g.psalms)).toEqual([[109], [112], [121], [126]]);
  });

  it('stays on the plain ferial default for a below-threshold feast (Semiduplex), even on its own kept evening', () => {
    // 2026-08-08 (Ss. Cyriacus/Largus/Smaragdus, Semiduplex) is below the
    // duplex-majus+ override threshold -- confirmed live against Divinum
    // Officium, which also keeps this date on the plain ferial Saturday
    // set, not any Common's own psalmody.
    const ordo = resolveOrdo('vespers', '2026-08-08');
    const numbers = ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(numbers).toEqual([144, 145, 146, 147]);
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

  // The classic weekday-default Magnificat antiphon (getMagnificatAntiphon's
  // last fallback tier, vespers-magnificat-antiphons.yml) now has no live,
  // reachable date left in this app's own calendar to exercise it through
  // resolveOrdo: every temporal id has its own proper antiphon authored
  // (the 2026-08-30 full sweep) except advent-4 (now covered date-by-date
  // by the O Antiphons for its entire practical range, see the "O
  // Antiphons" describe block below) and marian-saturday (whose own
  // Vespers is itself unreachable -- Sunday always claims First Vespers
  // over the preceding Saturday evening regardless of Sunday's own rank,
  // see calendar/vespers.ts's hasFirstVespers). See
  // tests/hours/resolve-common.test.ts's own synthetic-day unit test for
  // this fallback tier instead.

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

  it('keeps ferial psalmody on the actual calendar weekday even while the office anticipates tomorrow\'s First Vespers', () => {
    // 2026-08-25 is a Tuesday, but its evening anticipates St. Zephyrinus's
    // First Vespers (Aug 26) per the test just above -- the psalm cycle has
    // no per-feast override (see hours/vespers.ts's resolvePsalmody), so it
    // must stay on Tuesday's own group [129, 130, 131, 132], not slip to
    // Wednesday's [134, 135, 136, 137] just because the office borrowed
    // Wednesday's identity.
    const ordo = resolveOrdo('vespers', '2026-08-25');
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).toEqual([129, 130, 131, 132]);
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

  it("no longer gives St. Ubald First Vespers now that Ascension's own octave is modeled", () => {
    // Historically (live-verified against Divinum Officium, Monastic
    // Tridentinum 1617, votive=C4) St. Ubald (May 16, Semiduplex,
    // common-of-a-confessor-bishop) claims First Vespers over May 15's
    // own evening -- a real Order-III-octave permissiveness this app's
    // own `ascension.yml` (added 2026-08-26) doesn't reproduce: its
    // `octave.wins: duplex` is deliberately borrowed from Pentecost's own
    // (Order I) threshold rather than modeled per privilege-order, a
    // known, accepted conflict with this specific live-verified case
    // (see ascension.yml's own comment). Semiduplex Ubald now loses to
    // the octave outright on his own day (May 16), so May 15's evening is
    // just St. John Baptist de la Salle's (Duplex, wins May 15 itself
    // outright) own kept Second Vespers -- his own Common-of-a-Confessor
    // (not Bishop) bundle, not Ubald's Confessor-Bishop one -- with
    // Ascension's octave merely commemorated alongside him.
    const ordo = resolveOrdo('vespers', '2026-05-15');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Sir 31:8-9');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Iste Conféssor Dómini sacrátus');
  });

  it("uses St. Joseph's own real proper office bundle on his First Vespers, not common-of-a-confessor's generic one", () => {
    // St. Joseph (Mar 19, Duplex) claims First Vespers over Mar 18's own
    // evening. He now has his own real chapter/hymn (authored 2026-09-08,
    // sourced from Sancti/03-19.txt directly, Vespers falling back to the
    // same Lauds capitulum via vespersCapitulumForOverride) -- his own
    // proper content wins over common-of-a-confessor's generic bundle.
    const ordo = resolveOrdo('vespers', '2026-03-18');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Prov 28:20; 27:18');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Te, Joseph, célebrent ágmina cǽlitum');
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

  it("uses common-of-a-martyr's real office bundle for the Beheading of St. John the Baptist's First Vespers", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617)
    // votive=C2 -- see vespers-hymn-common-of-a-martyr.yml's header.
    // decollation-of-st-john-baptist.yml's own `common` field was
    // corrected from common-of-an-apostle to common-of-a-martyr (he
    // isn't an apostle; his own `minorHoursCommon` already agreed).
    const ordo = resolveOrdo('vespers', '2026-08-28');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('Jas 1:12');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Deus tuórum mílitum');
  });

  it("resolves the Nativity of St. John the Baptist's own proper Vespers psalmody (2026-06-24), not the apostle Common's", () => {
    // Regression test: nativity-of-st-john-the-baptist.yml's `common`
    // field (common-of-an-apostle) used to leak into Vespers psalmody
    // since no proper override existed. The reference engine's own
    // Second Vespers (live-verified) uses only 4 psalms (109/110/111/112),
    // each with its own proper antiphon.
    const ordo = resolveOrdo('vespers', '2026-06-24');
    const psalms = ordo.parts.filter((p) => p.kind === 'psalm') as {
      psalmNumber: number;
      antiphon?: { text: Record<string, string> };
    }[];
    const psalm109 = psalms.find((p) => p.psalmNumber === 109);
    const psalm112 = psalms.find((p) => p.psalmNumber === 112);
    expect(psalm109?.antiphon?.text.la).toContain('Elísabeth Zacharíæ');
    expect(psalm112?.antiphon?.text.la).toContain('Tu, puer');
    expect(psalms.some((p) => p.antiphon?.text.la?.includes('Cóllocet eum'))).toBe(false);
  });

  it("keeps Friday's ferial psalm numbers for the Beheading of St. John the Baptist's First Vespers (Duplex, below duplex-majus), while still using his own proper antiphons", () => {
    // Regression test, mirrors the equivalent Lauds test: decollation-of-
    // st-john-baptist.yml's own psalm numbers (109/111/112/115) must stay
    // gated at duplex-majus+ and fall back to the ferial cycle for the
    // evening's own weekday (2026-08-28 is a Friday) instead, with the
    // proper's antiphons layered on top by group index. His 4th group
    // ("Arguébat", keyed to Ps 115) has no matching slot in Friday's own
    // 3-group ferial default and is simply unused.
    const ordo = resolveOrdo('vespers', '2026-08-28');
    const psalmNumbers = ordo.parts
      .filter((p) => p.kind === 'psalm')
      .map((p) => (p.kind === 'psalm' ? p.psalmNumber : undefined));
    expect(psalmNumbers).not.toEqual(expect.arrayContaining([109, 111, 112, 115]));

    const psalms = ordo.parts.filter((p) => p.kind === 'psalm') as {
      psalmNumber: number;
      antiphon?: { text: Record<string, string> };
    }[];
    expect(psalms[0]?.antiphon?.text.la).toBe(
      'Ant. Heródes enim ténuit * et ligávit Joánnem et pósuit in cárcerem propter Herodíadem.',
    );

    const arguebat = ordo.parts.some((p) => p.kind === 'antiphon' && p.text.text.la?.includes('Arguébat'));
    expect(arguebat).toBe(false);
  });

  it("no longer gives St. Margaret of Scotland First Vespers now that Corpus Christi's own octave is modeled", () => {
    // St. Margaret of Scotland (Jun 10, Semiduplex, common-of-a-widow --
    // content itself live-verified 2026-08-26 to be real, identical to
    // Common-of-a-Holy-Woman's, see lauds-capitulum-common-of-a-holy-
    // woman.yml's header) used to claim First Vespers over Jun 9's own
    // evening. Now inside Corpus Christi's own octave (Jun 4-11, added
    // 2026-08-26, `octave.wins: duplex` -- same deliberate, accepted
    // conflict with a real Order-III-octave permissiveness as
    // ascension.yml's own St. Ubald case, see corpus-christi.yml's own
    // comment), Semiduplex Margaret loses her own day (Jun 10) outright
    // to the octave -- and Jun 9 itself is *also* inside the same
    // octave, already having lost its own Simplex saint (Ss. Primus and
    // Felicianus) to it, so neither day has any sanctoral winner left to
    // anticipate.
    //
    // Corrected 2026-09-04: Jun 9's evening does NOT fall through to the
    // plain ferial Vespers default -- that was this test's own original,
    // never-actually-verified guess, documenting the same real
    // resolveOfficeWinner gap already fixed for Ascension/Pentecost (see
    // TODO.md): a temporal-feast octave (Corpus Christi, no saint
    // record) wasn't being recognized on ordinary-feria days within it.
    // Live-verified against Divinum Officium (Monastic Tridentinum 1617,
    // 2026-06-09, "Feria Tertia infra Octavam Corporis Christi"): the
    // real content is Corpus Christi's own chapter/hymn ("ex Commune aut
    // Festo" in the source), not Trinity week's own governing default.
    const ordo = resolveOrdo('vespers', '2026-06-09');
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.citation?.en : undefined).toBe('1 Cor 11:23-24');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Pange, lingua, gloriósi');
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

  it("resolves St. Gregory the Great's own proper Vespers hymn, distinct from the Lauds one", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2033-03-12 (clean year). See lauds-capitulum-st-gregory-
    // the-great.yml's header.
    const ordo = resolveOrdo('vespers', '2033-03-12');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Anglórum jam Apóstolus');
  });

  it("resolves St. Benedict's own proper Vespers responsory/hymn", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2033-03-21, cross-checked against SanctiM/03-21.txt's own
    // [Responsory Vespera]. See lauds-capitulum-st-benedict.yml's header.
    const ordo = resolveOrdo('vespers', '2033-03-21');
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Sancte Pater Benedícte');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Láudibus cives résonent canóris');
  });

  it("resolves the Annunciation's own proper Vespers responsory ('Angelus Domini'), distinct from Common-of-the-BVM's own", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2026-03-25. See lauds-capitulum-annunciation.yml's header.
    const ordo = resolveOrdo('vespers', '2026-03-25');
    const responsory = ordo.parts.find((p) => p.kind === 'responsory');
    expect(responsory?.kind === 'responsory' ? responsory.text.text.la : undefined).toContain('Ángelus Dómini');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Ave maris stella');
  });

  it("resolves the Finding of the Holy Cross's own proper Vespers hymn ('Vexilla Regis')", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2027-05-03 (Duplex II. classis, keeps own Second Vespers).
    // See lauds-capitulum-finding-of-the-holy-cross.yml's header.
    const ordo = resolveOrdo('vespers', '2027-05-03');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Vexílla Regis pródeunt');
  });

  it("resolves the Transfiguration's own proper Vespers hymn, distinct from Lauds", () => {
    // Live-verified against Divinum Officium (Monastic Tridentinum
    // 1617), 2026-08-06. See lauds-capitulum-transfiguration.yml's
    // header.
    const ordo = resolveOrdo('vespers', '2026-08-06');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toContain('Quicúmque Christum quǽritis');
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

  it('omits the psalm Gloria Patri on Maundy Thursday and Good Friday, but keeps it on Holy Saturday evening (already Easter\'s own First Vespers)', () => {
    // Easter 2026 is Apr 5. Holy Saturday's evening is an absolute
    // exception (see resolveEveningDay's isMajorFixedFeastOfTheLord
    // override): the Vigil already belongs to Easter, not Holy Saturday,
    // so its Gloria Patri must be resolved against that anticipated
    // identity, not the raw calendar date.
    const maundyThursday = resolveOrdo('vespers', '2026-04-02');
    const goodFriday = resolveOrdo('vespers', '2026-04-03');
    const holySaturdayEvening = resolveOrdo('vespers', '2026-04-04');
    const gloriaOf = (ordo: typeof maundyThursday) =>
      ordo.parts.filter((p) => p.kind === 'psalm').map((p) => (p.kind === 'psalm' ? p.gloriaPatri : undefined));
    for (const g of gloriaOf(maundyThursday)) expect(g).toBeUndefined();
    for (const g of gloriaOf(goodFriday)) expect(g).toBeUndefined();
    for (const g of gloriaOf(holySaturdayEvening)) expect(g).toBeDefined();
  });

  it('includes the Kyrie + Our Father lead-in right after the Magnificat, before the day collect (either form)', () => {
    // 2033-09-06 is a Tuesday, plain ordinary trinitytide -- same bare
    // ferial already used above for the Magnificat weekday-default test.
    const ordo = resolveOrdo('vespers', '2033-09-06');
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
    const ordo = resolveOrdo('vespers', '2033-09-06');
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

describe('resolveOrdo("vespers", ...) O Antiphons (Dec 17-23)', () => {
  it('uses the date-keyed O Antiphon instead of the enclosing Advent week\'s own Magnificat antiphon', () => {
    // Regression test for the 2026-08-30 Magnificat-antiphon gap: 2026-12-19
    // (a Saturday, genuinely clean -- no saint on this date, see
    // data/calendar/sanctoral-calendar.yml) falls within whichever Advent
    // week governs that year (advent-3 or advent-4), but the O Antiphon
    // "O radix Jesse" must win regardless of which week id that is --
    // see vespers-o-antiphons.yml's own header for why these seven can't
    // live in a per-week temporal-proper file.
    const ordo = resolveOrdo('vespers', '2026-12-19');
    const magnificat = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'magnificat');
    expect(magnificat?.kind === 'canticle' ? magnificat.antiphon?.text.la : undefined).toContain('radix Jesse');
    const magnificatIndex = ordo.parts.indexOf(magnificat!);
    const closingAntiphon = ordo.parts[magnificatIndex + 1];
    expect(closingAntiphon?.kind === 'antiphon' ? closingAntiphon.text.text.en : undefined).toContain('Root of Jesse');
  });

  it("gives the O Antiphon absolute priority for the Magnificat slot even over a real sanctoral winner (St. Thomas, Dec 21, Duplex II. classis), while leaving the rest of his own office untouched", () => {
    // Direct user instruction (2026-08-30): the O Antiphon always wins
    // the Magnificat slot on Dec 17-23, full stop, regardless of who
    // otherwise wins the day -- St. Thomas still wins everything else
    // about Dec 21 (his own chapter/responsory/hymn/versicle, confirmed
    // below), just not this one text. See vespers-o-antiphons.yml's own
    // header for the reasoning (a deliberate app-level design choice, not
    // a reconstruction of the reference engine's own Dec 21 behavior).
    const ordo = resolveOrdo('vespers', '2026-12-21');
    const magnificat = ordo.parts.find((p) => p.kind === 'canticle' && p.canticleId === 'magnificat');
    expect(magnificat?.kind === 'canticle' ? magnificat.antiphon?.text.la : undefined).toContain('Oriens');
    expect(magnificat?.kind === 'canticle' ? magnificat.antiphon?.text.en : undefined).toContain('Dayspring');
    // The rest of his own office is untouched by this.
    const chapter = ordo.parts.find((p) => p.kind === 'chapter');
    expect(chapter?.kind === 'chapter' ? chapter.text.status.la : undefined).not.toBe('missing');
    const hymn = ordo.parts.find((p) => p.kind === 'hymn');
    expect(hymn?.kind === 'hymn' ? hymn.text.text.la : undefined).toBeTruthy();
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
