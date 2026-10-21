// The one loader for every Common, feast and ordinary-text file.
//
//   src/data/<lang>/commons/<common-id>.yml   one Common, one language
//   src/data/<lang>/propers/<feast-id>.yml    one feast / saint / season, one language
//   src/data/<lang>/ordinary/<group>.yml      fixed texts that belong to no feast
//
// A file is a flat map of sections. A section key is what the old one-file-
// per-text stores called an id, minus the owner (the file's own name):
//
//   matins-hymn                      -> `matins-hymn-<owner>`
//   magnificat-antiphon/~-first      -> `magnificat-antiphon-<owner>-first` (`~` is the owner)
//   collect/c5                       -> `collect-c5` (a pattern with no `~` is used as written)
//   matins-psalmody                  -> the Matins psalmody record for <owner>
//   nocturn-readings                 -> the Matins readings record for <owner>
//   octave-readings/~-octave-day-2   -> the octave reading `<owner>-octave-day-2`
//
// In an ordinary file the key is the whole id. Each language's file holds only
// that language's strings; the language-neutral structure (psalm numbers,
// canticle references) is repeated in each, and `mergeLanguages` rebuilds the
// `{ la, en }` pairs the rest of the app reads. Which keys are such pairs
// depends on the section family (`WRAPPED`).
import type { ProperText } from './types';

type Plain = Record<string, unknown>;

const WRAPPED: Record<string, Set<string>> = {
  text: new Set(['text', 'status', 'citation']),
  psalmody: new Set(['antiphon', 'antiphonStatus', 'v', 'r', 'status']),
  'nocturn-readings': new Set(['citation', 'responsory', 'status', 'text']),
  'octave-readings': new Set(['text', 'status', 'responsory', 'source', 'citation']),
};

function isEmptyObject(x: unknown): boolean {
  return !!x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length === 0;
}

function mergeLanguages(a: unknown, b: unknown, wrapped: Set<string>, key?: string): unknown {
  if (key && wrapped.has(key)) {
    const pair: Record<string, unknown> = {};
    if (a !== undefined && !isEmptyObject(a)) pair.la = a;
    if (b !== undefined && !isEmptyObject(b)) pair.en = b;
    return pair;
  }
  const either = a ?? b;
  if (Array.isArray(either)) {
    const left = (a as unknown[] | undefined) ?? [];
    const right = (b as unknown[] | undefined) ?? [];
    return Array.from({ length: Math.max(left.length, right.length) }, (_, i) => mergeLanguages(left[i], right[i], wrapped));
  }
  if (either && typeof either === 'object') {
    const left = (a as Plain | undefined) ?? {};
    const right = (b as Plain | undefined) ?? {};
    const out: Plain = {};
    for (const k of new Set([...Object.keys(left), ...Object.keys(right)])) out[k] = mergeLanguages(left[k], right[k], wrapped, k);
    return out;
  }
  return either;
}

function family(head: string): string {
  if (head.endsWith('-psalmody')) return 'psalmody';
  return head === 'nocturn-readings' || head === 'octave-readings' ? head : 'text';
}

const modules = import.meta.glob<{ default: Plain }>('../data/*/{commons,propers,ordinary}/*.yml', { eager: true });

type Slot = Record<string, Plain>; // lang -> parsed file
const slots = new Map<string, Slot>(); // `${kind}/${owner}` -> per-language parsed files
for (const [path, mod] of Object.entries(modules)) {
  const m = /\/data\/([^/]+)\/(commons|propers|ordinary)\/([^/]+)\.yml$/.exec(path);
  if (!m) continue;
  const slotKey = `${m[2]}/${m[3]}`;
  const slot = slots.get(slotKey) ?? {};
  slot[m[1] as string] = mod.default;
  slots.set(slotKey, slot);
}

/** The raw per-language files, `kind/owner` -> language -> parsed contents.
 * Exposed for the language-parity test. */
export const sourceFiles = slots;

/** A section's body without its language-specific strings, leaving the
 * structure that must agree between languages (psalm numbers, canticle
 * references, how many readings). */
export function languageNeutralShape(sectionKey: string, body: unknown): unknown {
  const wrapped = WRAPPED[family(sectionKey.split('/')[0] as string)] as Set<string>;
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => !wrapped.has(k)).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(body);
}

export type PsalmodyHour = 'matins' | 'lauds' | 'vespers';
export interface ProperEntry extends ProperText {
  /** True for what the old `propers/temporal` store held; see `getTemporalProper`. */
  temporal: boolean;
}
export interface Psalmody<T> {
  saints: Map<string, T>;
  categories: Map<string, T>;
}

export const properEntries = new Map<string, ProperEntry>();
export const nocturnReadingRecords = new Map<string, Plain>();
export const octaveReadingRecords = new Map<string, Plain>();
const psalmodyByHour: Record<PsalmodyHour, Psalmody<Plain>> = {
  matins: { saints: new Map(), categories: new Map() },
  lauds: { saints: new Map(), categories: new Map() },
  vespers: { saints: new Map(), categories: new Map() },
};

/** An hour's psalmody records, typed by that hour's own module. `saints` are
 * the feast-specific schemes, `categories` the Commons'. */
export function psalmodyRecords<T>(hour: PsalmodyHour): Psalmody<T> {
  return psalmodyByHour[hour] as unknown as Psalmody<T>;
}

for (const [slotKey, slot] of slots) {
  const [kind, owner] = slotKey.split('/') as [string, string];
  const langs = Object.keys(slot);
  const keys = new Set(langs.flatMap((l) => Object.keys(slot[l] as Plain)));
  for (const key of keys) {
    const [head, pattern] = key.split('/') as [string, string | undefined];
    const wrapped = WRAPPED[family(head)] as Set<string>;
    const withOwner = (p: string | undefined) => (p ? p.replace('~', owner) : owner);
    const bodies = ['la', 'en'].map((l) => slot[l]?.[key] as Plain | undefined);
    const merged = mergeLanguages(bodies[0], bodies[1], wrapped) as Plain;
    const fam = family(head);

    if (fam === 'text') {
      const id = kind === 'ordinary' ? key : `${head}-${withOwner(pattern)}`;
      const { temporal, ...rest } = merged;
      properEntries.set(id, { id, ...rest, temporal: temporal === true } as ProperEntry);
    } else if (fam === 'nocturn-readings') {
      const id = withOwner(pattern);
      nocturnReadingRecords.set(id, { id, ...merged });
    } else if (fam === 'octave-readings') {
      const id = withOwner(pattern);
      octaveReadingRecords.set(id, { id, ...merged });
    } else {
      const id = withOwner(pattern);
      const hour = head.split('-')[0] as PsalmodyHour;
      psalmodyByHour[hour][kind === 'commons' ? 'categories' : 'saints'].set(id, { id, ...merged });
    }
  }
}
