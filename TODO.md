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

## Correctness risk — needs verification, not just authoring

### Per-saint Benedictus antiphons may be sourced from the wrong rite

`<saint>-antiphon.yml` files (17 of them, see below) were pulled during the
original sanctoral-content sessions, months before Lauds existed to consume
them. Building St. Lawrence's psalmody override surfaced, by accident, that
his had been read from the **Roman/secular rite's `[Ant 1]`**, not Monastic
1617's actual Benedictus antiphon for that day — two genuinely different
texts. Fixed for Lawrence. **Not checked for any of the other 16**:

apparition-of-st-michael, chair-of-st-peter-at-antioch, chair-of-st-peter-at-rome,
conversion-of-st-paul, holy-innocents, nativity-bvm, nativity-of-st-john-the-baptist,
ss-peter-and-paul, ss-philip-and-james, st-andrew, st-john-apostle,
st-john-before-the-latin-gate, st-martin-of-tours, st-peter-ad-vincula,
st-stephen-protomartyr, st-thomas-apostle.

Each needs a live `command=prayLaudes` query on the saint's own day (Monastic
1617) to confirm or correct — same check that caught Lawrence's.

The other 12 duplex-majus+ saints with `propers` set have **no antiphon file
at all yet** (st-scholastica, st-matthias, st-matthew, st-mark, st-luke,
st-james-the-greater, st-bartholomew, st-barnabas, ss-simon-and-jude,
immaculate-conception, assumption, all-saints) — these don't have the wrong-rite
risk, they just don't exist yet.

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
