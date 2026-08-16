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
   - Pre-1955-but-post-1617 saints' differently-structured Matins readings — source confirmed
     (Tridentine/Divino Afflatu, combine-where-sensible applies the same way), but the actual
     sourcing/modeling pass hasn't started — see "Matins ordo" below.
   - The "which Sunday governs this date" temporal-id algorithm (23rd-Sunday-before-Advent
     rule, Epiphany-Sunday transfer to the end of the liturgical year, the
     Saturday-before-Septuagesima 6th-Epiphany-Sunday commemoration edge case) — tabled, not
     started.
   - Easter's own octave — tabled, "a whole different discussion."
   - What "a Gospel reading is its own kind" should mean structurally/in the UI, beyond the
     `isGospel` flag on a plain Matins `lesson` — open; deferred until there's a UI to
     evaluate it against.

2. **Minimal-proof-done, bulk content pending** — mechanism is built and trusted (a proof
   date/entry already resolves correctly end-to-end); what's left is authoring/importing more
   content in that same shape across the rest of the calendar:
   - Matins: convert the rest of the user's ~390-row bible-plan TSV (2 proof dates converted
     so far); author patristic/hagiographic readings for every saint where one can be
     sourced — no longer Duplex+-gated, content is pooled and shown regardless of rank (see
     "Reading-pool redesign"); expand the per-book Matins responsory pool beyond its one
     seeded book (`isa`); once the pre-1955 mechanism gap above is resolved, source those
     saints' readings too.
   - The bulk Vulgate (Latin) + Douay-Rheims (English) scripture import into
     `src/data/scripture/` — long-term project, explicitly deferred; Matins scripture
     citations resolve to `missing` text until it lands.
   - A handful of individually-flagged content gaps, each already flagged in place rather than
     silently dropped: St. Frances of Rome's and St. Bibiana's Benedictus antiphons
     (structurally can't win their own day under this app's calendar in any near-term year,
     needs a very late test year to check); Ss. Ursula and Companions' Benedictus antiphon
     (a category-of-one, no live rendering to verify against); "Our Lady of the Snows" (not
     modeled at all); the four "…benedícta…" octave-day Ant+V/R+collect blocks (not yet
     modeled).

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

### Octave content — mostly fixed (2026-08), one real gap left

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

Real remaining gap: `resolveOfficeWinner` deliberately only kicks in when
`temporalCategory === 'ordinary-feria'` (the octave day has no standing
of its own) — the live-verified counterexample is the Christmas Octave's
own stack (Christmas + Stephen + John + Holy Innocents, e.g. on Dec 30,
`privileged-feria-minor`): the *temporal* day itself keeps the office
there ("Dominica Infra Octavam Nativitatis", `{ex Proprio de Tempore}`),
and each of the four octaves gets its own separate "Commemoratio Octavæ
…" Ant+V/R+collect block instead — not yet modeled; those four octave
commemorations still contribute nothing but a name in the day label.

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
- All ~390 rows of the user's own bible-plan TSV — only the two proof
  dates' rows are converted so far (both temporal-id-keyed; no
  calendar-date-keyed rows for the Dec 25 - Jan 13 stretch yet).
- Full Sunday/feast-calendar patristic-reading authoring — now framed as
  "every saint where a reading can be sourced," not just the ~75 Duplex+
  saints that get their own Nocturn 3 slot (see the reading-pool redesign
  above: content is no longer rank-gated, only nocturn *count* is).
- Pre-1955-but-post-1617 saints' differently-structured readings (source
  confirmed as Tridentine/Divino Afflatu rather than Monastic 1617,
  combine-where-sensible rule confirmed to apply the same way — the actual
  sourcing pass not started).
- The per-book responsory pool beyond its one seeded book (`isa`).
- The bulk Vulgate (Latin) + Douay-Rheims (English) import into
  `src/data/scripture/` — in scope for the project long-term, explicitly
  deferred past this pass per direct instruction.
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
- **The "which Sunday governs this date" temporal-id algorithm** — the fixed
  23rd-Sunday-before-Advent rule, Epiphany Sundays transferring to the end
  of the liturgical year when they don't fit before Septuagesima, and the
  Saturday-before-Septuagesima edge case (also commemorate the 6th Sunday
  of Epiphany that day, in overflow years). Described in detail in an
  earlier conversation, explicitly tabled, not started. Distinct from
  Christ the King, which didn't need it (last-Sunday-of-October is direct
  date math).
- **Easter's own octave** — explicitly tabled ("easter needs a whole
  different discussion").

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
