# Open work

A real backlog, not scattered code comments. Update this file when something
here gets done, and add to it when new gaps turn up — don't let it drift back
into "only findable by reading commit messages."

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
their own later, separate P/T/S/N pass (duplex-majus+ subset only).

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

All 15 now have real content — none left "honestly missing." St.
Frances of Rome and St. Bibiana (the original, pre-Kalendaria-table
109-saint pass) are still left missing and are good candidates for this
exact same fix — this pass didn't touch them since their own fileref
was never derived (they predate the Kalendaria-table work this session
built), not because they're any less resolvable in principle. Ss.
Ursula and Companions (the section above) is the one case that's
actually different in kind: no other calendar member shares her
`C6b`/plural-Virgins-and-Martyrs category to cross-check a Common
against, so even a clean file read wouldn't have anything solid to
verify itself against.

Two vigils (Vigil of St. John the Baptist, Vigil of St. Lawrence) didn't
resolve via this file-based method at all (their particular file format
wasn't handled by this pass's parser) — no impact, both already had
real content from the live-query batch above.

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
  checked against a live rendering). P/T/S/N: done for the 66-saint
  batch; the 26 propers-set saints' own P/T/S/N not yet attempted, a
  further layer on top (see that section's own note).

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

- **Vespers** (`src/hours/vespers.ts` is still a stub). First/Second Vespers
  overlap (`DayWinner.vespersFrom`) already exists as a type but nothing
  populates it for Vespers itself yet (only Compline uses `resolveEveningDay`
  so far). Also owes its own ferial Preces once built — real 1906/1910
  practice has a distinct "Preces feriales Vespera" (see
  `lauds-preces-feriales.yml`'s header for the Lauds one, which now
  exists) with mostly-overlapping but not identical content.
- **Matins** (`src/hours/matins.ts` is still a stub) — needs its own
  resolution path (reading-candidate pool, nocturn structure), not the
  static parts-array pattern the other hours use.
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
