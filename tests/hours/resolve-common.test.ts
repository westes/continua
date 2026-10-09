import { lookupPart } from '../../src/hours/resolve-part';
import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import {
  getDayCollect,
  getBenedictusAntiphon,
  getMagnificatAntiphon,
  resolveMinorHourAntiphon,
  splitNamedAntiphon,
} from '../../src/hours/resolve-common';
import type { LiturgicalDay, Season } from '../../src/calendar/types';
import vespersMagnificatAntiphonsData from '../../src/data/hours/vespers-magnificat-antiphons.yml';

function syntheticSanctoralDay(id: string, season: Season = 'trinitytide'): LiturgicalDay {
  return {
    date: '2026-01-01',
    weekday: 'thursday',
    season,
    temporalCategory: 'ordinary-feria',
    winner: { kind: 'sanctoral', id, name: id, rank: 'simplex' },
    commemorations: [],
  };
}

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

  it("resolves St. Lucy's own collect, read directly from her source file rather than a shared template (2026-08)", () => {
    // Her own [Oratio] is @Commune/C7a, unedited -- unlike
    // collect-c6a.yml's own C7a-derived text, no "Vírginis tuæ" insertion
    // -- so her own [Name] section supplies the whole descriptive phrase,
    // making her file's own text effectively proper even though it's
    // built from a Common formula underneath. No English in the source at
    // all, so status.en stays draft.
    const day = resolveDay('2025-12-13');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-lucy' });
    const collect = getDayCollect(day);
    expect(collect.status).toEqual({ la: 'verified', en: 'draft' });
    expect(collect.text.en).toContain('Lucy');
  });

  it('resolves as honestly missing for a saint with neither a proper collect nor a Common fallback authored', () => {
    // Every real saint in data/calendar/saints/*.yml now has either a
    // proper collect or a collectCommon fallback (see TODO.md's
    // Kalendaria-table pull, 2026-08) -- so this exercises the "missing"
    // path with a synthetic winner rather than hunting for a real
    // example that no longer exists.
    const collect = getDayCollect(syntheticSanctoralDay('example-confessor'));
    expect(collect.status.la).toBe('missing');
    expect(collect.status.en).toBe('missing');
  });
});

describe('genuinely unwinnable stubs still get a Benedictus antiphon (2026-08)', () => {
  // These saints are always commemorated, never the day's own rendered
  // title (see e.g. st-marcus.yml's own comment) -- so unlike the rest of
  // this project's content, their own [Ant 1] (or lack of one) had to be
  // pulled directly from source rather than confirmed against a live
  // Lauds query, since no such query is ever possible for them. A
  // synthetic winner is used here for the same reason: resolveDay would
  // never actually pick one of these as day.winner.
  it("resolves via its Common category when the saint's own file has no [Ant 1] at all", () => {
    // St. Marcus -- [Rule] says "vide C4b" with no override; C4b is a
    // whole-file inherit of C4 (just the title relabeled "of the Popes"),
    // the same family already live-query-verified for
    // common-of-a-confessor-bishop.yml.
    const ben = getBenedictusAntiphon(syntheticSanctoralDay('st-marcus'));
    expect(ben.status).toEqual({ la: 'verified', en: 'verified' });
  });

  it('resolves via a cross-referenced Common category (C7 -> Commune/C6:Ant 2)', () => {
    // St. Felicitas -- [Rule] says "vide C7", a category this project
    // hadn't touched before; C7's own [Ant 1] is itself a reference to
    // Commune/C6:Ant 2, which resolves to text byte-identical to
    // common-of-a-virgin's own already-verified Benedictus antiphon.
    const ben = getBenedictusAntiphon(syntheticSanctoralDay('st-felicitas'));
    expect(ben.status).toEqual({ la: 'verified', en: 'verified' });
  });

  it('resolves via the same fallback for a saint from the *original*, pre-Kalendaria-table 109-saint pass', () => {
    // St. Frances of Rome and St. Bibiana predate the 94-saint batch's
    // collectCommon/common mechanism entirely, but the same
    // file-read method applies once a fileref is derived for them too --
    // Frances of Rome's own file points to C7a (a whole-file inherit of
    // C7, just relabeled "of a Widow"), resolving to the same
    // common-of-a-virgin text as St. Felicitas above.
    const ben = getBenedictusAntiphon(syntheticSanctoralDay('st-frances-of-rome'));
    expect(ben.status).toEqual({ la: 'verified', en: 'verified' });
  });
});

describe('common for the *whole* calendar, not just the 94-saint batch (2026-08)', () => {
  it("reuses another saint's own proper P/T/S/N wholesale when [Rule] points at their file directly, not a Commune category", () => {
    // Finding of St. Stephen -- her own [Rule] is "vide Sancti/12-26"
    // (St. Stephen Protomartyr's own Dec 26 file), not a Commune
    // reference at all, so common is his own id
    // (st-stephen-protomartyr) -- reuses his already-authored proper
    // files directly, same pattern as common-of-st-peter earlier.
    const day = resolveDay('2026-08-03');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'finding-of-st-stephen' });
    expect(resolveMinorHourAntiphon('prime', day, {}).status.la).toBe('verified');
  });

  it('a Doctor of the Church can have genuinely unique proper P/T/S/N, not shared with any Common', () => {
    // St. Gregory the Great -- his own [Rule] says "vide C4a" (Doctor),
    // the same reference 5 of the 6 other Doctor saints on this
    // calendar have too, but his own live-rendered P/T/S/N is real,
    // unique text ("Beátus Gregórius in cáthedra Petri...") -- not
    // shared with common-of-a-confessor-bishop.yml the way St. Hilary
    // of Poitiers's, St. Athanasius's, etc. all are (see
    // st-hilary-of-poitiers.yml's own comment).
    const day = resolveDay('2033-03-12');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-gregory-the-great' });
    const prime = resolveMinorHourAntiphon('prime', day, {});
    expect(prime.status.la).toBe('verified');
    expect(prime.text.la).toContain('Gregórius');
  });

  it('most Doctor-of-the-Church saints share common-of-a-confessor-bishop despite their own [Rule] pointing at C4a (Doctor)', () => {
    const day = resolveDay('2026-01-14'); // St. Hilary of Poitiers
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-hilary-of-poitiers' });
    const prime = resolveMinorHourAntiphon('prime', day, {});
    expect(prime.status.la).toBe('verified');
    expect(prime.text.la).toContain('Ecce sacérdos magnus');
  });

  it('the last 2 duplex-majus+ saints held back from the original 29-saint P/T/S/N pass now have their own proper content too', () => {
    // St. Benedict and All Saints of the Benedictine Order were excluded
    // from that earlier pass for lacking a collect at the time (see
    // TODO.md); now that they have one, they get the same individual
    // live-query treatment as their peers -- own real text, not a shared
    // Common, matching their rank.
    const day = resolveDay('2033-03-21'); // St. Benedict
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-benedict' });
    const terce = resolveMinorHourAntiphon('terce', day, {});
    expect(terce.status).toEqual({ la: 'verified', en: 'draft' });
    expect(terce.text.la).toContain('Benedíctus');
  });

  it("resolves its own file's [Ant 1] as draft, not verified, when it can't be checked against a live rendering", () => {
    // Ss. Euphemia, Lucy, and Geminian -- her own file *does* have an
    // [Ant 1], but St. Alexius (a winnable saint checked earlier in this
    // same 2026-08 pass) proved a real [Ant 1] doesn't always end up the
    // rendered Benedictus antiphon either (his own live Lauds query uses
    // common-of-an-abbot's text instead) -- so a raw-file [Ant 1] read is
    // never enough on its own to claim `verified`, and even less so for a
    // saint no live query can ever confirm.
    const ben = getBenedictusAntiphon(syntheticSanctoralDay('ss-euphemia-lucia-and-geminianus'));
    expect(ben.status).toEqual({ la: 'draft', en: 'draft' });
    expect(ben.text.la).toContain('Gaudent');
  });

  it("follows a saint's own propers-redirect for P/T/S/N too, not just the collect/Benedictus antiphon", () => {
    // St. Michael's propers points at Apparition of St. Michael's own id
    // (the two are word-for-word identical, see st-michael.yml), but
    // getMinorHourOverrideId keys off the day's own winner id
    // ("st-michael" itself) rather than following propers the way
    // getDayCollect/getBenedictusAntiphon do -- a real gap a final
    // calendar-wide sweep caught, fixed the same way as Finding of St.
    // Stephen: common points directly at his delegate's id.
    const day = resolveDay('2028-09-29');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-michael' });
    const prime = resolveMinorHourAntiphon('prime', day, {});
    expect(prime.status.la).toBe('verified');
  });
});

describe('common fallback (2026-08, the 94 propers:null saints)', () => {
  it('a below-duplex-majus saint still gets a real Benedictus antiphon and P/T/S/N content via its Common category', () => {
    // St. Anacletus, Semiduplex -- below the duplex-majus+ threshold that
    // gates a *proper* psalmody override (hours/lauds.ts's
    // getPsalmodyOverrideFor), but getMinorHourOverrideId no longer
    // requires that threshold for the shared-Common fallback (see its own
    // doc comment for why: live-querying confirmed even a winning Simplex
    // saint keeps proper/Common minor-hour content, not the ferial
    // default).
    const day = resolveDay('2028-07-13');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-anacletus' });
    expect(getBenedictusAntiphon(day).status).toEqual({ la: 'verified', en: 'verified' });
    expect(resolveMinorHourAntiphon('prime', day, {}).status.la).toBe('verified');
    expect(lookupPart({ day, hour: 'terce', part: 'chapter', temporalKeys: ['ferial'] }).status.la).toBe('verified');
  });

  it('a Duplex-II-classis saint with no proper minor-hour content of its own still resolves via the Common, not just below-majus saints', () => {
    // Ss. Simon and Jude -- confirms the fallback isn't only
    // reached by low ranks; a real major feast with no *proper*
    // Prime/Terce/Sext/None file authored falls through to its
    // common (common-of-an-apostle) exactly the same way.
    const day = resolveDay('2025-10-28');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'ss-simon-and-jude' });
    expect(resolveMinorHourAntiphon('none', day, {}).status.la).toBe('verified');
  });
});

describe('the 26 propers-set saints from the 94-saint batch (2026-08)', () => {
  it('a saint with a genuine proper collect can still share its Benedictus antiphon with a Common category (common)', () => {
    // Ss. Dionysius and Companions -- own proper collect (propers is
    // set), but live-verified byte-identical to common-of-several-
    // martyrs's Benedictus antiphon, so getBenedictusAntiphon falls
    // through to common rather than a nonexistent
    // ss-dionysius-and-companions-antiphon.yml.
    const day = resolveDay('2025-10-09');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'ss-dionysius-and-companions' });
    expect(getBenedictusAntiphon(day).status).toEqual({ la: 'verified', en: 'verified' });
  });

  it("a saint with genuinely unique Benedictus antiphon text resolves its own proper file, not a Common", () => {
    // St. Benedict -- own proper text ("Sanctíssime Conféssor Dómini...",
    // st-benedict-antiphon.yml), sourced from the source's Latin-only
    // page (no English rendering, same gap as St. Scholastica's), so
    // English is a translation and stays `draft`.
    const day = resolveDay('2025-03-21');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-benedict' });
    const ben = getBenedictusAntiphon(day);
    expect(ben.status).toEqual({ la: 'verified', en: 'draft' });
    expect(ben.text.la).toContain('Benedícte');
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

describe('Paschaltide alleluia suffix on Common-category antiphons (2026-08)', () => {
  // Live-query-verified (St. Athanasius/Confessor-Bishop, St. Robert/Abbot,
  // St. Catherine of Siena/Virgin): a Common category with no dedicated
  // wholesale-different Paschaltide text still gets a mechanical single
  // ", allelúja"/", alleluia" appended to its otherwise-unchanged base text
  // during Eastertide/Ascensiontide/Pentecost-octave-week. St. Ambrose
  // (common-of-a-confessor-bishop, propers: null) exercises the Common
  // fallback branch directly rather than a per-saint proper file.
  it("appends the seasonal alleluia to a Common Benedictus antiphon in Paschaltide", () => {
    const eastertide = getBenedictusAntiphon(syntheticSanctoralDay('st-ambrose', 'eastertide'));
    expect(eastertide.text.la).toBe(
      'Euge, serve bone * et fidélis, quia in pauca fuísti fidélis, supra multa te constítuam, dicit Dóminus, allelúja.',
    );
    expect(eastertide.text.en).toBe(
      'Well done, thou good and faithful servant * thou hast been faithful over a few things, I will make thee ruler over many things, saith the Lord, alleluia.',
    );
    expect(eastertide.status).toEqual({ la: 'verified', en: 'verified' });
  });

  it('leaves the same Common Benedictus antiphon unchanged outside Paschaltide', () => {
    const ordinary = getBenedictusAntiphon(syntheticSanctoralDay('st-ambrose', 'trinitytide'));
    expect(ordinary.text.la).toBe(
      'Euge, serve bone * et fidélis, quia in pauca fuísti fidélis, supra multa te constítuam, dicit Dóminus.',
    );
    expect(ordinary.text.la).not.toContain('allelúja');
  });

  it('appends the suffix on the minor-hour Common fallback too (ascensiontide, not just eastertide)', () => {
    const prime = resolveMinorHourAntiphon('prime', syntheticSanctoralDay('st-ambrose', 'ascensiontide'), {});
    expect(prime.text.la?.endsWith('allelúja.')).toBe(true);
    expect(prime.text.la).not.toMatch(/allelúja.*allelúja/); // never doubled for this category
  });

  it("doesn't double up on a Common category whose stored text is already the (unavoidably Paschaltide-only) native text", () => {
    // common-of-pope-martyrs (Ss. Soter and Caius) -- its own stored files
    // were necessarily captured from a live query already inside
    // Paschaltide (see TODO.md: their fixed dates can only ever land in
    // real Eastertide or the Sacred Triduum, never elsewhere), so the
    // text already ends "allelúja, allelúja." -- appending again would be
    // wrong.
    const day = syntheticSanctoralDay('ss-soter-and-caius', 'eastertide');
    const benedictus = getBenedictusAntiphon(day);
    expect(benedictus.text.la).toBe(
      'Fíliæ Jerúsalem, * veníte et vidéte Mártyres cum corónis, quibus coronávit eos Dóminus in die solemnitátis et lætítiæ, allelúja, allelúja.',
    );
    expect(benedictus.text.la?.match(/allelúja/g)?.length).toBe(2);
  });
});

describe('getMagnificatAntiphon — classic weekday-default fallback', () => {
  it('falls back to the classic weekday-quote antiphon for a plain temporal id with no proper Magnificat antiphon of its own', () => {
    // Synthetic day, not a real resolveOrdo/resolveDay date: after the
    // full temporal-cycle Magnificat-antiphon sweep (2026-08-30, see
    // TODO.md), every real temporal id this app's calendar can actually
    // land Vespers on has its own proper antiphon authored (or is covered
    // date-by-date by the O Antiphons, Dec 17-23 -- see
    // vespers-o-antiphons.yml), so there's no live date left to exercise
    // this fallback tier through the real pipeline any more -- see
    // tests/hours/vespers.test.ts's own note where this test used to
    // live. Tests the mechanism directly instead, the same way this
    // file's other synthetic-day cases do.
    //
    // `date` deliberately isn't Jan 1 any more (2026-09-06): getMagnificatAntiphon
    // now also falls back to `resolveTemporalId(day.date)`'s own antiphon
    // (see resolve-common.ts's getTemporalProperWithFallback, added for
    // the Passiontide/movable-feast content-completeness pass) before the
    // classic weekday default -- Jan 1 resolves to `christmas-octave-
    // sunday`, which now has real content, so that fallback tier fired
    // first and hid the one this test means to exercise. `vigil-of-
    // christmas` (Dec 24) is one of the few remaining coarse ids with no
    // magnificat-antiphon file of its own (see saturday-passion-week.yml/
    // holy-saturday.yml for why: an anticipated First Vespers, not an
    // oversight), so it still reaches the true weekday-default tier.
    const day: LiturgicalDay = {
      date: '2026-12-24',
      weekday: 'tuesday',
      season: 'trinitytide',
      temporalCategory: 'ordinary-feria',
      winner: { kind: 'temporal', id: 'not-a-real-temporal-id' },
      commemorations: [],
    };
    const magnificat = getMagnificatAntiphon(day);
    expect(magnificat.text.la).toContain('Exsúltet');
    expect(magnificat.status.la).toBe('verified');
  });

  it('has no weekday default for Sunday (its own antiphon varies by Proper of the Time)', () => {
    // Can no longer be exercised end-to-end through getMagnificatAntiphon
    // with any real date at all, even a synthetic-winner one: after the
    // full-sweep pass that closed every remaining Magnificat-antiphon gap
    // (2026-09-14, see TODO.md) every real date's own resolveTemporalId
    // fallback *and* every reachable active-octave saint now has real
    // content of their own, so tier 2 (or the octave-driven sanctoral
    // branch) always wins before this tier is ever reached for a real
    // date -- a previous version of this test relied on 2026-01-04
    // landing inside the (at the time still-unauthored) Holy Innocents
    // octave to observe 'missing' here; that octave now resolves to real
    // content too, so the same date no longer demonstrates this. Assert
    // the underlying invariant directly instead: vespers-magnificat-
    // antiphons.yml's own header documents Sunday's entry as deliberately
    // absent (its antiphon varies by that Sunday's own Proper of the
    // Time, not a fixed weekly default).
    expect(vespersMagnificatAntiphonsData).not.toHaveProperty('sunday');
  });
});
