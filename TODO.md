# Open work

A real backlog, not scattered code comments. Update this file when something
here gets done, and add to it when new gaps turn up — don't let it drift back
into "only findable by reading commit messages."

## Content gaps — mechanism built, data incomplete

### Lauds psalmody overrides (duplex-majus+ per-feast psalms/antiphons/canticle)

Mechanism: `src/hours/lauds-psalmody-overrides.ts`, gated in
`hours/lauds.ts`'s `getPsalmodyOverrideFor`. Only fires for a saint ranked
duplex-majus or higher (per direct instruction) or a named temporal feast
(`marian-saturday`, `christ-the-king`).

**Authored (3):** `st-lawrence`, `marian-saturday`, `christ-the-king`.

**Not authored yet (32 duplex-majus+ saints, sorted roughly by calendar
order)** — each needs a live `command=prayLaudes` query on the saint's own
date, Monastic Tridentinum 1617, same method as the three done so far:

conversion-of-st-paul, chair-of-st-peter-at-rome, apparition-of-st-michael,
st-matthias, st-benedict\*, st-mark, ss-philip-and-james, st-john-before-the-latin-gate,
st-john-apostle (Dec 27, distinct from st-john-before-the-latin-gate May 6),
st-barnabas, nativity-of-st-john-the-baptist, ss-peter-and-paul, chair-of-st-peter-at-antioch,
st-james-the-greater, st-martin-of-tours, holy-innocents, st-thomas-apostle,
all-saints, all-saints-of-the-benedictine-order\*, st-andrew, st-stephen-protomartyr,
ss-simon-and-jude, st-luke, st-matthew, st-michael\*, st-maurus-abbot\*,
ss-placid-and-companions\*, st-scholastica, st-bartholomew, st-peter-ad-vincula,
assumption, nativity-bvm, immaculate-conception.

\* = `propers: null` in the saint's own record — needs collect + antiphon
authored too, not just the psalmody override, before any of this is useful.

### Lauds office-bundle overrides (capitulum/responsory/hymn/versicle)

Same override id, separate files (`lauds-capitulum-<id>.yml` etc. in
`data/propers/common/`) — falls back to the plain weekday bundle when
absent, *independently* of whether the psalmody override exists.
**Authored (2): `st-lawrence`, `christ-the-king`.** 31 duplex-majus+ saints
left — same list as the psalmody overrides above, minus Lawrence.

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

**Authored (1 saint, all four hours): `st-lawrence`.** Antiphon + chapter
for Terce/Sext/None, antiphon only for Prime (its chapter needed no new
file — see above). The same 31-saint backlog above applies here too, one
id at a time, as each gets a Lauds override.

### Overlapping octaves — real gap found, not yet fixed

`resolveOfficeWinner` (and `getDayLabel`) currently pick whichever active
octave started *first* (`activeOctavesFor`'s own ordering) whenever more
than one is active on a day with no temporal standing of its own — purely
an accident of insertion order, not a real precedence rule. St. Lawrence's
octave (Aug 10-17) and the Assumption's octave (Aug 15-22) genuinely
overlap on Aug 16-17 every year, so this isn't a hypothetical.

Live-checked both overlap days (Monastic Tridentinum 1617, 2026): Aug 16
that year happens to be a Sunday, so the *temporal* Sunday wins outright
and both octaves are merely commemorated (already correctly handled by
the existing `ordinary-feria` gate — not actually a two-octave contest at
all). Aug 17 is the real case: "**In Octava S. Laurentii Martyris ~
Duplex**" wins outright, with "*Tertia die infra Octavam S. Assumptionis*"
merely commemorated — Lawrence's octave beats the Assumption's despite the
Assumption being the far higher-ranked feast overall (Duplex I. classis vs.
Lawrence's Duplex II. classis). Why: Aug 17 is specifically Lawrence's own
**final octave day** ("in Octava," the 8th and closing day), which real
practice elevates to its own higher rank (Duplex here, above the ordinary
Semiduplex of the days in between) — a concept this app doesn't model at
all yet (`OctaveConfig` has no notion of an elevated final day, every day
of an octave is currently treated as uniform strength).

Proposed design (not yet built, needs a decision): when multiple octaves
are active with no temporal standing to yield to, compare them by rank
the same way a single octave already compares against a rival saint —
highest rank wins outright, the rest are commemorated instead of silently
dropped to "whichever came first." Needs `OctaveConfig` to carry an
elevated final-day rank (distinct from the ordinary in-between-days rank)
to get Aug 17 right for a real reason rather than by lucky insertion
order. Low urgency in practice (currently only this one real overlap
pair), but worth fixing before adding more octaves that could collide the
same way.

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
- **94 `propers: null` saints: not started** — need a collect authored (a
  bigger, separate task) before an antiphon id even has anywhere to attach.

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

### Bug found while checking February's results, not yet fixed

`hours/resolve-common.ts`'s `splitNamedAntiphon` always marks its output
`verified` regardless of the input status (`verifiedText()` hardcodes it) —
so a `draft`-marked antiphon (Scholastica's translation, Matthias's
reworded English) renders as if fully verified everywhere it's actually
displayed, even though the source YAML correctly says `draft`. Affects
every split antiphon across every hour (Prime, Terce, Compline, Lauds), not
just these two — pre-existing, just never surfaced until content with a
real `draft` status went through it.

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
