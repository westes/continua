# Open work

A real backlog, not scattered code comments. Update this file when something
here gets done, and add to it when new gaps turn up — don't let it drift back
into "only findable by reading commit messages."

## Priority

Work in this file follows one methodology, repeated every time a new hour or content type
gets built: **mechanism first, then a minimal live-verified proof (1-2 clean dates/entries
authored fully, end-to-end) to confirm the mechanism is right, then bulk content
authoring/import against the whole calendar once it's trusted.** A section marked "mechanism
built" but not yet "full sweep" or "all N done" is mid-pipeline, not stalled — its next work
is more content in the same already-proven shape, not a design change. This file's dated
build log (below "Open work, in priority order") is the record of that pipeline running
across every hour and content type in this app.

## Open work, in priority order

1. **Mechanism gaps** — a real design/code piece not built yet, blocking any content pass on
   it from starting:
   - Easter's own octave — tabled, "a whole different discussion."
   - What "a Gospel reading is its own kind" should mean structurally/in the UI, beyond the
     `isGospel` flag on a plain Matins `lesson` — open; deferred until there's a UI to
     evaluate it against.
   - Date picker: `day-nav.ts` currently only steps a day at a time (prev/next); there's no
     way to jump to an arbitrary date without walking there one day at a time or editing the
     URL. Needs a calendar-grid picker UI — open, not started.
   - Audio ("read it to me") interface: a button per hour/text that plays the office aloud
     instead of requiring reading — e.g. via the Web Speech API (`SpeechSynthesis`), which
     would keep this offline-first (no server-side TTS call, no added deploy dependency) but
     needs bilingual voice selection (La/En) worked out, and quality for Latin pronunciation
     is an open question. Open, not started — needs its own design pass before content/UI work
     begins.
   - ~~Matins: "Te decet laus"~~ — done (2026-08-23). Added as a new common text
     (`data/propers/common/te-decet-laus.yml`, sourced from `Psalterium/Common/Prayers.txt`'s
     `[Te decet]` block) rendered as a `versicle` part immediately after the Te Deum on every
     3-nocturn day (Sunday or Duplex+), in both `hours/matins.ts` branches that push a Te Deum.
     Not modeled: the historical Gospel-read-again-in-full step that live-precedes it (a
     pre-existing, separate known simplification — see
     `data/propers/nocturn-readings/post-pentecost-15.yml`'s own header comment). Absent on
     ferial (1-nocturn) days, same gating as the Te Deum itself. `tests/hours/matins.test.ts`
     covers both the Sunday branch's presence/content and the ferial branch's absence.
   - ~~Matins nocturn-readings responsory formatting~~ — done (2026-08-23), see "Nocturn-
     readings responsory marker fix" below.
   - ~~Lauds/Vespers ferial Preces psalms~~ — done (2026-08-23). Psalm 129 (De profundis) and
     its own trailing Gloria Patri deleted wholesale from
     `data/propers/common/lauds-preces-feriales.yml`'s `text.la`/`text.en`; Psalm 50 (Miserere)
     and its own Gloria Patri likewise from `vespers-preces-feriales.yml`. Surrounding V/R
     litany needed no adjustment — the psalm block sat between two already-independent V/R
     sequences. Both files' header comments updated to flag the drop as deliberate, not a
     transcription gap. `tests/hours/lauds.test.ts` and `vespers.test.ts` updated to
     distinguish the fuller ferial Preces from the short Sunday/feast litany via a versicle
     that survives the psalm's removal ("Ego dixi: Dómine, miserére mei") instead of the now-
     absent psalm text.

2. **Minimal-proof-done, bulk content pending** — mechanism is built and trusted (a proof
   date/entry already resolves correctly end-to-end); what's left is authoring/importing more
   content in that same shape across the rest of the calendar:
   - Latin saint/octave/named-feast names for the bilingual date/day-label header (see
     "Bilingual, merged date/day-label header" below) — the `{en, la}` mechanism is built and
     every proper name falls back to English gracefully, but zero saints, octaves, or named
     temporal feasts have an authored Latin name anywhere in `src/data/**`. Weekday names,
     month names, rank labels, and season/ordinal phrasing already have real Latin.
   - Matins: bible-plan TSV bulk conversion is done (see "Bible-plan TSV — bulk conversion
     done" below) — not yet added to a test table, though (unlike sanctoral/temporal content)
     there's no reference breviary to spot-check this plan against by design. Still open:
     author patristic/hagiographic
     readings for every saint where one can be sourced — no longer Duplex+-gated, content is
     pooled and shown regardless of rank (see "Reading-pool redesign"); expand the per-book
     Matins responsory pool beyond its one seeded book (`isa`). The pre-1955-but-post-1617
     saints (Tridentine/Divino Afflatu-sourced, no Monastic 1617 track) are now done — see
     "Pre-1955 saints' Matins readings" below. The larger pool of saints that *do* have a
     Monastic 1617 track (`SanctiM/`) is now also done — see "SanctiM-track saints' Matins
     readings" below — all 12 months complete, 133 saints authored, the rest correctly left
     unauthored as Common-only/no-content cases.
   - Matins: the **temporal-cycle** side of this same gap (as opposed to the sanctoral side
     above) — the post-Pentecost season (`post-pentecost-01` through `-24`) is now fully
     authored (see "Temporal-cycle nocturn-readings sweep" below); the rest of the year's
     temporal ids (Advent, Christmastide, post-Epiphany, Septuagesima through Lent/Passiontide,
     Eastertide) still have no Nocturn 2/3 content of their own — same shape of gap, not yet
     started.
   - The bulk Vulgate (Latin) + Douay-Rheims (English) scripture import into
     `src/data/scripture/` — long-term project, explicitly deferred; Matins scripture
     citations resolve to `missing` text until it lands.
   - Matins psalmody overrides for a Duplex+ weekday feast (see "Matins psalmody overrides"
     below): mechanism refactored to category-keyed (`categories/*.yml` + `saints/*.yml`), five
     categories authored (Common of a Martyr via St. Lawrence, Common of an Apostle via St.
     Andrew, Common of a Confessor via St. Francis of Paola, Common of a Confessor-Bishop via
     St. Basil the Great, Common of Several Martyrs — the largest single category by population,
     40 saints/groups — via Ss. Fabian and Sebastian). Every other Common category (Virgin,
     Doctor, Abbot, etc.) still falls back to the plain ferial weekday table, redistributed into
     3 nocturns, until its own category's real psalmody is authored.
   - The four "Commemoratio Octavæ" Ant+V/R+collect blocks (Christmas Octave's own
     Nativity/Stephen/John/Holy-Innocents commemorations, e.g. on Dec 30) are now done —
     see "Octave content" below. St. Frances of Rome's/
     St. Bibiana's Benedictus antiphons and Ss. Ursula and Companions' were also once flagged
     here — the first two turned out already resolved (verified live, see memory
     `vu-todo-priority`'s own correction note), the third is a settled non-gap (no unique text
     exists to author, see her own file's comment) — not carried forward as open items.
     Five "fixed Lord's/BVM feast, not modeled" exclusions across the calendar (Our Lady of the
     Snows, the Finding of the Holy Cross, the Transfiguration, the Exaltation of the Holy
     Cross, the Dedication of the Lateran, the Presentation of the BVM) turned out to be the
     same stale mistake repeated six times — all six now added with real content; see "Our
     Lady of the Snows added" and "Four more 'not modeled' fixed Lord's/BVM feasts added"
     below.
   - Lauds/Vespers chapter/responsory/hymn/versicle bundle (see "Lauds/Vespers chapter-
     responsory-hymn-versicle bundle" below): mechanism is now rank-agnostic (any sanctoral
     winner falls back to their Common, not just duplex-majus+); one category authored so far
     (Common-of-a-Confessor-Not-Bishop, via St. Louis/St. Nicholas of Tolentino). The other 10
     Common categories (Confessor-Pope, Confessor-Doctor, Virgin, Virgin-Martyr, Abbot, Holy
     Woman, Widow, Angel, Evangelist, and the smaller one-off Commons) still fall back to the
     plain seasonal/ferial default until their own bundle is authored.

3. **Known, deliberate simplifications** — flagged as intentional, not a bug, no plan to
   revisit unless priorities change: see "Known, deliberate simplifications" at the end of
   this file, plus the Matins "Duo Seraphim" closing-responsory gap and the 5 Vespers hymns
   whose seasonal doxology substitution isn't modeled (both flagged in their own sections
   below, not repeated here).

Everything from here down is the dated build log this priority list is drawn from — kept for
the sourcing/verification detail behind each decision, not itself in priority order.

## Content gaps — mechanism built, data incomplete

### Lauds psalmody overrides + office-bundle overrides — done (2026-08)

Mechanism: `src/hours/lauds-psalmody-overrides.ts`, gated in
`hours/lauds.ts`'s `getPsalmodyOverrideFor`; office bundle
(`lauds-capitulum-/-responsory-/-hymn-/-versicle-<id>.yml` in
`data/propers/common/`) falls back to the plain weekday bundle
independently of whether the psalmody override exists. Fires for a saint
ranked duplex-majus or higher, or a named temporal feast
(`marian-saturday`, `christ-the-king`, `christmas-octave-sunday`).

**Authored — all 28 non-`propers: null` duplex-majus+ saints/temporal
ids, plus the 4 already done going in (`st-lawrence`, `marian-saturday`,
`christ-the-king`, `christmas-octave-sunday`) — full 32/32.** Same
methodology as the P/T/S/N batch: one live `command=prayLaudes` query per
saint's own already-established clean date, Monastic Tridentinum 1617.
Extraction automated this time via a purpose-built HTML parser
(`scratchpad/parse_lauds_html.py`, not committed — a one-off tool, not
application code) after manual grep/sed proved too slow at this volume;
cross-validated against 5 saints' worth of already-known-correct content
before trusting it for the rest, then spot-checked further plus an
automated la==en/HTML-leftover sweep across all 28 outputs. Verified
end-to-end with a runtime smoke test resolving each id's actual
`getLaudsPsalmodyOverride` + all four bundle parts through the real
mechanism, not just checking the YAML files exist.

The 5 antiphons cycle through a fixed pool matching the psalm scheme
every one of these major feasts uses ("Psalmi Dominica"): psalms
92/99/62, the Canticle of the Three Young Men, then the Laudate group
(Ps 148-150, one shared antiphon) — confirmed via the reference engine's
own psalm-number labels, not assumed. This is the *same* 5-antiphon pool
Prime/Terce/Sext/None draw from (Prime=group 1, Terce=2, Sext=3, None=5,
skipping the canticle's own group 4) — real, confirmed structurally (see
St. Scholastica below), not a coincidence.

St. Scholastica needed the same treatment as her P/T/S/N content: no
English exists in the reference engine's data for her Lauds antiphons,
capitulum, versicle, or hymn. Four of her five antiphons and her
capitulum reuse the exact English already translated and verified for
her Terce/Sext/None content (confirmed same Latin, since Lauds and the
minor hours share this pool); the canticle antiphon, versicle, and
6-stanza hymn ("Jam noctis umbræ cóncidunt") are newly translated here.
**Real gap surfaced by this: the Lauds psalmody-override schema
(`hours/lauds.ts`'s `BilingualText`) has no per-language status field the
way `hours/resolve-common.ts`'s `ResolvedText` does** — `psalmParts`
unconditionally wraps every psalmody antiphon in `verifiedText()`, so her
self-translated antiphon English can't carry the "draft" marker
(`.text-draft`) the same content does at Prime/Terce/Sext/None. Flagged
here, not fixed — would need `BilingualText` (or the override schema
generally) to carry a status field through to `psalmParts`/`resolvePsalmody`.

### Prime/Terce/Sext/None minor-hour overrides (2026-08, new mechanism)

Found while investigating why St. Lawrence's octave showed none of his own
content at Prime/Terce/Sext/None either — these four hours had *no*
per-feast override mechanism at all before this, unlike Lauds: the psalm
antiphon always came from the plain weekday default
(`data/hours/{hour}-antiphons.yml`), and the chapter was always a single
fixed per-annum/per-weekday text, regardless of what was actually being
celebrated — even on a saint's own actual feast day, not just during an
octave.

Mechanism: `hours/resolve-common.ts`'s `getMinorHourOverrideId` (same
duplex-majus+ threshold as Lauds' own override, deliberately kept in sync
so it's one shared backlog, not per-hour lists that can drift — see
`resolveOfficeWinner`, which makes this octave-aware the same way Lauds'
already is), `resolveMinorHourAntiphon`, `resolveMinorHourChapter`. Prime
additionally needed `isSundayOrFeastOffice` (its capitulum/Preces choice
between Sunday/feast and ferial forms) made octave-aware — live-verified
Prime's capitulum stays the Sunday/feast form (1 Tim 1:17) throughout an
octave, not just the feast's own actual day, so no separate override file
was needed there, just the existing Sunday-form file reached correctly.

**Authored — all 29 duplex-majus+ saints, done (2026-08).** Antiphon +
chapter for Terce/Sext/None, antiphon only for Prime (its chapter needed
no new file — see above), for every id in the Lauds backlog list above
except the 5 `propers: null`-blocked saints (`st-benedict`,
`all-saints-of-the-benedictine-order`, `st-michael`, `st-maurus-abbot`,
`ss-placid-and-companions`) — those still need a collect authored first.
Two saints (`st-scholastica`, `immaculate-conception`) needed corrections
to the reference engine's own data: Scholastica's minor hours have no
English rendering at all in the source (Matins-only English coverage for
that saint) — translated directly, `status.en: draft` throughout;
Immaculate Conception's antiphons render with diacritics stripped
compared to the word-for-word-parallel Nativity BVM antiphon — restored
accentuation to match, `status.la: draft`.

### Prime/Terce/Sext/None Commons extraction (2026-08)

After the P/T/S/N batch above landed, a systematic diff across all 29
saints' files (not just the pairs noticed in passing during authoring)
turned up real shared-Common groups, extracted into `data/propers/common/
{hour}-antiphon-common-of-*.yml` / `{hour}-capitulum-common-of-*.yml`
files and wired via a new `SaintRecord.minorHoursCommon` field
(`calendar/feasts.ts`) — `resolveMinorHourAntiphon`/`resolveMinorHourChapter`
(`hours/resolve-common.ts`) now fall back to it when a saint has no proper
file of their own for a given hour. Deliberately a *separate* field from
the existing (until now unused) `common` field: live-verified the minor
hours don't always draw from the same Common category as the saint's
overall classification (see the Confessor-Bishop group below) — reusing
`common` directly would have gotten that case wrong.

Four groups extracted, all confirmed byte-identical via `diff` first, none
assumed from category alone:

- **`common-of-apostles`** (all 4 hours, antiphon + chapter): st-matthias,
  st-barnabas, st-james-the-greater, st-thomas-apostle, ss-simon-and-jude,
  st-luke, st-matthew, st-bartholomew — 8 saints, 56 duplicate files
  collapsed to 7 shared ones.
- **`common-of-a-confessor-bishop`**: chair-of-st-peter-at-rome and
  chair-of-st-peter-at-antioch share all 4 hours' antiphons *and*
  chapters; st-martin-of-tours shares only the chapters (his own
  antiphons are proper, about his own life). Real finding, not a
  modeling choice: both Chair feasts are `common: common-of-an-apostle`
  in their own saint record (Peter's rank/collect classification), but
  their P/T/S/N content comes from the Common of a Confessor Bishop
  instead — Peter considered *as bishop* of that particular see, for
  that specific commemoration.
- **`common-of-the-bvm`** (chapter only, Terce/Sext/None): nativity-bvm
  and immaculate-conception share all three; their own antiphons stay
  proper (per-mystery). The Assumption's Sext/None chapters share the
  same *reading body* (Sir 24:15-16, 24:19-20) but close with her own
  proper versicles rather than the Common's plain ones, and her Terce
  chapter is a different reading entirely (Sir 24:11-12, not 24:14) — a
  first-class feast's proper office outranking the plain Common, kept as
  her own fully proper files rather than force-fit into the shared one.
- **`common-of-st-peter`** (None antiphon, all 3 chapters): st-peter-ad-
  vincula and ss-peter-and-paul. Not a real liturgical Common category —
  both feasts are specifically about St. Peter himself, so his own
  proper texts get reused directly. Extracted anyway since the content
  really is identical, just named honestly rather than dressed up as a
  Common of Saints class.

### Paschaltide commons — done (2026-08)

The Mark/John-Before-the-Latin-Gate/Philip-and-James "Alleluia" text
flagged above as an open question is confirmed real, not a coincidence:
the reference engine's own source has explicit Paschaltide variants —
`Commune/C1p.txt`/`C2p.txt`/`C3p.txt` ("Commune Apostolorum/Unius
Martyris Pontificis/Plurimorum Martyrum tempore Paschali") — for exactly
3 of its 12 Common categories: Apostles, a Martyr-Bishop, Several
Martyrs. Confessors/Virgins/Doctors/BVM never get one — Alleluia/victory
imagery is restricted to apostles and martyrs specifically, a real
liturgical distinction, not an app gap.

Mechanism: `resolveMinorHourAntiphon`/`resolveMinorHourChapter`
(`hours/resolve-common.ts`) now try `${hourId}-antiphon-
${minorHoursCommon}-paschaltide` (etc.) first whenever `day.season` is
`eastertide`, `ascensiontide`, or `pentecost` — the same three-season
window as Compline's own Regina Caeli table
(`data/hours/marian-antiphon-by-season.yml`), not just `eastertide`
alone, since "tempore paschali" runs through the Pentecost octave in
both cases. Falls back to the plain (non-Paschaltide) Common when no
`-paschaltide` variant is authored, same silent-fallback convention as
everywhere else.

`common-of-apostles-paschaltide` (7 files) ported directly from
`Commune/C1p.txt`/English `Commune/C1p.txt` — not live-queried — and
cross-checked against st-mark's already-authored, live-queried content
(2026-04-25): identical except the source's own Prime-antiphon asterisk
falls one word earlier than the live-rendered incipit had suggested,
corrected here to match the source. st-mark and st-john-before-the-
latin-gate's own duplicate per-saint files removed (all 7 each);
ss-philip-and-james's chapter files removed (its own antiphons stay
proper — its own Gospel-referencing text, not shared even in
Paschaltide). Only `C1p` (Apostles) ported so far, since no currently-
authored saint sits on a Martyr-Bishop or Several-Martyrs common that
could fall in Paschaltide — `common-of-a-confessor-bishop` and any
future Martyr-common saint don't need one (Confessors never get a
Paschaltide variant at all; a Martyr one would need porting `C2p`/`C3p`
the same way, if and when a saint needing it is authored).

### 94 `propers: null` saints — collects authored (2026-08)

**The reference engine's per-date `Sancti/`/`SanctiM/MM-DD.txt` files are
era-merged, not era-specific — blind extraction from them is unreliable.**
Live-querying (`version=Monastic Tridentinum 1617`) always resolved this
correctly elsewhere in this project because the *engine itself* applies
the right rubric filtering; reading a raw `Sancti/MM-DD.txt` file
directly bypasses that filtering entirely. Those files accumulate
centuries of saints assigned to the same calendar date across different
eras, gated behind `(rubrica ...)`-tagged conditional blocks — reading
the file's own untagged/default content silently returns whichever saint
is *currently* primary there (often a post-1617, sometimes post-1888
addition), not necessarily the one relevant to this app's target era.
Confirmed the hard way: an initial blind pull returned St. Didacus's
collect for All Saints of the Benedictine Order, St. Rose of Lima's for
Ss. Felix and Adauctus, St. Josaphat's for St. Martin I, and 9 more
wrong matches out of 13 "clean, unambiguous" test cases — all real
saints, just centuries later than 1617, and none of them what this
app's own calendar actually intends for that date.

**The fix**: `web/www/Tabulae/Kalendaria/` has real, era-specific
calendar *tables* (not per-date files) — `1570.txt` (Tridentine base)
and `M1617.txt` (Monastic 1617's own diffs against it) — giving a
direct, unambiguous answer for "which saint(s), what rank, commemorated
with whom" on every date this app cares about, plus a `fileref` field
(e.g. `01-15t`, `08-23o`, sometimes pointing at a wholly different
MM-DD) identifying *exactly* which source file variant actually holds
that entry's content — including cross-file (`ex Sancti/05-08`,
`Commune/C1v:Oratio 2 loco`) and whole-file (`@Sancti/05-08` as the
file's own first line, no `[Section]` around it) inheritance, all
resolved by a purpose-built parser (`scratchpad/parse_kalendaria.py` +
`extract_final.py`, not committed — see the P/T/S/N and Lauds batches'
own parser scripts for the established one-off-tool convention).

Cross-referencing all ~205 saints in `data/calendar/saints/*.yml`
against this table (not just the 94) found the existing calendar data
essentially sound — 204/205 confirmed correctly dated (only the
deliberate `example-confessor` placeholder didn't match, as expected);
the earlier wrong-saint problem was specific to *this* extraction
method, not a systemic issue with the app's own calendar. No corrections
to `sanctoral-calendar.yml` were needed.

**Resolved St. Michael's own long-flagged uncertainty** (`st-michael.yml`
used to carry a "FLAGGED" comment about Sep 29 showing nothing live
across 6 tested years): the table confirms Sep 29 genuinely is his day
under Monastic 1617, rank 3 — it just never won outright in any tested
year. His own source file is a whole-file cross-reference to the
Apparition of St. Michael's (`ex Sancti/05-08`), confirmed word-for-word
identical live — `propers` now points directly at
`apparition-of-st-michael`'s own id rather than duplicating content.

**Two collect shapes, both now complete for all 94:**
- **34 have a genuine proper collect** — Latin pulled directly from
  source (`{id}-collect.yml` in `data/propers/common/`), English
  translated and marked `status.en: draft` for the ~11 where no source
  rendering exists at all (same convention as St. Scholastica's content
  earlier this session), verified/reused where the source does have one.
- **60 draw from a Common template** — a real architectural addition,
  not a workaround: `SaintRecord.collectCommon`/`collectName`
  (`calendar/feasts.ts`) plus a substitution step in `getDayCollect`
  (`hours/resolve-common.ts`) fill a Common collect's literal `{N}`
  placeholder(s) with the saint's own name(s), positionally — most
  templates need one name, a few (two co-named saints sharing a
  collect, e.g. Ss. Cornelius and Cyprian) need two. 21 distinct
  Common-collect templates now exist (`collect-c*.yml`), named after the
  reference source's own `C`-numbering (`C2`, `C2-1`, `C2a-1`, `C3b`,
  etc.) rather than an invented semantic label, since no clean
  after-the-fact explanation was recoverable for why the tradition
  splits e.g. "Common of a Martyr Bishop" into five differently-worded
  variants. Each saint's own `[Name]` section supplies its declined
  form already in the exact grammatical case that saint's specific
  template needs (confirmed empirically — Ambrose's own `[Name]` is
  accusative, matching his template's own accusative `{N}` slot). One
  real wrinkle: Ss. Popes among the Martyr-Bishop groups (Cletus &
  Marcellinus, Soter & Caius, Anacletus, Anicetus) need the *second*,
  `"(sed communi Summorum Pontificum)"`-tagged declension in their own
  `[Name]` section, not the first — a real, source-documented
  distinction (Popes get their own template variant), not a parsing
  quirk to work around.

One genuine judgment call, flagged rather than silently resolved: St.
Martha's own Monastic-specific source file (`SanctiM/07-29.txt`)
overrides her base Tridentine assignment (`collect-c6a`, one name) with
`collect-c6b` (two names) instead — a plural "Several Virgins and
Martyrs" template that doesn't fit a single saint. Kept the singular
`collect-c6a` assignment as the more sensible reading (see her own
file's comment), treating the Monastic override as likely an
inconsistency in that one file rather than a real joint-commemoration
convention this app doesn't otherwise model.

Verified end-to-end: a runtime smoke test resolving `getDayCollect` for
all 94 ids via a synthetic sanctoral-winner day, confirming a real
(non-`missing`, no leftover `{N}`) collect for every one — not just that
the YAML files parse.

### 94 `propers: null` saints — Benedictus antiphon + P/T/S/N Commons (2026-08)

The natural next step the collects batch unblocked. Two more real gaps
found and fixed along the way, both explained below.

**Raw `Commune/*.txt` fields don't reliably match what the engine
actually renders per hour, same lesson as the collects pass but for
antiphons this time.** `Commune/C2.txt`'s (Martyr-Bishop) own `[Ant 1]`/
`[Ant 2]`/`[Ant 3]` fields don't correspond 1:1 to Prime/Terce/Sext/None
the way a naive reading would suggest, and no `CommuneM/*.txt` file
defines explicit `[Ant Prima]`/`[Ant Tertia]`/`[Ant Sexta]`/`[Ant Nona]`
fields for any of the categories this batch needed (only `C10`, BVM
Saturday, has them). Confirmed independently: the already-authored
`common-of-a-confessor-bishop` P/T/S/N content (from the original
29-saint pass) doesn't match `Commune/C4.txt`'s own raw `[Ant 1]` either
— it was live-query-sourced from Chair of St. Peter/St. Martin's own
rendered pages, not read from the Commune file directly, which is
exactly why. Fix: queried `web/cgi-bin/horas/officium.pl` directly
(local Perl, not a network fetch — `prayPrima`/`prayTertia`/`praySexta`/
`prayNona`/`prayLaudes`, `version=Monastic Tridentinum 1617`) for one
representative `propers: null` saint per Common category, parsing the
antiphon (incipit + full, reconstructing the `*` split point) and
chapter (citation, text, closing versicles) out of the rendered HTML —
new scratchpad tool `query_hours.py`/`batch_hours.py`, not committed,
same one-off-tool convention as the rest of this project's extraction
scripts. Caught its own version of the collects batch's "wrong saint"
bug this way too: St. Emerentiana's stored clean-year comment
(2029-01-23) actually rendered St. Hilary of Poitiers's office by that
year (a stale date after his own earlier Jan 23 → Jan 14 correction,
see above) — every representative's title is now verified against an
accent-insensitive name-stem match before its content is trusted, with a
fallback year search when the stored date doesn't check out.

**The real liturgical categories are coarser than `SaintRecord.common`'s
naming suggests — verified by cross-querying multiple saints per
category, not assumed.** `common-of-a-martyr-bishop` and
`common-of-a-martyr` render byte-identical P/T/S/N and Benedictus
antiphon content (confirmed: St. Anacletus, St. Simeon, St. Blaise, St.
Pantaleon — four different collect-template variants, one shared minor-
hour Common); so do `common-of-an-abbot`, `common-of-a-confessor-not-
bishop`, and `common-of-a-confessor` (St. Odo, St. John Gualbert, St.
Nicholas of Tolentino, St. Alexius); so do `common-of-a-virgin-martyr`,
`common-of-a-virgin`, and `common-of-a-holy-woman` (St. Justina, St.
Emerentiana, St. Praxedes, St. Martha). `common-of-several-martyrs`
splits further than its own name suggests, though: plain groups of
martyrs (Ss. Cornelius and Cyprian, Ss. Faustinus and Jovita, Ss. Placid
and Companions — the last a real Duplex II. classis feast, not just a
low-rank stub, confirming the fallback isn't only reached by minor
saints) share one Common, but groups of *Pope*-martyrs (Ss. Cletus and
Marcellinus, Ss. Soter and Caius) render distinct, more triumphal,
allelúja-toned text of their own — a real category the collect
templates already knew about (`collect-c3b`) that the `common` field
alone doesn't surface. One saint, the Dedication of the Basilicas of Ss.
Peter and Paul, turned out *not* to share its `common` field's nominal
category (`common-of-an-apostle`) at all: live-verified its P/T/S/N and
Benedictus antiphon are the Dedication-of-a-Church Common instead (about
the building, matching its own `collect-c8`), not shared with any
apostle content. Net result: 7 new shared Common categories
(`common-of-a-martyr`, `common-of-an-abbot`, `common-of-several-
martyrs`, `common-of-pope-martyrs`, `common-of-a-vigil`, `common-of-a-
virgin`, `common-of-a-dedication`) plus the pre-existing `common-of-a-
confessor-bishop` cover 66 of the 94 saints; the 7th confessor-bishop
saint's own Benedictus antiphon Common file was also new (the original
29-saint pass never needed it — Chair of St. Peter/St. Martin both have
their own proper Lauds antiphon, only their chapters were shared).

**New mechanism**: `SaintRecord.benedictusCommon` (`calendar/feasts.ts`)
— `getBenedictusAntiphon` (`hours/resolve-common.ts`) now falls back to
`benedictus-antiphon-${benedictusCommon}.yml` when a saint has neither a
proper collect-antiphon pair nor... (see below) — deliberately no name-
substitution mechanism built for it (unlike `collectCommon`): every
Common category in current use renders name-free Benedictus-antiphon
text; only the Doctor Common (`C4a`, not used by any saint here) has a
`{N}`-shaped placeholder in the source.

**Real bug found and fixed while wiring this in**: `getMinorHourOverrideId`
gated *all* Prime/Terce/Sext/None lookup — both the per-saint proper file
and the shared-Common fallback — behind the same duplex-majus+ threshold
Lauds' own *psalmody* override uses, on the assumption that only a
strong feast carries its own minor-hour content at all. Live-querying
this batch proved that wrong: a winning Semiduplex saint (St. Anacletus)
still renders its own proper/Common antiphons at Prime/Terce/Sext/None,
not the plain ferial default — the majus+ gate was only ever a proxy for
"this app has authored proper content," not a real liturgical rule, and
became actively wrong once Common-category content started covering
lower ranks too. Fixed by making `getMinorHourOverrideId` eligible for
*any* sanctoral winner; Lauds' own psalmody override
(`hours/lauds.ts`'s `getPsalmodyOverrideFor`) is unaffected and correctly
stays majus+-gated, since that's a real, much bigger per-saint authored
commitment (the whole psalm-antiphon block), not something this batch
adds a Common fallback for.

One saint, Ss. Ursula and Companions, deliberately left without
`minorHoursCommon`/`benedictusCommon`: her collect template
(`collect-c6b`, plural Virgins and Martyrs) has no other member on this
app's calendar to verify a shared minor-hour text against, and she can
never be queried directly herself (a genuinely unwinnable stub, always
commemorated under St. Hilarion) — left honestly unauthored rather than
guessed from the singular `common-of-a-virgin` category, moot in
practice since a commemoration's own minor hours are never rendered.

Verified end-to-end: a runtime smoke test (folded into
`tests/hours/resolve-common.test.ts`) resolving `getBenedictusAntiphon`/
`resolveMinorHourAntiphon`/`resolveMinorHourChapter` for a sample across
categories, including the Duplex II. classis case to confirm the
majus+-gate fix isn't just a low-rank special case.

**Not done in this pass**: the other 26 of the 94 (`propers` now set to
their own id, from the collects batch's proper-collect saints) still
need their own individual Benedictus antiphon authored — same shape as
the original 109-saint pass (own `[Ant 1]`/live-rendered text, not a
shared Common), since a saint with a genuine proper collect usually has
a genuine proper antiphon too. Not yet started.

### The other 26 propers-set saints' Benedictus antiphons — done (2026-08)

Turned out **most of these don't have unique antiphon text either** —
a genuine proper collect doesn't imply a genuine proper antiphon, same
finding as St. Martin of Tours's mixed proper-antiphon/shared-chapter
split from the original 29-saint pass. Live-queried Lauds
(`prayLaudes`) for each of the 26, same title-verified method as the
Common-category batch above.

**15 of the 26 are genuinely unwinnable stubs** (already documented as
such from the collects pass — always commemorated, never the day's own
title, so nothing to query) — same "honestly missing" treatment as St.
Frances of Rome/St. Bibiana in the original 109-saint pass, not
guessed at.

**Of the 11 that do win outright**, 7 turned out to share existing
Common-category text — `benedictusCommon` wired directly to the already-
authored files from the section above, no new content needed: Ss.
Dionysius and Companions, Ss. Felix and Adauctus, Ss. Maurice and
Companions, Ss. Tryphon and Companions (`common-of-several-martyrs`,
despite Dionysius's own `common` field saying `common-of-a-martyr-
bishop` — another case, like Chair of St. Peter earlier, where the two
fields genuinely diverge), St. Chrysogonus and St. Donatus
(`common-of-a-martyr`), the Vigil of St. Lawrence (`common-of-a-vigil`).

The remaining 4 have real, unique proper text — new
`{id}-antiphon.yml` files: All Saints of the Benedictine Order ("Vos
qui reliquístis ómnia..."), St. Agnes (secunda) ("Ecce, quod
concupívi..."), St. Benedict ("Sanctíssime Conféssor Dómini..." — no
English in the source, same gap as St. Scholastica's, translated and
marked `draft`), and the Vigil of St. John the Baptist ("Eréxit nobis
* Dóminus cornu salútis..." — deliberately echoing the Benedictus
canticle's own opening words, fitting for the Vigil of the saint whose
father, Zechariah, first spoke that canticle).

P/T/S/N for these 26 not attempted in this pass — a further layer on
top, same as how the original 109 got Benedictus antiphons long before
their own later, separate P/T/S/N pass (duplex-majus+ subset only). Done
in a later pass, see "`minorHoursCommon` gap swept across the whole
calendar" below — it covers these 26 too, not just the original 109.

### The 15 "unwinnable" stubs' Benedictus antiphons, resolved from source (2026-08)

Direct feedback on the section above: "unwinnable" was describing an
artifact of Divinum Officium's own single-winner precedence model, not
a real content gap — the app doesn't need a saint to *win* a live query
to have real content, since this app already renders commemorated
saints on their own terms (`day.commemorations`) rather than only ever
showing the day's outright winner. The fix: read each of the 15 saints'
own already-validated fileref directly (`extract_final.py`'s
`load_file`/`resolve`, the exact same fileref their collect was already
sourced from during the Kalendaria-table pull — no live query, no
"does this saint ever win" requirement at all) for its `[Ant 1]`
section, falling back to whatever Common its own `[Rule]`/`[Rank]`
"`vide`/`ex CXX`" reference names when there isn't one — the same
proper-then-Common shape `getDayCollect`/`collectCommon` already uses,
just applied to the Benedictus antiphon too.

**14 of the 15 had no `[Ant 1]` of their own at all** — clean Common
fallback, and every one of their `[Rule]`/`[Rank]` C-numbers (`C2a`,
`C2a-1`, `C3`, `C3a`, `C3a-1`, `C4b`, `C6`, `C6-1`, `C6a`, `C7`) falls
inside a family already live-query-verified in the section above, so
`minorHoursCommon`/`benedictusCommon` were wired directly with full
confidence, no new content needed: St. Marcus (`C4b` — a whole-file
`@Commune/C4` inherit, just the title relabeled "of the Popes" — into
`common-of-a-confessor-bishop`); St. Felix (Presbyter), St. Hermes, St.
Saturninus (`C2a`/`C2a-1` into `common-of-a-martyr`); St. Prisca, St.
Thecla, St. Catherine of Siena (`C6`/`C6-1`/`C6a` into
`common-of-a-virgin`); Ss. Machabees, Ss. Marius/Martha/Audifax/Abachum,
Ss. Twelve Brothers, Ss. Alexander/Eventius/Theodulus/Juvenal, Ss.
Felix/Simplicius/Faustinus/Beatrix, Ss. Nabor and Felix
(`C3`/`C3a`/`C3a-1` into `common-of-several-martyrs`). St. Felicitas is
the one genuine new finding: her file points to `C7` ("Commune Unius
non Virginis Martyris"), which isn't a category this project had
touched yet — but `C7`'s own `[Ant 1]` is itself a cross-reference
(`@Commune/C6:Ant 2`) that resolves to text byte-identical to
`common-of-a-virgin`'s own already-verified Benedictus antiphon, so no
new Common file was needed even there.

**The 1 remaining (Ss. Euphemia, Lucy, and Geminian) does have her own
real `[Ant 1]`** — but marked `status.la: draft`, not `verified`, on
principle: a real counterexample turned up in the *same* pass while
double-checking a winnable saint for comparison — St. Alexius's own
file also has a genuine `[Ant 1]` ("Similábo eum..."), yet his actual
live-rendered Benedictus antiphon (already confirmed in the section
above) uses `common-of-an-abbot`'s text instead, not his own `[Ant 1]`
at all. So a raw `[Ant 1]` read is demonstrably not sufficient proof by
itself that it's what the Benedictus canticle actually uses (Vespers'
Magnificat is a live candidate for what it's *actually* for), even for
a saint that *can* be live-checked — and for one that never can be, that
uncertainty can't be resolved at all. Used the text anyway (better than
nothing, and plausibly correct), just honestly flagged rather than
claimed as confirmed.

All 15 now have real content — none left "honestly missing." Ss.
Ursula and Companions (the section above) is the one case that's
actually different in kind: no other calendar member shares her
`C6b`/plural-Virgins-and-Martyrs category to cross-check a Common
against, so even a clean file read wouldn't have anything solid to
verify itself against.

### A full sweep for the same pattern elsewhere, and 2 more real fixes (2026-08)

Same feedback, applied more broadly: swept every saint in
`data/calendar/saints/*.yml` (not just the 94-batch's own lineage) for
a still-`missing` collect or Benedictus antiphon, via a synthetic-winner
smoke test. Found 4 hits; 2 were real, 2 were false positives from the
sweep's own synthetic-day methodology (forcing a saint to be `day.winner`
when in reality it's *never* the winner doesn't correctly exercise its
real content path):

- **St. Frances of Rome and St. Bibiana** (Benedictus antiphon) —
  exactly the fix from the section above, just predating the
  Kalendaria-table work (no fileref had been derived for either yet).
  Both resolve to `common-of-a-virgin` once one is: Bibiana's file
  points to `C6-1` directly; Frances of Rome's points to `C7a` (a
  whole-file inherit of `C7`, just the `[Officium]` title relabeled "of
  a Widow" — fitting, since she's a widow, not a virgin — with no
  override of the same `[Ant 1]` cross-reference, so it resolves
  identically).
- **St. Agatha and St. Lucy** (collect) — a real, older gap, from
  *before* `collectCommon` existed at all: both saints' own file
  comments already documented "no unique collect... resolves honestly
  missing... despite propers being set," written back when that was the
  only option. Agatha's own `[Oratio]` is `@Commune/C6::s/N\./Agathæ/` —
  confirmed identical to the already-existing `collect-c6.yml` template
  — so `collectCommon: collect-c6` was simply wired in. Lucy's own
  `[Oratio]` is `@Commune/C7a`, *unedited* (unlike `collect-c6a.yml`'s
  own C7a-derived text, which has a `"Vírginis tuæ"` insertion baked
  in) — her own `[Name]` section supplies the whole descriptive phrase
  instead ("Lúciæ Vírginis et Mártyris tuæ", not just her bare name),
  making her resolved text effectively proper even though the
  underlying formula is a shared Common one; written as her own
  `st-lucy-collect.yml` (she already had `propers: "st-lucy"` set)
  rather than a new single-use `collect-c7a` template. No English
  `[Oratio]` in the source for either saint's own unedited form, so
  Lucy's stays `status.en: draft`.
- **St. Clare** (false positive) — the sweep's synthetic day forced her
  to be `day.winner`, but she never actually is one (always
  commemorated under St. Lawrence's octave); her real content lives in
  `st-clare-commemoration.yml`, used via a completely different code
  path (`sanctoralCommemorationPart`, not `getBenedictusAntiphon`) that
  the sweep doesn't exercise. Already fully authored and live-verified;
  no gap.
- **Ss. Ursula and Companions** (already covered above) — the one
  genuine, currently-irresolvable case.

Two vigils (Vigil of St. John the Baptist, Vigil of St. Lawrence) didn't
resolve via this file-based method at all (their particular file format
wasn't handled by this pass's parser) — no impact, both already had
real content from the live-query batch above.

### `minorHoursCommon` gap swept across the whole calendar (2026-08)

The pieces above all fixed Benedictus-antiphon/collect gaps. This pass
does the same thing for Prime/Terce/Sext/None specifically, and widens
scope from just the 94-saint batch to the **whole** calendar — the
original 29-saint P/T/S/N pass (an earlier session) only ever covered
duplex-majus+ saints; every below-majus saint from the *original*,
pre-94-batch 109-saint pass had never had P/T/S/N attempted at all,
same gap as the one already found and fixed for the 94-batch's own
below-majus saints.

**Method**: reused the Kalendaria-table-validated fileref approach
(same as the collects pass), not a blind `Sancti/MM-DD.txt` read — a
real near-miss caught this early: St. Apollonia's `Sancti/02-09.txt` is
*currently* St. Cyril of Alexandria's (a 19th-century addition to that
filename slot); blind reading would have silently attributed his
Doctor-of-the-Church Common to her. The Kalendaria table's own
validated fileref (`02-09o`) gives her real content instead. Also fixed
a second, unrelated regex bug the same pass turned up: the original
"`vide`/`ex CXX`" pattern matched the bare word "`Commune`" (no number)
and reading-specific sub-references like "`ex C4 in 2 loco`" (which
only says where *that nocturn's readings* come from, not the overall
antiphon Common) — found via St. Clement, whose Monastic-specific
`[Rule]` override has neither a clean `vide CXX` nor a number after
"Commune." Fixed by requiring a digit right after `C` and skipping any
match immediately followed by `"in N loco"`.

**90 below-majus saints swept, ~82 wired directly** into the categories
already established above (mostly `common-of-a-martyr` and
`common-of-several-martyrs`, the two largest families) — no new content
needed, since every C-number variant found (`C2`/`C2-1`/`C2a`/`C2a-1`/
`C2b`/`C2b-1`/`C2-1b`, `C3`/`C3a`/`C3a-1`, `C5`/`C5-1`/`C5a`/`C5b`,
`C6`/`C6-1`/`C6a`/`C7a`, `C4`/`C4b`, `C1`, `C1v`) already falls inside a
family live-query-verified earlier.

**A real bug this pass caught and fixed**: Ss. Ursula and Companions
(deliberately left `minorHoursCommon`-unwired, see her own section
above) got swept up and *wrongly* wired to `common-of-an-abbot` by this
pass's own script, since she has `collectCommon` set (making her look
like a normal, resolvable batch member) despite `propers: null` and
being a genuine commemoration-only stub — the underlying
Kalendaria-table lookup silently defaulted to St. Hilarion's own
`primary` slot at her shared date rather than her own (nonexistent)
one. Caught by cross-checking every swept saint's `propers` field for
this exact `null`-but-`collectCommon`-set pattern before trusting a
default-to-primary assumption; reverted, she's still correctly unwired.

**A real, new category found: Doctors of the Church are not one thing.**
7 saints' own `[Rule]` says "`vide C4a`" (`Commune Doctoris Pontificis`)
— but live-querying showed this doesn't mean what it looks like it
means. St. Athanasius, St. Augustine, St. Basil the Great, St. Hilary of
Poitiers, St. John Chrysostom, and St. Leo I all render P/T/S/N
byte-identical to `common-of-a-confessor-bishop`'s already-verified
text (their own `C4a` reference just inherits `C4`'s content
underneath, per the same "the referenced file's raw fields don't
reliably predict the live-rendered text" lesson from every other
category this session) — wired directly, no new content. **St. Gregory
the Great is the one genuine exception**: his own live-rendered
P/T/S/N is real, unique proper text (alluding to his own election,
his *Liber Regulæ Pastoralis*, the dove-and-quill legend, and the
"non Angli sed Angeli" episode already known from his Benedictus
antiphon) — 7 new files (`{hour}-antiphon-st-gregory-the-great.yml`,
`{terce,sext,none}-capitulum-st-gregory-the-great.yml`), no
`minorHoursCommon` needed at all (`getMinorHourOverrideId` already
tries his own id first). English wasn't rendered at all for any of his
6 new texts (same Latin-duplicated-into-English gap as St. Scholastica/
St. Benedict), so all 6 are `status.en: draft`.

**A loose thread noticed, then chased down and fixed (2026-08)**: St.
Athanasius (May 2) and St. Leo I (April 11), both tested in years that
happened to fall within Eastertide, rendered their shared
`common-of-a-confessor-bishop` text with a trailing "`allelúja`"
appended to every antiphon — but the other 4 Doctor saints (tested in
non-Paschaltide months) didn't. Live-querying further (a full sweep of
Common categories across the Easter/Ascension/Pentecost octaves and the
ordinary weeks around them, reading the reference source's raw
`Commune/*p.txt` chains directly rather than guessing from rendered
pages) settled it precisely:

- A handful of categories (Apostles, Martyr, Martyr-Bishop, Several
  Martyrs, Pope-Martyrs) have their own dedicated `Cxxp.txt` source
  chain — a genuinely *different* text for Paschaltide, not the same
  text plus a suffix (confirmed by reading the raw files: e.g. the
  "Fíliæ Jerúsalem..." Pope-Martyrs Benedictus antiphon comes from a
  Matins responsory reused for Lauds specifically during this window,
  nowhere near the non-Paschaltide chain's own "Mártyrum chorus..."
  text). Only `common-of-apostles` has this wholesale text actually
  authored into this app's data (`*-paschaltide.yml`, from an earlier
  pass) — the other four still fall through to the mechanical suffix
  below until someone authors their real text, which is a strictly
  better approximation than the unmodified default.
- Every *other* category (Confessor-Bishop/Doctor, Abbot, Virgin, and
  presumably Dedication/Vigil/Angel, untested but structurally the
  same) has no dedicated chain at all — the reference engine just
  mechanically appends a single ", allelúja"/", alleluia" to the
  otherwise-unchanged base text, for the whole Eastertide → Ascensiontide
  → Pentecost-octave-week span. Live-verified across three unrelated
  categories (St. Athanasius/Confessor-Bishop, St. Robert/Abbot, St.
  Catherine of Siena/Virgin) — never doubled.
- The "sometimes 1, sometimes 2" appearance wasn't actually the same
  category flipping — it was different *ranks of saint* getting
  different octave privileges. Only martyr-class saints (already in the
  dedicated-chain group above) are ever eligible for even a
  commemoration inside a true privileged octave (confirmed: St.
  Anicetus, commemorated on a Semiduplex day inside the actual Easter
  octave, correctly showing the doubled dedicated-chain text).
  Confessor/Abbot/Virgin-class saints never get that far — checked St.
  Leo I and St. Basil the Great both landing on/near a real octave in
  some year, and both are fully transferred, no commemoration at all —
  so the plain-suffix categories structurally can never be observed
  inside a real octave, only in the ordinary weeks around it.
- One practical check this settled without needing a code change:
  `common-of-pope-martyrs` (Ss. Soter & Caius, Ss. Cletus & Marcellinus)
  is itself one of the dedicated-chain categories, so its one stored
  file is technically the Paschaltide-only text, not a universal
  default — but tracing both saints' fixed dates against every possible
  Easter date confirms this is harmless: whenever their date would fall
  outside Eastertide, it lands inside the Sacred Triduum instead
  (always fully transferred, never rendered), so the stored text is
  correct for every real occurrence.

Built: `hours/resolve-common.ts`'s `appendPaschaltideAlleluia`/
`withPaschaltideAlleluia`, applied to the Common-category fallback
branch of `getBenedictusAntiphon` and `resolveMinorHourAntiphon` (not
the `-paschaltide`-file branch, which already had its own correct
wholesale text; not a saint's own unique `${propers}-antiphon`, which
would need its own live-requery to confirm one way or the other rather
than assuming the Common-category finding transfers; not capitula,
whose closing versicles get the same suffix in the reference engine too
— confirmed, St. Robert's Terce capitulum — but whose text is one
embedded R./V. blob per language rather than a clean appendable tail,
not attempted this pass). Guards against double-appending on a category
whose stored text already ends in "allelúja" (`common-of-pope-martyrs`,
per above). 4 new tests in `tests/hours/resolve-common.test.ts`
(`Paschaltide alleluia suffix on Common-category antiphons`), 300 tests
passing.

Verified end-to-end: a runtime smoke test (folded into
`tests/hours/resolve-common.test.ts`) covering the same-person reuse
case (Finding of St. Stephen → St. Stephen Protomartyr's own files),
Gregory's unique content, and a shared-Doctor case, plus 8 more spot
checks across the newly-wired families during the pass itself.

### The last 2 duplex-majus+ P/T/S/N gaps, and a final-sweep bug (2026-08)

Closes out `minorHoursCommon`/P/T/S/N entirely: the original 29-saint
pass held back 5 saints for lacking a collect at the time (`st-benedict`,
`all-saints-of-the-benedictine-order`, `st-michael`, `st-maurus-abbot`,
`ss-placid-and-companions`) — the latter two already got Common
fallbacks wired in earlier sections above, and St. Michael redirects to
Apparition of St. Michael's own content (see below). That left **St.
Benedict and All Saints of the Benedictine Order** as the only two
duplex-majus+ saints on the whole calendar with no P/T/S/N at all.
Live-queried both the same way the original 29 were: real, unique
proper text for each (Benedict's own Prime antiphon is the opening line
of St. Gregory the Great's *Life of St. Benedict*; All Saints of the
Benedictine Order draws on Matt 13:43, Luke 6:22-23, and a well-known
All Saints antiphon) — 14 new files total, English translated
throughout (`status.en: draft`) since the source rendered none for
either saint's own texts.

**A final calendar-wide sweep** (every saint's `resolveMinorHourAntiphon`/
`resolveMinorHourChapter`, synthetic-winner methodology) turned up one
more real gap: **St. Michael himself**. His `propers` field points at
Apparition of St. Michael's own id (the two feasts are word-for-word
identical, already established), and `getDayCollect`/
`getBenedictusAntiphon` both explicitly follow `propers` when looking
up their own content — but `getMinorHourOverrideId` doesn't; it keys
off the day's own winner id directly (`"st-michael"`, not
`"apparition-of-st-michael"`), so `resolveMinorHourAntiphon` was looking
for a `prime-antiphon-st-michael.yml` that was never going to exist.
Fixed the same way as Finding of St. Stephen: `minorHoursCommon:
apparition-of-st-michael` on his own record, reusing his delegate's
already-authored proper files directly. A real, narrow gap in the
mechanism itself (not just missing data) — worth remembering if any
other saint's `propers` ever points somewhere other than its own id.

**Every real saint on this app's calendar now has real P/T/S/N
content.** The only remaining absence is Ss. Ursula and Companions
(deliberately left unwired, no way to verify a category of one) and
the `example-confessor` test placeholder, which was never meant to
have any.

### Christmas-Octave Sunday content — done (2026-08)

Was: only the Benedictus antiphon existed for `christmas-octave-sunday`
(`christmas-octave-sunday-benedictus-antiphon.yml`) — no collect (a
separate, older file, `christmas-octave-sunday-collect.yml`, did already
exist and was untouched here), no Lauds psalmody override or office
bundle, no Prime/Terce/Sext/None content at all.

Real code gap found and fixed along the way: `getMinorHourOverrideId`
(`hours/resolve-common.ts`) only ever checked the *sanctoral* branch of
`resolveOfficeWinner`'s result — a named temporal feast in
`ALWAYS_OVERRIDE_TEMPORAL_IDS` (`marian-saturday`, `christ-the-king`) got
a Lauds psalmody override via `getPsalmodyOverrideFor`'s own separate
check of that set, but silently *never* a Prime/Terce/Sext/None one,
however much content got authored for it — nothing had actually
exercised that path until now. Fixed by mirroring `getPsalmodyOverrideFor`
`hours/lauds.ts`'s own temporal-id branch.

Content itself needed a different source than every other pull this
session: Monastic Tridentinum 1617 has no real "Dominica Infra Octavam
Nativitatis" identity of its own under its own calendar rules on most
Dec 26-29 Sundays (verified live: 2026-12-27 renders as "S. Joannis
Apostoli," not the Sunday, under `version=Monastic Tridentinum 1617` —
only the collect happens to be old enough to have been pulled from a
date, 2029-12-30, where 1617 *did* render it outright). Lauds psalmody,
office bundle, and Prime/Terce/Sext/None content instead pulled live
under `version=Divino Afflatu 1954` (2026-12-27), consistent with this
app's own stated precedent of following D.A. for the calendar/precedence
layer even while keeping Monastic 1617's shape for the hours themselves —
this is one of the rare days where that split genuinely can't be
maintained, since 1617 has nothing of its own to shape. `christmas-
octave-sunday-collect.yml`'s existing 1617-sourced text was kept as-is
(cross-checked identical against both the new D.A. query and the raw
Monastic Tridentinum 1617 source file, `Tempora/Nat1-0.txt`'s own
`[Oratio]`) rather than replaced.

Files: `lauds-psalmody-overrides/christmas-octave-sunday.yml` (3 psalms +
Canticle of the Three Young Men + Laudate, all distinct antiphons),
`lauds-capitulum-/-versicle-/-hymn-christmas-octave-sunday.yml` ("A solis
ortus cardine"). No `lauds-responsory-christmas-octave-sunday.yml`
authored — genuinely absent from the live rendering (hymn leads straight
into the versicle, no short responsory in between), not an oversight;
left "missing" honestly rather than invented. Prime/Terce/Sext/None all
four get a proper antiphon (a short "Allelúia, ..." set drawn from the
day psalter, distinct per hour); Terce/Sext/None each get a proper
chapter (Gal 4:1-2/4:4-5/4:7, matching the raw 1617 source's own
`Nat1-0.txt` exactly) with its own versicle per the D.A. live rendering
(not the 1617 source's own versicle, which reuses one versicle across
all three hours — a cross-era mismatch flagged here, not silently
papered over, since this whole day's content already mixes eras out of
necessity).

Not attempted: `Nat2-0` (Feast of the Holy Name of Jesus) isn't in this
app's sanctoral/temporal calendar at all yet — a separate, bigger ask if
wanted (see the original scoping discussion this session).

### Overlapping octaves — done (2026-08)

Was: `resolveOfficeWinner`/`getDayLabel` picked whichever active octave
started *first* whenever more than one was active — an accident of
insertion order, not a real precedence rule. St. Lawrence's octave (Aug
10-17) and the Assumption's (Aug 15-22) genuinely overlap on Aug 16-17
every year, so this wasn't hypothetical.

Design (per direct instruction, not independently re-derived from a
primary source the way most of this project is): when more than one
octave is active on a day with no temporal standing of its own to yield
to first, compare them by rank — highest wins outright, exactly like a
single octave already out-ranks a weak rival saint; every other active
octave still gets commemorated, never silently dropped. A rank tie goes
to whichever octave started more *recently* — reasoning given: day 1 of
a newly started octave needs to be fully present, which is the whole
point of an octave starting, so the older one yields instead. No real
tied-rank case exists yet in this app's calendar to verify that
empirically, unlike almost everything else in this project — flagged as
a stated, unverified-by-evidence design decision, not a live finding.

Also needed `OctaveConfig.closingDayRank` (default `duplex`): an
octave's own *closing* day ("in Octava," the 8th/final day) is elevated
above its ordinary in-between-days rank — live-verified as a real,
general pattern (not a St. Lawrence quirk): both his own Aug 17 and the
Assumption's own Aug 22 show as Duplex, above their otherwise-Semiduplex
ordinary days. This is *why* Lawrence's octave beats the Assumption's on
their one real overlap day (Aug 17) despite the Assumption being the far
higher-ranked feast overall (Duplex I. classis vs. Lawrence's Duplex II.
classis) — his closing-day elevation (Duplex) beats her ordinary day-3
strength (Semiduplex). Feeds both `strictestThreshold` (a rival saint
now needs Duplex+, not just Semiduplex+, to beat an octave specifically
on its own closing day) and the new octave-vs-octave comparison
(`calendar/octaves.ts`'s `resolveActiveOctave`/`pickWinningOctave`) —
same underlying "how strong is this octave today" question, two
different comparison partners.

`getDayLabel` was carrying its own separate, never-actually-correct
octave-selection logic that additionally never checked
`temporalCategory` at all — found while testing the real Aug 16 overlap
(a Sunday that year): it was showing an octave name even though the
*temporal* Sunday has real standing and wins outright, live-verified
counterexample being the Christmas Octave's own stack (Dec 30), which
was wrongly showing "3rd Day within the Octave of The Holy Innocents"
instead of the correct plain temporal label. Fixed by having
`getDayLabel` share the exact same `ordinary-feria` gate and
`resolveActiveOctave` call as `resolveOfficeWinner`, so the two can never
disagree about which identity governs a day.

### Dec 26-30's own Sunday rule — done (2026-08), a deliberate remix

Per direct instruction — a real, admitted departure from Monastic 1617
itself, not something independently verified live the way almost
everything else here is: within Dec 26-30 inclusive (every year contains
exactly one real Sunday somewhere in that 5-day window), whichever date
is the actual Sunday always celebrates Nat1-0 (the Sunday within the
Octave of the Nativity) outright, with **no rank check at all** — even a
Duplex-II-classis saint (Stephen/John/Innocents) is fully displaced, not
just commemorated. The displaced saint isn't commemorated in place
either; he reappears in full as the day's own winner on Dec 30 instead —
the block's one date with no fixed saint of its own. On a year Dec 30
itself is the actual Sunday, nothing is displaced and it resolves clean.

This intentionally diverges from what Monastic 1617 itself does on Dec
26-29 (there, live-verified, the Duplex-II-classis saint wins and the
Sunday is merely commemorated — see the December-sanctoral tests) and
from the general `privileged-sunday` transfer rule elsewhere in this app
(which only transfers ranks below duplex-majus and commemorates
everything at or above it in place) — this window transfers *every*
rank, full stop, and never commemorates the loser in place.

Implemented as its own dedicated, narrowly-scoped layer
(`calendar/index.ts`'s `applyChristmasOctaveSunday`, same architectural
pattern as `applyMarianSaturday`/`applyChristTheKing`) rather than by
changing the shared `decideOccurrence`/transfer machinery other Sundays
rely on — deliberately contained blast radius. Dec 31 and everything
outside Dec 26-30 is untouched; christmastide's Sunday there still uses
the plain `ordinary-sunday` category as before (St. Silvester still
beats the Sunday on Dec 31, live-verified, unaffected by this).

### Benedictus antiphons for temporal (non-sanctoral) days — done

`<id>-benedictus-antiphon.yml` in `data/propers/temporal/` — all 54
temporal ids now have one (`marian-saturday`/`christ-the-king` from
earlier, the 51 numbered Sundays/seasons done in one pass, plus
`christmas-octave-sunday` itself, corrected below).

**`christmas-octave-sunday` correction**: originally left unauthored
here, on the theory that every date this id can resolve to collides with
a specific octave-day saint. Wrong — the reference engine has its own
dedicated proper for this Sunday specifically, `Tempora/Nat1-0`
(`web/www/horas/Latin/Tempora/Nat1-0.txt` in the reference repo, and its
Monastic counterpart under `TemporaM/`), distinct from the individual
per-weekday octave pages (`Nat02`..`Nat09` = the ferias, keyed by day
offset from Christmas). Most years the Sunday does lose outright to a
Duplex-II-classis octave saint (St. Stephen/St. John/Holy Innocents,
whichever Dec 26–28 lands on) and only gets a bare commemoration — that's
what the earlier searches kept finding — but 2029-12-30 is a clean year
where the Sunday itself wins outright (`Dominica Infra Octavam
Nativitatis ~ Semiduplex Dominica minor`, no commemoration line at all),
so that's the date the content was pulled from. Benedictus antiphon:
"Dum médium siléntium" / "While all things were in quiet silence" — note
the source's own English translation genuinely omits the closing
"alleluia" that the Latin has; transcribed as-is, not smoothed over.

Method: rather than hunting for "clean years" one at a time, wrote a
script that iterates every day of a test year through this app's own
`resolveDay`, buckets each Sunday by which temporal id actually won, and
picks one real date per id straight from the app's own logic — then
cross-checked each date's *live* D.O. title for a saint collision before
trusting the content (a handful, mostly on privileged Eastertide/
post-Pentecost Sundays, needed a different year: this app's own
privileged-Sunday rule never lets a saint displace those Sundays, but the
live reference engine's calendar is bigger than this app's and does let
some by-date saint win there, e.g. St. Mark on Easter V some years, "Our
Lady of the Snows" — not modeled in this app at all — landing on
Post-Pentecost XI whenever the date lines up with Aug 5).

### Octave content — done (2026-08)

Was: `getDayCollects` skipped a `kind: 'octave'` commemoration entirely,
and every other office part (psalmody, hymn, chapter, Benedictus
antiphon) stayed keyed off the plain temporal day underneath the octave
— so an ordinary day within e.g. St. Lawrence's own octave showed nothing
of his at all, not even a label beyond the day-label line. Root cause:
found live (Tridentine 1910, 2026-08-12) that on a day like this, the
*whole* office — chapter/responsory/hymn/versicle, psalm antiphons,
Benedictus antiphon, day collect — comes from the octave's own feast, not
the plain temporal day; only a *weaker* commemorated saint on top of that
(St. Clare, that same date) gets a separate Ant+V/R+collect block of her
own. Fixed via `hours/resolve-common.ts`'s `resolveOfficeWinner`, used
everywhere `getDayCollect`/`getDayCollects`/`getBenedictusAntiphon`/
`getPsalmodyOverrideFor` used to key off `day.winner` directly — and
`getDayCollects` now renders a real Ant+V/R+collect bundle for a
sanctoral commemoration (`${propers}-commemoration.yml`, e.g.
st-clare-commemoration.yml) when authored, falling back to a *labeled*
bare collect (or a labeled "missing" placeholder) rather than the old
unlabeled one that just read "PRAYER … (translation pending)" with no
indication whose it was.

Remaining gap, now closed (2026-08): `resolveOfficeWinner` deliberately
only kicks in when `temporalCategory === 'ordinary-feria'` (the octave
day has no standing of its own) — the live-verified counterexample was
the Christmas Octave's own stack (Christmas + Stephen + John + Holy
Innocents, e.g. on Dec 30, `privileged-feria-minor`): the *temporal* day
itself keeps the office there ("Dominica Infra Octavam Nativitatis", `{ex
Proprio de Tempore}`), and each of the four octaves gets its own separate
"Commemoratio Octavæ …" Ant+V/R+collect block instead. Fixed by adding a
`kind === 'octave'` branch to `getDayCollects` (gated on
`day.temporalCategory !== 'ordinary-feria'`, the same condition
`resolveOfficeWinner` uses, so an ordinary octave day's already-rendered
primary content never gets a redundant repeat), plus one new
`${id}-octave-commemoration.yml` proper file per octave for the four
Christmas-stack ids (`christmas-day`, `st-stephen-protomartyr`,
`st-john-apostle`, `holy-innocents`), sourced from each Sancti file's own
`[Octava 3]` section in `../divinum-officium-reference` (Second Vespers'
own variant — the reference engine has three slightly different
Octava 1/2/3 texts per octave, roughly Vespers I/Lauds/Vespers II, but
this app's `getDayCollects` renders one shared block regardless of hour,
matching the pre-existing "one Orémus per commemoration, not chained"
simplification already noted above). The Holy Innocents' own English
Octava 3 block turned out to carry a mismatched antiphon in the reference
engine itself (the Common-of-Many-Martyrs "Isti sunt" text, not a
translation of the Latin antiphon printed beside it) — worked around by
sourcing the correct English from that same file's own `[Ant 3]`/
`[Versum 3]` sections instead (same Latin text, correctly paired
translation) — see that file's own comment. Live-verified end-to-end via
`tests/hours/vespers.test.ts`'s `2033-12-30` stacking case (all four
blocks resolve `verified` in both languages, not `missing`). This closes
the octave-content gap listed at the top of this file's "Open work"
section — no octave content work remains open.

## Benedictus antiphons for every sanctoral/temporal entry (in progress)

Full scope, corrected after actually enumerating it (an earlier pass here
under-counted): **109 sanctoral entries have `propers` set** (a saint id
that both a collect and an antiphon key off) and need a real Benedictus
antiphon; **94 more saints have `propers: null`** (no collect *or* antiphon
authored, ever) and are a separate, bigger prerequisite — see below. Plus
**~52 temporal entries** (every numbered Sunday/feria) need one too.

### Confirmed systemic bug, not just "unverified"

Every pre-existing `<saint>-antiphon.yml` file (there were 17, pulled during
the original sanctoral-content sessions, months before Lauds existed) was
sourced from the **Roman/secular rite's raw `[Ant 1]`**, not a live Monastic
1617 query. St. Lawrence's turned out wrong this way; going back and
correcting 3 more (Chair of St. Peter at Rome, St. Agnes, Conversion of St.
Paul) while working January confirms it's the same mistake every time, not
a one-off — **treat all pre-existing antiphon files as wrong until
re-verified against a live Monastic query**, not just flagged for a look.

### Method, worked out the hard way this pass

A saint's raw per-date file (`Latin/SanctiM/MM-DD.txt`, falling back to
`Latin/Sancti/MM-DD.txt`) is *not* a reliable shortcut — Monastic doesn't
always compute the Benedictus antiphon from a literal `[Ant 1]` field (major
feasts like Lawrence draw it from elsewhere entirely), and a shared date
with two co-assigned saints only has *one* real file, which may belong to
whichever saint reliably loses the day, not the one this app's calendar
means to ask about. What actually works: a live `command=prayLaudes` query
on the saint's own date, checked by eye against 2-3 different years for a
title that plausibly names the saint and stays consistent — full automation
kept producing false positives/negatives on exactly these edge cases, so
each result needs a human read, not just a script.

Also found along the way, now fixed: **this app's calendar and the
reference engine's own calendar don't always agree on dates.** St. Hilary
of Poitiers was assigned Jan 23 here; Divinum Officium's own calendar has
him fixed on Jan 14, confirmed directly against the raw `[Officium]` file
(Jan 23's own file is St. Raymond of Peñafort, not Hilary at all). The
original Jan-23 sourcing wasn't fabricated — 2029 is a real year where
Jan 14 lands on a Sunday and every day through the 22nd is already taken,
so Hilary genuinely transfers all the way to the 23rd *that one year* —
but the app had mistaken a transfer-year artifact for his real date. Moved
to Jan 14 in `sanctoral-calendar.yml`; his collect text (unaffected by
which day it's said on) re-confirmed identical; antiphon pulled fresh.
Worth a pass at some point checking whether any other already-authored
saint has the same kind of mismatch.

### Progress

- **January (9 total): done, all 9.** St. Marcellus I, Chair of St. Peter at
  Rome, St. Paul the Hermit, Ss. Fabian and Sebastian, St. Agnes, Ss.
  Vincent and Anastasius, Conversion of St. Paul, St. John Chrysostom, and
  St. Hilary of Poitiers (moved to his real date, Jan 14, per direct
  correction — see above).
- **February (7 total): done, all 7.** St. Agatha, St. Dorothea, St.
  Apollonia, St. Scholastica (translated, source had no English),
  St. Valentine, Chair of St. Peter at Antioch, St. Matthias (source's own
  English existed but was jarringly modern next to everything else's
  archaic register — reworded to match, marked `draft`).
- **March (6 total): done, 5 authored/corrected, 1 flagged.** St. Lucius I,
  St. Thomas Aquinas, the Forty Holy Martyrs, St. Gregory the Great
  (translated, source had no English — the "non Angli sed Angeli" antiphon),
  St. Joseph (corrected). St. Frances of Rome left `missing`: Simplex rank,
  and March 9 always falls within Lent every tested year (2026-2035) — she
  structurally can never win her own day outright under this app's own
  calendar rules, so there's no live-rendered antiphon to source at all.
- **April (8 total): done, all 8.** St. Francis of Paola, St. Leo I,
  Ss. Tiburtius/Valerian/Maximus, St. George, St. Mark, St. Vitalis,
  St. Robert, St. Peter Martyr.
- **May (13 total): done, all 13.** 3 corrected (Ss. Philip and James,
  St. John Before the Latin Gate, the Apparition of St. Michael), 10
  authored fresh (Athanasius, Monica, Stanislaus, Nereus/Achilleus/
  Domitilla/Pancras, Boniface, Ubald, Peter Celestine, Urban I,
  Eleutherius, John I). Urban I/Eleutherius/John I needed 2038 to find a
  year not governed by Ascensiontide/Pentecost/Trinity/Corpus Christi.
- **June (16 total): done, all 16.** 5 corrected (Ss. Basilides/Cyrinus/
  Nabor/Nazarius, the Nativity of St. John the Baptist, Ss. John and Paul,
  Ss. Peter and Paul, Commemoration of St. Paul), 11 authored fresh
  (Ss. Marcellinus/Peter/Erasmus, Ss. Primus and Felicianus, Barnabas
  [reworded English, same register fix as Matthias], Anthony of Padua,
  Basil the Great, Ss. Vitus/Modestus/Crescentia, Ss. Mark and Marcellian,
  Ss. Gervase and Protase, Paulinus of Nola, William Abbot, Leo II).
- **July (9 total): done, all 9.** 1 corrected (Mary Magdalene), 8 authored
  fresh (the Seven Brothers/Rufina/Secunda, Symphorosa and Her Seven Sons,
  Margaret of Antioch, Apollinaris, James the Greater [reworded English,
  same fix as Matthias/Barnabas], Anne, Nazarius/Celsus/Victor I/
  Innocent I, Abdon and Sennen).
- **August (12 total): done, all 12.** 1 corrected (Peter's Chains), 9
  authored fresh (Dominic, Ss. Cyriacus/Largus/Smaragdus, Assumption,
  Bernard, Bartholomew [reworded English, same fix as Matthias/Barnabas/
  James the Greater], Louis, Zephyrinus, Augustine), 2 already correct as
  found (Finding of St. Stephen, the Decollation of St. John the Baptist
  — both plain unmodified matches against the live query, no fix needed).
- **September (5 total): done, all 5.** 1 corrected (Nativity of the BVM),
  4 authored fresh (Matthew [reworded English, same fix as Matthias/
  Barnabas/James the Greater/Bartholomew], Ss. Cyprian and Justina,
  Ss. Cosmas and Damian, Jerome).
- **October (7 total): done, all 7.** Francis of Assisi, Callistus I,
  Luke [reworded English, same fix as Matthias/Barnabas/James the
  Greater/Bartholomew/Matthew], Ss. Chrysanthus and Daria, Vigil of
  Ss. Simon and Jude, Ss. Simon and Jude [same reworded-English fix],
  Vigil of All Saints.
- **November (7 total): done, all 7.** 2 corrected (Cecilia, Andrew), 4
  authored fresh (All Saints, Clement I, Catherine of Alexandria,
  Silvester Abbot). Martin of Tours already matched the live query as
  found, no change needed.
- **December (10 total): done, 9 authored/corrected, 1 flagged.** 2
  corrected (Lucy), 6 authored fresh (Nicholas, Immaculate Conception
  [minor English fix -- the source's own translation said "her Birth"
  for a Conception antiphon, an obvious copy-paste leftover from the
  Nativity-of-the-BVM formula this reuses; corrected, marked draft],
  Damasus, Thomas of Canterbury). Thomas Apostle, Stephen Protomartyr,
  John Apostle, and Holy Innocents already matched the live query as
  found, no change needed. St. Bibiana left `missing`: Simplex rank, and
  Dec 2 falls within Advent in every tested year 2026-2029 -- same
  structural block as St. Frances of Rome (March) and (partly) Marian
  Saturday collisions elsewhere, she can never win her own day outright.

**All 109 sanctoral entries with a `propers` id: done.** 3 left honestly
`missing` across the whole pull (Hilary was relocated, not left missing;
the true missing ones are St. Frances of Rome, St. Bibiana, and Ss.
Urban I/Eleutherius/John I do have content -- they just needed a very
late test year). Every pre-existing antiphon file that predated this
pass has now been checked against a live Monastic query; most needed
correction (confirmed Roman-rite sourced), a handful already matched.
- **All ~52 temporal entries: done, including `christmas-octave-sunday`**
  (see the section above for method and its own correction).
- **94 `propers: null` saints: done (2026-08)** — see the dedicated
  section below for the collect-authoring pass and the era-specific-
  calendar discovery it took to do reliably. Benedictus antiphon: real
  content for all of them except the deliberate `example-confessor` test
  placeholder and Ss. Ursula and Companions (left honestly unset, no way
  to verify a category of one — see her own file's comment) — 66 via a
  shared Common (own dedicated section below); of the other 26 (own
  proper collect), 21 share an existing Common (7 live-query-verified
  directly, 14 more resolved straight from source once "unwinnable"
  stopped being treated as a content blocker — see that section's own
  note) and 5 have real unique text (one, Ss. Euphemia/Lucy/Geminian,
  honestly marked `draft` rather than `verified` since it can never be
  checked against a live rendering). P/T/S/N: done for all 94, and for
  the whole rest of the calendar besides — see "`minorHoursCommon` gap
  swept across the whole calendar" and "The last 2 duplex-majus+ P/T/S/N
  gaps" below; every real saint on this app's calendar has real P/T/S/N
  content now except Ss. Ursula and Companions, same reason as above.

### Bug found and fixed while pulling christmas-octave-sunday's antiphon

`data/calendar/temporal-categories.yml` had christmastide's own Sunday
coded `privileged-sunday` (Advent's tier — never displaced short of
Duplex-majus+, and even then only commemorated in return). Live-checking
all three Duplex-II-classis "Comites Christi" collision dates (St.
Stephen/John/Holy Innocents falling on the Sunday, plus St. Silvester,
plain Duplex) showed the exact reverse: the saint wins outright every
time, the Sunday only commemorated — `ordinary-sunday`'s rule, not
`privileged-sunday`'s. Fixed by reclassifying christmastide's `sunday` to
`ordinary-sunday` (the `feria` side, `privileged-feria-minor`, was
already correct and untouched). New tests in
`tests/calendar/december-sanctoral.test.ts` cover both directions: the
saint winning on the three verified collision dates, and St. Thomas
Becket (Semiduplex) still transferring off the Sunday rather than
winning, unchanged by the fix.

### Bug found while checking February's results — fixed (2026-08)

`hours/resolve-common.ts`'s `splitNamedAntiphon` always marked its output
`verified` regardless of the input status (`verifiedText()` hardcoded it) —
so a `draft`-marked antiphon (Scholastica's translation, Matthias's
reworded English, and every other reworded/translated antiphon from the
sanctoral pull) rendered as if fully verified everywhere it's actually
displayed — silently dropping the "unverified draft text" UI marker
(`src/ui/styles.css`'s `.text-draft`, a dashed underline + tooltip) — even
though the source YAML correctly said `draft`. Affected every split
antiphon across every hour (Prime, Terce, Sext, None, Compline, Lauds),
not just Scholastica/Matthias — pre-existing, just never surfaced until
content with a real `draft` status went through it.

Fixed by having `splitNamedAntiphon` take a real `ResolvedText` (not just
bare text) and carry its actual per-language status through to both the
incipit and full outputs. Callers that only ever had a plain
`Partial<Record<string,string>>` with no status of its own to begin with
(the plain weekday-default antiphons, Lauds psalmody overrides — neither
type tracks a status field, always implicitly verified by their own
live-checked file convention) now wrap with `verifiedText()` explicitly
at the call site instead of that being silently baked into
`splitNamedAntiphon` itself. `resolveMinorHourAntiphon` (Prime/Terce/
Sext/None's own override lookup) now returns a full `ResolvedText` too,
for the same reason. Verified end-to-end with St. Scholastica's own
draft-English antiphon (`tests/hours/resolve-common.test.ts`).

## Mechanism not built at all

- **Vespers ordo — built (2026-08)**: `src/hours/vespers.ts` now resolves a
  full ordo (opening versicle, weekday/seasonal psalmody with the 115+116
  join and 138 split, chapter/responsory/hymn/versicle bundle with
  Advent/Lent/Passiontide/Paschaltide overrides, Magnificat with weekday-
  default antiphon fallback, day-collects) off `resolveEveningDay`, so
  First/Second Vespers precedence and the cross-day commemoration
  (`commemorationOf` — "the loser is commemorated unless the loser is
  simplex", live-verified) both apply before any part runs. See
  `data/hours/vespers.yml`'s header and `tests/hours/vespers.test.ts`.

### Matins ordo — mechanism built, small content slice (2026-08)

`src/hours/matins.ts` was the last stub hour. Built as a genuinely different
shape from every other hour: no static `data/hours/matins.yml` parts list —
the ordo is assembled programmatically per day, since the real structure (1
nocturn on a plain ferial day, 3 on a Sunday or Duplex-and-higher feast,
with a *variable* number of readings) doesn't fit the static-array pattern
every other hour uses.

**Explicit, direct-instruction departures from the historical office** (see
memory `vu-not-a-reconstruction`/`vu-matins-design` — this app was never
meant to reconstruct any one historical form, Matins least of all):
- **Nocturn 1 is always the user's own continuous scripture-reading plan**
  (`src/propers/bible-plan.ts`, sourced from a personal TSV outside this
  repo), never the historical per-day lectionary — a variable number of
  readings per day, and deliberately *not* the Rule of Benedict's own
  "summer" reading contraction (Low Sunday–1st Sunday of November): this
  app reads in full year-round, live-confirmed the reference engine's own
  Monastic 1617 data does apply that contraction (`monastic.pl`'s
  `brevis_monastic`/`legend_monastic`) before deciding not to reproduce it.
- **Recombine, don't reproduce the historical lesson split**: where the
  source splits one continuous work across several numbered lessons purely
  to fill a fixed lesson-count slot, this app joins them into one reading
  (`src/propers/octave-readings.ts`'s `resolvePassages`, now reused outside
  the octave-day store it was built for — extended via the new
  `src/propers/nocturn-readings.ts`). Split only kept where the underlying
  source genuinely changes (e.g. a Gospel pericope vs. the homily on it).
- **Nocturn 3 gated at Duplex-and-higher**, plus every Sunday
  unconditionally — the user's own chosen threshold (real Monastic 1617 is
  more permissive), reusing the already-existing `isDoubleOrHigher` (which
  already means rank ≥ `duplex`, so no new rank helper was needed).
- **Generous multi-source reading inclusion, not winner-takes-all**: every
  commemorated saint (not just the office winner) and every active octave
  contributes its own Nocturn 2/3 reading when authored — mirrors
  `getDayCollects`'s existing "one collect per commemoration" pattern,
  applied to readings. Wired `src/propers/octave-readings.ts`'s
  `getOctaveReading` into a real caller for the first time — it had zero
  callers anywhere in the codebase before this, clearly built ahead of
  Matins and left unwired until now.
- **Gospel sourcing has exactly two allowed sources**: the user's own plan
  (flagged via `isGospel`, book-derived — confirmed the user's plan never
  assigns one on a Sunday, a deliberate editorial choice, not a gap) and
  the day's own genuine *proper* Gospel+homily. **A Common-of-Saints
  fallback Gospel is never used** — `nocturn-readings.ts` has no
  Common-fallback mechanism at all (unlike `collectCommon`/
  `benedictusCommon` elsewhere), so the exclusion falls out of the store's
  own shape rather than needing special-case code.
- **Invitatory (Ps 94) framed like an ordinary antiphoned psalm** — one
  opening (incipit-or-full), one full repeat after — not the historical
  interspersed-refrain shape (confirmed live: real practice repeats the
  antiphon between every verse group). Direct instruction, not an
  oversight.
- **Responsories matched loosely by scriptural book**, not exact citation —
  per the user's own description of how they actually worked historically.
  New seeded pool, `data/hours/matins-responsories-by-book.yml` +
  `src/propers/matins-responsories.ts` (currently just `isa`, from a live
  Advent-ferial query — a real seed, not a full pool).

**Sunday's fixed 12-psalm/3-canticle psalmody** (`data/hours/matins-sunday-
antiphons.yml`) — Nocturn 1 = Ps 20-21/22-23/24-25, Nocturn 2 = Ps
26-27/28-29/30-31 (Rule of Benedict ch. 18's own arrangement, distinct from
Roman Matins' 9-psalm Sunday scheme), Nocturn 3 = 3 OT canticles (Isa
33:2-10, Isa 33:13-18, Sir 36:14-19) under one shared antiphon. Transcribed
from the reference engine's own Monastic-labeled block (`Psalterium/Psalmi/
Psalmi matutinum.txt`'s `[Daym0]`), then live-verified end-to-end
(`command=prayMatutinum`, 2026-09-06) — psalm numbers, canticle citations,
and the 12-lesson/Te Deum sequence all matched exactly. Real gap found
along the way: the reference engine's own UI flags Monastic 1617 Matins as
"still incomplete and under construction" — the pieces actually queried
checked out regardless, but worth remembering if a future pull comes back
looking wrong.

**Real content authored for two clean proof dates** (one per branch, per
this project's usual "mechanism first, minimal live-verified proof, content
later" build order):
- **Ferial**: 2026-12-15 (Tuesday of Advent III) — the user's own plan's
  "Isa 36-37, Wis 14" (citation-only for now; full Vulgate/Douay-Rheims
  import is a deferred separate project, see below), matched against the
  seeded Isaiah responsory pool.
- **Sunday**: 2026-09-06 ("14th Sunday after Trinity", `post-pentecost-15`
  — the Trinity-counted display label and the Pentecost-offset storage id
  are a fixed, already-computed one-off relationship, not something new
  built here) — Nocturn 1 from the user's plan ("Tob 1-2, Sir 45",
  citation-only), Nocturn 2 a real, fully-translated patristic reading
  (St. Gregory the Great, *Moralia in Job*, Bk. 9 — live-transcribed, both
  languages), Nocturn 3 the day's own proper Gospel (Luke 7:11-16, the
  raising of the widow's son at Naim) plus St. Augustine's homily on it
  (Sermon 44), also fully transcribed. Real seam flagged, not papered over:
  this Sunday's *real* historical Nocturn 1 is the Book of Job (confirmed
  live) — Nocturn 2's Job commentary is kept as-is even though this app's
  own Nocturn 1 no longer reads Job that week, since it's real, valuable,
  season-proper patristic content, not tied to any specific saint.
- Two Isaiah chapters actually populated in `src/data/scripture/` (33,
  live-transcribed for the Sunday canticles) — small, real progress against
  the eventual bulk Bible import, not just placeholders.

Verified end-to-end: `tests/hours/matins.test.ts`, both branches, resolving
real dates through the actual `resolveOrdo` mechanism (psalm/canticle
counts, Te Deum presence, reading citations and statuses, Gospel flagging
and its Common-fallback exclusion, responsory matching) — not just checking
the YAML files exist. `npm test` (359 tests) and `npm run build` both pass.

### Reading-pool redesign — done (2026-08)

**Corrected a miscommunication in the original mechanism build above**: readings are now
pool-assembled, not fixed-slotted. Every source that can contribute for a day — the office
winner, every commemorated saint, a transferred-in feast (already folded into `day.winner`
by `resolveDay`, no separate lookup needed), every active octave, the plain temporal id, and
the user's own scripture-plan reading — is gathered into one ordered pool
(`buildReadingPool` in `src/hours/matins.ts`), then sliced into however many nocturns the
day's psalmody has (`distributeIntoNocturns`, ceiling division, pool order preserved). No
reading kind is pinned to a specific nocturn anymore — scripture is no longer reserved for
Nocturn 1, patristic content no longer reserved for Nocturns 2-3.

The 1-vs-3-nocturn psalmody gate (Duplex+/Sunday) is unchanged — it governs psalm/canticle/
Te Deum structure only. It no longer limits which days get patristic content authored or
shown: a sub-Duplex ferial day's single nocturn now pools in patristic/hagiographic content
whenever it's been sourced, alongside the scripture-plan reading — direct instruction, "we
want patristic readings for every saint where we can source one, not just duplex+."

`src/propers/bible-plan.ts`'s `getBiblePlanReadings` is now dual-keyed: most rows still key
off `(temporalId, weekday)`, but the source TSV's Dec 25 - Jan 13 stretch keys off a fixed
`MM-DD` calendar date instead (read straight through regardless of which temporal Sunday
governs the day) — a date can match both keys at once (e.g. a Sunday after Epiphany landing
inside Jan 1-13), and both are pooled rather than one overriding the other. No calendar-date
rows are authored yet (mechanism only); see memory `vu-matins-design` for the full design
writeup. `npm test` (359 tests, unchanged — the two proof dates still resolve the same
content, just via the new pool/distribute path) and `npm run build` both pass.

**Not done in this pass — explicitly deferred, not silently dropped:**
- Full Sunday/feast-calendar patristic-reading authoring — now framed as
  "every saint where a reading can be sourced," not just the ~75 Duplex+
  saints that get their own Nocturn 3 slot (see the reading-pool redesign
  above: content is no longer rank-gated, only nocturn *count* is). **Update
  (2026-08): the post-Pentecost season side of this is now done — see
  "Temporal-cycle nocturn-readings sweep" below.**
- The per-book responsory pool beyond its one seeded book (`isa`).
- The bulk Vulgate (Latin) + Douay-Rheims (English) import into
  `src/data/scripture/` — in scope for the project long-term, explicitly
  deferred past this pass per direct instruction.

### Temporal-cycle nocturn-readings sweep — post-Pentecost season done (2026-08)

The user noticed 2026-08-23's Matins (a plain Sunday, `post-pentecost-13`) was missing its
Nocturn 2/3 patristic reading entirely. Root cause: `post-pentecost-15` (above) was the *only*
temporal id with any `nocturn-readings` content authored — every other ordinary Sunday/week
across the whole year had none, a gap distinct from (and larger than) the sanctoral-saint gaps
tracked elsewhere in this file.

Scope turned out bounded: `calendar/temporal-id.ts`'s `resolveTemporalId` maps every day in a
liturgical week (Sunday and its ferias alike) to the same id, and `hours/matins.ts`'s
`buildReadingPool` already keys nocturn-readings lookup by that shared id — so **one file per
temporal id covers its entire week**, not one file per date. Authored all 23 remaining
`post-pentecost-NN` ids (01-14, 16-24; `-15` already existed) from the reference engine's own
`Tempora/PentNN-0.txt` (Latin) / `English/Tempora/PentNN-0.txt` files:

- **`post-pentecost-01` (Trinity Sunday, Duplex I classis)**: has its own full 9-lesson proper
  office, unlike every other Sunday in the season — Nocturn 2 (St. Fulgentius on the Trinity)
  plus *two* separate Nocturn 3 readings (St. Gregory Nazianzen's homily on Matt 28, and a
  distinct "Commemoratio Dominicæ" — St. Augustine's homily for the displaced First Sunday
  after Pentecost's own Gospel, Luke 6:36-42, which the Duplex I classis feast bumps into a
  commemoration rather than dropping — consistent with this project's generous-commemorations
  principle).
- **`post-pentecost-02` through `-11`**: each has real, unique proper content for *both*
  Nocturn 2 (a patristic/theological excerpt, one continuous author per week — St. John
  Chrysostom, St. Augustine, Pius XI, St. Ambrose, St. Jerome, St. Gregory the Great, etc.) and
  Nocturn 3 (that week's own Gospel pericope + homily). `-11` is the last week in the source
  with its own proper Nocturn 2; every week after it has Nocturn 3 only.
- **`post-pentecost-12` through `-14`, `-16` through `-24`**: Nocturn 3 only (no proper
  Nocturn 2 in the source from here on — the historical Nocturn 1/2 for these weeks is a
  continuous Old Testament book reading with commentary that isn't written out per-Sunday in
  the static files the way the Gospel+homily slot is; sourcing that properly would need
  live-CGI queries per date, out of scope for this pass, left as a known gap rather than
  guessed at). Every week's Lectio7 in the source is a bare "Et réliqua" Gospel incipit, not a
  full pericope — per this project's standing convention, not authored as its own Gospel
  reading; only the homily (Lectio7's own opening paragraph plus Lectio8-9, one continuous
  work) is authored, `isGospel: false`.
- **Responsory reuse discovered and followed**: the source itself cross-references the *same*
  two responsories for the Nocturn 2 and Nocturn 3 homily slots in nearly every week
  (`@Tempora/Pent01-2:ResponsoryN` for Nocturn 2, `@Tempora/Pent01-0:Responsory8` — "Duo
  Séraphim" — for the Nocturn 3 homily), rather than a fresh responsory each week. Resolved
  those cross-references once (from `Pent01-2`/`Pent01-3`/`Pent01-0`) and reused the resulting
  text verbatim across every file that points at them, rather than re-deriving per week.
- **A genuine authoring bug found and fixed mid-pass**: three of the first Nocturn-3-only
  files (`post-pentecost-13`, `-14`, `-16`) initially omitted the homily's own opening
  paragraph — it lives inside the source's `[Lectio7]` section (right after the bare Gospel
  incipit), not `[Lectio8]`, and an early extraction pass started from Lectio8 by mistake.
  Caught by re-diffing each file's opening sentence against the source before moving on;
  fixed by prepending the missing paragraph (Latin + English) to all three. Worth remembering
  for any future pass over this same source shape: always check that a Nocturn 3 homily
  reading's first sentence matches Lectio7's own prose, not Lectio8's.

Live-verified via `npx tsc --noEmit`, `npm test` (452 tests, up from 447 — 5 new cases in
`tests/hours/matins.test.ts`'s new "post-Pentecost season nocturn-readings sweep" describe
block, including a spot-check of 2026-08-23 itself), and `npm run build`. No fixture
collisions from this pass (pure content addition under already-existing ids, no calendar
changes).

**Not done in this pass — explicitly deferred, not silently dropped:**
- The rest of the temporal cycle: Advent (`advent-1..4`), Christmastide
  (`christmas-octave-sunday`), post-Epiphany (`post-epiphany-1..6`), Septuagesima through Lent
  (`septuagesima`, `sexagesima`, `quinquagesima`, `lent-1..4`), Passiontide/Holy Week
  (`passion-sunday`, `palm-sunday`), and Eastertide (`easter-sunday`, `easter-octave`,
  `easter-3..6`, `sunday-after-ascension`, `pentecost-sunday`) — same shape of gap, same
  pipeline, just not yet worked through season by season.
- Sourcing real Nocturn 2 content for `post-pentecost-12` onward via the Pentecost-offset id
  itself — **resolved differently, not left open**, see "Calendar-month/week nocturn-readings
  import" immediately below: that content turned out to be keyed by civil calendar month, not
  Pentecost offset, at the source, so it needed a second id scheme, not a live-CGI lookup.
- Ferial-specific (non-Sunday) content within a post-Pentecost week — not applicable here,
  since the whole week already shares one temporal id/file by design (see above); flagged only
  so a future reader doesn't go looking for `post-pentecost-13-tuesday.yml`-style files that
  were never meant to exist.

### Calendar-month/week nocturn-readings import — done (2026-08)

Follow-up to the post-Pentecost sweep above: the user asked about the "Nocturn 3 only, from
`post-pentecost-12` onward" gap it left open, correctly guessing that the reference engine's
real Nocturn 2 content for those later Sundays lives in older, month-labeled files rather than
being genuinely absent.

Confirmed: `Tempora/08N-0.txt` through `11N-0.txt` (N = 1-5, August-November, ~20 files) — the
old "Scriptura occurrens" reading cycle, "Dominica I-V Augusti/Septembris/Octobris/Novembris."
Each has `[Lectio1]`-`[Lectio3]` (Nocturn 1 scripture — **not imported**, the user's own
bible-plan store already owns that slot) and `[Lectio4]`-`[Lectio6]` (Nocturn 2 patristic
commentary — the actual target).

**The real complication, and why this needed a mechanism addition, not just content files**:
which month-week file governs a given Sunday is *not* a fixed `post-pentecost-NN`
correspondence — it's computed straight from the civil calendar (first Sunday of each month,
with irregularities), and shifts every year with Easter's date. Ported the reference engine's
own `Date.pm::monthday()` sub faithfully into `src/calendar/month-week-id.ts` (`monthWeekId`),
using this app's pre-1955/Tridentine rubric baseline (`Date.pm`'s own `$modernstyle = false`):
no 1960-rubric October week-III vanishing (skipped entirely, since that whole adjustment is
modernstyle-gated); November's backward-from-Advent renumbering for week > 0 *does* still
apply (that part of the source isn't modernstyle-gated). Live-verified against the localhost
CGI instance across 3 different years (2026, 2027, 2028) including the August 1st-falls-on-a-
Saturday skip case and November's real week-II-vanishes case (2026: Nov 1/8/15/22 render "I.
/III./IV./V. Novembris" — II is genuinely skipped that year, matching the ported algorithm
exactly).

Wired in as a **third, independent pooling source** in `hours/matins.ts`'s
`nocturnReadingIds`/`buildReadingPool` — `month-week-<id>` (e.g. `month-week-081`), pooled
alongside (not replacing) the ordinary `temporalId`-keyed lookup, same dual-key precedent as
`propers/bible-plan.ts`'s Dec25-Jan13 calendar-date stretch. All 20 ids authored as
`data/propers/nocturn-readings/month-week-<MMN>.yml`; each file's 3 lessons are one continuous
work (recombined per the standing rule), so one `NocturnReading` per file. `month-week-092`
turned out to cite the exact same Moralia-in-Job passage already authored for
`post-pentecost-15` — reused that existing translation rather than re-transcribing it.

Live-verified via `npx tsc --noEmit`, `npm test` (460 tests, up from 452 — a new "calendar-
month/week nocturn-readings import" describe block in `tests/hours/matins.test.ts` spanning
2026-2028 to prove the date-driven lookup, not a hardcoded id), and `npm run build`. No fixture
collisions (pure content + one new pooling source, no calendar changes).

**Not done in this pass**: the same month-week treatment for whatever Sundays this pass didn't
reach (there are none within Aug-Nov — all 20 files are authored); the rest of the temporal
cycle (Advent through Eastertide, per the post-Pentecost sweep's own "not done" list above)
remains open and is unrelated to this particular gap.

**Ordering bug found and fixed same day**: pooling a `temporalId`'s own file (Nocturn 3 only,
for a late post-Pentecost Sunday) alongside a separately-sourced `month-week-<id>` file
(Nocturn 2 only) put the Nocturn 3 reading ahead of the Nocturn 2 reading in the pool — the two
sources were being concatenated in `nocturnReadingIds` set order, not grouped by each reading's
own `nocturn` tag, so `distributeIntoNocturns`'s front-light positional slotting (1st pool
reading -> Nocturn 1, 2nd -> Nocturn 2, rest -> Nocturn 3) put the Nocturn-3-tagged reading into
the Nocturn 2 slot and vice versa. Confirmed live on the date that surfaced the whole month-week
gap in the first place (2026-08-23, `post-pentecost-13` + `month-week-084`): St. Gregory's
Moralia commentary (tagged `nocturn: 2`) was showing up after St. Augustine's homily (tagged
`nocturn: 3`) instead of before it. Fixed in `buildReadingPool` (`hours/matins.ts`) by bucketing
every contributing id's readings by `reading.nocturn` and emitting the buckets in ascending
numeric order — not hardcoded to `[2, 3]`, since Ember days' own nocturn-readings files use
`nocturn: 1` for their single-nocturn structure, and an initial `[2, 3]`-only version of this
fix silently dropped those (caught by `tests/calendar/ember-days.test.ts` failing). Within each
bucket, id order (and each file's own reading order) is preserved, matching this pool's usual
priority rule. `npm test` green at 460 tests — no fixture changes needed, since every
previously-authored id's own file already had its readings correctly ordered internally; only
the cross-source case this pass introduced was actually broken.

### Nocturn-readings responsory marker fix — done (2026-08-23)

Every `data/propers/nocturn-readings/*.yml` responsory with a `responsory:` field (53 files:
all 24 `post-pentecost-*`, all 20 `month-week-*`, the 6 Ember-day files, plus `st-monica`,
`st-marcellus-i`, `apparition-of-st-michael`) started straight into the Latin/English text with
no leading marker, unlike `data/propers/octave-readings/*.yml`'s own convention of an explicit
`℟.`/`℣.` at the start of each line. User flagged this via the Augustine reading on
2026-08-23's date and explicitly chose to fix it in content, not by injecting a marker at
render time. Given each file already uses plain `V.`/`R.` (not the `℣.`/`℟.` glyphs) for the
versicle and the mid-responsory repeat, `R. ` was prepended to just the opening `la`/`en` text
of each responsory to match that same plain-letter convention already used internally by these
same files — not a switch to octave-readings' Unicode-glyph convention, which remains a
separate, still-open reconciliation between the two stores if it's ever wanted. Mechanical,
scripted edit (53 files, idempotent — skips any responsory already starting `R. `), verified no
unexpected format by having the script flag anything it couldn't parse (none found). `npm test`
(460), `tsc`, and `npm run build` all still green — pure content edit, no code/mechanism change.

### Pre-1955-but-post-1617 saints' Matins readings — done (2026-08)

Resolved the former "mechanism gap" above into a concrete, scoped content pass — no new
mechanism was actually needed, since `nocturn-readings.ts`/`buildReadingPool` already accept
content from any source once authored (see the reading-pool redesign above); this was a
sourcing gap, not a design gap.

**Method**: read the reference engine's own files directly on disk (`../divinum-officium-reference`),
not live queries — `web/www/horas/Latin/Sancti/MM-DD.txt` is the Tridentine track (Sancti, no
`M`), `web/www/horas/Latin/SanctiM/MM-DD*.txt` the Monastic track. A saint with a `Sancti/`
file but no `SanctiM/` file at all (any suffix) never existed in Monastic 1617, confirming the
pre-1955-but-post-1617 case. **Critical wrinkle found and now memory'd** (see memory
`vu-reference-engine-file-layout`, `vu-matins-pre1955-saints`): the plain, unsuffixed
`Sancti/MM-DD.txt` is very often the *wrong* saint — the general/Tridentine calendar keeps
piling later canonizations onto the same date slot in that file, displacing the older saint
into a suffixed sibling file (`01-23o.txt`, `03-04cc.txt`, etc.) or, in one case (St. Paul the
Hermit), an entirely different date. Every one of the ~52 candidates was individually verified
by `[Officium]` match, not assumed from the filename.

**Scope, computed against `sanctoral-calendar.yml`'s 204 saint-day entries**: 52 pre-1955-only
candidates (`Sancti/` present, no `SanctiM/` at all, any suffix); of these, 43 had real proper
lesson content to author, 9 turned out to be pure Common-of-X with no proper text in the
source at all (`st-lucius-i`, `vigil-of-st-james`, `st-christina`, `vigil-of-st-bartholomew`,
`ss-twelve-brothers`, `vigil-of-ss-simon-and-jude`, `st-saturninus`, `st-sabbas`,
`vigil-of-st-thomas` — correctly left unauthored, not a gap). All 43 authored as
`src/data/propers/nocturn-readings/<id>.yml`, same shape and combine-where-sensible rule as
the two original proof dates. A few readings reuse already-verified text from
`post-pentecost-15.yml` where the source file itself cross-references another day's lessons
(e.g. `st-monica`'s Nocturn 3 Gospel, the same Luke 7:11-16 pericope). A handful of bare
Gospel pericopes were left unauthored where the source gives only an incipit ("Et réliqua")
and no full text was available to transcribe (flagged per-file, not silently dropped) — same
deferral as the bulk Vulgate/Douay-Rheims import. One saint (`st-anicetus`) has an
English-source transcription bug (Latin duplicated under the English heading) — this
project's own translation used instead, marked `draft`.

`npm test` (365 tests, all passing — none of the new saints are in a test table yet, same as
the bible-plan bulk conversion) and `npm run build`/`tsc --noEmit` both pass.

**Not done in this pass**: the larger pool of saints that *do* have a Monastic 1617
(`SanctiM/`) track — same authoring shape, separate/older backlog item (see priority §2 above).

### SanctiM (Monastic 1617)-track saints' Matins readings — done, all 12 months (2026-08)

The complementary pool to the pre-1955 pass above: saints with a `SanctiM/MM-DD*.txt` file.
**Method finding, worth recording**: a `SanctiM/MM-DD.txt` file almost always turns out to be
a thin *rule override* (`@Sancti/MM-DD` plus tweaks to psalmody/lesson-count/antiphons), not
independent content — when it doesn't override the Nocturn 2/3 `[LectioN]` sections, that
saint's Monastic-office vita reading is **the same text as the Tridentine `Sancti/MM-DD.txt`
file**, sourced exactly as in the pre-1955 pass above. Only a real Monastic-only saint (one
with no `Sancti/MM-DD*.txt` at all, e.g. `st-maurus-abbot`, who isn't on the general
Tridentine calendar) needs content read directly out of the `SanctiM/` file itself.

**A second wrinkle, on top of the pre-1955 pass's "don't trust the plain file" one**: the
"does a `SanctiM/MM-DD*.txt` exist for this date" scope check has to be done **per saint, not
per date** — a shared calendar date (two ids mapped to the same `MM-DD`) can have a `SanctiM`
file for one saint's own Tridentine slot while the other saint has no Monastic office at all.
Naively globbing "any `SanctiM/MM-DD*.txt` exists for this date" over-counts: found this by
hand for Jan 18 (`chair-of-st-peter-at-rome` has `SanctiM/01-18.txt`; `st-prisca`, sharing the
date, does not — she was actually a missed pre-1955-pool candidate) and Jan 14
(`st-hilary-of-poitiers` has `SanctiM/01-14.txt`; `st-felix-presbyter`, sharing the date via
`Sancti/01-14cc.txt`, does not — likewise a missed pre-1955-pool candidate). Both were authored
this pass using the pre-1955 pattern instead. **The 52/117 pre-1955/SanctiM split recorded
above is therefore an undercount on the pre-1955 side** by at least these two; the true
per-saint (not per-date) recomputation used for this pass found **152 ids with a genuine,
correctly-suffix-matched `SanctiM` file** — see memory `vu-matins-pre1955-saints` for the
running correction note.

**A third finding**: a `Sancti`/`SanctiM` date landing inside the Christmas or Epiphany octave
(e.g. `st-telesphorus` Jan 5, `st-hyginus` Jan 11 — both early popes commemorated on octave
days) can have its entire Nocturn 2/3 given over to octave-of-the-season homiletic content
(a Nativity/Epiphany sermon), with **no proper vita text for the saint at all** in either
track. Correctly left unauthored for these two — not a gap, same category as the pre-1955
pass's 9 pure-Common exceptions, just a different underlying reason (octave-absorbed, not
Common-of-X).

**January done (11 saints, 2 left unauthored per the octave finding above)**:
`st-hilary-of-poitiers`, `st-felix-presbyter`, `st-maurus-abbot` (Monastic-only; no English
source translation exists in the reference engine at all for this file, so `en` is this
project's own translation, marked `draft`), `st-anthony-abbot`, `chair-of-st-peter-at-rome`
(Nocturn 2 patristic + Nocturn 3 genuine Gospel-and-homily, both authored),
`st-prisca`, `ss-fabian-and-sebastian`, `st-agnes`, `ss-vincent-and-anastasius`,
`conversion-of-st-paul`, `st-john-chrysostom`. `st-telesphorus`, `st-hyginus` (octave-absorbed,
see above) were originally left unauthored here — **since authored, see "Octave-absorbed and
Vigil-only readings" below.** `npm test`/`tsc --noEmit` both pass; none of these are in a test
table yet, same as the pre-1955 pass.

**February done (8 saints, 1 left unauthored as Common-only, 1 vigil left unauthored as
Common-only)**: `st-ignatius-of-antioch` (Nocturn 2 patristic vita + Nocturn 3 homily-only,
bare Gospel incipit not transcribed per convention), `st-agatha`, `st-dorothea` (turned out to
be a missed pre-1955-pool candidate, not a real SanctiM case — the SanctiM file for this date
belongs to St. Titus, who shares Feb 6 and isn't on vu's own calendar), `st-romuald`,
`st-scholastica`, `st-simeon` (also a missed pre-1955-pool candidate — the SanctiM file at this
date is unrelated content for St. Bernadette Soubirous, not Simeon),
`chair-of-st-peter-at-antioch` (Nocturn 2 patristic + Nocturn 3 homily-only), `st-matthias`
(Nocturn 3 homily-only; Nocturn 2's own Lectio4-6 falls back to Common of an Apostle, not
proper text). Left unauthored: `st-valentine` (Lectio93 itself is `@Commune/C2:Lectio4` —
Common-only, no proper text in the source at all) and `vigil-of-st-matthias` (Vigilia rank,
`ex C1v`, no Lectio content at all — Common-only). `npm test`/`tsc --noEmit` both pass.

**A fourth SanctiM-pass finding, from this month**: a bare Gospel incipit ("Et réliqua") with
a genuine patristic homily following it (`st-ignatius-of-antioch`'s Nocturn 3,
`chair-of-st-peter-at-antioch`'s Nocturn 3, `st-matthias`'s Nocturn 3) is now authored as the
homily alone, `isGospel: false`, not combined with the bare incipit line and not marked
`isGospel: true` — cleaner than `chair-of-st-peter-at-rome`'s January file, which included the
incipit line under `isGospel: true` despite not having the full pericope text. That January
file is left as-is (not wrong, just an earlier, less clean judgment call) — this convention
applies going forward.

**March done (6/6 saints)**: `st-thomas-aquinas`, `st-frances-of-rome`, `forty-holy-martyrs`,
`st-gregory-the-great` (Lectio7-9's Gospel+homily is generic Chair-of-Peter content copied
verbatim into this file, unrelated to Gregory — same lessons as
`chair-of-st-peter-at-rome.yml`'s own sourcing, not proper to this feast, so not authored
here), `st-joseph`, `st-benedict` (Duplex I class patronal feast — the richest SanctiM case yet:
Nocturn 2 sourced from `Sancti/03-21.txt`'s own vita per the usual pattern, but Nocturn 3 is
**genuinely Monastic-only content not found in `Sancti/` at all** — a St. Peter Damian sermon
preached specifically for Benedict's own feast; no `English/SanctiM/03-21.txt` exists in the
reference engine, so `en` for that reading is this project's own translation, marked `draft`).
`npm test`/`tsc --noEmit` both pass.

**April done (9/9 saints)**: `st-leo-i`, `ss-tiburtius-valerian-and-maximus` (missed
pre-1955-pool candidate — the date's only SanctiM file belongs to St. Justin, who shares Apr 14
and isn't sourced this way), `st-george` (a reference-engine data bug: `Sancti/04-23.txt`'s own
`[Lectio94]` Latin section actually contains English prose — same kind of bug as `st-anicetus`
in the pre-1955 pass — so `la` here is this project's own translation, marked `draft`;
`en` is the source text, genuinely present just filed under the wrong heading, `verified`),
`st-mark`, `ss-cletus-and-marcellinus`, `st-vitalis`, `st-robert` (genuinely Monastic-only, no
`Sancti/04-29*.txt` at all; no English source translation exists either, so `en` is this
project's own translation, `draft`), `st-catherine-of-siena` and `st-peter-martyr` (a newly
found **date-swap wrinkle**: this app's calendar has Catherine on Apr 29 and Peter Martyr on
Apr 30, the *opposite* of the general Tridentine calendar's own Apr 29/Apr 30 pair — both
sourced from their real, off-date Tridentine files, the same off-date pattern as St. Paul the
Hermit in the pre-1955 pass; Peter Martyr in particular has no genuine SanctiM match at either
date, so also a missed pre-1955-pool candidate). `npm test`/`tsc --noEmit` both pass.

**May done (12/13 saints, 1 left unauthored as Common-only)**: `ss-philip-and-james` (Nocturn 3
has a *full* Gospel pericope, John 14:1-13, not a bare incipit — the first case since
`chair-of-st-peter-at-rome` in January where `isGospel: true` was actually warranted),
`st-athanasius`, `ss-alexander-eventius-theodulus-and-juvenal` (missed pre-1955-pool candidate —
SanctiM's own suffix-matched file just narrows the joint feast, same pattern as
`ss-vincent-and-anastasius`/`ss-cletus-and-marcellinus`), `st-john-before-the-latin-gate`,
`st-gregory-nazianzen`, `ss-nereus-achilleus-domitilla-and-pancras`, `st-boniface` (missed
pre-1955-pool candidate — the date's only SanctiM file is a different, later saint), `st-ubald`
(same), `st-peter-celestine`, `st-pudentiana` (missed pre-1955-pool candidate — shares its date
with Peter Celestine, whose SanctiM file the naive per-date check matched instead), `st-urban-i`
and `st-john-i` (both missed pre-1955-pool candidates via the "plain file is the wrong,
later saint" wrinkle). Left unauthored: `st-romanus-abbot` — turns out to have a real
`SanctiM/05-22M.txt` file after all (resolving the earlier "neither file" mystery from the
pre-1955 pass), but it carries no Lectio content at all, only `vide C5b` (Common of a
Confessor) — Common-only, not a gap. `npm test`/`tsc --noEmit` both pass.

**June done (12/13 saints, 1 left unauthored as no-proper-content)**:
`ss-marcellinus-peter-and-erasmus`, `ss-primus-and-felicianus`, `st-barnabas`,
`st-basil-the-great`, `ss-vitus-modestus-and-crescentia`, `ss-mark-and-marcellian` (missed
pre-1955-pool candidate), `nativity-of-st-john-the-baptist`, `st-william-abbot` (a genuine
Monastic-only vita exists too, but its content is essentially identical to the Tridentine
track's own account and only the Tridentine track has an English translation, so sourced from
there instead), `ss-john-and-paul`, `st-leo-ii` (off-date, like St. Paul the Hermit in the
pre-1955 pass — the general calendar keeps him on Jul 3, not Jun 28), `ss-peter-and-paul`
(Duplex I class), `commemoration-of-st-paul`. `vigil-of-st-john-the-baptist` was originally left
unauthored here as "only a Nocturn 1, no content" — **wrong: `Lectio1-3` turned out to be real
homiletic content, just filling the Vigil's simpler single-nocturn slot; since authored, see
"Octave-absorbed and Vigil-only readings" below.** `npm test`/`tsc --noEmit` both pass.

**July done (13/18 saints, 5 left unauthored as Common-only)**: `ss-seven-brothers-rufina-and-secunda`,
`st-pius-i`, `st-john-gualbert`, `st-anacletus`, `st-alexius`, `ss-symphorosa-and-seven-sons`
(the last four missed pre-1955-pool candidates — see the ninth finding below), `st-bonaventure`
(a reference-engine translation-misalignment bug — its English section boundaries don't line up
with the Latin, so `en` here is this project's own translation, `draft`), `st-mary-magdalene`,
`st-apollinaris`, `st-james-the-greater`, `st-anne`, `st-martha`, `ss-abdon-and-sennen`. Left
unauthored (Common-only, no proper text at all in the source): `ss-nabor-and-felix`,
`st-margaret-of-antioch`, `st-liborius`, `st-christopher`, `ss-felix-simplicius-faustinus-and-beatrix`.
`npm test`/`tsc --noEmit` both pass.

**A ninth finding, from July**: the Monastic calendar keeps a full **Octave of St. Benedict**
(Jul 11-18, since his own feast is Mar 21 but his Monastic-only "Transitus" observance sits in
July) — every SanctiM file at these dates that isn't a saint's own real match turns out to be
"Nth day within the Octave of St. Benedict" content, not a genuine candidate mismatch to
puzzle over. Recognize this pattern (`In Octava S. P. N. Benedicti Abbatis`) and move on
quickly rather than re-investigating it saint by saint.

**August done (13/16 saints, 3 left unauthored as no-proper-content)**: `st-peter-ad-vincula`,
`ss-machabees` (missed pre-1955-pool candidate), `st-stephen-i` (missed pre-1955-pool, "plain
file is a different, later saint" trap), `st-dominic`, `ss-cyriacus-largus-and-smaragdus`,
`st-clare` (missed pre-1955-pool candidate), `st-lawrence` (Duplex I class), `st-bernard`,
`st-bartholomew`, `st-augustine`, `decollation-of-st-john-baptist`, `st-sabina` (missed
pre-1955-pool candidate), and `assumption` — the Duplex I class feast of the B.V.M. itself,
confirming this app's calendar does map the Assumption despite the parent CLAUDE.md's older
note that fixed BVM/Lord feasts were "not modeled by this app at all yet"; Nocturn 1's own
scripture (Song of Songs) left to the bible-plan store per this project's usual split, only
Nocturn 2/3 patristic/Gospel content authored here. Left unauthored (no proper content at all
in the source, same category as prior Common-only/Vigil exceptions): `ss-nabor-and-felix`-style
`st-romanus` and `st-hermes` (both Common-only). `vigil-of-st-lawrence` was originally left
unauthored here as "Nocturn 1 only, no content" — **wrong, same correction as
`vigil-of-st-john-the-baptist`; since authored, see "Octave-absorbed and Vigil-only readings"
below.** `npm test`/`tsc --noEmit` both pass.

**September done (9/9 saints, full month)**: `nativity-bvm`, `st-hadrian` (missed pre-1955-pool
candidate), `st-matthew`, `ss-maurice-and-companions` (missed pre-1955-pool), `st-linus`,
`st-thecla` (missed pre-1955-pool), `ss-cosmas-and-damian`, `st-michael` (Dedication of St.
Michael the Archangel — its SanctiM file structurally borrows from his own separate May 8
Apparition file but the actual Lectio content resolves back to this day's own Sancti file),
`st-jerome`. `npm test`/`tsc --noEmit` both pass.

**October done (9/13 saints, 4 left unauthored as Common-only or no-content)**: `st-remigius`,
`st-francis`, `ss-placid-and-companions`, `st-marcus` (missed pre-1955-pool candidate),
`st-callistus`, `st-luke`, `st-hilarion`, `ss-chrysanthus-and-daria`, `ss-simon-and-jude`. Left
unauthored: `st-justina` and `st-gall` (both genuinely Monastic-only — no `Sancti/` file at all
— but their own `SanctiM` files are themselves Common-only, `vide C6`/`vide C5b`, no proper
Lectio content to source), `ss-ursula-and-companions` (Common-only, no proper content — matches
this file's own earlier flag in the "individually-flagged content gaps" section), and
`vigil-of-all-saints` (re-checked per "Octave-absorbed and Vigil-only readings" below: its
`Lectio1-3` are genuinely a bare `@Commune/C3:Lectio7-9 in 2 loco` rubric, not real content like
the other two vigils below turned out to be — correctly still unauthored). `npm test`/`tsc
--noEmit` both pass.

**November done (14/16 saints, 2 left unauthored as Common-only)**: `all-saints`,
`st-martin-of-tours`, `st-menna` (missed pre-1955-pool), `st-martin-i` (off-date, like St. Paul
the Hermit — general calendar keeps him Nov 12, this app's own Nov 12 goes to St. Emilian),
`all-saints-of-the-benedictine-order` (genuinely Monastic-only, and unusually one of the few
such cases with both rich content *and* an available English translation),
`dedication-of-the-basilicas-of-ss-peter-and-paul` (missed pre-1955-pool; one sentence of the
source's own English translation was left untranslated, so `en` for that reading is `draft`),
`st-pontian` (missed pre-1955-pool), `st-cecilia`, `st-clement`, `st-felicitas` (missed
pre-1955-pool), `st-chrysogonus` (missed pre-1955-pool), `st-silvester-abbot`,
`st-peter-of-alexandria` (missed pre-1955-pool), `st-andrew`. Left unauthored (Common-only, no
proper text at all in the source): `st-emilian`, `st-odo` — both genuinely Monastic-only but
with no Lectio content in their own SanctiM files, the same wrinkle as `st-justina`/`st-gall`
in October. `npm test`/`tsc --noEmit` both pass.

**December done (13/15 saints, 2 left unauthored as Common-only) — final month, pass
complete**: `st-bibiana`, `st-nicholas`, `st-ambrose`, `immaculate-conception` (two genuinely
distinct Nocturn 2 sources kept as separate readings — St. Jerome's sermon, and the Acts of Pius
IX defining the dogma in 1854), `st-damasus`, `st-lucy`, `st-thomas-apostle`,
`st-stephen-protomartyr`, `st-john-apostle`, `holy-innocents`, `st-thomas-becket`,
`st-silvester-i`, `st-eusebius-of-vercelli` (off-date, missed pre-1955-pool candidate — vu
places him Dec 15 via Monastic 1617's own same-day redirect, but his real proper content is at
the general Tridentine calendar's Dec 16; no SanctiM file exists for him at either date). Left
unauthored (Common-only, no proper text at all in the source): `st-barbara` (correct file
`Sancti/12-04o.txt`) and `st-melchiades` (correct file `Sancti/12-10o.txt` — this also corrects
an earlier wrong "neither Sancti nor SanctiM file" claim about him in memory
`vu-matins-pre1955-saints`, the same "verify by opening the file, not just checking existence"
lesson as November's St. Romanus Abbot correction). Adding `st-eusebius-of-vercelli`'s content
surfaced a 3rd Matins lesson on the fixed Advent III Tuesday proof date (`tests/hours/
matins.test.ts`, Dec 15 falls under his commemoration) — updated that test's expected lesson
count from 2 to 3, not a regression: exactly the "commemorations get their own reading" design
working as intended once real content exists to surface. `npm test` (365 tests) and `tsc
--noEmit` both pass.

**Pass complete**: all 12 months (January-December) of the SanctiM-track saints' Matins
readings are now done — 133 saints authored across the whole year, the rest correctly left
unauthored as Common-only/no-content cases. See memory `vu-matins-sanctim-saints` for the full
per-month record and the twelve method findings this pass turned up.

### Octave-absorbed and Vigil-only readings — corrected policy, 4 saints authored (2026-08)

**Direct instruction, correcting this pass's own earlier judgment call**: "octave-absorbed"
(the day's Nocturn 2/3 given over to a Nativity/Epiphany homily instead of the saint's own
vita) and "Vigil, Nocturn 1 only" were both being treated as "no content, correctly left
unauthored" — wrong. This app pools readings first and figures out how/where to display them
later (see `hours/matins.ts`'s own `buildReadingPool` header); real, sourceable text at a
saint's own calendar slot should go into that pool even when it isn't proper to that particular
saint, rather than being withheld because it came from "a different rubric variant." Four
saints previously left unauthored for these two reasons are now authored, flagged in each
file's own header as not-proper-to-the-saint:

- `st-telesphorus` (Jan 5) — St. Augustine's Christmas-octave sermon (Nocturn 2) + St. Jerome's
  homily on Matt 2:19-23 (Nocturn 3), neither proper to Telesphorus himself.
- `st-hyginus` (Jan 11) — St. Fulgentius's Epiphany sermon (Nocturn 2) + St. Ambrose's homily on
  Matt 2:1-12 (Nocturn 3), neither proper to Hyginus himself.
- `vigil-of-st-john-the-baptist` (Jun 23) — St. Ambrose's homily on Zachary and Elisabeth
  (Luke 1:5-17), authored from `Lectio1-3`, the Vigil's own single 3-lesson nocturn (not the
  usual `Lectio4-9` Nocturn 2/3 slot a full feast uses).
- `vigil-of-st-lawrence` (Aug 9) — Pope St. Gregory the Great's homily on self-denial
  (Matt 16:24-27), same `Lectio1-3` single-nocturn source.

`vigil-of-all-saints` (Oct 31) was re-checked under this same corrected policy and confirmed
still genuinely contentless — its `Lectio1-3` are a bare `@Commune/C3:Lectio7-9 in 2 loco`
rubric with no proper text at all, unlike the two Vigils above. Not every "left unauthored"
case from this pass needs revisiting — only the octave-absorbed and Vigil-only categories were
affected by this policy correction; genuine Common-only cases (a bare `@Commune` rubric with no
Lectio text anywhere) are unaffected and remain correctly unauthored.

Adding these introduced no new lesson-count regressions in `tests/hours/matins.test.ts` (none
of its fixed proof dates fall on Jan 5/11 or Jun 23/Aug 9). `npm test` (365 tests) and `tsc
--noEmit` both pass.

### Aug 5 martyrology English gap, and "Our Lady of the Snows" added (2026-08)

Two separate fixes, both discovered by re-checking a claim in this file that turned out stale.

**Martyrology, Aug 5**: `src/data/martyrology/08-05.yml`'s Latin text opens with "Romæ, in
Exquíliis, Dedicátio Basílicæ sanctæ Maríæ ad Nives" (the dedication of St. Mary Major, i.e.
Our Lady of the Snows) — but the file's own English translation silently dropped the
corresponding sentence, starting straight in on the day's other martyrs instead, even though
the reference engine's own `English/Martyrologium/08-05.txt` has it ("Upon the 5th day of
August is kept the dedication of the Church of St. Mary in the Snow upon the Esquiline Hill at
Rome, in the year 366."). Restored.

**"Our Lady of the Snows" (Aug 5) added to the calendar.** `sanctoral-calendar.yml`'s own
August comment had excluded her entirely as "a fixed BVM feast, same convention as
Purification/Annunciation" — wrong, on re-reading the actual source: unlike the truly
unmodeled cases in that same comment (saints permanently subordinate to an unmodeled octave or
to the fixed Transfiguration), she isn't blocked by any of that, and this app already models
three other fixed BVM feasts identically (`assumption`, `immaculate-conception`,
`nativity-bvm`). `Sancti/08-05.txt`'s untagged `[Rank]` block gives her a real Duplex Majus
rank with real Nocturn 2/3 content (`Lectio4-6`, the miraculous-snowfall founding legend of the
basilica of St. Mary Major — both Latin and English present, plus a simplex-fallback
`[Lectio94]` retelling not separately authored). `SanctiM/08-05.txt` confirms she's on the
Monastic 1617 track too, inheriting `@Sancti/08-05` and reslicing the same Lectio4-6 into its
own 12-lesson structure — no separate Monastic-only content.

Unlike the other three BVM feasts, she has **no proper collect or Benedictus antiphon of her
own** — her `[Rule]` says `ex C11` (Common of Feasts of the BVM), and `Commune/C11.txt`'s own
`[Oratio]`/`[Ant 1]` (with full English) supplied both. First pass at this wrongly authored
that Common text as if it were her own private file via `propers:` — corrected per direct
feedback: `collect-c11.yml` and `benedictus-antiphon-common-of-the-bvm.yml` are real, reusable
Common templates now, wired in via `SaintRecord.collectCommon`/`benedictusCommon` exactly like
any other Common-only saint (e.g. St. Barbara), not a one-off duplicate. `collect-c11`'s own
text has no `{N}` name placeholder (it addresses "fámulis tuis" generically, not the saint by
name, unlike every other `collect-c*.yml`) — `collectName` is still required by
`getDayCollect`'s own lookup, so set to empty arrays, never actually substituted.

Live-checked via direct resolution (not a browser query, per
[[vu-reference-engine-file-layout]]): she wins outright on 2026-08-05 and 2027-08-05, with her
Benedictus antiphon, day collect, and Matins reading all resolving `verified`. `npm test` (365
tests) and `tsc --noEmit` both pass.

### Four more "not modeled" fixed Lord's/BVM feasts added (2026-08)

Per direct instruction ("import the sanctoral content that exists" — this app isn't
reconstructing any one calendar, and content beyond what the user's own final calendar keeps is
still worth having so others can build their own): swept every remaining "fixed Lord's/BVM
feast, not modeled" exclusion in `sanctoral-calendar.yml` the same way Our Lady of the Snows was
just fixed, rather than treating that as a one-off. All four turned out to have real, complete
source content too:

- **Finding of the Holy Cross** (May 3, Duplex II Classis) — her `[Rule]` is `proprium`: fully
  own text throughout (collect, antiphon, Nocturn 2/3). Now wins outright over
  `ss-alexander-eventius-theodulus-and-juvenal`, exactly matching what that saint's own file
  already documented as the live-verified reality ("loses the day to the Finding of the Holy
  Cross... this isn't just an artifact of the specific year checked") — her file had simply
  never been given a real competitor to lose to until now.
- **The Transfiguration of Our Lord** (Aug 6, Duplex II Classis) — same `proprium` shape, fully
  own text throughout. Its three subordinate saints (Ss. Xystus/Felicissimus/Agapitus) are
  still excluded — no longer because the Transfiguration itself is unmodeled, but because of
  the same real, separate octave/subordination-rendering gap that already blocks St. Clare et
  al.
- **The Exaltation of the Holy Cross** (Sep 14, Duplex Majus) — her `[Rule]` is
  `ex Sancti/05-03`: reuses the Finding of the Holy Cross's content wholesale. Collect/antiphon
  reuse via a cross-id `propers` pointer (`propers: finding-of-the-holy-cross`, same pattern as
  `st-michael.yml`'s `apparition-of-st-michael`) rather than duplicate files; the Matins
  nocturn-readings mechanism has no equivalent cross-id lookup (`getNocturnReadings` keys
  strictly off the saint's own id), so `exaltation-of-the-holy-cross.yml` duplicates
  `finding-of-the-holy-cross.yml`'s reading content instead.
- **Dedication of the Basilica of the Most Holy Savior** (Nov 9, i.e. the Lateran, Duplex II
  Classis) — her `[Rule]` is `ex C8` (Common of the Dedication of a Church, already modeled —
  `collect-c8.yml`/`benedictus-antiphon-common-of-a-dedication.yml` already existed from
  `dedication-of-the-basilicas-of-ss-peter-and-paul.yml`, reused directly here, not duplicated),
  but real unique `Lectio1-6(+6a)` vita content of her own. Her secondary, St. Theodore, is
  still excluded — same real octave/subordination gap as the Transfiguration's secondaries
  above (her own embedded `[Commemoratio 5]` block already carries his real collect too, ready
  to use once that mechanism exists).
- **The Presentation of the BVM** (Nov 21, Duplex Majus, itself a Monastic-1617-only addition)
  — has a real, unique `[Oratio]` of her own (unlike Our Lady of the Snows), but her
  `[Ant 1]` is a *substituted* Common reference (`@Commune/C10:Ant 2_`, with a
  feast-specific `s/Christo:.*/Christo, allelúja./` truncation applied and computed by hand,
  not shared verbatim by any other saint) — authored as her own file via `propers`, same
  "substitution makes shared-formula text effectively proper" reasoning as
  `st-lucy-collect.yml`.

**Correction to Our Lady of the Snows found during this same sweep**: her own file had no
Lectio7-9 either, and — like the Presentation of the BVM — this means she defers to
Commune/C11's own Nocturn 3 (a bare Gospel incipit, Luke 11:27-28, plus the Venerable Bede's
homily). Missed in the first pass (only her Nocturn 2 vita was authored); added now, identical
content to `presentation-of-the-bvm.yml`'s own Nocturn 3, duplicated for the same
no-cross-id-lookup reason as Exaltation/Finding of the Holy Cross above.

**One real bug caught before committing**: Finding of the Holy Cross's own collect/antiphon
files were never actually created in the first draft (only Exaltation's cross-id pointer to
them was written) — both resolved `missing` on live verification. Caught by re-checking every
new feast end-to-end via direct resolution before committing, not assumed correct from the
file list alone; fixed immediately, re-verified.

**Test updates, not regressions**: three tests had fixed proof dates that happen to collide
with the newly-added feasts, all updated to reflect the new, correct behavior rather than the
old absence: `tests/calendar/may-sanctoral.test.ts` (Finding of the Holy Cross now correctly
outranks its stub competitor instead of winning by the stub's own default), and
`tests/calendar/day-label.test.ts` (two dates — Nov 9 and 1943-11-21 — now show the new saint's
name instead of a ferial fallback label, the latter because Duplex Majus already meets this
app's own pre-existing privileged-Sunday rank threshold in `commemorations.ts`, not new
behavior). `npm test` (365 tests) and `tsc --noEmit` both pass.

### Matins psalmody overrides — mechanism built, one proof (2026-08)

Real bug found and fixed: `hours/matins.ts`'s `threeNocturns` gate (Sunday, or a Duplex+
sanctoral winner) correctly governed *nocturn count*, but the code also unconditionally reused
the literal Sunday psalmody (`matins-sunday-antiphons.yml`, Ps 20-31) as *content* for every
three-nocturn day — including a Duplex+ weekday feast, which is wrong. Confirmed live (Monastic
Tridentinum 1617, `command=prayMatutinum`) against St. Lawrence's own octave closing day
(2026-08-17, "In Octava S. Laurentii Martyris ~ Duplex"): the real psalmody is Nocturn 1 = Ps
1,2,4,5,8,10, Nocturn 2 = Ps 14,16,20,23,63,91, each with its own antiphon, plus 3 OT canticles
in Nocturn 3 (Sirach 14/15, Jeremiah 17, Sirach 31) — a genuinely different scheme from both
the real-Sunday one and the plain ferial weekday table.

Cross-checked against a second Duplex saint (St. Ignatius of Antioch, Common of a
Martyr-Bishop, no proper content of his own, 2029-02-01): Nocturn 1 identical to Lawrence's
own; Nocturn 2 nearly identical (only one of six slots differs). So the psalm *numbers* are a
shared per-Common-category pool, not unique per saint — only the antiphon text is proper to
the individual saint when authored.

Mechanism: `hours/matins-psalmody-overrides.ts` (mirrors `hours/lauds-psalmody-overrides.ts`'s
shape, but keyed differently — see its own doc comment for why per-category, not per-feast,
is the right key here) + `data/hours/matins-psalmody-overrides/*.yml`. `matins.ts`'s
three-nocturn branch now splits on `day.weekday === 'sunday'` first; a non-Sunday three-nocturn
day looks up an override by the office winner's id, falling back to the plain ferial weekday
table (redistributed into 3 nocturns instead of 1) when none is authored yet — never blank, but
honest about not yet having that saint's real proper psalmody.

**Proof authored**: St. Lawrence only (`matins-psalmody-overrides/st-lawrence.yml`) — the live-
verified content above. New scripture chapters added for the canticles:
`data/scripture/{sir-14,sir-15,jer-17,sir-31}.yml` (sparse, only the cited verses, same
convention as the pre-existing `sir-36.yml`). `matins.ts`'s canticle shape was generalized from
one scripture ref per canticle to a list of refs (`canticles: { refs: [...] }[]`), since
Lawrence's own first canticle cites two Sirach chapters under one heading in the source
("Eccli 14:22;15:3-4;15:6") — kept as one canticle, not split; `matins-sunday-antiphons.yml`
migrated to the same shape (each existing single ref wrapped in `refs: [...]`), no content
change.

**Still open** (bulk-content work, same shape as the Lauds override sweep): every other
Duplex+ Common category (Apostle, Martyr(s), Confessor, Virgin, Doctor, etc. — ~75 saints per
the earlier Matins design-memory estimate) has no override authored yet and uses the ferial-
table fallback in the meantime. A real Common-category key (vs. the per-saint key `st-lawrence`
uses now, since only proper content has been authored so far) is the natural next step once a
second category's content is authored — see `matins-psalmody-overrides.ts`'s own doc comment.

Live-verified end-to-end: `tests/hours/matins.test.ts`'s new "Duplex+ weekday-feast" describe
block (Lawrence's own psalmody resolving `verified` in both languages across all 12 psalms +
3 canticles, plus the ferial-fallback case via St. Ignatius). `npm test` (371 tests), `npm run
build`, and `tsc --noEmit` all pass.

### Matins psalmody overrides — category-keyed refactor + second proof, St. Andrew (2026-08)

Refactored `hours/matins-psalmody-overrides.ts` per its own doc comment's flagged next step:
`data/hours/matins-psalmody-overrides/` now splits into `saints/*.yml` (per-saint proper
antiphon overrides, same shape as before, St. Lawrence migrated in place unchanged) and a new
`categories/*.yml` store recording each Common category's own generic psalm-number/versicle/
canticle-ref scheme, live-verified from a saint with *no* proper antiphon of his own (so his
output is the category default outright). Two categories authored this pass:

- **`common-of-a-martyr`**: from St. Ignatius of Antioch (2029-02-01, "vide C2" — entirely
  Common, no proper text). Confirms Lawrence's one real deviation from the shared scheme worth
  remembering: his own Nocturn 2 has Ps 16 where the Common default (and Ignatius) has Ps 64 —
  a genuine proper substitution, not a transcription slip. Also confirmed (reference engine's
  `CommuneM/C2a.txt`) that **Common-of-a-Martyr-Bishop's own Matins psalmody redirects outright
  to Common-of-a-Martyr** — the two share one scheme, not two; checked all three Duplex+
  Common-of-a-Martyr-Bishop saints on the calendar (Ss. Ignatius, Callistus I, Boniface of
  Mainz) and none has a proper antiphon of his own, so this category currently has no saint
  eligible for its own `saints/` entry under the proper-only policy below — a real, not
  accidental, gap.
- **`common-of-an-apostle`**: from St. Bartholomew (2026-08-24, generic "In omnem terram"
  antiphon). Second live proof authored against it: **St. Andrew** (`saints/st-andrew.yml`,
  2026-11-30, his own day outright that year), whose psalm numbers match the category's
  generic scheme in every one of the 12 Nocturn-1/2 slots — only the antiphon text is his own
  proper narration of his call and martyrdom. New scripture chapters authored for his Nocturn 3
  canticles: `data/scripture/{isa-61,sap-3,sap-10}.yml`.

**Category files are reference/documentation content only** — not consulted by
`getMatinsPsalmodyOverride`, which still does a plain per-saint lookup exactly as before.
Direct decision from the user (2026-08): a saint without their own `saints/` entry stays on the
plain ferial-table fallback, never falls through to a category's generic antiphon text, even
though that text is real and verified — "prefer real text over missing" is deliberately *not*
extended to this case yet. The category files exist so the next proper-antiphon saint authored
in an already-proven category doesn't have to re-derive/re-verify the same shared psalm numbers
and versicles from scratch, and as the reference point for spotting a saint's real deviations
(like Lawrence's Ps 16) from noise.

Live-verified end-to-end: `tests/hours/matins.test.ts`'s new "second Duplex+ weekday-feast
proof" describe block (Andrew's own psalmody resolving `verified` in both languages across all
12 psalms + 3 canticles). `npm test` (374 tests), `npm run build`, and `tsc --noEmit` all pass.

**Still open**: ~73 remaining Duplex+ saints across the other Common categories (Confessor,
Confessor-Bishop, Virgin, Doctor, etc. — the largest population, per the earlier estimate) —
each needs its own category file (one live `prayMatutinum` query against a no-proper-antiphon
saint) before any of its own saints' proper antiphons can be authored against it.

### Matins psalmody overrides — category tier wired in as a real fallback (2026-08)

Reversed the "category files are documentation-only" decision above now that two categories
are trusted: `getMatinsPsalmodyOverride` is now a real three-tier lookup — **proper**
(`saints/*.yml`) → **Common** (`categories/*.yml`, joined via the winner's own
`SaintRecord.common` through a new `getSaintRecord` import) → **ferial fallback**
(`matins.ts`'s own plain weekday table, unchanged, now genuinely the last resort rather than
the default for every unauthored saint). This is "prefer real text over missing" applied one
tier further, once the tier itself had proof behind it. `MatinsPsalmodyOverride` and
`MatinsPsalmodyCategory` now share a `MatinsPsalmodyScheme` base (`nocturn1/2/3`) so the lookup
can return either without a cast.

Category files gained an `aliases` field: `common-of-a-martyr.yml` lists
`common-of-a-martyr-bishop`, so all three of its Duplex+ saints (Ignatius, Callistus, Boniface —
confirmed none has proper text of his own) now resolve to real, verified Common psalmody instead
of the ferial table, with zero new authoring.

`tests/hours/matins.test.ts`'s old "falls back to ferial" case (St. Ignatius, 2029-02-01) is
rewritten as a Common-tier proof (his Nocturn 2 correctly using the Common default's Ps 64, not
Lawrence's own proper Ps 16); a fresh genuine ferial-fallback proof was added (St. John Bosco,
Common of a Confessor — no category authored yet for that Common — 2026-01-31, confirmed a
clean Saturday with no Sunday collision). `npm test` (375 tests), `npm run build`, and
`tsc --noEmit` all pass.

### Matins psalmody overrides — Confessor categories authored, both tiers identical apart from versicles (2026-08)

Two more Common categories authored, following the same live-verify-a-saint-with-no-proper-
antiphon method as Martyr/Apostle:

- **`common-of-a-confessor`** (Confessor Not a Bishop, "vide C5"): from St. Francis of Paola
  (2030-04-02, confirmed clean — safely outside Holy Week/Easter octave that year, per his own
  saint-file comment). Nocturn 1 = Ps 1,2,4,5,8,10; Nocturn 2 = Ps 14,20,23,95,96,97; Nocturn 3
  = one antiphon over 3 OT canticles (Sirach 14/15, Jeremiah 17, Sirach 31 — same refs already
  authored for `common-of-a-martyr`, reused as-is).
- **`common-of-a-confessor-bishop`** ("vide C4"): from St. Basil the Great (2035-06-14, already
  live-verified clean per his own saint-file's note that his rendered Matins is byte-identical
  to this Common despite his own `[Rule]` saying "vide C4a"/Doctor). Live-verified this Common's
  psalm numbers and antiphon text are **word-for-word identical** to `common-of-a-confessor` in
  all three nocturns — the only real difference is the three nocturn-closing versicles, which
  swap plain-confessor imagery for priestly/episcopal imagery (e.g. Nocturn 3's "Tu es sacérdos
  in ætérnum * secúndum órdinem Melchísedech"). Not modeled as an `aliases` redirect (unlike
  Common-of-a-Martyr-Bishop → Common-of-a-Martyr, a genuine zero-difference redirect) because the
  versicles really do differ and the mechanism has no partial-override/diff support — kept as
  its own full duplicate file instead.

Checked every Duplex+ saint on the calendar in both Common categories (St. Aloysius Gonzaga,
St. Anthony of Padua, St. Paschal Baylon, St. John Cantius, St. Bernardine of Siena, St. Joseph
Calasanctius, St. Raymond Nonnatus, St. Anthony Mary Zaccaria for `common-of-a-confessor`; St.
Norbert, St. Andrew Corsini for `common-of-a-confessor-bishop`) — none has a proper antiphon of
his own, so (same as Common-of-a-Martyr-Bishop before it) neither category currently has a
saint eligible for its own `saints/` entry; a real, not accidental, gap, matching the existing
policy of only authoring `saints/*.yml` where a genuine proper deviation exists.

Two live saints, St. Aloysius Gonzaga (June 21) and St. Norbert (June 6), turned out **not** to
be on the Monastic Tridentinum 1617 calendar at all despite having a `SanctiM/MM-DD.txt` file —
confirmed via `Tabulae/Kalendaria/M1617.txt` (no entry) and `Tabulae/Kalendaria/M1930.txt` (only
Norbert, added there) — both were canonized well after 1617 (Aloysius 1726, though pre-1617 in
Norbert's case his 1582 canonization still postdates the M1617 calendar's fixed content). Their
`SanctiM` stub files are shared infrastructure for later Monastic versions (1930/1963), not
proof the saint was ever actually prayed under M1617 itself — a live `Pofficium.pl` query on
their own date just falls through to a plain feria. Not a blocker for authoring the Common
category files themselves (the Common content is shared infrastructure regardless of which
Monastic version's kalendar wires a given saint into it), but worth remembering next time a
"vide C" saint's own date doesn't reproduce under `version=Monastic Tridentinum 1617` — check
`Tabulae/Kalendaria/M1617.txt` before assuming the date/year picked was wrong.

`tests/hours/matins.test.ts` gained two new Common-tier proofs (Francis of Paola,
`common-of-a-confessor`; Basil the Great, `common-of-a-confessor-bishop` — same psalm numbers as
the other, checked directly). The old ferial-fallback proof (St. John Bosco, `common-of-a-
confessor`, now superseded) was swapped for Ss. Fabian and Sebastian (`common-of-several-
martyrs`, still unauthored, 2029-01-20, already live-verified clean). `npm test` (377 tests),
`tsc --noEmit` pass.

### Calendar precedence: a tie against an octave's own elevated closing day now favors the octave (2026-08)

Real bug found and fixed, same session as the Matins psalmody fix above, discovered while
checking why 2026-08-17's Matins/label looked wrong: `calendar/index.ts`'s `applyOctaves` let a
*tie* between an occurring saint's rank and an active octave's threshold go to the saint
(`isAtLeast`, `>=`). Live-verified against the reference engine that this is wrong specifically
for an octave's own elevated *closing* day: St. Hyacinth (plain Duplex, Aug 17) against St.
Lawrence's own octave closing day (also Duplex, via `closingDayRank`'s default) — the engine's
own alternate rubric block for that date is titled "Commemoratio S. Hyacinthi Confessoris",
i.e. Hyacinth is the one merely commemorated, Lawrence's elevated closing day wins outright.
Matches `collision.ts`'s own existing tie precedent for sanctoral-vs-sanctoral collisions
("ties favor the incumbent").

Fix scoped precisely to closing days, not every octave tie: a tie against an octave's
*ordinary* (non-closing) threshold still favors the occurring saint, unchanged — confirmed by
two already-verified counterexamples this app's own tests already carried (St. Thomas of
Canterbury, Dec 29, against the Christmas Octave's ordinary threshold; St. Nicholas of
Tolentino, Sep 10, against the Nativity-BVM octave's ordinary threshold) — both would have
broken under a blanket tie-flip, confirming the closing-day-specific scope is correct.
`calendar/octaves.ts`'s `ActiveOctave` gained an `isClosingDay` field to make this
distinguishable.

Two related display bugs fixed alongside it: `calendar/day-label.ts`'s `getDayLabel` dropped
every commemoration (octave or sanctoral) whenever the day's winner was a plain sanctoral
saint, and dropped every *other* active octave besides the one picked as headline even when an
octave itself was the winner — both fixed (`otherActiveOctaveNames`), gated the same
`ordinary-feria`/anchor-day rules the rest of the function already uses so Trinity Sunday's own
technical overlap with Pentecost's octave still doesn't get named ("nobody calls it that", per
the function's own pre-existing convention). Rank was also not displayed anywhere in this app's
UI at all, for any saint — added (`formatRank`), shown after the day's own winner's name, e.g.
"St. Hyacinth, Confessor (Duplex)".

Also closed a real content gap surfaced along the way: `assumption-octave-day-3.yml` (Aug 17,
the Assumption's own day 3) had never been authored — days 2 and 4-8 existed, day 3 didn't —
sourced from the reference engine's own recurring Nocturn 2 homily + the octave-wide "Vidi
speciosam" responsory already used elsewhere in her octave.

`tests/calendar/octaves.test.ts` and `tests/calendar/day-label.test.ts` updated to the
corrected behavior (not weakened) — 2026-08-17 is now a real, live demonstrable date for the
octave-vs-octave priority pick this app's mechanism already implements, rather than the
stand-in synthetic-data test that was the only option before.

### Bible-plan TSV — bulk conversion done (2026-08)

All ~369 non-blank rows of the user's own bible-plan TSV (`~/Downloads/bible-plan.tsv`, 390
lines including section headers/blanks) are now converted into `data/hours/bible-plan/*.yml`
— 366 newly generated this pass, plus the 2 proof-date files already authored (`advent-3-tuesday`,
`post-pentecost-15-sunday`). One row (Ascension Thursday) has no readings in the source and
was correctly skipped — an honest gap in the user's own plan, not a conversion miss.

Conversion was mechanical (script, not hand-authored per file): each TSV "Day" label maps to
this app's `(temporalId, weekday)` scheme via the same rules `calendar/temporal-id.ts` uses
(ferias inherit their governing Sunday's id — e.g. "Ash Wednesday" → `quinquagesima`/`wednesday`,
"Nth Sunday after Trinity" → `post-pentecost-(N+1)` per the existing display-label convention),
or to a fixed `calendarDate` for the Dec 25 - Jan 13 stretch per the reading-pool redesign
above. Each `Reading N` column becomes its own `passages` entry; a chapter range like "Isa 36-37"
expands to one passage per chapter, matching the two proof files' own convention. Every
generated file sets `status: { la: missing, en: missing }` explicitly (not inferred), same as
the proof files — correct even where a handful of citations happen to land on already-authored
`src/data/scripture/*.yml` chapters (e.g. `cant-1`, `cant-8`, `sap-4`), since "verified" should
mean a human confirmed the reading, not that text merely happened to resolve.

A handful of book-abbreviation typos in the source TSV were fixed during conversion (not
preserved as authored): "Dt 19-2020" → Dt 19-20, "1 Mach 9-10-11" → 1 Mach 9-11, two
trailing-colon citations ("Mt 7:", "lk 17:") → whole-chapter references. Two day labels were
garbled by an apparent TSV row-merge artifact ("4th Sunday after Easter of 4th Week after
Easter", "Sunday after Ascension of Week after Ascension") — both parsed correctly by matching
just the leading "Nth Sunday after Easter"/"Sunday after Ascension" phrase and ignoring the
trailing garbage; not fixed in the source file itself since it wasn't touched.

One real content question, not a bug: "Sunday after Ascension" 's row has a Gospel reading
(Jn 17) as its third column — the only Sunday row in the whole TSV with one, seemingly
contradicting the design note that the user's plan "never assigns a Gospel on a Sunday" (see
memory `vu-matins-design`). Confirmed with the user (2026-08) as an intended, remembered
exception, not an authoring slip — keep it as authored.
`npm test` (359 tests, unchanged — these are new content files, not yet covered by any test
table) and `npm run build` both pass.

Unlike sanctoral/temporal content elsewhere in this project, this plan is the user's own
reading design (see "Not a reconstruction" in CLAUDE.md), not sourced from a historical
breviary — there is no reference engine to spot-check these rows against, by design; that's
not a verification gap to close later.

**Not done in this pass:**
- No verse text was imported — every row still resolves its scripture citation against
  whatever's authored in `src/data/scripture/` (a handful of chapters) and otherwise renders
  `missing`, per the deferred bulk Vulgate/Douay-Rheims import above.
- Not yet added to any test table (`tests/hours/matins.test.ts` still only covers the two
  original proof dates).

- Seasonal variants of the invitatory antiphon, the ferial hymn, and
  Sunday's own psalmody antiphons — all currently one fixed year-round
  text each, even though the source confirms at least the invitatory
  antiphon and Sunday psalmody genuinely do vary by season (e.g. `[Advm0]`
  right after `[Daym0]` in the source).
- Whether any real supported year reaches a 6th Sunday of Epiphany
  (`post-epiphany-6`) — the user's own plan has no row for it by design;
  confirmed real (some years have it, some don't) but not yet checked
  against which years this app actually needs to support. Resolved
  separately: on such a date, the bible-plan loader returns honestly
  `missing` rather than reusing the 5th week's rows — a deliberate,
  direct-instruction exception to this project's usual "prefer real text
  over missing" stance.
- The grand closing "Duo Seraphim" responsory before Te Deum (sung after
  the very last lesson, distinct from that lesson's own responsory) isn't
  modeled — the schema only carries one responsory per reading, and that
  closing one doesn't belong to any single reading the way the others do.
  Flagged in `post-pentecost-15.yml`'s own header, not fixed.
- What "a Gospel reading is its own kind" should mean beyond the `isGospel`
  flag on a plain `lesson` — the user wasn't sure yet what that distinction
  should look like; worth a follow-up once there's a UI to evaluate it
  against.

### Vespers ferial Preces + per-feast office overrides — done (2026-08)

**Ferial Preces**: `vespers-preces-feriales.yml`, sourced from Tridentine
1906/1910 (`[Preces feriales Vespera] = @:Preces feriales Laudes:s/129/50/`
— byte-for-byte the Lauds ferial Preces with Psalm 129 swapped for Psalm
50, live-verified against the same clean Advent feria 2026-12-17 already
used for Lauds). The short Sunday/feast form reuses `lauds-short-litany`
directly rather than a Vespers-named duplicate — confirmed byte-identical
at both hours by live query (Monastic Tridentinum 1617, both a plain
Sunday and a plain ferial). The ferial-or-vigil predicate itself
(`isFerialOrVigil`) was factored out of `hours/lauds.ts` into
`hours/resolve-common.ts` so both hours' `-preces` cases share one
definition instead of two copies. See `hours/vespers.ts`'s `vespers-preces`
case and `hours/types.ts`'s doc comment.

**Per-feast office overrides**: same eligibility rule as Lauds'
`getPsalmodyOverrideFor` (a duplex-majus+ saint, or a named temporal id in
`ALWAYS_OVERRIDE_TEMPORAL_IDS`), factored out to `resolve-common.ts`'s
`getOfficeOverrideId` since Vespers has no psalmody-override table of its
own to piggyback eligibility on the way Lauds does. **Authored — all 30
ids with an existing Lauds office-bundle override, full 30/30**, one live
`command=prayVespera` query each (Monastic Tridentinum 1617, except
`christ-the-king`: Monastic Divino 1930, same as its Lauds counterpart),
same clean per-saint dates already established for the Lauds sweep.
Extraction automated via a purpose-built parser
(`scratchpad/fetch_vespers.py`, not committed) after the first hand-check
(St. Lawrence) confirmed the page structure; validated by diffing every
extracted capitulum against its already-authored `lauds-capitulum-<id>`
counterpart before trusting the rest, plus an automated missing-field/
leaked-response-marker sweep across all 30 outputs, plus a runtime smoke
test resolving each id's actual chapter/responsory/hymn/versicle bundle
through `resolveOrdo`, not just checking the YAML files exist.

**Real finding, not assumed**: the capitulum is byte-identical between
Lauds and Vespers for every one of the 30 ids checked — a genuine
Monastic-rite fact (the day's reading doesn't change between the two
hours, only the responsory/hymn/versicle do). So no `vespers-capitulum-
<id>.yml` files exist at all; `hours/vespers.ts`'s
`vespersCapitulumForOverride` falls through to the already-authored
`lauds-capitulum-<id>` directly instead of duplicating identical content.

St. Scholastica needed the same hand-translation treatment her Lauds/
Terce/Sext/None content did: no English exists in the reference engine's
data for her Vespers responsory, hymn ("Te beáta sponsa Christi"), or
versicle — translated here (`status: draft` on the English), distinct text
from her Lauds hymn since Vespers' proper content doesn't overlap with the
minor hours' shared pool the way a Common-category saint's does. Also two
one-line English gaps unrelated to her (`immaculate-conception`,
`nativity-bvm`'s shared Ave Maria responsory — the reference engine left
"Benedícta tu in muliéribus..." untranslated for both): filled with the
standard Douay-Rheims/Ave Maria wording, not a free translation.

**Known, not modeled**: 5 of the 30 hymns (`ss-philip-and-james`,
`st-john-apostle`, `st-john-before-the-latin-gate`, `st-mark`,
`st-stephen-protomartyr`) carry a `{Doxology: PaschT}`/`{Doxology: NatT}`
tag in the source, meaning their closing doxology stanza is itself
seasonally variable — what's stored is whichever form rendered live on
each one's already-chosen clean query date, not a season-aware
substitution. Same class of gap as the Paschaltide alleluia suffix
elsewhere in this file, flagged not fixed.
- **Easter's own octave** — explicitly tabled ("easter needs a whole
  different discussion").

### The "which Sunday governs this date" temporal-id algorithm — done (2026-08)

Overflow years (Easter early enough that fewer than 6 Sundays after Epiphany occur before
Septuagesima cuts in) previously just clamped every excess post-Pentecost Sunday to
`post-pentecost-24` — wrong for every week between XXIII and the real last Sunday of the
year, only accidentally right for that final Sunday itself.

`calendar/temporal-id.ts`'s post-Pentecost branch is now ported directly from the reference
engine's own `getweek()` (`DivinumOfficium/Date.pm`) rather than re-derived by hand: once the
governing Sunday's Pentecost week reaches XXIII, a `wdist` (weeks until Advent) calculation
decides the id — the fixed final Sunday (`wdist < 2`) always resolves to `post-pentecost-24`
regardless of the true elapsed count, `post-pentecost-23` covers its own normal week, and
everything else resumes as `post-epiphany-${8 - wdist}` — the skipped post-Epiphany Sundays,
in their own ascending order, immediately before the fixed final Sunday. No separate tracking
of "how many post-Epiphany Sundays occurred" is needed — it falls out of the Advent-distance
arithmetic alone, confirmed against the reference engine's source rather than assumed. Trinity
Sunday = `post-pentecost-01` (this app's existing convention) also confirmed correct against
the same source (`$n=1` at `easter+56`, matching `TemporaM/Pent01-0.txt`'s own Trinity-Sunday
content).

Separately, `calendar/index.ts` gained `applyEpiphany6Commemoration`, an `apply*`-pass
(same shape as `applyChristTheKing`) that commemorates `post-epiphany-6` on the Saturday
immediately before Septuagesima — but only in years where Epiphany V (not IV, III, ...) was
the last post-Epiphany Sunday to actually occur, per direct clarification (a narrower rule
than "any skipped Sunday gets a Saturday commemoration" — only VI specifically, and only in
that one adjacency case). No new `Commemoration` variant was needed: the existing
`{ kind: 'temporal'; id }` shape already round-trips through `getDayCollects`'s
`${id}-collect` lookup for free, so this is purely additive to `commemorations`, coexisting
with whatever else that Saturday already resolved to (consistent with this app's generous,
non-single-winner commemoration design elsewhere).

Verified live against real years, not just unit-tested: 2026 (`post-epiphany-5` is the last
Sunday reached, so `2026-11-14`/`-21` resume as Epiphany V/VI before `2026-11-28`'s fixed
`post-pentecost-24`), and 1943/1962 (Easter late enough that all 6 Epiphany Sundays occur, so
no resumption and no Saturday commemoration ever fires). New test file
`tests/calendar/temporal-id.test.ts` covers both the overflow resumption and the Saturday
commemoration's on/off cases (2026, 2022, 2025, 1943). `npm test` (363 tests, 4 new) and
`npm run build` both pass.

**Follow-up done same day:** `calendar/day-label.ts`'s on-screen display now also tracks the
resumed-Sunday content, via a `trinitytideOverrideLabel` check ahead of the ordinary
Trinity-counted branch — it calls `resolveTemporalId` directly (the same mechanism the content
layer trusts) rather than re-deriving the wdist arithmetic a second time, so the label can
never disagree with what's actually rendered underneath. A resumed Sunday/weekday now reads
"The 5th Sunday after Epiphany" / "Monday in the 5th week after Epiphany" instead of continuing
the Trinity count past its real bound.

**Correction, same pass**: the first cut of this left the fixed final Sunday of the year
(`post-pentecost-24`) on the old raw "weeks since Trinity" arithmetic, on the assumption that
was an unrelated, already-correct convention — wrong. Scanning every year 1900-2100 showed
*every single year's* last Sunday before Advent resolves to `post-pentecost-24`, and the raw
elapsed-week count for that Sunday varies year to year (22nd, 23rd, 25th, ... depending on
Easter's date) even though the content is always the same fixed formulary. Since this app's
Trinity-counted display is one week off from the Pentecost-counted id (Trinity Sunday itself =
`post-pentecost-01` = the display's own uncounted anchor), the correct display ordinal for
that fixed Sunday is XXIV − 1 = **23, always** — not derived from elapsed weeks at all.
`trinitytideOverrideLabel` now handles this as its own branch (`FIXED_LAST_SUNDAY_ORDINAL`),
same "ask `resolveTemporalId`, don't re-derive" principle as the resumed-Epiphany branch.
Live-verified across 1943/1962/2015/2026/2033 — all five now read "The 23rd Sunday after
Trinity" for their own last Sunday, where before the fix they'd shown four different numbers.
Tests in `tests/calendar/day-label.test.ts` updated accordingly. `npm test` (365 tests) and
`tsc --noEmit` both pass.

### Bilingual, merged date/day-label header — done (2026-08-18)

The civil date/weekday (`day-nav`'s date span) and the "day being celebrated" text
(`getDayLabel`, previously repeated inside every hour's own view) are now merged into one
header block in `day-nav.ts`, and both are bilingual. `getDayLabel()` returns
`Partial<Record<string,string>>` (`{en, la}`) instead of a plain English string, matching
`hours/types.ts`'s existing bilingual convention; `formatDateLong()` (`src/ui/format.ts`) is
bilingual too, since `Intl` has no Latin locale data (`MONTH_LABELS_LA` authored directly).
Latin weekday names are spelled out per direct instruction — "Feria Tertia", not "Feria III"
— `Dominica`/`Feria Secunda`...`Sexta`/`Sabbato`. Advent and Lent specifically drop the
redundant leading weekday word from `temporalLabel()` now that the header always shows the
weekday on its own ("Tuesday in the 2nd week of Advent" → "In the 2nd week of Advent") — every
other season (Epiphanytide, Eastertide, Trinitytide, the plain fallback) keeps its weekday
prefix, a deliberate narrower-scope decision, not an oversight.

**Real content gap, left open on purpose**: no Latin form exists anywhere for saint names
(`SanctoralIdentity.name`), octave names, or named-temporal-feast names — only rank labels,
weekday names, month names, and season/ordinal phrasing have authored Latin. Every saint/
octave/feast name currently falls back to its English string as its own `la` value too (same
"surface real text over missing" convention used elsewhere), so Latin mode never shows a blank
where a proper name belongs — but it also means Latin mode still reads mostly-English for any
day with a real winner. Authoring actual Latin names per saint/octave/feast is separate future
content work (hundreds of records), not started here.

`tests/calendar/day-label.test.ts` rewritten for the `{en, la}` shape (all `.en` values
unchanged except the Advent/Lent weekday-drop cases), plus new representative `.la`
assertions (weekday, rank, season-ordinal genitive construction, English-fallback-for-a-
saint-name). `tests/hours/compline.test.ts` and `tests/ui/shell.test.ts` updated too. `npm
test` (383 tests) and `tsc --noEmit` both pass; manually verified in the browser (English,
Latin, and both-language modes) against an Advent date with an active octave.

### Ferial weekday Matins nocturn antiphons + versicle — done (2026-08-21)

Real gap found (user flagged it directly): the plain ferial weekday Matins nocturn
(`hours/matins.ts`'s single-nocturn branch, no Sunday/Duplex+ override) rendered bare psalms
with no antiphon at all — not a documented design choice like `ferialPsalmodyThreeNocturns`'s
antiphon-less fallback, just an oversight from before antiphons existed anywhere in this hour.

Source: Divinum Officium's Monastic-labeled Matins psalter, `Latin/Psalterium/Psalmi/Psalmi
matutinum.txt`'s `[Daym1_]`-`[Daym6_]` sections (the Latin file's own unsuffixed `[Daym1]` etc.
just redirects to these via `@:` references), English parallel at the *unsuffixed*
`[Daym1]`-`[Daym6]` keys in the `English/` tree (no indirection there). Real wrinkle:
`psalter-distribution.yml`'s own `matins:` table isn't the historical per-weekday psalm set —
its own header documents a deliberate "editorial redistribution" (54 non-Sunday psalms
reclassified must-stay/could-move by length, then resliced into 6 fresh groups of 9 in
continuous psalm order), which breaks several of the source's own antiphon-sharing pairs across
weekday boundaries (e.g. Ps 43/44, originally Monday's own closing pair, now open Tuesday
instead). Resolved by keeping vu's existing 9-psalm weekday lists untouched and regrouping:
every psalm keeps its own original antiphon text, consecutive same-antiphon psalms stay grouped
whenever their pair survived the reslice intact, and a psalm whose original partner moved
elsewhere now stands alone under its own antiphon. Each weekday's single versicle is taken from
whichever source day contributes the majority of that weekday's 9 psalms, placed at the same
relative position it held there (verified group-by-group against both parallel source files —
see each weekday's own comment in the new data file for the exact reasoning).

New `data/hours/matins-ferial-antiphons.yml` (6 weekdays, 5-6 antiphon groups each, exactly one
group per weekday carrying a versicle) + `hours/matins.ts`'s new `ferialAntiphonedNocturn`,
replacing the old bare `ferialPsalmody` call in the plain-ferial branch (`ferialPsalmody` itself
stays, still used by `ferialPsalmodyThreeNocturns`'s intentionally antiphon-less fallback).
Versicle rendered as one combined V./R. block (`"V. ...\nR. ..."`) via a new shared
`versicleText` helper.

**Follow-up, same day: fixed the pre-existing Sunday versicle bug too.** `sundayPsalmNocturn`/
`sundayCanticleNocturn` (used by both Sunday Matins and every Duplex+ weekday feast's
`matins-psalmody-overrides` content) only ever pushed `group.versicle.v` — the V. line — never
the R. line, so every Sunday/override nocturn versicle has been silently missing its responsory
since the Sunday psalmody was first authored. Both functions now go through the same
`versicleText` helper the ferial nocturn code above uses. `tests/hours/matins.test.ts` gained a
regression test asserting all 3 Sunday nocturn versicles render both lines.

`tests/hours/matins.test.ts` gained a new assertion (on the existing `FERIAL_DATE` proof,
2026-12-01, Tuesday of Advent I) confirming every nocturn psalm gets its own antiphon,
correctly grouped, and exactly one versicle appears at the right point. Also fixed 3 stale
Triduum tests that asserted "no versicle part anywhere in the whole ordo" — true only because
ferial nocturns had no versicles at all before this change; now checks specifically that the
dropped *opening* versicle (and Ps 3, which it precedes) is gone, via `ordo.parts[0]` being the
nocturn's own first psalm, rather than asserting zero versicles exist. `npm test` (421 tests,
including the Sunday-versicle regression test above) and `tsc --noEmit` both pass.

### Immaculate Heart of Mary relocated off Aug 22 (2026-08-22)

User-flagged, same day: Aug 22 (the Assumption's octave-closing day) was being won outright by
Immaculate Heart of Mary (Duplex II classis, fixed there since Pius XII's 1944 decree),
permanently demoting the octave day to a commemoration — a real collision between this
project's two blended calendar tracks (Divino Afflatu fixes IHM there; the older Tridentine
track has no IHM at all, just the octave day). Per this project's "generous, not
reconstructionist" design, the fix is relocation, not picking a permanent winner.

Researched the real history rather than guessing: Immaculate Heart of Mary was actually
celebrated on the **Saturday after the Feast of the Sacred Heart** from 1914 until the 1944
fixed-date decree, and that's also the date the 1969 reform returned to — continuity on both
sides of the Aug-22 interlude, unlike an initially-considered but unverifiable "Saturday after
the *octave* of Sacred Heart" guess (no such rule was ever real, and Sacred Heart itself has no
octave modeled in this codebase — see `data/calendar/easter-offsets.yml`, where it's only a
season-label entry, `68: sacred-heart`).

Moved: `data/calendar/saints/immaculate-heart-of-mary.yml` deleted, its `sanctoral-calendar.yml`
`"08-22"` entry removed. New `data/calendar/temporal-feasts/immaculate-heart-of-mary.yml`
(id/name/rank only, no octave). New `calendar/index.ts` function `applyImmaculateHeart` —
computes Easter+69 (Sacred Heart, Easter+68, is always a Friday; this is the Saturday right
after), overriding the day's winner there via the same rank-compared, commemorate-the-loser
pattern `applyChristTheKing`/`applyMarianSaturday` already use, run last in `resolveDay`'s chain
so a specific named feast always supersedes the generic "Our Lady's Saturday" default rather
than losing to whichever ran first. Added `immaculate-heart-of-mary` to `hours/resolve-
common.ts`'s `ALWAYS_OVERRIDE_TEMPORAL_IDS` so its own chapter/responsory/hymn/versicle/
antiphon overrides are actually eligible (a temporal-kind winner is otherwise ignored by
`getOfficeOverrideId`).

**Superseded the same day** — see "Generic Easter-offset movable-feast mechanism" below:
`applyImmaculateHeart` itself no longer exists; the same behavior now runs through
`calendar/movable-feasts.ts`'s generic `applyMovableFeasts`, with IHM as its first data-driven
entry (`easterOffset: 69` on its own temporal-feasts YAML record).

Propers content moved stores, not just files — temporal feasts resolve via a physically
different store than sanctoral saints (`getTemporalProper`/`data/propers/temporal/*.yml`, keyed
`${id}-${suffix}`, vs. sanctoral's `common`/`propers`-field indirection into `data/propers/
common/*.yml`). Collect moved as-is (suffix already matched); the single shared antiphon file
was split into `-benedictus-antiphon`/`-magnificat-antiphon` (temporal's two-suffix convention,
vs. sanctoral's one file reused for both) — same duplicated text, no new content authored.
Nocturn readings needed no file change, but did surface a real bug in `hours/matins.ts`'s
`nocturnReadingIds`: it only ever added `day.winner.id` when `day.winner.kind === 'sanctoral'`,
so a named *temporal* override (IHM now, or `marian-saturday`/`christ-the-king` already, neither
of which happened to have nocturn-readings content authored yet to expose this) would never
have picked up its own reading file — fixed by adding `day.winner.id` unconditionally (harmless
dedup via the existing `Set` on an ordinary day, where it already equals the plain temporal id).

`tests/calendar/immaculate-heart-of-mary.test.ts` (new) proves the relocation end-to-end across
two years' Easter dates, and `tests/calendar/august-sanctoral.test.ts`'s existing Aug 22 test
was updated to match (the day now reverts to the plain Assumption octave, same shape as St.
Lawrence's own Aug 12 case). `npm test` (429 tests) and `tsc --noEmit` both pass.

### Assumption-octave Matins hymn fixed (2026-08-22)

Separately, the "no antiphons and a weird hymn today" complaint that prompted the investigation
above turned out to be a distinct, narrower bug: `resolveMatinsHymn`'s own doc comment
already claimed the Assumption's octave "keeps the feast's own proper hymn all week," but the
code never implemented that — it only fired when the day's own winner literally *was*
`assumption` (Aug 15 only). Every other octave day (16, 17, 19, 20, 21 — St. Joachim, St.
Hyacinth, St. John Eudes, St. Bernard, St. Jane Frances de Chantal, none of whom has a Matins
hymn of their own authored) fell straight to the plain ferial hymn. Fixed by adding a real
octave-fallback tier (`resolveActiveOctave(day.date)` → `matins-hymn-${octave.id}`) between the
existing per-feast override and the seasonal tier. Confirmed against the reference engine that
Monastic 1617 itself doesn't do this either (no octave day there has its own `[Hymnus
Matutinum]` override) — this is a deliberate departure, not a restoration, consistent with how
this project already treats octave readings/commemorations more generously than any one source
track. Aug 18 (no sanctoral winner) and Aug 22 (once IHM moved) needed no change — both already
reached `matins-hymn-assumption` via the pre-existing `resolveOfficeWinner` octave-substitution
path, which only fires when the day's own winner isn't sanctoral.

**Not fixed, logged instead** (user decision): the deeper reason Matins had *zero* nocturn
antiphons at all on Aug 22 — no `matins-psalmody-overrides` entry exists for `assumption` or
`immaculate-heart-of-mary` (or, generally, any Duplex-2-classis+ feast lacking one), so Matins
falls all the way to the bare ferial psalm table, which by design carries no antiphons — is a
broader content gap than today's date, tracked in the "Matins psalmody overrides" bullet above
rather than authored now. Also newly true because of this change: `hours/matins.ts`'s psalmody
override lookup is hard-gated to `winner.kind === 'sanctoral'`, so even if IHM's psalmody were
authored later, it wouldn't apply as a temporal-kind winner without that gate being loosened
too — noted for whoever picks this up.

New tests in `tests/hours/matins.test.ts` cover the fallback across Aug 16-22, including the
Aug 17 edge case (correctly still ferial, since that day is actually governed by St. Lawrence's
own octave, not the Assumption's). `npm test` (430 tests) and `tsc --noEmit` both pass.

### Generic Easter-offset movable-feast mechanism (2026-08-22)

User feedback, same day: a bespoke `calendar/index.ts` function per non-Sunday movable feast
(`applyImmaculateHeart`, following the `applyMarianSaturday`/`applyChristTheKing` precedent) was
flagged as fragile going forward — real plans exist for several more feasts that are all
"weekday N days from Easter Sunday": Ember/Rogation days, more Sacred-Heart-family Marian
devotions, St. Joseph's own pre-1955 Eastertide feast, and the Lenten Friday Passion devotions.
Writing a new function per feast doesn't scale and invites the same subtle ordering bugs
(`applyImmaculateHeart` had to be sequenced *after* `applyMarianSaturday` specifically, or a
Saturday-anchored feast would have been silently clobbered by the generic "Our Lady's Saturday"
default — easy to get wrong once there are several of these).

Replaced with a single generic resolver, `calendar/movable-feasts.ts`'s `applyMovableFeasts`,
run in `applyImmaculateHeart`'s old spot in `resolveDay`'s chain. No new data table: it scans
`calendar/temporal-feasts.ts`'s existing per-feast YAML records (`data/calendar/
temporal-feasts/*.yml`, already carrying `id`/`name`/`rank`/`octave`) for a new optional
`easterOffset` field, added to the `TemporalFeastRecord` type. Immaculate Heart of Mary's own
record gained `easterOffset: 69`; adding the next feast is a new YAML file with `rank` and
`easterOffset` set, not a new TypeScript function. Same rank-compared, commemorate-the-loser
semantics as before, applied generically instead of duplicated per feast.

Deliberately doesn't try to unify everything: `christ-the-king` (last Sunday of October),
`marian-saturday` (a generic "nothing else assigned" fallback, not date-anchored at all), and
`christmas-octave-sunday` (whichever of Dec 26-29 is a Sunday) are structurally different rules,
not Easter-offset ones — they stay as their own small functions in `calendar/index.ts` rather
than being force-fit into this table for the sake of a single mechanism. Ember days for the
September and Advent quarters are anchored to a *fixed civil date's* nearest Sunday, not Easter,
so they'll need a second anchor kind on `TemporalFeastRecord` when they're actually authored —
not modeled yet, deliberately: the other two Ember quarters (Lent I, Pentecost) and Rogation
days, on the other hand, *are* plain Easter offsets and are already covered by this mechanism
today.

No behavior change — `tests/calendar/immaculate-heart-of-mary.test.ts` (unchanged) still passes
end-to-end through the new generic path. `npm test` (430 tests) and `tsc --noEmit` both pass.

### September + Advent Ember days — new mechanism + real content authored (2026-08-22)

Follow-on from the movable-feasts generalization above: researched whether Ember days belonged
in that same table (they don't — see below) and, once that was settled, built their actual
mechanism and authored real Matins content for all 6 days as the first two proof cases.

**Not a `movable-feasts.ts` entry.** Live-verified against the reference engine (Monastic
Tridentinum 1617): September Ember Wednesday 2026 was won outright by Ss. Cornelius & Cyprian
(Semiduplex) with the Ember feria demoted to `Commemoratio ad Laudes tantum` — i.e. Ember days
are **privileged ferias**, not named feasts contesting the day by `FeastClass` rank the way
Christ the King/Immaculate Heart of Mary do. Two separate, smaller pieces of new mechanism
instead:

- **Precedence**: `calendar/temporal.ts`'s new `septemberEmberDayOffset` (the Sunday nearest
  Sept 14, i.e. the Exaltation of the Holy Cross, +3/+5/+6 for Wed/Fri/Sat — same "nearest"
  arithmetic `adventStart` already used for "Sunday nearest Nov 30," factored out into a shared
  `nearestSunday` helper) feeds a new check in `resolveTemporalCategory`, giving those 3 dates
  `privileged-feria-minor` — live-verified as the correct tier. Advent Ember days needed **no**
  precedence change at all: Advent's own season default is already `privileged-feria-minor`,
  and no live evidence turned up that Advent Ember days need a stronger tier (`adventEmberDayOffset`
  only exists for the content-id side below, not this one). Note this settles the "not
  worth guessing at" gap flagged in `temporal-categories.yml`'s own header comment, added back
  when this was still unmodeled.
- **Content identity**: new `calendar/ember-days.ts`'s `applyEmberDay`, run right after
  `applyOctaves` in `resolveDay`'s chain (same octave-guard `applyMarianSaturday` uses — the
  Nativity of the BVM's own octave, Sep 8-15, can genuinely overlap a late-anchored September
  Ember week in some years). When the feria itself is what's winning (no saint strong enough to
  clear the `privileged-feria-minor` threshold), its `winner.id` is relabeled to the Ember day's
  own id (`ember-september-wednesday`, etc.) so its real proper collect/readings are found
  instead of inheriting whatever Sunday governs that week; when a saint wins outright instead,
  the Ember day is pushed as a `{kind: 'temporal', ...}` commemoration alongside it (this app
  doesn't model the "Laudes only" hour-scoping nuance the live rubric shows — same
  simplification level as every other commemoration here).

**Real bug found and fixed along the way**: `hours/matins.ts`'s `nocturnReadingIds` only ever
pulled in a *sanctoral* commemoration's own id, never a *temporal* one's — so a commemorated
Ember day (the common case: most Ember days lose the precedence contest to whatever saint
occurs) would never have surfaced its own nocturn readings at all. Fixed by extending that
check to `c.kind === 'sanctoral' || c.kind === 'temporal'`. Same root cause, same fix shape, as
the day.winner.id gap the Immaculate Heart of Mary relocation surfaced above — this one just
hid in the commemorations loop instead.

**Content authored**: all 6 days' real collect + 3 Matins readings (Gospel-citation-plus-homily
pattern, bare Gospel incipits skipped per this store's own established convention — see
st-lawrence.yml/st-andrew.yml — only the homily portion transcribed), read directly from
`Tempora/093-{3,5,6}.txt` (September) and `Tempora/Adv3-{3,5,6}.txt` (Advent, whose Lectio1-3
are themselves a cross-reference to the Annunciation's own Common, `Sancti/03-25.txt` — followed
and transcribed from there). Kept as 3 separate readings per day rather than combining into one
(this store's usual default when several lessons share one continuous source) because each
carries its own genuinely distinct, proper responsory — collapsing them would have discarded
real, valuable content for no good reason, unlike the cases that default was written for.
September Wednesday/Saturday use the Monastic-track's own override responsories (drawn from
`TemporaM/093-0`'s Tobias-sermon texts) in place of the secular ones, per this project's
Monastic-1617-first structure preference — Friday and both Advent Ember days are identical in
both tracks (no `TemporaM/Adv3-{3,5,6}` override files exist at all).

**Not authored, logged instead**: the Ember-day-specific `[Ant 2]`/`[Ant 3]` Lauds antiphons
found during research — scoped out deliberately, same "collect + Matins first, other hours
later" incremental pattern used throughout this project's sanctoral sweep. Also not modeled:
the Monastic track's fuller 12-lesson/12-responsory Matins structure (a 12th responsory exists
in the source for all 3 September days) — this app's reading-pool mechanism doesn't preserve a
literal historical lesson count for any day, sanctoral or temporal alike, so this isn't a new
gap specific to Ember days.

New `tests/calendar/ember-days.test.ts` covers the precedence contest (September, live-verified
saint-wins-Ember-commemorated cases) and content resolution (Advent, wins-outright cases; real
verified Matins content on all 6 days) end-to-end. `npm test` (435 tests) and `tsc --noEmit`
both pass.

### Matins nocturn-reading temporal/month-week suppression bug, hymn Common-tier + real invitatory mechanism, antiphon-doubling dedup (2026-08-24)

**Bug fixed**: `nocturnReadingIds` (`hours/matins.ts`) unconditionally pooled the plain
temporal-cycle reading id and the calendar-month/week id into every day's nocturn reading
pool, even on a day where a real feast wins outright with zero commemorations
(`calendar/commemorations.ts`'s `decideOccurrence`, `ordinary-feria` branch — correctly
suppressing the temporal identity entirely). St. Bartholomew (duplex-2-classis, 2026-08-24, a
Monday) has no Nocturn 3 content of his own, so the leftover 13th-Sunday-after-Pentecost
(`post-pentecost-13.yml`) and month-week (`month-week-084.yml`) readings wrongly filled his
Nocturn 3. Fixed by gating that pooling on whether the day's own occurrence decision actually
retained the temporal identity (`day.winner.kind === 'temporal'`, or a `kind: 'temporal'` entry
in `day.commemorations`) — mirrors `getDayCollects`'s own long-standing pattern for the same
question. New tests in `tests/hours/matins.test.ts` cover both the regression (Bartholomew) and
the non-regression case (a plain ferial weekday with no sanctoral winner, 2026-09-04).

**Matins hymn + invitatory antiphon — new Common-of-Saints tier, real invitatory mechanism**:
also fixed while investigating the same report. `resolveMatinsHymn` gained a Common-category
tier (override → octave → **Common category** → season → ferial), reusing
`matins-psalmody-overrides.ts`'s own `getSaintRecord(id)?.common` lookup pattern. The invitatory
antiphon (`invitatoryParts`), previously one hardcoded fixed text for every day of the year with
only full-vs-incipit doubling varying by rank, now goes through a real
`resolveMatinsInvitatoryText` (override → Common category → season → ferial, no octave tier —
no per-octave invitatory override exists anywhere in the reference source) before the
pre-existing doubling step is applied. Content authored this pass: Common-of-an-Apostle only,
both hymn (`matins-hymn-common-of-an-apostle.yml`, "Ætérna Christi múnera") and invitatory
antiphon (`matins-invitatory-common-of-an-apostle.yml`, "Regem Apostolórum Dóminum"), both read
directly from the reference engine's `Commune/C1.txt` (Latin + English both present there).
Live-verified: St. Bartholomew (2026-08-24) and St. Andrew (2026-11-30) both now resolve to this
Common's text for hymn + invitatory.

**Not authored, logged as explicit backlog**, same incremental-content pattern as everywhere
else in this project:
- Hymn + invitatory Common tiers for: Martyrs (C2), Virgins (C6), Holy Women
  (C7), Dedication (C8), General/All Saints (C9) — all confirmed to have their own distinct
  `[Invit]`/`[Hymnus Matutinum]` text in the reference source, not yet transcribed. Confessors
  (C4) hymn done 2026-08-25, see below — invitatory antiphon still open.
- Seasonal invitatory-antiphon tier content (Advent/Lent/Passiontide/Paschaltide/Christmastide)
  — mechanism now exists (same `seasonalOfficeSuffix`-keyed lookup the hymn's own long-standing
  seasonal tier already uses), but no seasonal invitatory file is authored yet; every season
  currently still falls through to the plain ferial invitatory antiphon. Confirmed varying
  content exists in the reference source for at least Paschaltide (`Tempora/Pasc0-0.txt`,
  "Surréxit Dóminus vere") and Christmastide (`Tempora/Nat2-0.txt`, "Admirábile nomen Jesu").
- Seasonal Matins-hymn content itself (Advent/Lent/Passiontide/Paschaltide) — this gap predates
  this pass (already noted in `resolveMatinsHymn`'s own doc comment) and is unchanged here.

**Cross-hour antiphon-doubling dedup**: the same idiom (`splitNamedAntiphon` +
`isDoubleOrHigher(...) ? full : incipit`) was copy-pasted at 11 call sites across 8 hour files
(matins.ts x4, lauds.ts x2, vespers.ts x2, compline.ts x1, prime/terce/sext/none.ts x1 each).
Centralized into one new `openingAntiphon(antiphon, winner)` helper in `hours/resolve-common.ts`
(alongside `splitNamedAntiphon`, which it wraps); every call site now uses it. Pure dedup, no
behavior change — confirmed by the full existing test suite passing unchanged.

**Cross-hour hymn-resolution dedup — partial**: investigated whether hymn resolution across all
8 hours could collapse into one shared resolver the same way antiphon-doubling did. Found it
does *not* fit a single universal helper — hymn resolution falls into 4 genuinely different tier
shapes (Matins's standalone 4-tier hymn-only resolver; Lauds/Vespers's bundled
hymn+chapter+responsory+versicle resolver; Prime/Compline's fixed-id-plus-`appendDoxology`;
Terce/Sext/None's flat one-liner with the doxology baked into the static hymn text). Of these,
only Terce/Sext/None's case was genuinely byte-identical and safe to collapse — done, via a new
`resolveSelfContainedHymn` helper in `resolve-common.ts`. **Lauds and Vespers's own bundle
resolvers turned out NOT to be byte-identical either**, despite looking that way at a glance:
Lauds gates its whole bundle on whether a `LaudsPsalmodyOverride` exists for the winning saint
(`getPsalmodyOverrideFor(day)?.id`), while Vespers gates purely on duplex-majus+ rank via
`getOfficeOverrideId` directly (it has no separate per-feast psalmody-override table to check
against). Collapsing them into one parameterized helper risks silently changing eligibility
behavior for one of the two hours, so this was deliberately left alone rather than risked — a
real follow-on refactor, but one that needs an explicit "eligibility" plugin point designed
first, not a same-day mechanical extraction. Also checked: Matins's own explicit
`resolveActiveOctave` hymn tier looked at first like it might be redundant with
`resolveOfficeWinner`'s own octave-folding (which Lauds/Vespers rely on instead of a separate
octave check) — confirmed it is *not* redundant: `resolveOfficeWinner`'s fold-in only fires for
`ordinary-feria` days or via `octaveGoverningPrivilegedDay` (which explicitly excludes
Christmastide's own stacked octaves), so Matins's separate check still covers real cases (e.g.
Christmas/Stephen/John/Innocents octave days) the other path doesn't reach. Left unchanged.

`npm test` (470 tests) and `tsc --noEmit` both pass.

### Common-of-a-Confessor Matins hymn authored, Monastic-vs-secular textual variant (2026-08-25)

**Bug fixed**: St. Louis (2026-08-25, `common-of-a-confessor-not-bishop`, wins outright as a
Simplex) was falling through `resolveMatinsHymn`'s Common-of-Saints tier straight to the plain
ferial hymn, because none of the 5 confessor `common:` ids in use across `data/calendar/saints/*`
(`common-of-a-confessor` [37 saints], `common-of-a-confessor-bishop` [33], `common-of-a-
confessor-not-bishop` [6], `common-of-a-confessor-pope` [3], `common-of-a-confessor-doctor` [4])
had a `matins-hymn-<id>.yml` authored yet — this was the "Confessors (C4)" gap logged in the
2026-08-24 entry above. All 5 authored now, all sharing one text ("Iste Conféssor Dómini
sacrátus" / "This is the Lord's own hallowed confessor").

**Textual-variant wrinkle, worth remembering generally**: the reference engine's
`Commune/C4.txt` actually contains two genuinely different Latin recensions of this hymn, not
just formatting variants — a secular-breviary Urban VIII revision (`[Hymnus Vespera]`: "...
coléntes... Hac die lætus méruit beátas Scándere sedes") and an older Monastic-track form
(`[HymnusM Vespera]`: "...sacrátus... Hódie lætus méruit secréta Scándere cæli"), live-verified
by querying `Pofficium.pl` both ways (St. Louis under `version=Monastic Tridentinum 1617`
renders `sacrátus`; a Doctor confessor under `version=Divino Afflatu` renders `coléntes` — the
split is Monastic-vs-secular, *not* doctor-vs-other, despite a Solesmes chant-archive gabc file
being labeled "pro Doctoribus"). Since vu's Matins is Monastic-1617-structured throughout, the
`sacrátus` form is correct for all 5 ids alike. Also: the reference engine's own English track
has only one translation and reuses it for both Latin forms without distinction — sloppily,
since its concrete imagery (visiting the saint's *tomb*; being helped by his *merits*, not his
*prayers*) actually only matches the `sacrátus` Latin. Rather than trust that reused pairing,
the English here is an original translation of the `sacrátus` Latin (kept in the same unrhymed
Sapphic 11.11.11.5-syllable shape as this project's other hymn translations), so `status.en` is
`draft` while `status.la` is `verified`. General lesson: when the reference source has multiple
textual variants of the same hymn, don't assume a single attached translation was written for
whichever variant happens to be nearest it — check the imagery/vocabulary against each Latin
candidate before trusting the pairing.

### Matins psalmody overrides — Common-of-Several-Martyrs authored, largest remaining category (2026-08-25)

Fifth Common category authored for `matins-psalmody-overrides`, same live-verify-a-saint-with-
no-proper-antiphon method as the previous four: **`common-of-several-martyrs`**, from Ss. Fabian
and Sebastian (2029-01-20, Duplex, confirmed clean — a Saturday, no Sunday collision — per their
own saint-file comment). Live-verified (Monastic Tridentinum 1617, `command=prayMatutinum`)
genuinely distinct from `common-of-a-martyr` (single martyr), not a duplicate: Nocturn 1 = Ps
1,2,10,14,15,23 (vs 1,2,4,5,8,10), Nocturn 2 = Ps 32,33,45,60,63,78 (vs 14,20,23,63,64,91), and a
different Nocturn 3 canticle source (Wisdom 3:1-6/3:7-9/10:17-21, one shared "Beáti, qui
persecutiónem patiúntur" antiphon, vs Sirach 14/15 + Jeremiah 17 + Sirach 31). New scripture
verses added: `data/scripture/sap-3.yml` gained 3:1-6 (3:7-9 already existed from St. Andrew's
own canticle); `sap-10.yml`'s existing 10:17-21 reused as-is, no changes needed.

This is the **largest single Common category by population** (40 saints/groups carry this
`common` id per calendar-wide grep, more than `common-of-a-confessor`'s 37 or `common-of-a-
martyr-bishop`'s 35) — authoring it unlocks real, non-ferial-fallback Matins psalmody for all 40
at once. Checked every Duplex+ saint/group in the category (only Holy Innocents and Ss. Fabian
and Sebastian themselves are Duplex+; Holy Innocents already has full proper content of its own,
Fabian/Sebastian has none) — same as every category before it, no saint is currently eligible
for its own `saints/*.yml` entry under the proper-only policy.

**Wrinkle**: the reference engine's own English track has no translation at all for two of this
category's antiphons (Nocturn 1's Ps 10 antiphon and Nocturn 3's "Beáti, qui persecutiónem"
Beatitude antiphon, Matt 5:10) — its rendered English column just repeats the Latin for both.
Original English translations supplied for both (matching this project's existing Douay-adjacent
phrasing elsewhere, e.g. the Rule of Benedict's own "persecution for righteousness" wording) —
flagged inline in the category file's own header comment, not silently passed through as
`verified` without a note, even though the resolver's `verifiedText` helper doesn't distinguish
draft from verified at this granularity (a pre-existing mechanism limitation, not new here).

`tests/hours/matins.test.ts`'s old ferial-fallback proof (Ss. Fabian and Sebastian, now
superseded now that their Common has real content) is rewritten as a Common-tier proof; a fresh
genuine ferial-fallback proof was added instead (St. Anthony, Abbot, `common-of-an-abbot` — still
unauthored — 2029-01-17, confirmed clean). `npm test` (471 tests), `tsc --noEmit` both pass.

**Still open**: Confessor-Not-a-Bishop [6], Confessor-Pope [3], Confessor-Doctor [4], Virgin [11],
Virgin-Martyr [17], Abbot [16], Holy Woman [3], Widow [6], Angel [5], Evangelist [3], and the
smaller one-off Commons — none has a category file yet.

### Lauds/Vespers chapter-responsory-hymn-versicle bundle: rank-agnostic Common fallback (2026-08-25)

**Bug fixed**: St. Louis (2026-08-25, `common-of-a-confessor-not-bishop`, Simplex, wins
outright) was showing the plain ferial chapter/hymn at Lauds instead of his own Common's —
`hours/lauds.ts`'s `resolveOffice` only substituted a feast's own proper bundle
(`lauds-{part}-<id>.yml`), gated at duplex-majus+ (piggybacking eligibility on the Lauds
psalmody-override table, itself majus+-only by design), with no Common-level fallback at all.
Same gap existed in `hours/vespers.ts`'s identical `resolveOffice`. Fixed by adding
`resolve-common.ts`'s `resolveOfficeBundle`: tries the winner's own proper bundle first, then
falls back to their Common's bundle (`SaintRecord.common`, the same id driving the day
collect — not `minorHoursCommon`, a deliberately different id for P/T/S/N), eligibility tested
rank-agnostically via the existing `getMinorHourOverrideId` (any sanctoral winner, not just
duplex-majus+) — a simplex feast's own or Common's chapter/hymn is real, distinct liturgical
content, not something only strong feasts are entitled to. Vespers' own chapter lookup
(`vespersCapitulumForOverride`, which already falls back to the byte-identical Lauds capitulum
file when no separate Vespers one exists) is passed in and reused unchanged for both the
proper and the Common id.

**Proof authored**: `common-of-a-confessor-not-bishop`'s full Lauds bundle (chapter, short
responsory, hymn "Jesu coróna célsior", versicle) and Vespers bundle (chapter reused from
Lauds, short responsory, hymn "Iste Conféssor Dómini sacrátus" — Latin/English text reused
verbatim from the already-authored Matins hymn file, same Monastic-track recension — versicle),
live-verified against Divinum Officium (Monastic Tridentinum 1617). Lauds content cross-checked
byte-identical between St. Louis's own day and St. Nicholas of Tolentino's (`propers: null`,
clean year), confirming genuine shared Common content. Vespers content, unusually, had to be
sourced via the reference engine's `votive=C5` ("Commune Confessoris non Pontificis") view
instead of any real saint's own rendered Second Vespers — every one of this Common's 4 real
saints (St. Louis, St. Francis, St. Dominic, St. Nicholas of Tolentino) turned out to have
their own Second Vespers permanently outranked by a fixed adjacent feast (St. Zephyrinus's
First Vespers, SS. Placid and Companions', Our Lady of the Snows', the Nativity-of-the-BVM
octave, respectively) — a structural pattern for this category, not a query mistake. Also
corrected a wrong lead from earlier in this investigation: `CommuneM/C4a.txt`'s file-inheritance
structure (`@CommuneM/C4`) initially looked like it meant Confessor-Not-Bishop reuses
Confessor-Bishop's Office bundle wholesale, but the reference engine's own votive-office naming
(C4 = "Confessoris Pontificis", C5 = "Confessoris non Pontificis", C4a = "Doctoris Pontificis" —
an unrelated category with a superficially similar filename) settles that these are two
genuinely separate Common categories with their own distinct hymns ("Jesu Redémptor ómnium" vs
"Jesu coróna célsior" at Lauds).

`npm test` (471 tests), `tsc --noEmit` both pass. **Still open**: the other 10 Common
categories in the "still open" list above have no Lauds/Vespers bundle authored yet either —
same honest incremental-content gap, now on a mechanism that no longer silently drops to the
ferial default for any rank.

## Known, deliberate simplifications (not bugs — working as designed)

- `getDayCollects`: each collect in a multi-collect day renders as its own
  complete "Let us pray ... Amen." block, not the more compressed real form
  (one "Let us pray," only the last collect's doxology).
- Suffrage omission (`lauds.ts`'s `suffrages` case) now checks: Double-or-
  higher rank, Christ the King, Advent/Christmastide/Passiontide season,
  any active octave (however low its own rank), Marian Saturday's own
  Cross/BVM filter, and the Cross-only ferial-office check — all
  confirmed directly against **Monastic Tridentinum 1617** itself, not
  just the Tridentine 1906/1910 track the suffrage content and the
  Joseph/Cross-gating logic were sourced from (checked Advent 2026-12-03,
  Christmastide 2026-12-30, Passiontide 2026-03-23, an active octave via
  St. Lawrence's own Aug 11-12, and ordinary Lent 2026-02-20 specifically
  *not* excluded, to confirm it's Passiontide-only, not all of Lent).
  Still not modeled: the Paschaltide *substitution* (real practice
  replaces the whole suffrage set with a single alleluia-form "Suffragium
  Paschale" during Eastertide rather than omitting or showing the
  ordinary set) — flagged, not built.
- `lauds-preces` (2026-08): real Tridentine 1906/1910 practice restricts
  the fuller ferial Preces to Advent/Lent/Ember days plus Vigils, not
  every ferial day — widened to every ferial-or-vigil day here by
  explicit choice, mirroring Prime's own identical earlier choice (see
  `data/hours/prime.yml`'s header). Also doesn't model Paschaltide's own
  substitution here either, same gap as the suffrages above.
- `data/calendar/temporal-categories.yml`'s season→category reconstruction
  is from general knowledge of the pre-1955 tradition, not independently
  verified against a primary source for every entry (flagged inline where
  it matters).
- St. Michael's Sep 29 date — kept as a deliberate simplification despite
  the live engine showing nothing there across 6 tested years (documented
  in `st-michael.yml` and `sanctoral-calendar.yml`).
