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
  | { kind: 'psalm'; psalmNumber: number; antiphonRef?: PropersRef }
  | { kind: 'canticle'; canticleId: string; antiphonRef?: PropersRef }
  | {
      kind: 'lesson';
      textRef: PropersRef;
      nocturn?: number;
      lessonSource?: 'historical' | 'continuous-plan';
    }
  // Unused by Prime/Compline/the little hours — exercised starting milestone 4.
  | { kind: 'variable'; resolve: 'by-weekday' | 'by-season' | 'by-feast-rank' };

export interface HourDefinition {
  id: HourId;
  parts: HourPart[];
}

/** A part with its text actually filled in, ready for the UI to render. */
export type ResolvedPart =
  | { kind: 'hymn' | 'chapter' | 'responsory' | 'versicle' | 'prayer'; text: ResolvedText }
  | { kind: 'psalm'; psalmNumber: number; antiphon?: ResolvedText; verses: ResolvedVerse[] }
  | { kind: 'canticle'; canticleId: string; antiphon?: ResolvedText };

export interface ResolvedVerse {
  n: number;
  text: Partial<Record<string, string>>;
  status: Partial<Record<string, 'verified' | 'draft' | 'missing'>>;
}

export interface ResolvedText {
  text: Partial<Record<string, string>>;
  status: Partial<Record<string, 'verified' | 'draft' | 'missing'>>;
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
