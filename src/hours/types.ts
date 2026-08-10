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
  'prime',
  'compline',
  'terce',
  'sext',
  'none',
  'lauds',
  'vespers',
  'matins',
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
  | { kind: 'preces'; textRef: PropersRef; label?: string }
  | { kind: 'psalm'; psalmNumber: number; verses?: string; antiphonRef?: PropersRef }
  | { kind: 'canticle'; canticleId: string; antiphonRef?: PropersRef }
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
  // Unused by Prime/Compline/the little hours — exercised starting milestone 4.
  | { kind: 'variable'; resolve: 'by-weekday' | 'by-season' | 'by-feast-rank' };

export interface HourDefinition {
  id: HourId;
  parts: HourPart[];
}

/** A part with its text actually filled in, ready for the UI to render. */
export type ResolvedPart =
  | { kind: 'hymn' | 'chapter' | 'responsory' | 'versicle' | 'prayer'; text: ResolvedText }
  | { kind: 'preces'; text: ResolvedText; label?: string }
  | { kind: 'psalm'; psalmNumber: number; antiphon?: ResolvedText; verses: ResolvedVerse[] }
  | { kind: 'canticle'; canticleId: string; antiphon?: ResolvedText }
  // A standalone antiphon, said on its own rather than framing a psalm —
  // see 'closing-antiphon' above.
  | { kind: 'antiphon'; text: ResolvedText }
  // Martyrology and Regula both render as a block of prose text with a
  // label (a fixed section name for Martyrology, a date-derived chapter
  // title for Regula) rather than a fixed textRef.
  | { kind: 'lesson'; text: ResolvedText; label?: string };

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
}
