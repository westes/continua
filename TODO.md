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
