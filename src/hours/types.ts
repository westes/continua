export type HourId =
  | 'prime'
  | 'compline'
  | 'terce'
  | 'sext'
  | 'none'
  | 'lauds'
  | 'vespers'
  | 'matins';

export const HOUR_IDS: readonly HourId[] = [
  'matins',
  'lauds',
  'prime',
  'terce',
  'sext',
  'none',
  'vespers',
  'compline',
];

/** Reference into one of the proper-text stores (data/propers/**). Not built yet — placeholder shape. */
export interface PropersRef {
  source: 'sanctoral' | 'temporal' | 'common';
  id: string;
}

export type HourPart =
  | { kind: 'hymn' | 'chapter' | 'responsory' | 'versicle' | 'prayer'; textRef: PropersRef }
  // A fixed multi-line cluster of versicles/responses/prayers (Preces, the
  // monastic "De Officio Capituli" mini-office, the dead-commemoration
  // responsory/collect) — these don't decompose usefully into individual
  // hymn/chapter/versicle parts, so they're stored and rendered as one block.
  // `label`, when given, is shown as a heading (e.g. "Preces", "Pretiosa") —
  // omitted for parts that are just connective tissue around a reading
  // (a blessing, a closing dialogue) that don't read as their own section.
  // `omitOnDouble` marks a part that's suppressed above a certain rank on
  // real Double-or-higher feasts (see calendar/isDoubleOrHigher) — its own
  // resolver decides what (if anything) replaces it. Compline's own
  // 'preces' part is the only current user: it substitutes the short
  // Kyrie/Pater litany (see hours/compline.ts's 'preces' case) rather than
  // dropping to nothing, a deliberate vu-specific choice (real practice, in
  // both Monastic and secular tracks, drops Compline's Preces to nothing
  // on a Double, with no substitute) — the flag still means "not the full
  // text here," just not "nothing here."
  // `ferialOnly` marks a part that's dropped outright (not substituted)
  // on a Sunday/feast day — Terce/Sext/None's own trailing Preces
  // versicles (minor-hour-preces-feriales, trimmed 2026-09-01 to just
  // those versicles) are the only current user: the Kyrie/Pater Noster
  // that used to precede them in the same block was split out into its
  // own always-shown `minor-hour-kyrie-pater` part instead of following
  // suit, by explicit choice — see data/hours/terce.yml's header.
  | { kind: 'preces'; textRef: PropersRef; label?: string; omitOnDouble?: true; ferialOnly?: true }
  | { kind: 'psalm'; psalmNumber: number; verses?: string; antiphonRef?: PropersRef }
  | { kind: 'canticle'; canticleId: string; textRef: PropersRef; antiphonRef?: PropersRef }
  | {
      kind: 'lesson';
      textRef: PropersRef;
      label?: string;
      nocturn?: number;
      lessonSource?: 'historical' | 'continuous-plan';
    }
  // Resolved by date, not by textRef — see src/martyrology. Monastic Prime
  // reads *tomorrow's* entry (the announcement of the next day's saints).
  | { kind: 'martyrology' }
  // Resolved by date via the day->canonical-reading table (RB is read
  // through 3x/year) — see src/regula.
  | { kind: 'rule-reading' }
  // Chooses between two fixed texts by calendar/isSundayOrFeast — e.g.
  // Prime's capitulum (1 Tim on Sunday/feasts, Zach on ferias). Renders as
  // a plain 'chapter' or 'preces' ResolvedPart per resolvedKind.
  | {
      kind: 'by-day-kind';
      resolvedKind: 'chapter' | 'preces';
      label?: string;
      omitOnDouble?: true;
      // When true, a Vigil-ranked sanctoral winner takes the ferialRef
      // instead of the sundayOrFeastRef isSundayOrFeastOffice would
      // otherwise give it (that function treats any sanctoral winner,
      // Vigils included, as a "feast"). Prime's Preces use this; its
      // capitulum doesn't.
      vigilIsFerial?: true;
      sundayOrFeastRef: PropersRef;
      ferialRef: PropersRef;
    }
  // The Athanasian Creed — included on Sundays that aren't a Double-or-higher
  // feast (see calendar/isDoubleOrHigher and hours/prime.ts's 'creed' case
  // for how far that's actually implemented today).
  | { kind: 'creed' }
  // Resolved by season — Allelúja normally, Laus tibi Septuagesima through
  // Holy Saturday. See hours/opening-versicle.ts.
  | { kind: 'opening-versicle' }
  // The full antiphon, repeated after the whole psalm group (and the
  // Athanasian Creed, on days it's said) — real practice says it once more
  // in full here, distinct from the incipit-or-full opening attached to the
  // first psalm. See hours/antiphon.ts.
  | { kind: 'closing-antiphon' }
  // Compline's canticle — fixed year-round (not weekday-variable the way
  // Prime's psalm antiphon is), framed by "Salva nos" incipit-or-full
  // before and full after, same rank rule as any other antiphon. Resolves
  // to a 'canticle' ResolvedPart (with the opening antiphon inline) plus a
  // standalone 'antiphon' ResolvedPart for the closing repeat.
  | { kind: 'nunc-dimittis' }
  // Lauds only. Everything from Ps 66 through the Laudate psalms (148-150)
  // inclusive, resolved by weekday — see hours/lauds.ts's resolvePsalmody
  // and data/hours/lauds-antiphons.yml. Opaque here on purpose: the real
  // shape (a fixed Ps 66 with no antiphon at all, then a weekday-variable
  // number of antiphoned psalm groups, then a weekday-variable OT canticle,
  // then the Laudate psalms under one more shared antiphon) doesn't fit any
  // existing part kind, and hardcoding psalm numbers in lauds.yml can't
  // work since they differ by weekday. A duplex-majus-or-higher sanctoral
  // winner, or Marian Saturday, substitutes its own proper psalmody
  // instead — see hours/lauds-psalmody-overrides.ts's
  // getPsalmodyOverrideFor, gated by direct instruction at duplex-majus+
  // rather than every rank real historical practice would (most saints
  // were added in ways that override the daily psalms — not wanted here).
  // Authored per-feast, not per-Common (explicit choice) — known,
  // deliberate gap: most duplex-majus+ saints across the year don't have
  // one of these authored yet and fall back to the plain weekday default
  // until they do (same incremental-content pattern as everywhere else).
  | { kind: 'lauds-psalmody' }
  // Lauds only. The weekday-resolved chapter/short-responsory/hymn/closing
  // versicle bundle that follows the psalmody — see hours/lauds.ts and
  // data/propers/common/lauds-{capitulum,responsory,hymn,versicle}-*.yml.
  // Expands into 4 ResolvedParts (chapter, responsory, hymn, versicle).
  | { kind: 'lauds-office' }
  // Vespers only. The weekday-resolved 4-psalm-group psalmody — see
  // hours/vespers.ts and data/hours/vespers-antiphons.yml. Opaque for the
  // same reason as 'lauds-psalmody': each group's antiphon covers either
  // one whole psalm, two whole psalms said together under one shared
  // antiphon (Ps 115+116, Monday), or two verse-ranges of one psalm split
  // under one shared antiphon (Ps 138/143, Thu/Fri) — no existing part
  // kind represents that. No per-feast override mechanism yet (unlike
  // Lauds' getPsalmodyOverrideFor) — every day renders the plain weekday
  // default for now.
  | { kind: 'vespers-psalmody' }
  // Vespers only. The weekday-resolved chapter/short-responsory/hymn/
  // versicle bundle that follows the psalmody — see hours/vespers.ts and
  // data/propers/common/vespers-{capitulum,responsory,hymn,versicle}-*.yml.
  // Expands into 4 ResolvedParts (chapter, responsory, hymn, versicle).
  | { kind: 'vespers-office' }
  // Vespers only. Magnificat (Luke 1:46-55), fixed text, framed by a
  // day-resolved antiphon — see hours/resolve-common.ts's
  // getMagnificatAntiphon, which mirrors getBenedictusAntiphon's
  // saint/temporal-id lookup but also falls back to a real weekday
  // default (data/hours/vespers-magnificat-antiphons.yml, Mon-Sat) that
  // Benedictus has no equivalent of. Same incipit-or-full/full-after
  // framing as benedictus/nunc-dimittis, gated by isDoubleOrHigher.
  | { kind: 'magnificat' }
  // Lauds only. Benedictus (Luke 1:68-79), fixed text (see propers/common/
  // benedictus.yml) framed by a day-resolved antiphon (see hours/
  // resolve-common.ts's getBenedictusAntiphon) — same incipit-or-full/
  // full-after-Creed... no Creed at Lauds, just before+after framing shape
  // as nunc-dimittis, gated the same way by isDoubleOrHigher.
  | { kind: 'benedictus' }
  // Lauds and Vespers. The four fixed Tridentine suffrages (Holy Cross,
  // BVM, Ss. Peter & Paul, Peace) said after the day's collect(s) — see
  // data/propers/common/lauds-suffrage-*.yml (reused byte-identical at
  // Vespers, same fixed formula after either hour, live-verified
  // 2026-08-25 — see hours/resolve-common.ts's resolveSuffrages).
  // `omitOnDouble` gates the whole set at once (real practice: suffrages
  // drop on a Double-or-higher feast) — an honest simplification, see
  // resolveSuffrages for the caveat on what real practice also
  // suppresses them for that isn't modeled.
  | { kind: 'suffrages'; omitOnDouble?: true }
  // Lauds only. The Tridentine 1906/1910 "Preces feriales" litany (Kyrie,
  // Pater noster, a long chain of versicles, Psalm 129, closing versicles)
  // -- content Monastic 1617 doesn't have at Lauds at all, sourced from a
  // different track per direct instruction, same as lauds-suffrage-
  // joseph.yml. Real 1906/1910 practice restricts this further still
  // (Advent/Lent/Ember days, or an explicit day's own rubric flag) --
  // deliberately widened here to *every* ferial or vigil day, mirroring
  // the same explicit choice already made for Prime's own ferial Preces
  // (see data/hours/prime.yml's header). Replaces `lauds-short-litany` on
  // those days rather than stacking with it -- see hours/lauds.ts's
  // 'lauds-preces' case for the exact ferial-or-vigil predicate, which is
  // deliberately not the shared `isSundayOrFeast` (a Vigil counts as a
  // "feast" there; here it needs to count as ferial-like instead).
  | { kind: 'lauds-preces' }
  // Vespers only. Mirrors 'lauds-preces' exactly — the Tridentine
  // 1906/1910 "Preces feriales Vespera" (source: `@:Preces feriales
  // Laudes:s/129/50/` — byte-for-byte the Lauds ferial Preces with Psalm
  // 129 swapped for Psalm 50, live-verified against a clean Advent feria
  // 2026-12-17) on a ferial or vigil day, replacing the short Sunday/feast
  // litany otherwise said before the day's collect(s) — see hours/
  // resolve-common.ts's isFerialOrVigil (shared with 'lauds-preces') and
  // hours/vespers.ts's 'vespers-preces' case. Unlike Lauds, the short form
  // here reuses `lauds-short-litany` directly rather than a Vespers-named
  // duplicate — confirmed byte-identical by live query at both hours,
  // same reuse discipline as data/hours/vespers.yml's `lauds-conclusio`
  // closing.
  | { kind: 'vespers-preces' }
  // Lauds/Vespers. The day's own collect *and* one more per commemoration
  // (calendar/types.ts's LiturgicalDay.commemorations) — see hours/
  // resolve-common.ts's getDayCollects. Distinct from the singular
  // 'day-collect' the Little Hours use (which only ever renders the
  // winner's own collect, never a commemoration's). Simplification: each
  // collect renders as its own complete "Let us pray ... Amen." block
  // rather than the more compressed real form (one "Let us pray," only the
  // last collect closes with the full doxology) — see hours/lauds.ts.
  | { kind: 'day-collects' }
  // Compline's closing Marian antiphon (with its own versicle and collect
  // baked into the same text block) — resolved by season, defaulting to
  // Salve Regina. See hours/marian-antiphon.ts.
  | { kind: 'marian-antiphon' }
  // Unused by Prime/Compline/the little hours — exercised starting milestone 4.
  | { kind: 'variable'; resolve: 'by-weekday' | 'by-season' | 'by-feast-rank' }
  // The day's own Proper-of-season/Proper-of-saints collect — resolved by
  // day, not by textRef. First used by the Little Hours' "Oratio {ex
  // Proprio de Tempore}" via hours/resolve-common.ts's getDayCollect;
  // Prime/Compline both still use a fixed collect (`prayer` + textRef).
  // Renders as a plain 'prayer' ResolvedPart.
  | { kind: 'day-collect' };

export interface HourDefinition {
  id: HourId;
  parts: HourPart[];
}

/** A part with its text actually filled in, ready for the UI to render. */
export type ResolvedPart =
  | { kind: 'hymn' | 'chapter' | 'responsory' | 'versicle' | 'prayer'; text: ResolvedText }
  | { kind: 'preces'; text: ResolvedText; label?: string }
  // `gloriaPatri` is filled in centrally (hours/index.ts, after every hour
  // builder returns) rather than per-hour, so it's absent only during the
  // Sacred Triduum (calendar/temporal.ts's isInTriduum) — never omit it
  // when building a psalm part yourself.
  | { kind: 'psalm'; psalmNumber: number; antiphon?: ResolvedText; verses: ResolvedVerse[]; gloriaPatri?: ResolvedText }
  // `gloriaPatri` filled in centrally, same as the 'psalm' kind above —
  // see that field's doc comment.
  | { kind: 'canticle'; canticleId: string; text: ResolvedText; antiphon?: ResolvedText; gloriaPatri?: ResolvedText }
  // A standalone antiphon, said on its own rather than framing a psalm —
  // see 'closing-antiphon' above.
  | { kind: 'antiphon'; text: ResolvedText }
  // Matins only. Groups a nocturn's psalms for the UI — each entry is a
  // plain 'psalm' ResolvedPart (Sunday/Duplex+ nocturns 1-2 use the fixed
  // Ps 20-31 table, nocturn 3 uses 'canticle' entries instead; ferial days
  // have a single unnumbered nocturn and don't use this wrapper at all —
  // see hours/matins.ts). `nocturn` is 1-3.
  | { kind: 'nocturn-psalmody'; nocturn: number; psalms: ResolvedPart[] }
  // A standalone structural heading with no content of its own — marks the
  // start of a larger named section that doesn't correspond to one specific
  // part kind (Matins' "Invitatory", "Nocturn I/II/III"). Distinct from the
  // per-part `<h3 class="ordo-part-label">` every other kind already uses.
  | { kind: 'section-heading'; label: string }
  // Matins only. Sung after the last lesson on a 3-nocturn day (Sunday or
  // a Duplex+ sanctoral winner) — see hours/matins.ts. Never present on a
  // plain ferial (1-nocturn) day.
  | { kind: 'te-deum'; text: ResolvedText }
  // Martyrology and Regula both render as a block of prose text with a
  // label (a fixed section name for Martyrology, a date-derived chapter
  // title for Regula) rather than a fixed textRef.
  // `nocturn`/`source` are Matins-only (see hours/matins.ts): `nocturn`
  // groups a reading under its 'nocturn-psalmody' sibling for the UI (1-3,
  // omitted on a ferial 1-nocturn day); `source` is a human-readable
  // attribution ("St. John Chrysostom, Homily 3 on Matthew"; the user's
  // own bible-reading plan doesn't carry one). `label` is usually that same
  // plain string (nocturn-readings' own `source`, already written once in
  // English and reused as-is in both language columns), but octave
  // readings' own `source` is a genuine bilingual attribution (their
  // English title is a real translation of a Latin incipit, not an
  // editorial description written once) so `label` accepts either shape —
  // see hour-view.ts's renderLessonLabel. `responsory` is the short
  // responsory said after the reading, when one was sourced (matched
  // loosely by scriptural book for the user's own plan, live-queried
  // directly for patristic/hagiographic readings) — absent, not
  // fabricated, when none could be sourced. A Gospel pericope is never
  // rendered with this kind — see 'gospel' below.
  | {
      kind: 'lesson';
      text: ResolvedText;
      label?: string | Partial<Record<string, string>>;
      nocturn?: number;
      source?: string;
      responsory?: ResolvedText;
    }
  // Matins only. A Gospel pericope, from either the user's own continuous
  // reading plan (no paired homily) or the day's own genuine proper
  // Gospel+homily (src/propers/nocturn-readings.ts — never a
  // Common-of-Saints fallback Gospel, which this app deliberately excludes
  // for Matins, see hours/matins.ts). Split out from the generic 'lesson'
  // kind (2026-08-28) so a Gospel and its paired homily can be modeled as
  // one atomic part: when the source pairs a pericope with a patristic
  // homily on it as two adjacent readings, hours/matins.ts's
  // buildReadingPool combines them into a single 'gospel' part with
  // `homily` nested, rather than two separate pool entries — this is what
  // guarantees distributeIntoNocturns can never split a Gospel from its
  // own homily across two different nocturns; the pool's earlier
  // front-light 1/1/rest slicing could otherwise do exactly that. `source`
  // is set only for the rare case where the pericope's own text already
  // has homily prose folded into it at the data layer (an earlier, less
  // clean authoring convention — see chair-of-st-peter-at-rome.yml's own
  // header) — a genuinely separate homily reading, when authored, is
  // `homily` instead.
  | {
      kind: 'gospel';
      text: ResolvedText;
      nocturn?: number;
      source?: string;
      responsory?: ResolvedText;
      homily?: { source?: string; text: ResolvedText };
    };

export interface ResolvedVerse {
  n: number;
  text: Partial<Record<string, string>>;
  status: Partial<Record<string, 'verified' | 'draft' | 'missing'>>;
}

export interface ResolvedText {
  text: Partial<Record<string, string>>;
  status: Partial<Record<string, 'verified' | 'draft' | 'missing'>>;
  /** e.g. "1 Tim 1:17" — set when the text is a scripture quotation. Always
   * given in full (book, chapter, verse) rather than just a book name. */
  citation?: Partial<Record<string, string>>;
}

/**
 * The "ordo" for one hour on one day — the fully resolved output of
 * combining calendar resolution, the psalter distribution, and an
 * HourDefinition. This is the seam between the engine and the UI: the UI
 * never needs to know whether a part came from a static YAML row or a
 * resolved rule.
 */
export interface ResolvedOrdo {
  hourId: HourId;
  date: string;
  parts: ResolvedPart[];
  /** Set when this hour hasn't been built yet — UI shows "coming soon" instead of empty content. */
  notImplemented?: true;
  /**
   * "Monday in the 10th week after Trinity", "St. Ereden — ...", etc.,
   * keyed by language code (`en`/`la`) — see calendar/day-label.ts.
   * Computed from whichever LiturgicalDay the hour actually resolved
   * against, which can differ from `date` itself (Compline may anticipate
   * tomorrow — see calendar/vespers.ts). Absent on not-yet-built hours.
   */
  dayLabel?: Partial<Record<string, string>>;
}
