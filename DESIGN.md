# Design

Continua is not a reconstruction of any single historical breviary. It's a personal office
design that draws on several historical sources as material and inspiration, without
reproducing any one of them exactly. This document explains what's blended, and why.

## What's blended

- **Structure / hour-shape**: chiefly the Monastic Tridentinum (1617), via the
  `divinum-officium-reference` reference engine (a sibling repo). Matins is the hour most
  likely to diverge from any single historical office — see "Matins" below.
- **Precedence / rubrics**: taken from the Divino Afflatu rubrics, not the Monastic 1617
  rubrics that otherwise supply the hour structure.
- **Calendar / saints**: merged from *both* the Tridentine 1906 calendar and the Divino
  Afflatu (1954) calendar. Source comments throughout the codebase cite both tracks
  separately and deliberately — that's not an inconsistency to resolve toward one track.

## Commemorations and octaves

Handled more generously than any one historical rite. When multiple saints fall on the same
day, each gets its own commemoration and reading, rather than a single "office winner" taking
all and the rest being dropped. Every active octave gets its own reading, for the same reason.

## Matins

Matins' nocturn and reading structure is the point of deepest deliberate divergence from any
historical office:
- Split lessons that were only split in the source material to fill a fixed lesson-count slot
  are recombined into their natural units.
- The number of scripture readings per day is variable, driven by a personal Bible reading
  plan rather than a fixed historical lesson count.
- The Rule of Benedict's summer reading-contraction is rejected — the reading plan runs at
  full length year-round.
- Gospel readings are treated as their own distinct kind of reading, not folded into the
  scripture-lesson rotation.

## Hymn textual variants

Where the reference engine carries more than one Latin recension of the same hymn — for
example, a pre-Urban VIII medieval text alongside the 1631 Urban VIII revision — Continua
prefers the pre-Urban VIII text as a standing default, not a per-hymn judgment call. The 1631
revision was a classicizing exercise that generally traded away concrete, vivid imagery for
smoother Latin meter; the older text is usually the richer one. This preference is independent
of whichever structural track (Monastic vs. secular) a given hour otherwise draws from.

## Ferial Preces breadth

Lauds', Vespers', and Prime's ferial Preces (Kyrie/Pater Noster plus a short versicle/response
litany) run on *every* plain ferial-or-vigil day — wider than history's Advent/Lent/Ember/
Vigil-only gating. This is a deliberate, confirmed-generous choice, not a bug to narrow toward
the historical gating.

## Rank deflation for late canonizations

For a saint whose own canonization or cultus postdates roughly 1600, Continua deflates the
reference engine's source rank one tier down (`simplex < vigil < semiduplex < duplex <
duplex-majus < duplex-2-classis < duplex-1-classis`) rather than taking the source rank at
face value. Example: St. Rose of Lima (canonized 1671) — source rank `Duplex`, Continua rank
`semiduplex`.

From the Baroque/Counter-Reformation period on, "new canonization" and "Duplex" became close
to a package deal — a default starting grade granted near-automatically — while genuinely
ancient, more historically significant saints (e.g. St. Augustine, also nominally `duplex`)
mostly just kept whatever rank they'd always had. Taking the late source rank at face value
would put a routine 17th-century canonization on the same rung as a Doctor of the Church,
which isn't a meaningful comparison.

This deflation applies only when the *saint's own cultus* is genuinely late — not to older
saints who merely lack their own calendar file because a later canonization displaced them
onto a suffixed sibling file or a different date on the general calendar (e.g. Ss. Felix and
Adauctus, St. Paul the Hermit). Those keep their real historical rank unchanged.

## Versioning philosophy

Continua is at v1: content and mechanism are both feature-complete for the app's own scope —
built for the author's own use, with no accommodation for any other user. v2 is reserved for
either a compatibility break or the app becoming usable/needed by someone who isn't its
author; adding a feature, even a large one, doesn't itself cross that line. See `CLAUDE.md`
for the concrete versioning/release mechanics.

---

When extending Continua, treat the reference engine's raw files as a content/structure
*source*, not a target to replicate — deviating from "the historical/reference-engine way" on
purpose is expected and correct here, not a bug.
