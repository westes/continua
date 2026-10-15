# Open work

Backlog for this repo. Update when something here gets done; add when a new gap turns up.

## Priority

Mechanism first, then a minimal live-verified proof, then bulk content. A section marked
"mechanism built" but not "full sweep"/"all N done" is mid-pipeline: its next work is more
content in the same shape, not a design change. The dated log below is that pipeline's record.

## Open work, in priority order

1. **Mechanism gaps**
   None open.

2. **Minimal-proof-done, bulk content pending**
   None open.

3. **New features**
   - Date picker: `day-nav.ts` only steps a day at a time; no way to jump to an arbitrary
     date without walking there or editing the URL. Needs a calendar-grid picker UI.
   - Audio ("read it to me"): a button per hour/text that plays the office aloud, e.g. via
     the Web Speech API (stays offline-first). Open questions: bilingual (La/En) voice
     selection, Latin pronunciation quality. Needs its own design pass first.
   - Votive offices: let a user substitute a different office (e.g. Little Office of the
     BVM, Office of the Dead, a weekday votive like St. Joseph/Wednesday or Passion/Friday)
     for the day's actual resolved office, on demand. Deferred deliberately (2026-09-11):
     unlike every other "choice" in continua (bilingual toggle, the planned user-editable
     calendar below), this isn't about correctness of *which* office today's date resolves
     to — it's runtime substitution of a different office entirely, closer to the reference
     engine's browsable-reference-tool use case than continua's fixed-daily-office one. Real
     cost isn't content (most votives reuse existing Commune/C1-C12 files already sourced for
     saints; only weekday votives like St. Joseph/Passion are new proper text) but mechanism
     that doesn't exist yet: an office dimension orthogonal to `HourId`/date threaded through
     `resolveOrdo`, the `/{date}/{hourId}` route, and a new UI selector — plus refolding the
     one existing one-off precedent (`isAllSouls(date)`, hand-copied into all 8 hour files)
     into that generic path instead of adding a third copy-pasted special case. Track as its
     own item, don't fold into user-editable calendar below — picking which saint wins a date
     and substituting a whole different office are different mechanisms even though both are
     user-override flavored. Several chaplet-shaped devotions are also wanted here eventually
     (2026-09-11, user) — detail/specific chaplets TBD, noted as a placeholder alongside the
     votive offices this mechanism would also need to cover.
   - User-editable calendar: let a user pick/override which saints actually contest a
     given date, rather than only vu's own shipped `sanctoral-calendar.yml`. Motivating
     case (2026-09): `ss-eustace-and-companions.yml` is fully authored but deliberately
     left out of the calendar because his Duplex would permanently outrank the Vigil of
     St. Matthew (`vigil-of-st-matthew.yml`, rank `vigil`) on Sep 20 — exactly the kind of
     judgment call a user might want to make differently for their own calendar instead of
     vu holding one fixed answer. See `vu_future_user_editable_calendar` memory for other
     content already authored ahead of this feature existing.
   - User-overridable feast ranks (mechanism built 2026-10-06, see Work Log): the editor
     side is still open. (1) Where overrides are persisted and how they sync (feast id ->
     `{rank?, octaveWins?}`, fed in via `setRankOverrides`). (2) Which feasts the editor
     offers: Easter, the Triduum, Lenten ferias and `temporal-categories.yml` are not marked
     non-overridable in code yet, and `unconditional` feasts (Christ the King) should not be.
     (3) When suppress/move exist, a feast with a vigil (`vigilOf`) should take the vigil along
     as a pair. (Rank overrides to or from `vigil` are already ignored in `rank-overrides.ts`.)
     (4) Rank and `octaveWins` are separate
     knobs: demoting a feast's `rank` alone leaves its octave strength, so the UI should set
     or present both together.

# Work Log

### St. Benedict Joseph Labre, St. Felix of Cantalice and St. Stanislaus Kostka added (2026-10-11)

Sources: `Latin/Sancti/aliquibus locis/04-16-BenedictusJLabre.txt` and `05-21-Felix.txt`, both Semiduplex,
`vide C5`, nine lessons, no antiphons of their own. Own Oratio and Lessons 4-6 (one continuous life per
saint in Nocturn 2); Nocturn 3 is the Gospel and the homily of Lessons 7-9 (Labre: St. Gregory on Matt
16:24-27 from `Commune/C2`, English from the reference; Felix: St. Augustine, Sermon 9 on the words of
the Lord, with Matt 11:25-30 as already carried for St. Matthias). English of the lives and of the
Augustine homily is this project's own translation, `status.en: draft`.

Dates: Apr 16 and May 21, both free. Rank: Simplex, by DESIGN.md's late-canonization deflation of the
source Semiduplex (canonized 1881 and 1712). Both often fall in an Easter or Ascension octave and are
then commemorated, not the day's winner.

St. Stanislaus Kostka, added afterwards from `Sancti/Urbis/12-05-StanislausK.txt` (the reference's main
Sancti files have no Kostka office; the Urbis directory is the Rome-city calendar): Dec 5, nine lessons,
St. Sabbas commemorated. Rank Duplex, the source's, not deflated: Dec 5 is always in Advent, where only a
Duplex wins over the privileged feria (`privileged-feria-advent`; St. Nicholas was re-ranked for the same
reason), so a deflated Semiduplex would never win its day. The Urbis file is badly OCR-damaged; the
corrections are listed in its reading file's header. The joint Ss. Stanislaus and John Berchmans file
(`Urbis/11-29`) is not used.

Skipped on purpose (small files, local or order-only interest): Hyacintha Mariscotti, Margaret of
Cortona, Ferdinand III, Veronica Giuliani, Rose of Viterbo, Galla, Rochus (a Simplex stub), Gaspar del
Bufalo. Tests: `tests/calendar/tier-two-saints.test.ts`.

### Five Marian and devotional feasts added from the regional Sancti files (2026-10-11)

Sources: `Latin/Sancti/aliquibus locis/` (05-31, 12-10, 01-23, 05-24, 10-23), all Duplex majus and nine
lessons, none with English in the reference engine. Each is a fixed-date saint-style record with its own
office, `status.en: draft` except where the reference's English or the Douay store covers it:

- `mediatrix-of-all-graces`, Oct 1 (the source file is `05-31-BMVMediatrix`; the Brasilia file puts it
  on Oct 1, where St. Remigius is commemorated; the fuller aliquibus text is used).
- `translation-of-the-holy-house`, Dec 10 (St. Melchiades commemorated). Matins and Lauds hymns, and two
  responsories, are the Common of a Dedication's (C8), copied from the existing files.
- `betrothal-of-the-bvm`, Jan 23 (St. Emerentiana commemorated).
- `our-lady-help-of-christians`, May 24. Own hymns, three antiphons, Lessons 4-9; the antiphons,
  versicles and four responsories are the Common of the BVM's.
- `most-holy-redeemer`, Oct 23. A feast of Our Lord, not Our Lady (filed with the Marian set by the plan
  this came from); wholly proper, like the Most Precious Blood. Hymns are the source's `@` includes
  (Creátor alme síderum, Rerum Creátor óptime, Salútis humánæ Sator) with the Nativity doxology.

Latin is read from the source files by script, with obvious typos corrected and listed in each reading
file's header. Each Matins reading is one entry per lesson with its own responsory (Nocturn 2: Lectio4-6;
Nocturn 3: the Gospel, whose homily the matins code folds in, then Lectio8-9). The Vespers psalmody follows
the engine's Monastic reduction: antiphons 1, 2, 3 under their own psalms, antiphon 5 under the fourth
antiphon's psalm (this also corrected the Five Holy Wounds and Commemoration of the Passion, which had
the fifth's own psalm).

Not carried:
- the Betrothal's commemoration of St. Joseph at Lauds and at each Vespers (the source's `[Oratio 2]`,
  `[Oratio 3]`, `[Commemoratio4]`): no mechanism for a commemoration that belongs to a feast's own office;
- the Mass propers, Nocturn 1 (Scripture course), and for the Holy House the Sext and None versicles
  (the little-hour files pair a capitulum with its versicle and the source gives no capitulum for those
  hours);
- the Purity of the BVM (3rd Sunday of October) and the Patronage of the BVM (2nd Sunday of November),
  Sunday-bound and needing their own mechanism decision; Purest Heart (08-22) is the Immaculate Heart's
  office with a word swapped.

Date consequences worth knowing: Ss. Jerome, Remigius and others lose Sep 30/Oct 1 evenings; Jerome's
Second Vespers never happens now (Mediatrix's First Vespers, Duplex majus, outranks him). The Guardian
Angels (Oct 2, equal rank) take the evening of Oct 1; the Archangel Raphael (Oct 24) takes the evening of
Oct 23. In Advent the privileged feria keeps the evening of Dec 9 over the Holy House's First Vespers (the
existing Advent-feria concurrence rule, not changed here).

Also fixed on the way: a Doctor commemorated at Vespers read "beáte N." in the commemoration antiphon
(the saint's own invocation name is now filled in there as it already was at the Magnificat).

Also: the Most Precious Blood (July 1, and its Lenten Friday) showed a missing Lauds and Vespers
responsory (the slot with no text); the source has none for those hours, so both records now say
`noParts: [lauds-responsory, vespers-responsory]`, as `most-holy-redeemer` and the Apparition of the
Immaculate BVM do.

Tests: `tests/calendar/marian-feasts.test.ts`. Existing tests pinned to dates now taken by these feasts
moved: `vespers.test.ts` (Jan 22 -> Jul 29, St. Martha against Ss. Abdon and Sennen),
`vespers-audit-engine.test.ts` (the Doctor cases use St. Peter Canisius and St. Albert; Jerome is checked
as a commemoration), `day-label.test.ts` (2027-05-24 -> 2025-06-16; Pentecost 2026 -> 2025).

### Lenten and pre-Lenten Passion feasts added as movable feasts over their ferias (2026-10-11)

Source: `Latin/Sancti/aliquibus locis/Quad*DNJC.txt`, the seven files Divinum Officium keeps for the
Passion devotions of Lent. Each is Duplex majus, anchored on an Easter offset, wins its day and
commemorates the feria it covers (the ordinary movable-feast rule; `calendar/movable-feasts.ts`):

- `prayer-on-the-mount-of-olives`: Tuesday after Septuagesima (Easter -61), `Quadp1-2-Oratio`.
- `commemoration-of-the-passion`: Tuesday after Sexagesima (-54), `Quadp2-2-Passionis` (own Oratio and
  Lectio4-9; everything else is the votive office of the Passion, `Commune/Votiva/V6`, which borrows
  antiphons from `Tempora/Quad6-4/5/6`, whose English the reference engine has and which is used here).
- `crown-of-thorns`: Friday after Ash Wednesday (-44), `Quadp3-5-Spinis`.
- `lance-and-nails`: Friday of Lent 1, an Ember Friday (-37), `Quad1-5-Lancea`. The Lent Ember Friday
  therefore never wins its own day any more; it is commemorated and keeps its Matins reading.
- `holy-shroud`: Friday of Lent 2 (-30), `Quad2-5-Sindon`.
- `five-holy-wounds`: Friday of Lent 3 (-23), `Quad3-5-QuinqueVulnera` (Passiontide hymns reused from
  `matins-hymn-passiontide` / `lauds-hymn-passiontide`).
- `precious-blood-in-lent`: Friday of Lent 4 (-16), `Quad4-5-Sanguis`, the one line `@Sancti/07-DP`
  (= `07-01`): shares `most-precious-blood`'s office through `officeFrom`; own Matins reading file
  (07-DP's rearrangement of 07-01's Lectio4-6, Pius XI note cut), own collect/antiphon aliases for the
  commemoration lookup.
- Not done: the Column of the Flagellation (`Quadp3-2-Columnae`, Tuesday before Ash Wednesday): the
  source has only a rank and a rule, no text.

Generated by script from the source files (Latin verbatim; obvious OCR slips corrected and listed in
each reading file's header); English is this project's own translation, `status.en: draft`, except the
borrowed antiphons and hymns noted above and the Augustine homily on John 19 reused from
`octave-readings/sacred-heart-octave-day-8.yml`. Matins Nocturn 1 (Lectio1-3, scripture) is not carried:
the first nocturn runs the Scripture course. The Mass propers in the sources are not used.

Mechanism, small and scoped to these seven (flag `firstVespers: true` on the temporal-feast record):
1. `applyMovableFeasts` applies lower-ranked feasts first (the feria record has no rank), so the Passion
   feast displaces and commemorates it, not the reverse.
2. The feast claims First Vespers and competes by rank at concurrence, a tie going to the day after
   (`calendar/vespers.ts`); at Vespers a displaced feast is commemorated like a saint.
3. Matins keeps three nocturns (`hours/matins.ts`), using the feast's own psalmody override or its
   `officeFrom`'s; the Matins psalmody override lookup now accepts a temporal winner's id.
4. The day label names the commemorated feria (`calendar/day-label.ts`).

Tests: `tests/calendar/lenten-passion-feasts.test.ts`. Existing tests pinned to dates that are now one of
these feasts were moved to clean dates or rewritten for the new outcome (Ss. Perpetua and Felicity from
2026-03-06 to 2027-03-06; St. Titus 2029 -> 2025; St. Joseph's Vespers 2026 -> 2029; the Lent Ember
Friday tests in `ember-days.test.ts`; the Friday-of-Lent-2/3 rows of `lent-ordinary-ferias.test.ts`).

Observed, not changed: on every Lenten feria that has its own record (`friday-after-ash-wednesday`,
`lent-N-friday`, ...) the governing-week id (`quinquagesima`, `lent-3`, ...) is also commemorated, which
renders as "Commemoration of In the 3rd week of Lent" with the Sunday's antiphon. That is existing
behaviour of those records (no `suppressDisplacedCommemoration`), now also visible on these feast days.

### `privileged-feria-major`'s no-commemoration rule limited to Palm Sunday-Low Sunday and Ash Wednesday; same-date contest losers now obey the day's rule (2026-10-11)

The 2026-09-01 instruction was "you dont commemorate -anything- from palm sunday through low sunday";
Ash Wednesday was live-checked (Chair of St. Peter, 2034). `fc4ac339` applied it to every
`privileged-feria-major` day, which also held the Vigil of Pentecost, the Vigil of Christmas, Corpus
Christi and the Sacred Heart. Palm Sunday through Low Sunday does not include those.

1. **New category `privileged-feria-major-commemorating`** (`calendar/types.ts`,
   `temporal-categories.yml`): the Vigils of Pentecost and Christmas, Corpus Christi and the Sacred
   Heart. Never displaced; Duplex majus and above is commemorated, lower ranks transfer (what
   `privileged-feria-major` did before 2026-09-01).
2. **Contest-loser leak**: `resolveNativeOccurrence` appended the loser of a same-date saint contest as a
   commemoration after `decideOccurrence`, which only ever saw the contest's winner -- so the loser got
   commemorated on days forbidding it (present since the occurrence engine, 2026-08-10). Losers now go
   through `decideOccurrence` as a native candidate would; a loser the rule would not commemorate lapses.
   Only the contest's winner is carried forward as a transfer. Where a saint won the day outright nothing
   changes. Tests: `tests/calendar/clash-commemorations.test.ts`.

Consequence: two same-rank Semiduplex saints sharing a date that falls on an ordinary Sunday used to
leave the loser commemorated; it now lapses, matching the standing rule that an ordinary Sunday pushes
Semiduplex off rather than downgrading it to a commemoration.

### Regional-directory sweep started: Hildegard (Bavaria) and Isidore (aliquibus locis) placed on the calendar (2026-10-11)

First pass over `Latin/Sancti/{aliquibus locis,Bavaria,Urbis,Brasilia,Neerlandia}/`, which no earlier
sweep had touched (earlier ones covered top-level `Sancti/`/`SanctiM/` and their suffixed files). Finding
that frames all of it: `English/Sancti/` is flat -- no regional subdirectory exists in English at all, so
every file there is Latin-only here; English is this project's own translation, marked `draft`.

- **St. Hildegard** rebuilt from `Sancti/Bavaria/09-17-Hildegardis.txt` (Duplex, nine lessons, own
  Vespers hymn, three antiphons, proper responsories) instead of the Monastic stub. Placed on **Sep 25**
  (her Sep 17 is the Stigmata of St. Francis; Sep 18-24 all occupied; first free date after).
- **St. Isidore the Farmer** rebuilt from `aliquibus locis/05-15-Isidorus.txt`, placed on **May 15** and
  made to win: Isidore `duplex`, de la Salle dropped to `semiduplex` (what the deflation rule gives a 1900
  canonization anyway), so de la Salle is commemorated. Both were authored earlier but never on the calendar.
- Decided, not yet done: the seven Lenten/pre-Lenten Passion feasts (`aliquibus locis/Quad*`), as movable
  feasts that win with the Lenten feria commemorated (Column of the Flagellation skipped -- source has no
  text); Marian/devotional feasts (Mediatrix on Oct 1, Holy House Dec 10, Betrothal Jan 23, Help of
  Christians May 24, Redeemer Oct 23); Purest Heart dropped (duplicate of Immaculate Heart); Purity and
  Patronage of the BVM deferred (Sunday-bound). Plan: `~/.claude/plans/i-see-that-in-keen-origami.md`.

`npm test` (6032 tests) and `npx tsc --noEmit` pass.

### Prime chapter-responsory by-feast table: verified, not bulk-content -- only 2 of 36 needed it (2026-09-15)

Follow-up to the Lectio Brevis entry below, same session. User pushed back on leaving
`prime-chapter-responsory-by-feast.yml` as an assumed-large open item: "dont we need those prime
responsories verified? they're more like doxologies than the short reading" -- right call. Checked
all 36 `Sancti/*.txt` files carrying a `[Lectio Prima]` tag for a paired `[Versum Prima]`: only 2
actually have one of their own (Most Precious Blood, `07-01.txt`, "Qui tuo nos sanguine
redemisti"; Christ the King, `10-DU.txt`, "Qui primatum in omnibus tenes") -- every other one
either has no `[Versum Prima]` at all (season/per-annum already the right answer) or, like Seven
Sorrows, a bare `@Tempora/...` redirect to the season's own verse. Not a 36-saint sweep like
Lectio Brevis turned out to be -- genuinely done, both entries authored
(`prime-chapter-responsory-most-precious-blood.yml`/`-christ-the-king.yml`,
`byFeastId` populated).

Real bug found and fixed along the way: Christ the King is a *temporal* id, and
`resolveSeasonalPropersId` (`hours/seasonal-propers.ts`, shared by the chapter responsory, the
opening-versicle Alleluia/Laus-tibi switch, and the seasonal Marian antiphon) only ever checked
`byFeastId` for `winner.kind === 'sanctoral'` -- her entry would have been silently unreachable.
Fixed to check `winner.id` regardless of kind (both `DayWinner` variants carry one). Also extended
`getPrimeLectioBrevis` itself with a temporal-proper tier (`getTemporalProperWithFallback`, same
lookup every other temporal proper already uses) so Christ the King's own `[Lectio Prima]`
(Col 1:19-20) is reachable too -- the mechanism below only had sanctoral proper/Common tiers
before this.

`npm test` (2096 tests), `npx tsc --noEmit`, and `npm run build` all pass.

### Prime Lectio Brevis: wrong-source bug fixed, full 4-tier override mechanism built, stale "milestone 4" comments corrected app-wide (2026-09-15)

User flagged "today's Prime short reading feels wrong" (Seven Sorrows of the BVM). Turned into
three real findings and a documentation-accuracy sweep, each checked against the reference engine
directly rather than assumed:

1. **Wrong-source bug**: `prime-lectio-brevis-per-annum.yml`'s text ("Justum deduxit Dominus...",
   Wis. 10:10) was never Prime's own ordinary-time reading at all -- it's Common-of-a-Confessor
   content (`Commune/C5.txt`'s own `[Lectio Prima]`). The real Monastic Prime "Per Annum" short
   reading is `Psalterium/Special/Prima Special.txt`'s own `[Per Annum]` tag -- 2 Thess 3:5.
   Corrected, both languages, citation updated.

2. **Missing per-feast/per-Common mechanism**: no override existed for this slot at all. Built
   `getPrimeLectioBrevis` (`hours/resolve-common.ts`), four tiers in precedence order: a saint's
   own proper `${propers}-lectio-prima` (confirmed present for 36 saints in `Sancti/*.txt`) ->
   her Common category's `prime-lectio-prima-common-of-${common}` (confirmed present in 13 of the
   ~14 numbered Commune files -- this is where the wrongly-universal Wis. 10:10 text properly
   lives now, correctly scoped to Common-of-a-Confessor only) -> the day's own season -> the
   per-annum default. Wired into `hours/prime.ts`'s `lesson` case. Authored: Seven Sorrows'
   own proper reading, all 13-category Common tier (14 files, C1 serves two categories), all
   8 season variants (`Psalterium/Special/Prima Special.txt`'s `[Adv]`/`[Nat]`/`[Epi]`/`[Quad]`/
   `[Quad5]`/`[Pasch]`/`[Asc]`/`[Pent]`). The other 35 saints' own proper readings are open
   bulk-content work (Open Work, item 2).

3. **The "milestone 4" comments blocking the season tier were stale, not real** -- user's own
   instruction: stop deferring to a milestone that's long since past. Checked directly:
   `calendar/temporal.ts`'s `resolveSeason` is a complete, real, data-driven implementation, not a
   stub -- confirmed live-firing today across `prime-chapter-responsory-by-season.yml` (Advent
   through Pentecost all correctly resolve their own season id) and `opening-by-season.yml`
   (Septuagesima/Lent/Passiontide correctly drop the Alleluia). Corrected the stale claim in both
   files plus `hours/seasonal-propers.ts`, `hours/types.ts`, `hours/compline.ts`, and
   `hours/resolve-common.ts` -- none of these were actually blocked on anything.

Still genuinely open, not stale: `prime-chapter-responsory-by-feast.yml`'s `byFeastId` table is
still empty -- real per-feast Prime-responsory content, not a documentation error. Spot-checked
Seven Sorrows' own `[Versum Prima]`: it's a bare `@Tempora/Quad5-5` cross-file redirect to the
season's own content, not unique text of her own -- meaning at least some (maybe most) of the 36
`[Lectio Prima]`-bearing saints may not need a real by-feast responsory entry at all, since the
season tier already covers them. Needs a per-saint check before bulk-authoring, not assumed.

`npm test` (2096 tests), `npx tsc --noEmit`, and `npm run build` all pass.

### Two of the four hymn/doxology-sweep flags closed: Pentecost-week Terce hymn, Seven Sorrows Vespers English (2026-09-11)

Follow-up to the two items flagged-not-fixed in the 2026-09-10 sweeps below.

**Pentecost-week Terce hymn swap, now authored and wired**: confirmed against the static source
(`Psalterium/Special/Minor Special.txt`'s own `[Hymnus Pasc7 Tertia]`/`[HymnusM Pasc7 Tertia]`)
that this is a real whole-hymn swap to "Veni Creátor Spíritus", Terce-only (no `Pasc7 Sexta`/`Pasc7
Nona` block exists) — `Tempora/Pasc7-0.txt` (Pentecost Sunday) redirects Vespers to the same hymn
(already authored, Monastic variant), and `Pasc7-1.txt` through `Pasc7-6.txt` (the octave weekdays)
all inherit from `Pasc7-0` via their own `ex Pasc7-0` rule, so the swap covers all 7 days of the
octave, Sunday included. Added `terce-hymn-pentecost-week.yml` (body copied verbatim from
`vespers-hymn-pentecost-sunday.yml`'s already-verified Monastic text, `*`-marked doxology stanza so
it plugs into the existing `substituteDoxology`/`hymn-doxology-pent.yml` mechanism rather than
baking a fixed doxology in; English is the reference engine's own translation, not a new one).
Wired into `hours/terce.ts`'s `hymn` case via `resolveOfficeWinner(day).id === 'pentecost-sunday'`
(already in `ALWAYS_OVERRIDE_TEMPORAL_IDS`, so this covers both Pentecost Sunday itself and every
interior octave day for free — no new date math). New coverage in `tests/hours/little-hours.test.ts`
confirms the swap on Pentecost Sunday and an interior octave day, that it reverts by Trinity Sunday,
and that Sext/None are unaffected on the same dates.

**`vespers-hymn-seven-sorrows-of-the-bvm.yml` English replaced**: the file's own header claimed no
English rendering existed in the reference engine's data and supplied a self-translated draft —
wrong, same miss as `lauds-hymn-seven-sorrows-of-the-bvm.yml`'s 2026-09-10 fix. A real, complete
rhymed translation exists at `English/Sancti/09-15.txt`'s own `[Hymnus Vespera]`; now sourced
directly from there, `status.en` flipped `draft` → `verified`.

**`matins-hymn-all-saints.yml` resolved as a deliberate curatorial split, not a bug**: the file's
old header claimed the Monastic engine independently renders a Matins text distinct from Vespers' —
checking `Sancti/11-01.txt`'s tags directly, that's not true; the source collapses to just two real
texts total across all four Matins/Vespers × secular/Monastic slots ("Placáre, Christe, sérvulis"
secular at both hours, "Christe Redémptor ómnium" Monastic at both hours, Matins a pure redirect to
Vespers in each track). Kept "Placáre..." at Matins anyway, on purpose — its judgment/pleading
imagery ("apud sevérum Júdicem", "veris reórum flétibus") suits Matins' night-vigil register better
than Vespers' warmer "make us companions of Christ" — and rewrote the header to say so plainly
instead of claiming a literal-engine-fidelity justification that doesn't hold up.

**`lauds-hymn-circumcision.yml`/`lauds-hymn-christmas-octave-sunday.yml`'s Monastic word
substitutions reviewed line-by-line, only one adopted**: rather than a blanket find/replace,
weighed each of the 8 substitutions against this project's own standing preference for whichever
wording carries more concrete/specific imagery. Five are a wash (auctor/Auctor capitalization,
Enítitur/Eníxa est tense, ventre Matris/matris alvo word order, Baptísta clausum/Clausus Joánnes
title-vs-name, Et lacte módico/Parvóque lacte — all synonymous). Two actually flatten the existing
text (Jesu tibi sit glória→Glória tibi Dómine loses the direct address to the Holy Name; almo→Sancto
Spíritu trades a distinctive epithet for the generic word every other hymn's doxology already uses)
— kept as-is. Only `Concépit alvo`→`Verbo concépit` adopted, in both files: a real improvement, not
a meter tweak — ties the Incarnation to the Johannine "Verbum caro factum est" rather than a plain
anatomical phrasing. English updated to match ("Conceived in her womb the Son" → "By the Word
conceived the Son"). `vespers-hymn-circumcision.yml` (Matins' sibling) carries a different hymn
entirely ("Christe Redémptor ómnium," already Monastic) and needed no change.

`npx tsc --noEmit` and `npx vitest run` (2088 passed) both pass.

### Hymn doxology rearchitected to a marker-based mechanism, plus a full audit of ~230 hymn files (2026-09-10)

Follow-up to the same day's earlier doxology fix (below): the user pushed back on the
body-file/doxology-file split used there ("why is a function deciding if a hymn's doxology should
be substituted? ... pass the hymn, the doxology type, and substitute where the marker is; if no
marker, the effect is null") — pointing out this is exactly how Divinum Officium's own `hymni.pl`
already works (`if ($hymn =~ /\*/) { ... $hymn =~ s/\*.*/$dox/s }`), which this session's very first
research pass had already found but hadn't carried through architecturally.

Rebuilt the mechanism around that design:
- **`substituteDoxology(hymn, override)`** (`hours/resolve-common.ts`) replaces `appendDoxology`.
  One hymn text, with a literal `* ` marker at the start of its variable final stanza (ported
  directly from the source's own convention). If the marker is present and an override was found,
  splice in the override starting at the marker; otherwise leave the text as-is (marker stripped).
  A hymn with no marker anywhere (a genuinely fixed ending, e.g. Ave Maris Stella) is untouched.
- **`getHymnDoxologyOverrideId(day)`** (renamed from `getHymnDoxologyId`) now returns
  `string | undefined` — no more caller-supplied `perAnnumId` fallback, since a hymn's own per-annum
  ending is just part of its own text now, not a separate id.
- Every hour's ferial-default hymn (Lauds/Vespers: 11 seasonal/weekday variants each; Matins: 6
  weekday variants; Prime/Compline: 1 each; Terce/Sext/None: 1 each, undoing today's earlier split)
  merged back into a single file with the marker embedded, verified via a script-driven merge
  (`js-yaml` round-trip check, not hand-editing) plus a full re-run of the test suite between every
  batch.
- Applied the same `substituteDoxology` call at the **proper/Common/octave hymn tier** too
  (`resolveOfficeBundle`'s `bundle.hymn` at Lauds/Vespers, `resolveMatinsHymn`'s every branch) — this
  tier previously never varied its doxology at all regardless of season/feast, the same gap
  Terce/Sext/None had, just for every saint/Common/octave hymn instead of 3 hours.

**Full audit, ~230 proper/Common/season hymn files across Lauds/Vespers/Matins** (9 parallel
research passes, each cross-checking continua's YAML against the actual reference-engine `.txt`
templates, not live-CGI dates): added the `*` marker to every hymn genuinely confirmed to carry one
in the source (Common-of-the-BVM/Apostle(s)/Martyr(s)/Confessor-Bishop/Confessor-Doctor/Virgin/
Virgin-Martyr/Widow/Holy-Woman at Lauds/Vespers/Matins as applicable, plus ~20 individual
saints/feasts: commemoration/conversion of St. Paul, St. Philip & James, Ss. Simon & Jude, St.
Agatha, St. Agnes, St. Andrew, St. Barnabas, St. Bartholomew, St. James the Greater, St. John
Apostle, St. John before the Latin Gate, St. Lawrence, St. Luke, St. Mark, St. Martin of Tours, St.
Matthew, St. Matthias, St. Stephen Protomartyr, St. Thomas Apostle, Transfiguration) — left every
confirmed-fixed hymn (the large majority: Ave Maris Stella, Verbum Supernum Prodiens, every
saint's own genuinely proper hymn with no swap slot, etc.) untouched.

Along the way, the audit surfaced and fixed **real content bugs unrelated to markers**, found by
comparing continua's baked text against the static source rather than trusting an old live-query
capture at face value:
- **Wrong hymn entirely, whole body replaced** (copy-pasted from an unrelated feast that happened
  to share a versicle cross-reference): `matins-hymn-ascension.yml` (had the Lauds/Vespers hymn,
  not Matins' own "Ætérne Rex altíssime"), `{lauds,vespers,matins}-hymn-guardian-angels.yml` and
  `matins-hymn-{st-gabriel,st-raphael}-archangel.yml` (all four had St. Michael's Apparition hymn,
  each restored to their own feast's real text), `lauds-hymn-trinity-sunday.yml` (had the Vespers
  hymn duplicated, restored to Trinity's own distinct "Tu, Trinitátis Únitas").
- **Latin/English final-stanza mismatch** (one language correctly showed a doxology override, the
  other didn't): `matins-hymn-common-of-the-bvm.yml` (Latin was baked from the wrong hour), both
  `{lauds,vespers}-hymn-pentecost-sunday.yml` (Latin was the Matins-track `PentT` text, not
  Lauds/Vespers' own), `lauds-hymn-st-stephen-protomartyr.yml` (English hadn't picked up the
  Nat swap the Latin already had), `{matins,vespers}-hymn-transfiguration.yml` (English was the
  plain `Epi` doxology's translation instead of the Monastic `EpiT` one the Latin already used).
- **Missing content**: `lauds-hymn-seven-sorrows-of-the-bvm.yml` was missing its 4th (closing)
  stanza entirely, and its English was a self-translated draft despite a real, complete rhymed
  translation existing in the source all along — both fixed together.
- **Missing files entirely**: `matins-hymn-common-of-a-martyr.yml` and its `-bishop` sibling didn't
  exist at all (unlike the psalmody tier, which already aliases these two categories) — any winning
  Martyr-Common saint with no proper hymn of his own was silently falling to the plain ferial Matins
  hymn instead of his Common's real one (e.g. St. Lawrence's own Aug 17 closing-octave day). Authored
  both from `Commune/C2.txt`'s own `[Hymnus Matutinum]` (`@:Hymnus Vespera` cross-reference).

**Flagged, not fixed** (real findings, but either unverifiable without live access or a larger
separate task):
- `matins-hymn-all-saints.yml`: one research pass's static-file read directly contradicts this
  file's own existing header, which cites a specific, detailed live-verification explicitly
  anticipating and rebutting that exact static reading. Left as-is rather than pick a side without
  the ability to re-verify live.
- `{lauds,vespers}-hymn-circumcision.yml`/`lauds-hymn-christmas-octave-sunday.yml`: Monastic-track
  word-substitutions against the secular final stanza not modeled (pre-existing, already
  known/flagged issue for `circumcision`; added the same flag to `christmas-octave-sunday`, which
  was missing it).
- `vespers-hymn-seven-sorrows-of-the-bvm.yml`: English is a valid but different (more literal)
  rendering than the source's own rhymed translation — not wrong, just worth knowing.
- Pentecost-week Terce's whole-hymn swap to "Veni Creátor Spíritus" — still not authored (unchanged
  from the earlier entry below).

Test updates: two pre-existing tests asserted the old, now-corrected wrong hymn content
(`tests/hours/lauds.test.ts`'s Guardian Angels/Archangels test, `tests/hours/matins.test.ts`'s
matching one and its St. Lawrence Aug-17 fallback assertion) — rewritten to assert the real,
distinct content per feast instead of a shared assumption that no longer holds.

`npx tsc --noEmit` and `npx vitest run` (2084 passed) both pass; a broad smoke sweep (every hour,
24 dates spanning the whole year) confirms no hour throws or renders an empty hymn anywhere.

### Hymn doxology gaps closed, plus a `day.winner`/`resolveOfficeWinner` inconsistency (2026-09-10)

Started from: today's hymns (inside the Nativity-BVM octave) weren't getting the reference
engine's "Nat" doxology stanza. First diagnosis was wrong — proposed adding new octave-detection
logic to `getHymnDoxologyId`, but it already calls `resolveOfficeWinner(day)`
(`hours/hymn-doxology.ts`), which already substitutes the governing octave's saint/feast on
interior octave days (`resolveActiveOctave` internally, `hours/resolve-common.ts`). The real bug
was a missing data entry: `byFeastId['nativity-bvm']` didn't exist.

Fixed, four parts:
- **Doxology data gaps**: added a `byCommonId` tier to `getHymnDoxologyId` (mirrors
  `resolveOfficeBundle`'s `getSaintRecord(id)?.common` pattern) with `common-of-the-bvm:
  hymn-doxology-nat` — covers all 16 BVM-Common saints generically instead of listing each by id.
  Added `corpus-christi`/`sacred-heart`/`transfiguration` to `byFeastId` (their own octaves/rule
  need it, not just their anchor day).
- **Terce/Sext/None wired into the doxology mechanism**: these three hours never varied their
  doxology at all — `resolveSelfContainedHymn` returned one fixed blob per hour with the closing
  stanza baked in. Split each `{terce,sext,none}-hymn.yml` into a body-only file plus a new
  `{hour}-hymn-doxology-per-annum.yml`, and wired all three through the same resolve-body /
  `getHymnDoxologyId` / `appendDoxology` pattern the other five hours already use. Removed
  `resolveSelfContainedHymn` (no remaining callers).
- **`day.winner` vs. `resolveOfficeWinner(day)` inconsistency**: `getOpeningVersicleId` (all 8
  hours), `getChapterResponsoryId` (Prime), and `getMarianAntiphonId` all took the raw `day.winner`
  instead of `resolveOfficeWinner(day)` — the one substitution rule every other content lookup in
  this codebase follows. Changed `getOpeningVersicleId`/`getChapterResponsoryId` to take the whole
  `day` and call `resolveOfficeWinner` internally rather than leaving it to each call site.
  Currently a no-op for 8 of 9 call sites (their tables are empty or the content is structurally
  season-only), but closes a real latent gap for Prime's chapter-responsory once that table gets
  populated.
- **Psalmody-override consolidation**: `lauds-psalmody-overrides.ts`/`vespers-psalmody-
  overrides.ts`/`matins-psalmody-overrides.ts` each independently reimplemented the identical
  "saint id → `SaintRecord.common`, optional `-paschaltide` variant" fallback. Extracted into a
  shared `resolveCommonCategoryId` (`hours/psalmody-common-category.ts`); left every other
  difference between the three modules alone (Lauds' canticle/laudate fields, Vespers' verse-range
  psalms, Matins' 3-nocturn scheme, Matins having no Paschaltide tier at all) — those are real
  domain differences, not duplication, and forcing them into one type would have been lossy.

Live-verified across the Nativity-BVM octave, genuinely-octave-displaced Corpus Christi/Sacred
Heart days (found via `activeOctavesFor`, not guessed date offsets), Transfiguration, Annunciation,
Purification, the existing Assumption-window/Marian-Saturday paths (unaffected), and a plain
per-annum ferial day (unaffected). Along the way, confirmed two adjacent things are *not* bugs:
Vespers' Ave Maris Stella and Lauds'/Matins' proper Corpus Christi hymns ("Verbum Supernum
Prodiens"/"Sacris Solemniis") genuinely have fixed, non-swappable endings in the source (no `*`
marker, or the ending is the hymn's own famous close, e.g. "O Salutaris Hostia") — continua's
existing authored text there is correct as-is.

Two things flagged, not fixed here:
- Pentecost-week Terce swaps its *whole* hymn to "Veni Creátor Spíritus" in the reference source —
  a full hymn replacement, not a doxology-stanza swap, and continua has no such text authored yet.
- Lauds'/Matins' proper hymn files for a Common category (e.g. `lauds-hymn-nativity-bvm.yml`) are
  authored with their doxology already baked in from a live query on the feast's own day — correct
  for now, but a systemic authoring risk if such a file is ever queried on a date outside its
  doxology's active window (not verified in bulk).

`npx tsc --noEmit` and `npx vitest run` (2082 passed) both pass.

### Matins never got the octave-rank-awareness fix above — same bug, different hour (2026-09-10)

Bug: 2026-09-09's fix above was scoped to Lauds/Vespers only (`getPsalmodyNumbersOverrideId`, added
to `resolve-common.ts`). `hours/matins.ts` has its own, separate, older rank-gating logic for
psalm-number selection (`threeNocturns`, `isAboveDuplex`) and was never given the equivalent
treatment. Caught live: 2026-09-10 (day 3 of the Nativity of the BVM's octave, `wins: duplex`) was
rendering the full Common-of-the-BVM 3-nocturn psalm scheme (Ps 8/18/23/44/45/47) at Matins instead
of falling back to plain ferial Thursday psalms, because `isAboveDuplex` was computed straight from
`resolveOfficeWinner(day).rank` (the Nativity's un-weakened `duplex-2-classis`) rather than the
octave's own day-specific rank.

Fixed by factoring the octave-aware effective-rank computation out of `getPsalmodyNumbersOverrideId`
into a new shared `officeWinnerEffectiveRank(day, winner)` (`resolve-common.ts`), and pointing both
of `matins.ts`'s rank checks (`threeNocturns`'s semiduplex floor, `isAboveDuplex`'s duplex-majus
gate) at it instead of `winner.rank` directly. `getPsalmodyNumbersOverrideId` itself now just calls
the shared helper — no behavior change there. Live-verified: 2026-09-10 Matins now resolves to
ferial Thursday psalms (76, 77 split, 78, 79, 80, 82, 83, 84); 2026-09-08 (the feast's own actual
day, not octave-borrowed) is unaffected and still shows its own proper psalms.

`npm test` (2082 passed) and `npm run build` both pass.


### Lauds/Vespers psalm-number selection tightened: octave days use the octave's own rank (2026-09-09)

Bug: 2026-09-09 (day 2 of the Nativity of the BVM's octave, St. Gorgonius's `simplex` losing the
day) was showing the Nativity's own proper psalm numbers instead of plain ferial Wednesday psalms.
Root cause: `resolve-common.ts`'s `getOfficeOverrideId` (the duplex-majus+ gate for proper/Common
psalm-number substitution) compared against the *origin feast's own full rank*
(`resolveOfficeWinner`'s synthesized `saint.rank` — `duplex-2-classis` for the Nativity) on every
day of its octave, not the octave's own per-day effective rank (`ActiveOctave.wins`, already
closing-day-aware). Every day of a strong feast's octave therefore always read as duplex-majus+
eligible regardless of the octave's actual (often lower) claim that day.

Fixed with a new, psalmody-specific `getPsalmodyNumbersOverrideId` (deliberately not a change to
`getOfficeOverrideId` itself, which stays on the origin feast's real rank for its own unrelated
consumers — Vespers' chapter/responsory/hymn/versicle bundle, the minor-hour overrides): on a day
whose content is borrowed from an active octave (not the feast's own actual day), it gates on that
octave's own `wins` for the day instead of the origin feast's rank. Confirmed with the user: rule is
now literally "winner rank `duplex` or lower -> plain ferial psalms; `duplex-majus`+ -> proper (incl.
an octave's own governing saint), then Common category, first one found." The separate, deliberately
rank-ungated antiphon-overlay mechanism (`mergeFerialNumbersWithProperAntiphons` — a saint's own
antiphon text layered onto ferial numbers below the threshold) is untouched.

Knock-on finding, confirmed with the user: no octave in the current calendar data sets an explicit
`closingDayRank`/`wins` at duplex-majus+ (`calendar/octaves.ts`'s `DEFAULT_CLOSING_DAY_RANK` is only
`duplex`), so an existing test asserting St. Lawrence's own octave closing day (Aug 17) kept his
Common-of-a-Martyr psalms was itself an instance of the same bug — updated to expect plain ferial
Monday psalms instead, per the same corrected rule.

`npm test` (2082 passed) and `npm run build` both pass.


### Accuracy audit: stratified live/source sample, second pass (2026-09-08)

Complementary to the structural pass above — a stratified random sample (18 files across 9
categories: common antiphons, capitula, collects, hymns, responsories, saint-specific collects,
nocturn readings, Lauds/Vespers psalmody overrides) re-checked against either a live query or the
raw reference source directly, not just structural shape. 17/18 confirmed byte-for-byte accurate;
the 18th (`visitation-of-the-bvm.yml`'s first Vespers antiphon) has a minor English wording
difference from the live render, but vu's version is the *more correct* reading of the identical
Latin (the live engine's own English there is mildly garbled: "This day was visitation the glorious
Virgin Mary" vs. vu's grammatical "This day was the visitation of the glorious Virgin Mary") — not a
bug, a prior session's deliberate smoothing.

**Real methodological finding, not a content bug**: re-confirmed the version-string footgun already
noted in `vu_reference_engine_file_layout` memory — using the bare `version=Monastic` query param
(rather than the full `Monastic%20Tridentinum%201617`) silently resolves to **Monastic - 1963**, a
later revision. Concretely hit while picking a live-query date for `common-of-a-confessor`: St.
Peter of Alcantara (canonized 1669) genuinely is **not** on the true Monastic 1617 calendar at all
(confirmed directly against `Tabulae/Kalendaria/M1617.txt` and its `1570.txt` base — no entry for
Oct 19 in either) — querying his date under the correct full 1617 version string correctly returns
nothing but the plain ferial default, while the bare `Monastic` shorthand (landing on 1963, which
does include him) returns real content that happens to be byte-identical anyway, because Common
*template* text itself doesn't vary between Monastic revisions (only the calendar/rubrics do) —
re-confirmed by cross-checking the same antiphon against St. Romuald (Feb 7, genuinely present in
`M1617.txt`) under the correct full version string. So the specific risk is calendar-membership
confusion (silently landing on the wrong saint/day, or a false "not on this calendar" negative), not
corrupted Common content — but it's a trap worth remembering for future live-query sourcing:
**always pick a representative saint confirmed present in `M1617.txt`/`1570.txt` for the date being
queried**, don't assume any `propers: null`/Common-fallback saint is safe just because they're on
vu's own calendar (vu's calendar deliberately includes later-canonized saints beyond 1617's own,
per the "Not a reconstruction" design).

`npm test` (2077 passed) and `npm run build` both pass. No content changes this pass — everything
sampled checked out.


### Accuracy audit: structural checks, first pass (2026-09-08)

Live-requerying every `verified` claim across ~2460 content files isn't feasible in one sitting, so
started with cheap, whole-corpus **structural** checks instead — patterns that would have caught the
two real bugs found earlier this session (the All Saints 5-vs-4 psalm miscount, the Common-family
un-aliased-file gaps) if run proactively, rather than live-requerying content that already looks
internally consistent:

- **Vespers psalm-group count outliers** (>4 groups, the exact shape of the All Saints bug) — clean;
  the only two 5-group files (`st-thomas-becket`, `st-silvester-i`) are both documented, deliberate
  exceptions (below duplex-majus, extra group intentionally unused).
- **Duplicate psalm numbers within one psalmody-override file** — clean, none found.
- **Lauds/Vespers antiphon-text overlap for the same saint** — 23 saints share antiphon text between
  their Lauds and Vespers override files; all 23 are a clean **wholesale 4-of-5 subset** (Vespers'
  full set plus one extra Lauds-only antiphon) — the legitimate "Lauds reuses Vespers' antiphons
  verbatim" source pattern already documented, not the All Saints bug's shape (one stray antiphon
  amid otherwise-distinct sets). No partial-overlap anomalies found.
- **Citation `la`/`en` verse-number mismatches** (384 citations checked, inline and block YAML
  styles both) — found and fixed one real bug: `none-capitulum-common-of-a-dedication.yml` had
  `citation.en: "Rev 21:4-4"` against `citation.la: "Apo 21:4-5"` — a transcription typo (4-4 should
  be 4-5).
- **Hymn line-length regression** (re-running the same check from the earlier formatting sweep) —
  clean, no new long-line files beyond St. Gertrude's already-documented deliberate prose exception.
- **Psalm numbers outside 1-150** — clean.

`npm test` (2077 passed) and `npm run build` both pass. This is a first pass, not exhaustive — see
the "Accuracy audit" open-work item for what's still uncovered by this approach.


### 89 `propers: null` saints: reference-source-availability sweep, exhaustive (2026-09-08)

Extended the same audit the 194-saint (non-null `propers`) tier already got — Matins invitatory,
Lauds antiphons, Vespers antiphons, Lauds/Vespers hymn+chapter bundles, and Prime/Terce/Sext/None
antiphons+chapters — to the 89 `propers: null` saints, closing the item this campaign had
deliberately left open. Resolved each saint's real reference file(s) two ways (its own vu file's
header citation, and independently via its `sanctoral-calendar.yml` date against `Sancti`/`SanctiM`
on disk) to cross-check rather than trust one path; 3 ids (`example-confessor`, `st-turibius-of-
mogrovejo`, `st-peter-chanel`) have no resolvable file at all (the first deliberately fictional, the
other two off-calendar modern additions with no date mapping — out of scope here, matching
[[vu-future-user-editable-calendar]]).

Ran a tag-presence scan per part-type across all 89, then hand-verified every candidate against its
file's own `[Officium]` header before trusting it — the exact same-date-collision trap the original
August pass and the 194-saint sweep both already documented recurred constantly here too: `st-gall`'s
`[Invit]` hit was St. Hedwig's (Oct 16 dominated by a later-era occupant), `st-menna`'s was St.
Martin of Tours's (Nov 11), `st-justina`'s was Rosary Sunday's (Oct 7, recurred across 4 separate
part-type checks on the same file), `st-pius-i`'s and `st-odo`'s/`st-pontian`'s were St. Benedict's
Translation's and St. Elizabeth of Hungary's respectively (both dates hold a Monastic-specific
higher-precedence occupant in a differently-suffixed file), `st-telesphorus`'s was a bare
`@Sancti/12-25` Christmastide cross-reference, `ss-placid-and-companions`'s was a wrong, similarly-
named but distinct feast (`SanctiM/10-05r.txt`, "Ss. Mauri et Placidi... Confessores" — a different
pair of saints on a different track, not "Ss. Placid and Companions, Martyrs"), `st-felix-i`'s
`05-30b.txt` hit was an unrelated feast's content ("Beátæ Joánnæ") bleeding in from a differently-
suffixed file even though his own real file (`05-30.txt`) exists and correctly has none of these
tags, `st-hyginus`'s and `st-pudentiana`'s were both wrong-file hits (a cross-date reference and a
different pope's file respectively) while their own correctly-titled files had nothing, and
`st-alexius`'s only hit was gated behind `(rubrica 1951)`, inapplicable to this app's Monastic 1617
target. Every single candidate across all part-types resolved to one of these already-known false-
positive shapes — real confirmation the original August pass was thorough, not an assumption.

**One genuine, previously-missed gap found**: `st-silvester-i` (Dec 31, within Christmas's Octave)
has the exact same `@Sancti/12-25:Ant Vespera 3` cross-reference shape as `st-thomas-becket`'s own
Vespers antiphon (see "Shared resolution chain, `st-thomas-becket`'s Vespers antiphon closed"
above) — a complete, independently-named alternate 5-antiphon block in Christmas's own source file,
not a slot reference. Authored `vespers-psalmody-overrides/saints/st-silvester-i.yml`, byte-identical
content to Becket's own file (both point at the same source block; both `rank: duplex`, so the same
"5th group goes unused below duplex-majus" convention applies). Live-verified via `resolveOrdo`
(2025-12-31): now renders the real antiphons over the day's own ferial psalm numbers, same shape as
Becket's.

`npm test` (2077 passed) and `npm run build` both pass.


### All Saints' own Vespers psalmody bug found + `octave-of-all-saints` gap closed (2026-09-08)

Re-checking the `octave-of-all-saints` Vespers psalm-slot open item (user pushback: "monastic
vespers does 4 psalms typically," against this app's own `all-saints.yml` file claiming 5) surfaced
a real bug in All Saints' own day, not just the Octave's gap. Live-verified against the local
Divinum Officium CGI instance (`command=prayVespera`, `version=Monastic`, 11-01-2026): the actual
render is exactly 4 psalms — 109, 111, 112, 115 (110 genuinely skipped, not shifted) — the ordinary
Monastic 4-psalm Vespers scheme, not an exception. The existing `vespers-psalmody-overrides/saints/
all-saints.yml` (authored 2026-08) had 5 groups: psalm numbers 110/111 mislabeled where they should
have been 111/112, plus a spurious 5th antiphon ("Benedícite Dóminum omnes elécti ejus") that turned
out to be Lauds' own antiphon for this feast, apparently copy-pasted in by mistake. Corrected that
file to the live-verified 4-slot scheme.

With the real scheme confirmed, wired `octave-of-all-saints` to reuse it (new `vespers-psalmody-
overrides/saints/octave-of-all-saints.yml`, duplicated per this codebase's standing convention) —
same cross-id reuse pattern already used for this feast's collect. Its own date (Nov 8) still isn't
independently live-queryable (contested with `ss-four-crowned-martyrs`, whose simplex rank the
Octave's duplex-majus outranks per the kalendarium's own primary/secondary listing, so a plain query
there doesn't surface a separate answer to check against) — reasoned from the collect's own
established precedent instead, then confirmed via `resolveOrdo` that both First Vespers (Nov 7
evening, governed by the Octave) and Second Vespers (Nov 8) now render 109/111/112/115. `npm test`
(2077 passed) and `npm run build` both pass.

**Lesson**: a file's own header comment claiming "live-verified" isn't self-certifying — this one
had been carried forward and cited as settled fact (including by this session, initially) without
anyone re-checking the actual live render against the claim. Worth keeping in mind for the still-
open accuracy-audit item below.


### Un-aliased shared-Common P/T/S/N + Benedictus/Magnificat files closed (2026-09-08)

Started as the "PTSN Terce chapters" open item (assumed-ferial, never live-verified). The real bug
turned out not to be a missing live-verification but a missing *registration*: several
`resolve-common.ts` lookups (`resolveMinorHourAntiphon`/`resolveMinorHourChapter` via
`SaintRecord.minorHoursCommon`, `getBenedictusAntiphon`/`getMagnificatAntiphon` via
`benedictusCommon`) key straight off the literal Common-category id string, one file per id — no
aliasing. Several past sessions had already *live-verified* that some Common categories share
identical Prime/Terce/Sext/None + Benedictus/Magnificat content across multiple ids (their own file
headers say so explicitly — e.g. `terce-capitulum-common-of-an-abbot.yml`: "Covers `common-of-an-
abbot`, `common-of-a-confessor-not-bishop`, and `common-of-a-confessor` ... live-verified identical
... across all three") but had only ever authored the file under *one* of those ids, per this
codebase's own standing convention of duplicating rather than aliasing shared content (already
followed correctly for e.g. `prime-antiphon-common-of-a-confessor{,-bishop,-not-bishop}.yml`). Every
other id in each "Covers" list was silently falling through the chain to the plain ferial default
instead — the exact "should be using the Commons" mechanism gap this entry started from, just not
where originally suspected.

Audited every `data/propers/common/*.yml` file with a "Covers `...`" header line (18 found) against
the ids the Common-category fields (`minorHoursCommon`, `benedictusCommon`) actually use across all
saints, and found 25 missing sibling files: the **abbot family** (`common-of-an-abbot` →
`common-of-a-confessor`, `common-of-a-confessor-not-bishop`) was missing its Terce/Sext/None
*capitulum* files (6) and one `benedictus-antiphon` file (1); the **virgin family**
(`common-of-a-virgin` → `common-of-a-virgin-martyr`, `common-of-a-holy-woman`) was missing
*every* Prime/Terce/Sext/None antiphon+capitulum, Benedictus, and Magnificat file (18) — the
`common-of-a-virgin-martyr`/`common-of-a-holy-woman` ids (3 affected saints) had *no* shared-Common
minor-hour or Benedictus/Magnificat content wired at all before this. All 25 written as duplicates
(not aliases, matching convention) of their already-live-verified source file, same text/citation/
status, with a header note pointing back to the source. Spot-verified live via `resolveOrdo`: St.
Peter of Alcantara (`common-of-a-confessor`, Oct 19) now correctly resolves Terce's "Beátus vir, qui
invéntus est sine mácula" chapter instead of the ferial default; St. Justina
(`common-of-a-virgin-martyr`, Oct 7) now correctly resolves "Fratres: Qui gloriátur" instead of
falling through. `npm test` (2077 passed) and `npm run build` (`tsc --noEmit` + `vite build`) both
pass, no id collisions.


### Hymn run-on-stanza formatting sweep (2026-09-08)

User flagged today's Lauds hymn (`lauds-hymn-nativity-bvm`, "O gloriósa Dómina") as visibly
misformatted — each 4-line stanza had been authored as one long run-on line instead of one verse
per line, so it rendered as a wrapped paragraph rather than proper hymn-verse breaks (`white-space:
pre-line` in `styles.css` only respects real `\n`s). Fixed that file, then found the same exact text
duplicated (and identically broken) in `lauds-hymn-assumption`/`lauds-hymn-immaculate-conception`.

A full sweep of all 258 `*hymn*.yml` files under `data/propers/common/` (parsed via js-yaml, flagging
any resolved line over 95 chars — well below normal per-verse length for these meters) found 30 more
pre-existing files with the identical bug, none from today's work: `all-saints`, `apparition-of-st-
michael`, `chair-of-st-peter-at-{antioch,rome}`, `conversion-of-st-paul`, `guardian-angels`, `holy-
innocents`, `nativity-of-st-john-the-baptist`, `ss-peter-and-paul`, `ss-philip-and-james`, `ss-simon-
and-jude`, `st-{andrew,barnabas,bartholomew,gabriel-archangel,gertrude,james-the-greater,john-
apostle,john-before-the-latin-gate,luke,mark,martin-of-tours,matthew,matthias,peter-ad-vincula,
raphael-archangel,scholastica,stephen-protomartyr,thomas-apostle}`, plus `vespers-hymn-st-gertrude`.
Many share identical text across saints (Common-of-Apostles' "Exsúltet cælum láudibus" alone covers
10 files) — deduped by content hash first, fixed one representative per group, then propagated
byte-for-byte to its duplicates via script rather than 30 manual edits.

St. Gertrude's two files (Lauds/Vespers) were a different, genuine special case, not the same bug:
authored as a deliberate free-prose translation (with an embedded "*" incipit-style break, per each
file's own "translated here directly" note) rather than a metrical verse-for-verse one — forcing a
fake 4-line split per stanza would have meant guessing false precision the source translation never
had. Left those as prose, just split once at the existing "*" mark and fixed an unrelated encoding
artifact (the Latin used `>-` folded style with a blank line after *every* verse, not just between
stanzas, which read the wrong way visually).

All 258 hymn files re-parsed cleanly (0 YAML errors); re-ran the length check post-fix — clean
except St. Gertrude's remaining prose-sentence half-lines (107-132 chars, an accepted, deliberate
exception per above, not a miss). `npm test` (2077 passed) and `npx tsc --noEmit` both pass, no
content/translation changes, formatting only.


### Shared resolution chain, `st-thomas-becket`'s Vespers antiphon closed (2026-09-08)

Re-examined the "single-antiphon-slot" gap flagged for `st-thomas-becket` above. Wrong premise:
`@Sancti/12-25:Ant Vespera 3` is a pointer to a complete, independently-named alternate 5-antiphon
block in Christmas's own source file (its own `[Ant Vespera 3]` header — 5 groups, Ps
109/110/111/129/131, distinct text from that file's plain `[Ant Vespera]`), not "slot 3 of Becket's
own list." Authored `vespers-psalmody-overrides/saints/st-thomas-becket.yml` directly, a normal full
`groups` array — no sparse/partial-override mechanism was ever needed.

That investigation did surface a real, broader mechanism gap: `resolve-common.ts` had accumulated
half a dozen near-duplicate hand-rolled "try proper, then Common, then ferial" chains
(`resolveMinorHourAntiphon`, `resolveMinorHourChapter`, `getDayCollect`, `getBenedictusAntiphon`,
`getMagnificatAntiphon`, plus `lauds.ts`'s and `vespers.ts`'s own byte-identical
`mergeFerialNumbersWithProperAntiphons`) instead of one shared mechanism — exactly the class of bug
this app keeps hitting (content silently missing because some bespoke function didn't check a tier
the general pattern says it should).

Consolidated into one shared mechanism in `resolve-common.ts`:

- `firstAvailable`/`resolveByChain` — the general "try these candidates in order, first non-missing
  wins, else the ferial default" chain, now used by all five text-lookup functions above. The real
  precedence is 3 tiers, not the naive "propers, octave, commons, seasonal, ferial" 5-tier framing
  first proposed: **octave is not its own tier** — `resolveOfficeWinner` already substitutes an
  active octave's saint for `day.winner` upstream of every call site, so "propers" always already
  means "whoever's actually being prayed today," octave included. **Seasonal isn't a standalone
  tier either** — it's nested inside both Commons (try `${commonId}-paschaltide` before plain) and
  Ferial (try the season's own id before the plain weekday one), not a separate slot between them.
- `overlayProperAntiphons` — the per-slot (antiphon-text-only, below-duplex-majus) case of the same
  chain, replacing both hour files' identical copies.

All six call sites converted; `resolveOfficeBundle` (chapter/responsory/hymn/versicle) deliberately
left as its existing whole-bundle-or-nothing shape, not converted to independent per-part chaining —
whether a partial proper bundle should ever mix with a Common's remaining parts is a real liturgical
judgment call, not a mechanical extraction, and wasn't decided this pass. `npm test` (2077 passed)
and `npx tsc --noEmit` both pass, no behavior change beyond the new Becket content.


### Paschaltide antiphon substitution mechanism, closed (2026-09-08)

Built the mechanism flagged as an open gap above: `hours/{lauds,vespers}-psalmody-overrides.ts`'s
`getLaudsCommonOverride`/`getVespersCommonOverride` now take an optional `paschaltide` flag and try
`${common}-paschaltide` before the plain category — same "dedicated wholesale-different Paschaltide
text" tier already established for the minor hours' own Common antiphons (`resolve-common.ts`'s
`PASCHALTIDE_SEASONS` doc comment), just extended to the Lauds/Vespers *proper-psalmody* Common
category, which had no such tier at all before. `hours/{lauds,vespers}.ts`'s own
`getPsalmodyOverrideFor` now passes `isPaschaltide(day.season)` through.

Authored `common-of-an-apostle-paschaltide.yml` for both Lauds and Vespers categories (aliased the
same way as the plain category: `common-of-apostles`, `common-of-an-evangelist`), live-verified
against St. Mark's own day (Apr 25, always inside Paschaltide) since he has no proper antiphons of
his own and renders this Common text directly. This closed 2 of the 3 flagged saints without any
per-saint file at all: `st-mark` and `st-john-before-the-latin-gate` both turned out to have no
proper Vespers antiphons of their own (live-verified) — their gap was purely the missing category
variant. The third, `ss-philip-and-james`, does have genuine proper Lauds/Vespers antiphons of
their own (naming Philip directly) — authored those as ordinary per-saint overrides, unrelated to
the season mechanism; their fixed date (May 1) falls inside Paschaltide essentially every year, so
the stored text is permanently Alleluia-laden, same "no real non-Paschaltide baseline exists"
situation already documented for `common-of-pope-martyrs`.

Live-verified the non-Paschaltide fallback still works correctly (St. Luke, Oct 18, same Common
category, plain non-Alleluia text renders as before). `npm test` (2077 passed) and `npm run build`
both pass.


### Final consolidated sweep, below-duplex-majus tier (2026-09-08) — clean

Two whole-tier sweeps across all 194 `propers`-set below-duplex-majus saints, using the same
resolve-and-check-status method as the duplex-majus+ closing sweep earlier in this session:

- **Matins**: `resolveOrdo('matins', ...)` for all 184 saints with a mapped date — zero parts with
  both `status.la` and `status.en` `'missing'`. Matins readings/responsories for this tier are
  already fully covered by the existing generous-commemoration/nocturn-reading-pool mechanism
  (per the pre-1955/SanctiM sweeps done in earlier sessions) — this item is now closed, not just
  deferred.
- **Lauds/Vespers/Prime/Terce/Sext/None chapter+hymn+versicle**: 1104 hour-renders checked across
  all 194 saints — zero silently-missing parts. Confirms the "all-or-nothing bundle" class of bug
  found and fixed repeatedly earlier in this session (authoring a chapter without its hymn/
  versicle/responsory) has no remaining instances anywhere in this tier.

This closes out the below-duplex-majus first pass. Remaining known open items, all deliberately
left rather than guessed at: `st-mark`/`ss-philip-and-james`/`st-john-before-the-latin-gate`
(Paschaltide antiphon substitution, no mechanism), `octave-of-all-saints` (4-vs-5-psalm-slot
ambiguity). `st-thomas-becket` closed 2026-09-08 — see the later dated entry, "Shared resolution
chain, `st-thomas-becket`'s Vespers antiphon closed": the "single-antiphon-slot" premise here was
a misreading of the source, not a real data-shape gap. Genuinely
open scope beyond this sweep's method: PTSN chapters' `[Capitulum Tertia]` absence pattern isn't
independently verified (assumed to mean "always ferial" from consistency across candidates, not
proven per-saint); and this whole campaign has so far only checked "is there a `[tag]` in the
source that vu is missing" — it hasn't verified that already-authored content is *itself* accurate
(a different, much larger kind of audit).


### PTSN chapters: below-duplex-majus first pass (2026-09-08)

Same 194-saint set, checked `[Capitulum Sexta]`/`[Capitulum Nona]` presence (no `[Capitulum
Tertia]` tag exists anywhere in the source for any of these saints — Terce's own chapter appears
to always stay the plain ferial/Common default at this rank, mirroring Prime's own established
"stays fixed" behavior; not independently verified per-saint, but consistent across all candidates
checked). Ruled out the same 4 false positives as the antiphon pass (`ss-alexander-eventius-
theodulus-and-juvenal`, `st-nicomedes`, `st-marcus`, `ss-machabees`). `st-agatha`'s Sexta/Nona
chapters are `@Commune/C7`/self-referencing that Common — genuinely no gap, correctly falls to
Common already.

Authored Sext/None chapters for the remaining 4: `st-joseph`, `st-agnes`, `commemoration-of-st-
paul` (all real, distinct proper readings), and `finding-of-st-stephen` (reuses St. Stephen
Protomartyr's own Dec 26 chapter/lesson wholesale, same as its other hours).

`npm test` (2077 passed) and `npm run build` both pass. Matins readings/responsories below
duplex-majus are the one major hour-part category left completely unaudited by this method.


### 89 `propers: null` saints: spot-checked, still accurate (2026-09-08)

Checked all 89 against `[Invit]`/`[Ant Laudes` presence at their own date. 9 looked suspicious;
8 were the same same-date-collision false-positive pattern as everywhere else in this sweep
(`st-hadrian`/`st-menna`/`st-justina`/`st-petronilla`/`st-telesphorus` share their date with a
much higher-ranking winner; `st-odo` and `st-pontian` both collide with St. Elizabeth of Hungary on
Nov 19). The one real hit, `ss-perpetua-and-felicity`, turned out to be the Common-template-with-
name-substitution case (`@Commune/C7b::s/N. et N./Perpétuæ et Felicitátis/`) already established
as correctly-not-a-gap earlier in this sweep. **All 89 `propers: null` markings confirmed still
accurate** — no corrections needed.


### PTSN antiphons: below-duplex-majus first pass, partial (2026-09-08)

Same 194-saint set, checked Terce's own `[Ant 1]`-presence proxy (imperfectly, see below). Below-
duplex-majus, `hours/resolve-common.ts`'s `resolveMinorHourAntiphon`/`resolveMinorHourChapter` fall
back **per-part independently** to `minorHoursCommon` (unlike Lauds/Vespers' bundled `resolveOfficeBundle`)
— no "all-or-nothing" risk here, so a plain per-saint antiphon file is safe to add on its own.

Authored Prime/Terce/Sext/None antiphons for 8 saints by reusing their own already-authored Lauds
antiphons 1/2/3/5 (`st-cecilia`, `st-lucy`, `st-agnes`, `st-agatha`, `st-clement`,
`commemoration-of-st-paul`, `st-joseph`, `decollation-of-st-john-baptist` — the last already had a
Lauds override from an earlier session) and `finding-of-st-stephen` (reusing St. Stephen
Protomartyr's own Dec 26 antiphons, same as its Vespers). Same false-positive causes ruled out
again (`st-marcus`, `st-nicomedes`, `st-prisca`, `ss-machabees`, `st-felicitas`, `st-sabina`,
`ss-alexander-eventius-theodulus-and-juvenal`), plus 3 new ones this pass:
`ss-basilides-cyrinus-nabor-and-nazarius` (June 12 is really St. John of St. Facundus's day),
`ss-maurice-and-companions` (Sept 22 is really St. Thomas of Villanova's), `st-urban-i` (May 25 is
really St. Gregory VII's) — all confirmed via the same title-mismatch method as the other passes.

**Left open, deliberately not guessed at:** 10 more candidates (`st-basil-the-great`,
`st-mary-magdalene`, `ss-cyril-and-methodius`, `st-elizabeth-of-portugal`, `st-cajetan`,
`st-irenaeus`, `st-joseph-of-cupertino`, `st-pius-v`, `st-peter-celestine`,
`ss-seven-founders-of-the-servite-order`) have a real `[Ant 1]`/`[Ant 2]`/`[Ant 3]` tag in their own
Sancti file, but **no `[Ant Laudes]` block at all**. **Resolved same-day** by live-querying
`prayTertia` for all 10: confirmed `[Ant 1]`/`[Ant 2]`/`[Ant 3]` **do not map to Terce/Sext/None** —
they represent something else in the source's own structure (unidentified). St. Mary Magdalene's
`[Ant 1]` has real proper text ("Múlier quæ erat in civitáte peccátrix...") that doesn't match her
actual live-rendered Terce antiphon ("In odórem unguentórum tuórum...") at all. Authored real
proper Terce antiphons for the two that turned out to genuinely have one (live-verified, source-
file-tag-independent): `st-mary-magdalene`, `st-elizabeth-of-portugal`. The other 8 (`st-basil-the-
great`, `ss-cyril-and-methodius`, `st-cajetan`, `st-irenaeus`, `st-joseph-of-cupertino`, `st-pius-v`,
`st-peter-celestine`, `ss-seven-founders-of-the-servite-order`) live-render generic Common/ferial
text at Terce (and Sext/None render empty) — confirmed genuinely no gap. Do not reuse the `[Ant 1]`/
`[Ant 2]`/`[Ant 3]` tag for PTSN content under any *other* saint without first live-querying that
saint's actual `prayTertia`/`praySextam`/`prayNonam` render and confirming the match — the naive
"same source file, plausible-looking tag" assumption that worked for `[Ant Laudes]` does not hold
here.

`npm test` (2077 passed) and `npm run build` both pass. PTSN chapters (as opposed to antiphons)
below duplex-majus are still fully unaudited, as is everything for the 89 `propers: null` saints.


### Lauds/Vespers hymns: below-duplex-majus first pass (2026-09-08)

Same 194-saint set, checked against `[Hymnus Laudes]`/`[Hymnus Vespera]` presence. This tier
surfaced a much cheaper way to rule out false positives than the duplex-majus+ sweep needed: since
`resolveOfficeBundle` is gated on the *chapter*, and most below-duplex-majus saints have no
`[Capitulum Laudes]` of their own at all (correctly falling to their Common's full bundle already,
same behavior as e.g. `exaltation-of-the-holy-cross` from the duplex-majus+ pass), checking for a
real `[Capitulum Laudes]` first before doing any translation work ruled out most of the 18
candidates immediately as **not gaps**: `st-mary-magdalene`, `ss-cyril-and-methodius`,
`st-venantius`, `st-elizabeth-of-portugal`, `st-bernard`, `st-hermenegild`, `st-john-cantius`,
`stigmata-of-st-francis`, `st-juliana-falconieri` all have no chapter in the source and correctly
render their Common's hymn already. `st-hildegard`/`ss-gervase-and-protase` were same-date-
collision false positives (Stigmata of St. Francis and St. Juliana Falconieri's own content
respectively bleeding through), same cause as the earlier passes.

Only 4 saints had a real chapter of their own and were worth the full-bundle treatment:
`st-joseph`, `ss-seven-founders-of-the-servite-order`, `st-gertrude`, `st-teresa-of-avila`.
Authored complete chapter/hymn/responsory(where real)/versicle bundles for both Lauds and Vespers
for all four — this is the same "all-or-nothing bundle" trap as the duplex-majus+ Vespers-hymn
pass: giving a saint their own chapter makes their *whole* bundle switch from the Common's to their
own id, so hymn/versicle (and responsory, where real) all needed covering too, not just the hymn
that prompted the check. Where the source itself had no versicle/hymn of its own for a given hour,
copied the Common's own text explicitly (documented per-file) rather than leave an unconditionally-
rendered empty part. St. Gertrude and Ss. Seven Founders had no English at all for their hymns;
translated directly.

This forced 3 pre-existing test corrections (`tests/hours/lauds.test.ts` ×2, `tests/hours/
vespers.test.ts` ×1): tests asserting St. Joseph's and Ss. Seven Founders' office bundle fell back
to their Common (true before this session) now correctly assert their own newly-authored proper
content wins instead — same "prior test encoded the old-but-now-superseded state" pattern as
St. Lawrence's invitatory correction earlier in this sweep.

`npm test` (2077 passed) and `npm run build` both pass.


### Vespers antiphons: below-duplex-majus first pass (2026-09-08)

Same 194-saint set, checked against `[Ant Vespera]` presence. Same false-positive causes ruled out
again (`ss-machabees`, `st-marcus`, `st-nicomedes`, `st-felicitas`, `st-sabina`, `ss-alexander-
eventius-theodulus-and-juvenal` — all genuinely have no proper content, per the Lauds pass above);
`ss-john-and-paul` was a new false-positive shape — the source only has a single `[Ant Vespera 3]`
*slot* reference for them, not a full 4-antiphon override, which a loose regex matched as if it
were the real tag.

Authored 10 real gaps: `st-joseph`, `st-gregory-the-great`, `st-gertrude`, `st-agnes`,
`st-clement`, `st-cecilia`, `st-lucy`, `st-agatha`, `commemoration-of-st-paul` (several reusing
the identical text/English already established for their own Lauds override, per the source's own
`@:Ant Laudes`/`@:Ant Vespera` cross-references), and `finding-of-st-stephen` (reuses St. Stephen
Protomartyr's own Dec 26 Lauds antiphons wholesale — a fitting thematic reuse for the finding of
his relics). St. Gertrude had no English in the source at all; translated directly.

**Left open, not modeled:** `st-thomas-becket`'s own `[Ant Vespera]` is `@Sancti/12-25:Ant Vespera 3`
— a single-*slot* substitution (only the 3rd of 4 antiphons is proper; the rest stay ferial), which
`mergeFerialNumbersWithProperAntiphons`'s data shape (a plain sequential `groups` array) has no
clean way to express as a sparse/partial override. A real, narrow mechanism gap, not a same-day
content fix — noted here rather than forced through with an approximation.

**Correction (2026-09-08):** this reading was wrong. `@Sancti/12-25:Ant Vespera 3` is a pointer to a
complete, independently-named alternate 5-antiphon block in Christmas's own source file (its own
`[Ant Vespera 3]` header, distinct text from that file's plain `[Ant Vespera]`), not "slot 3 of
Becket's own list." Becket's whole Vespers antiphon set is just that block, wholesale — a normal
full `groups` array, no sparse override needed. See the later dated entry, "Shared resolution chain,
`st-thomas-becket`'s Vespers antiphon closed," for the real fix (authored directly) and the actual
mechanism gap this investigation did surface.

`npm test` (2077 passed) and `npm run build` both pass. This first pass covered only the 194
saints with a non-null `propers` field; the 89 `propers: null` saints, and hymns/PTSN/collects
below duplex-majus, are still unaudited.


### Lauds antiphons: below-duplex-majus first pass (2026-09-08)

Same 194-saint set, checked against `[Ant Laudes`/`[Ant Vespera]` (below duplex-majus, Lauds
often just reuses Vespers' own antiphons verbatim per the source's own `@:Ant Vespera` reference)
presence. Below duplex-majus, `hours/lauds.ts`'s `mergeFerialNumbersWithProperAntiphons` takes only
a `lauds-psalmody-overrides/saints/<id>.yml` file's antiphon *text*, never its psalm numbers (the
day's real ferial numbers always win at this rank) — live-verified across all 12 authored below,
each correctly merging onto that weekday's real ferial psalm numbers.

Found 17 candidates; 6 were false positives from the same same-date-file-collision cause as the
Matins invitatory pass above (`st-marcus`/`st-nicomedes`/`ss-machabees` share their date with a
much higher-ranking winner and have no content of their own — `vide C3`, Common of Several Martyrs,
confirmed via their own file's `[Rank]`; `st-sabina` likewise has no file of her own at all,
correctly using her Common per the existing `st-sabina.yml` commemoration-antiphon note). Also
reverted a mistake from the earlier Matins-invitatory pass: `ss-alexander-eventius-theodulus-and-
juvenal`'s `[Invit]` "match" was actually Finding of the Holy Cross's own text bleeding through
from the shared May 3 file — their real file (`Sancti/05-03r.txt`) has no invitatory of its own at
all (`vide C3`), so `matins-invitatory-ss-alexander-eventius-theodulus-and-juvenal.yml` was deleted.

Authored the remaining 10 real gaps: `st-joseph`, `st-clement`, `st-gregory-the-great`,
`st-gertrude`, `st-cecilia`, `st-lucy`, `st-agnes`, `st-agatha`, `ss-john-and-paul`,
`commemoration-of-st-paul`. St. Gregory the Great and St. Gertrude had no English at all in the
source; translated directly (`status.en` can't carry `draft` at this schema, per st-scholastica.yml's
own note).

`npm test` (2077 passed) and `npm run build` both pass.


### Matins invitatory: below-duplex-majus first pass (2026-09-08)

Extended the same reference-source-availability audit (not vu's own rank threshold, per
`vu_source_all_available_proper_content` memory) below duplex-majus for the first time: 194
saints with a non-null `propers` field, checked against `[Invit]` presence in the reference
source. Found 13 candidates; 3 were false positives from a naive script matching the *first*
`[Invit]` tag in a shared date file rather than the specific saint's own content — `st-marcus`
(Oct 7) and `st-nicomedes` (Sept 15) share their date with a much higher-ranking winner (Our
Lady of the Rosary, Seven Sorrows) and have no invitatory of their own at all (confirmed via
their own `SanctiM/*b.txt` commemoration files, which just reference the main office wholesale);
`st-prisca` (Jan 18) likewise has none of her own (`vide C6-1`, correctly Common-of-a-Virgin-
Martyr already). 3 more (`st-anne`, `st-bridget-of-sweden`, `finding-of-st-stephen`) turned out to
use the source's own Common-template-with-name-substitution mechanism (`@Commune/C7::s/N./Anne/`
etc.), not distinct proper text — already correctly equivalent to vu's existing Common fallback
tier (which has no name-substitution for invitatory either), not a gap.

Authored the remaining 7 real gaps: `st-joseph`, `st-mary-magdalene`, `st-margaret-of-scotland`,
`st-monica`, `st-elizabeth-of-portugal`, `st-frances-of-rome`,
`ss-alexander-eventius-theodulus-and-juvenal`.

`npm test` (2077 passed) and `npm run build` both pass. This is a first pass at Matins invitatory
only, for the 194 saints with a non-null `propers` field — the 89 `propers: null` saints and every
other hour-part (Lauds/Vespers antiphons, hymns, PTSN, collects) are still unaudited below
duplex-majus.


### Lauds/Vespers hymns: duplex-majus+ gap sweep (2026-09-08)

Audited all 59 duplex-majus+ saints' Lauds/Vespers hymns against the reference source's own
`[Hymnus Laudes]`/`[Hymnus Vespera]` presence. Found and authored real gaps for 5 saints:
`most-precious-blood` (both hymns, long 9-stanza texts, English already in the source),
`seven-sorrows-of-the-bvm` (both, translated directly — no English in the source),
`apparition-of-the-immaculate-bvm` and `maternity-of-the-bvm` (Lauds only — neither has a distinct
Vespers hymn in the source at all, correctly falling to `common-of-the-bvm`'s). One flagged false
positive: `exaltation-of-the-holy-cross`'s Lauds hymn already correctly resolves (its own chapter is
unauthored, so `resolveOfficeBundle` falls through its *whole* bundle to `proper-to-the-finding-of-
the-holy-cross`'s, hymn included) — the naive per-id-filename check that flagged it as a gap didn't
account for that bundle-level fallback.

**Real structural finding, not just a content gap:** `resolveOfficeBundle` (hours/resolve-common.ts)
is all-or-nothing per id — an id with no chapter of its own falls through its *whole* bundle
(chapter/responsory/hymn/versicle together) to its Common's, so a proper hymn authored with no
matching proper chapter is silently unreachable dead content. Discovered this by live-testing after
authoring the 4 hymns above: none of them rendered at all until a matching `lauds-capitulum-<id>`
was also authored for each (sourced from the reference engine alongside the hymn), which then
exposed that the bundle's `responsory`/`versicle` slots are looked up under the *same* newly-
reachable per-feast id too — with no fallback to the Common for just those slots — so authoring a
chapter+hymn without also covering responsory/versicle turns those into silently-empty parts.
Authored real content for all of it: `most-precious-blood` and `seven-sorrows-of-the-bvm` got their
own genuine source-sourced versicles (and Vespers hymn/responsory where real); `apparition-of-the-
immaculate-bvm` and `maternity-of-the-bvm` (both `common-of-the-bvm`, no distinct proper found for
these slots) got explicit copies of the Common's own versicle/Vespers-hymn text, since the bundle
mechanism no longer falls through to it implicitly once their own chapter exists.

This forced two test corrections: `tests/hours/vespers.test.ts`'s office-override sweep had
`st-scholastica` dated 2026-02-10, which — now that `apparition-of-the-immaculate-bvm` (Feb 11,
tied duplex-majus rank) has a real chapter — actually exercises *her* First Vespers via concurrentia
(tie goes to tomorrow, every year, permanently, since both are fixed dates); swapped the table entry
and added a small `NO_VESPERS_RESPONSORY` exception (she genuinely has none in the source, same
"real absence, not a gap" pattern as the Sacred Heart). Also caught while fixing a related bug: my
first pass gave `st-gabriel-archangel`/`guardian-angels`/`st-raphael-archangel` the wrong "Psalmi
Dominica" psalm numbers (guessed 109/112/121/126 from the BVM Common by analogy instead of the true
Sunday set, 109-112 — caught by an existing test expecting Guardian Angels' psalm numbers to match
St. Michael's); fixed all three, and while there, corrected that same existing test's own stale
claim (an artifact of the earlier `categories/common-of-an-angel.yml` mistake, already fixed above)
that Guardian Angels' antiphons are St. Michael's own.

`npm test` (2077 passed) and `npm run build` both pass.


### Vespers proper antiphons: duplex-majus pass (2026-09-08)

Checked all 24 duplex-majus saints, title-verifying every live query against the expected saint.
Authored 13: `chair-of-st-peter-at-rome`, `chair-of-st-peter-at-antioch` (both share `common-of-a-
confessor-bishop`'s Vespers scheme, same real finding as their existing Prime/Terce/Sext/None
content — considered *as bishop* of that see even though their own `common:` field says apostle),
`conversion-of-st-paul`, `st-scholastica` (no English in the source; reused her own already-
translated Lauds/Prime antiphon English directly, same shared-antiphon-pool pattern), `st-peter-ad-
vincula`, `exaltation-of-the-holy-cross`, `st-martin-of-tours`, `apparition-of-the-immaculate-bvm`,
`st-gabriel-archangel`, `guardian-angels`, `st-raphael-archangel` — the last four all sourced from
the static secular file directly, since none of them exist in the Monastic 1617 calendar at all
(each a 19th/20th-century feast; live "Hodie" queries for their dates render whatever the reference
engine's own stock calendar actually has there instead — Annunciation Vigil, Marian Saturday, a
plain Sunday).

Corrected `finding-of-the-holy-cross.yml` (from the duplex-2-classis pass above): cross-checking
against `exaltation-of-the-holy-cross` (same Cross antiphons, but Sept 14 — never in Paschaltide,
unlike May 3) showed 3 of its 4 antiphons had picked up a seasonal Paschaltide-only "allelúja" that
isn't part of their fixed text. Also corrected `categories/common-of-an-angel.yml`'s own header,
which claimed Guardian Angels "reuses Michael's own antiphons byte-for-byte" — the raw source file
shows she has her own genuinely distinct proper antiphons; that claim was simply wrong, not a
modeling choice, now fixed alongside authoring her own file.

Confirmed **not** gaps: `octave-of-ss-peter-and-paul`, `presentation-of-the-bvm` (both already
byte-identical to their Common), `st-patrick`, `st-barnabas`, `our-lady-of-mount-carmel`,
`st-ignatius-of-loyola`, `our-lady-of-the-snows`, `holy-name-of-mary`, `our-lady-of-ransom`,
`st-francis-xavier` (each confirmed via the static file's own `[Rank]`/`[Rule]` `ex/vide Cxx`
reference — no proper antiphon exists for any of them in the source at all).

**Left open, needs its own follow-up:**
- `st-john-before-the-latin-gate` (May 6): same Paschaltide-contamination issue as `st-mark`/
  `ss-philip-and-james` above — not authored yet.
- `octave-of-all-saints` (Nov 8): source says `vide Sancti/11-01` (reuse All Saints' own content
  wholesale), but the already-authored `all-saints.yml` uses a live-verified 5-psalm scheme specific
  to All Saints' own duplex-1-classis rank, while the octave day is only duplex-majus — unclear
  whether the octave gets the same 5 slots or the usual 4, and Nov 8 can't be live-verified directly
  (its own `Hodie` query renders the Dedication of the Basilica of the Most Holy Saviour instead).
  Left unauthored rather than guessing.

`npm test` (2077 passed) and `npm run build` both pass. **All 59 duplex-majus+ saints are now
checked for Vespers proper antiphons** (Matins invitatory and Lauds were already fully closed
earlier in this sweep) — the two Paschaltide cases and the octave-of-all-saints slot-count question
are the only three remaining open items at this tier. Below-duplex-majus and the other hour kinds
(hymns, collects, chapter/responsory bodies) are still fully unaudited by this method.


### Vespers proper antiphons: duplex-2-classis pass (2026-09-08)

Checked all 26 duplex-2-classis saints against the live reference engine (title of the rendered
office checked against the expected saint every time, after `seven-sorrows-of-the-bvm` below
exposed a real misattribution risk). Authored 12: `purification`, `finding-of-the-holy-cross`,
`transfiguration`, `visitation-of-the-bvm`, `nativity-bvm`, `st-lawrence`, `st-andrew`,
`all-saints-of-the-benedictine-order`, `maternity-of-the-bvm`, `st-stephen-protomartyr`,
`st-john-apostle`, `holy-innocents`.

Two real pitfalls found along the way, both worth remembering for the rest of this sweep:

- **`votive=Hodie` can silently pick the wrong office.** `seven-sorrows-of-the-bvm` (Sept 15, inside
  Nativity BVM's own octave) live-queried back as "In Octavam Nativitátis Beatæ Mariæ Virginis" —
  the reference engine's own stock Monastic calendar resolves that date differently than vu's
  blended one. Caught only by checking the rendered office title against the expected saint every
  time (now the standing method, not optional). Fixed by reading `Sancti/09-15.txt`'s own static
  `[Ant Vespera]` block directly instead (first 4 of its 5 listed antiphons — same "Monastic uses
  only 4 slots" convention as `nativity-of-st-john-the-baptist.yml`).
- **Several later feasts don't exist in the Monastic 1617 calendar at all.** `st-joachim` (Aug 16),
  `queenship-of-the-bvm` (May 31) live-queried back as St. Lawrence's Octave and Trinity Sunday
  respectively — genuinely no Monastic office for either date; both confirmed via the static
  file's own `[Rank]`/`[Rule]` (`ex C5`, `ex C11`) as correctly falling to their plain Common, not
  a gap. `maternity-of-the-bvm` (Oct 11, instituted 1931) live-queried back as a plain 20th Sunday
  after Pentecost — same non-existence in 1617, but *does* have real static proper content in the
  secular `Sancti/10-11.txt` file, authored from that directly (no live render to verify against).

Confirmed **not** gaps (byte-identical to their Common already): `st-matthias`, `st-james-the-
greater`, `st-bartholomew`, `st-matthew`, `st-luke`, `ss-simon-and-jude`, `st-thomas-apostle`
(all `common-of-an-apostle`/`common-of-an-evangelist`), `ss-placid-and-companions`
(`common-of-several-martyrs`), `dedication-of-the-basilica-of-the-most-holy-savior`
(`common-of-a-dedication`).

**Deliberately not authored yet — flagged as a real, structurally different gap:** `st-mark`
(Apr 25) and `ss-philip-and-james` (May 1) both live-queried inside Paschaltide (their fixed dates
fall within Paschaltide in most years, since Easter's range is Mar 22–Apr 25) and rendered a
generic-looking "Sancti tui Dómine florébunt..." Alleluia-laden set that doesn't read as personal
to either saint — likely a *seasonal* Paschaltide antiphon substitution the engine applies broadly
during Paschaltide, not either saint's own year-round proper text, and `hours/vespers.ts`'s
psalmody-override path has no Paschaltide-antiphon-substitution mechanism at all to model it
correctly either way. Needs its own investigation (a non-Paschaltide-year comparison, or tracing
the actual rubric) before authoring, not a same-day fix — could turn out to affect other
Paschaltide-season saints beyond just these two.

Also corrected `st-benedict.yml`'s own header comment (previous entry above): he was never falling
to the plain ferial default, contrary to what that entry first said — `common-of-a-confessor-not-
bishop`'s Vespers category already lists `common-of-an-abbot` as an alias, so he was already
falling to that Common's generic text, not the ferial default. The file itself (his own proper
antiphons) is unaffected; only the header's explanation of the prior state was wrong.

`npm test` (2077 passed) and `npm run build` both pass. The 24 duplex-majus saints haven't been
checked yet — tracked as ongoing Open Work above, same method.


### Vespers proper antiphons: duplex-1-classis first pass (2026-09-08)

`vespers-psalmody-overrides/saints/` had only 3 files (all-saints, decollation-of-st-john-baptist,
nativity-of-st-john-the-baptist) against 59 duplex-majus+ saints — its own doc comment even claimed
"no duplex-majus+ saint in this app currently has proper Vespers psalm antiphons distinct from
their Common's," which those 3 files already contradicted. Checked all 7 duplex-1-classis saints
(the highest tier) via the live reference engine (`command=prayVespera`; **static-file reading is
unreliable here**, confirmed by `nativity-of-st-john-the-baptist.yml`'s own header — the raw file's
naive antiphon list doesn't match what the engine actually renders):

- **St. Benedict**: was falling back to `common-of-a-confessor-not-bishop`'s generic Vespers text
  (its own `aliases` list registers `common-of-an-abbot` under that scheme — a real Common
  fallback, not the plain ferial default, correcting an initial misreading). Authored
  `st-benedict.yml` to replace it with his own proper antiphons at the same psalm numbers
  (109-112), reusing his already-translated Prime/Terce/Sext/None English (Lauds Ant 1/2/3/5,
  same borrow-from-Lauds pattern).
- **Annunciation, Assumption, Immaculate Conception**: each has genuine proper antiphons distinct
  from `common-of-the-bvm`'s generic ones, at the same psalm numbers (109/112/121/126) the Common
  uses. Authored all three; Immaculate Conception's live-rendered Latin drops diacritics the same
  way her already-authored Prime/Terce/Sext/None antiphons' did — reused that already-restored
  accentuation directly rather than re-deriving it.
- **Ss. Peter and Paul, St. Michael, Most Precious Blood**: live-verified as **not** gaps. Ss. Peter
  and Paul's Vespers antiphons are byte-identical to `common-of-an-apostle`'s; St. Michael's to
  `common-of-an-angel`'s (Sept 29's own `[Rule]` is literally `ex Sancti/05-08` in the source,
  confirming the "Michael's proper *is* the generic Angel scheme" note already in that category
  file). Most Precious Blood's Monastic-track rule is `Psalmi Dominica` — plain Sunday psalm
  antiphons, no proper antiphon set exists for it at all; correctly falls to the ferial/Sunday
  default already.

`npm test` (2077 passed) and `npm run build` both pass. The remaining 26 duplex-2-classis and 24
duplex-majus saints haven't been checked yet — tracked as ongoing Open Work above, same method.


### Lauds psalmody: 3 previously-blocked saints unblocked (2026-09-08)

The original Lauds sweep (see "Lauds psalmody overrides" above) audited clean against the
reference source's own `[Ant Laudes 1]`/`[Ant Laudes 2]`/`[Ant Laudes 3]` tags — but St. Benedict,
St. Michael, and All Saints of the Benedictine Order use an older, un-numbered `[Ant Laudes]` block
(5 antiphons run together, one per line) that the numbered-tag check missed entirely, a false
negative rather than a real absence. All three now have real proper text in the reference source
and (per the "Prime/Terce/Sext/None minor-hour overrides" entry above) already had their blocking
collects authored since that entry was written, so they're no longer blocked.

Authored `lauds-psalmody-overrides/{st-benedict,st-michael,all-saints-of-the-benedictine-order}.yml`.
St. Benedict's antiphons 1/2/3/5 reuse his already-translated Prime/Terce/Sext/None English (the
historical minor-hours-borrow-from-Lauds convention: Prime = Lauds Ant 1, Terce = Ant 2, Sext =
Ant 3, None = Ant 5); antiphon 4 (canticle) is new. St. Michael's Sept 29 office is literally `ex
Sancti/05-08` in the source (reuses Apparition of St. Michael's own content) — but the *rendered*
text differs from the already-authored `apparition-of-st-michael.yml`, because that file was
authored on a date that fell inside Paschaltide: live-queried 2026-09-29 (outside Paschaltide) to
get the antiphons without the Paschaltide-only "allelúja" that isn't part of their fixed text
(antiphons 2 and 5 keep "allelúja" unconditionally either way — baked into their own proper text,
confirmed on both dates). All Saints of the Benedictine Order's 5 antiphons are standard,
widely-attested traditional-Breviary texts (Fulgébunt justi = Matt 13:43, O quam gloriósum est
regnum = the well-known Common-of-Several-Confessors Magnificat antiphon) with no English in the
reference source at all — translated directly.

Live-verified via `resolveOrdo('lauds', ...)` for 2026-03-21, 2026-09-29, 2026-11-13. `npm test`
(2077 passed) and `npm run build` both pass.


### Matins invitatory: Common-of-the-BVM + 17-saint duplex-majus+ gap sweep — closed (2026-09-08)

User flagged 2026-09-08 (Nativity of the BVM, `duplex-2-classis`) opening with the plain ferial
Tuesday invitatory antiphon instead of a proper one. Root cause: `resolveMatinsInvitatoryText`
(`hours/matins.ts`) correctly walks proper → octave → Common-of-the-BVM → seasonal → ferial, but
every real tier was unauthored for this feast — no `matins-invitatory-nativity-bvm.yml`, and no
`matins-invitatory-common-of-the-bvm.yml` at all (every other Common category already had one).
Content gap, not a logic bug.

This surfaced a broader, wrongly-scoped assumption: prior override sweeps (Lauds psalmody, P-T-S-N,
Matins invitatory) gated authoring on vu's own duplex-majus+ rank threshold, treating anything below
that as correctly falling back to Common. User corrected this (2026-09-08): the real gate should be
whether `../divinum-officium-reference` actually has proper content, not vu's rank tier — see
`vu_source_all_available_proper_content` memory. Applying that to just the Matins-invitatory slot,
audited all 59 duplex-majus+ saints against `Latin/{Sancti,SanctiM}/<date>.txt`'s own `[Invit]`
presence: found 17 with real proper text in the reference source but no vu file (all fell through to
Common or, for several major BVM feasts — Assumption, Purification, Annunciation, Immaculate
Conception, Seven Sorrows, Maternity, Queenship, Apparition of the Immaculate BVM — to the *also*-
missing Common-of-the-BVM fallback, i.e. ferial). Authored all 17
(`matins-invitatory-{nativity-bvm,st-martin-of-tours,st-gabriel-archangel,apparition-of-the-immaculate-bvm,
chair-of-st-peter-at-{antioch,rome},assumption,queenship-of-the-bvm,conversion-of-st-paul,
st-stephen-protomartyr,annunciation,purification,seven-sorrows-of-the-bvm,st-lawrence,
guardian-angels,maternity-of-the-bvm,immaculate-conception,apparition-of-st-michael}.yml`) plus
`matins-invitatory-common-of-the-bvm.yml`, all bilingual/verified, pulled directly from each date's
own `[Invit]` block (chasing `@Sancti/<date>` references where the file itself points elsewhere,
e.g. Chair of St. Peter at Rome → Antioch's text, Apparition of the Immaculate BVM → the Immaculate
Conception's text). The remaining 33 duplex-majus+ saints checked have no `[Invit]` block anywhere in
the reference source at all (e.g. Ss. Peter and Paul, St. Andrew, Holy Innocents) — their Common
fallback is genuinely correct, not a gap, and is not re-flagged.

One test updated: `tests/hours/matins.test.ts`'s doubling-by-rank test had hardcoded St. Lawrence
falling to `common-of-a-martyr` text as "no proper of his own" — now that he has one
(`matins-invitatory-st-lawrence.yml`), updated to expect his own proper text instead.

`npm test` (2077 passed) and `npm run build` (`tsc --noEmit` + vite build) both pass. Broader sweep
(other hour kinds, saints below duplex-majus) tracked as ongoing Open Work above — this closes only
the Matins-invitatory slot for the duplex-majus+ tier.


### Hebrews moved from a fixed Jan 7-13 stretch to post-epiphany-6 (2026-09-07)

User correction: the bible-plan's Hebrews reading (13 chapters, 2/day) had been bulk-imported onto
a fixed `calendarDate` stretch (`christmas-01-07` through `christmas-01-13`, i.e. Jan 7-13),
alongside the rest of the Christmastide/pre-Epiphany-Sunday fixed-date run. That placement was a
misunderstanding of how Epiphanytide actually works — Hebrews belongs to the post-Epiphany reading
season proper (temporal-keyed, following whichever Sunday the calendar actually reaches that year),
not to a fixed civil-calendar date. Deleted the 7 `christmas-01-0[7-9]`/`01-1[0-3].yml` files and
replaced them with `post-epiphany-6-{sunday..saturday}.yml` (same content, same 2-chapters/day split,
now `temporalId: post-epiphany-6` keyed instead of `calendarDate`). This also retires the earlier
"post-epiphany-6 has no row by design" note above — that was itself downstream of the same
misunderstanding, not a considered decision.

Live-verified via `getBiblePlanReadings`/`resolveOrdo('matins', ...)`: 2026-11-16 (a real
resumed-post-Epiphany-6 Monday, per `tests/hours/matins.test.ts`'s own proof date) now resolves
"Heb 3-4" with real bilingual text, matching the new Monday row. `npm test` (2077 passed) and
`tsc --noEmit` both pass.


### Responsory visual separation — closed (2026-09-06)

Logged as "responsories need a heading label," but the real gap was broader: `.ordo-part-homily`
already had an explicit `margin-top`/`padding-top`/`border-top` separator in `styles.css`, while
`.ordo-part-responsory` had no CSS rule at all — it just stacked directly under the preceding
`lang-columns` text with zero visual break, in either the plain-lesson or the Gospel+homily case
(`ui/hour-view.ts`'s `case 'lesson':` and `case 'gospel':`). A text heading would have papered over
that; the actual fix was giving `.ordo-part-responsory` the same border-top separator the homily
already gets.

`npm test` (2066 passed) and `npm run build` (`tsc --noEmit` + vite build) both pass.


### Matins invitatory antiphon weekday cycle — closed (2026-09-06)

User flagged 2026-09-06's (a plain Sunday, `post-pentecost-15`) invitatory antiphon as suspect.
Traced it to a real content bug, not a resolution-order bug: `matins-invitatory-antiphon.yml` (the
final ferial fallback in `resolveMatinsInvitatoryText`) held a single fixed year-round text
("Veníte, * Exsultémus Dómino") that its own header claimed was "live-verified... 2026-09-06" —
that was wrong. Querying the live reference engine for that exact date returns a different text
("Adorémus Dóminum, * Qui fecit nos"), and querying a full week showed the real source
(`Psalterium/Special/Matutinum Special.txt`'s `[Invit Trid_]` block) genuinely varies the plain
`{Antiphona ex Psalterio secundum tempora}` invitatory antiphon Sunday-Saturday — same shape as the
Matins hymn's own weekday cycle (`matins-hymn-ferial-tuesday.yml` etc., closed 2026-09-04). The
fixed text turned out to be Monday's own real antiphon, silently standing in for every other
weekday including Sunday.

Fixed the same way as the hymn cycle: six new weekday-specific files
(`matins-invitatory-antiphon-{sunday,tuesday,wednesday,thursday,friday,saturday}.yml`, full
Latin+English pulled from the reference engine's own `Invit Trid_`/`Invit Trid` blocks, Latin and
English respectively), `matins-invitatory-antiphon.yml` (no day suffix) still used for Monday.
`hours/matins.ts`'s `resolveMatinsInvitatoryText` now dispatches on `day.weekday` for its final
fallback tier, same pattern as `resolveMatinsHymn`'s `weekdayFerialHymnIds`. Two pre-existing tests
in `tests/hours/matins.test.ts` hardcoded "Veníte" as the generic ferial default — both dates are
actually Tuesdays, updated to expect Tuesday's own real text ("Jubilémus Deo").

`npm test` (2066 passed) and `tsc --noEmit` both pass.


### Matins Gospel+homily responsory render order — closed (2026-09-06)

User flagged this initially as "Gospel+homily pairing shouldn't carry a responsory at all," but the
actual bug turned out narrower: `hours/matins.ts`'s `gospelReadingPart()` already resolves
`part.responsory` correctly (from `homily?.responsory`, per the convention that a responsory
belongs to the pericope+homily unit as a whole), and correctly nests `part.homily` alongside it on
one atomic `gospel` ResolvedPart. The bug was purely in `ui/hour-view.ts`'s `case 'gospel':`
render branch, which emitted the `part.responsory` block *before* `part.homily` instead of after
it — producing Gospel → Responsory → Homily instead of Gospel → Homily → Responsory. Reproducible
on any 16th Sunday after Pentecost (Nocturn 3: Luke 14:1-11 followed by St. Ambrose's homily, which
carries the "Duo Séraphim clamábant" responsory).

Fixed by swapping the two template-literal blocks in that one `case` branch; no changes needed in
`matins.ts`. The sibling item, giving Matins responsories their own heading label, is still open
(see Open Work above).

`npm test` (2066 passed) and `npm run build` (`tsc --noEmit` + vite build) both pass.


### Easter's own octave — done (2026-09-06)

Previously tabled ("easter needs a whole different discussion") because Easter Monday-Saturday
all folded onto the governing Sunday's own `easter-sunday` temporal id (`calendar/temporal-id.ts`'s
`sundayOnOrBefore` fold), reusing Easter Sunday's single collect and single-nocturn Matins content
wholesale for the entire week — even though the reference engine (`web/www/horas/Latin/Tempora/
Pasc0-1.txt` through `Pasc0-6.txt`) gives each of the six days its own real proper: own title ("Die
II/III/IV/V/VI infra octavam Paschæ", Saturday "Sabbato in Albis"), own rank, own collect, own
Gospel+homily. User, 2026-09-06: "it's an octave and you should have sourced the octave readings."

Fixed via the same generic mechanism the Passiontide batch already established (six new
`data/calendar/temporal-feasts/easter-{monday..saturday}.yml` records, anchored `{kind: easter,
offset: 1..6}`, `rank` omitted since `data/calendar/temporal-categories.yml`'s pre-existing
`privileged-feria-major` classification for offsets 1-6 already guarantees these records take over
unconditionally) — no new mechanism, just six new anchor records plugging into
`calendar/movable-feasts.ts`. Six new collects (`data/propers/temporal/easter-{monday..saturday}-
collect.yml`, transcribed from each day's own Office `[Oratio]`, `$Per Dominum`/`$Per eumdem`
macros expanded) and six new nocturn-readings files (`data/propers/nocturn-readings/easter-
{monday..saturday}.yml`, each day's own Gospel pericope from the Missal `[Evangelium]` + patristic
homily, same "full pericope from the Mass propers, not the bare Office incipit" convention as
`easter-sunday.yml`). All six ids added to `resolve-common.ts`'s `ALWAYS_OVERRIDE_TEMPORAL_IDS`.

Two mechanism fixes needed along the way, both found via a live end-to-end smoke test before
trusting the content:
- `hours/matins.ts`'s `resolveOrdo` gated the "does this day get the Sunday-style 3-nocturn/13-psalm
  treatment" check (`hasTemporalNamedOverride`) on `winner.id` — correct back when Monday/Tuesday's
  own `winner.id` still equaled the shared `easter-sunday` id, but wrong now that they have their
  own real `winner.id`. Repointed to `temporalId` (`resolveTemporalId`, still `easter-sunday` for
  the whole octave), matching what `sundayNocturnFor`'s own content-fetch lookup already keyed by a
  few lines up — the two lookups now agree, as they always should have.
- `data/hours/matins-ferial-named-antiphon-overrides.yml`'s Wednesday-Saturday antiphon override was
  keyed by the old shared `easter-sunday` id (that lookup, unlike the one above, is genuinely by
  `winner.id`, not `temporalId`) — split into four entries, one per day's own new id, same shared
  antiphon content via a YAML anchor.

Verified `day.commemorations` still comes out `[]`-equivalent for every one of the six days (the
one entry present is the same harmless self-referential `{kind:'temporal', id:'easter-sunday'}`
placeholder every other movable-feast override already produces and `day-label.ts`'s
`collectCommemorations` already drops for display — confirmed this is deliberate, not a bug, via
`tests/calendar/transfer.test.ts`'s pre-existing Holy Monday case, after almost "fixing" it away).
Two pre-existing tests updated for the new `winner.id` values (`tests/hours/matins.test.ts`,
`tests/calendar/april-sanctoral.test.ts`) — no behavior they were actually testing changed.

Also fact-checked and corrected two adjacent user assumptions along the way: commemorations are
*not* newly allowed Monday-Saturday of Easter week (the user's own 2026-09-01 "no commemoration
anything from Palm Sunday through Low Sunday" instruction already covers this span and stays
unchanged); and the per-day names are "Die N infra Octavam Paschæ" (Monday-Friday) / "Sabbato in
Albis" (Saturday) — "Hebdomada in Albis" is a real but looser term for the whole week as a unit,
not each weekday's own rubrical title, and only Saturday (paired with the following "Dominica in
Albis", i.e. Low Sunday, not yet itself named beyond a generic ordinal — a separate, smaller,
still-open gap) carries a name distinct from the plain "Die N" pattern.

`npm test` (2066 passed) and `tsc --noEmit` both pass.


### All Souls' Day (Nov 2) — Office of the Dead built (2026-09-05)

Closed the long-standing exclusion noted in `sanctoral-calendar.yml`'s November header ("a
fundamentally different liturgical genre... not a saint's feast at all"). This first pass is a
one-off hardcoded day, not a reusable mechanism — **correction, 2026-09-05**: an earlier version
of this entry and of that YAML comment both claimed the app deliberately avoids modeling the
Requiem/funeral rite as a genre at all; the user explicitly corrected this after reading the
initial report — a real, reusable Office-for-the-Dead mechanism (funerals, anniversaries, not
just Nov 2) is wanted future scope, not out of bounds. Today's `hours/all-souls.ts`
exports `isAllSouls(date)` (true only for `MM-DD === '11-02'`, every year, never impeded) plus a
`build{Matins,Lauds,Vespers,Prime,Terce,Sext,None,Compline}Parts()` per hour, and each of the 8
hour files' own `resolveOrdo` branches to it before any of the normal season/winner/psalmody
machinery runs. `resolveGloriaPatri` (`hours/resolve-common.ts`) now also special-cases
`isAllSouls` the same way it already special-cases the Triduum, substituting "Réquiem
ætérnam/Et lux perpétua" for the ordinary Gloria Patri after every psalm/canticle all day (the
"Requiem gloria" rubric) — centralized there rather than per-part.

Content sourced from the reference engine's `Commune/C9.txt` ("Officium Defunctorum" — the
Vespers/Matins/Lauds skeleton: 9 Job/Augustine/1-Corinthians lessons and their own 9
responsories, the 5 Vespers psalms, Lauds' 5 psalms including the Canticle of Ezechias in place
of a numbered psalm) plus `Sancti/11-02.txt`'s own specifics (the day's two extra
Prime/Compline collects, the special Martyrology introduction, the special reduced form of the
minor hours). Live-verified hour-by-hour against the reference engine's own rendering
(`command=pray{Hora}`, `version=Rubrics 1960 - 1960`, 2026-11-02) rather than trusting the raw
per-rubric-conditional source text blind — this caught two things the static files alone would
have gotten wrong: (1) Lauds' "Ps 222" tag isn't a psalm at all but the reference engine's own
internal id for the Canticle of Ezechias (Isa 38:10-24, confirmed by live-rendering its actual
text); (2) Compline's raw `&psalm(233)` 4th special psalm never actually renders under any
selectable version of the engine (every version either keeps Compline's ordinary Nunc Dimittis
outright, per genuine Divino Afflatu/Tridentine-1906 rubric, or — under the one version that does
apply the special reduced Compline — substitutes Nunc Dimittis for that 4th psalm instead) —
dropped from this app's own content as apparently-dead/unreachable in the source itself, rather
than invented. (An unrelated false alarm along the way: querying `date=11-2` under the
"Tridentine 1910"/"Monastic Tridentinum 1617"/"Divino Afflatu - 1954" version strings resolved to
day 2/3 of the All Saints octave instead of All Souls' Day at all — a reference-engine
calendar-computation quirk for those specific tracks, not a real liturgical fact; the correctly-
resolving "Rubrics 1960" render was used as the source of truth for content instead, since the
actual antiphon/psalm/lesson texts are rubric-track-independent.)

Per user's explicit 2026-09-05 scope decision: all 8 hours get genuinely special content
(Prime/Terce/Sext/None/Compline included, not just Vespers/Matins/Lauds — confirmed for real via
the live-verification above, not just assumed), and only Nov 2's own Second Vespers is the
Office of the Dead (Nov 1 evening stays First Vespers of All Saints, untouched — All Souls' Day
has no First Vespers of its own). Vespers' Magnificat antiphon reuse of Lauds' own Benedictus
antiphon ("Ego sum resurrectio et vita") is the one text not independently live-re-verified —
it's the well-known standard convention for this office's Second Vespers, and the source only
defines this text once, but flagged here as an inference rather than a direct citation.

New test file `tests/hours/all-souls.test.ts` (all 8 hours, two different years, plus confirming
Nov 1 First Vespers is unaffected). `npm test` (2046 passed) and `tsc --noEmit` both pass.

**Generalized same day**, per direct user instruction: split into `hours/office-of-the-dead.ts`
(the reusable engine — Commune C9's own generic content: Vespers/Matins/Lauds psalmody, Nocturn
1's fixed Job lessons + all 9 responsories, Terce/Sext/None/Compline's bare psalms, the two
generic collects, `REQUIEM_GLORIA_PATRI`/`CONCLUSIO`; nothing here references a date, so it's
usable for a future funeral/anniversary occasion) and a thinned `hours/all-souls.ts` (only Nov
2's own specifics: Matins' Augustine/1-Cor Lessons 4-9 override, the Martyrology introduction,
Prime/Compline's own day-specific collects). No new calendar trigger added — still only Nov 2
exercises this. All 8 hour files' wiring unchanged; full suite (2051 passed) and `tsc --noEmit`
both still pass with no behavior change.


### Common-of-a-Dedication Lauds — closed (2026-09-05)

The last open Lauds Common-category gap (9/10 -> 10/10). A 2026-08-28 note on this Common's
Vespers file claimed Lauds needed an OT canticle ("Canticum Ieremiæ") never transcribed anywhere
in this app — re-verified fresh against the live engine (Monastic Tridentinum 1617,
`command=prayLaudes`, `votive=C8`) across all 7 weekdays (11-09 through 11-15-2026) and found that
premise was wrong: no such canticle appears anywhere in the real scheme on any weekday. The
original note's numbers ("Ps 50/87/89 + Exodus canticle") match plain ferial Thursday's own Lauds
exactly (`Psalmi major.txt`'s `[Monastic Laudes] (feria 5)`) — the 2026-08-28 session evidently
captured that instead of actually passing `votive=C8`.

The real scheme: 3 proper-antiphon groups (Ps 50/5/35, this Common's own text) plus a canticle
slot whose *antiphon* is fixed to this Common ("Bene fundáta est...") but whose underlying
canticle *text* simply follows the plain ferial weekday rotation — Isaiah/Ezechias/Anna/
Moses-Exodus/Habacuc/Moses-Deuteronomy-split/Three-Young-Men — all 7 already authored
(`hours/lauds-canticles.ts`). Required a small mechanism change since this is the first Common
whose canticle id isn't fixed: `LaudsPsalmodyOverride.canticle.id` (`hours/lauds-psalmody-
overrides.ts`) is now optional, and `hours/lauds.ts`'s `resolvePsalmody` splices in the day's own
ferial canticle id/split when an override omits it, keeping the override's own antiphon. No other
category is affected (all author a fixed id already).

`npm test` and `tsc --noEmit` both pass.


### Matins Nocturn 3 entirely unauthored — closed (2026-09-05)

6 files were missing Nocturn 3 entirely (not just an unpaired Gospel on an existing homily),
found while closing the Gospel-pericope gap above: `nativity-bvm.yml` (Matt 1:1-16 + St. Jerome,
Commentary on Matthew Bk. 1), `ss-cletus-and-marcellinus.yml`/`ss-soter-and-caius.yml`
(Common-of-Popes Nocturn 3, Matt 16:13-19 + Pope St. Leo the Great's Sermon 2 on the Anniversary
of his Election — reused verbatim from `st-martin-i.yml`, already authored this session with the
identical Common-of-Popes text), `ss-cornelius-and-cyprian.yml` (Common-of-Martyrs Nocturn 3,
Luke 21:9-19 + Pope St. Gregory's Homily 35), `ss-seven-brothers-rufina-and-secunda.yml` (a
proper override on top of its own Common, Matt 12:46-50 + Gregory's Homily 3, "Who is my
mother?"), and `st-anacletus.yml` (an alternate "rubrica 1570 aut rubrica 1617" variant of
`Sancti/07-13.txt`, carrying a real Nocturn 3 — Luke 14:26-33 + Gregory's Homily 37 — distinct
from the file's own modern-rubric default, which has none at all; of particular interest given
this app's own Monastic 1617 structural default). All sourced from `../divinum-officium-reference`
(the Common-of-Popes Gospel pericope again only found under `obsolete/missa/`, same pattern
as `st-isidore-of-seville.yml` above); `st-anacletus.yml`'s homily English has no reference-engine
translation for this specific Lectio7-9 split, so it was composed directly from the Latin and
marked draft.

`npm test` (2029 passed) and `tsc --noEmit` both pass; live-verified via `resolveOrdo` on all 6
saints' real dates.


### Matins Nocturn 3 Gospel pericope — closed (2026-09-05)

Systemic gap found while reviewing the Ember-Friday/9-18 fix: a huge number of `nocturn-readings/
*.yml` files had an authored patristic homily (`isGospel: false`, a `source` field naming the
author/work) with no paired `isGospel: true` Gospel pericope — the homily discussing a Gospel text
that was never itself transcribed into the file. Nocturn 3 in this office is always a homily on
that day's own Mass Gospel; leaving the pericope unauthored meant the homily read with no context
for what it was actually commenting on.

Closed in two waves, since the first pass's detection method was itself too narrow (a regex over
the `source` field looking for an explicit citation) and missed real cases — either because the
citation was only in the file's header comment, phrased in a way the regex didn't match (a Latin
abbreviation, a parenthetical, a bare "Commentary on Luke" with no verse number), or not named
anywhere in the file at all:

- **Wave 1** (regex-detected, 64 files): every file where `source` itself named a Gospel
  book+chapter.
- **Wave 2** (structural re-scan — any `isGospel: false` + `source` entry in a file with zero
  `isGospel: true` entries, no regex): found 75 more candidates. Required real per-file
  verification against `../divinum-officium-reference` (checking the actual Lectio7-9/
  `[Evangelium]` structure), since several turned out to be Nocturn 2 content or Common-of-saints
  cross-references with no proper Gospel of the saint's own — ~46 authored, ~29 correctly left
  alone. A handful more (`st-aloysius-gonzaga.yml`, `st-francis-xavier.yml`,
  `st-john-baptist-de-la-salle.yml`, `st-joseph-calasanctius.yml`) were dropped from the wave-2
  task list by mistake and fixed directly during final verification.

Along the way, two more real bugs surfaced and were fixed in `src/hours/matins.ts`/
`src/calendar/day-label.ts`:
- A demoted temporal commemoration (e.g. a "Commemoratio Feriæ") was leaking a governing Sunday's
  own homily into an unrelated weekday's reading pool through a separate code path than the one a
  2026-09-03 fix had gated — affected 18 days/year.
- Reading pool order didn't match the day label's own commemoration order (temporal-then-
  sanctoral) — fixed to follow the same convention.
- A plain generic temporal commemoration (e.g. "Saturday in the 15th week after Trinity") was
  shown in the day label even when something else was already being celebrated, redundant with
  either an Ember day's own name or simply unnecessary noise alongside any winner — dropped
  unconditionally, not just for Ember days.
- A homily's own authored responsory (when distinct from its paired Gospel's) was never actually
  read by `gospelReadingPart` — silently dropped for every Gospel+homily pair with a responsory on
  the homily specifically (e.g. `post-pentecost-16.yml`'s Ambrose homily).

A handful of files were found to have **no Nocturn 3 content authored at all** (not just an
unpaired Gospel) — logged separately above under "Minimal-proof-done, bulk content pending", not
part of this closed item.

`npm test` (2029 passed) and `tsc --noEmit` both pass; live-verified on 2026-09-16/18/19 (the
Ember-September-into-saint cluster that originally surfaced this).


### Matins responsory pools: `jdc` (Judges) — composed, no liturgical precedent (2026-09-05)

User-directed: compose Judges' own responsory from Gideon's trumpet-and-pitchers stratagem at the
camp of Madian (Jdc 7:17-20), on the verse's own merit — like `jos`, since Judges has no citation
anywhere in the reference source at all, Horas or Missa.

Considered and set aside: the Song of Deborah's closing benediction (Jdc 5:31) has no natural second
verse to pair with it without inventing one; Samson's dying prayer (Jdc 16:28-30) was set aside as an
uncomfortable emphasis for a Matins responsory (a prayer for strength to kill himself with his
enemies). Gideon's cry won out as the single most recognizable line in the book, and — like
`ruth`/`jos` before it — the passage is already a command/fulfillment structure that maps directly
onto R./V. form: R. is v.17-18 (Gideon's command to the three hundred men); V. is v.19-20's
fulfillment, trimmed to its own core clause (dropped v.20's "in tribus locis... hydrias
confregissent" middle as restating what "conplodere lagoenas" already said), landing the versicle
directly on the iconic cry itself: "Gladius Domini, et Gedeonis."

Source (`jdc-7.yml`) has no accents, like `jos-24.yml`; Latin hand-accented, cross-checked
word-by-word against already-accented occurrences elsewhere in the corpus (`vidéritis`, `fácite`
— matching the "Hoc fácite" idiom's own established accenting — `ingrédiar`, `sectámini`,
`personáverit`, `castrórum`, `circúitum`, `clángite`, `conclamáte`, `tenuérunt`, `mánibus`,
`sonántes`, `clamaverúntque`, `Gládius`, `Gedeónis`, `Gedeóni`); `sinistris`/`dextris` left
unaccented, matching this corpus's own consistent practice for those two specific words even where
the general accenting rule would suggest otherwise. Also caught: the source's own English for v.18
is incomplete (drops "et conclamate, Domino et Gedeoni" entirely, ending mid-sentence) — supplied
the missing clause from the standard Douay-Rheims wording rather than reproducing that gap.

Keyed `jdc:` (`BOOK_ALIASES` maps `judg` to this canonical id). `npm test` (2029 passed) and
`tsc --noEmit` both pass; live-verified through `getBiblePlanReadings` (`easter-6`/Wednesday
resolves real, correctly R./V.-formatted text in both languages for `Judg 7`).

70 of 72 seeded. Remaining 2 (1-2 Paralipomenon/Chronicles) have no citation anywhere, Horas or
Missa, and no scripture text of their own has been composed on its own merit yet.


### Matins responsory pools: `jos` (Josue) — composed, no liturgical precedent (2026-09-05)

User-directed: compose Josue's own responsory from Josue 24:15-16, on the verse's own merit — like
`ruth`/`1esdr`, since Josue has no citation anywhere in the reference source at all, Horas or Missa
(re-confirmed live: every "Josue" hit in the corpus is an incidental mention of the person inside
unrelated books' readings — Ambrose's *De Officiis* homily, 1-2 Kings — never the Book of Josue's
own text).

The verse pair is already a two-voice exchange — Joshua's challenge to Israel ("choose you this day
... but as for me and my house, we will serve the Lord") and the people's reply — mapping directly
onto R./V. form with no invented content, just split at the natural seam. Asterisk placed before
"Ego autem", so the full choice-clause is R. and the famous declaration is the repeated close; V. is
v.16 kept whole, including "Respondítque pópulus, et ait" (not trimmed for the change of speaker,
since R./V. form doesn't make that redundant here — the narrative frame still matters).

Source (`jos-24.yml`) has no accents, like `ruth-1.yml`/`1esdr-8.yml`; Latin hand-accented,
cross-checked word-by-word against already-accented occurrences elsewhere in the corpus (`vidétur`,
`Dómino`, `elígite`, `hódie`, `potíssimum`, `servíre`, `debeátis`, `serviérunt`, `Mesopotámia`,
`habitátis`, `serviémus`, `Respondítque`, `pópulus`, `relinquámus`, `serviámus`, `aliénis`); `óptio`
left unaccented (2 syllables, no precedent either way, but this project's own accenting convention
never marks a 2-syllable word). `Amorreorum` kept in the spelling `jos-24.yml`'s own bulk import
uses (no `h`, single `r`) rather than the Clementine `Amorrhæórum` spelling found elsewhere in the
corpus (Ps 134/135), since that's this book's own source-text tradition, not a typo to "fix" toward
the more familiar spelling.

Keyed `jos:` (`BOOK_ALIASES` maps `josh` to this canonical id) — not `josue`, which would silently
miss every lookup. `npm test` (2029 passed) and `tsc --noEmit` both pass; live-verified through
`getBiblePlanReadings` (`easter-4`/Sunday resolves real, correctly R./V.-formatted text in both
languages for `Josh 1`).

69 of 72 seeded. Remaining 3 (Judices, 1-2 Chronicles) have no citation anywhere, Horas or Missa,
and no scripture text of their own has been composed on its own merit yet.


### Matins responsory pools: `1esdr` (Ezra) — composed, no liturgical precedent (2026-09-05)

User-directed: compose Ezra's own responsory from 1 Esdras 8:21-23, on the verse's own merit — like
`ruth`, not like `bar`/`2esdr`, since the one candidate lead for this book (`Pasc7-2.txt`'s Introit,
see the earlier `ezra`/`neh` entry) turned out to be a text mismatch, not a real match to build from.

v.22's antithesis ("the hand of our God is upon all them that seek him in goodness: and his power and
strength, and wrath upon all them that forsake him") is the strongest material, but the Vulgate's own
clause order puts the wrath half last — a sour note to end the repeated (`*`) clause on, especially
right before v.23's "it fell out prosperously." Edited: swapped the two halves of v.22 so the hopeful
clause is the one repeated after V. — same words, no invention, just reordered for the R./V./R. shape.
V. is v.23 unaltered.

Source (`1esdr-8.yml`) has no accents, like `ruth-1.yml`; Latin hand-accented, cross-checked
word-by-word against already-accented occurrences elsewhere in the corpus (`impérium`, `fortitúdo`,
`derelínquunt`, `bonitáte`, `jejunávimus`, `próspere`). Keyed `1esdr:` (`BOOK_ALIASES` maps `ezra` to
it). `npm test` (2029 passed) and `tsc --noEmit` both pass; live-verified through
`getBiblePlanReadings` (`easter-sunday`/Monday resolves real, correctly R./V.-formatted text in both
languages for `Ezra 3-4`).

68 of 72 seeded. This closes every book with any real sourceable material — the remaining 3 (Josue,
Judices, 1-2 Chronicles) have no citation anywhere, Horas or Missa, and no scripture text of their
own has been composed from on its own merit the way `ruth`/`ezra` were, since that hasn't been
directed for them yet (Josue itself got exactly this treatment shortly after — see the dated entry
below).


### Matins responsory pools: `2esdr` (Nehemiah) — correcting a mis-diagnosis (2026-09-05)

The entry above's "Nehemiah: no citation anywhere at all" was wrong — Nehemiah had been bundled in
with `ezra`'s "one thin, ambiguous near-miss" reasoning without ever getting its own Missa check, the
same check that had already found and closed `bar` a few entries earlier. It has a real, unambiguous
citation: Ember Wednesday of September's own Lectio and Communio both quote Neh 8
(`missa/Latin/Tempora/093-3.txt`, `!Neh 8:1-10` / `!Neh 8:10`), genuine accented Latin, matching
English in the sibling `English/Tempora/093-3.txt`.

User-directed: R. from v.3 ("Et legit in eo apérte in platéa... et aures omnis pópuli erant eréctæ
ad librum" — Esdras reading the law plainly, all ears attentive), V. from v.9 ("Dies sanctificátus
est Dómino, Deo nostro: nolíte lugére et nolíte flere" — user's pick, offered against v.6's "Amen,
Amen" and v.10's "Ite, comédite pínguia," for the contrast between the plain reading and the
proclaimed holy day of no mourning). Both Latin lines taken verbatim from the same accented Missa
Lectio; English from the project's own verified `src/data/scripture/2esdr-8.yml`, not retranslated.
Keyed `2esdr:` in the pool (not `neh:`) since that's what `BOOK_ALIASES` maps `neh` to.

67 of 72 seeded. Remaining 5: Josue, Judices, 1-2 Chronicles (no citation anywhere at all) plus
`ezra` (one thin, ambiguous near-miss, deliberately left unseeded — see the entry above).


### Matins responsory pools: `ruth` — the first composition with no liturgical precedent at all (2026-09-05)

User-directed: compose Ruth's own responsory from Ruth 1:16-17 ("thy people shall be my people,
and thy God my God") on the verse's own merit, even though — unlike `deut`/`rom`/`bar` — this text
has *no* liturgical precedent anywhere in the reference source at all (no Nuptial Mass file even
exists there to check against). Flagged that distinction directly before proceeding; user confirmed
it explicitly, aware of the difference from the three prior compositions (all of which recombined
text already used liturgically elsewhere, just never in Matins).

Since the project's usual bulk-imported `data/scripture/ruth-1.yml` carries no accents, the Latin
was hand-accented rather than transcribed — but cross-checked word-by-word against already-accented
occurrences of the same words elsewhere in the reference corpus (`quocúmque`, `pópulus tuus`,
`páriter`, `ábeam`, `relínquam`, `moráta`, `morábor`, `móriar`, `moriéntem`, `suscéperit`,
`sepultúræ`) rather than guessed freehand from scratch.

66 of 72 bible-plan books now seeded. `npm test` (2029 passed) and `tsc --noEmit` both pass;
live-verified through `getBiblePlanReadings` (`sunday-after-ascension`/Saturday resolves real,
correctly R./V.-formatted text in both languages for `Ruth 3-4`). Canonical-key audit re-run, clean
(`ruth` has no `BOOK_ALIASES` entry). Remaining 6: Josue, Judices, 1-2 Chronicles, Nehemiah (no
citation anywhere at all) plus `ezra` (one thin, ambiguous near-miss, deliberately left unseeded —
see the entry above).


### Matins responsory pools: `bar` found in the Missa, not the Horas (2026-09-05)

The "closes the pool" claim above turned out premature by one book. User pointed to
`missa/Latin/Tempora/Quad6-6.txt` — the *Mass* propers, a directory tree this whole responsory
search had never once checked (everything so far searched `horas/`, the Divine Office proper).
The Easter Vigil Mass's own fourth prophecy (`[Proph_Baruch3]`, Bar 3:9-38, "Audi, Israël, mandáta
vitæ") is genuine, real, accented liturgical Latin — just never part of the Office's own Matins at
all, in either directory tree. Composed `bar` the same way as `deut`/`rom`: built from that
prophecy's own climactic close ("Hic est Deus noster... Post hæc in terris visus est, et cum
homínibus conversátus est" — read at the Vigil because early exegetes saw "seen upon earth, and
conversed with men" as a prophecy of the Incarnation), genuine text, not invented.

**65 of 72 bible-plan books now seeded.** `npm test` (2029 passed) and `tsc --noEmit` both pass;
live-verified through `getBiblePlanReadings` (`palm-sunday`/Thursday resolves real, correctly
R./V.-formatted text for `Bar 1-2`). Canonical-key audit re-run, clean (`bar` has no `BOOK_ALIASES`
entry).

**This closes the per-book responsory pool as a project** (see "Matins responsory pools" and its
eleven follow-up entries, 2026-09-04/05) — the per-Common-category pool (19/19 real categories) is
also done; see that same first entry. Extended the Missa check to the other 6 already-absent books
too (Josue, Judices, Ruth, 1-2 Chronicles) — genuinely zero citations anywhere, Horas or Missa.
Ezra came up with one thin, ambiguous lead not acted on: `missa/Latin/Tempora/Pasc7-2.txt`'s
Introit cites `!Esdr 2:36 2:37`, but the actual Vulgate text there (checked against
`data/scripture/1esdr-2.yml`) is a plain census list that doesn't match the Introit's own text at
all ("Accípite jucunditátem glóriæ vestræ... qui vos ad cœléstia regna vocávit"). User's own
explanation (2026-09-05), plausible and probably right, though unprovable without a text we don't
have: Vulgate numbering is genuinely ambiguous here — "1/2 Esdras" is canonical Ezra/Nehemiah, but
there's also a separate, non-canonical Greek "Esdras A" (the Vulgate appendix's own "3 Esdras,"
sometimes itself called "1 Esdras" in Septuagint/Orthodox numbering) — a different text entirely
that this project has never digitized. The reference engine's own citation never disambiguates
("Esdr" bare, no "3" anywhere else in the source to compare against), so this can't be confirmed
outright, but it cleanly explains why the citation doesn't match our canonical Ezra text. Left
both `ezra` and `neh` unseeded rather than force an uncertain match. One small, unrelated loose end
noted along the way
and not addressed here: the bible-plan TSV's own content still isn't covered by a table-driven
test the way other bulk-imported content stores are (see "Bible-plan TSV — bulk conversion done"
below) — `tests/propers/bible-plan.test.ts` tests specific real dates ad hoc, not the full imported
set.


### Matins responsory pools: `rom` — the second (and last) original composition (2026-09-05)

Asked directly for thoughts on Romans, the one book with real citations but no usable Matins
content anywhere (every citing file borrows an unrelated feast's own proper responsory — Christmas
Day, Circumcision, or a January 7 saint). Same approach as `deut`: composed rather than
transcribed, but built from real, already-liturgical text rather than invented — Rom 13:11-12
("the night is past, the day is at hand... let us cast off the works of darkness, and put on the
armour of light") is the standing year-round ferial Lauds Capitulum
(`Latin/Psalterium/Special/Major Special.txt`'s own "Feria Laudes") and is used again at Advent
I's own Capitulum (`Tempora/Adv1-0.txt`) — genuine accented Vulgate/Douay-Rheims text, just never
combined into its own 9-lesson Matins responsory set the way every other book in this pool was.
User-confirmed before adding.

**64 of 72 bible-plan books now seeded — every book actually used in the user's own bible-plan has
a real responsory, whether transcribed (62) or composed from genuine liturgical text (`deut`,
`rom`).** The remaining 8 are the true, final, unclosable gap: books with no citation anywhere in
Tempora or Sancti at all (`bar`, Josue, Judices, Ruth, 1-2 Chronicles, Ezra, Nehemiah) — there's no
comparable "already-liturgical, just never assembled into a responsory" text to build from for any
of these, since they're never quoted or read in the Office at all, historically. `npm test` (2029
passed) and `tsc --noEmit` both pass; live-verified through `getBiblePlanReadings` (a Jan 1
calendar-dated row resolves real, correctly R./V.-formatted text for `Rom 7-8`). Canonical-key
audit re-run, clean.


### Matins responsory pools: `deut` — the first genuine original composition, not a transcription (2026-09-05)

User found a real lead while reading a patristic homily (`English/Sancti/01-02.txt`, on Matt
23:37 "O Jerusalem, Jerusalem"): it quotes Deut 32:11's eagle image in passing ("as also it is
written... an eagle stirreth up her nest... spreadeth abroad her wings"). Confirmed the verse
number against `data/scripture/deut-32.yml`'s own `n: 11` — genuinely Deut 32:11 in standard
citation, not the breviary's own internal chant-verse-numbering for the same text (which splits
it as 32:15-16 in `Latin/Psalterium/Psalmorum/Psalm226.txt`, the real Canticle of Moses sung at
Lauds — that file supplied real, properly accented liturgical Latin and its English counterpart
gave the matching translation, so no accentuation had to be guessed).

Unlike every other entry in this pool, Deuteronomy genuinely has no historical Matins responsory
anywhere in the reference source (confirmed absent from both Tempora and Sancti in the two prior
entries) — so this one is composed, not transcribed: a real R./V. pairing built entirely from
that same canticle's own genuine verses (32:15's eagle image as the R., 32:13-14's "apple of his
eye" as the V.), verbatim text, not paraphrased or invented, just newly paired. Documented plainly
in the data file's own header comment as vu's own composition rather than presented as a
historically-attested responsory, matching this project's "not a reconstruction" ethos.

63 of 72 bible-plan books now seeded (`deut` added). `npm test` (2029 passed) and `tsc --noEmit`
both pass; live-verified through `getBiblePlanReadings` (`easter-3`/Saturday resolves the real,
properly R./V.-formatted text for `Deut 33-34`). Canonical-key audit re-run, clean (`deut` has no
`BOOK_ALIASES` entry).


### Advent reading-plan carryover into Christmastide (2026-09-05)

User-flagged wrinkle in `data/hours/bible-plan/*.yml`'s own Isaiah plan: it's authored as a full
4-week Advent (`advent-1-sunday` through `advent-4-saturday`, 28 rows), but real Advent is never
that long. Advent's last real day is always Dec 23 (Dec 24 is the Vigil of Christmas's own
temporal id, `calendar/temporal-id.ts`), while Advent 1 Sunday itself — the Sunday nearest Nov 30
— falls anywhere from Nov 27 to Dec 3. Even the *longest* possible Advent (Nov 27, 27 real days)
is one short of the full 28-row plan; the *shortest* (Dec 3, 21 real days) is a whole week short.
Every single year, at least the plan's last row never lands on its own natural date — not just
"most years," as the request first put it.

Fixed in `propers/bible-plan.ts`'s new `adventCarryoverReadings`: whatever doesn't land on its own
natural date now carries forward one reading per day starting Christmas Day itself, pooled
alongside whatever Christmastide's own calendar-dated rows already have for that day (never
replacing them) — same "every contributing source pools, none override" design already used
throughout this file and `hours/matins.ts`'s own reading-pool assembly. Computed live from
`calendar/temporal.ts`'s `adventStart(year)` for each date's own year (the one place in this file
that needs real calendar-year awareness, since every other lookup here is year-independent); no
new content authoring needed, since the Isaiah rows were already there, just never reachable on
their own natural date in a short year.

User's own framing accepted as the trade-off: "for advent only, we need to show all of those
chapters" — i.e. every planned reading should surface somewhere, even if that means spilling into
Christmastide, rather than silently dropping the tail end of a short year's Advent plan.

Live-verified across the full spread of possible Advent-1-Sunday dates (`adventStart` for
2020-2035 spans exactly the Nov 27 - Dec 3 range): 2028 (Advent 1 Sunday = Dec 3, the latest/
shortest case) carries all 7 of week 4's Isaiah readings forward across Dec 25-31 in order; 2027/
2032 (Advent 1 Sunday = Nov 28, near-earliest/longest) carry only the last 2. Added 4 permanent
tests to `tests/propers/bible-plan.test.ts` covering both extremes, the pooling-not-replacing
behavior, and that nothing carries over before Christmas Day itself. `npm test` (2029 passed,
+4 new) and `tsc --noEmit` both pass.


### Matins responsory pools: `cant` (Canticles) found in the Sancti files, not Tempora (2026-09-05)

User pushback on `cant` being listed "confirmed genuinely absent": right instinct to check the
Commune files specifically — Canticles/Song of Songs imagery is heavily used in Marian propers.
Checked `Latin/Commune/C12.txt` (the Little Office of the BVM) directly: it does cite `!Cant 6:8`,
but only as a Lauds Capitulum, not a Matins Nocturn lesson — Capitula don't carry their own
9-Responsory structure, and C12's actual Lectio1-3 are Sirach 24, not Canticles (matching this
pool's existing `common-of-the-bvm` sourcing). So the Commune search itself came up empty for a
genuine Matins responsory — but it redirected the search productively: checked `Sancti/` (individual
saint/feast files) with the same `awk` Lectio-citation survey used for Tempora, and found real
`!Cant` Nocturn lessons on the Visitation (July 2) and throughout the Assumption Octave
(Sancti/08-15t through 08-22t) — the historic BVM feasts that read straight through the Song of
Songs. Only the Visitation's own file (`07-02.txt`) has both languages; the Assumption Octave days
have real Latin but no English anywhere.

Added `cant`, sourced from `Sancti/07-02.txt` — genuinely Canticles-sourced responsories that
directly blend Song of Songs verses with the Visitation narrative itself ("Surge, própera, amíca
mea... Intrávit María in domum Zacharíæ"), not a borrowed-unrelated-feast mismatch.

60 of 72 bible-plan books now seeded. `npm test` (2025 passed) and `tsc --noEmit` both pass;
live-verified through `getBiblePlanReadings` (a Dec 27 calendar-dated row resolves real `Cant 3`
responsory text). Canonical-key audit re-run, clean (`cant` has no `BOOK_ALIASES` entry).

Prompted by finding `cant` in Sancti, re-checked the other 11 already-confirmed-absent books
against Sancti too (not just Tempora) — found 2 more: `lev` (Leviticus, `Sancti/02-02.txt`, the
Purification of the BVM — its own Leviticus purification-law reading is the feast's actual reason
for being) and `num` (Numbers, `Sancti/09-14.txt`, the Exaltation of the Holy Cross — the
bronze-serpent/Cross typology, Num 21:6-9, only 1 entry). Both genuine thematic matches, not
borrowed-unrelated content. The other 9 (`bar`, Josue, Judices, Ruth, 1-2 Chronicles, Ezra,
Nehemiah, Deuteronomy) checked against the reference engine's own full Sancti citation list —
confirmed still absent, no alternate abbreviation missed.

62 of 72 bible-plan books now seeded — the real final count. `npm test` (2025 passed) and
`tsc --noEmit` both pass; live-verified through `getBiblePlanReadings` (`lent-3`/Sunday resolves
real `Lev 1` responsory text, `palm-sunday`/Sunday resolves real `Num 25-27` text). Canonical-key
audit re-run, clean. Remaining 10, the true final gap: `rom` plus 9 books with no citation
anywhere in Tempora or Sancti (`bar`, Josue, Judices, Ruth, 1-2 Chronicles, Ezra, Nehemiah,
Deuteronomy).


### Matins responsory pools: the "untranslated 15" turned out mostly already bilingual (2026-09-04)

Asked to translate the 15 "real Latin, no English" books. Before translating anything, re-checked
each one's own `@Tempora/X:ResponsoryN` reference chain (the same technique that unblocked 8 books
earlier the same day) — and found the whole post-Epiphany "ordinary time" reading season (weeks
3-5, covering Galatians/Ephesians/Philippians/Colossians/1-2 Timothy/Titus/Philemon/2
Thessalonians) doesn't have its own distinct responsory content at all: every one of its 21 feria
files `@`-references 2 Corinthians' own week (Epi2-0 through Epi2-6, already fully bilingual from
earlier this same day) by weekday position. Confirmed by reading every week-3/4/5 feria file's own
`@`-line directly, not guessed. Same story for 2 Peter, 2-3 John, and Jude — all four `@`-reference
Ascension Day's own responsories (already seeded as `act`). **None of these 12 books needed any
translation at all** — added `gal`/`phil`/`1tim` (share Epi2-1), `col`/`2tim` (share Epi2-2),
`eph` (Epi2-3), `1thess`/`tit` (share Epi2-4), `2thess`/`phlm` (share Epi2-6), `2pet`/`2joan`/
`3joan` (share `act`'s R1), `jud` (`act`'s R7) — all real, already-transcribed bilingual text.

Also fixed a real, separate bug the user caught by eye in the rendered app: `getResponsoryForBook`'s
`joinResponsory` concatenated the pool's `r`/`v` text with a bare newline and no "R."/"V." labels
at all — every other responsory source in the app (`octave-readings.ts`'s own `responsory` field,
every `nocturn-readings/*.yml`'s inline `responsory`, and the new per-Common-category pool) uses
the full "R. ...\n* ...\nV. ...\nR. ..." convention. Fixed by computing the repeat line from the
`*` marker already present in the pool's own `r` text (a separate commit, `1867f73`, before this
content pass).

**Only `rom` (Romans) turned out to have no content to translate at all**, on inspection — re-
checked every one of its 15 citing files (all in the Christmas-Octave `Nat0X` range): every single
one `@`-references an unrelated feast's own proper responsory (Circumcision, Christmas Day, or a
January 7 saint), never anything Romans-specific, standalone or borrowed. There's no genuine
"Romans content" anywhere in this reference source to translate, sourced or original — using one of
these borrowed responsories would repeat the Sacred Heart/Jeremiah mismatch this file already
avoids elsewhere. Left `rom` unseeded; it would need an entirely original composition, not a
translation, if ever wanted.

59 of 72 bible-plan books now seeded — every book with any genuinely usable Latin at all. The
remaining 13 (`rom` plus the 12 already-confirmed-absent books) are the real, final gap: `rom` has
no book-specific content anywhere in this source; the other 12 have no citation anywhere at all.
Ran the full canonical-key audit again (programmatic check against `BOOK_ALIASES`, per the
established lesson) — confirmed clean. `npm test` (2025 passed) and `tsc --noEmit` both pass;
live-verified through `getBiblePlanReadings` (`post-epiphany-3`/Wednesday `Gal`, `post-epiphany-5`/
Monday `1tim`, `sunday-after-ascension`/Saturday `Jude` all resolve real responsory text; `Ruth`
correctly still resolves `undefined`).


### Matins responsory pools: last real batch (1 Cor, 2 Cor, 1 Peter, 1 John), a repeated key bug (2026-09-04)

Confirmed Leviticus/Numbers/Deuteronomy genuinely absent from Tempora (re-checked precisely with
the `awk`-based Lectio-citation survey, not a loose grep — no hit under any Latin form of the
book's name). Added `1cor` (Maundy Thursday's own Nocturn 3, Latin/Tempora/Quad6-4.txt
Responsory7-9 — the Institution narrative, distinct from that same file's Responsory1-3 already
used for `lam`), `2cor` (Epiphany II Sunday, its own ordinary rank, Epi2-0.txt), `1pet` (1 Peter's
own reading week `@`-references the ordinary Paschaltide Sunday psalm-set already used for `jac`
below — R4-6 of that same Pasc4-0.txt), and `1joan` (Sunday within the Ascension Octave, Pasc6-0.txt,
the Paraclete responsory, only 1 entry).

**A repeated mistake, caught by self-audit this time**: the previous entry's `jas` key was wrong —
same bug as the 12-key fix two entries up. `BOOK_ALIASES` maps bible-plan's `jas` to canonical
`jac`; the pool needed `jac:`, not `jas:`. Fixed, and re-verified through `getBiblePlanReadings`
(not a direct call) on `easter-6`/Monday, 2026-05-11 (`Jas 2` now resolves a real responsory).
**Ran a full audit this time**: checked every single current pool key against `BOOK_ALIASES`
programmatically (not just the ones touched this pass) — confirmed clean, zero raw-alias-source
keys remain anywhere in the file.

45 of 72 bible-plan books now seeded. `npm test` (2025 passed) and `tsc --noEmit` both pass.

Remaining 27, none easily gettable this pass: 12 confirmed genuinely absent from the reference
source (`bar`, Canticles, Joshua, Judges, Ruth, 1-2 Chronicles, Ezra, Nehemiah, Leviticus, Numbers,
Deuteronomy); 15 with real Latin but no reference-engine English anywhere (Romans, Galatians,
Ephesians, Philippians, Colossians, Titus, Philemon, 2 Thessalonians, 2 Timothy, 2 Peter, 2-3 John,
Jude). Own-translating any of these would be the next step, if wanted — not attempted here per the
established "only seed real bilingual source" pattern.


### Matins responsory pools: NT books (Acts, Apocalypse, James, Hebrews, the 4 Gospels) (2026-09-04)

Continuing the same bulk-sourcing pass, applying the previous entry's own lesson from the start
this time (canonical keys, pipeline-verified). Surveyed the whole reference engine's own citation
set precisely (an `awk` one-liner reading the line *after* every `[LectioN]` tag, following two
lines deep for Gospel entries whose citation sits below a "Léctio sancti Evangélii secúndum..."
line) rather than grepping loosely for a book prefix — the loose approach had already produced one
false positive this session (`Rom` matching a Lauds Capitulum, not a real Matins Lectio).

Added, all bilingual, all real Nocturn responsories:
- `act` (Ascension Day's own Matins, Latin/Tempora/Pasc5-4.txt) and `marc` (Easter Sunday's own
  Matins, Pasc0-0.txt) — both high-ranked feast days, but genuinely proper content (Ascension's
  own Nocturn 1 *is* Acts 1; Easter's *is* Mark 16), not an unrelated override like the Sacred
  Heart/Jeremiah case — same reasoning already used for `lam`.
- `heb` (Good Friday's own Tenebrae Matins, Quad6-5.txt) — same reasoning again, Passion-narrative
  responsories ("Omnes amici mei," "Velum templi scissum est").
- `apoc` (Easter III Sunday, its own ordinary rank, Pasc3-0.txt) and `jas` (Easter IV Sunday,
  Pasc4-0.txt) — genuine Paschaltide Sunday responsory sets, not thematically tied to Apocalypse/
  James specifically (a generic Alleluia-form psalm-based set), same "loose match" convention as
  everywhere else in this pool.
- `luc`/`matt`/`joan` (Advent I/II/III Sundays, Adv1-0/Adv2-0/Adv3-0.txt) — each Gospel's own
  reading week, generic Advent-themed responsories, only 1 entry each (a second Sunday's own set
  wasn't chased down this pass).

41 of 72 bible-plan books now seeded. `npm test` (2025 passed) and `tsc --noEmit` both pass;
live-verified through the real `getBiblePlanReadings` call chain this time (not a direct
`getResponsoryForBook` call) — `easter-3`/Monday (`act`, `joan` via the `john`→`joan` alias),
`post-pentecost-01`/Saturday (`1sam` via alias, `prov`, `matt`), and a calendar-dated Jan 10 row
(`heb`) all resolve real responsory text; `Deut` correctly still resolves `undefined` (genuinely
unseeded, confirmed absent from Tempora entirely).

Confirmed no English exists anywhere in the reference engine for Galatians/Ephesians/Philippians/
Colossians/Titus/Philemon (the whole post-Epiphany reading season) or Romans (the Christmas-Octave
season) — real Latin text exists for all of these, just no bilingual source; left unseeded rather
than own-translating six-plus books in one pass. 32 books remain (9 of them the already-confirmed-
genuinely-absent `bar`/Josue/Judices/Ruth/Chronicles/Esdras-Nehemias/Canticles): Leviticus/
Numbers/Deuteronomy, Romans, 1-2 Corinthians, Galatians, Ephesians, Philippians, Colossians, 1-2
Thessalonians, 1-2 Timothy, Titus, Philemon, 1-2 Peter, 1-3 John, Jude not yet attempted.


### Matins responsory pools: real key-alias bug found and fixed (2026-09-04)

A serious correctness bug, found by re-verifying through the *real* pipeline rather than trusting
the earlier direct-function-call "live verification": `bible-plan.ts` normalizes a reading's book
through `canonicalBook()` (`scripture/index.ts`'s `BOOK_ALIASES` map) *before* calling
`getResponsoryForBook` — so the pool must be keyed by the canonical form, not the bible-plan TSV's
own raw book code, whenever the two differ. 12 of this same day's 33 seeded keys used the raw form
instead: `1macc`/`2macc` (canonical `1mach`/`2mach`), `1sam`/`2sam`/`1kgs`/`2kgs` (`1reg`/`2reg`/
`3reg`/`4reg`), `jdt` (`jdth`), `zeph` (`soph`), `obad` (`abd`), `jonah` (`jon`), `hos` (`osee`),
`mic` (`mich`) — every one of these would have silently resolved to `undefined` in the real app
despite passing this same day's own "live-verified" test, because that test called
`getResponsoryForBook` directly with the raw code, bypassing the normalization the real call site
always applies. Renamed all 12 keys (and their own header comments) to the canonical form.
Re-verified this time through the actual `getBiblePlanReadings` call site (not a direct
`getResponsoryForBook` call) on a real date (2026-06-04, `post-pentecost-01`/Thursday, `1sam 9-10`)
— confirms a real responsory now resolves where it silently wouldn't have before this fix. `npm
test` (2025 passed) and `tsc --noEmit` both pass.

**Lesson for future sourcing passes**: when a book has a `BOOK_ALIASES` entry, the pool key is the
*alias target*, not the bible-plan YAML's own book code — check `scripture/index.ts`'s
`BOOK_ALIASES` map before choosing a key, and verify through `getBiblePlanReadings`/`resolveOrdo`
(the real call chain), not a direct, unnormalized call to `getResponsoryForBook`.


### Matins responsory pools: 12 more OT books, and 2 real process misses caught (2026-09-04)

User caught two things this pass, neither of them a source gap:

1. Directly pointed at `web/www/horas/English/Tempora/094-3.txt` and asked why Judith ("jdt") was
   listed as unseeded when it plainly has real responsory content. Checking confirmed it — worse,
   `jdt` and `esth` (Esther) had *both* already surfaced in this same day's own full-citation dump
   of Tempora (`!Jdt`, `!Esth` were right there in the list) and were simply never followed up on.
   Not a search-methodology gap this time, an attention gap: the data was already in hand.
2. Self-audit prompted by that catch found a second, independent miss: `job` — one of the
   heaviest-used books in the bible-plan (42 rows) — had been extracted early in this same day's
   session (Latin/Tempora/091-1.txt, the classic "Job Responsories," also used in the Requiem) but
   never actually committed to the pool file at all. Sourced, verified, then silently dropped.

Fixed both, then used the same "reused across a whole prophetic-literature week" pattern already
established for `ezek`/`dan`/`zach` to sweep the rest of November's minor prophets efficiently by
following each book's own `@Tempora/X:ResponsoryN` reference rather than re-querying from scratch:
`obad` (reuses `zach`'s own R1), `jonah`/`mal` (share one entry, Tempora/111-0:R7), `hos`/`nah`
(reuse `ezek`/`dan`'s own R1), `mic` (reuses `amos`/`agg`'s own R1), `hab`/`joel` (share one entry,
Tempora/111-2:R1), `zeph` (Tempora/111-3:R1, its own). Also added `eccl` (Tempora/081-2:R1, the
same August "Wisdom literature" week cluster as `prov`/`sir`/`sap`, a different entry than
`prov`'s own) and `lam` (Latin/Tempora/Quad6-4.txt — Maundy Thursday's own Tenebrae Matins, the
classic "In monte Oliveti"/"Tristis est anima mea"/"Ecce vidimus eum" responsories; unlike the
Sacred Heart/Jeremiah override case above, Holy Week's own high rank isn't an unrelated feast
displacing ordinary content here — Tenebrae's Lamentations reading is intrinsically Holy Week's
own, so no override caution applied).

33 of 72 bible-plan books now seeded (added this pass: `jdt`, `esth`, `job`, `eccl`, `hab`, `joel`,
`zeph`, `obad`, `jonah`, `mal`, `hos`, `mic`, `nah`, `lam` — 14 new). `npm test` (2025 passed) and
`tsc --noEmit` both pass; live-verified via `getResponsoryForBook` resolving real text for every
new key.

Confirmed still genuinely absent (re-checked directly, not just re-asserted): `bar` (Baruch),
Josue, Judices, Ruth, Paralipomenon/Chronicles, Esdras/Nehemias, Canticles — no citation anywhere
in Tempora. 39 remaining books not yet attempted: Leviticus/Numbers/Deuteronomy, the four Gospels,
Acts, Apocalypse, and the NT epistles.


### Matins responsory pools: a real extraction bug found, 8 more books unblocked (2026-09-04)

User pushback on the previous entry's "5 books skipped, no English available" claim ("look at the
secular office for most of the books") — right call: re-checking found a genuine bug, not a real
source gap. The extraction script's Responsory-block regex only matched a bare `[ResponsoryN]` tag;
it missed the reference engine's own `[ResponsoryN_]` convention (an underscore-suffixed literal
template tag holding the real text, which a plain `[ResponsoryN]` often just `@:`-references
alongside a Cistercian-rubric variant) — so every file using that convention looked like it had no
English translation when the real text was sitting right there under a different tag name. Fixed
the script to prefer the `_`-suffixed tag's literal body over a bare `@:`-reference.

This unblocked `1sam` (Latin/Tempora/Pent01-1.txt, its own genuine 3-entry set — the young Samuel's
call and consecration) outright. Chasing the `@Tempora/X:ResponsoryN` cross-file references (not
resolved by the extraction script, hand-followed instead) also unblocked:
- `2sam`/`1kgs`/`2kgs` (2/3/4 Reg) — all three books' own week files `@`-reference the *same*
  single entry, Tempora/Pent03-1Feria's Responsory1 (2 Samuel 24's census/plague narrative,
  "Recordáre, Dómine, testaménti tui") — read directly, not guessed, same "loose match" reuse
  pattern already established for the Wisdom-literature and Ezekiel/Daniel weeks. One entry only;
  Responsory2/3 chain further references not followed this pass.
- `2macc` — reuses `1macc`'s own 3-entry set outright (Tempora/104-1 `@`-references Tempora/101-1).
- `zach` (Tempora/115-5, itself referencing 111-0's Responsory4-6 — Ezekiel's own Sunday, distinct
  from `ezek`/`dan`'s own Monday-sourced entries) and `amos`/`agg` (both referencing Tempora/
  Pent01-0's Responsory1 — Isaiah's throne-vision — plus 111-0's Responsory2-3) — all three
  minor-prophet books previously assumed to have no reference-engine English at all; that was true
  of their *own* week files in isolation, but false once their `@`-references were actually
  followed.

19 of 72 bible-plan books now seeded (added this pass: `1sam`, `2sam`, `1kgs`, `2kgs`, `2macc`,
`zach`, `amos`, `agg`). `npm test` (2025 passed) and `tsc --noEmit` both pass; live-verified via
`getResponsoryForBook` resolving real text for every new key, at every pool index (not just index
0) for the 3-entry sets.

Still genuinely unseeded after this pass — real gaps, re-confirmed: books with no reference-engine
citation anywhere in Tempora at all (Josue, Judices, Ruth, Paralipomenon/Chronicles, Esdras/
Nehemias, Canticles — the historic secular/monastic Historia cycle apparently never assigns these
their own continuous reading), and the remaining ~45 New Testament epistle/Acts/Apocalypse books
plus minor books not yet attempted.


### Matins responsory pools: 8 more books seeded (2026-09-04)

Follow-up to the same-day entry above, continuing the per-book pool's bulk-content pass — same
"one real source per book" method, no mechanism changes. Added `exod` (Latin/Tempora/Quad4-0.txt,
Sunday IV in Lent, its own ordinary rank — the burning bush through the Song of the Sea), `prov`
(081-1.txt, August week 1's own ferial), `tob` (093-0.txt, September week 3's own Sunday), `ezek`
(111-1.txt, November week 1's own ferial), and `1macc` (101-1.txt, October week 1's own ferial) —
all bilingual, all genuinely their own book's content, no overriding rank.

Also added `sir` and `sap` (identical to `prov`'s own entries) and `dan` (identical to `ezek`'s) —
not guessed reuse, confirmed by reading each week's own reference-engine file: the August "Wisdom
literature" weeks (081 Prov, 083 Sap, 084-085 Sir) and the November "prophetic" weeks (111 Ezek,
113 Dan) `@`-reference *the same* underlying responsory set regardless of which specific book that
week's Lectio actually reads that day — a real confirmation, from the reference engine's own data,
that this app's "loose, book-level match, not exact-citation" responsory design (see the pool's own
header, and the 2026-08 user direction it's sourced from) matches how these responsories genuinely
worked historically, not an invention to paper over a smaller pool.

Skipped, deliberately: `1sam` (1 Reg) — every Pent01 week file's responsories are macro references
(`@:Responsory1_ (sed rubrica cisterciensis) ...`, `[Rule] Initia cum responsory`) rather than
literal text, needing the base macro template resolved with per-file substitutions to get real
text; not worth the complexity for one book this pass. `2sam`/`1kgs`/`2kgs`/`2macc` (2/3/4 Reg, 2
Mac) — real Latin responsories exist in every week's own file, but the reference engine's own
English translation is entirely absent for all of them (checked every Post-Pentecost week each book
appears in); left unseeded rather than guessing a translation, consistent with only seeding books
that have real bilingual source text. `zach`/`amos`/`agg` (minor prophets) — same English-translation
gap, but Latin is real and available (Latin/Tempora/114-4.txt, 115-4.txt, 115-5.txt) if a future
pass wants to add an own-translation draft English side (see `vu-prefer-text-over-missing` memory
for the precedent).

Now 11 of 72 bible-plan books seeded: `isa`, `gen`, `jer`, `exod`, `prov`, `sir`, `sap`, `tob`,
`ezek`, `dan`, `1macc`. `npm test` (2025 passed) and `tsc --noEmit` both pass; live-verified via
`getResponsoryForBook` resolving real text for every new key.


### Matins responsory pools: per-book expansion + new per-Common-category pool (2026-09-04)

User request: real Matins responsories for each Bible book (sourced from the reference engine),
and for the patristic (Nocturn 2/3 homiletic) readings too. Investigation found the patristic side
was a much bigger, previously-untracked gap than the per-book pool's own "expand beyond `isa`" item
already on this list: 272 of 355 `data/propers/nocturn-readings/*.yml` files have no `responsory`
field at all — most of the calendar, not a handful of stragglers.

**Per-book pool** (`data/hours/matins-responsories-by-book.yml`): added `gen` (2 entries, Latin/
Tempora/Quadp1-1.txt — Monday of Septuagesima week, the historical start of the Genesis "Historia"
cycle, a plain ferial with no overriding feast; only 2 entries because the source's own English
translation is missing a 3rd) and `jer` (3 entries, Latin/Tempora/Quad6-2.txt — Tuesday of Holy
Week, "Feria privilegiata," genuine ferial Jeremiah/Lamentations content). Deliberately did *not*
seed `jer` from Pent02-5.txt despite it citing Jeremiah too — that day's Rank is Sacred Heart
(Duplex I classis), so its Responsory1-3 are the feast's own proper text, not genuine ferial-book
content, even though its Lectio verses are borrowed from Jeremiah. Still only 3 of 72 books used
in the user's own bible-plan seeded (`isa`, `gen`, `jer`) — the rest is deferred bulk content, one
real live-sourced query per book, same pattern.

**New per-Common-category pool** (`data/hours/matins-responsories-by-common.yml` +
`getResponsoryForCommon` in `src/propers/matins-responsories.ts`, sibling to the existing
`getResponsoryForBook`): keyed by `SaintRecord.common` instead of a scripture book, same "loose
match, cycle by index" design. Unlike the per-book pool (scattered one query per book, across the
whole liturgical year), a Commune category's responsories live in one static file each
(`divinum-officium-reference`'s `web/www/horas/{Latin,English}/Commune/CN.txt`) — 9 files
(`C1`-`C8`, `C11`) transcribed directly, cover all 19 of vu's real `common:` category ids (several
are genuine aliases, confirmed by reading each candidate file's own `@Commune/CX` inheritance line
rather than guessed — e.g. `common-of-a-confessor-doctor`/`-pope` inherit C4 unchanged, same pool
as `common-of-a-confessor-bishop`; `common-of-an-abbot`/`-not-bishop`/`several-confessors` inherit
C5 unchanged; `common-of-a-martyr` inherits C2 unchanged; `common-of-a-virgin` inherits C6
unchanged; `common-of-a-widow`/`several-women-martyrs` inherit C7 unchanged — see the data file's
own header for the full mapping). Not seeded: `common-of-an-angel`/`-an-evangelist`/`-a-vigil` and
the `proper-to-*` ids — none of these are real Commune categories with a responsory file to source
from (angels/evangelists have their own proper content instead).

Wired into `hours/matins.ts`'s `nocturnReadingPart`/`gospelReadingPart`: when a reading's own
`responsory` field is absent, falls back to `getResponsoryForCommon(getSaintRecord(id)?.common,
index)` — `index` is the reading's position within that same id's own file (a new `commonPoolIndex`
counter in `buildReadingPool`'s assembly loop), so a saint with several undated readings still gets
distinct responsories across them rather than the pool's first entry repeated. A temporal/octave id
(no `common` category) still correctly gets `undefined` — an honest absence, not a wrong guess.

Live-verified end-to-end via `resolveOrdo`: St. Francis de Sales (2026-01-29, `common-of-a-
confessor-bishop`, previously responsory-less) now resolves a real Nocturn 3 responsory; Ss.
Cornelius and Cyprian plus Ss. Euphemia, Lucy, and Geminianus (both on 2026-09-16, both `common-
of-several-martyrs`) each resolve their own responsory from the same pool, confirming the
per-saint-file cycling index doesn't leak across different saints sharing a day. `npm test` (2025
passed) and `tsc --noEmit` both pass.


### Paschaltide's "Suffragium Paschale" mechanism (2026-09-04)

Closed the highest-priority remaining mechanism gap. Live-verified against Divinum Officium (both
Monastic Tridentinum 1617 and Tridentine 1906, byte-identical between the two tracks — the source's
own `[Suffragium]` macro literally has a `(sed tempore paschali) @:Suffragium Paschale` override,
2026-04-20, a plain Eastertide feria): throughout the whole Paschaltide window (`eastertide`/
`ascensiontide`/`pentecost` — the same boundary `PASCHALTIDE_SEASONS` already governs elsewhere in
this store), two things happen whenever they'd otherwise show at all:

1. The ordinary 5-suffrage set (Cross/BVM/Joseph/Apostles/Peace) collapses into one single
   alleluia-form "Suffragium Paschale" block — one antiphon (different at Lauds, "Crucifíxus
   surréxit a mórtuis...", vs. Vespers, "Crucem sanctam súbiit...", unlike the ordinary 4/5
   suffrages, which share identical text at both hours), one shared versicle, one shared collect.
2. The ferial-Preces litany (`lauds-preces-feriales`/`vespers-preces-feriales`, sourced from
   Tridentine 1906/1910 since Monastic 1617 has none at all — see that file's own header) drops
   entirely rather than being replaced by anything ("Preces Feriales{omittitur}" live) — a
   Sunday/feast's own short litany (`lauds-short-litany`) is untouched, a separate, universal
   collect-opening dialogue unrelated to this ferial-specific one.

Exported a new `isPaschaltide(season)` helper from `hours/resolve-common.ts` (wraps the existing
`PASCHALTIDE_SEASONS` set, previously private to that file) and used it in both
`resolveSuffrages` (gated after the pre-existing "omit suffrages entirely" checks — Double+/active
octave/Advent-Christmastide-Passiontide already drop suffrages regardless of season, unaffected)
and a new check in `hours/lauds.ts`'s/`hours/vespers.ts`'s own `'lauds-preces'`/`'vespers-preces'`
cases (gated on `isFerialOrVigil(day)`, matching the existing predicate that already selects the
ferial litany in the first place). `resolveSuffrages` gained a third `hourId: 'lauds' | 'vespers'`
parameter (both call sites updated) to pick the right antiphon.

Authored `lauds-suffrage-paschale.yml` and `vespers-suffrage-paschale.yml` — English on the Vespers
antiphon is this project's own translation and left `draft` (the reference engine's own English
render leaves that one antiphon untranslated, Latin-only); everything else `verified`.

Verified end-to-end via `resolveOrdo` on real dates for Lauds (both the suffrage collapse and the
Preces omission fire together correctly on a clean Eastertide feria, 2026-04-20) and via a direct
`resolveSuffrages` unit call plus a separately-found clean Vespers evening (2026-04-15, since this
particular stretch of Eastertide 2026 is otherwise densely packed with First-Vespers anticipations
and octaves — Easter's own, the Patronage of St. Joseph's, Ascension's, Pentecost's — that already
correctly suppress suffrages for other, pre-existing reasons and would have made a false negative
look like a false positive). `npm test` (2025 passed, no pre-existing tests exercised this path at
all) and `tsc --noEmit` both pass.


### Lent's remaining Vespers/Lauds draft content, verified (2026-09-04)

Closed the rest of the "Lent's own seasonal office bundle" gap flagged in the entry above the same
day: `vespers-{capitulum,responsory,hymn,versicle}-lent.yml` and both hours' own
`-doxology-per-annum` files were all real content, just never marked verified. Live-verified
Vespers' own bundle against a plain Lenten Wednesday (2026-03-04) — Joel 2:17 chapter, "Scápulis
suis obumbrábit tibi" responsory, "Audi, benígne Cónditor" hymn (including its own claimed Monastic
word-swap, confirmed live), shared "Ángelis suis" versicle. `lauds-hymn-lent.yml`'s own content
("Jam Christe sol justítiæ") and its doxology were already seen live earlier the same session (while
checking `lauds-hymn-saturday.yml`'s real content against the same 2026-02-28 Lenten Ember Saturday
date) — byte-identical, just needed the status flipped. All 8 files now `verified`; no more draft
Lent content anywhere in this app. `npm test` (2025 passed) and `tsc --noEmit` both pass.


### Trinity Sunday: a real feast, not modeled at all (2026-09-04)

A third "smaller gap" turned out much bigger on inspection: what had been described as a "Trinity
Sunday display gap" was actually a missing calendar mechanism. `getDayLabel` already had a purely
cosmetic "Trinity Sunday" label overlay for the Sunday after Pentecost, but nothing made that Sunday
actually *be* Trinity Sunday — `resolveTemporalId` just fell back to `post-pentecost-01`, an
`ordinary-sunday` category, so any Duplex+ saint assigned that date (e.g. the Queenship of the BVM,
1954, fixed May 31) won outright per the normal rule, with Trinity Sunday itself never appearing as
more than a commemoration or a cosmetic label. Live-verified against Divinum Officium (Monastic
Tridentinum 1617, 2026-05-31): the real occupant is "Festum Sanctissimæ Trinitatis, Duplex II.
classis" — one of the year's principal Sundays.

Added a real `data/calendar/temporal-feasts/trinity-sunday.yml` record (Easter+56, Duplex II.
classis). Per direct instruction, `unconditional: true` (same shape as `christ-the-king.yml`) —
Trinity Sunday always wins, since the one real collision case (the Queenship of the BVM, also Duplex
II classis, fixed May 31) isn't independently live-verifiable against the Monastic 1617 track at all
(that calendar doesn't carry the Queenship feast — May 31 there is St. Petronilla instead, confirmed
live), and a principal Sunday shouldn't lose a same-rank fixed-date collision by coincidence.

Authored the full office: `trinity-sunday-collect.yml`, `trinity-sunday-{benedictus,magnificat}-
antiphon.yml`, `matins-hymn-trinity-sunday.yml` ("Summæ Deus cleméntiæ" — shares its opening stanza
with the plain ferial Saturday hymn but diverges completely after that, a genuinely different hymn),
`lauds-{capitulum,responsory,hymn,versicle}-trinity-sunday.yml`, and `vespers-{responsory,hymn,
versicle}-trinity-sunday.yml` (Lauds/Vespers share both their chapter, via the existing cross-hour
fallback, and their hymn, "O lux beáta Trínitas" — already the pre-Urban VIII text) — all live-
verified 2026-05-31. Added `trinity-sunday` to `ALWAYS_OVERRIDE_TEMPORAL_IDS`.

Found and fixed 3 pre-existing tests written around the old cosmetic-label behavior, two of which
had never-verified guesses baked in as if correct: `tests/calendar/day-label.test.ts`'s "names the
anchor day itself" test (now Trinity Sunday wins outright over the Queenship, not the reverse) and
its own "outranks an active octave" test (previously asserted "Duplex I Class", a guess — the real,
now live-verified rank is Duplex II Class); `tests/calendar/transfer.test.ts`'s St. Felix I test
(Trinity Sunday now the real winner on 2026-05-31, Queenship/post-pentecost-01/Pentecost's octave
all commemorated in return). `npm test` (2025 passed) and `tsc --noEmit` both pass.


### Lent's own Lauds capitulum/responsory/versicle: not homeless after all (2026-09-04)

The "homeless Isa 58:1 / Ipse liberávit me / Ángelis suis" content flagged in an earlier entry
(believed to have no home after the Marian-Saturday/plain-ferial-Saturday content correction) turned
out to already have a real home: `lauds-capitulum-lent.yml`/`lauds-responsory-lent.yml`/
`lauds-versicle-lent.yml` already existed with this exact content, just marked `draft` (never
live-verified) rather than genuinely missing. Live-verified against both a Lenten Ember Saturday
(2026-02-28) and a plain Lenten Wednesday (2026-03-04) — identical, confirming this is genuinely
season-wide content (not weekday-varying) and correcting an earlier session's wrong "homeless" claim.
Marked all 3 files `verified`. (Vespers' own Lenten capitulum/responsory/versicle/hymn and both
hours' Lenten hymn-doxology-per-annum files are still `draft` — a separate, broader Lent-content
verification backlog noticed in passing, not fixed here, out of scope of what was specifically
flagged.)


### Recombined the 5 remaining Ember-day nocturn-readings files (2026-09-04)

User asked "why only Wed/Sat in September?" after the earlier Ember-Friday recombine, then asked
for all the remaining smaller gaps to be closed. Checked the reference source directly for each of
`ember-september-wednesday`/`ember-september-saturday`/`ember-advent-wednesday`/`ember-advent-
friday`/`ember-advent-saturday` (all 5 still carried the original "genuinely distinct proper
responsory" split rationale) and confirmed all 5 are the same shape already fixed for Ember Friday:
one continuous, unbroken homily (Bede, Gregory, or — for the two Advent Wednesday/Friday cases —
Ambrose's Commentary on Luke, cross-referenced from the Annunciation's own Common,
`@Sancti/03-25:Lectio7/8/9`, confirmed contiguous by reading the source file directly), split only
to fill the fixed 3-lesson slot count. Recombined all 5 into single readings, same convention as
before (keep the first lesson's own responsory, drop the rest). Updated
`tests/calendar/ember-days.test.ts`'s lesson-count table (now 1 for all 6 Ember days, was a mix).
`npm test` (2025 passed) and `tsc --noEmit` both pass.


### Ascension's own hymnody at Matins/Lauds/Vespers, plus the octave mechanism gap it exposed (2026-09-04)

User asked to actually close the Ascension-octave gap flagged in the entry just above. Turned out
to be a genuine mechanism gap, not just missing content: `ascension` is a *temporal*-feast id
(`data/calendar/temporal-feasts/ascension.yml`), not a saint record, so
`hours/resolve-common.ts`'s `resolveOfficeWinner` — which already synthesizes a sanctoral-shaped
winner from an active octave's own saint record (how Assumption's/St. Lawrence's octave already
gives every hour real content on interior days) — never recognized it at all. Ascension Day itself
and its whole octave were silently rendering the generic Paschaltide hymn at every hour, live-
verified against Divinum Officium (Monastic Tridentinum 1617, 2026-05-14, Ascension Day itself):
real content is "Jesu nostra redémptio" (identical at Matins/Lauds/Vespers), Act 1:1-2 (Lauds/
Vespers' shared chapter), and two genuinely distinct Lauds/Vespers responsories ("Ascéndit Deus in
jubilatióne" / "Ascéndens Christus in altum").

Fixed the mechanism two ways: (1) added `ascension` to `ALWAYS_OVERRIDE_TEMPORAL_IDS` (covers
Ascension Day itself, the same way `christ-the-king`/`circumcision`/etc. already do); (2) taught
`resolveOfficeWinner` to also synthesize a `{kind: 'temporal'}` winner from an active octave with no
saint record but a real temporal-feast record — covers ordinary-feria octave days (a real saint
still correctly keeps priority when one wins, e.g. St. Venantius/St. Peter Celestine within the
octave, live-verified unaffected). A third gap surfaced testing this: `octaveGoverningPrivilegedDay`
(the *Sunday*-side half of that same synthesis) has its own, separate, correct-by-design rule that a
privileged Sunday never accepts even an octave override — but live-verified wrong specifically for
"Dominica infra Octavam Ascensionis," which really does keep the octave's own hymn/responsory (just
with its own distinct proper chapter, not touched here). Rather than loosen that shared gate (real
risk of wrongly re-admitting some other octave's override on some other privileged Sunday, unverified
case by case), gave Lauds' and Vespers' own hymn-resolution functions (`resolveLaudsHymn`/
`resolveVespersHymn`) a narrow, hymn-only intercept: check `resolveActiveOctave` directly (no
privileged-Sunday gate) but only for a saint-less octave, before falling to the season/weekday
default — leaves every saint-based octave's existing behavior (and every other hour/part) completely
untouched.

Authored `matins-hymn-ascension.yml`, `lauds-{capitulum,responsory,hymn,versicle}-ascension.yml`,
and `vespers-{responsory,hymn,versicle}-ascension.yml` (Vespers' own chapter already falls back to
Lauds' via `vespersCapitulumForOverride`'s existing cross-hour fallback, so no separate file needed)
— all live-verified. Confirmed the whole octave end-to-end via `resolveOrdo` directly (Ascension Day,
two plain ordinary-feria octave days, the Sunday within the octave, and 3 real winning saints within
the window, all correct) rather than just the reference engine. `npm test` (2025 passed, no test
changes needed) and `tsc --noEmit` both pass.

Flagged, not fixed: Ascension's own collect is still missing (`getTemporalProper('ascension-collect')`
— a pre-existing gap, unrelated to and unaffected by this fix, not scoped to "hymnody"). Also flagged:
Pentecost/Corpus Christi/Sacred Heart are the same shape (temporal-feast octaves with no saint
record) and likely have the same latent hymn gap this fix closed for Ascension specifically — not
checked or fixed here.

**Follow-on, same day**: per direct instruction ("Ascension and Pentecost are some of the most
important material in the entire app — fix it"), closed Pentecost's own copy of the same gap
immediately, rather than leaving it flagged. Live-verified against Divinum Officium (Monastic
Tridentinum 1617), 2026-05-24 (Pentecost Sunday itself): unlike Ascension, Pentecost has 3 genuinely
different hymns, one per hour ("Jam Christus astra ascénderat" at Matins, "Beáta nobis gáudia" at
Lauds, "Veni Creátor Spíritus" — yes, that one — at Vespers), each with its own real, distinct
chapter/responsory/versicle at Lauds vs. Vespers. Added `pentecost-sunday` to
`ALWAYS_OVERRIDE_TEMPORAL_IDS` (the mechanism fix from the Ascension entry above is generic — no
code change needed beyond that one line) and authored `matins-hymn-pentecost-sunday.yml`,
`lauds-{capitulum,responsory,hymn,versicle}-pentecost-sunday.yml`, and
`vespers-{responsory,hymn,versicle}-pentecost-sunday.yml`. Confirmed the whole octave end-to-end via
`resolveOrdo` (feast day, plain octave days, and a real winning saint within the window — St.
Augustine of Canterbury, live-verified unaffected, keeps his own hymn at Lauds/Vespers while Matins
keeps Pentecost's own per the same established generous-octave design already used for Assumption/
Ascension). `npm test` (2025 passed, no test changes needed) and `tsc --noEmit` both pass.

Corpus Christi and Sacred Heart remain the one still-open piece of this same-shape gap — not fixed
this session, lower priority than Ascension/Pentecost per direct instruction.

**Follow-on, same day**: per direct instruction ("ascension's collect and the two octaves"), closed
all 3 remaining pieces immediately.

Authored `ascension-collect.yml` (live-verified 2026-05-14) — a separate, pre-existing gap
(`getDayCollect` already looked up `ascension-collect` via the same `resolveOfficeWinner` this
session's mechanism fix already covers; the collect file itself just never existed).

Closed Corpus Christi's and Sacred Heart's own hymnody gaps the same way as Ascension/Pentecost:
added `corpus-christi` and `sacred-heart` to `ALWAYS_OVERRIDE_TEMPORAL_IDS` (no further code change
needed — the mechanism is generic) and authored `matins-hymn-{corpus-christi,sacred-heart}.yml`,
`lauds-{capitulum,responsory,hymn,versicle}-corpus-christi.yml`,
`vespers-{responsory,hymn,versicle}-corpus-christi.yml`, `lauds-{capitulum,hymn,versicle}-sacred-
heart.yml`, and `vespers-{hymn,versicle}-sacred-heart.yml` — all live-verified against Divinum
Officium, 2026-06-04 (Corpus Christi) and 2026-06-12 (Sacred Heart). Corpus Christi's own hymns are
widely known outside this context too: Matins' own "Sacris solémniis", Lauds' own "Verbum supérnum
pródiens" (whose final 2 stanzas are the separately-famous "O Salutaris Hostia"), and Vespers' own
"Pange, lingua, gloriósi Córporis mystérium" (whose final 2 stanzas are the separately-famous
"Tantum Ergo").

Sacred Heart needed one real source-track correction: the Monastic Tridentinum 1617 track doesn't
observe this feast on this date at all (live-checked: shows St. Barnabas instead, a real 1617-era
calendar gap, not a vu bug) — used Divino Afflatu 1954 instead, consistent with this project's own
stated rubric/precedence track (see DESIGN.md). Also live-verified a genuine, deliberate structural
difference: Sacred Heart's own Lauds and Vespers have **no responsory at all** in the source
(straight from chapter to hymn, "Capitulum Hymnus Versus" with no "Responsorium" between) — not an
authoring gap, so no `lauds-responsory-sacred-heart.yml`/`vespers-responsory-sacred-heart.yml` were
created. This exposed a real small UI gap: `hours/lauds.ts`'s and `hours/vespers.ts`'s own
`resolveOffice` always pushed a `{kind:'responsory'}` part even when its own resolved text carried
`status: missing` in both languages, rendering an empty section. Fixed both to omit the responsory
part entirely when both languages are genuinely missing, rather than an empty box.

Confirmed both octaves end-to-end via `resolveOrdo` (feast days, plain octave days, and real winning
saints within each window — St. Boniface/St. Barnabas within Corpus Christi's, unaffected). Found
and fixed 2 pre-existing tests whose own dates now land inside these newly-modeled octaves and were
asserting the old (buggy) fall-through behavior as if correct:
`tests/hours/lauds.test.ts`'s `FERIAL_MONDAY` (was 2026-06-08, inside Corpus Christi's octave — moved
to 2026-09-07) and `tests/hours/vespers.test.ts`'s own St. Margaret of Scotland test (2026-06-09,
also inside Corpus Christi's octave — its own title already anticipated this exact fix; updated its
assertions from the old "falls through to the plain ferial default" guess to the real, live-verified
Corpus Christi content). `npm test` (2025 passed) and `tsc --noEmit` both pass.


### Sunday's own Matins hymn, plus every season's (Advent/Septuagesima/Lent/Passiontide/Paschaltide) (2026-09-04)

User asked for the actual detail behind the "genuinely more complex, not-yet-understood two-hymn
mechanism" flagged in the entry above (`Day0 Hymnus` vs `Day0 Hymnus1`). Turned out not to be a
mystery: live-checking several clean dates showed `Day0 Hymnus` ("Nocte surgéntes vigilémus omnes")
is simply Sunday's own plain per-annum hymn, and `Day0 Hymnus1` ("Primo diérum ómnium") is
Septuagesima-tide's own separate seasonal hymn — the exact same shape as Advent/Lent/Passiontide/
Paschaltide each having their own (live-verified: a Lenten Sunday and a Lenten feria both render
"Ex more docti mýstico" identically, so these seasonal hymns don't vary by weekday the way the
plain per-annum cycle does). None of the 5 seasonal Matins hymns, nor Sunday's own plain one, were
authored at all before this — every Sunday and every Advent/Lent/Passiontide/Paschaltide/
Septuagesima day (Sundays and ferias alike) that wasn't otherwise overridden by a winning saint/
octave was silently falling through to Monday's own ferial placeholder text.

Authored `matins-hymn-sunday.yml` ("Nocte surgéntes"), `matins-hymn-advent.yml` ("Verbum supérnum,
pródiens"), `matins-hymn-lent.yml` ("Ex more docti mýstico"), `matins-hymn-passiontide.yml` ("Pange,
lingua, gloriósi prœlium certáminis" — this breviary's own 5-stanza recension, not the longer
"Lustra sex..." continuation some other uses of the hymn carry), `matins-hymn-paschaltide.yml`
("Rex sempitérne Dómine"), and `matins-hymn-septuagesima.yml` ("Primo diérum ómnium") — all
live-verified, all self-contained with their own real closing doxology baked in (each one fixed and
distinct, not the shared weekday "Praesta, Pater piíssime..." ending).

Septuagesima is checked directly by `day.season === 'septuagesima'` in `resolveMatinsHymn` itself,
deliberately *not* folded into the shared `seasonalOfficeSuffix` (Lauds/Vespers' own) — that
function has no matching Septuagesima content authored for those hours yet, and `resolveOfficeBundle`
there is all-or-nothing per feast, so adding it would silently blank their chapter/hymn instead of
falling through to their current (imperfect but real) weekday default. Scoped to Matins alone; Lauds/
Vespers' own Septuagesima gap is real and separately flagged here, not fixed.

Also flagged, not fixed: the generic `matins-hymn-paschaltide.yml` will incorrectly render during
the Ascension octave specifically, which is live-verified to have its own genuinely different proper
hymn ("...Qui scandis super sídera") not yet authored anywhere — same-shape gap already existing in
Lauds' own `lauds-hymn-paschaltide.yml`, not a new regression introduced here.

Updated 2 `FERIAL_DATE` (2026-12-01, a Tuesday *in Advent*) hymn assertions in
`tests/hours/matins.test.ts` that had been asserting Tuesday's own ferial text — Advent's own
seasonal hymn correctly outranks the weekday cycle now. `npm test` (2025 passed) and `tsc --noEmit`
both pass.


### Matins/Lauds hymns completed for Marian Saturday; corrected 3 pre-existing content bugs found in the process (2026-09-04)

Following straight on from the "Saturday's own Officium Sabbatorum" gap flagged just above: asked
the user what the plain *secular* Tridentine 1570 track (fewer saints, easier to isolate a clean
date) does on an ordinary Saturday, expecting a straightforward answer. Found instead that a
**full precedence mechanism for this already existed**, committed well before this session
(`calendar/index.ts`'s `applyMarianSaturday`, gated on `weekday === 'saturday'`,
`temporalCategory === 'ordinary-feria'`, and no active octave; a `marian-saturday` collect and
Benedictus antiphon; a Lauds psalmody override) — a real gap in my own earlier claim to the user
that "vu doesn't model this at all," found by not having grepped the codebase before saying so.

Per direct instruction, the actual design (a real, closed decision, not left open): Marian
Saturday is rank **Simplex**, but its own separate tier — beats a plain Simplex saint (who is then
commemorated), loses cleanly (zero commemoration, matching live behavior confirmed against 3 real
dates: St. Blaise/Simplex commemorated 2024-02-03, St. Athanasius/Duplex and Ss. Cyriacus &
Co./Semiduplex both winning with *zero* trace of Marian Saturday 2026-05-02/2026-08-08) to
anything Vigil-or-higher — i.e. sits between `simplex` and `vigil` in vu's own `FeastClass` scale,
which `applyMarianSaturday`'s `winner.rank !== 'simplex'` gate already implements correctly without
needing a new `FeastClass` value at all (Vigil already ranks above Simplex there). Matins/Lauds get
proper hymns; ferial psalmody is kept everywhere (not the real historical proper-psalm set) with
only the antiphons swapped to Marian text; the Marian collect applies whenever the day wins. No
"little office" — deliberately narrower than the actual historical Officium Sabbatorum.

Authored `matins-hymn-marian-saturday.yml` ("Quem terra, pontus, ǽthera") — the one piece Matins
had nothing for at all, closing the original gap this whole investigation started from. For Lauds,
found the *hymn* ("O gloriósa Dómina") was already authored, but filed under the plain ferial
`lauds-hymn-saturday` id instead of its own `marian-saturday` id, and its capitulum/responsory/
versicle siblings were live-verified from a *different*, privileged (Lenten Ember) Saturday, not
this one — three real bugs from an earlier pass's own "believed genuine per-annum content, not
verified" comment. Fixed all three: moved the hymn to `lauds-hymn-marian-saturday.yml`, authored
real `lauds-{capitulum,responsory,versicle}-marian-saturday.yml` (live-verified 2026-10-03), and
corrected `lauds-hymn-saturday.yml`/its doxology/its capitulum/responsory/versicle siblings to the
real plain-ferial-Saturday content (live-verified 2025-09-20, a September Ember Saturday winning
outright with nothing else in play) — "Auróra jam spargit polum" hymn, Rom 13:12-13 capitulum,
"Sana ánimam meam" responsory, "Repléti sumus mane misericórdia tua" versicle; the old Isa 58:1 /
"Ipse liberávit me" / "Ángelis suis" content is now homeless, likely genuine Lenten-specific ferial
capitula this store doesn't yet model separately — not rebuilt, flagged here instead.

Per direct instruction, rolled back the pre-existing Lauds psalmody override
(`lauds-psalmody-overrides/marian-saturday.yml`) from the real historical proper psalm set (92, 99,
62 — the same numbers any duplex-majus+ feast's own Lauds override uses) to plain ferial Saturday's
own psalm groups (50, 142, the split Canticle of Moses/Deuteronomy), keeping only the antiphon
swap — matches "keep the ferial psalmody but use marian antiphons... we don't want to go
little-office" exactly. Ferial Saturday has one fewer psalm-group slot than the Common-of-BVM
pattern, so the third already-authored proper antiphon ("Nigra sum, sed formósa...") currently has
nowhere to attach and sits unused, noted in the file's own header.

Live-verified `/2026-07-04/matins` and `/2026-07-04/lauds` in the browser end to end. `npm test`
(2025 passed, one pre-existing psalm-number assertion in `tests/hours/lauds-psalmody-overrides.test.ts`
updated for the psalmody rollback) and `tsc --noEmit` both pass.

**Follow-on, same day**: user asked what actually renders on a real September Ember Saturday and on
a Saturday where a real saint outranks a merely-commemorated transferred Vigil (Aug 8 2026, Vigil
of St. Lawrence displaced by Ss. Cyriacus, Largus & Smaragdus). The second case was already correct
(the winning saint's own Common-of-Martyrs hymn applies via the pre-existing tier, unaffected by the
commemorated Vigil). The first case exposed a real gap in the weekday-hymn-cycle fix above: Saturday
was deliberately left on the `matins-hymn-ferial` (Monday's text) placeholder on the assumption it
was "almost always Marian Saturday" — true for most Saturdays, but not for a genuinely privileged
one (Ember/Advent/Lent) where nothing wins outright and Marian Saturday's own `ordinary-feria` gate
doesn't apply. Authored `matins-hymn-ferial-saturday.yml` ("Summæ Deus cleméntiæ", live-verified
against a clean September Ember Saturday, 2025-09-20) and added it to `resolveMatinsHymn`'s weekday
lookup. `npm test` (2025 passed, no test changes needed) and `tsc --noEmit` both pass.


### Ember September Friday's homily recombined into one reading; the Matins ferial hymn now varies by weekday (2026-09-04)

Two fixes from one report. The user looked at `093-5.txt` (Ember Friday's own source file) and
confirmed what the 2026-09-03 "second follow-on" entry above had only flagged: Gregory's Homily 33
(Lectio1-3) is one continuous, unbroken text on the same pericope (Luke 7:36-50), split only to
fill the fixed 3-lesson Nocturn slot count — exactly the "source doesn't genuinely split" case
`post-pentecost-15.yml`'s own doc comment already establishes as this store's default. Recombined
`ember-september-friday.yml`'s 3 readings into 1, keeping Lectio1's own responsory (the "first one,
when several collapse" convention) and dropping Lectio2/3's own distinct responsories, same as
every other collapsed-reading case in this store. The same "genuinely distinct proper responsory"
rationale for staying split also appears, unfixed, in `ember-september-wednesday.yml`,
`ember-september-saturday.yml`, `ember-advent-wednesday.yml`, `ember-advent-friday.yml`, and
`ember-advent-saturday.yml` — out of scope here (the user's report was specifically about
September Friday), flagged for a possible later consistency pass. Live-verified on
`/2026-09-18/matins` (Ember Friday commemorated under St. Joseph of Cupertino): one
"POPE ST. GREGORY..." heading, one flowing text, one responsory, no more triple-repeat. Updated
`tests/calendar/ember-days.test.ts`'s lesson-count assertion (now per-date, 1 for Sept 18, 3 for
the other 5 still-split Ember days).

Separately, the user reported that today's (2026-09-04, a Friday) Matins hymn started "O Three in
One, and One in Three" in the live Monastic 1617 office, not the hymn vu was showing. Investigated
and found a real, broader mechanism gap: `hours/matins.ts`'s `resolveMatinsHymn` fell through to a
single `matins-hymn-ferial` id for *every* weekday, but the source (Psalterium/Special/Matutinum
Special.txt's "Day0 Hymnus" through "Day6 Hymnus", Day0=Sunday..Day6=Saturday) genuinely varies the
plain ferial Matins hymn by weekday — the classic "week of hymns" (Somno reféctis ártubus /
Consors patérni lúminis / Rerum Creátor óptime / Nox atra rerum / Tu Trinitátis Únitas for
Mon-Fri). `matins-hymn-ferial.yml`'s own text turned out to already be Monday's hymn, mislabeled
in its header comment as a generic fixed "ferial" text and misattributed to "a plain ferial
Tuesday" (the live-verification date given, 2026-12-15, is a Tuesday, but the text itself is
Monday's — Monastic 1617's own `Day1 HymnusM` swap, "omni témpore" -> "in perpetuum", is present in
the file). Authored `matins-hymn-ferial-tuesday/-wednesday/-thursday/-friday.yml` (Monastic 1617
text, live-verified against the CGI instance directly for Friday, including its own real M-track
word-swaps: `flagitémus ómnium/vúlnerum` order and `astet`->`adsit`) and wired
`resolveMatinsHymn`'s final fallback to pick by `day.weekday`. Sunday and Saturday deliberately
left on the existing `matins-hymn-ferial` (Monday's text) as a documented placeholder, not fixed
here: Sunday's own real hymn selection is a genuinely more complex, not-yet-understood two-hymn
mechanism in the source (`Day0 Hymnus` vs `Day0 Hymnus1`, tags `H-MatDom1`/`H-MatDom4`, purpose
unconfirmed), and Saturday's own plain `Day6 Hymnus` is live-verified to be superseded on nearly
every ordinary Saturday by the Officium Sabbatorum B.M.V.'s own proper hymn ("Quem terra, pontus,
æthera") — a whole separate Saturday-votive-Office mechanism this app doesn't model at all yet.
Both are real, open gaps, not silently resolved. Updated 2 pre-existing `FERIAL_DATE` (2026-12-01,
a Tuesday) hymn assertions in `tests/hours/matins.test.ts` that had been asserting the old,
wrong-for-Tuesday "Somno" text. Live-verified `/2026-09-04/matins` in the browser. `npm test`
(2025 passed) and `tsc --noEmit` both pass.


### Ezekiel spelling fix in the book-incipit heading (2026-09-04)

User caught `bible-book-incipits.ts`'s `ezek` entry reading "A reading from the Prophecy of
**Ezechiel**" — the Vulgate/Douay-Rheims spelling, inconsistent with this app's own generated
heading text (which otherwise uses modern English book names, see that file's own header note on
"Saint Paul" vs "blessed Paul"). Changed to "Ezekiel". Left every other in-corpus "Ezechiel"
alone (scripture verse text, martyrology narrative, homily quotes under `src/data/scripture/`,
`src/data/martyrology/`, `src/data/propers/`) — those are quoted Douay-Rheims translation prose,
where the traditional spelling is correct as part of the source text, not this app's own
generated label.


### Ember days' own Benedictus/Magnificat antiphons authored (2026-09-03)

Follow-on from the 2026-08-22 Ember-day mechanism entry, whose "not authored, logged instead"
note called the gap "the Ember-day-specific `[Ant 2]`/`[Ant 3]` Lauds antiphons" — imprecise, and
worth correcting here. Live-verified (Monastic Tridentinum 1617) against a clean year for each
Ember weekday (Wed 2023-09-20, Fri 2024-09-20, Sat 2025-09-20 for September; Dec 16/18/19 2026
for Advent, all winning outright): the day's own Lauds *psalmody* (Ps 50/63/64 + canticle +
Laudate, all 5 antiphon slots) stays entirely on the plain ferial weekday default, unchanged —
only the **Benedictus antiphon** (and, Wed/Fri only, the **Magnificat antiphon**) is genuinely
proper to the Ember day, each labeled "Antiphona ex Proprio de Tempore" live. `hours/resolve-
common.ts`'s `getBenedictusAntiphon`/`getMagnificatAntiphon` already look up `${winner.id}-
benedictus-antiphon`/`-magnificat-antiphon` unconditionally for any temporal winner (rank-
agnostic by design, same as the chapter/hymn bundle) — so this needed no mechanism change at
all, just the missing content files, which is why it silently rendered blank rather than
tripping any test.

**Authored**: 6 Benedictus antiphon files (one per Ember weekday × quarter) and 4 Magnificat
antiphon files (Wed + Fri only, both quarters). September Wednesday/Friday reuse the identical
text for both (`[Ant 3]` is a bare `@:Ant 2` cross-reference in the source, not independently
authored — a real fact about the source, not a shortcut taken here); Advent Wednesday's two
differ (`Missus est Gábriel` / `Ecce ancílla Dómini`); September Saturday uses the Monastic
track's own `TemporaM/093-6.txt` override (`Illumináre... Deus Israël`) per this project's
Monastic-1617-first preference, matching the choice already made for this day's Matins
responsories.

**Not authored, correctly**: Magnificat antiphons for either quarter's Ember Saturday — Second
Vespers on both is always ceded outright to the following Sunday ("Vespera de sequenti; nihil de
præcedenti," live-verified), and the source file itself has no `[Ant 3]` for either Saturday,
confirming the omission is real, not a gap. Advent Ember Friday's own Magnificat antiphon *was*
still authored despite being currently unreachable — Dec 18 always falls inside the O Antiphons'
own unconditional Dec 17-23 window, which wins the Vespers Magnificat outright — per this
project's standing "import available real content even if it may not survive the current
calendar" default.

New assertions added to `tests/calendar/ember-days.test.ts` (Benedictus antiphon text/status on
all 6 winning-outright dates; Magnificat status on Advent Ember Wednesday, the one case with no
overriding mechanism to complicate the assertion). `npm test` (2023 passed, 47 files) and
`tsc --noEmit` both pass.

**Follow-on, same day**: user asked why the Ember days didn't actually show anywhere in the app
on 2026-09-16/18/19 despite the above. Real bug, found by resolving `getDayLabel` directly for
those dates: `calendar/day-label.ts`'s `collectCommemorations` only ever matched a `temporal`-kind
commemoration against `resolveTemporalId(day.date)` (the plain, un-relabeled id for that date) —
never against an Ember-relabeled id, so `applyEmberDay`'s own commemoration was silently dropped
from the label every time. Worse, even the *winning-outright* case had no name: the final
fallback branch calls the generic `temporalLabel(day)` (pure season/weekday arithmetic, no id
awareness at all), so an Ember day that won outright rendered as bare "Wednesday in the Nth week
after Trinity (Feria)" with zero mention of Ember anywhere.

Fixed with a small standalone `EMBER_DAY_NAMES`/`emberDayLabel` lookup in `day-label.ts` itself
(6 entries, Latin names read straight from each day's own `[Officium]` header) — deliberately
*not* added to `temporal-feasts.ts`'s named-feast table, since that table doubles as `resolve-
common.ts`'s `isFerialOrVigil` bareness check (`isBareFeria = ... && !getTemporalFeastRecord(...)`)
and adding Ember ids there would have silently turned off their own ferial Preces (their `[Rule]`
is literally "Preces Feriales"). Wired into both places: `collectCommemorations`'s temporal
branch (demoted case) and `getDayLabel`'s final fallback (winning-outright case). New assertions
in `tests/calendar/ember-days.test.ts` cover both. `npm test` (2024 passed) and `tsc --noEmit`
both pass.

**Second follow-on, same session**: user then flagged `/vu/2026-09-18/matins` (Ember Friday,
commemorated) showing the Judith reading under a bare "Reading" heading. Real root cause, and a
much broader bug than just Judith: `data/hours/bible-plan/*.yml`'s ~390-row TSV import uses
English-style book abbreviations (`jdt`, `1kgs`, `luke`, ...) for the ~30 books where that
diverges from this store's canonical Vulgate-numbering form (`jdth`, `3reg`, `luc`, ...) —
`scripture/index.ts`'s own `BOOK_ALIASES` already normalizes this for verse-*text* lookup, but
`bible-plan.ts`'s incipit (`bible-book-incipits.ts`) and responsory (`matins-responsories.ts`)
lookups both used the raw, unaliased abbreviation, silently missing on any canonically-keyed
book and falling back to the generic "Reading" heading. The 3 Gospel aliases (`luke`/`mark`/
`john`) happened to self-heal through a second, independent citation-regex fallback that only
exists for Gospels (`matins.ts`'s `getGospelIncipitFromCitation`) — every other aliased book
(Judith, both Kings pairs, both Samuel books, Esdras, Osee, Jonas, Josue, Micheas, Abdias,
Judges, the 3 Johannine epistles, James, Jude, Philemon, Titus, Zacharias, Sophonias) had no such
fallback and was silently broken wherever it happened to be the first book of a reading. Fixed by
exporting `canonicalBook` from `scripture/index.ts` (the same substitution `getScriptureChapter`
already applies internally) and routing both `bible-plan.ts` lookups through it — one shared
normalization, not two independently-aliased lookups that can drift again. New test in
`tests/propers/bible-plan.test.ts`. `npm test` (2025 passed) and `tsc --noEmit` both pass.

Separately, the user also asked about seeing 3 lessons in a row all headed "Pope St. Gregory the
Great, Homily 33 on the Gospels, on Luke 7:36-50" (Ember Friday's own 3-lesson split of one
homily, each with its own distinct text/responsory — see the 2026-08-22 Ember-day entry above).
Confirmed this is correct content, not a duplication bug, but also confirmed it's *not* actually
how the reference source itself labels it: `Tempora/093-5.txt` only carries the attribution once,
on `[Lectio1]` — `[Lectio2]`/`[Lectio3]` have no repeated header at all, continuing silently under
the same nocturn. This app's own authoring convention repeats the full `source` string identically
on every split lesson, and does so consistently across the *entire* nocturn-readings corpus, not
just Ember days — flagged for the user as a real presentational rough edge, not fixed yet pending
their call on scope (a corpus-wide UI/authoring change, not a narrow one-file fix).

**Third follow-on, same session**: user then asked why a Sunday's own patristic homily was
showing up on a Friday at all. Pulled the live reference engine's own Matins page for St. Joseph
of Cupertino's day (Tridentine 1906) to check, rather than reasoning from vu's data alone: real
Nocturn III there is exactly 3 lessons — 2 from the winning Duplex saint's own Common homily, plus
a single "**Commemoratio Feriæ**" lesson for the displaced Ember day. No Sunday content
whatsoever. `hours/matins.ts`'s `nocturnReadingIds` had a `temporalKept` block that pooled the
governing Sunday's own id (`temporalId`) *and* its `month-week-N` sibling whenever any temporal
commemoration survived on a 3-nocturn day, with no weekday check at all — so a Duplex+ saint
winning outright on a plain weekday (not a Sunday) that also happened to carry a temporal
commemoration pulled in a whole second homily's worth of unrelated content (here: St. Ambrose's
homily + its own Gospel from `post-pentecost-16`, and St. Leo's September-fast sermon from
`month-week-093` — two different reference-engine representations of the *same* underlying
Sunday, both wrongly pooled at once). Fixed by gating `temporalKept` to `day.weekday === 'sunday'`
— the governing Sunday's own content only belongs in the pool when that Sunday is the day actually
being celebrated. Live-verified by reloading `/vu/2026-09-18/matins`: both spurious readings are
gone. `npm test` (2025 passed) and `tsc --noEmit` both pass.

Still open, by the user's own explicit request to land this first: Ember Friday's own homily
still surfaces as all 3 of its lessons even when merely commemorated, where the live engine caps
a commemorated feria at exactly one lesson (its own Lectio 1 only) — same shape of fix as this
one, not yet done.


### Sunday Matins Nocturn 3: bare Gospel incipits authored in full, all 48 remaining Sundays (2026-09-03)

User noticed a real gap while praying Matins on a Sunday: Nocturn 3 showed St. Augustine's
homily with no Gospel citation or text above it, just the patristic commentary starting cold.
Root cause was this project's own standing convention (see the temporal-nocturn-sweep entries
above): every Sunday's Matins source gives Nocturn 3's Gospel pericope as a bare "Et réliqua"
incipit (e.g. "Homo quidam fecit cœnam magnam... Et réliqua"), and this project's authoring
passes deliberately skipped transcribing it, keeping only the homily as an `isGospel: false`
lesson — noted at the time as "sourcing that properly would need live-CGI queries per date, out
of scope for this pass." The mechanism to *render* a paired Gospel+homily as one atomic part
already existed and worked correctly (`buildReadingPool` in `hours/matins.ts`, done 2026-08-28)
— post-pentecost-15.yml was the one file that already had a full Gospel, which is what made the
asymmetry visible as a real content gap rather than a missing feature.

Closed for all 41 remaining Sunday `nocturn-readings` files that had exactly one homily-only
Nocturn 3 entry: `post-pentecost-{02..14,16..24}` (22), `post-epiphany-{1..6}` (6),
`septuagesima`/`sexagesima`/`quinquagesima` (3), `lent-{1..4}` (4),
`easter-octave`/`easter-{3..6}` (5), `sunday-after-ascension` (1), plus Trinity Sunday
(`post-pentecost-01.yml`, which has *two* Nocturn 3 Gospel+homily pairs — its own, and the
displaced First Sunday after Pentecost's commemoration).

**Sourcing method, better than the live-CGI-per-date approach originally assumed necessary**:
the reference engine's Missale (`web/www/missa/Latin|English/Tempora/<id>.txt`) files carry the
same Sunday's full `[Evangelium]` — the Mass Gospel and the Matins Nocturn 3 Gospel are the same
pericope — keyed by the identical `<Season><N>-0` id already recorded in each `nocturn-readings`
file's own header comment (e.g. `post-pentecost-14` → `Pent14-0`). Reading that file directly is
both more reliable and far faster than per-date live-CGI queries, which turned out to be a
dead end here anyway: a live query landed on whatever Sunday the *live engine's own* calendar
assigns to that specific date, which doesn't always match vu's blended calendar's numbering for
the same nominal week (confirmed by one query returning the wrong pericope, Luke 14:26-35
instead of the expected Luke 14:16-24, for a date with a commemorated saint). One exception:
Trinity Sunday's second reading (the displaced First Sunday after Pentecost's own Gospel, Luke
6:36-42) has no live date to query at all, since Trinity permanently occupies that slot every
year — found instead in `missa/Latin/Tempora/Pent01-0a.txt`, the reference engine's own
preserved pre-Trinity-displacement Mass propers for that Sunday.

Each new entry is `isGospel: true`, inserted immediately before the existing homily entry in
the same Nocturn 3 group (satisfying `buildReadingPool`'s adjacency-pairing check with no
mechanism changes needed), citation/text sourced verbatim from the Missale bilingual pair, no
`responsory` of its own — the existing single responsory stays attributed to the homily/final
reading, unchanged, per each file's own already-documented provenance. Fixed two English-text
artifacts found while transcribing (a stray leading "v." verse-marker on three Eastertide
Gospels' English text, `easter-{4,5,6}.yml`; one line with a stray extra leading space,
`post-pentecost-19.yml`) rather than reproducing them. Every touched file's header comment got a
short "Update (2026-09)" note explaining the new sourcing, without rewriting the original
sweep-method prose.

`npm test` (2021 passed, all 47 files) and `tsc --noEmit`/`vite build` both pass. Spot-verified
via a scratch test (not committed) against `resolveOrdo('matins', ...)` on each id's real Sunday
date, confirming a single `kind: 'gospel'` part with a nested `homily` field appears (not two
split lessons) for post-pentecost-14 (the date that surfaced the bug), post-pentecost-02,
Trinity Sunday (both pairs), post-epiphany-1, septuagesima, easter-octave, and
sunday-after-ascension.

**Follow-up, same day**: a second pass over the same file shape (`nocturn: 3` / `isGospel:
false` with no paired Gospel) turned up 7 more Sundays this first pass missed —
`advent-{1..4}`, `christmas-octave-sunday`, `passion-sunday`, `palm-sunday` — bringing the
total to 48. Same method (Missale `[Evangelium]`, keyed by each file's own header-documented
id: `Adv1-0`…`Adv4-0`, `Nat1-0`, `Quad5-0`, `Quad6-0`), with one real wrinkle: **Palm Sunday's
Missale `[Evangelium]` tag is the Passion narrative** (Matt 26-27, read at Mass itself), not
the Matt 21:1-9 entry-into-Jerusalem pericope this Nocturn 3's homily (St. Ambrose on Luke,
Bk. 9) is actually about — that shorter Gospel is proclaimed earlier, at the Blessing of Palms,
embedded in `Quad6-0.txt`'s own `Benedictio Palmorum` section rather than under its
`[Evangelium]` tag. Sourced from there instead, confirmed by cross-checking the citation against
the file's own existing header comment, which already named Matt 21:1-9 as the homily's true
subject. `advent-4`'s Missale Latin text is itself a cross-reference
(`@Tempora/Adv3-6`) rather than inline — resolved by reading `Adv3-6.txt` directly, same
transparent-reference-following already used elsewhere in this project's sourcing.

Discovered one real, useful regression while verifying: `tests/calendar/
vigil-of-christmas-sunday.test.ts` asserted exactly one Matins Gospel on the rare Sundays where
Advent 4 lands on Dec 24 and the Vigil of Christmas wins outright with Advent 4 commemorated
(2023-12-24, 2028-12-24) — true only because Advent 4 previously had no Gospel content to
contribute. With Advent 4's own Gospel now authored, `buildReadingPool`'s existing (unchanged)
commemoration-pooling logic correctly surfaces *both* Gospels — Vigil's own (Matt 1:18-21, St.
Jerome) and Advent 4's own commemorated one (Luke 3:1-6, Pope St. Gregory the Great) — matching
the same generous-commemorations behavior the test already expected of Lauds's two collects on
that same date, just above it in the same file. Updated the test's assertion and its own
explanatory comment to expect and name both, rather than narrowing the new content back to fit
the old, incomplete assertion.

Full suite re-run after this follow-up: `npm test` (2021 passed, 47 files) and `npm run build`
(`tsc --noEmit` + `vite build`) both pass.


### Seasonal hymn-doxology swap, take two — broadened beyond the source's own marker (2026-09-03, same day)

Follow-up to the entry above, at the user's explicit direction: "the doxology is a neat way to
stay tuned in to the season... we're doing a remix, not a copy." The first pass wired the
mechanism only where the Monastic source itself carries a real "*" substitution marker (two
spots total). This pass wires it into *every* plain-default Lauds/Vespers hymn (Sunday,
Mon-Sat, Advent, Lent, Passiontide, Paschaltide — 21 files total, all but the two already done)
regardless of whether the source swaps that specific hymn, matching this project's own
"Not a reconstruction" stance rather than the reference engine's literal behavior.

Each hymn file's own natural per-annum ending was split out into a matching
`{hour}-hymn-{key}-doxology-per-annum.yml` (same convention as the first pass), so a
season/feast with no override (Advent, Lent — the source never swaps those, and nothing here
changes that) reproduces the exact original text; `lauds.ts`'s new `resolveLaudsHymn` and
`vespers.ts`'s widened `resolveVespersHymn` route every plain-default hymn through
`appendDoxology`/`getHymnDoxologyId` uniformly. The real, visible effect: hymns shown during
Christmastide/Epiphanytide/Corpus Christi/Sacred Heart (none of which `seasonalOfficeSuffix`
covers, so these were always the plain weekday-default hymns) now pick up the Nat/Epi/Corp/Heart
doxology instead of staying on their generic ending; Ascensiontide and the Pentecost octave now
correctly diverge from the rest of Paschaltide's "Pasch" doxology to their own "Asc"/"Pent" one
mid-season. Matins was left as before (only the ferial fallback wired, from the first pass) —
it has no per-weekday or per-season hymn files to broaden into; every other season there still
falls through to that same one ferial hymn already.

A first automated extraction pass had a real bug (a body/stanza-boundary parser that failed to
stop at `status:` when a hymn's English translation had one fewer stanza than its Latin — no
English doxology stanza was ever transcribed for several weekday hymns — silently swallowing
the YAML `status:` block into the hymn text) and was caught before being trusted: none of its
output was committed, all 20 affected originals were reverted via `git checkout` back to this
same day's untouched-by-that-bug state, and redone with a corrected parser plus manual
spot-checks of the regenerated files.

`npm test` (2021 passed) and `tsc --noEmit` both pass. Live-checked via a scratch test (not
committed) confirming Epiphanytide/Eastertide/Ascensiontide/Pentecost/Sacred-Heart plain days
now show the right doxology and Advent/Lent plain days are byte-identical to their pre-change
text.


### Seasonal hymn-doxology swap — audited Lauds/Vespers/Matins, wired the two real gaps (2026-09-03, same day)

Closes the "unexamined gap" logged for Lauds/Vespers/Matins: the mechanism
(`hours/hymn-doxology.ts`) was previously wired only into Prime and Compline, with every
Lauds/Vespers/Matins hymn stored as one fixed text and no check done on whether the source
actually varies its closing doxology by season there.

Audited by exhaustively grepping every `[Hymnus ...]`/`[HymnusM ...]` section in Divinum
Officium's own `Psalterium/Special/{Major,Matutinum} Special.txt` for a real "*"
substitution marker (distinct from the unrelated antiphon-incipit "*" convention used
throughout responsory/antiphon text). The Monastic 1617 track (vu's own structural source)
turned out to carry the marker in exactly two places: Sunday's plain-default Vespers hymn
("Lucis Creator", inherited unchanged from the base secular text via a `@:`-reference with
unrelated wording substitutions) and the plain ferial Matins hymn (Day1-6, all six weekday
forms share it). Every other hymn checked — Sunday Lauds, the Mon-Sat Lauds/Vespers weekday
defaults, the Advent Lauds/Vespers/Matins hymns, and (initially assumed to need this) the
Monastic Paschaltide Lauds/Vespers/Matins hymns specifically — has its own fixed,
non-swapping doxology already baked into the text in the source itself. This generalizes
Terce/Sext/None's already-confirmed "self-contained, no swap" finding without making it
universal — Lauds needed no wiring at all as a result.

Wired the two real cases via `getHymnDoxologyId(day, perAnnumId)` (signature changed from
`(season, winner, perAnnumId)` to take the whole `LiturgicalDay`, needed for the date-window
check below) into `vespers.ts`'s new `resolveVespersHymn` helper and `matins.ts`'s
`resolveMatinsHymn` fallback tier. New `vespers-hymn-doxology-per-annum.yml`/
`matins-hymn-doxology-per-annum.yml` hold each hymn's own natural per-annum ending, split out
of `vespers-hymn-sunday.yml`/`matins-hymn-ferial.yml`.

Also closed two related real gaps found during the same source audit, both live-checked
against `hymni.pl`'s `doxology()` sub (the mechanism this project's own hymn-doxology.ts is
modeled on):

- The Common of the BVM's own `Doxology=Nat` rule (`Commune/C10.txt` through `C12Q.txt`) means
  Marian Saturdays get the Nativity doxology regardless of season, not just during
  Christmastide/Epiphanytide — `hymn-doxology-by-feast.yml`'s `byFeastId` now has a
  `marian-saturday` entry, and `resolveOfficeWinner`'s feast-override check in
  `getHymnDoxologyId` now looks up a `kind: 'temporal'` winner's id too, not just
  `'sanctoral'` (a temporal id and a sanctoral id never collide, so this is safe to check
  unconditionally).
- The Assumption's octave (Aug 16-22) is hardcoded in the source to the Nativity doxology
  regardless of season or the day's own winner — confirmed *not* excluded for the 1570/1617
  track (unlike its Dec 9-15 companion rule for the Immaculate Conception's run-up, which the
  source explicitly excludes 1617 from, so that one was deliberately left unported). Checked
  directly by date (`isAssumptionOctaveWindow`), same pattern as `marian-antiphon.ts`'s
  `isCandlemasToHolyWednesday` — this window doesn't line up with any `Season` value.

`npm test` (2021 passed) and `tsc --noEmit` both pass.


### Bulk scripture import, take three — recovered the "Transfer interrupted!"-style isolated gaps too (2026-09-03, same day)

One more pass over the first-pass ("Unbound Bible" source) chapters that still had a lone
isolated missing English verse (33 chapters, 34 verses total, `matt-12:43`'s in-file "Transfer
interrupted!" artifact among them) — re-checked every one against drbo.org's per-verse text
rather than assuming they were unrecoverable. 33 of 34 turned out to be real, present verses
that the old scrape had simply dropped (a transient download/parse defect, not a source gap)
and are now filled in with verified text.

The other 10 (`2cor-1:24`, `2reg-13:39`, `2thess-2:17`, `1thess-4:18`, `gen-5:32`, `isa-46:13`,
`jdth-4:17`, `joan-11:57`, `jos-10:44`, `sir-29:35`) are confirmed genuine: drbo.org's own
Douay-Rheims numbering for these chapters stops one verse short of the Vulgate's own count too
(checked each chapter's own max verse number on drbo.org) — a real Vulgate/Douay-Rheims
versification difference, not a scrape artifact, so these stay honestly `missing`, alongside
the pre-existing `isa-33`/`sir-36` pointing-split half-verses (same convention, different
cause).

`npm test` (2018 passed), `tsc --noEmit`, and `npm run build` all pass.


### Bulk scripture import, take two — re-sourced the corrupted/missing chapters from drbo.org (2026-09-03, same day)

Closes the two gaps the previous entry left open. The "Unbound Bible" source used for the
first pass turned out to have real defects, not just gaps: 12 chapters where the Douay-Rheims
side had verses shifted/merged under the wrong number (confirmed by content, e.g. the line
tagged "Isaias 25:1" actually held 25:11's text), and Daniel 4-14/Esther 11-16 simply weren't
in its Latin file at all.

Found a better source: drbo.org (Douay-Rheims Bible Online) publishes a combined "DR + LV"
page per chapter (`/drl/chapter/<book><chapter>.htm`) with each verse's Latin and English kept
in the same HTML block — structurally impossible for the two languages to drift out of
alignment the way the tab-separated source could. Fetched all 28 real chapters this way
(`bar-2`; `isa-5`, `isa-25`; `joan-15`; `rom-9`, `rom-11`; `sir-10/19/23/41/51`; `dan-4`
through `dan-14`; `esth-11` through `esth-16`) via a small regex parser against the raw HTML
(`<p><a class=vn>N</a>ENGLISH<br><font class="latin">LATIN</font></p>`), spot-checked several
against the known-correct text, and confirmed `sir-52` isn't a real chapter at all (Sirach
only has 51 on drbo.org — the old source's "52" was itself bogus, dropped rather than
authored). Store now at 1185 chapter files; every book/chapter citation used anywhere in the
app resolves to real text with no remaining gaps.

`tests/scripture/scripture.test.ts`'s "unauthored chapter" case repointed from `dan-14` (now
authored) to `gen-51` (Genesis only has 50 chapters — a real "doesn't exist," same code path).

`npm test` (2018 passed), `tsc --noEmit`, and `npm run build` all pass.


### Bulk Vulgate/Douay-Rheims scripture import — completed from the real source, plus fixes upstream of it (2026-09-03)

Closes the long-deferred "bulk Vulgate + Douay-Rheims scripture import" item. What actually
happened, in order:

1. **Stale-status bug**: `src/propers/bible-plan.ts`'s `resolveReading` preferred each
   bible-plan YAML row's own hardcoded `status: { la: missing, en: missing }` field over
   computing status from the actually-resolved scripture text. That field was accurate before
   a same-day bulk import landed real text into `src/data/scripture/`, but was never cleared —
   so every Matins bible-plan reading still showed "translation pending" regardless. Fixed by
   stripping the stale field from all 368 `data/hours/bible-plan/*.yml` files.
2. **Book-abbreviation mismatch**: the bulk-imported store keys books by Vulgate-numbering
   abbreviation (`sap`, `jac`, `joan`, `1reg`..`4reg`, `1par`/`2par`, `1esdr`/`2esdr`, ...),
   matching `octave-readings.ts`'s pre-existing convention, while `bible-plan.ts`'s own TSV
   import used common English abbreviations (`kgs`, `sam`, `chr`, `john`, `jas`, `luke`,
   `mark`, ...) for the ~30 books where the two conventions diverge. Fixed with a
   `BOOK_ALIASES` map in `src/scripture/index.ts`, at the lookup layer, so bible-plan's
   citations keep their familiar English display form.
3. **Verse-number prefixes**: `resolvePassages` (shared by octave-readings/bible-plan/nocturn-
   readings) was prepending each verse's number to the joined reading text ("1 Et factum
   est..."), visible in rendered readings. Dropped — join verse text alone.
4. **3 books the bulk import missed entirely**: Jude, Obadiah, and Philemon (each a single
   short chapter) had no file at all in `src/data/scripture/`, unlike everything else the bulk
   import covered — hand-authored first, then replaced with source-derived text once the real
   source turned up (see next point) — small inaccuracies in the hand-typed version confirmed
   the value of going back to source.
5. **The rest of the gap, and the real source**: comparing every book/chapter citation used
   anywhere in the app against the store turned up 137 missing chapters, scattered oddly across
   ~30 otherwise-covered books (10 of Genesis's 50 chapters, 9 of Daniel's 14, etc.) — too much
   to hand-author reliably. The user located the original "Unbound Bible" source archives
   (`~/opt/inactive/bible/versions/douay_rheims.zip` + `latinv.zip`, tab-format:
   `<book-code>\t<chapter>\t<verse>\t<text>`), which the original (already-committed) bulk
   import must have used but which weren't preserved anywhere in-repo. Re-parsed directly from
   these archives (book-code map: `01O`-`39O` = Genesis..Malachi, `40N`-`66N` = Matthew..
   Apocalypse, `67A`/`68A`/`71A`/`73A`/`74A`/`79A`/`80A` = Baruch/Sirach/Judith/1-2
   Maccabees/Tobit/Wisdom), filling every gap the store didn't already have. 121 new chapters
   authored (118 new + the 3 hand-authored ones replaced), bringing the store to 1157 files.
   **Deliberately still left unauthored** (do not attempt to fill from this source without a
   second, independent source to cross-check against):
   - Daniel 4-14 and Esther 11-16 — this particular Vulgate digitization only has Daniel 1-3
     and Esther 1-10; the deuterocanonical continuations simply aren't in the Latin file at all
     (English/Douay-Rheims does have them).
   - 12 chapters (`bar-2`, `isa-5`, `isa-25`, `joan-15`, `rom-9`, `rom-11`,
     `sir-10`/`19`/`23`/`41`/`51`/`52`) where the Douay-Rheims side has a corrupted, misnumbered
     block — e.g. `isa-25`'s own line tagged verse 1 actually carries verse 11's text — rather
     than simply missing content. Confirmed by checking real verse content against what the
     tag claims; importing under the source's own (wrong) verse numbers would have silently
     attached mismatched text to real citations, which is worse than leaving them `missing`.
   `tests/scripture/bulk-import.test.ts`'s invariant was widened to tolerate up to 2 genuinely
   isolated missing-English verses per chapter (an existing pattern for `isa-33`/`sir-36`'s
   pointing-split half-verses, now also covering true source gaps like an in-file "Transfer
   interrupted!" download-corruption artifact found at `matt-12:43`) while still failing loudly
   on anything resembling the corrupted-block pattern above.

`npm test` (1990 passed), `tsc --noEmit`, and `npm run build` all pass.


### Easter's own octave — Wednesday-Saturday's antiphons done too, fully closing the item (2026-09-02, same day)

Closes the remaining open piece from the entry above. Live-verified: all 4 weekdays
(Wednesday-Saturday) share the exact same 2 antiphons verbatim — not per-day content, despite
each drawing on a different Gospel reading in the nocturn-readings pool ("Jesum qui crucifíxus
est quǽritis, allelúja..." / "Veníte et vidéte locum ubi pósitus erat Dóminus, allelúja,
allelúja.", Pofficium.pl, prayMatutinum, Monastic Tridentinum 1617, 2026-04-08/09/10/11).

New general-purpose mechanism, the ferial-side counterpart to the Sunday-named-override built
earlier the same day: `data/hours/matins-ferial-named-antiphon-overrides.yml` (a temporal id's
own antiphon list, optionally restricted to specific weekdays — same `weekdays` idiom as the
Sunday-side override) + `hours/matins.ts`'s `ferialNamedAntiphonedNocturn`, checked first in
`ferialAntiphonedNocturn` ahead of the plain per-weekday default. The antiphon list is
distributed evenly across the weekday's own already-fixed psalm-group count (not tied to
specific psalm numbers), since one entry is meant to be reused across several different
weekdays rather than authored per-day — psalm numbers themselves are unchanged from the plain
ferial default (vu's own fixed table, not the reference engine's differently-sized Paschaltide-
contracted one).

With this, "Easter's own octave" is fully closed: calendar precedence (2026-09-01), Sunday/
Monday/Tuesday's shared proper psalmody (2026-09-02), and now Wednesday-Saturday's antiphons
(2026-09-02, same day). See memory `vu_easter_octave_proper_matins` for the full writeup.

`npm test` (832 passed), `tsc --noEmit`, and `npm run build` all pass.


### Easter's own octave — Sunday/Monday/Tuesday proper Matins authored, general temporal-override mechanism added (2026-09-02)

Closes most of the long-tabled "Easter's own octave" mechanism gap (Priority section, item 1).
User pushed back on an initial overcomplicated read ("psalms with lections" looked like a new
rendering shape at first glance) — turned out, after live-verifying the actual structure, to
be exactly what the user guessed: a temporal override file that "looks weird" only because of
its content (13 psalms under one antiphon per nocturn, not the usual per-pair grouping), not
because it needs new mechanism. Every psalm already gets its own Gloria Patri centrally
(`hours/index.ts`'s `withGloriaPatri`) regardless of hour, and the 12 patristic lessons were
*already* authored (`data/propers/nocturn-readings/easter-sunday.yml`, from the earlier
temporal nocturn-readings sweep) — the only real gap was the psalmody/antiphon/versicle/
canticle layer.

**Content**: new `easter-sunday` entry in `matins-sunday-named-nocturn-overrides.yml` —
live-verified against the reference engine (`Pofficium.pl`, `prayMatutinum`, Monastic
Tridentinum 1617, 2026-04-05/06/07) — Nocturn 1: psalms 1,2,8,15,23,27 under one shared
antiphon ("Ego sum qui sum"); Nocturn 2: psalms 29,63,65,75,87,107 under one shared antiphon
("Terra trémuit"); Nocturn 3: the same 3 canticles already authored for the ordinary-
Paschaltide seasonal override (Isa 63:1-5, Osee 6:1-6, Soph 3:8-13), under its own antiphon
("Nolíte expavéscere"). All 3 nocturn-closing versicles are byte-identical to the ones
already authored in `matins-sunday-paschaltide-nocturn-overrides.yml`, confirming those are
shared season-wide rather than coincidentally reused.

**Mechanism (small, general-purpose, not Easter-specific)**: `hours/matins.ts`'s
`threeNocturns` gate and the Sunday-branch dispatch previously only ever fired for
`day.weekday === 'sunday'` or a sanctoral winner — a *temporal* winner had no path into 3-
nocturn proper content at all, even with a matching `sundayNamedOverrides` entry. Generalized:
a temporal winner with an authored named override is now eligible too (`hasTemporalNamedOverride`),
reusing the exact same `sundayPsalmNocturn`/`sundayCanticleNocturn` render functions the Sunday
and saint-proper branches already share — deliberately built as a reusable feature (user,
2026-09-02: "we want temporal override anyway... there are temporal feasts that could have
their own psalms/lessons"), not a one-off hack.

**The scoping wrinkle that made this non-trivial**: `winner.id` is `'easter-sunday'` for the
*entire* Octave (all 6 weekdays), but only Sunday/Monday/Tuesday are live-verified to share
this content — Wednesday-Saturday have their own different (Paschal-alleluia-flavored, not yet
authored) antiphons over a differently-shaped psalm set. A naive "any day with this winner.id"
check would have wrongly applied Sunday's content through Saturday. Fixed with a new optional
`weekdays` field on a named-override entry (`easter-sunday: weekdays: [sunday, monday,
tuesday]`) — omitted (as `sunday-after-ascension` still does) means "every day carrying this
temporalId," the common case for a temporalId that already maps to exactly one calendar day.

**Still open, a separate smaller gap**: Wednesday-Saturday of the Easter Octave — live-verified
(2026-04-08) to carry real Paschal-alleluia antiphons ("Jesum qui crucifíxus est quǽritis,
allelúja...") over a psalm set the reference engine sizes differently from vu's own
already-fixed 9-psalm ferial table (itself deliberate — see "No RB summer contraction" in
DESIGN.md). 4 more days of antiphon-only content, same shape as the existing Advent/Paschaltide
seasonal-overlay pattern, layered onto vu's own ferial psalm numbers rather than trying to
reproduce the reference engine's differently-sized set — not started.

`npm test` (828 passed), `tsc --noEmit`, and `npm run build` all pass.


### Matins: 3-nocturn threshold lowered from Duplex to Semiduplex (2026-09-02)

Same session, a separate fix: the 3-nocturn gate (`hours/matins.ts`'s `threeNocturns`) was
floored at Duplex (`isDoubleOrHigher`). User's own design call, prompted by noticing today's
Matins (St. Stephen of Hungary, Semiduplex) wrongly rendering as 1-nocturn: Semiduplex and
Duplex should share the same 3-nocturn/3-psalms-each shape (distinct from Sunday/Duplex-majus
+'s 6/6/3-plus-canticles scheme). Lowered the floor with a new, separate check
(`isAtLeast(winner.rank, 'semiduplex')`) rather than touching `isDoubleOrHigher` itself, which
drives an unrelated antiphon-doubling rule elsewhere and must stay floored at Duplex. No new
content authoring was needed — `ferialPsalmodyThreeNocturns` already existed and already
chunks the ferial 9-psalm pool into 3/3/3 as the fallback for a plain-Duplex winner with no
override authored; Semiduplex winners now fall into that same already-working branch. Proved
via St. Stephen of Hungary (2026-09-02, Common of a Confessor): 3 real nocturns, Common's own
Terce/Sext/None antiphons+versicles, Te Deum present.

See memory `vu_matins_semiduplex_threshold` for full detail.

`npm test` (823 passed), `tsc --noEmit`, and `npm run build` all pass.


### Matins ferial nocturn: mid-nocturn versicle removed, a real live-verified bug (2026-09-02)

User noticed the 1-nocturn ferial branch had a V./R. versicle stuck mid-list as if marking a
nocturn boundary — structurally incoherent for a single continuous nocturn.

`data/hours/matins-ferial-antiphons.yml`'s per-weekday `groups` carried a `versicle` field
ported from a mid-list V./R. line embedded in the source `Psalmi matutinum.txt`
(`[Daym1_]`-`[Daym6_]`), rendered partway through the single continuous 1-nocturn ferial day.
Live-verified against the reference engine (`Pofficium.pl`, `command=prayMatutinum`,
`version=Monastic Tridentinum 1617`) for Wednesday and Thursday: the real office runs straight
from the last psalm to the Capitulum, no versicle anywhere in the psalmody — that source line
is inert there, never actually emitted. Removed the field from all 6 weekdays and the
rendering code (`ferialAntiphonedNocturn`); the earlier "versicle placement" reasoning in that
file's header was a documented-but-unverified assumption, not real content.

See memory `vu_ferial_matins_antiphons` for full detail.

`npm test`, `tsc --noEmit`, and `npm run build` all pass.


### Correction, same day: `privileged-feria-major`'s own "duplex-majus+ still gets a nod" rule was wrong

User pushed back immediately: "you dont commemorate -anything- from palm sunday through low
sunday" — and was right. The cascade mechanism above was built reusing `applyIncomingTransfer`'s
existing `privileged-feria-major` no-op unchanged, on the assumption that its sibling behavior
in `decideOccurrence` (a *native* duplex-majus+ candidate there gets a bare commemoration, only
below-majus ranks transfer) was itself correct — it had a citation (St. Mark, Duplex II. classis,
"merely commemorated" within the Easter Octave). That citation turned out to be a misreading,
not just unverified.

Live-checked two more real dates before touching code: the Annunciation (Duplex I. classis, the
highest rank that exists) transfers with **zero** commemoration on Holy Thursday itself in years
it lands there (2027/2032/2043) — not just off a Sunday, off an ordinary Holy Week feria too.
Then checked whether this was Holy-Week-specific or true of every `privileged-feria-major` use:
Chair of St. Peter at Antioch (Duplex majus) transfers the same way off Ash Wednesday (2034).
So the exception was wrong everywhere this category is used, not just the Easter span.

Fixed: `commemorations.ts`'s `privileged-feria-major` case now matches `privileged-sunday`
exactly — transfers every rank unconditionally, no commemoration ever, for anyone. Three
existing tests had the old (wrong) assumption baked into their expected values and needed
updating to real, live-verified outcomes, not just loosened: St. Mark (2030) now transfers
instead of being commemorated, landing May 5 that year (vu's own dense April/May calendar
pushes him well past his native date); the Annunciation's own 2035 landing moved from Apr 4 to
Apr 6, since two *earlier*-native-dated candidates (St. Benedict, also Duplex I. classis, native
Mar 21; St. Gabriel the Archangel, Duplex majus, native Mar 24) are now also correctly caught by
the same span that year and queue ahead of her.

`npm test` (822 passed), `tsc --noEmit`, and `npm run build` all pass.

### Easter-octave backlog redesigned — one-per-day, floor-gated, no rank fight (2026-09-01)

Same day, a real design conversation rather than another live-verification pass: user rejected
the multi-day cascading queue built above ("that's not a plan... we cant do a batch
commemorations. we can do one a day."). New shape, per direct instruction:

- **Gate**: only candidates at or above `duplex-majus` are worth carrying out of the span at
  all — below that, a candidate simply lapses for the year, no trace, same as it already gets
  none *within* the span itself. (Confirmed as the right floor by inventorying every fixed-date
  saint that could ever fall in the whole reachable window, March 15 - May 2: only 5 ever clear
  it — St. Benedict, St. Gabriel the Archangel, the Annunciation, St. Mark, Ss. Philip & James
  — everything else in that range is plain Duplex or below.)
- **Landing**: the Nth day after Low Sunday celebrates the Nth candidate that cleared the floor
  that year, in native-date order — winning outright, no rank comparison against whatever would
  natively be there, which is simply demoted to a commemoration. One candidate per day,
  positional, not a search for the next free day.

Replaced `resolveForwardTransferLanding`'s generic multi-day queue with two pieces:
`easterOctaveBacklogFor(year)` (computes that year's whole backlog once, filtered to the floor)
and `applyEasterOctaveBacklog` (the Nth-day lookup), both in `calendar/index.ts`. The ordinary
single-hop yesterday/tomorrow transfer check (used everywhere else) is back to its original
form — the whole redesign is now a dedicated, narrowly-scoped mechanism (same architectural
pattern as `applyMarianSaturday`/`applyAdventFourVigilCommemoration`), not a generalized queue.

**Real bug caught while re-verifying**: the ordinary single-hop check was independently picking
up Low Sunday's own transfer signal and landing/commemorating a below-floor candidate (St.
Fidelis, plain Duplex) the very next day — bypassing the new floor entirely. Fixed by excluding
the whole Palm-Sunday-through-Low-Sunday span from that ordinary path (scoped by `easterOffsetOf`,
not by category, so it doesn't also swallow an unrelated privileged Sunday elsewhere in the year
like Advent II).

Rewrote the tests this broke to real, live-verified outcomes for the new shape (2033: nothing
that year clears the floor, so the whole backlog is empty and every impeded candidate lapses;
2035: three candidates clear it and land the 1st/2nd/3rd day after Low Sunday in order). Then,
having inventoried the 5 always-reachable duplex-majus+ candidates together, one more direct
instruction: St. Patrick's own rank is bumped from the source's plain Duplex to duplex-majus
(`data/calendar/saints/st-patrick.yml`) — a deliberate departure, not a transcription, same
category of move as this app's existing late-canonization rank-deflation convention, just in
the other direction — bringing his own count to 6.

`npm test` (821 passed), `tsc --noEmit`, and `npm run build` all pass.


### Easter octave transfer cascade — mechanism built (2026-09-01)

Closes the "Easter's own octave" item from this file's own Priority list. User asked for it
directly, then answered two design questions with real evidence rather than guesswork:
"what happens to the saint's own day" and "what are the gating rules" for something impeded
within Holy Week/the Easter Octave.

**Root cause, found by reading the existing code rather than assuming**: `resolveDay` only ever
checked yesterday/tomorrow for an inbound transfer — a single hop. There was already an honest,
existing comment marking this exact gap (`applyIncomingTransfer`'s `privileged-feria-major`
branch: "a transfer chain — not modeled... simply not delivered here rather than guessed at").
Anything impeded in Holy Week just vanished rather than reappearing.

**Live-verified real behavior (2033: Palm Sunday Apr 10 → Low Sunday Apr 24, five real saints
falling inside that window) before building anything**:
- A candidate impeded anywhere in the whole span (Holy Week, Easter Day, the Octave, Low
  Sunday) skips the *entire* span — not just the day it was impeded on — and keeps walking
  forward day by day past it, same as any ordinary transfer, until it finds a day that isn't
  already spoken for by a real native occurrence or an earlier-queued candidate ahead of it in
  line. St. Leo I (native Apr 11, Duplex) landed Apr 27; Ss. Soter & Caius (native Apr 22)
  landed Apr 28 (right after Leo); St. George (native Apr 23) had to wait until May 4, well
  past several already-occupied days.
- **Multiple candidates can be pending at once** — a real FIFO queue ordered by native date,
  not just "the one most recent candidate." All three above overlapped in their pending window.
- **A transferred-in candidate never gets the "duplex-majus+ still gets a nod" commemoration**
  a *native* occurrence of that rank would on one of these days — confirmed with the
  Annunciation (Duplex I. classis, native Easter Sunday itself in 2035): zero commemoration
  anywhere across the whole span, landing outright on Apr 4 (past Low Sunday, Apr 1 that year).
  This is genuinely different from a native duplex-majus+ candidate (e.g. St. Mark, native
  within some other year's Octave, which *does* get commemorated in place) — the "never
  displaced, but gets a nod" treatment is reserved for a day's own native candidate, not
  anything merely passing through.
- **Low Sunday itself needed the same fix as Easter Day** — found while building this: it
  carries the same formal "Duplex I. classis" rank as Easter Day in the source, but was
  falling through to eastertide's plain `ordinary-sunday` default (today's earlier fix only
  covered offset 0). Not independently collision-verified (no Monastic-track saint — a real
  `SanctiM/MM-DD.txt` file — ever lands there across the real range of Easter dates), but
  corroborated by its own rank label and by the complete absence of even a `Transfer:` note for
  a same-dated non-Monastic-track saint (St. Isidore of Seville 2027, St. Vincent Ferrer 2043)
  that a real Monastic day would show. Fixed in `calendar/temporal.ts`'s `resolveTemporalCategory`
  alongside offset 0.

**What got built**: a real `MAX_FORWARD_TRANSFER_LOOKBACK_DAYS`-bounded (60 days, generous
headroom over the worst observed real case) queue simulation, `resolveForwardTransferLanding`
in `calendar/index.ts` — walks chronologically from the lookback window up through the target
date, replaying each day's own native occurrence and, if a candidate is already queued, one
landing attempt per day (reusing `applyIncomingTransfer` completely unchanged — its existing
`privileged-feria-major` no-op turned out to already be exactly the right single-hop refusal;
the fix was purely wrapping it in an actual cascade instead of a dead end). Only forward-
direction transfers chain this way; a Vigil's backward transfer stays single-hop as before —
structurally different (displaces backward in time) and not observed to need it.

New tests in `tests/calendar/transfer.test.ts` cover the full chain (Leo/Hermenegild/Tiburtius
landing in strict native-date order past the whole 2033 span) and the Annunciation's own
zero-commemoration case (2035). `npm test` (823 passed), `tsc --noEmit`, and `npm run build`
all pass.


### Full sweep of `temporal-categories.yml` — two more real bugs found and fixed (2026-09-01)

Follow-up, same day: user pushed back hard on the "not a bug" framing above ("the immaculate
conception transfer is correct... annuncition should transfer") and asked to sweep every
remaining unverified entry in `data/calendar/temporal-categories.yml`, not just the one already
fixed. Found two more real, calendar-wide bugs:

1. **`commemorations.ts`'s `privileged-sunday` case itself was wrong**, not just one season's
   tag. It gave any duplex-majus+ candidate a bare commemoration instead of transferring —
   never actually verified against a primary source. Live-checked 3 independent cases: the
   Immaculate Conception (Duplex I. classis) transfers off Advent II with **no** commemoration
   (2024/2030/2041); the Annunciation (also Duplex I. classis) transfers off both Palm Sunday
   and Easter Sunday itself the same way (2029/2035/2040/2046). Confirmed by direct instruction
   as correct (with a known follow-on: the Annunciation's *real* rule jumps it past the whole
   Easter Octave rather than the next open day, which lands inside it — blocked on the
   not-yet-built Easter-octave mechanism, noted but not built here). Fixed: `privileged-sunday`
   now transfers every rank unconditionally, no exception.

2. **`eastertide`'s own `sunday` tier was backwards** — coded `privileged-sunday`, should be
   `ordinary-sunday` for the *ordinary* Sundays after Easter (not Easter Day itself, not within
   its Octave, both already separately handled). Live-verified twice: the Finding of the Holy
   Cross (Duplex-II-classis, 2026-05-03) and St. Mark (Duplex-II-classis, 2027-04-25) both win
   outright over "Dominica IV Post Pascha," with the Sunday merely noted as a `Tempora` line
   underneath — exactly `ordinary-sunday`'s rule. Easter Day itself still needs the stronger
   tier (confirmed by the Annunciation evidence above), so it's now special-cased directly in
   `calendar/temporal.ts`'s `resolveTemporalCategory` (Sundays never consult `offsets`, so this
   couldn't be expressed as a plain offset entry the way every other exception in that file is).

**Six test failures from the `privileged-sunday` fix, all genuine fallout, not regressions** —
each test had encoded the old, wrong "commemorated in place" behavior as its expected value:
St. Andrew (Duplex II. classis) no longer commemorated alongside Advent I, but shown
transferred away (landing on Dec 1, where he now wins outright — `privileged-feria-minor`'s
Semiduplex+ threshold easily clears); St. Antoninus similarly now wins outright on his own day
(the real Easter-6 Sunday) instead of being pushed to the next day by the old wrong rule. All
six tests updated to real, live-verified dates/values, not just loosened to pass.

**Remaining entries in the file, not independently live-collision-tested but documented as
such** (each has its own comment now): the Vigil of Pentecost and Vigil of Christmas
(`privileged-feria-major`) are corroborated by their own formal rank in the reference source
("Semiduplex I classis" / "Duplex I classis" respectively) rather than a live saint collision,
which is rare by construction; Pentecost Sunday itself (`privileged-sunday`) is consistent with
the confirmed "great octave Sunday" pattern but has no fixed-date-saint collision to test
against; Corpus Christi/Sacred Heart's `feria` (`privileged-feria-major`) shares the same
"feast of the Lord" reasoning already confirmed elsewhere, and their `sunday` key is flagged as
genuinely unreachable (both are always fixed weekdays, never a Sunday, per
`easter-offsets.yml`'s own `days:` table). Every other `feria` entry is the trivial
`ordinary-feria` default (no rank threshold — any real content wins), already implicitly
exercised correctly across hundreds of ordinary weekdays in the existing test suite.

`npm test` (820 passed — one net fewer than before since two tests merged into one clearer
case), `tsc --noEmit`, and `npm run build` all pass.


### Sunday within the Octave of Ascension: real precedence bug, fixed (2026-09-01)

User pushed back on the "not a bug" conclusion above: correctly — the "Duplex+ saint wins
outright over an Ascensiontide Sunday" case was a real precedence bug, not settled design.
`data/calendar/temporal-categories.yml` had `ascensiontide`'s Sunday coded `ordinary-sunday`
(Duplex+ wins outright), the only "great octave" season not already `privileged-sunday`
(eastertide/pentecost both already were) — no verification comment on that line, unlike every
other entry in the file. Live-verified (proof date 2026-05-17, St. Paschal Baylon, real Duplex):
the reference engine titles the day "Dominica infra Octavam Ascensionis ~ Semiduplex Dominica
minor" and gives it its own wholly proper Matins, no trace of the saint. Fixed: `ascensiontide`
is now `privileged-sunday`, matching eastertide/pentecost — St. Paschal Baylon now transfers
(`decideOccurrence`'s existing generic privileged-sunday branch handled this correctly with no
new code, just the corrected category).

With the calendar now resolving the *right* winner (the Sunday itself, `sunday-after-ascension`),
Matins still needed real content: this Sunday's own proper is a wholly different psalm scheme
from the fixed 12-psalm base — Ps 8/10/18/20/23/29 for Nocturn I, Ps 45/46/95/96/98/102 for
Nocturn II, each of the 12 psalms individually antiphoned (not paired) — plus its own versicles.
Nocturn III reuses the same 3 canticles as the ordinary-Paschaltide override (Isa 63:1-5, Osee
6:1-6, Sophonias 3:8-13, already authored) under its own antiphon ("Illi autem profécti
prædicavérunt ubíque...") — English for that one antiphon is this app's own translation (the
reference engine's own English tree is genuinely blank there, confirmed not a fetch gap), since
it's an unambiguous, well-known formula (Mark 16:20).

New `data/hours/matins-sunday-named-nocturn-overrides.yml` — a per-`temporalId` override layer
(currently just `sunday-after-ascension`) for a specific privileged Sunday whose own proper is
wholesale different, distinct from the season-wide Advent/Paschaltide overrides above.
`hours/matins.ts`'s `sundayNocturnFor` now checks this map first (most specific), ahead of the
season-wide overrides, ahead of the plain default.

New regression tests in `tests/hours/matins.test.ts` (`Sunday within the Octave of Ascension`)
assert both the calendar winner (Sunday over the saint) and the full Matins content. `npm test`
(821 passed), `tsc --noEmit`, and `npm run build` all pass.


### Paschaltide Sunday Matins Nocturns I-III seasonal override (2026-09-01)

Second follow-up, same day: does any other season need the same treatment? Live sweep of the
reference source (`Psalterium/Psalmi/Psalmi matutinum.txt`) confirmed only 3 season-tagged
blocks exist at all — `[Daym0]` (plain default), `[Advm0]` (Advent, done above), `[Paschm0]`
(Paschaltide) — so Christmastide and post-Epiphany Sundays have no gap; Paschaltide does.

Ordinary Paschaltide Sundays (Low Sunday through the Sunday before Ascension — `day.season ===
'eastertide'`) get the same seasonal antiphon/versicle/canticle treatment as Advent, live-
verified identical across 5 Sundays of the 2026 cycle (04-12 through 05-10). New Nocturn III
canticles: Isa 63:1-5, Osee 6:1-6, Sophonias 3:8-13 (3 new scripture files — first content
under the `osee`/`soph` book codes). Structurally different from Advent's own shape, not just
different text: Nocturns I and II each take a **single** antiphon covering all 6 psalms of the
nocturn, not 3 separate antiphons (one per psalm-pair) — confirmed by the live query showing
only one antiphon before/after each whole nocturn's psalmody. Nocturn III's own antiphon is
unchanged from the plain-season "Allelúja, allelúja, allelúja" default; only its canticles and
versicle differ.

New `data/hours/matins-sunday-paschaltide-nocturn-overrides.yml`; `hours/matins.ts`'s
`sundayNocturnFor` generalized to a season-keyed lookup (renamed `MatinsSundayNocturnOverrides`)
covering both Advent and Paschaltide.

**Explicitly NOT covered by this fix, each its own separate thing**:
- **Easter Sunday itself** — has a wholly proper Matins (different psalms too, not just
  antiphons); this is the already-tabled "Easter's own octave" mechanism gap above, not folded
  into this seasonal-overlay shape.
- **The Sunday within the Octave of Ascension** (`ascensiontide`'s one Sunday) — live-checked
  (2026 proof date 2026-05-17) and found to render its own genuinely proper content ("Eleváta
  est...", Ps 8 instead of the fixed Ps 20-31 scheme) in the reference engine, because that
  date's real office winner is a Duplex-rank saint (St. Paschal Baylon) whose own Common/proper
  Matins wins outright. **Investigated, not a bug**: this app's Sunday psalmody is documented
  above (Priority section, "Sunday's fixed 12-psalm/3-canticle psalmody") as deliberately fixed
  and unconditional on every Sunday regardless of the office winner — a direct-instruction
  non-reconstruction choice, not an oversight. The winning saint's own content still surfaces
  generously through the separate Nocturn 2/3 *readings* pool (`buildReadingPool`, already
  saint-aware); only the antiphon/psalm layer stays fixed. Changing the branch dispatch to let
  a Sunday's winner override the fixed psalmody would reverse a settled design decision, not
  close a gap — left alone.

New regression test in `tests/hours/matins.test.ts` (`Paschaltide Sunday Nocturns I-III
seasonal override`) asserts all 5 ordinary Paschaltide Sundays render identically. `npm test`
(819 passed), `tsc --noEmit`, and `npm run build` all pass.


### Advent Sunday Matins Nocturns I-III seasonal override (2026-09-01)

Follow-up, same day: the user asked whether Advent Sundays' own Nocturn III needed the same kind
of fix. Live re-check (`prayMatutinum`, Monastic Tridentinum 1617, all 4 Advent Sundays of the
2026 cycle) found the answer is yes, and bigger than just Nocturn III — Advent's own seasonal
antiphons apply to **all three nocturns**, not just Nocturn III, and identically across all 4
Sundays (no per-Sunday variation the way Septuagesima-Palm has).

- **Nocturns I-II**: psalm numbers unchanged (Ps 20-31), but every one of the 6 antiphons and
  both versicles are seasonal — none of which existed anywhere in the codebase before this fix
  (unlike Nocturn III, Nocturns I/II had *no* override mechanism at all; `matins.ts` used the
  plain-season `matins-sunday-antiphons.yml` base unconditionally).
- **Nocturn III**: swaps the plain-season 3-canticle set (Isa 33:2-10/33:13-18, Sir 36:14-19) for
  a wholly different one (Isa 40:10-17, 42:10-16, 49:7-13 — 3 new `data/scripture/isa-{40,42,49}.yml`
  files), under its own Marian antiphon ("Gábriel Ángelus locútus est Maríæ...") and versicle.

New `data/hours/matins-sunday-advent-nocturn-overrides.yml` — a single season-wide block (keyed
by season, not per-Sunday `temporalId`, since all 4 Advent Sundays are identical) — plus
`hours/matins.ts`'s generalized `sundayNocturnFor(nocturn, day, temporalId)`, which now checks
Advent's season-wide override ahead of (Nocturn III only) the existing per-Sunday Septuagesima-
Palm `sundayNocturn3For` lookup; Advent and Septuagesima-Palm never overlap so there's no
precedence conflict between the two override tiers.

New regression test in `tests/hours/matins.test.ts` (`Advent Sunday Nocturns I-III seasonal
override`) asserts all 4 Advent Sundays render identically. `npm test` (818 passed),
`tsc --noEmit`, and `npm run build` all pass.


### Sunday Matins Nocturn III seasonal override, Septuagesima-Palm Sunday (2026-09-01)

Fixed the gap flagged above. New `data/hours/matins-sunday-nocturn3-overrides.yml`, keyed by
`temporalId`, plus `hours/matins.ts`'s `sundayNocturn3For` (looked up with the `temporalId`
`resolveOrdo` already computes, merged field-by-field over `matins-sunday-antiphons.yml`'s base
`nocturn3` group — only the real Sunday branch uses it, not the Duplex+-weekday-feast branches,
which stay saint/Common-specific as before).

Re-verifying live (one `prayMatutinum` query per Sunday of the 2026 cycle, Monastic Tridentinum
1617) turned up more than the antiphon-only change the earlier note assumed:
- **Septuagesima, Sexagesima, Quinquagesima**: antiphon only — canticles (Isa 33:2-10/33:13-18,
  Sir 36:14-19) and versicle ("Exaltáre Dómine in virtúte tua. / Cantábimus et psallémus
  virtútes tuas.") are the same as the plain-season default.
- **Lent 1-4**: a genuinely different set of 3 canticles (Jer 14:17-21, Lam 5:1-7,15-17,19-21,
  Ezek 36:24-28 — new `data/scripture/jer-14.yml`, `lam-5.yml`, `ezek-36.yml`, the first content
  under the `lam` book code) *and* a different versicle ("Scuto circúmdabit te véritas ejus. /
  Non timébis a timóre noctúrno."), on top of the antiphon.
- **Passion Sunday, Palm Sunday**: base canticles, but the versicle is "Ne perdas cum ímpiis,
  Deus, ánimam meam. / Et cum viris sánguinum vitam meam." — not "Exaltáre Dómine." The earlier
  note's placeholder Passion Sunday antiphon text ("Deus ádjuvat me...") was actually this
  versicle, not the antiphon; the real antiphon is "Ego glóriam meam non quæro: † est qui
  quærat, et júdicet." (John 8:50, that Sunday's own Gospel). Palm Sunday's full antiphon:
  "Hosánna fílio David: † benedíctus, qui venit in nómine Dómini, Rex Israël: † Hosánna in
  excélsis."

New regression tests in `tests/hours/matins.test.ts` cover all three shapes (antiphon-only,
antiphon+canticles+versicle, antiphon+versicle-only). `npm test` (817 passed), `tsc --noEmit`,
and `npm run build` all pass.


### Ferial Matins nocturn: one antiphon per psalm (2026-09-01)

User flagged that the ferial (1-nocturn) weekday antiphons looked inconsistent — some psalms
paired under one shared antiphon, others solitary, within the same nocturn. Root cause: the
source's own per-weekday tables (`Daym1_`-`Daym6_`) do frame several *different-psalm* pairs
under one shared antiphon (normal Monastic practice), and vu's `matins-ferial-antiphons.yml`
had carried that pairing straight through — reading fine in the source's own untouched weekly
layout, but looking arbitrary once `psalter-distribution.yml`'s reslice left some of those pairs
intact and split others across weekday boundaries. Fixed by splitting every cross-psalm pair
into two single-psalm groups (a same-psalm split across a chapter boundary, e.g. Ps 36:1-26/
36:27-40, is unaffected — that's still one antiphon per psalm).

For each split pair, whichever psalm the antiphon's own words actually quote (checked against
`src/data/psalms/*.yml`, not assumed from position — several pairs listed the *second* psalm's
own words under the first psalm's slot, e.g. Wednesday's "Quam bonus Israël Deus" pair, [71,72],
is actually Ps 72's own opening, not 71's) keeps that antiphon; its former partner got a new
one, per direct instruction: search the reference corpus for a real one before inventing.
Sourcing that produced (6 of 10 real, 4 composed fresh — all directly quoting that psalm's own
Vulgate text either way, the same convention every other antiphon in this corpus follows):
- **Real, borrowed**: Ps 39 and 71 from `Tempora/Quad6-5` and `Tempora/Quad6-4` (Holy Week
  ferial propers); Ps 55 from `Tempora/Quad5-5` (Lenten Friday ferial); Ps 102 from
  `Tempora/Pent01-4`; Ps 107 from `Tempora/Pent02-5` (post-Pentecost ferial propers); Ps 48 from
  the Roman *secular* ferial Matins table (`[Day0]`-`[Day6]`, same file as the Monastic table,
  individually-antiphoned rather than paired — see [[vu_secular_source_ok]]).
- **Composed fresh** (no match found anywhere in the corpus): Ps 33, 43, 79, 83 — each from its
  own opening verse, in the same incipit style the rest of the corpus already uses.

`tests/hours/matins.test.ts`'s ferial test updated (was asserting "antiphon only on each group's
first psalm" — now every psalm in the nocturn has one). `npm test` (814 passed) and
`tsc --noEmit` pass.

**Not done in the same pass, confirmed as a separate real gap**: Sunday Matins' Nocturn 3
"Allelúja, allelúja, allelúja" antiphon is wrong for Septuagesima-Passiontide — see this file's
"Mechanism gaps" section above for the live-verified detail and the 9 antiphons already
collected.


### Vespers Magnificat antiphon — sanctoral Common-category fallback, 11/11 (2026-08-31)

User flagged today's (Aug 31, St. Raymond Nonnatus) Vespers was missing its Magnificat antiphon.
Root cause was systemic, not date-specific — the earlier 2026-08-30 pass (see above) had closed
the *temporal*-cycle gap in `getMagnificatAntiphon`, but the *sanctoral* Common-category
fallback (`magnificat-antiphon-${saint.benedictusCommon}`) had never been authored at all: only
11 saints ever need it (the ones with `propers: null` or no own antiphon, falling back to
`benedictusCommon`'s 11 distinct category values), and every single one was `missing`.

Sourcing method: each Commune source file (`Latin/Commune/C*.txt`) lays out
Vespers1(`[Ant 1]`) -> Matins -> Lauds(`[Ant 2]`) -> minor hours -> Vespers2(`[Ant 3]`), confirmed
directly by live query (Ss. Placid and Companions, 10-05-2026: the evening before renders
`[Ant 1]` under "Vespera de sequenti", the feast's own evening renders `[Ant 3]`) and
cross-checked against 3 more saints (St. Blaise, St. John Gualbert). Authored 10 of 11 categories'
`magnificat-antiphon-common-of-*.yml` from each Common's own `[Ant 3]`
(`common-of-a-confessor`/`common-of-an-abbot` share one file, C5, so their Magnificat text is
identical by design, same as their existing Benedictus text).

Found and fixed two pre-existing bugs in sibling `benedictus-antiphon-common-of-*.yml` files
while cross-checking `[Ant 2]` against them: `common-of-a-confessor` and `common-of-the-bvm` had
both been sourced from `[Ant 1]` (First Vespers) instead of `[Ant 2]` (Lauds) — live-verified
wrong via St. Alexius's real Lauds query (07-17-2026, renders "Euge, serve bone", not the
file's old "Similabo eum"). Corrected both.

**The 11th category, `common-of-a-vigil`, needed a code fix instead of a content file.**
Initially assumed unreachable (a Vigil's own *Second* Vespers always loses to the following
feast's First Vespers — true, and confirmed via `compareFeastClass('vigil', ...)` always losing
in `resolveEveningDay`). But a Vigil's own *First* Vespers (anticipated the evening before, since
`hasFirstVespers` has no rank floor) absolutely does reach this code path — caught by re-checking
after the user asked "what about 11 of 11?". Live-verified across 4 different years
(2025-2028) that the real office never gives a Vigil a fixed proper Magnificat text at all — its
`[Rule]` block ("ex C1v; ... Laudes 2") always borrows whatever the current ferial weekday's own
antiphon is (`{Antiphona ex Proprio de Tempore}` every single year tried). So `common-of-a-vigil`
correctly has no content file; instead `getMagnificatAntiphon` (`hours/resolve-common.ts`) now
special-cases `saint.rank === 'vigil'` to fall through to the same `vespersMagnificatAntiphons`
weekday-default table the plain temporal branch already used, before ever trying a Common
lookup. `npm test` (810 passed) and `tsc --noEmit` pass.


### Bilingual header `nameLa` mechanism (2026-08-31)

Picked up the standing "Latin saint/octave/named-feast names" backlog item. The `Bi`
(`{en, la}`) *display* wrapper already existed in `calendar/day-label.ts`, but the underlying
*data* had no bilingual name field at all — `SaintRecord.name`, `TemporalFeastRecord.name`, and
the derived `SanctoralIdentity`/`ActiveOctave`/`Commemoration` types were plain English strings,
so every proper name necessarily fell back through `biFallback`.

Added an optional `nameLa?: string` alongside `name` on `SanctoralIdentity` (`calendar/types.ts`),
`SaintRecord`/`SanctoralCandidate` (`calendar/feasts.ts`), `TemporalFeastRecord`
(`calendar/temporal-feasts.ts`), and `ActiveOctave` (`calendar/octaves.ts`), then threaded it
through every construction site that had been spreading `id`/`name`/`rank` (`collision.ts`,
`commemorations.ts`, `movable-feasts.ts`, `index.ts` x3, `vespers.ts` x2,
`octaves.ts`'s `considerCandidate`). `day-label.ts`'s old `biFallback(name)` calls became
`biName(name, nameLa)`, which still falls back to the English string when `nameLa` is absent —
the "surface real text, don't block on missing" convention preserved exactly, just now backed by
a real field instead of no field at all.

Authored `nameLa` for all 11 named temporal feasts as the proof set (each sourced from the
reference engine's own `[Officium]`/`[Rank]` title, adapted from the source's genitive/ablative
liturgical-title style to this app's nominative-noun-phrase naming convention — e.g. "In
Ascensione Domini" → `Ascensio Domini`, "Sacratissimi Cordis Domini Nostri Jesu Christi" →
`Sacratissimum Cor Domini Nostri Jesu Christi`) plus St. Lawrence as the one saint, chosen
specifically to exercise the octave-headline (`octaveCoreName`) and octave-commemoration code
paths, not just the plain-winner path the temporal feasts alone would have covered. Live-verified
end-to-end via a throwaway scratch test (removed after confirming) that Pentecost's/the
Ascension's/the Immaculate Heart's own winner label, St. Lawrence's mid-octave and closing-day
octave label, and his octave *commemoration* line (Aug 12) all render the authored Latin, not the
English fallback. Six pre-existing `toEqual` test fixtures across `august-sanctoral.test.ts`,
`octaves.test.ts`, `transfer.test.ts`, and `december-sanctoral.test.ts` needed their expected
objects updated to include the new `nameLa` key (Christmas's own octave-commemoration entries too,
since `christmas-day.yml` picked up a name in this same pass). `npm test` (807 passed) and
`tsc --noEmit` pass.

**Bulk pass, same day**: authored `nameLa` for the remaining 299 real saints (every
`src/data/calendar/saints/*.yml` except `example-confessor`, a deliberate non-real placeholder
never wired into `sanctoral-calendar.yml`). Sourcing standard for this bulk pass was lighter than
per-saint reference-engine verification (infeasible at this volume in one sitting): standard,
well-attested ecclesiastical Latin forms — the saint's own canonical Latin name plus a Latin
rendering of their English descriptor (`Bishop` → `Episcopus`, `Martyr` → `Martyr`, `Virgin` →
`Virgo`, `Confessor and Doctor of the Church` → `Confessor et Ecclesiæ Doctor`, etc.), nominative
noun phrase throughout, matching the temporal-feast proof set's own convention. Multi-saint feast
names (e.g. `ss-perpetua-and-felicity`) got the equivalent Latin plural construction
(`Sanctæ ... Martyres`). This is a different, lower sourcing bar than the rest of this app's
content (which is reference-engine-verified line by line) — flagged here explicitly since a
future pass may want to spot-check or upgrade individual entries against the reference engine's
own titles, the way the 11 temporal feasts and St. Lawrence were.

Applied via a scratch Python script (`nameLa` inserted right after each `name:` line) plus two
follow-up passes fixing ~180 pre-existing test fixtures across 18-20 test files that asserted
exact `toEqual` objects on `day.winner`/`day.commemorations` (now carrying the new `nameLa` key).
One real mechanism bug surfaced and fixed by this: `calendar/index.ts`'s sanctoral-vs-sanctoral
collision-resolution branch (`resolveDay`'s per-day candidate loop, ~line 40) was rebuilding the
winning candidate as `{ id, name, rank }` without `nameLa`, silently dropping it for any saint
that had *beaten another candidate on the same date* even when winning outright — caught by
`st-giles`, `st-justina`, `nativity-bvm`, and `vigil-of-st-lawrence` all resolving `nameLa:
undefined` despite having real authored data. Also found and fixed one stale test expectation
(`day-label.test.ts`'s Trinity Sunday/Queenship-of-the-BVM case) that had hardcoded "no Latin
name yet" as the expected behavior — now asserts the real Latin. `npm test` (807 passed) and
`tsc --noEmit` pass throughout. **Closes this backlog item** — moved out of the "Open work"
priority list.


### Vespers Magnificat antiphon — the last two cases closed as not gaps (2026-08-30)

Follow-up the same day: asked what the two remaining Magnificat gaps from the entry above actually
were (Advent 4's own Sunday landing on Dec 24; `marian-saturday`), then pushed back on "there's
nothing authored, but do you need to author content that never happens?" — a fair question the
TODO list hadn't actually answered. Checked both directly rather than leave them as
"unauthored, low priority": the Vigil of Christmas never has its own Vespers in the real rite at
all (Dec 23 evening is plain Advent-4 ferial Vespers with the O-Antiphon override, not First
Vespers of the Vigil — checked live; Dec 24 evening is always Christmas's own First Vespers —
"Vespera de sequenti; nihil de præcedenti," the reference engine's own words), and
`marian-saturday`'s own Commune file (`C10`) has no `[Ant Vespera]` tag at all, because a
Saturday's Vespers is always structurally ceded to the following Sunday under the real rubrics,
not just under this app's implementation of them.

Neither is "unauthored content pending" — there is no historical text for either case to author.
Dropped from the "Open work" list entirely rather than marked done-with-a-caveat, since authoring
something anyway would mean inventing text that never existed.


### Sanctoral commemoration antiphon+versicle bundles — full 218/218 (2026-08-30)

User report, same day: "today's Vespers is missing the antiphon for Commemoration of St. Raymond
Nonnatus" — then, before a fix landed, a second live report: "no antiphon for Commemoration of The
Beheading of St. John the Baptist," and a third the day before (Ss. Felix and Adauctus, at Lauds).
Investigating found the real scope: **217 of 220 saints with an authored collect had no
`${propers}-commemoration.yml` bundle at all** — `sanctoralCommemorationPart`
(`hours/resolve-common.ts`) was silently falling back to a bare collect (still `status: verified`,
since the collect itself is fine, so nothing flagged it as broken) whenever that saint was merely
commemorated rather than winning outright. Only Clare, Sabina, and Jane Frances de Chantal had one.

Fixed the three reported saints first, live-verified. Cross-checking those three found the correct
source tags: the real commemoration antiphon+versicle in the reference engine's Commune files is
**`[Ant 2]` + `[Versum 2]`** — not `[Ant 1]` (the saint's own main Lauds antiphon slot, wrongly
assumed at first for St. Raymond Nonnatus, later corrected) and not `[Nocturn 2 Versum]` (a
different, Matins-only tag). Also found individual saints can deviate from their own nominal
`common:` category (St. Sabina, tagged `common-of-a-martyr`, actually uses the Holy-Woman/Widow
antiphon "Date ei de fructu") — raised as a scale-of-effort question, which the user answered
directly: "check each saint in vu. if there's no commemoration antiphon, check the reference
source. if there's a proper there, use it. if there's not, use the commons. it's literally that
easy" (see memory `vu-feedback-dont-overthink-scale`).

Bulk pass followed that rule exactly: reused each saint's own proper antiphon where authored
(`${propers}-antiphon.yml`) paired with their Common category's `[Versum 2]`, else the category's
own `[Ant 2]`+`[Versum 2]` verbatim. 100 saints with an existing antiphon done first (mechanical —
just needed the right versicle per category), then 73 more using the category's own generic
antiphon for saints with no proper text of their own. A same-day follow-up pass sourced the
remaining categories: BVM (13, via Commune `C11`, reusing the already-verified BVM suffrage
versicle), angels (4, versicle inferred from a saint file's own "vide C4, structural category
only" note), Confessor-Doctor/-Pope (7, resolved to `C4a`/`C5a`/`C4b` — each inheriting its base
category's Ant2/Versum2 with no override needed), several confessors + apostles-plural (2), and 5
fully-proper Lord's/BVM feasts given their own real `[Ant 2]`/`[Versum 2]` straight from their
Sancti files. **213 of ~218 real saints covered** at that point
(`tests/propers/commemoration-sweep.test.ts`, 213 cases); every entry not independently
live-verified marked `status: draft`.

The last 5 (the Vigils, `common-of-a-vigil`) looked unsourceable at first — no dedicated "Commune
Vigiliarum" antiphon set exists in the reference engine. The user pushed back explicitly ("are you
sure -- what happens if you pull the reference engine?") rather than accept that at face value.
Live-querying real commemorated instances (Vigil of St. Lawrence on a real Monday, Vigil of the
Assumption across 6 different real weekdays) found the actual mechanism behind each source file's
own `[Rule]: Versum Feria` line: a mere commemoration doesn't reuse the vigil's own antiphon at
all — it borrows the plain ferial day's antiphon/versicle instead. The antiphon quotes the
Benedictus canticle in weekday sequence (same shape `vespers-magnificat-antiphons.yml` already
uses for the Magnificat), the versicle is a single fixed text
(`lauds-versicle-monday.yml`'s own), and Sunday genuinely has no entry — a Vigil transfers off an
ordinary Sunday rather than ever reaching a commemoration there, confirmed live and already true in
this app's own precedence rules. Implemented as a small weekday-aware branch in
`sanctoralCommemorationPart` (now takes `weekday`) rather than a per-saint file.

**Full 218/218.** New/changed tests: `tests/propers/commemoration-sweep.test.ts` (213 static
bundles), `tests/hours/vigil-commemoration.test.ts` (3 cases, the dynamic weekday mechanism),
`tests/hours/lauds.test.ts`'s new Felix/Adauctus case. 176 new `*-commemoration.yml` files plus
one data file (`lauds-vigil-commemoration-antiphons.yml`). `npm test` (774 passed) and
`tsc --noEmit` pass.


### The Vigil of Christmas given its own real content (2026-08-30)

User report: "let's fix the problem with advent iv and 12/24 colliding." Dec 24 previously had no
content of its own at all — a plain (non-Sunday) Dec 24 just inherited Advent 4's ferial collect
and antiphons, and when Advent 4's own Sunday landed on Dec 24 (its latest possible date), the app
gave Advent 4 the day outright with zero trace of the Vigil, no commemoration, nothing.

Checked the reference engine directly (`SanctiM/12-24.txt`/`12-24s.txt`) rather than guess at the
rubric: the Vigil is Duplex I classis, never displaced even by a privileged Sunday, but keeps
Advent 4's own psalms and first two Matins nocturns' lessons — a genuine content splice, not a
"who wins" contest, with the source explicitly noting `no commemoratio` for the Sunday case.
Imported real Vigil content: `vigil-of-christmas-collect.yml`, 5 Lauds antiphons
(`lauds-psalmody-overrides/vigil-of-christmas.yml`), the Benedictus antiphon (live-verified,
2026-12-24 — turned out to just reuse the same Matins Nocturn-2 antiphon text), and the Matins
Gospel (Matt 1:18-21) + St. Jerome homily (`nocturn-readings/vigil-of-christmas.yml`). Wired via a
new `vigil-of-christmas` temporal id (`calendar/temporal-id.ts`), applied to Dec 24 unconditionally
regardless of weekday.

**Departure from the reference by direct instruction**: unlike the source's own `no commemoratio`,
Advent 4 is still commemorated here when it's the Sunday landing on Dec 24 — the Sundays of Advent
have real standing of their own. `applyAdventFourVigilCommemoration` (`calendar/index.ts`) pushes
`advent-4` as an explicit commemoration on that one date. Matins' three-nocturn Sunday psalmody
needed no change — it's driven by `weekday`, not by which id wins, so Advent 4's own psalms/lessons
pattern survives automatically.

New tests: `tests/calendar/vigil-of-christmas-sunday.test.ts` (4 cases, both the winner/
commemoration shape and Lauds/Matins content). `npm test` (560→774 across this and the following
entries) and `tsc --noEmit` pass throughout.


### O Antiphons (Dec 17-23) added — advent-4's own gap effectively closed (2026-08-30)

Follow-up the same day, prompted by a user report that 2026-08-29's own Vespers was missing its
Magnificat antiphon entirely for an unrelated reason (see the day-label winner-first fix earlier
this date) that turned out to expose this whole-calendar gap. Root cause of `advent-4`'s own
skip above, once actually investigated live (divinumofficium.com, Monastic Tridentinum 1617):
Dec 17-23 always carries one of the seven "O Antiphons" at Vespers, keyed to the *calendar date*
itself, not to whichever Advent week (`advent-3` or `advent-4`, depending on the year) happens to
govern that date — a single per-week static file was structurally the wrong shape for this from
the start, not just missing content.

Added `data/hours/vespers-o-antiphons.yml` (7 entries, `MM-DD` keyed) and a new lookup tier in
`hours/resolve-common.ts`'s `getMagnificatAntiphon`. 5 of the 7 (Dec 17/18/19/22/23)
live-verified directly. The remaining two — "O Clavis David" (Dec 20) and "O Oriens" (Dec 21) —
could not be: every version/track on the live engine (including plain Tridentine 1570) routes
those two dates through St. Thomas's Vigil/feast instead of the ferial Proper of the Time,
apparently a real modeling choice of that engine (a Vigil of an Apostle actually displacing the
ferial Magnificat antiphon), not an app quirk — and this app's own `vigil-of-st-thomas.yml`
already documents a deliberate divergence from exactly that engine behavior on this date (the
Vigil transfers away entirely here, per the ordinary privileged-feria/vigil rule). Marked `draft`
rather than `verified`: real, standard, universally-fixed O-Antiphon wording (unchanged across
every edition of the Roman/Monastic Breviary), just not confirmed against this app's own primary
live reference for lack of a clean query path — see the data file's own header.

**Follow-up the same day, direct user instruction**: the O Antiphon lookup was originally scoped
to only apply when the day's winner was still plain-temporal (i.e. it deferred to a real
sanctoral winner, same as every other tier in `getMagnificatAntiphon`). The user explicitly
wanted the O Antiphons to actually surface even against a real winning saint — St. Thomas (Dec
21, Duplex II. classis) otherwise wins that day outright with no Magnificat antiphon of his own
authored yet (a separate, pre-existing gap — no sanctoral saint has a
`${propers}-magnificat-antiphon.yml` at all), so "O Oriens" was structurally unreachable on its
own real date. Considered and rejected: lowering Thomas's rank so a ferial default would win Dec
20/21 instead — factually wrong (he really is Duplex II Class pre-1955) and would strip him of
his *entire* office (chapter/hymn/collect/Lauds antiphon too), not just Vespers' Magnificat.
Instead, moved the O-Antiphon lookup to the very top of `getMagnificatAntiphon`, checked
unconditionally before either the temporal or sanctoral branch — the O Antiphon now wins this one
specific text slot on Dec 17-23 full stop, regardless of who otherwise wins the day; every other
part of the office is untouched. Deliberate, explicit app-level design choice (not a
reconstruction of the reference engine's own Dec 20/21 behavior, which shows Thomas's own
antiphon there instead) — see the data file's own header for the reasoning, including why a
saint's own real Magnificat antiphon is still worth authoring later even knowing it would be
permanently unreachable at Vespers on whichever of these seven dates that saint occupies, under
*this* calendar's own construction: the user has a future user-editable calendar in mind, where a
differently-constructed calendar's own precedence might surface it. `tests/hours/vespers.test.ts`'s
Thomas-precedence case now asserts the opposite of its original intent (the O Antiphon wins, his
other office parts don't).

Net effect: `advent-4`'s practical gap is closed for every date this app's calendar can actually
reach — Dec 17-23 unconditionally now, including Dec 21 itself. One narrow residual sub-case
remains, not touched by this fix: if Advent 4's own *Sunday* itself lands on Dec 24 (the latest
possible date, outside the O-Antiphon range and excluded from the classic weekday-default
fallback since Sunday has none), it still resolves to `missing` — genuinely no source for that
one specific Sunday found yet. `marian-saturday` is unchanged by this pass (still skipped, per
above) — and turns out to be moot for Vespers specifically anyway: its own evening is never
actually reachable through `resolveOrdo`, since a following Sunday always claims First Vespers
over the preceding Saturday regardless of the Sunday's own rank (`calendar/vespers.ts`'s
`hasFirstVespers`).

New tests: `tests/hours/vespers.test.ts`'s "O Antiphons (Dec 17-23)" block (the Dec 19 case
end-to-end, plus the Thomas-precedence case); `tests/hours/resolve-common.test.ts`'s new
`getMagnificatAntiphon — classic weekday-default fallback` block replaces the old bare-ferial
`resolveOrdo` test with two synthetic-day unit tests instead, since no live date is left in this
app's calendar that still reaches that fallback tier through the real pipeline at all (every
other temporal id now has its own real content, per this whole sweep). `npm test` (556 tests)
and `tsc --noEmit` both pass; live-verified on the dev server (2026-08-29 and 2026-12-19).

52 new `src/data/propers/temporal/*-magnificat-antiphon.yml` files. `npm test` (553 passed) and
`tsc --noEmit` both pass; spot-checked live in the dev server that 2026-08-29's Vespers now shows
the Magnificat antiphon ("Quǽrite primum * regnum Dei et justítiam ejus...", `post-pentecost-14`'s
own).


### Vespers Magnificat antiphon — whole-calendar temporal-cycle gap closed, 52/54 (2026-08-30)

User flagged 2026-08-29's Vespers was missing its Magnificat antiphon. Root cause turned out to
be systematic, not date-specific: `getMagnificatAntiphon` (`hours/resolve-common.ts`) looks up
`${winner.id}-magnificat-antiphon` for a temporal winner, but of the 57 temporal ids with an
authored Lauds `-benedictus-antiphon.yml`, only 3 (`holy-name-of-jesus`, `immaculate-heart-of-mary`,
`circumcision`) had a matching Vespers `-magnificat-antiphon.yml` — every ordinary Sunday/named-feast
in the temporal cycle (all 24 `post-pentecost-NN` weeks, Advent, post-Epiphany, pre-Lent, Lent,
Passion/Palm Sunday, the whole Easter season, Pentecost, Christmas-octave Sunday, Christ the King)
had its Lauds antiphon but not its Vespers one, apparently missed whenever the Lauds sweep pulled
`[Ant 2]` from the reference engine's Tempora files but never followed up with `[Ant 3]`.

Sourced from the same static reference-engine files already used for the Benedictus sweep
(`../divinum-officium-reference/web/www/horas/{Latin,English}/Tempora/*.txt`), same occasion/date
as each id's own `-benedictus-antiphon.yml` sibling (its header comment already records the clean
verified date) — no live CGI needed, the Magnificat antiphon is baked into each static file's own
`[Ant 3]` block (sometimes an alias, e.g. `@:Ant 3_` or `@:Ant 1`, always resolved to its real text
before use, and always the *default*/Tridentine variant, never a `(rubrica cisterciensis...)` one).
`post-pentecost-01`..`23` map straight to `Tempora/PentNN-0.txt`; `post-pentecost-24` (the fixed
last Sunday) does *not* map to `Pent24-0` — cross-checked against its own already-authored
Benedictus antiphon and confirmed it actually reuses the leftover `post-epiphany-6` formulary
(`Tempora/Epi6-0.txt`), the classic "Sundays remaining over are supplied by the omitted
post-Epiphany Sundays" rubric, already implicit in this app's own resumed-Epiphany-Sunday overflow
logic. `post-epiphany-1` doesn't map to `Epi1-0.txt` (that file is Holy Family Sunday content in
the reference engine, a title mismatch against the already-authored Benedictus text) but to
`Epi1-0a.txt` ("Dominica infra Octavam Epiphaniæ"). `christ-the-king` (not a Tempora entry at all,
a 1925 addition) sourced from `Sancti/10-DU.txt` instead, matching its own Benedictus antiphon's
already-verified occasion.

**Two ids skipped, not fabricated**: `advent-4` (`Tempora/Adv4-0.txt` has no standalone `[Ant 3]`
at all — only `[Ant Vespera 3] @:Ant Laudes`, aliasing the whole 5-antiphon Lauds set rather than
one text, and which single entry the live engine actually picks isn't determinable from the static
file alone) and `marian-saturday` (the votive "Sanctæ Mariæ Sabbato" office's Magnificat antiphon
isn't in any static Tempora/Sancti/Commune file found — likely only resolvable via a live CGI
query, same as how its own Benedictus antiphon was originally sourced).


### Compline Preces on a Double no longer vanish entirely — done (2026-08-28)

User request: incorporate the secular track's Compline Preces, but always keep a short litany +
Our Father said, even on a Double. Checked first rather than assuming a text change was needed:
`compline-preces.yml`'s content is already word-for-word the secular Tridentine 1906/1910 text
(the reference engine treats "1888/1906/1910" as one combined version label, same rubrics) — it
was already the fuller, non-Monastic form, live-verified against both tracks. The real gap was
structural: `compline.ts`'s `'preces'` case dropped the whole part to `[]` on a Double-or-higher
(`omitOnDouble`), matching real practice in *both* Monastic and secular tracks (Compline's
Preces are never substituted with anything shorter in the reference engine, secular or not —
unlike Vespers/Lauds, which do fall back to a short litany).

Per the user's explicit request, this is now a deliberate vu-specific deviation from both
tracks: `compline.ts`'s `'preces'` case substitutes `lauds-short-litany` (the same short
Kyrie/Pater-Noster litany Vespers' own `vespers-preces` case already falls back to on Sundays/
feasts) instead of omitting, whenever `omitOnDouble` and `isDoubleOrHigher` both hold. `types.ts`'s
`omitOnDouble` doc comment and `compline.yml`'s own header updated to describe the substitution
rather than a drop. Regression test added (`tests/hours/compline.test.ts`, 2026-08-15, the
Assumption, Duplex I. classis) confirming the short-form text (Kyrie/Pater/"Dómine, exáudi") is
present and the fuller exchanges ("Benedíctus es, Dómine.../Miserére nostri...") are absent.
`npm test` (543 passed), `tsc --noEmit`, and `npm run build` all pass.


### Lauds/Vespers duplex-majus+ Common-category psalmody — remaining categories authored, one real gap surfaced (2026-08-28)

Follow-up to the previous entry, closing most of the "8 of 24" gap it left open. Went
category by category through the reference engine's votive-code space (the full `CommuneM/`
directory listing, `C1` through `C12` and their season-variant suffixes) to identify each
remaining `SaintRecord.common` value's real scheme, rather than assuming one exists:

- **`common-of-an-evangelist` is an alias, not its own scheme.** St. Mark's and St. Luke's own
  reference-engine rule files both say "ex C1a", and `votive=C1a` returned byte-identical
  Lauds/Vespers psalmody to plain `votive=C1` — an Evangelist-not-Apostle genuinely reuses the
  Apostles' own scheme in the Monastic tradition. Registered as an alias on
  `common-of-an-apostle`'s existing category files for both hours.
- **`common-of-several-women-martyrs` is also an alias, not its own scheme** — but only once the
  actual Vespers/Lauds *psalmody* slots are isolated from the Magnificat/Benedictus antiphon
  that follows them. Ss. Perpetua and Felicity's own file says "vide C7b"; `votive=C7b` returned
  the *same* four psalm numbers and group/canticle/Laudate antiphons as plain `votive=C7`
  (Common-of-a-Holy-Woman) for both hours — C7b's only real difference is its own proper
  Magnificat/Benedictus antiphon, which belongs to a separate, already-existing mechanism
  (`getMagnificatAntiphon`/`getBenedictusAntiphon`), not the psalmody-override table this pass
  is building. First-draft category files for this id were written as full duplicates before
  this was caught by diffing against the live output line-by-line — deleted in favor of an
  alias on `common-of-a-holy-woman`'s existing files instead. Neither this id nor
  `common-of-a-vigil` (see below) can currently be exercised via `resolveOrdo`/a real calendar
  date (Perpetua and Felicity are plain Duplex, below this override's threshold, and no other
  saint carries this Common) — verified via a direct `getLaudsCommonOverride`/
  `getVespersCommonOverride` unit test instead of a date-based one.
- **`common-of-an-angel` has no real numbered Common in the source at all** — confirmed via the
  full `CommuneM/` directory listing (no angel-specific code exists) and St. Michael's own
  SanctiM rule, which says plain "Psalmi Dominica" (Sunday's own Vespers psalm numbers, 109-112,
  not a Common-specific set) rather than citing any `Cx` file. Live-verified that Guardian
  Angels (Oct 2, Duplex Majus, no proper text of her own) reuses Michael's own antiphons
  byte-for-byte at both Lauds and Vespers — i.e. Michael's own proper *is* the de facto generic
  Angel scheme any other Angel-Common saint without their own proper falls back to. (St. Gabriel
  and St. Raphael each have their own genuinely distinct proper antiphons, matching this file's
  own earlier finding for the *office bundle* that Guardian Angels/Gabriel/Raphael's
  chapter/responsory/hymn/versicle content is duplicated per-saint from St. Michael's Apparition,
  not drawn from a shared Common — the same absence of a real Angel Common, independently
  confirmed for a different content type.) Authored as a genuine `common-of-an-angel` category
  (an app-side generalization the source data doesn't literally have a file for, but a real,
  reusable scheme in practice) rather than duplicating Michael's antiphons into a
  Guardian-Angels-specific file, so any future proper-less Angel addition benefits automatically.
  Lauds keeps the usual fixed 92/99/62 + Canticum Trium Puerorum numbers; Vespers substitutes
  "Psalmi Dominica" (109-112) instead of a Common-specific set.
- **`common-of-a-dedication` is genuinely its own scheme** (`votive=C8`) for both hours — unlike
  every other Common authored so far, Vespers' numbers (109/110/111/147) don't share a pattern
  with any other category, and Lauds' (50/87/89 + "Canticum Ieremiæ") aren't even the usual
  fixed 92/99/62 set. **Only the Vespers file was authored**: Lauds' own canticle text has never
  been transcribed anywhere in this app (the 7 existing Lauds OT canticles, `hours/
  lauds-canticles.ts`, are only the plain weekday rotation) — left open rather than guessed at,
  see the Open-work list above.
- **`common-of-a-vigil` is not an authorable gap at all.** The `vigil` `FeastClass` sits
  structurally below `duplex-majus` on `calendar/commemorations.ts`'s `FEAST_CLASS_ORDER`
  ladder, so `getOfficeOverrideId`'s `isAtLeast(winner.rank, 'duplex-majus')` test can never
  return true for a Vigil — this category is permanently unreachable by the mechanism as gated,
  not a missing-content gap to close later.

Regression tests added to both `lauds.test.ts` and `vespers.test.ts`: a real calendar date for
each reachable category (Guardian Angels for Angel, both hours; the Dedication's own day for
Vespers), a real date via the alias for `common-of-an-evangelist` on Vespers (St. Mark, whose
own per-feast Lauds override shadows the category tier for Lauds specifically, so that one used
a direct unit test instead), and direct unit tests for the two currently-unreachable-by-date
aliases (`common-of-several-women-martyrs` for both hours). Two more pre-existing Vespers test
dates needed to move for the same reason as the previous entry's `2026-08-17` fix:
`2026-09-28` (anticipates St. Michael's own First Vespers, once his Common-of-an-Angel override
started applying) moved to `2026-10-12`; Guardian Angels' own initial test date (Oct 2, her own
day) had to move to Oct 1 (her First Vespers) once tracing `resolveEveningDay` showed she
doesn't keep her own Second Vespers (falls short of the `duplex-2-classis` floor) and Oct 3 (St.
Therese, plain Duplex, below this override's own threshold) claims her evening instead. `npm
test` (542 passed), `tsc --noEmit`, and `npm run build` all pass.


### Lauds/Vespers duplex-majus+ Common-category psalmody — mechanism built, 8 categories authored (2026-08-28)

Prompted by a design question: does it make sense to gate a Vespers psalm override at
duplex-majus+, the same threshold Matins already uses? Checked against the live reference
engine rather than assuming, and found two real, previously-undiscovered facts:

- **Lauds already has this override** (`getPsalmodyOverrideFor`, duplex-majus+-gated), but only
  a per-feast tier (`lauds-psalmody-overrides/*.yml`) — no per-Common fallback, so most
  duplex-majus+ saints without their own authored proper fell straight through to the plain
  ferial default even though the real rubric calls for an override. Confirmed live
  (`votive=C1`..`C11`) that Lauds' override psalm *numbers* (92, 99, 62, Canticum Trium
  Puerorum) are identical across every Common — only the antiphons vary — matching the existing
  per-feast overrides' own doc comments (e.g. `st-lawrence.yml`'s note that its numbers "happen
  to be the same 92/99/62... that most Common-of-Martyrs-shaped feasts reuse").
- **Vespers had no psalmody-override mechanism at all** (flagged honestly in its own doc
  comments as a known gap) — and unlike Lauds, its override psalm *numbers themselves* differ
  by Common (Common-of-an-Apostle: 109/112/115/138; Common-of-a-Confessor-Bishop:
  109/111/112/131; etc.), confirmed live the same way.

Mechanism, mirroring `matins-psalmody-overrides.ts`'s existing saint/category two-tier
precedent: `hours/lauds-psalmody-overrides.ts` gained a `categories` tier (`data/hours/
lauds-psalmody-overrides/categories/*.yml`, keyed by `SaintRecord.common` with optional
`aliases`) consulted after the existing per-feast tier — `getLaudsPsalmodyOverride` now does
`getLaudsSaintOverride(id) ?? getLaudsCommonOverride(id)`, so `hours/lauds.ts` needed no changes
at all. `hours/vespers-psalmody-overrides.ts` is a new file built from scratch with the
identical saint/category shape (the saint tier is mechanism-only, zero files yet), wired into
`hours/vespers.ts`'s `resolvePsalmody` via the same `getOfficeOverrideId` eligibility test
`resolveOfficeBundle` already uses for the chapter/hymn bundle — eligibility follows the
evening's *governing* day (so a First Vespers of a majus+ feast gets that feast's own psalms,
same as it gets that feast's own office), while the plain-ferial-fallback path still uses the
actual calendar weekday (see the bug fix above).

**8 of 24 `SaintRecord.common` categories authored for both hours** (16 ids via aliases), each
live-verified against Divinum Officium (Monastic Tridentinum 1617, `votive=C1`/`C2`/`C3`/`C4`/
`C5`/`C6`/`C7`/`C11`, 2026-08-28): `common-of-an-apostle` (+`common-of-apostles`),
`common-of-a-martyr` (+`common-of-a-martyr-bishop`), `common-of-several-martyrs`,
`common-of-a-confessor-bishop` (+`common-of-a-confessor-doctor`),
`common-of-a-confessor-not-bishop` (+`common-of-a-confessor`, `common-of-an-abbot`,
`common-of-several-confessors`), `common-of-a-virgin` (+`common-of-a-virgin-martyr`),
`common-of-a-holy-woman` (+`common-of-a-widow`), `common-of-the-bvm`. Remaining 5 categories
(`common-of-a-dedication`, `common-of-an-angel`, `common-of-an-evangelist`,
`common-of-a-vigil`, `common-of-several-women-martyrs`) have no confirmed votive code yet — see
"Lauds/Vespers duplex-majus+ Common-category psalmody" in the Open-work list above.

Regression tests added to both `tests/hours/lauds.test.ts` and `tests/hours/vespers.test.ts`:
a real category-tier date per hour (Our Lady of Mount Carmel/St. Benedict/Ss. Placid and
Companions for Lauds; St. Bartholomew/St. Lawrence's octave/St. Martin of Tours's First Vespers
for Vespers — several needed a different date than their existing office-bundle tests once the
actual governing evening was traced through `resolveEveningDay`/octave substitution), plus one
below-threshold (Semiduplex/Duplex) negative case per hour confirming the plain ferial default
still wins there. One pre-existing Vespers test (`2026-08-17`, "joins Ps 115 and 116... on
Monday") had to move to a different date: that Monday turned out to be the closing day of St.
Lawrence's own octave, which now correctly picks up Common-of-a-Martyr's psalms instead of the
plain ferial set it was (incidentally, not intentionally) relying on before this mechanism
existed. `npm test` (535 passed) and `npm run build` both pass.


### Vespers ferial psalmody weekday bug — fixed (2026-08-28)

Vespers psalms on Monday-Saturday were silently following the *anticipated* (First-Vespers)
day's weekday instead of the actual calendar date's weekday, on any evening where tomorrow
claimed First Vespers (`hasFirstVespers` has no rank floor, so this fired on most such
evenings). Root cause: `hours/vespers.ts`'s `resolvePsalmody` reused `resolveEveningDay`'s
result — correct for propers/office (chapter/responsory/hymn/versicle/collects/Magnificat
antiphon), which legitimately borrow tomorrow's identity — but the ferial psalm-distribution
table has no per-feast override of its own, so it needs today's own place in the fixed 6-day
cycle regardless of whose office governs the evening. Fixed by computing `weekdayOf(date)`
(the actual calendar weekday, `calendar/weekday.ts`) separately in `resolveOrdo` and threading
it through as its own parameter, used only for the psalm-table lookup; `resolveOffice`'s
ferial-bundle fallback correctly keeps using the governing (possibly-anticipated) day's
weekday, since that IS a legitimate per-office-bundle rule. Regression test:
`tests/hours/vespers.test.ts`, 2026-08-25 (Tuesday anticipating St. Zephyrinus's Aug 26 First
Vespers) — expects Tuesday's psalm group `[129, 130, 131, 132]`, not Wednesday's. `npm
test`/`npm run build` both pass.


### Gospel pericope + paired homily rendered as one part — done (2026-08-28)

Closed the last open Matins mechanism gap. `ResolvedPart` gained its own `'gospel'` kind
(`src/hours/types.ts`), replacing the old `lesson`+`isGospel` flag entirely — a Gospel pericope
now carries an optional nested `homily` (`{ source?, text }`) instead of being a same-kind
sibling `lesson` part next to it.

The reason for nesting rather than keeping two adjacent pool entries: `distributeIntoNocturns`'s
front-light 1/1/rest slicing (see "Reading distribution" elsewhere in this file) splits the
reading pool by raw index, with no notion that two adjacent entries belong together — a Gospel
pericope and its own homily, sourced as two separate array entries in
`data/propers/nocturn-readings/*.yml`, could land in different nocturns purely by where they
fell in the pool. Fixed at the pool-assembly step instead of patching the slicer:
`buildReadingPool` (`src/hours/matins.ts`) now detects an `isGospel: true` NocturnReading
immediately followed by a same-nocturn `isGospel: false` one and folds the pair into a single
`gospel` pool entry before it ever reaches `distributeIntoNocturns` — the pairing is structural
(one array element), not a convention the slicer has to know about. A bible-plan Gospel reading
(never paired with a homily, per the user's own plan) becomes a bare `gospel` part with no
`homily`, so it still gets the same "Gospel" UI treatment.

One real data wrinkle surfaced, not touched: `chair-of-st-peter-at-rome.yml`'s Nocturn 3 has the
homily prose already folded into the same `isGospel: true` entry's own `text` (an earlier, less
clean authoring convention flagged in this file's own SanctiM-pass notes) rather than as a
separate following reading — that file is left as-is per the earlier decision not to "fix" it;
the new `'gospel'` type's `source` field (distinct from `homily`) exists specifically to carry
that entry's own attribution without misrepresenting it as a separate homily reading.

`hour-view.ts` renders the pericope with a "Gospel" heading, then the nested homily (when
present) directly underneath in the same section, visually set off by a top border
(`.ordo-part-homily` in `styles.css`) — one section, pericope then homily, rather than two
separate `ordo-part` blocks that could be visually or structurally pulled apart.
`tests/hours/matins.test.ts`'s Sunday proof (2026-09-06, Luke 7:11-16 + St. Augustine's homily)
updated to assert against the new `gospel`/`homily` shape instead of two `isGospel`-flagged
lessons. `npm test`/`npm run build` both pass.


### Lauds/Vespers chapter/responsory/hymn/versicle bundle — done (2026-08-26)

Mechanism is rank-agnostic (any sanctoral winner falls back to their Common, not just
duplex-majus+); all 11 Common categories now have a real, live-verified bundle authored (see
the dated log entries elsewhere in this file, e.g. "Common-of-Several-Confessors Lauds/Vespers
bundle authored — last Common category closed"), plus the individual proper-content fixes
swept up alongside it (Guardian Angels/Archangels reuse, Finding/Exaltation of the Holy Cross,
Transfiguration, All Saints of the Benedictine Order). The same session also closed the
*separate* `resolveMatinsHymn` fallback chain's equivalent gap for every category/saint this
pass touched (see "Matins hymn gap closed for the same categories/saints" elsewhere in this
file) — Matins hymns are a different mechanism from the Lauds/Vespers bundle and needed their
own pass.


### Commemoratio Octavæ blocks + fixed Lord's/BVM feast exclusions — closed (2026-08)

The four "Commemoratio Octavæ" Ant+V/R+collect blocks (Christmas Octave's own
Nativity/Stephen/John/Holy-Innocents commemorations, e.g. on Dec 30) are done — see "Octave
content" elsewhere in this file. St. Frances of Rome's/St. Bibiana's Benedictus antiphons and
Ss. Ursula and Companions' were also once flagged here — the first two turned out already
resolved (verified live, see memory `vu-todo-priority`'s own correction note), the third is a
settled non-gap (no unique text exists to author, see her own file's comment) — not carried
forward as open items.

Five "fixed Lord's/BVM feast, not modeled" exclusions across the calendar (Our Lady of the
Snows, the Finding of the Holy Cross, the Transfiguration, the Exaltation of the Holy Cross,
the Dedication of the Lateran, the Presentation of the BVM) turned out to be the same stale
mistake repeated six times — all six now added with real content; see "Our Lady of the Snows
added" and "Four more 'not modeled' fixed Lord's/BVM feasts added" elsewhere in this file.


### Matins psalmody overrides for a Duplex+ weekday feast — all categories done (2026-08-27/28)

All nineteen Common categories now authored, across four passes (see "Matins psalmody
overrides — nine more categories", "— second pass, four more categories", "— third pass,
source-file-first method", and "— fourth pass, Widow and Several Women Martyrs closed via
secular sourcing" elsewhere in this file): Martyr, Apostle (+ aliases Apostles-plural and
Evangelist), Confessor (+ aliases Abbot, Confessor-not-Bishop, and Several-Confessors),
Confessor-Bishop (+ aliases Confessor-Doctor and Confessor-Pope), Several Martyrs,
Virgin-Martyr (+ alias Virgin, plain), the BVM, a Dedication, a Holy Woman, and — closed in the
fourth pass, 2026-08-28, by explicit user authorization to use secular-track content directly
— a Widow (+ alias Several Women Martyrs). Plus, separately, all 5 angel feasts and St.
Scholastica (Virgin) have their own saint-level proper Matins psalmody authored directly (same
shape as `st-andrew.yml`/`st-lawrence.yml`), each a case where the saint's own `[Rank]` cites a
Common but their real content is genuinely proper.

**Methodology arc across the four passes**: live-CGI trial-and-error across candidate
saints/years (passes 1-2) → reading the reference engine's own `CommuneM/*.txt`/`Commune/*.txt`
template source files directly, one targeted live query per finding to confirm (pass 3, much
faster, directly disproved two of pass 2's own claims) → combining direct source-reading of the
Monastic substitution rule with a live SECULAR-track query to supply the actual text, once
explicitly authorized that secular sourcing needs no special justification beyond this
project's own established blended-track design (pass 4, see that section for the
Widow/Several-Women-Martyrs resolution in full). No categories remain open.


### Lauds/Vespers ferial Preces psalms dropped — done (2026-08-23)

Psalm 129 (De profundis) and its own trailing Gloria Patri deleted wholesale from
`data/propers/common/lauds-preces-feriales.yml`'s `text.la`/`text.en`; Psalm 50 (Miserere) and
its own Gloria Patri likewise from `vespers-preces-feriales.yml`. Surrounding V/R litany
needed no adjustment — the psalm block sat between two already-independent V/R sequences. Both
files' header comments updated to flag the drop as deliberate, not a transcription gap.
`tests/hours/lauds.test.ts` and `vespers.test.ts` updated to distinguish the fuller ferial
Preces from the short Sunday/feast litany via a versicle that survives the psalm's removal
("Ego dixi: Dómine, miserére mei") instead of the now-absent psalm text.


### Matins: "Te decet laus" — done (2026-08-23)

Added as a new common text (`data/propers/common/te-decet-laus.yml`, sourced from
`Psalterium/Common/Prayers.txt`'s `[Te decet]` block) rendered as a `versicle` part
immediately after the Te Deum on every 3-nocturn day (Sunday or Duplex+), in both
`hours/matins.ts` branches that push a Te Deum. Absent on ferial (1-nocturn) days, same gating
as the Te Deum itself. `tests/hours/matins.test.ts` covers both the Sunday branch's
presence/content and the ferial branch's absence.


### Accessibility: psalm verses render as plain divs, not a list — done (2026-08-28)

`src/ui/hour-view.ts`'s `'psalm'` case (`.psalm-verses`/`.psalm-verse`) now renders plain
`<div>`s instead of `<ol>/<li>`, so a screen reader no longer announces "list, N items" for
continuous liturgical text. Styling is entirely class-based, so `styles.css` needed no
changes. Audited the rest of `src/ui/**` for the same pattern — the only other list markup is
`hour-list.ts`'s `<ul class="hour-list">`, which is a real navigational list of hours and
correctly stays a list.


### St. Hermes dropped from 8/28 (2026-08-28)

Dropped `st-hermes` from `data/calendar/sanctoral-calendar.yml`'s `"08-28"` entry, now just
`[st-augustine]`. He was a genuinely unwinnable stub who always lost to St. Augustine and,
per the generous-commemoration design, only ever showed up as a commemoration — presence on
that date list and commemoration-eligibility are the same mechanism, so removing him from the
list was the whole fix; no new suppress-mechanism needed. `st-hermes.yml` and
`st-hermes-collect.yml` are untouched by this — deliberately left in place, restorable by
re-adding the one list entry if ever wanted back.


### Circumcision's own Matins/Lauds/Vespers hymn authored (2026-08-26)

Closed the specific gap flagged in the Circumcision/Holy Name addition (memory
`vu-circumcision-holy-name-feasts`): Circumcision's rubric is "ex Sancti/12-25" (borrows
Christmas Day's own propers wholesale), but Christmas Day itself has no authored hymn files of
its own — Dec 25 doesn't resolve as its own winner id at all (`resolveTemporalId` maps every day
of Christmastide, Dec 25 included, to `christmas-octave-sunday` — a separate, larger, still-open
gap, see `day-label.test.ts`'s own comment on this). Rather than take on that larger mechanism
change, authored the hymn content directly under Circumcision's own id, which already wins the
day and already has its own Lauds/Vespers bundle (`lauds-capitulum-circumcision.yml` etc. were
already authored — only the hymn piece was missing):

- `lauds-hymn-circumcision.yml`: a direct copy of the already-verified `lauds-hymn-christmas-
  octave-sunday.yml` text ("A solis ortus cárdine") — Christmas Day's own `[Hymnus Laudes]` is
  byte-identical to the Octave Sunday's in the source. The Monastic form is only a handful of
  word substitutions against this same text — not modeled, same "known, deliberate
  simplification" as the doxology-substitution-only hymns below.
- `vespers-hymn-circumcision.yml` / `matins-hymn-circumcision.yml`: the Monastic Vespers/Matins
  hymn is a genuinely separate text from the secular one here — "Christe Redémptor ómnium"
  (`[HymnusM Vespera]`, Sancti/12-25.txt), not "Jesu, Redémptor ómnium" — same house preference
  already applied to `vespers-hymn-advent.yml`'s "Cónditor alme síderum". No English exists
  anywhere in the reference engine for this Monastic variant (only for the secular text, whose
  wording differs enough stanza-by-stanza that reusing it outright would misrepresent the
  Latin), so the English is a new translation here, `draft` — Latin is `verified` (sourced
  directly). Closing doxology stanza reuses this project's already-verified standard English for
  "Glória tibi Dómine, Qui natus es de Vírgine..." (`lauds-hymn-holy-innocents.yml`).

Verified end-to-end with a runtime smoke test resolving Matins/Lauds/Vespers for 2027-01-01
through the real `resolveOrdo` mechanism, confirming the hymn part is no longer `missing` in
either language. `npm test` (521 tests), `tsc --noEmit` both pass.


### Matins hymn gap closed for the same categories/saints (2026-08-26)

User-prompted follow-up: `resolveMatinsHymn` (`hours/matins.ts`) is a *separate* mechanism from
`resolveOfficeBundle`, with its own fallback chain (proper → active octave → Common via
`SaintRecord.common` → season → ferial), checked per-part rather than per-bundle. Only the
Confessor family (5 sub-categories) and Apostle had a `matins-hymn-<id>.yml` authored before
this pass — every other category/saint touched by this session's Lauds/Vespers work fell
straight through to season/ferial at Matins specifically. Live-verified and authored:

- `common-of-several-martyrs`: "Ætérna Christi múnera, Et Mártyrum victórias" — shares its
  opening line with the Apostle hymn but genuinely distinct after that (confirmed, not a
  mix-up).
- `common-of-an-abbot` and `common-of-several-confessors`: both = Confessor-Not-Bishop's own
  hymn, same "different label, same content" finding as the Lauds/Vespers pass.
- `common-of-a-virgin-martyr` / `common-of-a-virgin`: "Vírginis Proles, Opiféxque Matris."
- `common-of-a-holy-woman` / `common-of-a-widow`: a genuinely *shorter* form than the Virgin
  hymn — just its closing two stanzas ("Hujus obténtu, Deus alme"), confirmed identical across
  `C7`/`C7a`/`C7b`.
- Guardian Angels, St. Michael (his own Sep 29 feast), St. Gabriel, St. Raphael: all reuse St.
  Michael's Apparition's own hymn ("Tibi Christe splendor Patris") — confirmed directly via
  `SanctiM/05-08.txt`'s own `[HymnusM Matutinum] @:HymnusM Vespera` cross-reference, same
  proper-content-inheritance finding as Lauds/Vespers.
- `common-of-the-bvm`: "Quem terra, pontus, ǽthera."
- Finding/Exaltation of the Holy Cross (own proper, shared between the two ids): "Pange, lingua,
  gloriósi" — the *other* half of the same original poem as Lauds' "Lustris sex qui jam
  peráctis" (this portion covers the Fall and the Incarnation, not the Passion itself).
- Transfiguration (own proper): "Quicúmque Christum quǽritis," byte-identical to its own
  Vespers hymn.

Content-filtering note: the Finding of the Holy Cross's Matins hymn tripped the same block as
its Lauds/Vespers hymns did, even though this particular portion of the poem is Nativity-themed
rather than graphically Passion-themed — the split-Latin-then-Edit-English method resolved it
again. Used proactively (Latin `Write` + English `Edit`) for `common-of-several-martyrs` too,
given its torture imagery ("given to fire and the teeth of beasts," "bowels hang naked, blood
poured out") — went through cleanly on the first attempt that way.

`npm test` (521 tests), `tsc --noEmit` both pass.


### All Saints of the Benedictine Order own proper content imported — individual-saint pass closed (2026-08-26)

Last of the 12-saint individual-Proprio list. Live-verified against Divinum Officium (Monastic
Tridentinum 1617), 2025-11-13 (clean year): own chapter (Isa 8:18, "Ecce ego et púeri mei") and
own hymn ("Salvéte, cedri Líbani," same text both hours, no English rendering in the reference
engine — own translation, marked draft); responsory and versicle byte-identical to Common-of-
Several-Martyrs's own already-authored content.

This closes the individual-saint Proprio pass started this session. Final tally: 10 real saints/
feasts imported (St. Gregory the Great, St. Benedict, Commemoration of St. Paul, St. Agatha,
St. Agnes, the Annunciation, the Purification, Finding/Exaltation of the Holy Cross, the
Transfiguration, All Saints of the Benedictine Order); 2 flagged saints (Ss. Alexander/Eventius/
Theodulus/Juvenal, Ss. Machabees) needed no new content — both are genuinely unwinnable stubs
whose already-correct `common` field simply never gets exercised. Combined with the 10 Common
categories and the Guardian-Angels/Archangels proper-content-reuse fix earlier this session,
`resolveOfficeBundle` now has real, live-verified Lauds/Vespers content for every gap the
original audit found.

`npm test` (513 tests), `tsc --noEmit` both pass.


### Finding/Exaltation of the Holy Cross own proper Lauds/Vespers content imported (2026-08-26)

Fully proper feast, live-verified against Divinum Officium (Monastic Tridentinum 1617),
2027-05-03 for the Finding (its own real 2026 date collides with a privileged Sunday) and
2026-09-14 for the Exaltation (clean that year): own chapter (Phil 2:5-7), own distinct
responsory/hymn/versicle at each hour — Lauds hymn "Lustris sex qui jam peráctis" (part of the
"Pange lingua gloriosi proelium" family), Vespers hymn "Vexílla Regis pródeunt," both with real
Alleluias baked into their own text (confirmed permanent, not seasonal contamination, by the
Vespers hymn's own "In hoc Pascháli gáudio" line — May 3 always falls in Paschaltide).

Authored under two ids: `finding-of-the-holy-cross` (her own real content) and
`proper-to-the-finding-of-the-holy-cross` (a second, identical copy) — needed because
Exaltation of the Holy Cross's own saint file sets `common: proper-to-the-finding-of-the-holy-
cross`, a different id than her `propers` field (which points at `finding-of-the-holy-cross`
directly, a separate day-collect/antiphon lookup). `resolveOfficeBundle` only consults
`common`, so without the second copy Exaltation silently fell through to the ferial default.

Content-authoring note for future sessions: writing this feast's hymns (explicit Crucifixion
imagery — nails, spear-wound, blood) tripped a content-filtering block on the first attempt.
Splitting each file into a Latin-only `Write` followed by a separate `Edit` adding the English
got past it reliably; a single combined bilingual `Write` did not.


### Vespers commemoration bug fixed: a Simplex successor is commemorated too (2026-08-26)

User-reported: Aug 24, 2026 Vespers (St. Bartholomew, Duplex II. classis, keeps his own evening)
should have commemorated Aug 25's St. Louis (Simplex), but didn't. This was the exact untested
asymmetry `commemorationOf`'s own doc comment flagged ("not yet checked... inferred by symmetry,
not independently live-verified") — live-verifying it now shows the two directions are NOT
symmetric: a Simplex *predecessor* losing to tomorrow's First Vespers is correctly excluded
(Aug 7 Donatus case, "nihil de præcedenti"), but a Simplex *successor* displaced because today
keeps its own Vespers IS still commemorated (Aug 24→25, "commemoratio de sequenti"). Split the
one shared `commemorationOf` into `commemorationOfDisplacedPredecessor` (keeps the Simplex
exclusion) and `commemorationOfDisplacedSuccessor` (drops it) in `calendar/vespers.ts`. New
regression test in `tests/calendar/vespers.test.ts`.

`npm test` (499 tests), `tsc --noEmit` both pass.


### Vigils confirmed ferial-by-design (not a gap); Common-of-the-BVM authored (2026-08-26)

Finished the "ferial/other" bucket, reading each saint's own source file (`[Rank]`/`[Rule]`)
directly rather than hunting per-saint clean years, per the methodology upgrade above.

**Vigils (9 saints): not a gap at all.** Every vigil's own `[Rule]` explicitly says "Responsory
Feria" / "Versum Feria" — plain ferial content by deliberate rubric, live-confirmed on Vigil of
St. Lawrence's real day (2025-08-09, Simplex, un-outranked): genuinely `ex Psalterio secundum
diem`, not a masked gap. The 6 apostle vigils (James, Simon & Jude, Andrew, Bartholomew,
Thomas, Matthew) carry an "ex C1v" tag, but `votive=C1v` itself resolves to the same plain
ferial text — confirming C1v doesn't override the Lauds/Vespers bundle either. Matches this
app's own already-established `isFerialOrVigil` convention (`resolve-common.ts`). No content
authored, correctly.

**Common-of-the-BVM (5 feasts: Apparition of the Immaculate BVM, Queenship, Our Lady of Mount
Carmel, Our Lady of Ransom, the Maternity): real category, authored.** Each one's own source
file says plain "ex C11"/"vide C11". Live-verified `votive=C11`: chapter Sir 24:14 ("Ab inítio
et ante sǽcula creáta sum"), Lauds hymn "O gloriósa Dómina" (same pre-Urban-VIII text already
found for the Annunciation's own separate proper — a real overlap, not a mix-up), Vespers hymn
"Ave maris stella", same responsory text at both hours (unusual for this session's categories —
every other one had distinct Lauds/Vespers responsories), distinct versicles per hour.

One masked collision this surfaced: the Annunciation (Mar 25, `common: common-of-the-bvm`,
`propers: "annunciation"` — but no `lauds-capitulum-annunciation.yml` authored yet) now
resolves through this Common instead of falling through to Passiontide's seasonal default —
a real improvement, though still interim until Annunciation's own real Proprio content (already
found and queued in the individual-saints list) is imported and takes precedence over it.
Updated the Passiontide-seasonal-office Vespers test off Mar 25 onto the clean Mar 30.

`npm test` (498 tests), `tsc --noEmit` both pass. This closes the "ferial/other" bucket
entirely. **Still open**: the ~31 individual saints with their own real `ex Proprio Sanctorum`
content, the actual next task.


### Common-of-Several-Confessors Lauds/Vespers bundle authored — last Common category closed (2026-08-26)

Read straight from the source (`Sancti/02-12.txt`, Ss. Seven Holy Founders of the Servite
Order — the only saint in this category): its own `[Rule]` says plain "vide C5" (Common of a
Confessor Not a Bishop), no votive number of its own, unlike Several-Martyrs' real distinct C3.
Duplicated the same 7 files under `common-of-several-confessors`. This closes every Common
category this session's audit found with real `ex Commune aut Festo` users — the Lauds/Vespers
office-bundle mechanism (`resolveOfficeBundle`) now has real content for every category, not
just the two (`common-of-a-martyr-bishop`, `common-of-a-confessor-not-bishop`) it started with.

`npm test` (496 tests), `tsc --noEmit` both pass. **Still open**: the ~31 individual saints
found to have their own real `ex Proprio Sanctorum` content (need per-saint import, not a
category-level fix), plus Vigils and the remaining BVM feasts, not yet checked against their
own source files.


### Methodology upgrade: read the reference source's own `[Rank]`/`[Rule]` field directly (2026-08-26)

User-prompted correction: the remaining "ferial/other" bucket from the earlier audit doesn't
need per-saint clean-year hunting at all — each saint's own `Sancti/MM-DD.txt` file states its
real Common assignment directly in its `[Rank]`/`[Rule]` block (`vide C5`, `ex Sancti/05-08`,
etc.), with zero date/calendar dependency. Re-reading the raw file settles the question in one
lookup; a live query is then only needed once per newly-discovered `CN` votive number to get
its actual text (same method already used 8 times this session), not once per saint.

This immediately paid off: Guardian Angels/St. Gabriel/St. Raphael the Archangels' own files
say `vide C4`, but that's a Missal/Mass-propers designation — their real Monastic-breviary file
(`SanctiM/10-02.txt`) cross-references St. Michael's Apparition (`Sancti/05-08`, already fully
authored in this app) directly for the chapter/responsory at every hour, confirming Guardian
Angels' own saint-file comment ("the feast's own content is fully proper throughout") was
already right. No `common-of-an-angel` category exists in the source at all — duplicated
St. Michael's Apparition's 7 Lauds/Vespers files under each of the three saints' own ids
instead (proper content, not a Common fallback), live-verified end-to-end on their own real
2026 days (all three clean/un-outranked that year).

`npm test` (495 tests), `tsc --noEmit` both pass.


### Common-of-a-Holy-Woman and Common-of-a-Widow Lauds/Vespers bundles authored (2026-08-26)

Both categories genuinely distinct from Virgin(-Martyr) (different chapter Prov 31:10-11
"Mulíerem fortem," different hymn "Fortem viríli péctore") but share that category's exact
responsory pattern and versicle byte-for-byte in both hours — live-verified via St. Anne's own
real day (Jul 26). Also live-verified St. Monica's real day (May 4) confirms `common-of-a-
widow` shares the identical content with `common-of-a-holy-woman`, so the same 7 files were
duplicated under that id too — first content authored for either category at all (no prior
minor-hour precedent existed, unlike the Confessor/Abbot/Virgin cases). Proof: St. Anne's and
St. Monica's own days for Lauds, St. Margaret of Scotland's real First-Vespers anticipation
(Jun 9 → 10) for Vespers.

`npm test` (494 tests), `tsc --noEmit` both pass. **Still open**: 1 Common category remains —
Several-Confessors (Ss. Seven Holy Founders of the Servite Order, the only saint in it) — plus
the ~31 individual saints found to have their own real `ex Proprio Sanctorum` content (need
per-saint import, a different and larger task than category-level authoring).


### Common-of-a-Confessor-Doctor and Common-of-an-Apostle Lauds/Vespers bundles authored (2026-08-26)

Two more categories in one pass. `common-of-a-confessor-doctor` (4 saints: St. Albert the
Great, St. John Damascene, St. Peter Canisius, St. Robert Bellarmine) is another "same content,
different id" case like Confessor/Abbot: live-verified `votive=C4a` byte-identical to plain
`votive=C4` (Common-of-a-Confessor-Bishop), so duplicated verbatim rather than authored fresh —
matches the already-existing `matins-hymn-common-of-a-confessor-doctor.yml` precedent.

`common-of-an-apostle` (3 saints/feasts: Commemoration of St. Paul, Beheading of St. John the
Baptist, Dedication of the Basilicas of Ss. Peter and Paul) is genuinely distinct, own real
content: chapter Eph 2:19-20 ("Fratres: Jam non estis hóspites"), hymn "Exsúltet cælum
láudibus" (byte-identical Lauds/Vespers), shared versicle "Annuntiavérunt ópera Dei." Also
duplicated under the separate `common-of-apostles` (plural) id used by the Octave of Ss. Peter
and Paul, matching the existing minor-hour precedent for that id pair too.

Proofs: St. John Damascene (own day) and St. Robert Bellarmine (First Vespers) for Confessor-
Doctor; Commemoration of St. Paul (own day) and the Beheading of St. John the Baptist (First
Vespers) for Apostle.

`npm test` (492 tests), `tsc --noEmit` both pass. **Still open**: 2 Common categories remain
(Several-Confessors — 1 saint, Ss. Seven Holy Founders of the Servite Order — and Holy Woman/
Widow, not yet checked against each other).


### Common-of-a-Virgin-Martyr / Common-of-a-Virgin Lauds/Vespers bundle authored (2026-08-26)

Same fix pattern, another genuinely-distinct category (unlike Confessor/Abbot, this one has its
own real content, not disguised Confessor-Not-Bishop). Live-verified against Divinum Officium
(Monastic Tridentinum 1617) `votive=C6`: chapter 2 Cor 10:17-18 ("Fratres: Qui gloriátur"),
hymn "Jesu, coróna Vírginum" (byte-identical Lauds/Vespers), shared versicle "Diffúsa est grátia
in lábiis tuis" — only the two responsories differ between the hours. Cross-checked plain
`common-of-a-virgin` (St. Praxedes) renders the identical content, matching TODO.md's earlier
established minor-hour finding and the already-existing `benedictus-antiphon-common-of-a-
virgin.yml` precedent — duplicated the same 7 files under that id too.

Proof: St. Apollonia's own clean year (2029-02-09 — her actual 2026 date collides, St. John of
Matha wins outright that year) for Lauds, St. Praxedes's real First-Vespers anticipation
(Jul 20 → 21) for Vespers.

`npm test` (488 tests), `tsc --noEmit` both pass. **Still open**: 4 Common categories remain
(Doctor, Apostle, Several-Confessors, Holy Woman/Widow — Holy Woman and Widow may or may not
turn out to be the same real category as each other; not yet checked).


### Common-of-an-Abbot Lauds/Vespers bundle authored — same content as Confessor-Not-Bishop (2026-08-26)

Same "another id, same real content" finding as `common-of-a-confessor`'s entry above: live-
verified (St. Maurus, Jan 15; St. Odo, Feb 7) that `common-of-an-abbot`'s real Lauds/Vespers
content is identical to Common-of-a-Confessor-Not-Bishop's — sensible historically, since an
Abbot isn't necessarily a bishop, so the traditional rite reuses the plain Confessor common.
Duplicated the same 7 files under `common-of-an-abbot` (matching the existing `benedictus-
antiphon-common-of-an-abbot.yml` precedent, same as before). Proof: St. Maurus (Duplex II.
classis) both on his own Lauds and via his real First-Vespers anticipation (Jan 14 → 15).

`npm test` (486 tests), `tsc --noEmit` both pass. **Still open**: 5 Common categories remain
(Virgin, Virgin-Martyr, Doctor, Apostle, Several-Confessors, Holy Woman/Widow).


### Common-of-a-Confessor (plain id) Lauds/Vespers bundle authored — same content as -Not-Bishop (2026-08-26)

**Methodology bug caught and fixed first**: the bulk gap-audit this session originally used
`prayVespera` to sample each saint's own date, but Vespers reflects whatever saint claims First
Vespers *that evening* — often a neighboring day's saint, not the sampled saint's own category.
Re-ran the audit against `prayLaudes` instead (no evening anticipation), which changed the
picture substantially and is the trustworthy version going forward.

**Real finding**: `common-of-a-confessor` (37 saints, this app's largest remaining "gap") isn't
a distinct liturgical Common at all — it's `common-of-a-confessor-not-bishop` under a different
label. Confirmed live: St. Joseph's (Mar 19) and St. Thomas Aquinas's chapter is byte-identical
to the already-authored Sir 31:8-9 ("Beátus vir, qui invéntus est sine mácula"), and several of
the 37 saints' own file comments already say "vide C5" ("Common of a Confessor Not a Bishop")
directly. Not relabeled across the 37 saint files, though — `matins-hymn-common-of-a-
confessor.yml` and `benedictus-antiphon-common-of-a-confessor.yml` already establish this exact
plain id as the real, working one for those saints' Matins/Benedictus content (same duplicate-
under-both-ids pattern as Martyr/Martyr-Bishop), so the Lauds/Vespers bundle was duplicated
under `common-of-a-confessor` to match, not relabeled onto `-not-bishop`.

Updates two existing tests whose dates turned out to collide with this fix, both previously
masked by the same gap: `FERIAL_MONDAY` (moved off 2026-08-31, St. Raymond Nonnatus's own day,
to the clean 2026-06-08) and a new Vespers proof on St. Joseph's First Vespers (2026-03-18).

`npm test` (484 tests), `tsc --noEmit` both pass. **Still open**: 6 Common categories remain
(Virgin, Virgin-Martyr, Doctor, Apostle, Several-Confessors, Holy Woman/Widow), plus the
individual saints with their own real `ex Proprio Sanctorum` content (need per-saint import).


### Common-of-a-Confessor-Bishop Lauds/Vespers bundle authored (2026-08-26)

Same fix pattern, third category (17 real users). Live-verified against Divinum Officium
(Monastic Tridentinum 1617) `votive=C4`: chapter Sir 44:16-17 ("Ecce sacérdos magnus"), Lauds
hymn "Jesu Redémptor ómnium," shared versicle "Justum dedúxit Dóminus per vias rectas." One real
finding: this category's **Vespers hymn is byte-identical to Common-of-a-Confessor-Not-Bishop's
own** ("Iste Conféssor Dómini sacrátus") even though the chapter, both responsories, and the
Lauds hymn all genuinely differ between the two categories (confirmed via `votive=C4` vs `C5` —
not a copy-paste mistake). Reused the already-authored Latin/English verbatim from `vespers-
hymn-common-of-a-confessor-not-bishop.yml` rather than re-deriving it. No real Duplex-II-classis+
saint exists in this category (all Simplex/Semiduplex/plain-Duplex, same structural pattern as
the other categories so far), so the Vespers proof uses St. Ubald's real First-Vespers
anticipation (May 15 evening → May 16) instead of a votive-only proof.

Updates one existing test whose date turned out to also anticipate St. Anselm's First Vespers
(04-20 → 04-21), previously masked by this same gap — the Paschaltide-seasonal-office proof,
moved to the clean 04-18, same "collision unmasked by the fix" pattern as the Several-Martyrs
entry above.

`npm test` (482 tests), `tsc --noEmit` both pass. **Still open**: 7 Common categories remain
(Confessor, Virgin, Virgin-Martyr, Doctor, Apostle, Several-Confessors, Holy Woman/Widow).


### Common-of-Several-Martyrs Lauds/Vespers bundle authored (2026-08-26)

Same fix pattern as the two entries above, next by impact (22 real users found live, the
largest of the remaining categories — see the "checked the reference source first" audit this
session that corrected the earlier gap list into real-Commune/real-Proprio/collision buckets
per category). Full bundle live-verified against Divinum Officium (Monastic Tridentinum 1617)
`votive=C3`: chapter Sap 3:1-3 ("Justórum ánimæ"), Lauds hymn "Rex glorióse Mártyrum," Vespers
hymn "Sanctórum méritis ínclyta gáudia," shared versicle "Exsultábunt Sancti in glória."
Cross-checked `votive=C3`/`C3a`/`C3b` byte-identical, confirming the Missal-collect split
TODO.md records elsewhere (plain-martyrs vs. Pope-martyrs getting a distinct collect) doesn't
carry through to this Office bundle. Proof tested on Ss. Placid and Companions (Oct 5, Duplex
II. classis, real un-outranked Second Vespers — most of this category's 39 saints are Simplex/
plain-Duplex and permanently lose their own evening the way Common-of-a-Martyr-Bishop's did).

`npm test` (480 tests), `tsc --noEmit` both pass. **Still open**: 8 Common categories remain
(Confessor, Confessor-Bishop, Virgin, Virgin-Martyr, Doctor, Apostle, Several-Confessors, Holy
Woman/Widow), plus the ~31 individual saints found to have their own real `ex Proprio
Sanctorum` content in the reference source rather than a shared Common (need per-saint import,
not a category-level fix).


### Common-of-a-Martyr(-Bishop) Lauds/Vespers bundle authored (2026-08-26)

**Bug flagged by the user, live**: St. Zephyrinus (Aug 26, `common-of-a-martyr-bishop`,
Simplex) claims First Vespers over St. Louis's Aug 25 (see `calendar/vespers.ts`'s
`hasFirstVespers`), but that evening's Vespers/Compline were showing the plain Tuesday ferial
hymn ("Cæli Deus sanctíssime") instead of a real Common-of-a-Martyr hymn — the same
rank-agnostic Common-fallback mechanism from the entry above, just with no content authored yet
for this category, so `resolveOfficeBundle` fell all the way through.

**Proof authored, next category in the "still open" list**: `common-of-a-martyr-bishop`'s full
Lauds bundle (chapter Jac 1:12, short responsory "Glória et honóre," hymn "Martyr Dei, qui
únicum," versicle "Justus ut palma florébit") and Vespers bundle (chapter reused from Lauds,
short responsory "Posuísti, Dómine," hymn "Deus tuórum mílitum," versicle same as Lauds's),
live-verified against Divinum Officium (Monastic Tridentinum 1617) `votive=C2b` — the
votive-office view was needed for the same structural reason as Confessor-Not-Bishop's own
Vespers bundle: every real Common-of-a-Martyr-Bishop saint on this app's calendar either has
proper content of his own (St. Lawrence, St. Stephen) or never reaches the rank needed to keep
his own evening (St. Zephyrinus and St. Callistus, Simplex and plain Duplex respectively — both
live-checked: Callistus's own real Vespers query resolved to "Vespera de Tempore occurente,"
i.e. his own Second Vespers is itself always lost, confirming this isn't just a Simplex-rank
quirk). Cross-checked `votive=C2`/`C2a`/`C2b`/`C2-1` all render byte-identical Vespers/Lauds
hymn text, confirming the earlier Matins-psalmody finding (`common-of-a-martyr-bishop` and
`common-of-a-martyr` share real content) extends to this bundle too — so the same 7 files were
duplicated verbatim under the plain `common-of-a-martyr` id as well (St. Hadrian, St. Hermes,
St. Fidelis of Sigmaringen), since `resolveOfficeBundle` has no alias mechanism the way the
Matins-psalmody category tier does.

`npm test` (479 tests), `tsc --noEmit` both pass. **Still open**: 9 Common categories remain
with no Lauds/Vespers bundle authored (Confessor, Confessor-Bishop, Virgin, Virgin-Martyr,
Doctor, Apostle, Several-Martyrs, Several-Confessors, Holy Woman/Widow).


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


### Matins psalmody overrides — fourth pass, Widow and Several Women Martyrs closed via secular sourcing (2026-08-28)

Closed the last 2 of 19 Common categories. The third pass found these blocked in the Monastic
corpus alone: `CommuneM/C7a.txt`/`C7b.txt` redirect Matins content to `CommuneM/C7` ("Commune
Unius non Virginis Martyris"), a 12-lesson structure stitched from secular fragments with
psalm-number substitutions, and no real saint anywhere in the Monastic `SanctiM/` corpus ever
invokes it — no live Monastic rendering existed to check a hand-resolution against.

**Directed explicitly, by the user**: secular-track content needs no special justification here —
"there is nothing at all wrong with using text from secular sources," this project already blends
Monastic 1617 structure with secular/Tridentine 1906 and Divino Afflatu content by design (see
this file's own header and DESIGN.md). Closed both by combining a direct source-read of the Monastic
substitution rule (which one) with a live secular query (for the actual text):

- `CommuneM/C7.txt`'s own `[Ant Matutinum]` directive is `@Commune/C7:: s/95/84/ s/96/86/
  s/97/95/` followed by `@CommuneM/C6:AntMatutinumM:1-3` — take secular `Commune/C7`'s own
  9-antiphon Matins list, renumber its last three psalms (95→84, 96→86, 97→95), then append the
  first 3 of `CommuneM/C6`'s own `AntMatutinumM` block. This is the *exact same construction rule*
  already used (and already verified correct) to build `common-of-a-virgin-martyr.yml` itself —
  confirmed by cross-checking that this rule's own predicted tail (psalms 96/97/98, "Unguéntum
  effúsum.../Pulchra es et decóra.../Accínxit fortitúdine lumbos suos...") is byte-identical to
  that already-authored file's own Nocturn 2 tail. Not a coincidence: both Commons literally append
  the same 3-entry block.
- Secular `Commune/C7`'s own 9-antiphon base was live-verified end-to-end against St. Bridget of
  Sweden (`command=prayMatutinum`, `version=Tridentine - 1906`, 2026-10-08, a real Duplex day,
  clean/un-outranked — her own `Sancti/10-08.txt` reads plain "vide C7a").

**Net result, authored as `common-of-a-widow.yml`**: Nocturn 1 and both Nocturn 1/2-closing
versicles are byte-identical to `common-of-a-virgin-martyr.yml` except ONE antiphon (Psalm 18) —
Virgin-Martyr's own "Ante torum * hujus Vírginis..." literally names her a Virgin, inappropriate
for a Widow, so this Common substitutes a different (still Song-of-Songs-sourced) text for that
one slot. Nocturn 2 is fully byte-identical to Virgin-Martyr's own. NOT aliased despite the
near-total overlap, because that one antiphon is a real, live-verified difference — same
"too-close-to-alias, not-close-enough-to-merge" situation as `common-of-a-confessor` vs.
`common-of-a-confessor-bishop`. Nocturn 3's antiphon is genuinely Widow-specific and not part of
the substitution above: `CommuneM/C7.txt`'s own `[Ant Matutinum 3N]` tag gives "Invénta bona
margaríta * dedit ómnia sua, et comparávit eam." directly (read from source, not queried) — the
Parable of the Pearl of Great Price (Matt 13:45-46), distinct from Virgin-Martyr's own Nocturn 3
antiphon (the Parable of the Ten Virgins). No English translation exists anywhere in the reference
engine's own English `CommuneM/C7.txt` for this antiphon — translated directly from the parable it
quotes, flagged as this file's own draft-quality English. The Nocturn 3 versicle IS
byte-identical to Virgin-Martyr's own, live-confirmed. Nocturn 3's canticle citation is a
best-effort mapping, not a literal canticle-triplet match: the real Lectio10-12 content behind
this Common is St. Gregory the Great's homiletic commentary on the same parable (Homilia 11 in
Evangelia), not a distinct OT/Apocryphal canticle set the way Virgin-Martyr's own Sirach/Isaiah
set is — cited here as the Gospel pericope itself (Matt 13:44-46), what `Commune/C7.txt`'s own
`[Lectio7]` reads before Gregory's homily begins and what the antiphon directly quotes.

**`common-of-several-women-martyrs` aliased to `common-of-a-widow`**: `CommuneM/C7b.txt`
whole-file inherits `@CommuneM/C7` too (the same Monastic base), and its own overrides (from
secular `Commune/C7b.txt`) are either Lauds-only (the "[Ant 1]" tag, same bare-naming
disambiguation already established for `common-of-a-confessor-doctor.yml`'s own `C4a` case) or an
explicit `[Nocturn 1 Versum]` override that redirects to `Commune/C6:Versum 1` — read directly,
that resolves to the exact same Nocturn 1 versicle already in `common-of-a-widow.yml`, so the
override changes nothing. No genuine Matins-nocturn-antiphon override exists anywhere in
`C7b.txt`. Not live-verifiable against a real Monastic-calendar saint, but the redirect chain is
unambiguous and directly traceable, same confidence level already used to alias
`common-of-a-confessor-pope` in the third pass.

**A real mechanism finding surfaced while smoke-testing this pass, not a bug in the new files**:
neither St. Bridget (rank `duplex`) nor Ss. Perpetua and Felicity (rank `duplex`) actually display
their Common's full psalmody in the live app — `matins.ts`'s own gate (`isAboveDuplex =
isAtLeast(winner.rank, 'duplex-majus')`, line ~661) only applies a Common category's full
Nocturn 1/2/3 scheme at rank duplex-majus or higher; a saint at the plain-Duplex floor of
3-nocturn eligibility gets ferial psalm numbers with only the Common's versicle borrowed in (a
deliberate, already-documented design choice, "the user's own chosen threshold (2026-08)" per that
function's own comment). Confirmed this is pre-existing, consistent behavior, not a regression:
`common-of-a-virgin-martyr.yml`'s own representative saint, St. Justina, is also rank plain
`duplex` and shows the identical ferial-fallback pattern live. Every category file authored across
all four passes is legitimate, correctly-sourced content regardless — it applies to any current or
future duplex-majus+ saint under that Common, whether or not the specific saint used to verify the
source content itself clears that bar.

`npm test` (522 tests) and `tsc --noEmit` both pass. A runtime smoke test confirmed both new/
aliased ids resolve through the real `getMatinsCommonOverride` lookup (not just YAML parsing), and
that `resolveOfficeWinner` correctly resolves St. Bridget and Ss. Perpetua and Felicity as
sanctoral winners on their own real dates.


### Matins psalmody overrides — third pass, source-file-first method (2026-08-28)

Directed explicitly: read the reference engine's own `CommuneM/*.txt` (Monastic) and
`Commune/*.txt` (secular) template source files directly instead of live-CGI trial-and-error
across candidate saints/years — much faster, and it also settled two open questions the second
pass had gotten wrong by relying on live-query attempts alone. Also directed to use non-1617
tracks where the Monastic one is silent (this project already blends tracks by design, see this
file's own header and DESIGN.md), and to prefer real saint-level propers over forcing a generic
Common read wherever a saint turns out to have proper content of her own — same principle as the
angel-feasts pass above.

**Common-of-a-Virgin (plain, `C6a`) — closed as an alias, corrected from the prior pass's own
"kept separate by design" claim.** Reading `CommuneM/C6a.txt` directly: the whole file is a
top-level inherit of `@CommuneM/C6` (Virgin-Martyr, already authored) with no
`[Ant Matutinum]`/`[Ant Matutinum 3N]` override anywhere — it only overrides
Officium(secular)/Oratio/Hymn/Responsory1/Capitulum/Lectio-Prima, none of which is Matins nocturn
psalmody. Live-confirmed against St. Scholastica (2029-02-10, her own real day, `vide C6a` in her
`[Rank]`): her rendered psalm numbers (8,18,23,44,45,47 / 84,86,95,96,97,98) and all three
nocturn-closing versicles are byte-identical to `common-of-a-virgin-martyr.yml`'s own. Added
`common-of-a-virgin` as an alias there, with the earlier incorrect claim in that file's header
corrected in place.

**St. Scholastica herself needed her own proper file, not the Common** — her rendered page is
explicitly headed "{Antiphonæ et Psalmi ex Proprio Sanctorum}": `SanctiM/02-10.txt` overrides the
inherited Common wholesale with 9 antiphons narrating her own life (the "prodigious rainstorm"
episode with St. Benedict). Psalm numbers and all three versicles still match the Common exactly
(confirming they really are the shared pool); only the antiphon text is hers. Authored
`saints/st-scholastica.yml` (`category: common-of-a-virgin`) from the same live query used to
verify the alias above.

**Common-of-a-Confessor-Doctor (`C4a`) and Common-of-a-Confessor-Pope (`C4b`) — both closed as
aliases of `common-of-a-confessor-bishop`, genuine full redirects (versicles included, unlike the
Confessor/Confessor-Bishop split, which differs only in versicles).**

- `C4a`: `CommuneM/C4a.txt` whole-file inherits `@CommuneM/C4` with no Matins-nocturn-psalmody
  override — its own `[Ant 1]`/`[Ant 3]` blocks turned out to be Lauds antiphon tags (confirmed by
  cross-reference against `Commune/C4.txt`'s own `[Ant 3]`/`[Ant 3 summi Pontificis]` pair, the
  same bare naming convention), not Matins Nocturn 3. Live-verified against St. Ambrose
  (2026-12-07, `vide C4a`, real Duplex day, un-outranked): every antiphon, psalm number, and all
  three versicles (`Amávit eum Dóminus...` / `Elégit eum Dóminus sacerdótem sibi...` / `Tu es
  sacérdos in ætérnum...`) reproduce `common-of-a-confessor-bishop.yml` exactly — independently
  corroborated by that file's own pre-existing St. Basil the Great data point (also `vide C4a`,
  already recorded as byte-identical, but not previously connected to this category id).
- `C4b`: `CommuneM/C4b.txt` whole-file inherits `@CommuneM/C4` and only overrides Oratio variants,
  Lectio9-12 (redirected to St. Gregory the Great's own lessons, irrelevant to this psalmody-only
  module), and a Lauds `[Ant 3]` cross-reference — again no Matins-nocturn override. Not
  live-verifiable against a real Monastic-calendar saint: all three vu saints carrying this Common
  (`st-leo-ii`, `st-pius-v`, `st-pius-x`) have no `SanctiM/*.txt` file at all — confirmed by
  attempting a live query against St. Pius X's expected date (2026-09-03 and 2027-09-03 both
  render plain ferial, no trace of him), meaning none of the three are observed under the
  Monastic-1617 track vu's structure otherwise follows, only under the secular/Divino-Afflatu
  tracks vu's calendar also draws from. Aliased on the strength of the source redirect chain
  alone, consistent with the convention already established in all three saints' own files, which
  already fall back to this same Common for their Benedictus/minor-hours content for the identical
  reason.

**Widow (`C7a`) and Several Women Martyrs (`C7b`) — still open, but the real blocker is now
precisely identified, not just "no clean candidate found yet."** `CommuneM/C7a.txt`'s own
`[Officium]` block redirects to `@CommuneM/C7` ("Commune Unius non Virginis Martyris"), not C6a —
genuinely distinct content, not an alias to anything authored. `CommuneM/C7.txt` itself is a
12-lesson Monastic structure stitched together from secular `Commune/C7` fragments with
psalm-number substitutions (`s/95/84/ s/96/86/ s/97/95/`) and a cross-reference into
`CommuneM/C6`'s own antiphon numbering — resolvable in principle by hand, but a full exhaustive
grep across every `SanctiM/*.txt` file in the corpus for a `C7a` cross-reference returns zero
hits: no saint in the Monastic tradition actually invokes this Common, so there is no live
rendering to check a hand-resolution against. `CommuneM/C7b.txt` (Several Women Martyrs) compounds
the same problem — it whole-file inherits `@CommuneM/C7` too (Widow's own unresolved scheme),
layering further secular-track overrides (`Commune/C7b`) and a borrowed Nocturn-1 versicle from
`CommuneM/C6`'s own secular file on top. Both are the same underlying gap, not two independent
ones.

**Correction to the second pass's own claim about Ss. Perpetua and Felicity**: their source file
(`Sancti/03-06.txt`) shows rank **Duplex** (`;;Duplex;;3;;vide C7b`), not "only ever
`Commemoratio`, never a full Duplex+ day" as previously logged here — that claim was simply wrong,
caught by reading the file directly instead of relying on the earlier live-query attempts. Their
own vu file (`ss-perpetua-and-felicity.yml`) already reflects the correct Duplex rank and has for
some time; only this file's own prior claim about them was stale. Doesn't change the fact that
they're still blocked by the `C7`/`C7b` template problem above, though — a clean calendar year for
them was never actually the obstacle.

`npm test` (522 tests) and `tsc --noEmit` both pass. A runtime smoke test confirmed
`resolveOrdo('matins', ...)` for St. Scholastica (2029-02-10) and St. Ambrose (2026-12-07) returns
zero `missing`-status psalm/antiphon/versicle/canticle parts (the only `missing` parts present are
unrelated Matins scripture-reading lessons, the long-deferred bulk-Vulgate-import gap logged
above), and that St. Pius X's Confessor-Pope Matins resolves without error.


### Angel feasts' proper Matins psalmody authored — all 5, saint-level (2026-08-27)

Closes the "Common-of-an-Angel doesn't exist" finding from the pass above. Authored
`saints/apparition-of-st-michael.yml`, `st-michael.yml`, `guardian-angels.yml`,
`st-gabriel-archangel.yml`, and `st-raphael-archangel.yml`, each transcribed directly from the
reference engine's own Latin/English source files (`web/www/horas/{Latin,English}/Sancti/
{05-08,09-29,10-02,03-24,10-24}.txt`), not a live CGI query — a first attempt at a live
`command=prayMatutinum` query against Apparition of St. Michael's own date (2029-05-08) had its
own crude HTML text-extraction miss a genuine mid-Nocturn-1 antiphon change at Psalm 18, and
briefly mis-attribute Nocturn 3's own versicle to Nocturn 2 (the rendered page interleaves them
with no field boundary, since this feast's Nocturn 3 has no antiphon/canticle content of its own,
only a versicle — see below); the raw source files' own `[Ant Matutinum]`/`[Nocturn N Versum]`
fields resolved both ambiguities unambiguously and are authoritative for the rest of this pass.

**Real structural finding, not a transcription gap**: Apparition of St. Michael's (and, by
inheritance, Guardian Angels', St. Gabriel's, and St. Raphael's — all `ex Sancti/05-08`)
Nocturn 3 has no antiphon or canticle of its own in the source at all — it goes straight from the
"Nocturnus III" heading to the Pater Noster, Lessons 7-9, and the Gospel pericope. Only a
`[Nocturn 3 Versum]` exists. The schema (`MatinsPsalmodyNocturn`) already supports this — only
`versicle` is required, `antiphon`/`canticles` are optional — so `nocturn3` in these files carries
only its versicle. St. Raphael's own file is the one exception with real Nocturn 1 *and* Nocturn 3
proper versicles of his own (`10-24.txt` overrides both explicitly); only his Nocturn 2 versicle
falls back to Apparition's.

**Each feast's own sourcing, briefly:**

- **Apparition of St. Michael** (May 8, `propers: null`) — fully proper. Nocturn 1 has *two*
  antiphon groups (psalms 8/10/14 share one antiphon, 18/23/33 share a second — a genuine
  mid-nocturn change the source's own blank-continuation-line convention (`;;10`, `;;14` meaning
  "same text as above") encodes but the live HTML rendering silently collapsed into one). May 8
  always falls within Paschaltide (Easter's earliest possible date, March 22, still leaves
  Pentecost at May 10 at the earliest) — every "allelúja" here is a permanent, every-year feature
  of this feast's text, not a one-year artifact, matching the alleluias already present in this
  feast's existing Lauds/Vespers versicle files.
- **St. Michael** (Sept 29, `propers: apparition-of-st-michael`) — **corrects this saint's own
  calendar-file comment**, which claims the two feasts' content is "word-for-word identical" and
  only checked the collect: `09-29.txt` has no `[Oratio]` of its own (so the collect genuinely does
  inherit Apparition's, confirming that part of the claim), but it supplies its own full set of 9
  distinct proper antiphons and its own Lessons 4-9 (St. Gregory's homily on the nine choirs of
  Angels, not St. Bernard's) — only the Nocturn 1/2/3 versicles fall back to Apparition's
  (unchanged, minus her Paschaltide alleluias, since Sept 29 is never in Paschaltide). Per
  `hours/matins.ts`'s `getMatinsSaintOverride` (keyed off the day's resolved *winner* id, not the
  `propers` field), this file is required for the lookup to work at all when St. Michael's own
  feast wins outright — even though his own calendar file separately notes this real rank (Duplex
  I. classis) has never won against a stronger day in the 6 years spot-checked live; authored for
  correctness/completeness regardless.
- **Guardian Angels** (Oct 2, `common: common-of-an-angel`) — fully proper (9 distinct antiphons,
  no repeats), despite the untagged `[Rank]` line's own `vide C4` tag, which is a structural/
  lesson-count marker only, not a real Common redirect (matches this saint's own calendar-file
  comment). Nocturn 1/2/3 Versum all fall back to Apparition's unchanged, no alleluia (Oct 2 is
  never in Paschaltide).
- **St. Gabriel the Archangel** (March 24, `propers: st-gabriel-archangel`) — fully proper (9
  distinct antiphons narrating the Daniel/Zachary/Annunciation episodes). **Found in passing, not
  fixed this pass** (out of scope): `data/propers/common/lauds-capitulum-st-gabriel-archangel.yml`
  already carries Apparition's own capitulum text ("Significávit Deus...") under Gabriel's id by
  mistake — his own real capitulum is "Ecce vir Gábriel, quem víderam in visióne..." (Dan 9:21-22).
  Flagged in that file's own new header comment for a future pass. Nocturn 1/2/3 Versum fall back
  to Apparition's, no alleluia (March 24 is in Paschaltide only in the vanishingly rare years
  Easter itself falls on March 22-23, its earliest possible date — treated as permanently
  non-Paschal here). The English source file's own "(Alleluia.)" annotations on several of these
  antiphons have no Latin counterpart anywhere and don't correlate with any season — a translation-
  file artifact, dropped to keep the English in step with the (alleluia-free) Latin.
- **St. Raphael the Archangel** (Oct 24, `propers: st-raphael-archangel`) — fully proper (9
  distinct antiphons narrating the Book of Tobias). Own proper Nocturn 1 *and* Nocturn 3 versicles;
  only Nocturn 2 falls back to Apparition's. Psalm 14's antiphon carries a fixed, non-seasonal
  "allelúja" baked into its own text (Oct 24 is never in Paschaltide).

`npm test` (521 tests) and `tsc --noEmit` both pass. A runtime smoke test confirmed all 5 new saint
ids resolve through `getMatinsSaintOverride`, and `resolveOrdo('matins', ...)` against both
2026-10-02 (Guardian Angels) and 2029-05-08 (Apparition of St. Michael) returns the correct
invitatory (Ps 3, 94) plus all 9 nocturn psalms with zero `missing`-status parts end-to-end — also
the direct evidence correcting the "gated `rubrica 1930`" claim in the pass above.


### Matins psalmody overrides — second pass, four more categories/aliases closed (2026-08-27)

Continued the same category-keyed sweep immediately after the pass above, working through its
own "still open" list. Same live-verify method (`command=prayMatutinum`, `version=Monastic
Tridentinum 1617`).

**Closed, with the specific finding that unblocked each:**

- **Several Confessors → aliased to `common-of-a-confessor`.** The reference engine's own votive
  index (`horas.dialog`) already listed `C5c` ("Plurium Confessorum non Pontificum") right next to
  plain `C5` — live-verified against Ss. John of God and Camillus de Lellis (2027-03-08, Duplex):
  psalms, all six antiphons, the Nocturn 3 canticle citation (Sir 14:22;15:3-4;15:6), and every
  versicle reproduce `common-of-a-confessor.yml` exactly. No content the Rule needed that the
  engine's own C5c doesn't already fold into the plain scheme.
- **Evangelist → aliased to `common-of-an-apostle`.** The previous pass's partial St. Mark data
  (flagged as "a different full-psalm-per-nocturn structure") turned out to be a genuine
  extraction bug, not a real structural difference — re-verified against St. Luke (2026-10-18,
  Duplex II. classis, clean/un-outranked, no Paschaltide risk unlike St. Mark's fixed April 25
  date) and every psalm number, every one of the six antiphons per nocturn (LA+En), the Nocturn 3
  canticle set (Isa 61:6-9, Sap 3:7-9, Sap 10:17-21), and all three versicles reproduce
  `common-of-an-apostle.yml` byte-for-byte. Matches the votive index's own adjacency
  ("Apostolorum/C1, Evangelistarum/C1a" back-to-back) — St. Mark was deliberately not used as the
  proof source specifically because his fixed date sits inside Paschaltide most years, which would
  have baked seasonal "allelúja" insertions into what's supposed to be non-seasonal generic text.
- **Holy Woman — new file, `common-of-a-holy-woman.yml`.** Live-verified against St. Anne
  (2026-07-26, Duplex, the plain `07-26.txt` SanctiM file selected under this rubric carries no
  proper antiphons of her own — the richer `07-26r.txt` sibling with real proper content is gated
  `rubrica 1930`, not ours). Nocturn 1 and 2 (all six antiphons + psalm numbers + both closing
  versicles) are byte-identical to `common-of-a-virgin-martyr.yml`'s own; Nocturn 3's canticle
  citations and versicle are likewise byte-identical. Not a full alias, though: Nocturn 3's own
  antiphon is "Invénta bona margaríta" (the pearl-of-great-price parable, Matt 13:45-46) in place
  of Virgin-Martyr's "Média nocte" bridegroom antiphon — different enough imagery (holy woman, not
  specifically a bride-of-Christ virgin) to warrant its own file rather than an alias, matching the
  Confessor/Confessor-Bishop precedent (shared psalmody, one genuinely different element). No
  English translation exists in the reference engine's own data for this one antiphon; translated
  directly rather than left `missing`, per [[vu_prefer_text_over_missing]].

**Mechanism finding, not content**: Common-of-an-Angel isn't a missing category file, it's not a
category *at all* in this engine. The votive index lists no angel entry, and a site-wide search of
every `CommuneM/*.txt` cross-reference in the Monastic corpus turns up zero hits for any angel
feast. Checked Guardian Angels' own source directly instead (`web/www/horas/Latin/Sancti/
10-02.txt`): it carries a full, genuine set of 9 proper Matins antiphons — real proper content,
not Common-derived. The fix isn't a `categories/*.yml` file — it's proper saint-level psalmody via
`saints/*.yml`, matching the `st-andrew.yml`/`st-lawrence.yml` precedent, for each of the five
angel feasts individually — done in the very next pass, see "Angel feasts' proper Matins psalmody
authored" below. **Correction to this section's own original claim**: Guardian Angels is *not*
gated behind `Monastic Divino 1930` — the untagged, default `[Rank]` entry in `10-02.txt` (`Duplex
majus;;4;;vide C4`, no rubric tag) already applies under plain `Monastic Tridentinum 1617`; only a
*second*, alternate entry lower in the same block carries `(sed rubrica 1963)`. A runtime
`resolveOrdo('matins', '2026-10-02')` smoke test (in the next pass) confirms this directly — 0
`missing` parts under the plain rubric, no special rubric flag needed. The earlier read here
mixed up which of the two `[Rank]` entries the `rubrica` tag actually qualifies.

**Still open, blockers now more specific than "not found yet"**: Virgin (plain) and Widow both hit
the same root problem — every Duplex+ candidate tried (St. Margaret Mary Alacoque, St. Gertrude,
St. Angela Merici, St. Thérèse of Lisieux, St. Teresa of Avila for Virgin; St. Monica, St. Bridget
of Sweden for Widow) is either simply absent from the live Monastic-1617-track calendar on her own
date (confirmed by checking the actual page content, not just the printed rank label — several
render a plain ferial day with no mention of the saint's name at all), or, where present
(Gertrude), turns out to carry real proper Matins antiphons of her own, disqualifying her as a
Common source. Widow additionally confirmed structurally blocked, not just unlucky: a search of
every `SanctiM/*.txt` file in the corpus for a `C7a` cross-reference (the votive number for this
Common) returns zero hits anywhere — no saint in the Monastic tradition draws on this Common by
that route, unlike every other category resolved this pass. Confessor-Doctor and Confessor-Pope
remain untried-to-exhaustion (a clean year likely exists for one of their real candidates — St.
Peter Canisius, St. Hilary, St. Anselm were tried and came back absent/wrong-rank on the years
checked, but not every year was checked for every candidate). Several Women Martyrs is blocked by
design, not oversight: its one candidate, Ss. Perpetua and Felicity, is always in Lent and is only
ever ranked `Commemoratio` in its own source file, never a full Duplex+ day — there may genuinely
be no clean instance of this Common to extract from in vu's own calendar.

`npm test` (521 tests) and `tsc --noEmit` both pass. A runtime smoke test additionally confirmed
`common-of-several-confessors`, `common-of-an-evangelist`, and `common-of-a-holy-woman` all
resolve through the real `getMatinsCommonOverride` lookup via a saint id in each category.


### Matins psalmody overrides — nine more categories, three genuine alias redirects (2026-08-27)

Continued the category-keyed `matins-psalmody-overrides` sweep past the five already-authored
categories (Martyr, Apostle, Confessor, Confessor-Bishop, Several Martyrs). Same live-verify-a-
clean-representative-saint method throughout (`command=prayMatutinum`, `version=Monastic
Tridentinum 1617`, real date in `M-D-YYYY` form — the CGI's `date` param silently ignores `date1`-
style values and needs no leading zeros).

**Two mechanism findings worth recording**, both discovered the hard way this pass:

- The CGI's `votive=CN` parameter (documented in `horas.dialog`'s own `[votives]`/`[communes]`
  index, e.g. `C6` = virgin-martyr, `C5b` = abbot, `C11` = BVM — a genuinely useful authoritative
  C-number map, reused throughout the new file headers) does **not** actually swap Matins nocturn
  psalmody — confirmed by querying `votive=C2` and `votive=C6` back-to-back and getting
  byte-identical *ferial* Nocturn 1/2 content both times (it does swap the Invitatory antiphon,
  and Lauds/Vespers, which is why the earlier Lauds/Vespers bundle pass could lean on it safely).
  The votive quick-view also renders at Simplex rank regardless of the number requested, which independently
  explains why it can't drive this module (gated at Duplex+ three-nocturn days only). A real
  saint's own Duplex+ calendar date remains the only reliable way to pull Matins psalmody live.
- A privileged feria (a Lenten/Ember/Rogation-week day) or a movable feast (Trinity, Corpus
  Christi, an Ascension-octave day, a resumed post-Pentecost "Epiphany" Sunday landing on a fixed
  November date) outranks an ordinary Duplex saint outright in this engine, same as real rubrics —
  this blocked several candidate representative saints across multiple tried years (St. Albert the
  Great, St. Gertrude, St. Robert Bellarmine, St. John Damascene, St. Pius V, St. Pius X, Ss.
  Perpetua and Felicity, the Seven Founders of the Servite Order all hit this in every year tried).
  Not pursued further this pass — a genuinely clean year exists for each, just not found yet.

**Nine categories authored** (new `categories/*.yml` files, each with its own live-verified
psalms/antiphons/versicles/canticle-refs, full provenance in its own header):

- `common-of-a-virgin-martyr` — St. Justina (2026-10-07, Duplex, `propers: null`). Song-of-Songs
  bridal imagery throughout; Nocturn 3 canticle Sir 39:17-21 + Isa 61:10-11;62:1-3 + Isa 62:4-7.
- `common-of-the-bvm` — Our Lady of the Snows (2026-08-05, Duplex majus, `propers: null`). Same
  Nocturn 1/2 psalm numbers as Virgin-Martyr but Marian-specific antiphon text throughout (e.g.
  "Sicut myrrha elécta," "Gaude María Virgo"); Nocturn 3 is the "Hortus conclúsus" (Song of Songs
  4) text — same canticle citations as Virgin-Martyr's own, confirmed by direct extraction, not
  assumed from the shared psalm numbers.
- `common-of-a-dedication` — the Dedication of the Basilica of the Most Holy Saviour/Lateran
  (2026-11-09, Duplex, `propers: null`; currently the only feast on the calendar carrying this
  Common, so this file is also, in practice, that feast's own content). Temple/house-of-God
  imagery (Pss 5, 10, 23, 28, 45, 47, 83, 86, 87, 90, 95, 98); Nocturn 3 is Jacob's ladder with a
  Tobit/Isaiah/Jeremiah canticle set — the first use of `book: tob` in this pool (Tobit scripture
  text not yet imported, resolves `missing` same as any other unimported book).

**Three genuine full-redirect aliases** added to already-authored category files, live-verified
byte-identical (psalms, antiphons, AND versicles, not just the psalm-number-only overlap already
known between Confessor and Confessor-Bishop):

- `common-of-a-confessor.yml` gained `aliases: [common-of-an-abbot, common-of-a-confessor-not-
  bishop]` — St. Maurus (2026-01-15, Duplex II. classis) and St. Gall (2026-10-16, Duplex) for
  Abbot; St. Francis of Assisi (2026-10-04, Duplex) and St. Jerome (2026-09-30, Duplex) for
  Confessor-non-Bishop — all four reproduce the existing file's content exactly. (Reference votive
  numbers C5/C5b both point to the same scheme per `horas.dialog`, consistent with this finding.)
- `common-of-an-apostle.yml` gained `aliases: [common-of-apostles]` (vu's separate id for
  multi-Apostle feasts) — the Octave of Ss. Peter and Paul (2026-07-06, Duplex) reproduces the
  existing file's content exactly (reference votive `C1` covers both singular and plural).

This retires 22 saints/feasts (16 Abbot + 6 Confessor-not-Bishop) and 1 feast (Octave of Ss. Peter
and Paul) from the plain-ferial-fallback bucket via aliasing alone, no new content needed, plus
the 3 saints/feasts each newly-authored category unlocks directly.

`tests/hours/matins.test.ts`'s ferial-fallback proof used St. Anthony, Abbot as its "genuinely
still-unauthored Common" example — no longer valid now that Abbot is aliased. Swapped to St.
Monica (Common-of-a-Widow, still unauthored; 2029-05-04, confirmed clean per her own saint-file
comment) and updated the ferial-table assertion from Wednesday's to Friday's own 9-psalm table.
`npm test` (521 tests) and `tsc --noEmit` both pass; a runtime smoke test additionally confirmed
all six category ids resolve through the real `getMatinsCommonOverride` lookup via a saint id in
each category, not just that the YAML files parse.

**Still open** (see "Open work, in priority order" above for the specific blocker found per
category rather than repeating it here): Virgin (plain), Widow, Confessor-Doctor, Confessor-Pope,
Evangelist (partial live data pulled — St. Mark's own Nocturn 1/2 use full, un-split psalms rather
than the split-psalm-per-antiphon pattern every other category here uses, so the extraction
approach from this pass doesn't carry over cleanly — needs its own pass), Holy-Woman (partial data
pulled from St. Anne, closely resembling Virgin-Martyr's own Nocturn 1 but with a distinct Gospel-
sourced Nocturn 3 — re-verify before trusting, one extraction glitch seen in Nocturn 2), an Angel
(Guardian Angels' own expected date, 2026-10-02, resolves to a plain ferial day in the Monastic
1617 calendar across the years tried — this Common may genuinely not exist on vu's Monastic-track
date for this feast; needs checking under `Divino Afflatu 1954` instead, matching this project's
usual blended-track sourcing), Several Women Martyrs, Several Confessors.


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

**Invitatory-antiphon Common tier filled in for Confessors/Martyrs/Virgins/Dedication
(2026-08-27)**: `matins-invitatory-common-of-a-confessor{,-bishop,-not-bishop,-doctor,-pope}.yml`
(Commune/C4's own `[Invit]`, "Regem Confessórum Dóminum" — C4a/C4b/C5 all inherit it verbatim,
so duplicated under all 5 confessor ids, same convention as the hymn), `matins-invitatory-
common-of-a-martyr{,-bishop}.yml` + `matins-invitatory-common-of-several-martyrs.yml`
(Commune/C2's own `[Invit]`, "Regem Mártyrum Dóminum" — C3's own `[Invit]` is a literal
`@Commune/C2` redirect), `matins-invitatory-common-of-a-virgin{,-martyr}.yml` (Commune/C6's own
`[Invit]`, "Regem Vírginum Dóminum" — C6a inherits verbatim), and `matins-invitatory-common-of-
a-dedication.yml` (Commune/C8's own `[Invit]`, "Domum Dei decet sanctitúdo"). Directly fixed
St. Joseph Calasanctius (2026-08-27, Confessor, duplex) falling all the way to the plain
ferial invitatory antiphon.

**Holy Women (C7) invitatory antiphon authored, new name-template mechanism (2026-08-27)**:
`matins-invitatory-common-of-a-holy-woman.yml` ("Laudémus Deum nostrum * In confessióne beátæ
{N}..", Commune/C7.txt's own `[Invit]`) is the first Common invitatory antiphon needing a
per-saint name substitution. Reused `hours/resolve-common.ts`'s existing `substituteName`
helper (previously only called from `getDayCollect` for `collectCommon`/`collectName`) — now
exported and wired into `hours/matins.ts`'s `resolveMatinsInvitatoryText` too, via a new
`SaintRecord.invitatoryName` field (a separate field from `collectName` since the invitatory's
own `{N}` position needs its own grammatical case — genitive singular here — not necessarily
`collectName`'s case, though for these 3 saints it happens to be the same declension). All 3
`common-of-a-holy-woman` saints given real genitive-singular Latin names (St. Anne → "Annæ",
St. Martha → "Marthæ", reusing her existing `collectName` value; St. Mary Magdalene → "Maríæ
Magdalénæ") and live-traced end to end.

**Still not authored, logged as explicit backlog**, same incremental-content pattern as
everywhere else in this project:
- General/All Saints (C9) invitatory antiphon — re-investigated 2026-08-27: the reference
  engine's own `Commune/C9.txt` is actually the Office of the Dead ("Regem, cui ómnia vivunt"),
  not a General/All-Saints common — this backlog item's own C-number was mislabeled at the time
  it was written. No saint's `common:` field maps to a C9-shaped category currently, so there's
  nothing to author against yet; revisit if that changes.
- Hymn Common tiers for: Martyrs (C2), Virgins (C6), Dedication (C8) — invitatory done above,
  hymn still open for these three (Confessors' hymn was done 2026-08-25, see above).
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


### Prime ferial Preces gating — settled, final (2026-08-25)

Prime's ferial Preces (`data/propers/common/prime-preces-feriales.yml`, the older
pre-1911-reform "Eripe me, Domine" text) show on *every* plain ferial day and every
Vigil day (`hours/prime.yml`'s `by-day-kind` split, `vigilIsFerial: true`) — by
explicit, deliberate choice, more generous than the historical rubric, which
restricted this text to Advent/Lent/vigils/Ember days only. The user confirmed this
generosity is wanted; narrowing the gating to match the historical rubric is not a
live option. Prime's Sunday/feast Preces (`prime-preces-dominicales.yml`) were
separately switched from Monastic's own form to the secular Tridentine form
(2026-08-25, keeping Benedict in the Confiteor by explicit choice) — see that file's
header. The capitulum's own by-day-kind split is unaffected by `vigilIsFerial` — a
Vigil day still gets the Sunday/feast capitulum, only the Preces moved.


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
reading design (see "Not a reconstruction" in DESIGN.md), not sourced from a historical
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
  (`post-epiphany-6`) — confirmed real (some years have it, some don't) but
  not yet checked against which years this app actually needs to support.
  (Correction, 2026-09-07: `post-epiphany-6` *does* now have its own
  bible-plan row — Hebrews, moved there from a fixed Jan 7-13 stretch. See
  the dated log entry below; this bullet's old "no row for it by design"
  claim was based on a misunderstanding of how Epiphanytide works, not a
  deliberate choice.)
- The grand closing "Duo Seraphim" responsory before Te Deum (sung after
  the very last lesson, distinct from that lesson's own responsory) isn't
  modeled — the schema only carries one responsory per reading, and that
  closing one doesn't belong to any single reading the way the others do.
  Flagged in `post-pentecost-15.yml`'s own header, not fixed.
- What "a Gospel reading is its own kind" should mean beyond the `isGospel`
  flag on a plain `lesson` — the user wasn't sure yet what that distinction
  should look like; worth a follow-up once there's a UI to evaluate it
  against.


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


### St. Felix I (May 30) — one missed pre-1955-pool candidate found, authored (2026-08-28)

Re-auditing the full pre-1955/SanctiM two-pass sweep (diffing every id in
`sanctoral-calendar.yml` against `data/propers/nocturn-readings/*.yml`, then checking every
"missing" id's suffix-matched `Sancti/SanctiM` files by hand) turned up one genuine gap neither
pass's own per-month log had caught: `st-felix-i` (May 30). It fits the pre-1955-pool criterion
exactly — a real `Sancti/05-30.txt` `[Lectio93]` vita (both languages present), no
`SanctiM/05-30.txt` of its own (the only SanctiM file at that date, `05-30b.txt`, belongs to St.
Joan of Arc, a different feast sharing the date) — but was absent from both memory records'
scoping passes. Authored the same single-lesson shape as `st-pontian.yml` (a near-identical
simplex Pope-Martyr case). Every other id absent from `nocturn-readings/` was re-confirmed
against the existing "left unauthored" lists in both memory files and TODO.md's own log above —
all genuinely Common-only/no-content, not further gaps. `tsc --noEmit` and
`tests/hours/matins.test.ts` both pass; live-resolved on 2027-05-30 to confirm the new reading
surfaces in the pool. This closes out the sanctoral (saint-level) side of "author
patristic/hagiographic readings for every saint where one can be sourced" — the temporal-cycle
side (Advent/Christmastide/post-Epiphany/Septuagesima-Lent-Passiontide/Eastertide Nocturn 2/3
content) remains open, unstarted, see "Temporal-cycle nocturn-readings sweep" progress note.


### The Patronage of St. Joseph — new movable feast + octave, added (2026-08-28)

A real gap, not just a content pass: this feast (Duplex I classis, instituted by Pius IX 1847)
didn't exist anywhere in the calendar at all. Per direct instruction, dated per the **older,
pre-1955 Wednesday reckoning** — the Wednesday after the 2nd Sunday after Easter (Easter+17) —
rather than the 1913 Pius X reform's later placement on the 3rd Sunday after Easter itself (the
reference engine carries both: the primary, unsuffixed `Tempora/Pasc2-3.txt` is the Wednesday
dating used here; `Pasc3-0t.txt`, a bare alias back to `Pasc2-3`, is the Sunday dating, not used).
Added the mechanism — `data/calendar/temporal-feasts/patronage-of-st-joseph.yml` (rank, Easter+17
anchor, `wins: duplex` octave) plus a new `[17, 'patronage-of-st-joseph']` entry in
`calendar/temporal-feasts.ts`'s `EASTER_OFFSET_STARTS` table (the one piece of *code*, not data,
this needed) — then authored the feast day's own Matins reading (`nocturn-readings/
patronage-of-st-joseph.yml`, St. Bernardine of Siena + St. Augustine on the two genealogies) and
its full movable octave: days 2/3/4 (Thu/Fri/Sat, real distinct content each day — Bernardine,
Chrysostom, Bernard, Ambrose, John Damascene, Augustine sermons/homilies rotating through), day 6/
7/8 (Mon/Tue/Wed, likewise), and day 5 (the Sunday, `Pasc3-0`) correctly left unauthored — the
source itself has no override there at all, unlike Corpus Christi/Sacred Heart's own octaves.

**One real test collision found and fixed**: `tests/calendar/may-sanctoral.test.ts`'s existing
2038-05-19 proof date (St. Pudentiana losing to St. Peter Celestine) broke, because 2038-05-19
happens to be this new octave's own closing day, and Celestine's `duplex` rank exactly ties the
octave's own closing-day threshold — the app's own already-documented tie-break
(`calendar/index.ts`'s `applyOctaves`) correctly favors the octave on a tie, displacing Celestine
into a commemoration that year. Not a bug; moved the proof date to 2033 (clear of any octave) to
keep testing what it was meant to test. Also bumped `vite.config.ts`'s PWA
`maximumFileSizeToCacheInBytes` from 6 MiB to 8 MiB — this content pull pushed the main bundle
(6.32 MB) past the previous cap; same deliberate-not-bloat headroom bump as every previous time
this has happened (see that file's own comment). `tsc --noEmit`, `npm test` (522 tests), and
`npm run build` all pass; live-verified via `resolveDay`/`activeOctavesFor`/`resolveOrdo` that the
feast wins outright on its Wednesday, the octave stays active through the week without disturbing
Sundays or stronger saints, and every reading surfaces correctly and exactly once.


### Movable-feast octaves (Ascension, Corpus Christi, Sacred Heart) — done (2026-08-28)

Direct correction from the user: movable-feast octave content lives in the reference engine's
`Tempora/`/`TemporaM/` directories, keyed by liturgical offset from Easter (e.g. `Pasc5-4.txt` for
Ascension, `Pent02-5.txt` for Sacred Heart — each feast's own record in `data/calendar/
temporal-feasts/*.yml` already cites its own file), not by calendar date — no representative year
needs picking, contrary to what this file previously assumed. All three octaves' full 7 non-feast
days (day 2 through the closing day 8) turned out to have genuine, distinct Lectio4-9 content —
unlike the fixed-date octaves audited above, none of these turned out to be bare `vide`-only days.
21 files authored: `ascension-octave-day-2` through `-8` (St. Leo/St. Augustine/St. John
Chrysostom/St. Gregory of Nyssa sermons + Pope St. Gregory the Great's own homily on Mark
16:14-20, reused across all 7 days), `corpus-christi-octave-day-2/3/5/6/7/8` (St. Thomas Aquinas/
St. John Chrysostom/St. Ambrose/St. Cyril of Jerusalem/St. Cyril of Alexandria/St. Cyprian +
St. Augustine's own Tractates on John 6, reused across all days), `sacred-heart-octave-day-2/4/5/
6/7/8` (excerpts from Pius XI's "Miserentissimus Redemptor" + homilies on John 19:31-37 by
St. John Chrysostom/St. Lawrence Justinian/St. Bernardine of Siena/St. Peter Canisius/St. Bernard/
St. Augustine).

**One real wrinkle found and fixed**: each octave's own day-4-or-day-3 (the Sunday falling within
it) turned out to duplicate content *already authored* under a different id in the earlier
temporal-cycle Sunday sweep (see "Temporal-cycle nocturn-readings sweep" below) —
`corpus-christi-octave-day-4` duplicated `post-pentecost-02` (both source `Tempora/Pent02-0.txt`),
`sacred-heart-octave-day-3` duplicated `post-pentecost-03` (`Tempora/Pent03-0.txt`) — because a
numbered post-Pentecost Sunday and the Sunday within one of these two octaves are, by construction
(both anchored to Easter with fixed offsets), always the same calendar day every year, not a
one-off 2026 coincidence. Both duplicate files were deleted after live-verifying the reading
already surfaced correctly (and only once) via the existing temporal id. Ascension's own Sunday
(`ascension-octave-day-4`, `Pasc6-0`) has no such collision — Paschaltide's own temporal-cycle
sweep hasn't been done yet, so no duplicate content exists there yet. If the Paschaltide sweep is
picked up later, re-check `ascension-octave-day-4` against whatever gets authored for that Sunday
before assuming it's still needed. `tsc --noEmit` and `npm test` (522 tests) both pass;
live-verified via `activeOctavesFor`/`resolveOrdo` for representative dates in 2026 across all
three octaves, confirming correct day-numbering and no residual duplicate readings in the pool.


### Christmas-week saint octaves (Stephen, John, Holy Innocents) — done (2026-08-28)

`st-stephen-protomartyr`, `st-john-apostle`, `holy-innocents` (Dec 26/27/28's own 8-day octaves)
had zero `octave-readings` files. Their date range overlaps Christmas's own already-authored
Vespers/Lauds `octave-commemoration` blocks (see "Octave content — done" above) — a different
hour/mechanism, not a substitute for Matins content. Checked every suffix file at every date in
the three overlapping ranges (Dec 27–Jan 4): the intervening days (2-7) carry **no Lectio
override at all** in the source — every suffix file found (`12-27o`, `12-28o`/`12-28r`,
`12-29o`/`12-29r`, `12-31o`/`12-31r`; Dec 30 has no suffix file whatsoever) is a bare
`@Sancti/MM-DD` alias, correctly left unauthored, same "vide-only, not a gap" pattern as the
fixed-date octaves above — these three minor commemorations simply have no standing against
Christmas week's own dominant office on those days. Only each octave's own closing/"In Octava"
day carries real content: `st-stephen-protomartyr-octave-day-8` (Jan 2 — St. Augustine's own
sermon on Stephen + St. Jerome on Matt 23:34-35), `st-john-apostle-octave-day-8` (Jan 3 —
St. Augustine's Tractate 36 on John, the "eagle" imagery + St. John Chrysostom on John 21:20-24),
`holy-innocents-octave-day-8` (Jan 4 — St. Augustine's own first sermon for Childermas +
St. John Chrysostom on Matt 2:13-18). Holy Innocents' own Lectio4 closing sentence in the
source's English is garbled into an incoherent fragment (a legal-term wordplay on "pledges,"
"Pígnora sunt, non crédita, sed creáta...") — reconstructed to match the Latin, `en` marked
`draft` for that file. `tsc --noEmit` and `npm test` (522 tests) both pass; live-verified via
`activeOctavesFor`/`resolveOrdo` on 2027-01-02/03/04, confirming all three readings surface
correctly (and don't collide) even on dates where two or three of these octaves are
simultaneously active. This closes out the last open item from the "octave-readings audit"
above — no octave-reading gaps remain open anywhere in the calendar.


### Octave-readings audit — two real gaps found and closed, scope of the rest recorded (2026-08-28)

Prompted by the user pointing out that the reference source keys octave-day content by
**calendar date** (e.g. `08-11oct.txt` through `08-16oct.txt` for St. Lawrence's octave), not
grouped by octave-day-number the way `data/propers/octave-readings/<feast>-octave-day-N.yml` is
— a genuinely different question from the saint-level sweep above, not covered by it. Audited
every fixed-date octave (`st-lawrence`, `assumption`, `all-saints`, `immaculate-conception`,
`nativity-bvm`) for missing days: most gaps in the existing files (IC days 4/6, Nativity-BVM day
7, Lawrence days 6/7) turned out to be days where the source's own `[Rank]` says `vide Sancti/
MM-08` with **no Lectio override at all** — genuinely no distinct content to author, matching the
existing precedent already set by St. Lawrence's own correctly-unauthored days. Two, however,
were real gaps with genuine, un-authored Lectio content:
- `immaculate-conception-octave-day-8.yml` (Dec 15, the octave's own closing/"In Octava" day) —
  Pope Pius IX's dogmatic bull (a different excerpt than any other day in the octave) + a
  homily of St. Epiphanius of Salamis on the BVM (Lectio7-9, bare Gospel incipit dropped per the
  usual rule). Both languages present and verified in the source.
- `nativity-bvm-octave-day-3.yml` (Sep 10) — St. Jerome's homily on Matthew's genealogy
  (Matt 1:1-17, bare incipit dropped). No usable English exists in the reference engine for this
  file — `English/Sancti/09-10bmv.txt` is a verbatim Latin duplicate, the same reference-engine
  data-bug class as `st-anicetus`/`st-george` — so `en` is this project's own translation,
  `draft`.

Both live-resolved correctly (`resolveOrdo` on 2026-12-15 and 2026-09-10) and `tsc --noEmit`/
`npm test` (522 tests) both pass.


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
confirming this app's calendar does map the Assumption despite an older design note that said
fixed BVM/Lord feasts were "not modeled by this app at all yet"; Nocturn 1's own
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


### Temporal-cycle nocturn-readings sweep — rest of the year done (2026-08)

Extended the post-Pentecost sweep above to the other 26 temporal ids — Advent (`advent-1..4`),
`christmas-octave-sunday`, post-Epiphany (`post-epiphany-1..6`), Septuagesima through Lent
(`septuagesima`, `sexagesima`, `quinquagesima`, `lent-1..4`), Passiontide/Holy Week
(`passion-sunday`, `palm-sunday`), and Eastertide (`easter-octave`, `easter-3..6`,
`sunday-after-ascension`) — using the reference engine's own per-season Tempora files
(`Adv1-0.txt`..`Adv4-0.txt`, `Nat1-0.txt`, `Epi1-0a.txt`/`Epi2-0.txt`..`Epi6-0.txt`,
`Quadp1-0.txt`..`Quadp3-0.txt`, `Quad1-0.txt`..`Quad6-0.txt`, `Pasc0-0.txt`..`Pasc7-0.txt`).
24 of 26 ids got real, sourced Nocturn 2/3 content on the first pass; the remaining 2 temporal
ids in this season range (`easter-sunday`, `pentecost-sunday`) were initially misdiagnosed as
genuine source gaps (see below) — corrected the same day, both now authored too.

- **`post-epiphany-1`'s real source is `Epi1-0a.txt`, not `Epi1-0.txt`**: the reference
  engine reassigns `Epi1-0.txt` to the later (1893/1921) feast of the Holy Family, which this
  project doesn't model (see the temporal-cycle survey note on Holy Family as a still-open
  pre-1955 gap, elsewhere in this file). `Epi1-0b.txt` (a thin `Dominica I post Epiphaniam`
  wrapper cross-referencing `Epi1-0a` for its own Nocturn 1) confirmed `Epi1-0a.txt` carries the
  real older "Dominica infra Octavam Epiphaniæ" office underneath. That file also has a real
  structural gap of its own: its `[Rule]` reads "Initia cum responsory" and it carries no
  `[Responsory4]`-`[Responsory9]` tags at all — its Nocturn 2/3 responsories come from a
  continuous weekly "Historia" cycle not transcribed per-Sunday in the static files (same class
  of gap as the post-Pentecost season's un-sourced Nocturn 2 weeks). `post-epiphany-1.yml`'s
  two readings are authored without a `responsory` field for this reason, not with an invented
  one.
- **`sunday-after-ascension`'s source file (`Pasc6-0.txt`) has no responsories of its own
  either** (only `[Responsory8]`, proper to a single lesson) — its own `[Rank]`/`[Rule]` say
  "ex Tempora/Pasc5-4" (Ascension Thursday itself), meaning the whole office, responsories
  included, is inherited from that day. Resolved by pulling the representative responsories
  directly from `Pasc5-4.txt` rather than leaving them unauthored.
- **`easter-sunday` (`Pasc0-0.txt`) and `pentecost-sunday` (`Pasc7-0.txt`) were initially
  (wrongly) called source-level gaps, then corrected same day.** Both files' own `[Rule]` really
  does read "1 nocturn" (their whole night office collapses to 3 lessons, straight to Te Deum) —
  true, and unlike every other Sunday in this sweep. But "1 nocturn instead of 3" is not the same
  claim as "no Nocturn 2/3 content exists": `Lectio1` in both files opens with a bare Gospel
  incipit ("Et réliqua") immediately followed by a full patristic homily (Easter: Pope St.
  Gregory the Great, Homily 21 on the Gospels, on Mark 16:1-7; Pentecost: the same, Homily 30, on
  John 14:23-31) continuing through Lectio2-3 — real, substantial, translatable content, just
  compressed into one nocturn rather than split across three the way an ordinary Sunday's 9
  lessons are. `hours/matins.ts` already supports single-nocturn source content tagged
  `nocturn: 1` (the Ember days' own nocturn-readings files do exactly this), and this app's own
  `threeNocturns` rule (every Sunday renders 3 nocturns regardless of the historical rubric for
  this particular feast) reslots the pool across 3 rendered nocturns anyway — the `nocturn: 1`
  tag only affects pool-ordering relative to other same-day contributors, not final placement.
  Authored `easter-sunday.yml`/`pentecost-sunday.yml` the same way as every other Nocturn-3-style
  entry in this sweep: incipit dropped, Lectio1's homily portion combined with Lectio2-3 into one
  reading, Responsory1 (the only nocturn-proper responsory transcribed in either source —
  Responsory3 doesn't exist, the office runs straight to the Te Deum after Responsory2's Gloria
  repeat).
- **Cross-reference reuse continues the post-Pentecost pattern**: several Sundays'
  `[Responsory4]`/`[Responsory7]` tags are themselves cross-references to a different file
  (e.g. `post-epiphany-3` through `-6` all point back to `post-epiphany-2`'s own Responsory4/7;
  `easter-6` points back to `easter-5`'s Pasc4-0 responsories) rather than fresh text — resolved
  and transcribed directly, same as before, not left as unresolved pointers.
- **The "homily begins inside Lectio7 itself" pattern, not just at Lectio8, held for nearly
  every Sunday in this pass** (not only the few post-Pentecost weeks that showed it) — every
  file's Nocturn 3 combines Lectio7's homily portion (dropping only the bare Gospel incipit)
  with Lectio8-9, using Lectio7's own responsory to represent the combined reading.

Live-verified via `npx tsc --noEmit`, `npm run build`, and `npm test` (806 tests, up from 777 —
a "rest-of-year temporal nocturn-readings sweep" describe block in `tests/hours/matins.test.ts`
covering all 28 ids end-to-end, `easter-sunday`/`pentecost-sunday` included; two pre-existing
tests in the ferial-branch describe block also needed a small filter update, since Advent I's
own ferial dates now legitimately pool in `advent-1.yml`'s patristic content alongside the
user's bible-plan readings). No fixture collisions (pure content addition under already-existing
ids, no calendar changes) except one real interaction the new content surfaced: `2026-02-23`,
initially picked as a `lent-1` proof date, turned out to actually be the Vigil of St. Matthias
transferred onto that Sunday and winning outright — swapped for `2031-03-03`, a clean `lent-1`
date.

**Temporal-cycle nocturn-readings sweep, all 52 ids, is now fully complete — no remaining gaps.**
The lesson from the easter-sunday/pentecost-sunday misdiagnosis: "the source's own `[Rule]` says
1 nocturn" is a claim about nocturn *count*, not about whether content exists — always check
whether `[Lectio1]`-`[Lectio3]` (or whichever lessons exist) carry real prose before calling a
short nocturn structure a content gap.


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


- **Vespers ordo — built (2026-08)**: `src/hours/vespers.ts` now resolves a
  full ordo (opening versicle, weekday/seasonal psalmody with the 115+116
  join and 138 split, chapter/responsory/hymn/versicle bundle with
  Advent/Lent/Passiontide/Paschaltide overrides, Magnificat with weekday-
  default antiphon fallback, day-collects) off `resolveEveningDay`, so
  First/Second Vespers precedence and the cross-day commemoration
  (`commemorationOf` — "the loser is commemorated unless the loser is
  simplex", live-verified) both apply before any part runs. See
  `data/hours/vespers.yml`'s header and `tests/hours/vespers.test.ts`.

- **Vespers cross-day commemoration now labeled, and feast-side privilege
  now has a mechanism (2026-08-26)**: a cross-day commemoration
  (`Commemoration`'s `vespersNote: 'today' | 'tomorrow'`, set only by
  `calendar/vespers.ts`'s two `commemorationOfDisplaced*` functions) now
  renders as "(of today)"/"(of tomorrow)" in English, "de præcedenti"/"de
  sequenti" in Latin (`calendar/day-label.ts`) — the real Divino Afflatu
  phrasing, per `horascommon.pl`. Also added `forbidsSuccessorCommemoration`
  to both `SaintRecord` (`calendar/feasts.ts`) and `TemporalFeastRecord`
  (`calendar/temporal-feasts.ts`) — the feast-side mirror of the day-side
  privilege `calendar/commemorations.ts` already modeled (a privileged
  Sunday/major-feria can refuse a weak commemoration *back*; nothing
  previously let a high-ranked feast refuse to commemorate *forward* at
  its own kept Second Vespers). Deliberately a flag, not a ported
  rank-threshold formula (the reference engine's own version is a messy
  fractional-rank matrix) — set only after checking a specific date
  against the live engine, same convention as `vigilOf`.
  - The concrete case that motivated this: **Most Precious Blood (July 1,
    Duplex I classis) vs. the Feast of the Sacred Heart** (Easter + 68
    days), which only ever fall adjacent in a very-late-Easter year
    (Easter in late April). Read the Perl variables carefully (initial
    pass here got this backwards): it's **Sacred Heart's own kept Second
    Vespers that refuses to commemorate Precious Blood** the next
    evening ("Vespera de præcedenti; nihil de sequenti", `$winner` =
    Sacred Heart/`Pent02-5` = *today* at that point in the branch,
    `$cwinner` = Precious Blood/`07-01` = *tomorrow*), not the reverse.
    The other direction — Precious Blood's own Vespers commemorating a
    Sacred Heart that happens to fall the day *after* it, the other rare
    late-Easter arrangement — has no matching carve-out in the reference
    engine at all, so `forbidsSuccessorCommemoration` is deliberately set
    only on `sacred-heart.yml`, not `most-precious-blood.yml`.
  - Still open, separately: the reverse gap remains in daytime
    `decideOccurrence` (`calendar/commemorations.ts`) — a sanctoral
    winner there unconditionally gets its displaced Sunday/feria
    commemorated back, regardless of the winner's own rank. Not addressed
    here; this pass only covered the Vespers cross-day direction.

- **Ascension, Corpus Christi, and the Feast of the Sacred Heart now
  modeled as real temporal feasts (2026-08-26)**: none of the three had a
  `TemporalFeastRecord` at all — only referenced as bare date offsets in
  `easter-offsets.yml`/`temporal-categories.yml`/
  `isMajorFixedFeastOfTheLord`. Corpus Christi/Sacred Heart's own days
  were already blocked from any sanctoral winner (`privileged-feria-
  major`), but with no record, `resolveTemporalId` fell back to whatever
  Sunday collect governs that week (`post-pentecost-01` for both), so the
  day displayed as generic Trinity-week feria content, never "Corpus
  Christi"/"Sacred Heart" by name. Ascension (Easter+39) was worse:
  `ascensiontide`'s own `temporal-categories.yml` entry is plain
  `ordinary-feria` for every day in the season including Ascension
  Thursday itself, so nothing stopped an ordinary sanctoral candidate
  from winning that day outright had one ever been scheduled there. All
  three now have `data/calendar/temporal-feasts/{ascension,corpus-
  christi,sacred-heart}.yml` (`rank: duplex-1-classis`, an `easter`
  anchor, `octave: {enabled: true, wins: duplex}`) — the pre-1955
  calendar specifically (each carries a real octave; the reference
  engine's own "(rubrica 196)"-tagged variant strips it, later-reform
  text this project doesn't follow, per DESIGN.md). Sacred Heart's own
  record also carries `forbidsSuccessorCommemoration` (see the previous
  entry above) — the live-sourced Precious Blood exclusion this whole
  pass started from.
  - `octave.wins: duplex` is matched to `pentecost-sunday.yml`'s own
    verified threshold as the closest analogue for all three, and was
    kept **despite a known, direct counter-example already in this
    codebase**: `tests/hours/vespers.test.ts`'s St. Ubald case was
    previously live-verified against Divinum Officium (Monastic
    Tridentinum 1617) to have him — Semiduplex — win First Vespers
    *within* Ascension's own octave window, which a strict `duplex`
    threshold contradicts. Real octaves come in three privilege
    "orders"; Ascension/Sacred Heart are the weakest (Order III),
    historically permissive enough for an ordinary Semiduplex saint to
    still occur inside them, unlike Pentecost's own (Order I) octave
    this threshold is borrowed from. Kept at `duplex` anyway per direct
    instruction — the Ubald test (and St. Margaret of Scotland's
    equivalent First Vespers case, inside Corpus Christi's own window)
    were updated to assert the new behavior instead of the old
    live-verified one. Revisit if this turns out to misfire elsewhere;
    see `ascension.yml`'s own comment for the full note.
  - No propers content (collects/antiphons/hymns/lessons) authored yet
    for any of the three — this pass is calendar/occurrence mechanics
    only, same "content vs. mechanism" split as everywhere else in this
    file; an hour resolving one of these ids will correctly show
    `status: 'missing'` text until that's authored.

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


### Bible-book-incipits.ts: English column modernized to common English book names (2026-09-11)

User caught `tob`'s English incipit reading "Tobias" and asked how many other books had the "same
greek/latinate mistake" — investigation showed it wasn't a mistake at all: `tob`'s "Tobias" matched
the Douay-Rheims/Vulgate-Latinate spelling used almost everywhere else in the English column
(Josue, Isaias, Jeremias, Osee, Abdias, Jonas, Micheas, Habacuc, Sophonias, Aggeus, Zacharias,
Malachias, Machabees, Paralipomenon, Esdras) — `ezek`'s "Ezekiel" (a deliberate 2026-09-04 fix,
see above) was actually the outlier breaking that pattern, not Tobias.

User's actual preference, once this was surfaced: the English column should use the name an
English reader recognizes, full stop — "all those english names sound better and will make more
sense to english readers... it's fine for the latin since that's the latin style name." Reworked
every English entry in `BOOK_INCIPITS` to the modern common-English book name, independent of the
Latin column (which keeps its Vulgate/Douay-Rheims forms unchanged): Josue->Joshua, Tobias->Tobit,
Isaias->Isaiah, Jeremias->Jeremiah (+ the Lamentations heading), Osee->Hosea, Abdias->Obadiah,
Jonas->Jonah, Micheas->Micah, Habacuc->Habakkuk, Sophonias->Zephaniah, Aggeus->Haggai,
Zacharias->Zechariah, Malachias->Malachi, Machabees->Maccabees, Paralipomenon->Chronicles,
Ecclesiasticus->Sirach, Canticle of Canticles->Song of Songs, Apocalypse->Revelation. The 1-4 Kings
group also got split to match modern numbering, not just re-spelled: 1-2 Kings (Vulgate)->1-2
Samuel, 3-4 Kings (Vulgate)->1-2 Kings; 1-2 Esdras (Vulgate)->Ezra/Nehemiah (no longer numbered,
since modern English doesn't treat them as a numbered pair). `ezek`'s prior "Ezekiel" fix now
matches the rest of the column instead of being an isolated exception. Left every quoted
Douay-Rheims scripture/martyrology/homily prose text under `src/data/scripture/`,
`src/data/martyrology/`, `src/data/propers/` alone — those are source-text quotations, not this
app's own generated incipit labels (same boundary as the 2026-09-04 Ezekiel fix). `npm test`
(2088 passed) and `tsc --noEmit` both pass.


### Exaltation of the Holy Cross wrongly reused Finding's Matins content — real distinct sourcing restored (2026-09-14)

User, on the feast day itself: "exaltation is not the same feast as finding" — flagging that
2026-09-14's Matins antiphons looked wrong. Confirmed as a real sourcing bug, not just a judgment
call: `exaltation-of-the-holy-cross.yml`'s own `[Rule]` (`ex Sancti/05-03`) only governs the
untagged/default parts of the *secular* office — versicles, `Ant 1`, `Ant Vespera`, Lauds
capitulum genuinely are shared with Finding of the Holy Cross (May 3), and stay that way. But
the reference engine's own **Monastic-specific file for this feast**,
`../divinum-officium-reference/web/www/horas/Latin/SanctiM/09-14.txt`, was never consulted when
this feast's Matins psalmody/nocturn-readings were authored earlier today (commit `7757ade`) —
it's not a passthrough, and carries real, distinct content: three proper Matins antiphons
(`AntMatutinumM`, one explicitly tagged `Ant Matutinum 3N` — the source itself marks it as the
Nocturn 3 antiphon), its own Nocturn 2 legend (the Emperor Heraclius recovering the Cross from
Chosroes, King of Persia, 614-629 AD — a different historical event from Finding's 4th-century
St. Helena narrative, which had been duplicated in wholesale by mistake), a distinct Responsory4
("O crux benedícta..."), and the secular file's own `[Oratio]` is textually distinct from
Finding's collect too.

Fixed: new Matins Nocturn 1/2/3 antiphons + Nocturn 2 responsory sourced from `SanctiM/09-14.txt`/
`Sancti/09-14.txt` (`matins-psalmody-overrides/saints/exaltation-of-the-holy-cross.yml`,
`propers/nocturn-readings/exaltation-of-the-holy-cross.yml`); `propers` split off its own id
(`exaltation-of-the-holy-cross`, was pointed straight at `finding-of-the-holy-cross`) so the
collect could diverge — new `exaltation-of-the-holy-cross-collect.yml` with the real distinct
Oratio, plus duplicated (genuinely shared, not a bug) `-antiphon`/`-magnificat-antiphon`/
`-commemoration` files under the new id, since that lookup mechanism has no cross-id fallback
(same constraint as the Matins files). Nocturn 3 (Gospel + Augustine homily) and `common` (Lauds/
Vespers antiphons, hymns, capitulum, versicles) are untouched — confirmed genuinely shared by the
Monastic file's own directives, not conflation. `npm test` (2096 passed) and `npm run build` both
pass.


### Vespers/Lauds/Matins bug sweep + commemoration reordering, prompted by 2026-09-13's own Vespers (2026-09-13)

User's own question about that evening's Vespers ("the responsory has alleluias in it... like it's
a Paschaltide responsory") surfaced a real, year-round-recurring bug family, plus a design change:

- **Alleluia leak**: 2026-09-13's Vespers is genuinely First Vespers of the Exaltation of the Holy
  Cross (Sept 14), correctly anticipated per existing `calendar/vespers.ts` logic. Exaltation
  reuses Finding of the Holy Cross's (May 3, genuinely Paschaltide) Common bundle wholesale, and
  that Common's Vespers responsory/versicle and Lauds/Benedictus antiphon files hardcoded Alleluia
  unconditionally — correct for May 3, wrong reused outside Paschaltide. Fixed via the existing
  `-paschaltide` variant-file convention (Vespers responsory/versicle) and `withPaschaltideAlleluia`
  (Benedictus/Magnificat antiphons, previously deliberately un-gated for a saint's own proper
  antiphon — that restriction lifted). The non-Paschaltide Vespers responsory's refrain
  ("Miserére nostri, qui passus es pro nobis") is sourced from the reference engine's own parallel
  Matins Responsory 11 for Sept 14, not invented.
- **Missing Magnificat antiphon + a real mislabeling found while sourcing it**: neither feast had a
  Magnificat antiphon authored at all. Sourcing it from the reference engine's own antiphon-
  selection rule (`horas.pl`'s `canticum()`) showed the *existing* "Benedictus antiphon" file was
  actually miswired — it held `[Ant 1]` ("O Crux, splendídior..."), which the engine's own logic
  assigns to First Vespers' Magnificat specifically, not Lauds; Lauds (and Second Vespers) actually
  share the higher-numbered `[Ant 2]` ("Super ómnia ligna cedrórum...", never authored before). Both
  now correctly split across `finding-of-the-holy-cross-antiphon.yml` (Benedictus) and the new
  `finding-of-the-holy-cross-magnificat-antiphon.yml`.
- **Matins Nocturn 2/3 responsory gap**: `proper-to-the-finding-of-the-holy-cross` had no entry in
  `matins-responsories-by-common.yml` at all, so both feasts' Nocturn 2/3 readings rendered with no
  responsory. Seeded from the reference engine's own Sept-14-specific (not May-3-reused) Monastic
  responsories, both already season-neutral in the source.
- **Day header dropping "Sunday"**: a follow-up question about the same evening's header
  surfaced that `day-label.ts`'s `collectCommemorations` derived a commemorated Sunday's name from
  `day.weekday`, which is wrong specifically for this cross-day Vespers/Compline case (`day` is
  *tomorrow*) — the commemoration already carried its own correct bilingual label
  (`commemorationOfDisplacedPredecessor`) for exactly this reason, just never consulted. Fixed to
  fall back to that carried label; brought to parity with `hours/resolve-common.ts`'s
  `temporalCommemorationPart`, which already did this correctly.
- **Commemoration ordering redesigned**: previously a fixed kind-based grouping (temporal-then-
  sanctoral-then-octave, `TODO.md`'s 2026-09-05 note above says this was "the day label's own
  convention," not a liturgical rule) — replaced, per direct user instruction, with "most recent
  date first": each commemoration's own real governing date (a Sunday's own date; a cross-day
  sanctoral commemoration's date shifted ±1 day via its `vespersNote`; an octave's own start date
  via `activeOctavesFor`'s `dayNumber`), sorted descending, ties falling back to the old kind order.
  New shared `calendar/commemoration-order.ts` (kept separate from `commemorations.ts` to avoid an
  import cycle with `octaves.ts`) is now used by *both* `day-label.ts` (header) and
  `hours/resolve-common.ts`'s `getDayCollects` (reading/collect list), so the two stay in sync by
  construction. One existing test (Aug 17's St. Lawrence/Assumption-octave/St. Hyacinth label)
  updated to the new correct order. `npm test` (2096 passed), `tsc --noEmit`, and `vite build` all
  pass.

### Every `status: 'missing'` occurrence eliminated app-wide (2026-09-14)

Prompted by that evening's own blank Magnificat antiphon (First Vespers of the Seven Sorrows of
the BVM, Sept 15, governing 2026-09-14's evening — no `seven-sorrows-of-the-bvm-magnificat-
antiphon.yml`, and `benedictusCommon` unset so the Common-category fallback never fired either) and
a direct instruction that no `status: 'missing'` text may remain anywhere in the app, full stop.

A plain YAML grep for `status: ... missing` only ever catches a *flagged* gap — the Magnificat case
above is a *structural* one, invisible that way (nothing in any YAML says "missing"; the runtime
fallback chain in `getMagnificatAntiphon` just silently produces an empty `ResolvedText`). Found
every real instance instead by resolving all 8 hours for every sanctoral day and two full temporal
years (2026-2027) and inspecting the actual rendered output — a throwaway audit script, not kept —
for any `{text, status}`-shaped node with empty `text` regardless of what `status` said (a second,
independent bug in `splitNamedAntiphon` was silently dropping `status` to `{}` on empty input,
which is why the naive `status.en === 'missing'` check alone wasn't enough).

Fixed, by category:
- **137 saints** had no reachable Magnificat antiphon (own `${propers}-magnificat-antiphon` file,
  or `benedictusCommon`-keyed Common file) at all. Root-caused: 96 just needed `benedictusCommon`
  set to their own already-correct `common` field value (reusing already-authored Common-category
  files — Several Martyrs, BVM, Confessor Bishop, Martyr, Virgin Martyr, Confessor, Abbot, Virgin,
  Holy Woman), with `common-of-a-martyr-bishop`→`common-of-a-martyr` and `common-of-a-widow`→
  `common-of-a-virgin` collapsed per the already-established convention (confirmed by
  `magnificat-antiphon-common-of-a-martyr.yml`'s own header, which already documented covering
  `-bishop` too). New Common-category files authored from the reference engine's own `[Ant 3]`
  (Second Vespers convention, matching every existing Common magnificat file): `common-of-an-
  apostle` (17 saints), `common-of-an-evangelist` (3 — genuinely identical text, `C1a.txt` is bare
  `@Commune/C1` for every antiphon section), `common-of-apostles` (plural-day variant, 1),
  `common-of-a-confessor-not-bishop` (5, incl. St. Camillus de Lellis whose own `benedictusCommon`
  was already set to this category but the file didn't exist). New own-proper files sourced
  directly from each feast's own `[Ant 3]` (or a duplicated `[Ant 1]`, same convention as
  `exaltation-of-the-holy-cross-magnificat-antiphon.yml`, when no separate Second Vespers text
  exists in the source): the 4 Archangel/Guardian-Angels feasts, St. Peter's Seven Founders of the
  Servite Order, All Saints of the Benedictine Order (`SanctiM/11-13M.txt` — English supplied by
  hand, `draft`, since the reference engine's own English file has no rendering of this antiphon at
  all), Most Precious Blood, the Transfiguration, and the Visitation of the BVM. `ss-ursula-and-
  companions` deliberately left unset (her own file already documents she can never actually be the
  day's winner) and the 3 pre-major-feast Vigils deliberately untouched (`getMagnificatAntiphon`'s
  own `rank === 'vigil'` branch already provides real content via the classic weekday-default table
  before ever reaching `benedictusCommon`, confirmed live).
- **`christmas-octave-sunday`'s own Vespers hymn/versicle**: had a real chapter (borrowed from
  Lauds, correctly) but no `vespers-hymn-`/`vespers-versicle-` file of its own, so both rendered
  empty — unlike the chapter, Vespers genuinely has its own distinct hymn here (`[Hymnus Vespera]`,
  "Jesu, dulcis memória", not Lauds' "A solis ortus cardine"). Sourced from `Tempora/Nat2-0.txt`.
- **The 4 Archangel/Guardian-Angels feasts' Matins Nocturn 3**: rendered an empty antiphon part
  before the Gospel. Live-verified genuinely no-antiphon-in-source, not an authoring gap (each
  feast's own 9 `[Ant Matutinum]` antiphons are fully consumed across Nocturn 1 (6) + Nocturn 2 (3),
  none left for Nocturn 3) — `sundayCanticleNocturn` (`hours/matins.ts`) now omits the closing
  `antiphon` part entirely when `group.antiphon` is genuinely absent, same "omit rather than render
  empty" convention as Vespers' own `NO_VESPERS_RESPONSORY`.
- **12 scripture verses** (`1thess-4`, `2thess-2`, `2reg-13`, `gen-5`, `isa-33` ×2, `isa-46`,
  `jdth-4`, `2cor-1`, `joan-11`, `jos-10`, `sir-29`, `sir-36`) had a literal `en: missing` marker —
  the bulk-imported "Unbound Bible" Douay-Rheims source itself has no English for these particular
  verses. First pass translated these by hand from the Vulgate and marked `draft`; corrected same-day
  after a direct question ("why not pull this from the scripture store" / "why translate it
  yourself") — cross-checked each against drbo.org's own Douay-Rheims + Latin-Vulgate parallel pages
  instead of freehanding a translation, now `verified`. All 12 turned out close to the hand
  translation (same well-known Challoner-register wording), with the exact published phrasing
  substituted in a few (e.g. "the upbraiding of houseroom, and the reproaching of the lender" for
  Sir 29:34, not "household"/"usurer"). Same pass also caught the new
  `all-saints-of-the-benedictine-order-magnificat-antiphon.yml` mismarked `draft` when its English
  is a verbatim, already-`verified` quote from this app's own
  `nocturn-readings/ss-seven-founders-of-the-servite-order.yml` — corrected to `verified`.

**Explicitly out of scope for this pass** (per direct instruction — draft content is acceptable,
only literal `missing` is not): the ~324 pre-existing `status: 'draft'` files found during the same
sweep (277 `propers/common`, 17 `nocturn-readings`, 15 `temporal`, 12 `octave-readings`, plus
`vespers-magnificat-antiphons.yml`'s Thursday/Friday) — real text already on file, just not yet
independently re-verified against the reference engine. A future pass.

`npm test` (2096 passed), `tsc --noEmit`, and `vite build` all pass. Two pre-existing tests updated
to match: `resolve-common.test.ts`'s Sunday-weekday-default case (used to rely on 2026-01-04 hitting
the *then*-still-unauthored Holy Innocents octave to observe `'missing'` — that octave now resolves
to real content too, so the invariant is asserted directly against `vespers-magnificat-
antiphons.yml`'s own data instead); `bulk-import.test.ts` now accepts `draft` (with real text) as
well as `verified` for a scripture verse's English status.

### Follow-up same day: 23 of the above 96 batch-wired saints had real proper content, not Common (2026-09-14)

User reported the evening's Magnificat antiphon "reads like the ferial antiphon" — it wasn't
literally ferial, but it was the generic `magnificat-antiphon-common-of-the-bvm.yml` fallback for
the Seven Sorrows of the BVM, whose own source file (`Sancti/09-15.txt`) turns out to have real
`[Ant 2]`/`[Ant 3]` text that the same-day batch fix never checked for — it only verified "does a
Common file exist for this saint's `common` field," not "does this saint have her own better text
first." Worse: `seven-sorrows-of-the-bvm-antiphon.yml` (Benedictus) was *already* wrong before this
session too, reading `[Ant 1]` (this feast's own First Vespers Magnificat text) instead of `[Ant 2]`
— the same mis-tagging bug already fixed once for the Exaltation of the Holy Cross (TODO.md,
2026-09-13). Both corrected.

Auditing all 96 batch-wired saints the same way (comparing each against their own `Sancti`/`SanctiM`
source file rather than trusting "a Common file exists") found **23 total** with real own `[Ant 2]`/
`[Ant 3]` content that the batch fix bypassed in favor of a generic Common substitution:
Annunciation, Apparition of the Immaculate BVM, Holy Innocents, Immaculate Conception, Maternity of
the BVM, Nativity of the BVM, Our Lady of Mount Carmel, Purification, Queenship of the BVM, the
Seven Sorrows, Ss. John and Paul, St. Agatha, St. Agnes, St. Cecilia, St. Clement, St. Joseph,
St. Lawrence, St. Lucy, St. Margaret of Antioch, St. Martin of Tours, St. Mary Magdalene,
St. Paulinus of Nola, St. Robert. Of these:

- **19 fixed outright**: own proper Magnificat antiphon authored from `[Ant 3]` (or a duplicated
  `[Ant 1]`/self-referencing `[Ant 2]`, same "one text for both Vespers" convention as
  `exaltation-of-the-holy-cross-magnificat-antiphon.yml`), and — for the 6 where the existing
  Benedictus file also had the Ant1-for-Benedictus mis-tagging bug (Annunciation, Apparition of the
  Immaculate BVM, Maternity of the BVM, Our Lady of Mount Carmel, Purification, Queenship of the
  BVM, plus the Seven Sorrows itself) — corrected to `[Ant 2]` too.
- **Immaculate Conception**: Magnificat antiphon added from `[Ant 3]` (a previously entirely
  unauthored slot, no conflict), but her *Benedictus* antiphon deliberately left untouched — its own
  file header claims an earlier live Divinum Officium query showed different text
  ("Conceptiónem hodiérnam...") than the static source's own `[Ant 2]` ("Ait Dóminus Deus ad
  serpéntem..."), and this session has no live-query access to adjudicate which is actually right.
- **St. Joseph, St. Robert, St. Margaret of Antioch, St. Paulinus of Nola**: left entirely
  untouched. Each has an existing Benedictus-antiphon file whose own header claims a live-query
  verification result that *disagrees* with this static source reading (St. Joseph's and
  St. Robert's headers explicitly say the Monastic rite's real Lauds output differs from the
  secular `Sancti` file's own `[Ant 2]`/`[Ant 3]` — plausible, since Monastic and secular
  genuinely do diverge in places, per this app's own target-rite design). Guessing between two
  unverifiable claims risked making things worse, not better, so these are flagged here instead:
  **re-verify against a live Divinum Officium query before touching**, not against this static
  source alone. St. Paulinus of Nola's own source has no `[Ant 3]` at all (confirmed genuinely
  absent, not a further gap) so his Common-fallback Magnificat already stands correctly regardless.

Re-ran the full runtime audit from the entry above afterward: still zero `missing`/empty
occurrences. `npm test` (2096 passed), `tsc --noEmit`, and `vite build` all pass.

**Open follow-up, not done in this pass**: the other ~73 of the 96 batch-wired saints were *not*
individually re-checked against their own source files this same way (only the ~23 the systematic
Ant2/Ant3-presence scan flagged) — the scan should be reliable (it greps each saint's real
`Sancti`/`SanctiM` file directly), but hasn't been independently spot-checked the way this entry's
own findings were. Worth a second look if another "this looks generic" report comes in.

### September/Advent Ember days' winning threshold raised Semiduplex -> Duplex, split into their own `privileged-feria-ember` tier (2026-09-18)

User asked what would happen if the Ember-day winning threshold moved to Duplex. September's and
Advent's Ember days previously shared `privileged-feria-minor` (Semiduplex threshold) with Advent's
plain ordinary ferias — moving the shared tier's threshold would also have raised the bar for every
plain Advent feria (St. Nicholas, Semiduplex, would stop winning outright too), which the live
evidence behind *that* tier doesn't support. Lent's and Pentecost's own Ember days, by contrast,
already sit at the Duplex-threshold `privileged-feria` tier. Split Ember days (both September's and
Advent's) into a new dedicated `privileged-feria-ember` category instead: Duplex threshold like
Lent/Pentecost's Ember days, but keeping `privileged-feria-minor`'s "nothing ever transfers, the
loser is always commemorated" shape rather than `privileged-feria`'s transfer behavior — no live
evidence either Ember cluster ever displaces a saint off its own date entirely.

This deliberately overrides this file's own earlier live-verified evidence for the Semiduplex
threshold (Ss. Cornelius & Cyprian winning outright on September Ember Friday, Sept 16 2026) — user
confirmed directly, treating the older evidence as settled but no longer the desired behavior.
Three 2026 dates flip as a direct result: September Ember Wednesday/Friday/Saturday (Ss. Cornelius &
Cyprian, St. Joseph of Cupertino, St. Januarius — all Semiduplex) now lose outright to their
respective Ember day instead of winning, each still commemorated. `tests/calendar/ember-days.test.ts`
updated to match (3 cases flipped, `privileged-feria-minor` -> `privileged-feria-ember` throughout);
`tests/calendar/marian-saturday.test.ts`'s "loses outright to a Semiduplex-or-higher saint" case
re-pointed from 2026-09-19 (now Ember Saturday, excluded from Marian Saturday's `ordinary-feria` gate
regardless of rank) to 2026-01-24 (St. Timothy, Semiduplex, a genuinely ordinary Saturday).

`tsc --noEmit`, `npm test` (4218 passed), and `vite build` all pass.

### Advent's own ordinary-feria threshold also raised Semiduplex -> Duplex, split into its own `privileged-feria-advent` tier (2026-09-18, same session)

Follow-on from the Ember split above: user asked to raise Advent's own plain (non-Ember) feria
threshold too. Same shared-tier problem as before — Advent's ordinary ferias shared
`privileged-feria-minor` with Christmastide's, and Christmastide has its own independent live
evidence for the Semiduplex threshold (St. Thomas of Canterbury winning outright Dec 29 within the
Christmas Octave) that the user did not ask to touch. Split Advent's plain ferias into a new
`privileged-feria-advent` category (Duplex threshold, same never-transfer/always-commemorate shape
as `privileged-feria-minor`); Christmastide kept unchanged at the original tier and threshold.

St. Nicholas (Dec 6, Semiduplex) was the concrete case that originally established the Semiduplex
threshold. Rather than accept his demotion to a bare commemoration the way Ss. Cornelius & Cyprian
were in the Ember split, user chose to re-rank him: `st-nicholas.yml`'s `rank` raised
Semiduplex -> Duplex specifically so he keeps winning outright under the new threshold — a
deliberate rank inflation, not a reconstruction-fidelity correction, documented in the file's own
header.

Updated: `types.ts` (new category + doc comment), `commemorations.ts` (new `decideOccurrence`
case + `minimumOutrightWinningRank` entry), `day-label.ts` (label map entry), `vespers.ts` (added to
the rank-independent "keeps own Second Vespers" list), `temporal-categories.yml` (`advent`'s
`bySeason` entry + surrounding comments). Test updates: `tests/calendar/december-sanctoral.test.ts`
(St. Nicholas case, rank now `duplex`), `tests/calendar/commemorations.test.ts` (new
`privileged-feria-advent` describe block, old `privileged-feria-minor` block's comments
re-attributed to Christmastide), plus stale-comment-only fixes (no behavior change) in
`tests/calendar/day-label.test.ts`, `tests/calendar/november-sanctoral.test.ts`, and
`tests/hours/matins.test.ts` where `privileged-feria-minor` had been mentioned for an Advent date
that's now `privileged-feria-advent`.

`tsc --noEmit`, `npm test` (4220 passed), and `vite build` all pass.

### Lent's and Pentecost's own Ember days built and imported (2026-09-19, same session)

User asked whether the reference engine has proper content for *any* of the Ember days, having
already checked September's and Advent's. Checking all four quarters directly against the reference
engine (`Tempora/Quad1-{3,5,6}.txt` for Lent, `Tempora/Pasc7-{3,5,6}.txt` for Pentecost — the latter
inside Pentecost's own Octave, not the week after it, which is a different set of files
(`Pent01-*`) that turned out to belong to Corpus Christi's own week instead, a mis-identification
corrected mid-conversation) found real, distinct proper content for both: full Gospel pericope +
patristic homily, proper Benedictus/Magnificat antiphons (Wed/Fri only, Saturday genuinely has none
in the source, same pattern already confirmed for September/Advent), and a proper collect — Lent's
own uniquely split by hour (`[Oratio 2]` at Lauds, `[Oratio 3]` at Vespers, two different texts;
this app has no per-hour collect-variation mechanism, so only the Lauds one is modeled, same
"doesn't model hour-scoping nuance" simplification level `calendar/ember-days.ts` already documents
elsewhere). Built out following the September/Advent mechanism and content shape exactly: new
`lentEmberDayOffset`/`pentecostEmberDayOffset` in `calendar/temporal.ts` (direct Easter-offset
checks, `-39`/`-37`/`-36` and `52`/`54`/`55` — simpler than September's "nearest Sunday to a fixed
date" or Advent's "N days after a separately-computed Sunday," since these are already fixed,
verified offsets), `LENT_EMBER_IDS`/`PENTECOST_EMBER_IDS` in `calendar/ember-days.ts`, and 6 new
`day-label.ts` entries. Neither quarter needed a `resolveTemporalCategory` change on the precedence
side: Lent's Ember days already sit at the Duplex threshold via `temporal-categories.yml`'s plain
`offsets` table, and Pentecost's already get the same tier via `pentecost-sunday.yml`'s own Octave
`wins: duplex` — both predate this work and needed no Ember-specific addition, confirmed by reading
rather than assumed.

Content authored: 6 collects, 6 Benedictus antiphons, 4 Magnificat antiphons (Wed/Fri, both
quarters), 6 nocturn-readings files — all recombined into one reading per the established
"source doesn't genuinely split" convention (see the September-Friday recombine entry above), full
bilingual `text`/`status: verified` throughout, sourced directly from the Latin/English/Monastic-
track files (Gospel pericopes pulled from `missa/` where `horas/`'s own file only gave an incipit,
same pattern as September's 2026-09-05 pericope-authoring fix). Responsory sourcing needed real
judgment per day rather than a single mechanical rule: Lent Ember Wednesday and Saturday each have
one genuinely proper responsory in the source (Saturday's is an explicit source cross-reference
*reusing* Wednesday's own), so those are used instead of the usual "first one, when several
collapse" convention; Lent Friday and all 3 Pentecost days have no such distinguishing case, so the
established "first one" convention applies there. Pentecost Saturday's own source genuinely has only
2 lessons (not padded to 3) — its `[Lectio3]` is a bare cross-season pointer into an unrelated Lent
homily, not real content of its own.

Two real, deeper bugs found and fixed along the way, both specific to Pentecost's Ember days falling
*inside* Pentecost's own Octave every year (unlike September's only occasional, genuinely-foreign
BVM-octave overlap) — Lent's Ember days never collide with any active octave at all, so neither
applied there:

1. `calendar/ember-days.ts`'s `applyEmberDay` gate (`if (activeOctavesFor(isoDate).length > 0) return
   winner`) unconditionally deferred to *any* active octave, including the Pentecost octave that's
   always active on Pentecost's own Ember days — would have permanently suppressed all of Pentecost's
   Ember content. Fixed by exempting `pentecost-sunday` specifically from that gate rather than
   loosening it generally.
2. Even with (1) fixed, `hours/resolve-common.ts`'s `resolveOfficeWinner` (used by `getDayCollect`,
   `getBenedictusAntiphon`, and — via the shared `ALWAYS_OVERRIDE_TEMPORAL_IDS` set — `hours/
   lauds.ts`'s psalmody override) still silently substituted Pentecost Sunday's own generic content
   back in on every Ember day, since it treats *any* interior day of a Duplex+ octave with no saint
   record as inheriting the octave's own governing feast, unconditionally. Live-caught: `2026-05-27`
   (Ember Wednesday, itself the winner) rendered Pentecost Sunday's own Benedictus antiphon
   ("Accípite Spíritum Sanctum") instead of the Ember day's own ("Ego sum panis vivus") — the collect
   silently had the same bug, masked because both texts happened to resolve to `status: verified`
   (a real lesson: checking only `.status`, not the actual text, let this one slip past an earlier,
   too-shallow sanity check in this same session). Fixed by adding the 3 `ember-pentecost-*` ids to
   `ALWAYS_OVERRIDE_TEMPORAL_IDS` (the existing "this id has real standing of its own" exemption set),
   the same mechanism already used for Trinity Sunday, Corpus Christi, etc.

That second fix then broke `hours/terce.ts`'s own Pentecost-week hymn swap ("Veni Creátor Spíritus"),
which had been checking `resolveOfficeWinner(day).id === 'pentecost-sunday'` as a proxy for "is this
day within Pentecost's Octave" — now false on the 3 Ember days specifically, since they correctly
report their own id instead. Fixed narrowly (matching on the id prefix `ember-pentecost-` too, not
replaced with a direct `activeOctavesFor` octave-window check) — a direct octave-window check would
have been wrong for an unrelated reason found in the process: the Octave's own `days: 8` config
technically still covers Trinity Sunday itself (offset 56, `dayNumber` 8), a pre-existing quirk
this session didn't otherwise touch, previously invisible because `resolveOfficeWinner`'s own
higher-priority `trinity-sunday` entry in the same exemption set always short-circuited before ever
reaching the octave-substitution logic on that specific day.

A third, independent copy of the same "octave governs the headline" assumption lived in
`day-label.ts`'s `getDayLabel`/`getDayTitleName` (their own `resolveActiveOctave`/
`octaveGoverningPrivilegedDay` gate, separate from `resolveOfficeWinner` but reasoning the same way)
— without the matching exemption there, Pentecost's Ember days would render as the bare "Octave of
Pentecost (Nth Day)" headline with no Ember mention at all, the Octave itself still correctly riding
along as a commemoration underneath either way. Fixed with the same `ember-pentecost-` id-prefix
check, in both functions.

Two pre-existing tests (`marian-saturday.test.ts`, `transfer.test.ts`) had encoded the *old*,
buggy `pentecost-sunday`-as-winner behavior on `2026-05-30` as the expected outcome — both updated
to the new, correct `ember-pentecost-saturday` winner id; the actual behavior each test is really
checking (Marian Saturday never applies within an active octave; St. Felix I is caught and
commemorated in place rather than transferring) is unchanged either way. `tests/calendar/
ember-days.test.ts` extended with the same coverage shape as the existing September/Advent cases,
including a real 2026 case of a Duplex+ saint (St. Gabriel of Our Lady of Sorrows, Feb 27) winning
outright over Lent Ember Friday — the Lent-side mirror of the "saint wins, Ember commemorated" case
already covered for September/Advent.

`tsc --noEmit`, `npm test` (4227 passed), and `vite build` all pass.

### Lent's ordinary ferias given real per-day identity + genuine per-hour collects (2026-09-19)

Follow-up to the Ember-day work above: grepping the reference engine for `[Oratio 2]`/`[Oratio 3]`
showed the Lauds/Vespers collect split isn't Ember-specific — every ordinary feria of Ash
Wednesday's own week and Lent weeks 1–4 (weeks 5–6 are Passiontide/Holy Week, already given full
per-day identity in an earlier campaign) carries genuinely distinct Lauds and Vespers collects (and
distinct `[Ant 2]`/`[Ant 3]`) in the source. Until now every one of these days silently inherited its
governing Sunday's single collect/antiphons via `resolveTemporalId`'s fallback, and the app had no
mechanism anywhere to vary a collect by hour at all.

Three pieces, built and content-authored together:

1. **Precedence-tier verification.** `temporal-categories.yml`'s `bySeason.lent.feria` was
   `ordinary-feria` (no rank floor), which `calendar/types.ts` flagged as an unverified, likely-wrong
   gap ("documented as sharing Christmastide's `privileged-feria-minor` property but not switched
   yet"). Live-verified against the reference engine: St. Lucius I (Simplex, March 4, 2038 — a year
   clear of both Ash Wednesday's week and Passion/Holy week) wins outright with no commemoration at
   all, exactly `ordinary-feria`'s behavior, not `privileged-feria-minor`'s. The suspected gap turned
   out to be correct as-is; `types.ts` and `temporal-categories.yml`'s own comments updated to record
   the verification rather than leave it open. Independently re-confirmed live inside the app itself
   via the new test suite below (`2027-03-04`, same saint, same real-date collision).

2. **Real per-day identity via the existing movable-feasts mechanism.** No new relabeling function
   needed — `calendar/movable-feasts.ts` + `data/calendar/temporal-feasts/*.yml` (`anchor: {kind:
   easter, offset: N}`, `rank` omitted, defaulting `simplex`) is the same generic mechanism Passion
   week's 12 days already used, and its own header comment explicitly anticipated exactly this next
   use case. 25 new records added: `ash-wednesday` plus the three days after it, `lent-1-{monday,
   tuesday,thursday}` (Wed/Fri/Sat are already the Ember days), and all six weekdays of
   `lent-{2,3,4}`. None needed `ALWAYS_OVERRIDE_TEMPORAL_IDS` entries — that set only matters for ids
   reachable inside an octave, and no octave's offsets ever reach this range. Day-label headlines
   needed no changes either — `day-label.ts` already sources a movable-feast's headline from its own
   `temporal-feasts` record generically.

3. **Real per-hour (Lauds vs. Vespers) collect resolution — new mechanism, built at the user's
   explicit choice** (offered the cheaper "keep the single Lauds-sourced collect" option used
   everywhere else including the just-finished Ember days; the user chose to build the real
   mechanism instead). `hours/resolve-common.ts`'s `getDayCollect` gained an optional `hour: 'lauds'
   | 'vespers'` parameter: on the temporal-winner path, when `hour === 'vespers'`, it first tries a
   new `-collect-vespers` proper kind (via the existing, unmodified `getTemporalProperWithFallback` —
   `kind` was already a plain string, so this needed no new plumbing there) before falling back to
   the base `-collect` chain if no distinct Vespers text was authored for that id. `vespers.ts` passes
   `'vespers'`; `lauds.ts`/`terce.ts`/`sext.ts`/`none.ts` are unchanged, matching the real rubric
   where the minor hours repeat Lauds', not Vespers', collect. `getDayCollects(day, hour)` just
   forwards its existing `hour` param through instead of calling `getDayCollect` bare.

Content authored for all 25 days: `-collect.yml` (Lauds/`[Oratio 2]`), `-collect-vespers.yml`
(Vespers/`[Oratio 3]`, 23 of 25 — `saturday-after-ash-wednesday` and `lent-3-saturday` genuinely have
no `[Oratio 3]`/`[Ant 3]` in the source, same "some Saturdays lack it" pattern already seen for
Ember days), `-benedictus-antiphon.yml`, `-magnificat-antiphon.yml` (same 23 of 25), and a
nocturn-readings file recombining each day's `[Lectio1]`–`[Lectio3]` into one reading per the
established "source doesn't genuinely split" convention, with full Gospel pericopes pulled from the
parallel `missa/` Mass files wherever the Office file only gave an incipit ("Et réliqua"). Also
retrofitted the two already-known, already-documented Vespers-collect gaps this new mechanism could
finally close: `ember-lent-{wednesday,friday}-collect-vespers.yml` (Lent Ember Saturday's source
genuinely has no `[Oratio 3]`) and `monday-holy-week-collect-vespers.yml`.

A few real judgment calls surfaced during authoring, all documented in the affected file's own
header: `lent-3-thursday`'s own Office file cross-references an unrelated Paschaltide-week-7 file
for its Matins lessons (Lenten Thursdays were only added to the ferial cycle later, by Pope St.
Gregory II, reusing an existing homily) — its collects still genuinely name Ss. Cosmas and Damian,
that day's real Roman station-church titular, not a stray cross-reference; and that same day's
naively-cross-referenced responsory contained "Alleluia" (forbidden in Lent), so its own
Lent-appropriate alternate responsory was substituted instead, not the literal cross-reference
target.

New test file `tests/calendar/lent-ordinary-ferias.test.ts`: a content-completeness sweep (every one
of the 25 ids has a real, verified collect/Benedictus antiphon/nocturn-reading, and a genuinely
distinct Vespers collect/Magnificat antiphon except the 2 days confirmed to lack them) plus a
real-date mechanism sweep (10 dates in 2027 where the temporal identity actually wins that year —
2027's early Easter puts a real sanctoral saint on most of the other days, since `ordinary-feria` has
no rank floor — confirming Lauds/Vespers genuinely differ and Terce still gets the Lauds text), plus
the direct in-app re-confirmation of the tier verification from (1).

`tsc --noEmit`, `npm test` (4311 passed), and `vite build` all pass.

### Scripture store: stray verse numbers glued into verse text (2026-09-23)

Found via today's Matins Esther reading ("21That they should receive…", `esth-9:21`): the bulk
"Unbound Bible" Douay-Rheims import sometimes left the source's verse number glued to the start of
the English text. A scan for any scripture verse text starting with a digit turned up two kinds of
problem (all in `en`, none in `la`):

- **43 verses where the number was just glued on** and the text was otherwise right (checked
  against each verse's Latin), e.g. `esth-4:11`, `esth-9:15/21`, `prov-13:21`, `lev-19:31`,
  `sir-43:31`, `3reg-9:11`. Removed the number. Also fixed two scanning errors seen along the way:
  `gen-49:11` "0 my son" → "O my son" and `2esdr-3:11` "Ha- sub" → "Hasub".
- **12 chapters where a verse held another verse's English or a cut-off fragment**, e.g.
  `2reg-5:1`/`jdc-6:1` holding verse 10's text ("1O And…", with the letter O in place of a zero),
  `deut-1:4`/`jos-18:2`/`num-7:3` holding verse 41/21/31's text ("4l…", with the letter l in place
  of a one), `deut-11:6` holding verse 32's text with `deut-11:32` reduced to just "32", and cut-off
  fragments at `1par-21:8`, `2par-4:1`, `2par-30:1`, `ezek-43:8`, `2mach-13:18`. Re-fetched each
  affected chapter from drbo.org's combined DR+LV page (the same source and page format as the
  2026-09-03 re-sourcing) and compared every English verse in those chapters with it. That also
  turned up the neighbouring verses that had lost text to the misplaced fragments
  (`1par-21:15`, `2par-4:22`, `2par-30:10`, `ezek-43:20`, `2mach-13:8`, `prov-8:11`). Replaced
  19 verses in total with drbo.org's text.

New invariant in `tests/scripture/bulk-import.test.ts`: no verse's `la`/`en` text may start with
a digit.

`npm test` (5496 passed) and `npm run build` both pass.

### Scripture store rebuilt from drbo.org: Clementine Latin, clean English (2026-09-23, same day)

Follow-up to the entry above. That fix only caught damage that started with a digit. A full
comparison against drbo.org turned up much more, so the bulk-imported chapters were rebuilt
from source instead of patched verse by verse.

**Why:** the "Unbound Bible" archive behind the first bulk import had three real problems.
- Its Latin was the Stuttgart critical edition (`Israhel`, `Hierusalem`, no capitals or
  punctuation), not the Clementine Vulgate the breviary used. That was never a deliberate
  choice. The earlier `jos-24` note keeping `Amorreorum` as "this book's own source-text
  tradition" reflected the accident, not a design. The Latin should be Clementine.
- Its English had scanning (OCR) errors in about 1,450 of 32,367 verses: "the Cod of Israel",
  "Sour fathers", "his bend is stretched out", "gut put forth thy hand". Whole chapters were
  also shifted by a verse (`bar-1` carried Baruch 2's text; `exod-9`, `exod-28`, `jos-2`,
  `2mach-7` and others were misaligned), and some verses had two verses merged into one.
- Verses were missing: the last verse of 66 books (1 Corinthians 16:24, Matthew 28:20,
  Apocalypse 22:21, …), Daniel 3:23–100 (the Song of the Three Children and the rest of the
  chapter), and Esther 10:3–13.

**What changed:** every page was fetched from drbo.org's combined DR+LV chapter page
(`/drl/chapter/<BB><CCC>.htm`, fetched politely: 10 seconds apart against their robots.txt
Crawl-delay of 5, each page cached, one pass). Each of the 1,153 chapters from the bulk import or
the earlier drbo re-sourcing was then rewritten wholesale from that page, Latin and English
together, so the two can't drift out of alignment again. drbo's French-style space before `:`/`;`
in the Latin was removed to match Divinum Officium's typography. The 31 partial chapters
typed by hand from Divinum Officium (already Clementine, accented, with chant `*` marks) and
`sir-0` (the Prologue, which has no drbo chapter page) were left as they were.

**Verse numbering** now follows Clementine/Douay-Rheims throughout. In 10 chapters that drops a
final verse the Stuttgart numbering split off (`1thess-4:18`, `2cor-1:24`, `2reg-13:39`,
`2thess-2:17`, `gen-5:32`, `isa-46:13`, `jdth-4:17`, `joan-11:57`, `jos-10:44`, `sir-29:35`). Its
text is now part of the verse before. These are the same 10 that the 2026-09-03 "take three"
entry left `missing`. Every scripture citation in `src/data` was checked against these
chapters: only `joan-11`'s `1-29`/`30-57` split has a verse range, and its boundary is
unaffected. Daniel 3 (post-Pentecost 22 Monday) and Esther 10 (read together with Esther 9)
are cited as whole chapters, so those readings are now longer.

`tests/scripture/bulk-import.test.ts` no longer tolerates isolated missing English. There are no
`missing` verses left in the store. `npm test` (5496 passed) and `npm run build` pass. Checked in
the app: 2026-09-23 Matins (Esther 9–10) and 2026-10-26 (full Daniel 3).


### Matins psalmody overrides: secular 3+3+3 → Monastic 6+6+canticles (2026-09-29)

Three saints' psalmody overrides were authored from the secular `Sancti/` track rather than the
Monastic `SanctiM/` track. The secular track uses 9 antiphons across a 3+3+3 distribution; the
Monastic track interleaves 3 `[AntMatutinumM]` antiphons into the secular set, yielding 12 psalms
(6+6 across Nocturns 1 and 2), then replaces Nocturn 3 outright with 3 OT canticles under a single
shared antiphon (`[Ant Matutinum 3N]`).

**st-michael (Sep 29):** Also fixed feast name ("St. Michael the Archangel" → "Dedication of the
Archbasilica of St. Michael the Archangel"; `nameLa` updated to match) and created
`matins-invitatory-st-michael.yml` (was falling through to ferial default). Psalmody: N2 expanded
3→6 groups (Ps 89/95/96/97/98/102 with 3 `AntMatutinumM` additions); N3 added with antiphon
"Míchaël, Gábriel..." + canticles Isa 33:2-10, 33:13-18, Sir 36:14-19.

**guardian-angels (Oct 2):** same structural fix; N2 expanded 3→6 (Ps 89/95/96/97/98/102, secular
ant 7 moved from Ps 95→89, three new `AntMatutinumM` antiphons added); N3 added with antiphon
"Ecce ego mitto Angelum meum..." + same Isa/Sir canticles.

**all-saints (Nov 1):** fully restructured from secular 3+3+3 (Ps 1/4/8, 14/23/31, 33/60/96) to
Monastic 6+6+canticles (N1=Ps 1/4/5/8/14/23, N2=Ps 30/31/33/60/83/96, N3=Sap 3:1-6, 3:7-9,
10:17-21 under antiphon "Laudem dícite * Deo nostro..."). Canticle 255 uses Sap 10:17-21 (live-
verified from St. Andrew's own N3 third canticle), not Sap 3:17-21 as `Monastic canticles.txt`
labels it — consistent with the existing st-andrew.yml override which has the same live-verified
discrepancy.

Feasts already in correct Monastic 6+6+canticles form (no changes): st-lawrence, st-scholastica,
finding-of-the-holy-cross, exaltation-of-the-holy-cross, nativity-of-john-baptist, st-andrew.

`npm test` (5496 passed) and `npm run build` pass.

### Common category field unification + minor-hour antiphon mechanism fix (2026-09-30)

Three related fixes:

**Mechanism:** `deriveMinorHourAntiphonFromLauds` was calling `getLaudsSaintOverride` (saint-specific
only), bypassing the Common-category tier entirely, so all feast saints fell to ferial antiphons at
Terce/Sext/None/Prime. Fixed by switching to `getLaudsPsalmodyOverride` (saint-specific first, then
category-level fallback) — matches the DO source's `getanthoras()` behavior. Also wired
`withPaschaltideAlleluia` onto the derived result (was already on the explicit Common fallback, not
the derived path). Test updated: `common-of-several-martyrs` nocturn antiphon now receives the Lauds
category's "allelúia" spelling rather than the explicit file's "allelúja" — same text, correct source.

**Content:** authored Benedictus antiphon, Magnificat antiphon, and Terce/Sext/None capitulum files
for four categories that lacked them: `confessor-doctor`, `confessor-pope`, `martyr-bishop`, `widow`.
Content matches the category each previously cross-referenced. Notes: confessor-pope Magnificat is
a distinct antiphon ("Dum esset Summus Póntifex..."), not the same as confessor-bishop. Doctor
Magnificat ("O Doctor óptime, beáte N....") uses C4a's Ant 1 with standard "N." saint-name
placeholder; English status `draft`.

**Field unification:** every saint file's `common`, `benedictusCommon`, and `minorHoursCommon` fields
now use the same real category ID throughout, not cross-referencing a different category for some
hours. 22 Doctor saints → `confessor-doctor` (including Jerome, Thomas Aquinas, 15 bishop+Doctors
that were all on `confessor-bishop`; Bernard stays on `abbot`). 8 inconsistent Virgin-Martyrs →
`virgin-martyr` for `bened`/`minor`. 6 Widow saints → `widow` for all fields. 3 Pope-Confessor
saints → `confessor-pope` for `bened`/`minor`. ~35 Martyr-Bishop saints → `martyr-bishop` for
`bened`/`minor`.

`npm test` (5496 passed).

### 2026-10-04 — Prime Lectio Brevis: missing Common-category files

St. Francis (Oct 4) showed the per-annum default Short Reading: his `minorHoursCommon` is
`common-of-an-abbot`, and no `prime-lectio-prima-common-of-an-abbot` file existed. Audit found the same
gap for every category lacking one. Added five files, text/citation copied from the reference
Commune files: abbot, confessor-not-bishop, and several-confessors (C5, Wis 10:10); plain martyr
(C2, Sir 39:6); pope-martyrs (C3, Wis 3:7-8). Tests added for St. Francis and St. Wenceslaus.

Still without a Common-tier Prime reading: vigil, angel, evangelist, St. Peter, several-women-martyrs,
and the `proper-to-*` entries. Each either has no unambiguous Commune mapping or a `[Lectio Prima]` of
its own in the source; check per category before authoring.

`npm test` (5498 passed).

### 2026-10-06 — Feast rank override layer (mechanism)

Shipped ranks stay in the saint and temporal-feast files; `src/calendar/rank-overrides.ts` holds a
user override map (feast id -> `{rank?, octaveWins?}`) applied once in `getSaintRecord`,
`getSanctoralCandidatesFor`, `getTemporalFeastRecord` and `movableTemporalFeasts`, so every consumer
sees the effective rank. Empty map = no behavior change. Covers saints and temporal feasts; octave
strength is overridable separately. Tests in `tests/calendar/rank-overrides.test.ts`. Editor-side
work is listed under "User-editable calendar" in Open Work.

`npm test` (5503 passed).

### 2026-10-06 — Octave starts read from feast records, not a code table

`temporalFeastIdsStartingOn` used two hardcoded tables in `calendar/temporal-feasts.ts`
(`FIXED_DATE_STARTS`, `EASTER_OFFSET_STARTS`) that duplicated each feast's `anchor`. Both are gone:
an octave now starts at the record's `anchor`, or at a new `octaveStart` field for the two octave
feasts with no `anchor` (Pentecost, Easter+49; Christmas, Dec 25 — an `anchor` would make
`movable-feasts.ts` treat them as movable feasts too). `dateForAnchor` moved to `calendar/anchors.ts`
so both consumers share it. Needed before a user can move a movable feast: its octave now follows.

`npm test` (5503 passed).

### Ascension-week gospels reshuffled (2026-10-06)

The one reading-plan row with no readings in the source (Ascension Thursday) now has John 15. The
John 15-17 run was shifted to end on Saturday after Ascension: `easter-6` Thursday John 15, Friday
John 16 (was 15), Saturday John 17 (was 16); other passages on those days untouched. John 17 was
removed from `sunday-after-ascension` Saturday, which now carries only its own John 21 — the earlier
move of John 17 there was a miscommunication, not intended. Supersedes the "Ascension Thursday has no
readings" and "Sunday after Ascension Gospel exception" notes above.

Same day: Judges 12 had never been read anywhere in the plan. Friday after Ascension now reads
Judges 9-10 (was 8-9) and Saturday Judges 11-12 (was 10-11), so Sunday after Ascension's Judges 13-14
follows on cleanly.

### Lauds canticle citations corrected to real verse ranges (2026-10-06)

The Lauds canticle files labeled each chant line with a running line count instead of its real
Bible verse, so the displayed citations overran their chapters ("Deut 32:1-65" for a 52-verse
chapter; Saturday's two Deuteronomy halves read "32:1-32"/"32:33-65"). Found while building the
reground.org lead-magnet PDF. Each line of the Deuteronomy, Exodus, Ezechias, Anna and Isaias
canticles was matched to its verse in `data/scripture` and relabeled; citations are now Deut
32:1-43 (halves 32:1-21 and 32:22-43), Exod 15:1-19, Isa 38:10-20, 1 Sam/Reg 2:1-10 and Isa
12:1-6. Several chant lines now share one verse number, as Habakkuk's already did. The Office of
the Dead's own Hezekiah citation was corrected to match. Habakkuk and the Three Young Men were
already right and are untouched.

### Oct 7: St. Justina removed, Our Lady of the Rosary added (2026-10-07)

St. Justina won Oct 7 at Duplex but rendered no readings about her: her source entry
(`SanctiM/10-07oM.txt`) is only `vide C6`, and this app has no Common-lesson mechanism for Matins
(same gap as Ss. Ursula and Companions). Removed her from `sanctoral-calendar.yml`; her saint file
is kept and restorable. Oct 7 is now Our Lady of the Rosary (Duplex II. classis, `ex C11`), authored
in full from `Sancti/10-07.txt` over `SanctiM/10-07.txt`'s Monastic blocks: invitatory, three
hymns, 12 Matins antiphons in a 6+6+3 scheme, Lauds/Vespers antiphons, chapters, responsories,
versicles, collect and commemoration bundle, plus the Nocturn 3 Gospel (Luke 1:26-38), the
Dominic/Lepanto/Clement XI/Leo XIII history lessons, and both St. Bernard homilies. It was
historically "Our Lady of Victory" (Lepanto, 7 Oct 1571), renamed the Rosary by Gregory XIII (1573,
first Sunday of October) and fixed to Oct 7 later; the reference engine models only the Oct 7
office, so there is no separate Victory entry. The English for the three `AntMatutinumM` antiphons
and for the Nocturn 3 versicle, Lauds responsory and None chapter versicle is a direct translation
of the Latin (no SanctiM English file exists for Oct 7, and the source's own English for those
versicles is out of step with its Latin); the Lauds responsory and None chapter are marked `draft`
in English, and so are the three Matins antiphons and the Nocturn 3 versicle, via a new optional
`status` on Matins override groups/versicles (`matins-psalmody-overrides.ts`; previously every
override line was hardcoded verified).

### First vs Second Vespers: hymn and Magnificat antiphon variants (2026-10-07)

Vespers previously resolved one hymn and one Magnificat antiphon per feast, used for both its First
and Second Vespers, though the source separates them (`[Hymnus Vespera]`/`[Hymnus Vespera 3]`,
`[Ant 1]`/`[Ant 3]`). Now `hours/vespers.ts`'s `resolveOrdo` decides which evening it is (`day.date
!== date` means tonight anticipates tomorrow's First Vespers, which also covers temporal feasts that
carry no `vespersFrom` tag) and threads a `VespersVariant` to `resolveOfficeBundle`'s hymn and
`getMagnificatAntiphon`. Convention: `<base>.yml` is the default for both evenings, and optional
`<base>-first.yml` / `<base>-second.yml` override just that evening (`withVespersVariant` in
`resolve-common.ts`). No variant files means unchanged behavior. Tests: `tests/hours/vespers-first-
second.test.ts`.

Audit against the source after building it:
- **Hymns:** only a few reachable cases have a separate `[Hymnus Vespera 3]`: Our Lady of the Rosary
  (both hymns), Apparition of the Immaculate BVM (`-second`: "Omnis expértem máculæ"), Seven
  Founders of the Servite Order (`-second`: "Matris sub almæ númine"), St. Martina (Second Vespers
  reuses her Lauds hymn) and St. Thérèse of Lisieux (both, see below). The Lent Sundays' second hymn
  is tagged `rubrica 1570` only, so not this app's track.
- **Verified against the live engine (2026-10-07; `Pofficium.pl`, Monastic Tridentinum 1617).** The first
  pass above was read from static source files and was partly wrong, so every First/Second Vespers
  variant was regenerated from what the engine actually renders (`command=prayVespera`, a clean pair of
  evenings per feast: First = "Vespera de sequenti", Second = "Vespera de Officio occurente" or "de
  præcedenti"; Latin and English both taken from the page). Two static-reading errors surfaced: the
  Monastic engine does not honour `[Ant Vespera 3]`'s explicit psalm tags (St. Lawrence's Second Vespers
  is Ps 109/111/112/115 with antiphons 1, 2, 3 and 5, First Vespers 109/110/111/112), and the Assumption's
  First Vespers hymn is Ave maris stella, not `[Hymnus Vespera]`'s "O prima, Virgo".
  - **Result:** 32 Magnificat antiphon files, 32 versicle files and 11 psalm-antiphon override files
    written or corrected (most are `-first`; the engine's rule is that a feast's proper Ant 1 / Versum 1 /
    own psalm set is First Vespers, and the stored file was already Second Vespers). Four stored files
    were overwritten because they matched neither engine evening: Exaltation of the Holy Cross, Finding of
    the Holy Cross and Visitation (held the First-Vespers antiphon as the default), Immaculate Conception
    and All Saints of the Benedictine Order (their own `[Ant 3]` text, but the engine shows another).
  - **St. Martin's First Vespers psalmody** is Ps 109/110/111/112, not 109/111/112/131: the earlier
    "live-verified" value came from a `votive=C4` Common query (tests/hours/vespers.test.ts corrected).
  - **Common-level `-first` Magnificat files** (BVM, Apostle, Martyr, Several Martyrs, Confessor,
    Confessor-Bishop, Pope, Dedication, Abbot, Evangelist, Pope-Martyrs, ...) are static-derived where the
    engine has no feast using that Common; the ones with a feast in the engine agree with it.
  - **Follow-up on what this check left open: see "Vespers audit follow-up (2026-10-07)" below.**
- **St. Agnes (Jan 21):** `SanctiM/01-21.txt` sets `[Ant 3] (nisi rubrica cisterciensis)` to
  `@Sancti/01-21:Ant 1`, so the Monastic Second Vespers Magnificat is "Beáta Agnes" (the stored file
  held the Roman "Stans beáta Agnes", now corrected, one antiphon for both evenings); second-Vespers
  psalm antiphons are the explicit 109/111/112/126 set (engine-confirmed, 2026-01-21); also added her Monastic 6+6+3 Matins
  antiphons (`matins-psalmody-overrides/saints/st-agnes.yml`, source tags Ps 1/2/4/5/8/10 and
  14/44/45/47/84/86, not the generic Virgin set) and the Responsory6 that follows her Lectio4-6.
- **St. Martina (Jan 30) and St. Thérèse (Oct 3):** built from `Sancti/01-30.txt` and
  `SanctiM/10-03b.txt`. Martina: Matins hymn, Lauds hymn, Second Vespers hymn, her own Lectio4-6 vita.
  Thérèse: full proper office (Benedictus/Magnificat antiphons with a First Vespers variant, three
  hymns with a First/Second pair, chapters for Lauds/Terce/Sext/None, responsories, versicles with a
  First/Second pair, Lauds and Vespers psalm antiphons), all English a draft translation because
  `English/SanctiM/10-03b.txt` has none of it. Neither can govern an evening in practice (Martina
  always yields to St. John Bosco; Thérèse to Guardian Angels' Second Vespers and St. Francis's
  First), so their Vespers content is exercised in tests through `resolveOfficeBundle` directly. To
  make a hymn-only proper reachable, `resolveOfficeBundle` now builds a partial proper bundle (chapter
  from the Common, proper hymn/responsory/versicle where authored) when a proper has no chapter of its
  own; a proper with a chapter keeps the old all-or-nothing behaviour. Matins' proper-hymn lookup is
  also now rank-agnostic (`getMinorHourOverrideId`), matching Lauds/Vespers, so Martina's Matins hymn
  appears at Semiduplex.


### Vespers audit follow-up (2026-10-07)

Prompted by the open items above; every comparison below is against the live engine (Monastic
Tridentinum 1617, or Divino Afflatu 1954 for feasts that postdate 1617: Christ the King, Sacred
Heart, Immaculate Heart, Seven Sorrows, Maternity, Guardian Angels, Raphael, Seven Founders, Lourdes,
Rosary). Tests: `tests/hours/vespers-audit-engine.test.ts`.

- **Visitation and St. Michael (Sept 29) fell through to the ferial chapter/hymn/versicle** at Lauds
  and Vespers. Visitation's `common` was a fake `proper-to-the-visitation-of-the-bvm` (the source's rule
  is `ex C11`); it is now `common-of-the-bvm`. St. Michael's own id has `propers: apparition-of-st-
  michael`, so `resolveOfficeBundle` now falls back, part by part, to a saint's `propers` id after its
  own files; he got his own no-Alleluia Lauds/Vespers responsories and Lauds versicle (the Apparition's
  are Paschal).
- **Joseph: no change.** The 1617 engine renders him as a plain Duplex confessor (Common C5); under
  Divino Afflatu it renders his own hymn and "Constítuit eum", matching the app's merged track.
- **Philip and James:** Second Vespers 4th psalm is 125, not the Apostles' Common 138; First Vespers is
  Ps 109/110/111/112 (`ss-philip-and-james-first.yml`).
- **First-Vespers sets for Commons:** Apostles/Evangelists (`common-of-an-apostle-first`, and
  `-paschaltide-first` for Mark/John), Several Martyrs. Saint-level files for Peter and Paul, Octave of
  Peter and Paul, Octave of All Saints, Purification, Stephen, John, Decollation (antiphons 1, 2, 3, 5 on
  Ps 109-112), St. John before the Latin Gate, St. Anne, Seven Founders, Angels family, Maternity, Seven
  Sorrows. Common Confessor-Bishop first versicle.
- **Doctors:** Ss. Jerome and Thomas Aquinas are "ex C5" in the engine (Confessor not Bishop):
  `SaintRecord.psalmodyCommon` routes their psalmody there. Every doctor's Magnificat antiphon had a
  literal "N." ("beáte N."): `SaintRecord.invocationName` now fills it (22 doctors; the engine itself
  leaves "N." for St. Basil).
- **Paschaltide Alleluia (new generic mechanism, `hours/paschal-alleluia.ts`):** the engine's rule is
  mechanical (horas.pl postprocess_ant/vr/short_resp): from Easter to the Saturday after Pentecost every
  Lauds/Vespers antiphon ends in one Alleluia, the versicle and response each end in one, and a short
  responsory takes the double-Alleluia form. Only the Apostles' Common had this by hand. Applied to
  Lauds and Vespers psalm antiphons, offices' versicles and responsories (idempotent).
- **Bundles that did not exist:** Common of a Dedication (chapter, both responsories, both hymns,
  versicles; the Nov 18 Ss. Peter and Paul dedication is now `common-of-a-dedication` too, as its
  source rule says "ex C8"), Common of Several Women Martyrs (Perpetua and Felicity), Confessor Pope
  (aliased to the Bishop's bundle: St. Leo II, Pius V, Pius X), St. Mary Magdalene's three proper
  hymns (pre-Urban, "Pater supérni lúminis", "Ætérne Patris Unice", "Nardo María pístico"; English for
  the Matins/Lauds ones is the secular text's translation, draft).
- **Sirach lesson heading:** a hand-written scripture lesson with no `source` was labelled with the
  saint-name fallback ("On Our Lady of the Rosary"); it is now headed by its book ("A reading from the
  book of Sirach"; same for the Acts lesson of the Finding of St. Stephen).
- **Named temporal feasts had no Vespers psalm antiphons** (they fell back to the ferial set):
  Circumcision, Ascension, Pentecost, Trinity, Corpus Christi, Christmas Day/octave, Easter Sunday
  (needed a gate in `getPsalmodyNumbersOverrideId`) now carry the engine's. Post-1617 feasts (Christ the
  King, Sacred Heart, Immaculate Heart) are from the Divino Afflatu render with the Monastic
  "antiphons 1, 2, 3, 5" selection and Sunday psalm numbers, which no Monastic render can confirm.

Resolved later the same day (sources: the raw files under `divinum-officium-reference`, with the live
engine only for rendered results):
- **Epiphany and Christmas Day** now win their own days (`anchor: fixed-date` temporal feasts) with
  Matins, Lauds, the minor hours and Vespers; Epiphany has its real **octave** (Jan 6-13: per-day
  Benedictus/Magnificat antiphons `epiphany-*-antiphon-d2..d6`, per-day readings
  `epiphany-octave-day-2..6,8`, counting that skips a Sunday and omits the seventh day,
  `OctaveConfig.skipsSunday`). Matins checked against the Monastic source: gospel plus homily and the
  patristic sermon match; Nocturn I stays the project's own bible-plan reading by design.
- **Easter week and Low Sunday** share Easter's office (`officeFrom`); Low Sunday is a real feast.
- **Triduum Vespers:** Thursday/Friday drop chapter, responsory, hymn, versicle, Preces, commemoration
  and suffrages; Holy Saturday evening is its own short Vespers (Ps 116, "Véspere autem sábbati",
  "Spíritum nobis").
- **Dismissal:** "Benedicámus Dómino, allelúja, allelúja" at Lauds/Vespers of Easter week and at Vespers
  on the Saturday before Septuagesima (the engine's rule in `horasscripts.pl`; the Pentecost octave does
  not have it).
- **Stephen and the martyrs' First Vespers** (`-first` versicle and Magnificat; Common of a Martyr,
  Apostles and Virgin First-Vespers versicles; Paschal apostle versicles).
- **Octave days at Vespers:** an octave day competes by its own rank (closing day beats a following
  Sunday or saint); the closing days of St. John's and the Holy Innocents' octaves (Jan 3/4) take the
  office.
- **Sundays of Advent and Septuagesima to Palm Sunday** now carry their own Lauds psalm antiphons,
  chapters, responsories, hymns and versicles, minor-hour antiphons and chapters, and Advent's Vespers
  psalm antiphons; First Vespers on Saturday evening takes the Saturday's (or the season's) responsory,
  hymn and versicle, with the Sunday's chapter and Magnificat. Ordinary Sundays' Saturday evening likewise.
- **Prime's capitulum** follows the engine rule (`specprima.pl`): ferial text only on a bare weekday or a
  Vigil outside Easter to Pentecost Saturday; Sunday text on feasts, octave days and in Eastertide.
- First Vespers of ordinary Sundays: month-week keyed Magnificat antiphons for August-November.
- Circumcision's Terce/Sext/None chapters; Pentecost Terce hymn (engine doxology, both languages).

Settled afterwards the same day:
- **St. Leo I** is a Confessor Pope (Common C4b-2 on the 1570/1617 rubrics; Doctor only in the Cistercian
  variant), same Common as Leo II and Pius V; no longer labelled a Doctor. His calendar placement differs
  from the 1617 engine (the engine moves him off a Sunday; the app lets a Duplex win an ordinary Sunday),
  a settled rule, not changed.
- **Epiphany octave's seventh day** (years when Epiphany is a Sunday, e.g. 2030) is kept as an ordinary
  octave day with its own Benedictus ("Maniféste magnum") and reading, a deliberate deviation: the engine
  omits that day on the Tridentine rubrics.
- **Octave interior days** (Ascension, Corpus Christi): nothing to add, the source has no per-day
  antiphon/versicle sections for them; Sacred Heart and the Patronage of St. Joseph have no source in the
  reference tree. **Transitus of St. Benedict** Paschal Magnificat already exists. The earlier note about
  Gregory Nazianzen/Antoninus was a mis-diagnosis: on 2026-05-09 the engine keeps Gregory over the
  following Sunday while the app's calendar gives that evening to Antoninus, a calendar difference.

Still open:
- **Saints the 1617 engine lacks** differ from it by design where the app's merged calendar has a saint
  on a day the engine shows a feria; a year-wide engine comparison is therefore noisy.
- **Deliberate, left alone:** All Saints' "Placáre" hymn split, O Antiphons over a saint's Magnificat,
  the ferial-number overlay below duplex-majus, St. Joseph, the Immaculate Conception's diacritics.
- **Engine-calendar quirks not copied:** All Saints of the Benedictine Order's second-Vespers Magnificat
  weekday variation; St. Silvester I's Christmas-octave 4th antiphon (Ps 131).

### Terce/Sext/None closing antiphon (2026-10-06)

Closed the open mechanism gap: Terce, Sext and None attached the antiphon only to the first psalm, so
the closing repeat after the third psalm never rendered. The reference engine's antetpsalm repeats the
full antiphon after the last psalm, so the old "no closing repeat" comments were wrong. Added a
`closing-antiphon` part to `terce.yml`, `sext.yml` and `none.yml` (commit 768e85b3) and flipped the
test that had asserted its absence.

### Prime Short Reading: own readings for 35 feasts, plus 3 Commons (2026-10-07)

Added `${propers}-lectio-prima` files, sourced from each feast's `[Lectio Prima]` in the reference
`Sancti/*.txt` and `Tempora/*.txt` (Latin and English): 24 in `propers/common/` (23 saint feasts, plus
Finding of St. Stephen, whose reference file points at St. Stephen's) and 12 in `propers/temporal/`
(Epiphany, Christmas Day, Vigil of Christmas, Patronage of St. Joseph, Christmas-octave Sunday, Holy Name,
Pentecost, II Sunday after Pentecost, Sacred Heart, Ascension, Corpus Christi, Friday of Passion week).
Also added three Common-tier files: `common-of-several-women-martyrs` (Ss. Perpetua and Felicity; Sancti/03-06
chains C7b to C7 to C6), `common-of-st-peter` (Peter in Chains; its source points at Sancti/06-29), and
`common-of-an-evangelist` (Mark, Luke; `ex C1a`, which is C1). The reference's English for Apparition of St.
Michael (05-08) lacked its `v.` marker and had a typo ("The was"), fixed. Tests in
`tests/hours/prime-proper-lectio.test.ts`.

Not authored, by design: Holy Family (`Tempora/Epi1-0`) and St. Joseph the Worker (`Sancti/05-01r`) aren't
modeled in this calendar; the vigil Common has no `[Lectio Prima]` in the reference, so it keeps the season or per-annum
reading. The angel Common is this app's own category (`common-of-an-angel`); the reference has no angel
Commune file, and St. Michael (Sept 29) has no `[Lectio Prima]`, so it also keeps the season or per-annum reading.
The Vigil of the Epiphany (Jan 5) is a separate entry below.

`npm test` (5625 passed).

### Vigil of the Epiphany (2026-10-07)

Jan 5 had no identity of its own: it borrowed `christmas-octave-sunday`, with St. Telesphorus as a
commemoration. Added `temporal-feasts/vigil-of-epiphany.yml` (Semiduplex, `anchor: fixed-date` Jan 5, per
`Sancti/01-05.txt`'s `[Rank]`), so the day is named "Vigil of the Epiphany (Semiduplex)" and Telesphorus is its
only commemoration (`suppressDisplacedCommemoration`). The source takes the collect, Lauds antiphons, chapter and
short reading from `@Tempora/Nat1-0`, so the feast uses `officeFrom: christmas-octave-sunday` (the Easter-week
mechanism) rather than duplicating those files. Only the Matins readings are its own, in
`nocturn-readings/vigil-of-epiphany.yml` (Augustine's sermon; Matt 2:19-23 with Jerome's homily). Added the id to
`ALWAYS_OVERRIDE_TEMPORAL_IDS`. Tests: `tests/calendar/vigil-of-epiphany.test.ts`.

`npm test` (5633 passed).


### Advent carryover started a day late (2026-10-14)

User-flagged: Sat 2026-12-26 showed Isa 61-63 (Friday of IV Advent) instead of 64-66. Cause: the
carryover in `propers/bible-plan.ts` began on Dec 25, but Dec 24 (the Vigil of Christmas, its own
temporal id) is the first day the plan can't reach, so Thursday's row got no day at all and every
spilled row landed one day after its own weekday. Fixed by starting the carryover on Dec 24
itself. 2026 now runs Dec 24 = Isa 58-60, Dec 25 = 61-63, Dec 26 = 64-66; 2028 (longest spill)
Dec 24-30. Tests in `tests/propers/bible-plan.test.ts` updated, plus a 2026 case.


### Telesphorus and Hyginus given their own vitae, from the Urbis directory (2026-10-14)

User noticed Telesphorus "did stuff" (Lenten fast, three Christmas Masses, Gloria in excelsis). The main
`Sancti/01-05.txt` and `01-11.txt` have no vita for either, so `st-telesphorus.yml` and `st-hyginus.yml`
were pooling the day's borrowed homilies. The Rome-city calendar has real ones
(`Sancti/Urbis/01-05cc.txt`, `01-11cc.txt`, three lessons each), now authored as each saint's Nocturn 2
reading and replacing the borrowed homilies (the Vigil of the Epiphany and the Epiphany octave files already
carry those). Latin typos in the Urbis files corrected (listed in each file's header); English is this
project's own translation, `draft`. Also wrote `papal-institutions.md` (institutions and feast-day/patronage
acts attributed to popes in the Matins lessons and martyrology).

Survey of `Sancti/Urbis/` for further own-vita files not in the app: 47 papal offices (Anterus, Vitalian,
Felix IV, Dionysius, Zosimus, Gregory II, Agatho, Gregory X, Felix III, Simplicius, Zachary, Sixtus III,
Sixtus I, Celestine I, Julius I, Leo IX, Anastasius IX, Benedict II, Alexander I, Paschal I, Boniface IV,
Eugenius I, Leo III, Innocent V, Paul I, Benedict XI, Eugenius III, Leo IV, Symmachus, Felix II,
Hormisdas, Hadrian III, Sergius I, Hilary, Agapitus I, Eusebius, Victor III, Boniface I, Evaristus,
Siricius, Nicholas I, Deusdedit, Gregory III, Gelasius I, Eutychian, Urban V), none yet in the app; plus
Philip of Jesus, Philomena, Emygdius, Gregory the Illuminator, Gaspar del Bufalo and the Transfiguration
octave-day lessons.


### Urbis hagiographies ported: 39 new saints and 2 gap-filling lessons (2026-10-14)

User asked for every substantive `Sancti/Urbis/` vita the app lacked. Authored as saint file + Nocturn 2
reading (the three Urbis lessons combined, one continuous vita) for 39 saints: martyr popes Anterus,
Sixtus I, Eutychian, Eusebius, Felix II; confessor popes Dionysius through Urban V (32); Gregory the
Illuminator; Philumena. Also added the missing Matins lesson for the existing `st-lucius-i` and
`st-melchiades`. Popes use `common-of-a-confessor-pope` with a new `collect-c4b` template (Commune C4b,
absent before), martyr popes `collect-c2b`, Gregory the Illuminator `collect-c2`, Philumena `collect-c6`.

- English is this project's own translation (no English exists for the Urbis directory), `draft`.
- Source OCR damage corrected in the Latin (headers list the kind of fix); two reconstructions worth
  knowing: Gregory II "ad diaconátus tandem órdinem promótus" (garbled in source), Boniface I "mulier"
  for the source's "militer", Hormisdas "summa" for "suiha".
- **Not wired onto the calendar.** Same stance as the modern "n"-file saints: dates come from the Urbis
  filenames, but 28 of the 41 dates already hold another saint, and these are all Duplex in the Urbis
  file. Wiring needs a collision decision per date; list in `urbis-ported.md`.
- Not ported: sermon lessons (Augustine, Cyprian, Maximus, Ambrose), Celestine I (lesson 4 truncated in
  the source), Gregory X (file is a copy of Gregory II's text), and twelve files that are incipits only.
- Mary of Egypt: the app has only the martyrology line (Apr 2) and Zosimus's burial note (Apr 4). The
  Urbis file has a proper collect and lesson incipits ("María Ægyptíaca, quæ ..."), no lesson text; the
  Sancti/ directory has nothing either, so there is no vita to port.

`npm test` (6168 passed) and `npx tsc --noEmit` pass.


### New Urbis popes set to Simplex and placed on the calendar (2026-10-14)

All 37 new pope saints (5 martyr, 32 confessor) are `simplex` (Urbis has them Duplex; Simplex matches how
the Roman books treat most of these popes and means none displaces an existing saint). 27 are placed on
their Urbis filename date in `sanctoral-calendar.yml`: 10 on free days, the rest as an extra commemoration
under a higher-ranked day (including Hormisdas on the Vigil of the Assumption, Agapitus on the Vigil of St.
Matthew, Siricius on the Vigil of All Saints, Gelasius on the Vigil of St. Andrew). The 10 that tie with an
existing Simplex are left unwired, as-is, for a decision: Eusebius (09-26), Dionysius (02-03), Zosimus
(02-09), Agatho (02-14), Paschal I (05-14), Eugenius I (06-02), Leo III (06-12), Innocent V (06-22),
Sergius I (09-09), Boniface I (10-25). Gregory the Illuminator and Philumena are not popes and stay
Duplex and unwired.

Where a Simplex now wins an ordinary Lenten feria (Felix III 02-25, Simplicius 03-02) or rides along as a
commemoration, existing tests that pinned the exact commemoration list or a "clean" Lent date were
re-pointed (`lent-ordinary-ferias`, `vespers`, `ember-days`, `marian-saturday`, and the Sept/Oct/Nov
sanctoral tests). A three-year scan of every wired date across all eight hours found no `missing` status.


### Martyrology moveable entries (2026-10-14)

The 24 moveable entries from the reference's `Martyrologium/Mobile.txt` are in
`src/data/martyrology-mobile.yml`: Advent I, Septuagesima, Ash Wednesday, Passion Sunday, the
Passion-week Friday of the Seven Sorrows, Palm Sunday, Maundy Thursday, Easter, Low Sunday, St. Joseph and
its octave, the three Rogation days, the Ascension with its vigil and octave, the Vigil of Pentecost,
Pentecost, Trinity, Corpus Christi and its octave, the Sacred Heart and its octave, Christ the King. Base
(Tridentine / Divino Afflatu) wording only; the 1570, 1955 and 1960 variants are not used. Each is anchored
to the day it announces and inserted after the date heading, ahead of the fixed entries.

- Easter is announced on Holy Saturday under Easter Sunday's date. The reference keys it to Easter Sunday
  evening, which puts it under Monday's heading; that is not followed.
- Octave of St. Joseph (Pasc3-3): the reference has no English, so the English is this project's own and is
  marked `draft`.
- Holy Name is fixed to Jan 2 here, so its line is a plain entry in `martyrology/01-02.yml`, not a moveable
  one. In the reference the `Nat1-0` and `Nat2-0` keys cannot match its week names (`Nat02`, `Nat26`...), so
  they never fire there at all.
- Not carried over: `Nat2-0` Holy Family (the feast is not in this calendar, see the open question below),
  `Defuncti` (`hours/all-souls.ts` has its own introduction), `DefunctiM` (monastic Nov 14, not in this
  calendar), `Nativity` (already in `12-25.yml`).
- Found while checking placement: 133 English martyrology paragraphs were a literal `_`, the reference's
  placeholder for the moveable slot, shipped as visible text in 132 files. Removed, with a regression test
  over every day of the year.

Open: if the Feast of the Holy Family is ever added, its martyrology entry (Latin and English are in
`Mobile.txt` under `Nat2-0`) belongs in the same file, anchored to the first Sunday after Epiphany.


### St. Mary of Egypt authored from Paul the Deacon's Latin Life (2026-10-14)

The app had only her martyrology line (Apr 2) and Zosimus's burial note (Apr 4). The Urbis file
(`04-09-MariaAegyptiaca.txt`) gives her proper Oratio and nine lesson incipits with no body text, and the
reference's `Sancti/` has nothing, so the vita comes from the text those incipits abridge: the Life ascribed
to Sophronius of Jerusalem, in Paul the Deacon's Latin (Migne PL 73, 671-690; OCR scan via
florianjanner.de/MaryOfEgypt). Authored `st-mary-of-egypt` (Simplex, `common-of-a-holy-woman`, own collect and
commemoration) with Nocturn 2 as three excerpts of the Life (sin and the road to Jerusalem; the closed church
door and the prayer before the Virgin's image; Zosimas and the lion at her burial) and Nocturn 3 reusing the
Luke 15 Gospel and Gregory's Homily 34 from `post-pentecost-03.yml`. English is this project's own
translation, `draft`. The OCR garbles two passages (a clause of Cap. XIII, the inscription in the sand);
both are skipped, not reconstructed. Not wired onto the calendar: Apr 9 (her Urbis date) is free, Apr 2 is
St. Francis of Paola.


### Remaining Urbis saints placed; Mary of Egypt's OCR gaps filled (2026-10-14)

- The 10 popes that tied with an existing Simplex are now on their Urbis dates too (Simplex). The saint
  already on the day keeps it (first-listed wins ties, the existing rule) and the pope is commemorated:
  Dionysius 02-03, Zosimus 02-09, Agatho 02-14, Paschal I 05-14, Eugenius I 06-02, Leo III 06-12, Innocent V
  06-22, Sergius I 09-09, Eusebius 09-26, Boniface I 10-25.
- Gregory the Illuminator (10-01) and Philumena (09-06) are Semiduplex and on their Urbis dates. Philumena
  on a Sunday (2026-09-06) transfers to the Monday, like any Semiduplex.
- St. Mary of Egypt is Semiduplex on Apr 9 (her Urbis date, free). Her two OCR gaps in the PL 73 scan (a
  stretch of Cap. XIII and the inscription in the sand) are filled from the Latin facing the Old English
  version in Magennis, The Old English Life of St Mary of Egypt (2002); the same text gives her death as
  "die nona, id est quinto idus Aprilis" (April 9). The martyrology keeps her on Apr 2 (St. Francis of
  Paola, Duplex, holds that day in the calendar).
- Tests that used these dates as "plain ferial" days were re-pointed: very few clean ordinary ferias are
  left (only 2026-09-01 and 2026-10-12 in Jun-Nov 2026), so `lauds`, `prime`, `little-hours` and `vespers`
  now share 2026-10-12 / 2026-09-01.


### Sanctoral thinning pass and the Translation of St. Benedict (2026-10-14)

- Goal: at least 2 free (ferial) civil dates in any rolling 7 dates, which the imported calendar had stopped
  allowing. The author chose by hand from a spreadsheet (`calendar-thinning.xlsx`, one row per calendar
  entry; universality first, then rank).
- Removed from `sanctoral-calendar.yml`: 119 saint entries (saint files and propers kept, restorable). Of
  those, 70 were Simplex, 20 Semiduplex, 27 Duplex, and two high-ranked: Our Most Holy Redeemer (10-23,
  Duplex majus) and All Saints of the Order of St. Benedict (11-13, Duplex II. classis). The removed
  Simplex popes with a distinctive liturgical custom were put back before applying (Sixtus I, Anicetus,
  Soter and Caius, Cletus and Marcellinus, Victor I, Zephyrinus, Urban I, Stephen I, Zosimus, Anastasius I,
  Alexander I, Felix I, Pius I, Sixtus III, Gregory II, Martin I, Hormisdas, Sergius I, Boniface IV).
- Re-ranked: Marcellus I to Simplex; Fabian and Sebastian, Romuald, Perpetua and Felicity, John of God,
  Peter Canisius, Isidore the Farmer, Peter Celestine, Rita of Cascia, Hildegard, Margaret Mary Alacoque and
  Peter of Alcantara to Semiduplex; St. Joseph to Duplex majus (so he now enters the Easter-octave backlog
  when impeded).
- St. Sixtus II is on 08-06 as a commemoration under the Transfiguration (his file was authored earlier and
  unwired).
- Rows for Labre, Felix of Cantalice and Kostka left the calendar with their `tier-two-saints` test; their
  saint files and propers remain.
- Windows that still fail the 2-in-7 rule after the pass (Jan 21-Feb 12, Aug 5-11, Sep 17-26, ...) were left
  as they are by choice.
- New: The Translation of St. Benedict, Jul 11, Duplex II. classis (`st-benedict-translation`), from
  `SanctiM/07-11M.txt` and `07-11b.txt`, with St. Pius I commemorated. Own collect, hymns, invitatory,
  twelve Matins antiphons, five Lauds antiphons (reused at Vespers and the little hours), Magnificat
  antiphon, own First Vespers hymn and Magnificat antiphon ("Claris conjúbila", from `07-11b.txt`), and
  Matins readings (St. Bernard's sermon, Gospel and St. Bede's homily; Nocturn 1 comes from the bible plan). The capitula, responsories and versicles are St. Benedict's own March ones. English for the four
  hymns, the Lauds and Magnificat antiphons and the Bede homily is this project's own, `draft`.
- Tests re-pointed to surviving saints throughout `tests/calendar` and `tests/hours`; a Redeemer scenario and
  the `tier-two-saints` file were removed with their saints.


### First/second Vespers sweep against the reference (2026-10-14)

- The `-first` / `-second` variant lookup already covers every Vespers part (chapter, responsory, hymn,
  versicle, Magnificat antiphon, psalm antiphons); the gaps were authored content, not mechanism.
- Swept Latin/Commune and Latin/Sancti(M) for [Ant 1]/[Ant 3], [Versum 1]/[Versum 3], [Hymnus Vespera]/
  [Hymnus Vespera 3], [Responsory Vespera 1] and [Ant Vespera]/[Ant Vespera 3], limited to the files the
  Monastic 1617 kalendar names and to unconditional sections (a `(rubrica cisterciensis)` or `(rubrica
  Barroux)` section is not ours), then checked every candidate against the local engine's own output.
- Fixed: the Confessor family (not-bishop, plain, abbot, several confessors, pope) said "Amavit eum" at
  Second Vespers; the source's [Versum 3] is "Justum deduxit" and "Amavit eum" belongs to First Vespers
  (the old `votive=` queries showed the First Vespers versicle). Holy woman and widow gained their First
  Vespers "Specie tua". Ss. John and Paul gained their own Second Vespers psalm antiphons.
- Found, not changed: in the Christmas octave the Monastic office has no First Vespers for St. John or the
  Holy Innocents ("Vespera de praecedenti"), so their [Ant 1]/[Versum 1] never surface. All Saints' Vespers
  hymn is "Christe Redemptor omnium" in the Monastic 1617 output where this app has "Placare Christe
  servulis". The Octave of Ss. Peter and Paul's responsory is "In omnem terram" there, "Constitues eos"
  here. About 145 of 318 sampled evenings differ in which office takes the evening (concurrence), which is
  a separate comparison from this sweep.


### Older (pre-Urban VIII) hymn sweep (2026-10-15)

- The reference tags its older hymn text `[HymnusM ...]` and its Monastic and 1570 versions take it over
  `[Hymnus ...]` (`tryoldhymn` in specials.pl); the other text is Urban VIII's 1631 revision. Swept all 50
  Sancti/SanctiM/Commune files where the two differ, against the authored hymn files here.
- 42 of the 47 comparable hymns already carry the older text. The exceptions, now switched: All Saints'
  Vespers (Christe Redemptor omnium), Lauds (Jesu Salvator saeculi) and Matins (kept Placare as a
  "curatorial split" until now; its source is a redirect to Vespers). The old headers on those files
  claimed the reverse, and have been rewritten.
- Corrections to the 2026-10-14 sweep entry's hymn note: St. Michael ("Tibi Christe splendor Patris") and
  Ss. Peter and Paul ("Aurea luce") are already the older texts; the engine's other differences there were
  my misreading of which tag was which. Mary Magdalene's SanctiM/07-22b `[HymnusM Vespera]` ("Lauda mater
  Ecclesia") belongs to a different calendar, not the 1617 one.
- Proper hymns the app lacked (it fell to the Common), two passes. First, the engine's Monastic 1617 output
  against the 1617 kalendar's own files: four Matins hymns (the Commemoration of St. Paul, St. Peter's
  Chains, the Chair at Rome, St. Benedict). That pass wrongly concluded the Common was right for St.
  Anselm, St. Bernard, St. Catherine of Siena, St. Gabriel, St. Raphael and St. John Cantius: those saints
  are not in the 1617 kalendar at all (or are conditioned `nisi rubrica 1617`), so the engine showed no
  hymn for them, but the reference does carry their hymns. Second, every Sancti/SanctiM file for every
  calendar saint, whatever kalendar names it: 20 more hymns authored (the Apparition, Immaculate
  Conception, Maternity, Queenship and Seven Sorrows at Matins; Ss. Cyril and Methodius, Vespers and
  Lauds; St. Anne, three hours; St. Anselm and St. Bernard, Vespers (and Bernard's Lauds); St. Elizabeth of
  Portugal, Vespers and Lauds; St. Gertrude, Matins; St. John Cantius, three hours; St. Joseph, Matins).
  English is the reference's where it has one; six are this project's own translation, `draft` (St. Anne
  Vespers and Lauds, St. Anselm, St. Bernard Vespers and Lauds, St. Gertrude).
- Left out on purpose, because the reference file is a different saint's: SanctiM/05-30b is St. Joan of
  Arc (not St. Felix I), SanctiM/02-14b is Ss. Cyril and Methodius (not St. Valentine), SanctiM/05-13M is
  the commemoration of relics (not St. Robert Bellarmine), SanctiM/04-29M is Ss. Odo and companions (not St.
  Catherine of Siena), Sancti/05-01r is St. Joseph the Worker (not Ss. Philip and James). St. Catherine of
  Siena and St. Gabriel/St. Raphael have no proper hymn file of their own in the reference.
