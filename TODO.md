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
absent, *independently* of whether the psalmody override exists. Right now
**only `christ-the-king` has this** — St. Lawrence's own day shows his
proper psalms but the plain ferial capitulum/hymn, which is inconsistent
with what the live engine actually shows for him (`2 Cor 9:6`, his own
hymn). Worth fixing even before tackling the other 32.

### Benedictus antiphons for temporal (non-sanctoral) days

`<id>-benedictus-antiphon.yml` in `data/propers/temporal/` — only
`marian-saturday` and `christ-the-king` exist. Every plain numbered Sunday
(52 of them) and feria is `missing`. Real practice has a proper antiphon
for every one of these; not started, and it's a big pull if done exhaustively.

### Octave collects

`getDayCollects` skips a `kind: 'octave'` commemoration entirely — no
collect has ever been authored for an octave (the octave-reading pull only
ever sourced Matins content). Every octave commemoration currently
contributes zero text to Lauds'/Vespers' collect sequence.

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
- **October-December (24 saints): not started.**
- **~52 temporal entries: not started.**
- **94 `propers: null` saints: not started** — need a collect authored (a
  bigger, separate task) before an antiphon id even has anywhere to attach.

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
  so far).
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
- Suffrage omission only checks `omitOnDouble` (+ Marian Saturday's own
  Cross/BVM filter, + Christ the King's explicit id check). Real seasonal
  suppression (e.g. during Advent/Lent) isn't modeled.
- `data/calendar/temporal-categories.yml`'s season→category reconstruction
  is from general knowledge of the pre-1955 tradition, not independently
  verified against a primary source for every entry (flagged inline where
  it matters).
- St. Michael's Sep 29 date — kept as a deliberate simplification despite
  the live engine showing nothing there across 6 tested years (documented
  in `st-michael.yml` and `sanctoral-calendar.yml`).
