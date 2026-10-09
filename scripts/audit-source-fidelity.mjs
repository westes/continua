#!/usr/bin/env node
// One-off audit: re-verify continua's own authored propers/nocturn/octave
// content against ../divinum-officium-reference. Grew from a narrow v1
// (re-verify every src/data/propers/common/*.yml file against its own
// cited tag, catching the bug class found in commit ee88aba, 2026-09-14:
// 23 saints whose Common-tier YAML held the wrong text) into five passes:
//
// 1. common/ single-tag fidelity -- propers-suffix files (antiphon/
//    magnificat-antiphon/commemoration/collect, matched via
//    SaintRecord.propers) AND id-keyed files (capitulum/hymn/responsory/
//    versicle/invitatory, matched via the saint's raw `id`).
// 2. coverage -- does an expected file exist AT ALL for every part a
//    saint's own source genuinely has real content for. Catches a
//    different bug shape than #1: not "wrong content" but "no content
//    ever authored," silently covered by resolve-common.ts's Common/
//    ferial fallback with no visible `status: missing` anywhere. (Found
//    49 real candidates in a pre-build spot-check -- see the conversation
//    this script came out of.)
// 3. temporal/*.yml -- same single-tag shape and engine as #1, but keyed
//    to a temporal id instead of a SaintRecord. Prefers an explicit
//    citation; falls back to derivedTemporalFile()'s small, individually-
//    confirmed id->Tempora-filename table when the header only claims
//    live-verification (most of temporal/ does).
// 4. nocturn-readings/*.yml and octave-readings/*.yml -- the multi-lesson
//    engine: extracts "LectioN-M" range citations (nocturn-aware, so a
//    later incidental "Lectio4" mention explaining a responsory choice
//    isn't mistaken for a second range), re-combines those source tags
//    into one reading exactly like this project's own authoring
//    convention, and compares -- including each reading's own inline
//    `responsory` field against the range's first tag's own ResponsoryN.
//
// Run: `npm run audit:sources`. Writes audit-source-fidelity-report.md to
// the repo root (untracked -- don't `git add` it, it's a disposable report
// for human review, regenerated each run).
//
// NOT in scope, on purpose:
// - common/ files with no single saint/date to check against (generic
//   Common-category files) -- no source to compare, not a gap.
// - octave-readings/ files sourced via `passages:` (this app's own
//   scripture store) -- verified by construction against that store
//   already; re-deriving it here would just duplicate that code, not add
//   verification value.
// - temporal-id families derivedTemporalFile() doesn't cover (fixed
//   movable feasts like Ascension/Pentecost/Corpus Christi, individual
//   Holy Week/Passion-week weekday ferias, a few others) -- each rule in
//   that table was individually confirmed against a real reference file
//   before being added; families not in it fall through to citation-only
//   checking, same as before this table existed. Not a regression, an
//   honest boundary on what's been verified.
//
// Known limitations (stated, not solved):
// - Header-comment citations are freeform prose, not a structured field --
//   regex extraction WILL have false negatives on citations phrased
//   unexpectedly. Flagged in low-confidence buckets rather than silently
//   merged into "no citation at all."
// - `@include`/cross-file transclusion is not resolved (reported as
//   UNRESOLVABLE-INCLUDE). Same-file `@:TagName` self-references ARE
//   resolved (a real, common pattern -- e.g. `[Lectio4]`'s body is often
//   just `@:Lectio4o`, with the real text a few lines further down).
// - No fuzzy auto-pass threshold: every non-exact match after
//   normalization is surfaced as a MISMATCH, with a similarity score as a
//   human triage aid only, never to auto-suppress a finding.
// - Static-only: doesn't invoke the reference engine's live CGI instance.
//   Live-query-only citations go in their own bucket, not treated as a
//   defect signal by themselves.
// - Derived-source checks (temporal/ files with no citation, verified via
//   the id->filename table instead) are lower-confidence than cited ones:
//   the Ant2=Benedictus/Ant3=Magnificat mapping holds broadly but not
//   universally (Quad1-0.txt/Lent 1 has neither tag, a real exception
//   found while building this) -- flagged inline as `derivedSource` in
//   the report, not silently trusted at the same confidence as an
//   explicit citation.
// - nocturn-readings/'s range-to-reading zip is best-effort prose-order
//   matching (ranges extracted per "Nocturn N" segment, first dash-range
//   in each segment), not a guaranteed structural link.

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REF_HORAS = path.resolve(REPO_ROOT, '..', 'divinum-officium-reference', 'web', 'www', 'horas');
const COMMON_DIR = path.join(REPO_ROOT, 'src', 'data', 'propers', 'common');
const TEMPORAL_DIR = path.join(REPO_ROOT, 'src', 'data', 'propers', 'temporal');
const NOCTURN_READINGS_DIR = path.join(REPO_ROOT, 'src', 'data', 'propers', 'nocturn-readings');
const OCTAVE_READINGS_DIR = path.join(REPO_ROOT, 'src', 'data', 'propers', 'octave-readings');
const SAINTS_DIR = path.join(REPO_ROOT, 'src', 'data', 'calendar', 'saints');
const SANCTORAL_CALENDAR_FILE = path.join(REPO_ROOT, 'src', 'data', 'calendar', 'sanctoral-calendar.yml');
const REPORT_FILE = path.join(REPO_ROOT, 'audit-source-fidelity-report.md');

// Grepped directly from resolve-common.ts's `${saint.propers}-...` template
// literals -- the exact, complete set. Longest first so
// "-magnificat-antiphon" isn't shadowed by "-antiphon".
const PROPERS_SUFFIXES = ['-magnificat-antiphon', '-commemoration', '-antiphon', '-collect'];

// Grepped from resolve-common.ts's `${hourId}-<part>-${id}` template
// literals for the parts that key off a saint's raw `id` (not `propers`) --
// capitulum/hymn/responsory/versicle/invitatory files under common/ that
// the original propers-suffix scan above can't reach. Longest-prefix-first
// isn't needed here (these don't nest inside each other the way
// -magnificat-antiphon/-antiphon do).
// `tags: null` means the prefix is real (used for id-matching) but no
// confirmed single-tag mapping exists yet to derive a check from when the
// file itself has no citation -- same confirmed set as COMMUNE_PART_RULES
// (Sancti/SanctiM files use the identical tag vocabulary as Commune
// files, both being the same reference-engine format), extended here to
// saint-specific id-keyed files rather than just generic Common
// categories.
const ID_KEYED_PREFIXES = [
  { prefix: 'lauds-capitulum-', tags: ['Capitulum Laudes'] },
  { prefix: 'vespers-capitulum-', tags: null },
  { prefix: 'terce-capitulum-', tags: null },
  { prefix: 'sext-capitulum-', tags: ['Capitulum Sexta'] },
  { prefix: 'none-capitulum-', tags: ['Capitulum Nona'] },
  { prefix: 'lauds-hymn-', tags: ['Hymnus Laudes', 'HymnusM Laudes'] },
  { prefix: 'vespers-hymn-', tags: null },
  { prefix: 'matins-hymn-', tags: null },
  { prefix: 'matins-invitatory-', tags: null },
  { prefix: 'lauds-responsory-', tags: null },
  { prefix: 'vespers-responsory-', tags: null },
  { prefix: 'lauds-versicle-', tags: null },
  { prefix: 'vespers-versicle-', tags: null },
];

// The tag each `${propers}-<suffix>` (or Tempora `${prefix}-0`) part maps
// to in the reference source -- confirmed directly (09-15.txt's own tag
// order cross-checked against resolve-common.ts's getBenedictusAntiphon/
// getMagnificatAntiphon, and Adv1-0.txt's tag order matching
// advent-1-benedictus-antiphon.yml's actual authored text verbatim under
// [Ant 2]). Used by both the coverage pass and the temporal/ derived-file
// fallback below.
const SUFFIX_TO_TAG = {
  '-antiphon': 'Ant 2', // Lauds' Benedictus antiphon
  '-magnificat-antiphon': 'Ant 3', // Vespers' (2nd) Magnificat antiphon
  '-collect': 'Oratio',
};

// -------------------------------------------------------------------------
// Loading continua's own data
// -------------------------------------------------------------------------

function loadYaml(filePath) {
  return yaml.load(readFileSync(filePath, 'utf8'));
}

function extractHeaderComment(raw) {
  const lines = raw.split('\n');
  const commentLines = [];
  for (const line of lines) {
    if (line.startsWith('#')) {
      commentLines.push(line.replace(/^#\s?/, ''));
    } else {
      break;
    }
  }
  return commentLines.join('\n');
}

function loadSaintRecords() {
  // `propers` is many-to-one, not one-to-one -- a real, intentional
  // pattern in this corpus (e.g. `octave-of-all-saints` deliberately
  // reuses `all-saints`'s own propers files). A bug found while adding
  // the derived-fallback below: a plain `Map<propers, record>` silently
  // keeps only the alphabetically-last file on a collision, so
  // `all-saints-antiphon.yml` resolved to the OCTAVE's own Nov 8 instead
  // of All Saints' real Nov 1 -- wrong source file entirely.
  // `byPropers` is therefore `Map<propers, SaintRecord[]>`; callers try
  // every candidate's own date, same "try each until one matches" pattern
  // `verifyAgainstTags` already uses for multiple cited source files.
  const byPropers = new Map();
  const byId = new Map();
  for (const file of readdirSync(SAINTS_DIR)) {
    if (!file.endsWith('.yml')) continue;
    const record = loadYaml(path.join(SAINTS_DIR, file));
    if (!record?.id) continue;
    byId.set(record.id, record);
    if (record.propers) {
      if (!byPropers.has(record.propers)) byPropers.set(record.propers, []);
      byPropers.get(record.propers).push(record);
    }
  }
  return { byPropers, byId };
}

function loadSanctoralCalendar() {
  const doc = loadYaml(SANCTORAL_CALENDAR_FILE);
  const idToDate = new Map();
  for (const [date, ids] of Object.entries(doc.days ?? {})) {
    for (const id of ids) {
      // A saint can appear more than once (moved dates, etc.) -- first wins,
      // good enough for "does a real date exist to check against."
      if (!idToDate.has(id)) idToDate.set(id, date);
    }
  }
  return idToDate;
}

// -------------------------------------------------------------------------
// Parsing reference .txt files into a tag -> [{ text, subIndex }] map
// -------------------------------------------------------------------------

const TAG_LINE = /^\[([^\]]+?)\](?:\s*\([^)]*\))?\s*$/;

function parseReferenceFile(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch {
    return null; // FILE-NOT-FOUND, handled by caller
  }
  const lines = raw.split('\n');
  /** @type {Map<string, string[][]>} tag name -> array of sub-entries, each an array of raw body lines */
  const tags = new Map();
  let currentTag = null;
  let currentBlock = [];

  const flushTag = () => {
    if (currentTag === null) return;
    if (!tags.has(currentTag)) tags.set(currentTag, []);
    // Split accumulated body lines into blank-line-delimited sub-entries.
    const subEntries = [[]];
    for (const line of currentBlock) {
      if (line.trim() === '') {
        if (subEntries[subEntries.length - 1].length > 0) subEntries.push([]);
      } else {
        subEntries[subEntries.length - 1].push(line);
      }
    }
    for (const entry of subEntries) {
      if (entry.length > 0) tags.get(currentTag).push(entry);
    }
  };

  for (const line of lines) {
    const match = TAG_LINE.exec(line);
    if (match) {
      flushTag();
      currentTag = match[1].trim();
      currentBlock = [];
    } else if (currentTag !== null) {
      currentBlock.push(line);
    }
  }
  flushTag();

  // Reduce each raw sub-entry (array of lines) to one comparable plain-text
  // string, stripping control syntax that isn't part of the liturgical text.
  // A same-file self-reference (`@:TagName`, optionally followed by a
  // `:s/.../.../` regex-transform this script doesn't apply) is captured
  // as `selfRef` rather than immediately marked unresolvable -- resolved in
  // a second pass below, since the referenced tag can be defined later in
  // the file (e.g. `[Lectio4]` body is just `@:Lectio4o`, with `[Lectio4o]`
  // itself a few lines further down). A cross-file reference (`@Path/...`,
  // no leading `:`) stays genuinely unresolvable -- chasing another file
  // is out of scope, same stance as always.
  /** @type {Map<string, { text: string, unresolvableInclude: boolean, selfRef?: string }[]>} */
  const resolved = new Map();
  for (const [tag, entries] of tags) {
    resolved.set(
      tag,
      entries.map((entryLines) => {
        let unresolvableInclude = false;
        let selfRef;
        const kept = [];
        for (const raw of entryLines) {
          const line = raw.trim();
          if (line === '') continue;
          if (line.startsWith('!')) continue; // scripture/patristic citation ref, not body text
          if (line === '_') continue; // stanza divider
          if (/^\(.*\)$/.test(line)) continue; // rubric condition note, e.g. "(sed rubrica 1906 dicitur)"
          if (/^\([^)]*\)\$\S+$/.test(line)) continue; // same, immediately followed by a bare `$macro` ref, e.g. "(rubrica divino)$rubrica Jube"
          if (line.startsWith('@:')) {
            const m = /^@:([^:]+)/.exec(line);
            if (m) selfRef = m[1].trim();
            else unresolvableInclude = true;
            continue;
          }
          if (line.startsWith('@')) {
            unresolvableInclude = true;
            continue;
          }
          kept.push(line);
        }
        let text = kept.join(' ');
        // Strip trailing shorthand-ending / structural markers ($Word, &Word)
        text = text.replace(/\s*[$&][A-Za-z][A-Za-z ]*$/g, '');
        // Strip trailing psalm-number suffix on antiphon lines (;;123).
        text = text.replace(/;;\d+\b/g, '');
        return { text: text.trim(), unresolvableInclude, selfRef };
      }),
    );
  }
  // Second pass: substitute same-file self-references. Only one level deep
  // (a selfRef target that is itself a selfRef stays unresolved) -- not
  // observed in practice, and chasing chains is unneeded complexity.
  for (const entries of resolved.values()) {
    for (const entry of entries) {
      if (entry.selfRef && !entry.text) {
        const target = resolved.get(entry.selfRef)?.[0];
        if (target && !target.selfRef) {
          entry.text = target.text;
          entry.unresolvableInclude = target.unresolvableInclude;
        }
      }
    }
  }
  return resolved;
}

// -------------------------------------------------------------------------
// Extracting candidate (sourceFile, tag) citations from a header comment
// -------------------------------------------------------------------------

// Header comments wrap prose across multiple `#` lines, so a citation like
// "Sancti/\n09-15.txt" can have the line break land right after the slash
// -- extractCitations() runs this against a whitespace-collapsed copy of
// the comment, not the raw multi-line text, so \s* here only needs to
// absorb ordinary spacing, not literal newlines.
const SOURCE_FILE_RE = /(Sancti|SanctiM)\/\s*(\d{2}-\d{2})\.txt/g;
// Generic Common-category files cite a Commune/CN.txt file instead of a
// dated Sancti/SanctiM one -- either directly ("C5.txt") or via a live
// "votive=C4" query param naming the same file (both matched inline in
// extractCitations below). The real filename vocabulary (checked against
// the actual Commune/ directory listing): C1-C12, each optionally
// suffixed with a letter (a/b/n/p/v...), an Advent/Paschaltide/
// Quadragesima variant (Pasc/A/N/Q), and/or a `-1` alternate-numbering
// suffix (`C2-1`, `C2a-1`).
// Real tag vocabulary observed in the reference files -- deliberately a
// closed-ish list rather than "any [xxx]" to avoid false positives on
// unrelated bracketed prose, e.g. "[skip ci]"-style asides (not seen in
// these files, but defensive).
const TAG_RE = /\[((?:Ant|Versum|Rank|Oratio|Invit|Lectio|Responsory|Hymnus|Capitulum|Rule|Doxology|Nocturn)[^\]]*)\]/g;
const LIVE_QUERY_RE = /live[ -]quer(y|ied)|live[ -]verif/i;
const SOURCE_MENTION_RE = /\b(Sancti|SanctiM)\b|\b\d{2}-\d{2}\b/;

function extractCitations(comment) {
  const flat = comment.replace(/\s+/g, ' ');
  const sourceFiles = [...flat.matchAll(SOURCE_FILE_RE)].map((m) => ({ track: m[1], date: m[2] }));
  // Commune citations only count when explicitly marked as a filename
  // (".txt") or a "votive=" query param -- a bare "C5" in prose elsewhere
  // is too easy to confuse with something unrelated (a footnote number, a
  // rubric code); require one of those two unambiguous markers.
  const communeCites = new Set();
  // A single greedy `[a-zA-Z0-9-]*` run (not the nested-optional-group
  // shape used earlier) -- that shape risked catastrophic backtracking on
  // long comment strings; this is linear-time and captures the same real
  // filename vocabulary (checked against the actual Commune/ directory).
  for (const m of flat.matchAll(/\bvotive=C(\d{1,2}[a-zA-Z0-9-]*)\b/g)) communeCites.add(m[1]);
  for (const m of flat.matchAll(/\bC(\d{1,2}[a-zA-Z0-9-]*)\.txt\b/g)) communeCites.add(m[1]);
  for (const code of communeCites) sourceFiles.push({ track: 'Commune', date: `C${code}` });
  const tags = [...new Set([...flat.matchAll(TAG_RE)].map((m) => m[1].trim()))];
  return { sourceFiles, tags };
}

// -------------------------------------------------------------------------
// Comparison
// -------------------------------------------------------------------------

// The reference .txt corpus wraps an optional, Paschaltide-only "Alleluia"
// clause in parens at the end of many antiphons (e.g. "...Fílium Dei.
// (Allelúja, allelúja.)") -- a seasonal-addition convention, not part of
// the antiphon's own core text. continua handles the Paschaltide Alleluia
// separately via its own withPaschaltideAlleluia mechanism (resolve-
// common.ts) and its propers files store the plain, season-neutral text
// without the parens -- so this is a real, systematic, non-bug formatting
// difference (697 occurrences across the reference corpus) that would
// otherwise drown every genuine mismatch in this same cosmetic near-miss.
// Unwrap it (keep the words, drop the parens) before comparing, on both
// sides symmetrically.
function stripOptionalAlleluiaParens(text) {
  return text.replace(/\(([^()]*llel[^()]*)\)/gi, '$1');
}

// The reference corpus's plain-text files consistently use ASCII "+" for
// the sign-of-the-cross mark that continua's own YAML renders as the real
// Unicode "✠" character (confirmed: 8 occurrences in one file alone,
// zero uses of "✠" itself in that same file) -- a systemic transcription
// convention, not a content difference, so both are normalized to the
// same marker before comparing.
function normalizeCrossMark(text) {
  return text.replace(/✠/g, '+');
}

function normalize(text) {
  return normalizeCrossMark(stripOptionalAlleluiaParens(text)).replace(/\s+/g, ' ').trim();
}

// Minimal Levenshtein distance, no dependency -- fine for one-off use on
// short liturgical antiphon strings.
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function similarity(a, b) {
  if (a.length === 0 && b.length === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// -------------------------------------------------------------------------
// Multi-lesson range citations (nocturn-readings/, octave-readings/,
// combined-Lectio content) -- "Lectio4-6" style prose ranges, distinct
// from the single-bracket-tag citations common/ mostly uses.
// -------------------------------------------------------------------------

// Requires an actual dash ("Lectio4-6"), not a bare "Lectio4" -- a real bug
// found while building this: prose incidentally mentions a bare LectioN
// again later in the same comment to explain which responsory survived
// the collapse ("Responsory: Lectio4's own (Responsory4, ...)"), which a
// looser match treated as a *second*, spurious one-lesson range,
// misaligning the zip against `readings` entirely. Bare mentions are
// genuinely too ambiguous to use as range boundaries; a real single-lesson
// "range" is rare enough that requiring the dash is the right precision/
// recall tradeoff here (matches this script's existing "no fuzzy
// auto-pass, precision over recall" stance).
const LECTIO_DASH_RANGE_RE = /Lectio(\d+)-(\d+)/g;

/** Nocturn-aware: splits the comment on "Nocturn N" markers and takes the
 * first dash-range found in each segment, so a later incidental LectioN
 * mention in the same segment's prose (explaining a responsory choice,
 * etc.) can't be mistaken for a second range. Falls back to "the single
 * first range in the whole comment" when no "Nocturn N" markers exist
 * (octave-readings' flat, single-reading shape). Returned in the same
 * order as the file's own `readings` array is expected to be in (Nocturn
 * ascending) -- a best-effort match on prose order, not a guarantee. */
function extractLectioRanges(comment) {
  const flat = comment.replace(/\s+/g, ' ');
  const nocturnSplit = flat.split(/(?=Nocturn \d)/);
  const segments = nocturnSplit.length > 1 ? nocturnSplit : [flat];
  const ranges = [];
  for (const segment of segments) {
    const m = LECTIO_DASH_RANGE_RE.exec(segment);
    LECTIO_DASH_RANGE_RE.lastIndex = 0;
    if (!m) continue;
    const start = Number(m[1]);
    const end = Number(m[2]);
    if (end < start || end - start > 8) continue; // sanity guard against a stray match
    ranges.push(Array.from({ length: end - start + 1 }, (_, i) => `Lectio${start + i}`));
  }
  return ranges;
}

/** Combines several Lectio tags' resolved text into one paragraph-per-
 * lesson reading, matching this project's own "collapse several historical
 * lessons into one continuous reading" convention (nocturn-readings.ts/
 * octave-readings.ts's own doc comments). Returns null if any tag in the
 * range is missing/unresolvable -- a partial combination isn't a
 * meaningful comparison target. `responsoryTag` is the range's first tag's
 * own number (e.g. "Responsory4" for a Lectio4-6 range) -- "the first
 * responsory following the reading," per octave-readings.ts's own
 * documented convention for which responsory survives the collapse. */
function combineRange(sourceMap, tags) {
  const paras = [];
  for (const tag of tags) {
    const entry = sourceMap?.get(tag)?.[0];
    if (!entry || entry.unresolvableInclude || !entry.text) return null;
    paras.push(entry.text);
  }
  return paras.join('\n\n');
}

/** Combines a Lectio range for both languages at once -- either side can
 * independently come back null (missing/unresolvable), in which case that
 * language just isn't compared, same "compare what we can" stance as the
 * single-tag engine. */
function combineRangeBilingual(laMap, enMap, tags) {
  const la = combineRange(laMap, tags);
  const en = combineRange(enMap, tags);
  if (la === null && en === null) return null;
  return { la, en, responsoryTag: tags[0].replace('Lectio', 'Responsory') };
}

/** Builds a comparable "R. ...\nV. ...\nR. ..." block from a source file's
 * ResponsoryN tag, matching every inline `responsory:` field's own
 * convention throughout this project (octave-readings.ts's own doc
 * comment: R./V./repeat). Returns null if the tag has no content. */
// The reference .txt's own ResponsoryN body already starts each line with
// its own "R."/"V." label (unlike Ant/Lectio tags) -- strip those here so
// comparison is against bare wording, not label formatting this script
// doesn't try to reproduce (a real bug found while testing: blindly
// re-prepending "R. " produced a doubled "R. R. ..." that broke the
// containment check below).
function stripResponsoryLabels(text) {
  return text.replace(/\b[RV]\.\s*/g, '');
}

/** Just the bare, label-stripped wording of a source ResponsoryN tag, for
 * both languages -- not a reconstructed display block, since this script
 * only ever compares wording, never renders. */
function combineResponsory(laMap, enMap, tag) {
  const laEntry = laMap?.get(tag)?.[0];
  const enEntry = enMap?.get(tag)?.[0];
  if (!laEntry?.text && !enEntry?.text) return null;
  return {
    la: laEntry?.text ? stripResponsoryLabels(laEntry.text) : undefined,
    en: enEntry?.text ? stripResponsoryLabels(enEntry.text) : undefined,
  };
}

// -------------------------------------------------------------------------
// Temporal-id -> reference Tempora filename mapping -- a small, confirmed
// dispatch table (see the conversation this script came out of), NOT a
// reimplementation of Easter-relative date math. Every rule here was
// checked against a real file before being added; families not covered
// (fixed-date movable feasts like Ascension/Pentecost, individual Holy
// Week/Passion-week weekday ferias, etc.) fall through to citation-only
// checking, same as before this table existed -- not a regression, just an
// honest boundary on what's been verified.
// -------------------------------------------------------------------------

function derivedTemporalFile(id) {
  let m;
  if ((m = /^advent-(\d)$/.exec(id))) return `Adv${m[1]}-0`;
  if ((m = /^lent-(\d)$/.exec(id))) return `Quad${m[1]}-0`;
  if (id === 'passion-sunday') return 'Quad5-0';
  if ((m = /^easter-(\d)$/.exec(id))) return `Pasc${Number(m[1]) - 1}-0`;
  if ((m = /^post-epiphany-(\d)$/.exec(id))) return m[1] === '1' ? 'Epi1-0a' : `Epi${m[1]}-0`;
  if (id === 'septuagesima') return 'Quadp1-0';
  if (id === 'sexagesima') return 'Quadp2-0';
  if (id === 'quinquagesima') return 'Quadp3-0';
  if (id === 'christmas-octave-sunday') return 'Nat1-0';
  if ((m = /^post-pentecost-(\d{2})$/.exec(id))) return `Pent${m[1]}-0`;
  if ((m = /^month-week-(\d{3})$/.exec(id))) return `${m[1]}-0`;
  return null;
}

// The 6 Ember-day ids, matching day-label.ts's own EMBER_DAY_NAMES table --
// hardcoded here rather than imported (this script doesn't run through
// Vite/TS) but kept to the same 6 entries, cross-checked against that
// file's own citation of its source paths.
const EMBER_DAY_FILES = {
  'ember-september-wednesday': '093-3',
  'ember-september-friday': '093-5',
  'ember-september-saturday': '093-6',
  'ember-advent-wednesday': 'Adv3-3',
  'ember-advent-friday': 'Adv3-5',
  'ember-advent-saturday': 'Adv3-6',
};

// A couple of temporal ids that are fixed civil-calendar dates, not
// movable -- same Sancti/MM-DD.txt mechanism the sanctoral engine already
// uses, just reached via a temporal id instead of a SaintRecord.
const FIXED_DATE_TEMPORAL_IDS = {
  circumcision: '01-01',
  'vigil-of-christmas': '12-24',
};

function resolveTemporalSource(id) {
  if (EMBER_DAY_FILES[id]) return { kind: 'tempora', file: EMBER_DAY_FILES[id] };
  const derived = derivedTemporalFile(id);
  if (derived) return { kind: 'tempora', file: derived };
  if (FIXED_DATE_TEMPORAL_IDS[id]) return { kind: 'sancti', date: FIXED_DATE_TEMPORAL_IDS[id] };
  return null;
}

// -------------------------------------------------------------------------
// Fixed Ordinary/Psalterium content -- the "why is there stuff we can only
// live-query" answer: there isn't, for most of it. It's not that no static
// source exists, it's that these files (Compline's fixed texts, the
// seasonal hymn doxologies, the year-round canticles) come from a
// DIFFERENT reference tree (Psalterium/Common, Psalterium/Special,
// Psalterium/Doxologies, Psalterium/Psalmorum) this script didn't know
// how to read until now -- every single mapping below was found by
// grepping the actual YAML text for its literal source in that tree and
// reading the surrounding file directly, the same method as everywhere
// else in this script, not inference. `tags: [...]` (plural) means
// several ordinary-prayer tags concatenated into one reading, matching
// how the file itself bundles them (e.g. compline-confiteor is really
// "Adjutorium nostrum" + "Pater noster" back to back).
const FIXED_ORDINARY_MAP = {
  'hymn-doxology-nat': { file: 'Psalterium/Doxologies', tags: ['Nat'] },
  'hymn-doxology-epi': { file: 'Psalterium/Doxologies', tags: ['Epi'] },
  'hymn-doxology-pasch': { file: 'Psalterium/Doxologies', tags: ['Pasch'] },
  'hymn-doxology-asc': { file: 'Psalterium/Doxologies', tags: ['Asc'] },
  'hymn-doxology-pent': { file: 'Psalterium/Doxologies', tags: ['Pent'] },
  'hymn-doxology-corp': { file: 'Psalterium/Doxologies', tags: ['Corp'] },
  'hymn-doxology-heart': { file: 'Psalterium/Doxologies', tags: ['Heart'] },
  'hymn-iam-lucis-orto-sidere': { file: 'Psalterium/Special/Prima Special', tags: ['Hymnus Prima'] },
  'compline-hymn': { file: 'Psalterium/Special/Minor Special', tags: ['Hymnus Completorium'] },
  'compline-hymn-lenten': { file: 'Psalterium/Special/Minor Special', tags: ['Hymnus Completorium Quad'] },
  'compline-lectio-brevis': { file: 'Psalterium/Special/Minor Special', tags: ['Lectio Completorium'] },
  'compline-responsory': { file: 'Psalterium/Special/Minor Special', tags: ['Responsory Completorium'] },
  'compline-versicle': { file: 'Psalterium/Special/Minor Special', tags: ['Versum 4'] },
  'compline-capitulum': { file: 'Psalterium/Special/Minor Special', tags: ['Completorium_'] },
  'compline-confiteor': { file: 'Psalterium/Common/Prayers', tags: ['Adjutorium nostrum', 'Pater noster'] },
  'compline-incipit': { file: 'Psalterium/Common/Prayers', tags: ['Jube domne', 'Benedictio Completorium_'] },
  'compline-conclusio': { file: 'Psalterium/Common/Prayers', tags: ['Domine exaudi', 'Benedicamus Domino', 'Benedictio Completorium2'] },
  'compline-collect': { file: 'Psalterium/Common/Prayers', tags: ['Oratio Visita_'] },
};

// Psalmorum/PsalmNNN.txt canticle files use a different, tag-less plain
// format: an optional `(Canticum ...)` title line, then plain verse
// lines -- not the `[Tag]` bracket structure every other reference file
// in this script parses. `psalmNumber` values confirmed directly (the
// Athanasian Creed's own YAML comment already stated "stored internally
// as Psalm 234"; Benedictus/Nunc Dimittis found the same way, by grepping
// their own opening words across Psalterium/Psalmorum/*.txt).
const CANTICLE_PSALM_NUMBER = {
  benedictus: 231,
  'athanasian-creed': 234,
};

function parsePlainCanticleFile(psalmNumber) {
  let raw;
  try {
    raw = readFileSync(path.join(REF_HORAS, 'Latin', 'Psalterium', 'Psalmorum', `Psalm${psalmNumber}.txt`), 'utf8');
  } catch {
    return null;
  }
  const lines = raw.split('\n').filter((l) => !/^\(.*\)$/.test(l.trim()));
  return normalize(lines.join(' '));
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------


// Files are now named {part}-{id}[-variant] (benedictus-antiphon-st-agatha,
// collect-assumption, commemoration-st-clare...); the checks below were
// written against the older {id}-{part} stems, so every stem read from disk
// is translated back first, and expected paths are built in the new form.
function legacyStem(stem) {
  let m;
  if ((m = /^commemoration-octave-(.+)$/.exec(stem))) return `${m[1]}-octave-commemoration`;
  if ((m = /^commemoration-antiphon-(.+)$/.exec(stem))) return `${m[1]}-commemoration-antiphon`;
  if ((m = /^commemoration-(.+)$/.exec(stem))) return `${m[1]}-commemoration`;
  if ((m = /^magnificat-antiphon-(common-of-.+|proper-to-.+)$/.exec(stem))) return stem;
  if ((m = /^magnificat-antiphon-(.+?)((?:-first|-paschaltide|-d\d+))?$/.exec(stem))) return `${m[1]}-magnificat-antiphon${m[2] ?? ''}`;
  if (/^benedictus-antiphon-(common-of-|proper-to-)/.test(stem)) return stem;
  if ((m = /^benedictus-antiphon-(.+)$/.exec(stem))) return `${m[1]}-antiphon`;
  if (/^collect-c\d/.test(stem)) return stem;
  if ((m = /^collect-(.+?)(-vespers)?$/.exec(stem))) return `${m[1]}-collect${m[2] ?? ''}`;
  return stem;
}

/** The file stem for a propers id + legacy suffix, in the new naming. */
function newStemFor(propers, suffix) {
  if (suffix === '-antiphon') return `benedictus-antiphon-${propers}`;
  if (suffix === '-magnificat-antiphon') return `magnificat-antiphon-${propers}`;
  if (suffix === '-collect') return `collect-${propers}`;
  if (suffix === '-commemoration') return `commemoration-${propers}`;
  return `${propers}${suffix}`;
}

function stripPropersSuffix(stem) {
  for (const suffix of PROPERS_SUFFIXES) {
    if (stem.endsWith(suffix)) return stem.slice(0, -suffix.length);
  }
  return null;
}

/** Returns `{ id, tags }` for the first matching prefix rule, or null. */
function matchIdKeyedPrefix(stem) {
  for (const rule of ID_KEYED_PREFIXES) {
    if (stem.startsWith(rule.prefix)) return { id: stem.slice(rule.prefix.length), tags: rule.tags };
  }
  return null;
}

function makeReferenceCache() {
  const cache = new Map(); // "track/date" -> { la, en } parsed maps
  return {
    get(track, date) {
      const key = `${track}/${date}`;
      if (!cache.has(key)) {
        cache.set(key, {
          la: parseReferenceFile(path.join(REF_HORAS, 'Latin', track, `${date}.txt`)),
          en: parseReferenceFile(path.join(REF_HORAS, 'English', track, `${date}.txt`)),
        });
      }
      return cache.get(key);
    },
  };
}

/** The single-tag verify engine (common/'s original logic, unchanged
 * behavior) -- factored out so it's reusable for common/'s id-keyed files
 * and temporal/'s (which share the exact same text.la/text.en/status
 * shape and one-tag-per-file citation style). Returns a `{ bucket, entry }`
 * pair ready to push into the shared buckets object. */
function verifyAgainstTags(cache, relPath, comment, yamlLa, yamlEn, sourceFiles, tags) {
  const attempts = [];
  let anyMatch = null;
  let anyCaseOnlyMatch = null;
  let anyUnresolvable = false;
  let anyTagFound = false;
  let anyFileFound = false;

  for (const { track, date: srcDate } of sourceFiles) {
    const parsed = cache.get(track, srcDate);
    if (parsed.la === null && parsed.en === null) {
      attempts.push({ track, date: srcDate, status: 'FILE-NOT-FOUND' });
      continue;
    }
    anyFileFound = true;

    for (const tag of tags) {
      const laEntries = parsed.la?.get(tag);
      const enEntries = parsed.en?.get(tag);
      if (!laEntries && !enEntries) {
        attempts.push({ track, date: srcDate, tag, status: 'TAG-NOT-FOUND' });
        continue;
      }
      anyTagFound = true;

      const laCandidates = laEntries ?? [];
      const enCandidates = enEntries ?? [];
      const n = Math.max(laCandidates.length, enCandidates.length, 1);
      for (let i = 0; i < n; i++) {
        const laEntry = laCandidates[i];
        const enEntry = enCandidates[i];
        if (laEntry?.unresolvableInclude || enEntry?.unresolvableInclude) {
          anyUnresolvable = true;
          continue;
        }
        const srcLa = normalize(laEntry?.text ?? '');
        const srcEn = normalize(enEntry?.text ?? '');
        const laExact = laEntry ? srcLa === yamlLa : null;
        const enExact = enEntry ? srcEn === yamlEn : null;
        const laContains = laEntry && !laExact ? yamlLa.includes(srcLa) && srcLa.length > 0 : false;
        const enContains = enEntry && !enExact ? yamlEn.includes(srcEn) && srcEn.length > 0 : false;
        const laCaseOnly = laEntry && !laExact ? srcLa.toLowerCase() === yamlLa.toLowerCase() : false;
        const enCaseOnly = enEntry && !enExact ? srcEn.toLowerCase() === yamlEn.toLowerCase() : false;

        const bothExact = (laExact ?? true) && (enExact ?? true) && (laEntry || enEntry);
        if (bothExact) {
          anyMatch = { track, date: srcDate, tag, subIndex: i, kind: 'exact' };
          break;
        }
        const bothOkWithContains =
          (laExact || laContains || !laEntry) && (enExact || enContains || !enEntry) && (laEntry || enEntry);
        if (bothOkWithContains && (laContains || enContains)) {
          anyMatch = { track, date: srcDate, tag, subIndex: i, kind: 'contains' };
          break;
        }
        const bothCaseOk = (laExact || laCaseOnly || !laEntry) && (enExact || enCaseOnly || !enEntry);
        if (bothCaseOk && (laCaseOnly || enCaseOnly)) {
          anyCaseOnlyMatch = anyCaseOnlyMatch ?? { track, date: srcDate, tag, subIndex: i, srcLa, srcEn };
        }
        attempts.push({
          track,
          date: srcDate,
          tag,
          subIndex: i,
          status: 'checked',
          srcLa,
          srcEn,
          simLa: yamlLa && srcLa ? similarity(yamlLa, srcLa) : null,
          simEn: yamlEn && srcEn ? similarity(yamlEn, srcEn) : null,
        });
      }
      if (anyMatch) break;
    }
    if (anyMatch) break;
  }

  const entry = { file: relPath, comment, yamlLa, yamlEn, tags, sourceFiles, attempts };

  if (anyMatch) return { bucket: 'MATCH', entry: { ...entry, matchedOn: anyMatch } };
  if (anyCaseOnlyMatch) return { bucket: 'MISMATCH-CASE-ONLY', entry: { ...entry, matchedOn: anyCaseOnlyMatch } };
  if (!anyFileFound) return { bucket: 'FILE-NOT-FOUND', entry };
  if (!anyTagFound) return { bucket: 'TAG-NOT-FOUND', entry };
  if (anyUnresolvable && attempts.filter((a) => a.status === 'checked').length === 0) {
    return { bucket: 'UNRESOLVABLE-INCLUDE', entry };
  }
  entry.attempts = attempts
    .filter((a) => a.status === 'checked')
    .sort((x, y) => (y.simLa ?? 0) + (y.simEn ?? 0) - ((x.simLa ?? 0) + (x.simEn ?? 0)));
  return { bucket: 'MISMATCH', entry };
}

function push(buckets, result) {
  buckets[result.bucket].push(result.entry);
}

// Reference-file cache dedicated to the fixed Ordinary/Psalterium
// lookups -- keyed by the FIXED_ORDINARY_MAP `file` value directly (a
// full relative path, not a `${track}/${date}` pair the way Sancti/
// Commune/Tempora files are addressed), since there are only ~20 of
// these total and each is looked up once.
const ordinaryFileCache = new Map();
function getOrdinaryParsed(relFile) {
  if (!ordinaryFileCache.has(relFile)) {
    ordinaryFileCache.set(relFile, {
      la: parseReferenceFile(path.join(REF_HORAS, 'Latin', `${relFile}.txt`)),
      en: parseReferenceFile(path.join(REF_HORAS, 'English', `${relFile}.txt`)),
    });
  }
  return ordinaryFileCache.get(relFile);
}

/** Verifies a FIXED_ORDINARY_MAP entry -- one or several tags from a
 * single named Psalterium file, concatenated in the given order (matching
 * how the YAML file itself bundles them, e.g. compline-confiteor really
 * is "Adjutorium nostrum" then "Pater noster" back to back) and compared
 * as one block, same normalize/exact/contains tiers as everywhere else. */
function verifyFixedOrdinary(relPath, comment, yamlLa, yamlEn, ordinary) {
  const parsed = getOrdinaryParsed(ordinary.file);
  if (parsed.la === null && parsed.en === null) {
    return { bucket: 'FILE-NOT-FOUND', entry: { file: relPath, comment, sourceFiles: [{ track: '', date: ordinary.file }] } };
  }
  const srcLa = combineRange(parsed.la, ordinary.tags);
  const srcEn = combineRange(parsed.en, ordinary.tags);
  if (srcLa === null && srcEn === null) {
    return {
      bucket: 'TAG-NOT-FOUND',
      entry: { file: relPath, comment, tags: ordinary.tags, sourceFiles: [{ track: '', date: ordinary.file }] },
    };
  }
  const nLa = srcLa !== null ? normalize(srcLa) : null;
  const nEn = srcEn !== null ? normalize(srcEn) : null;
  const laMatch = nLa === null || nLa === yamlLa || (yamlLa.includes(nLa) && nLa.length > 0);
  const enMatch = nEn === null || nEn === yamlEn || (yamlEn.includes(nEn) && nEn.length > 0);
  const matchedOn = { track: '', date: ordinary.file, tag: ordinary.tags.join('+'), kind: 'multi-lesson' };
  if (laMatch && enMatch) return { bucket: 'MATCH', entry: { file: relPath, matchedOn } };
  return {
    bucket: 'MISMATCH',
    entry: {
      file: relPath,
      comment,
      tags: ordinary.tags,
      yamlLa,
      yamlEn,
      sourceFiles: [{ track: '', date: ordinary.file }],
      attempts: [
        {
          track: '',
          date: ordinary.file,
          tag: ordinary.tags.join('+'),
          status: 'checked',
          srcLa: nLa ?? '',
          srcEn: nEn ?? '',
          simLa: yamlLa && nLa ? similarity(yamlLa, nLa) : null,
          simEn: yamlEn && nEn ? similarity(yamlEn, nEn) : null,
        },
      ],
    },
  };
}

/** Verifies a year-round canticle (Benedictus, the Athanasian Creed...)
 * against its own `Psalterium/Psalmorum/PsalmNNN.txt` -- a different,
 * tag-less plain-verse format (see parsePlainCanticleFile), so only
 * `text.la` is checked (no English mirror exists in that tree for these
 * -- the Latin-only comparison is still real signal). */
function verifyCanticle(relPath, comment, yamlLa, psalmNumber) {
  const srcLa = parsePlainCanticleFile(psalmNumber);
  const sourceFiles = [{ track: 'Psalterium/Psalmorum', date: `Psalm${psalmNumber}` }];
  if (srcLa === null) return { bucket: 'FILE-NOT-FOUND', entry: { file: relPath, comment, sourceFiles } };
  const laMatch = srcLa === yamlLa || (yamlLa.includes(srcLa) && srcLa.length > 0);
  const matchedOn = { track: 'Psalterium/Psalmorum', date: `Psalm${psalmNumber}`, tag: 'canticle', kind: 'multi-lesson' };
  if (laMatch) return { bucket: 'MATCH', entry: { file: relPath, matchedOn } };
  return {
    bucket: 'MISMATCH',
    entry: {
      file: relPath,
      comment,
      tags: ['canticle'],
      yamlLa,
      yamlEn: '',
      sourceFiles,
      attempts: [
        {
          track: 'Psalterium/Psalmorum',
          date: `Psalm${psalmNumber}`,
          tag: 'canticle',
          status: 'checked',
          srcLa,
          srcEn: '',
          simLa: similarity(yamlLa, srcLa),
          simEn: null,
        },
      ],
    },
  };
}

// -------------------------------------------------------------------------
// Pass 1: common/*.yml -- propers-suffix (saint's own antiphon/collect/
// commemoration) and id-keyed (capitulum/hymn/responsory/versicle/
// invitatory) files.
// -------------------------------------------------------------------------

function suffixOf(stem, stripped) {
  return stripped === null ? null : stem.slice(stripped.length);
}

// Generic Common-category files (`common-of-a-confessor`, etc.) share one
// underlying `Commune/CN.txt` file across every part-type (antiphon,
// magnificat-antiphon, capitulum, hymn...) -- most individual files only
// document that via a "live query" attestation, but a substantial minority
// (102 of 318 checked) DO cite the real `CN.txt` explicitly somewhere in
// this family. Rather than derive that mapping from scratch (guessing is
// exactly what this whole tool exists to avoid), harvest it from the
// files that already state it, then apply it to every sibling part-type
// sharing the same category name -- a real, cited fact, not a guess.
//
// Only the tag mappings individually confirmed against a real Commune
// file (`C5.txt`, read directly while building this) are included:
// Benedictus=[Ant 2], Magnificat=[Ant 3], Lauds capitulum=[Capitulum
// Laudes], Sext/None capitulum=[Capitulum Sexta]/[Capitulum Nona], Lauds
// hymn=[Hymnus Laudes] (secular) or [HymnusM Laudes] (Monastic, both
// tried). NOT included, and left to citation-only checking: Vespers hymn,
// Matins hymn/invitatory, minor-hour (Prime/Terce/Sext/None) antiphons,
// responsories, versicles -- C5.txt has no `[Hymnus Vespera]`/`[Invit]`
// tag at all (Vespers hymn and Matins invitatory for a Common category
// come from somewhere else this script doesn't know), and the minor-hour
// antiphon's own tag wasn't confirmed before running out of scope for
// this pass -- guessing here risks systematic false MISMATCHes across
// dozens of files, worse than leaving them uncited.
const COMMUNE_PART_RULES = [
  { re: /^benedictus-antiphon-common-of-(.+)$/, tags: ['Ant 2'] },
  { re: /^magnificat-antiphon-common-of-(.+)$/, tags: ['Ant 3'] },
  { re: /^common-of-(.+)-commemoration-antiphon$/, tags: ['Ant 2'] },
  { re: /^lauds-capitulum-common-of-(.+)$/, tags: ['Capitulum Laudes'] },
  { re: /^sext-capitulum-common-of-(.+)$/, tags: ['Capitulum Sexta'] },
  { re: /^none-capitulum-common-of-(.+)$/, tags: ['Capitulum Nona'] },
  { re: /^lauds-hymn-common-of-(.+)$/, tags: ['Hymnus Laudes', 'HymnusM Laudes'] },
];
// Matches ANY part-type sharing the "common-of-X" category name, purely
// to harvest an already-cited C-number regardless of which part happened
// to document it.
const ANY_COMMON_OF_RE = /common-of-(.+?)(?:-commemoration-antiphon)?$/;

function buildCommuneCategoryMap(files) {
  const categoryToCnumber = new Map();
  for (const filename of files) {
    const stem = legacyStem(filename.slice(0, -4));
    const m = ANY_COMMON_OF_RE.exec(stem);
    if (!m) continue;
    const category = m[1];
    if (categoryToCnumber.has(category)) continue;
    const raw = readFileSync(path.join(COMMON_DIR, filename), 'utf8');
    const comment = extractHeaderComment(raw);
    const { sourceFiles } = extractCitations(comment);
    const commune = sourceFiles.find((s) => s.track === 'Commune');
    if (commune) categoryToCnumber.set(category, commune.date);
  }
  return categoryToCnumber;
}

// `collect-cN.yml` files name their own Commune file directly in the
// filename (no category lookup needed) -- e.g. `collect-c2a` ->
// `Commune/C2a.txt`, tag `[Oratio]`.
const COLLECT_CN_RE = /^collect-(c\d{1,2}[a-zA-Z]*(?:-\d)?[a-zA-Z]*)$/;

// A real pattern found while building this: a letter-suffixed Commune
// variant (`C2a.txt`, `C4a.txt`...) is often a stripped Mass-propers-only
// excerpt with NO Office tags at all (confirmed directly: `C4a.txt` has no
// `[Capitulum Laudes]`, while the base `C4.txt` does, and a real file's
// own text was confirmed byte-identical to `C4.txt`'s tag, not `C4a`'s
// absence). Any Commune candidate therefore also tries its base
// (unsuffixed) variant as a fallback -- this can only broaden what's
// checked toward the fuller, more likely-correct source, never narrow it.
function withCommuneBaseFallback(sourceFiles) {
  const out = [...sourceFiles];
  for (const s of sourceFiles) {
    if (s.track !== 'Commune') continue;
    const m = /^(C\d{1,2})[a-zA-Z].*$/.exec(s.date);
    if (m && !out.some((o) => o.track === 'Commune' && o.date === m[1])) out.push({ track: 'Commune', date: m[1] });
  }
  return out;
}

function auditCommon(cache, byPropers, byId, idToDate, buckets, counts) {
  const files = readdirSync(COMMON_DIR).filter((f) => f.endsWith('.yml'));
  counts.commonTotal = files.length;
  const communeCategoryMap = buildCommuneCategoryMap(files);

  for (const filename of files) {
    const filePath = path.join(COMMON_DIR, filename);
    const raw = readFileSync(filePath, 'utf8');
    const doc = loadYaml(filePath);
    const stem = legacyStem(filename.slice(0, -4));
    const relPath = `src/data/propers/common/${filename}`;
    const comment = extractHeaderComment(raw);
    const flatComment = comment.replace(/\s+/g, ' ');
    const { sourceFiles, tags } = extractCitations(comment);
    const isLiveQuery = LIVE_QUERY_RE.test(flatComment);
    const yamlLa = normalize(doc?.text?.la ?? '');
    const yamlEn = normalize(doc?.text?.en ?? '');

    const propersStem = stripPropersSuffix(stem);
    const idMatch = propersStem ? null : matchIdKeyedPrefix(stem);
    // `propers` is many-to-one (see loadSaintRecords's own doc comment) --
    // candidates is every saint sharing this propers stem; each with a
    // real calendar date is a distinct thing to try, same "try each until
    // one matches" shape verifyAgainstTags already applies to multiple
    // cited source files.
    const candidates = propersStem ? (byPropers.get(propersStem) ?? []) : [];
    const idSaint = !propersStem && idMatch ? byId.get(idMatch.id) : undefined;
    const saint = candidates[0] ?? idSaint;
    const candidateDates = [...new Set(candidates.map((s) => idToDate.get(s.id)).filter(Boolean))];
    const date = idSaint ? idToDate.get(idSaint.id) : candidateDates[0];

    // Not matched to a real, calendar-mapped saint -- either a generic
    // Common-category file (no single saint/date to derive from) or an
    // authored-but-unwired saint. Either way, still try citation-based
    // verification (a generic file cites a real Commune/CN.txt, per the
    // corpus's own convention -- these were wrongly skipped entirely
    // before this fix) before giving up on it.
    if (!saint || !date) {
      if (sourceFiles.length > 0 && tags.length > 0) {
        push(buckets, verifyAgainstTags(cache, relPath, comment, yamlLa, yamlEn, sourceFiles, tags));
        counts.commonScanned++;
        continue;
      }
      // No usable citation of its own -- try deriving one: either this
      // exact file's own `collect-cN` filename, or (for the various
      // `<part>-common-of-<category>` families) the category's C-number
      // harvested from a SIBLING part-type file that does cite it.
      const collectMatch = COLLECT_CN_RE.exec(stem);
      if (collectMatch) {
        const cnumber = collectMatch[1].replace(/^c/, 'C');
        const result = verifyAgainstTags(
          cache,
          relPath,
          comment,
          yamlLa,
          yamlEn,
          withCommuneBaseFallback([{ track: 'Commune', date: cnumber }]),
          ['Oratio'],
        );
        result.entry.derivedSource = true;
        push(buckets, result);
        counts.commonScanned++;
        continue;
      }
      const partRule = COMMUNE_PART_RULES.find((r) => r.re.test(stem));
      const category = partRule?.re.exec(stem)?.[1];
      const cnumber = category ? communeCategoryMap.get(category) : undefined;
      if (partRule && cnumber) {
        const result = verifyAgainstTags(
          cache,
          relPath,
          comment,
          yamlLa,
          yamlEn,
          withCommuneBaseFallback([{ track: 'Commune', date: cnumber }]),
          partRule.tags,
        );
        result.entry.derivedSource = true;
        push(buckets, result);
        counts.commonScanned++;
        continue;
      }
      const ordinary = FIXED_ORDINARY_MAP[stem];
      if (ordinary) {
        push(buckets, verifyFixedOrdinary(relPath, comment, yamlLa, yamlEn, ordinary));
        counts.commonScanned++;
        continue;
      }
      const psalmNumber = CANTICLE_PSALM_NUMBER[stem];
      if (psalmNumber) {
        push(buckets, verifyCanticle(relPath, comment, yamlLa, psalmNumber));
        counts.commonScanned++;
        continue;
      }
      counts.commonSkip++;
      continue;
    }
    counts.commonScanned++;

    if (sourceFiles.length > 0 && tags.length > 0) {
      push(buckets, verifyAgainstTags(cache, relPath, comment, yamlLa, yamlEn, sourceFiles, tags));
      continue;
    }

    // No usable citation -- for a propers-suffix file (a saint's own
    // antiphon/magnificat-antiphon/collect), the expected tag is already
    // known (SUFFIX_TO_TAG); try EVERY candidate saint's own date (plural,
    // not just the first) against Sancti/MM-DD.txt, same derived-fallback
    // pattern as temporal/.
    const suffix = suffixOf(stem, propersStem);
    if (suffix && SUFFIX_TO_TAG[suffix]) {
      const derivedSourceFiles = (candidateDates.length > 0 ? candidateDates : [date]).map((d) => ({
        track: 'Sancti',
        date: d,
      }));
      const result = verifyAgainstTags(cache, relPath, comment, yamlLa, yamlEn, derivedSourceFiles, [SUFFIX_TO_TAG[suffix]]);
      result.entry.derivedSource = true;
      push(buckets, result);
      continue;
    }

    // An id-keyed capitulum/hymn file (`lauds-capitulum-<id>.yml` etc.) is
    // wired as a per-saint override, but a real, confirmed pattern (Chair
    // of St. Peter at Antioch: her own `lauds-capitulum` text is byte-
    // identical to Commune/C4.txt's `[Capitulum Laudes]`, not anything in
    // her own Sancti/02-22.txt, which has no Capitulum tag at all) shows
    // the override file often just holds a verbatim copy of the saint's
    // own Common category's text, not something unique to her. So: try
    // BOTH the saint's own date (in case she genuinely has her own proper
    // text) AND her `minorHoursCommon`/`common` category's Commune file
    // (the more likely real source when she doesn't) -- same "try every
    // candidate" shape verifyAgainstTags already applies elsewhere.
    if (idMatch?.tags) {
      const ownDateFiles = (candidateDates.length > 0 ? candidateDates : [date]).map((d) => ({ track: 'Sancti', date: d }));
      const commonField = (idSaint ?? saint)?.minorHoursCommon ?? (idSaint ?? saint)?.common;
      const category = commonField?.replace(/^common-of-/, '');
      const commonCnumber = category ? communeCategoryMap.get(category) : undefined;
      const communeFiles = commonCnumber ? withCommuneBaseFallback([{ track: 'Commune', date: commonCnumber }]) : [];
      const derivedSourceFiles = [...ownDateFiles, ...communeFiles];
      if (derivedSourceFiles.length === 0) {
        buckets['saint-specific-uncited'].push({ file: relPath, saintId: saint.id, date });
        continue;
      }
      const result = verifyAgainstTags(cache, relPath, comment, yamlLa, yamlEn, derivedSourceFiles, idMatch.tags);
      result.entry.derivedSource = true;
      push(buckets, result);
      continue;
    }

    if (sourceFiles.length > 0) {
      buckets['source-cited-no-tag'].push({ file: relPath, comment, sourceFiles });
    } else if (isLiveQuery) {
      buckets['live-query-unverifiable'].push({ file: relPath, comment });
    } else if (SOURCE_MENTION_RE.test(flatComment)) {
      buckets['saint-specific-uncited-low-confidence'].push({ file: relPath, comment, saintId: saint.id, date });
    } else {
      buckets['saint-specific-uncited'].push({ file: relPath, saintId: saint.id, date });
    }
  }
}

// -------------------------------------------------------------------------
// Pass 2: coverage -- does an expected file exist at all, for every part
// the saint's own source genuinely has real content for. Complements the
// fidelity checks above: those only ever look at files that exist; this
// is the only pass that can catch a saint whose real content was never
// authored at all, silently covered by resolve-common.ts's Common/ferial
// fallback (the class of gap that motivated adding this pass -- see the
// conversation this script came out of, 49 candidates found in a
// spot-check before this was built into the real tool).
// -------------------------------------------------------------------------

function auditCoverage(byPropers, idToDate, buckets, counts) {
  // `propers` is many-to-one (loadSaintRecords) -- try each candidate
  // saint sharing this stem until one has a real Sancti file to check.
  for (const [propers, candidates] of byPropers) {
    let date, srcText;
    for (const candidate of candidates) {
      const candidateDate = idToDate.get(candidate.id);
      if (!candidateDate) continue;
      try {
        srcText = readFileSync(path.join(REF_HORAS, 'Latin', 'Sancti', `${candidateDate}.txt`), 'utf8');
        date = candidateDate;
        break;
      } catch {
        continue;
      }
    }
    if (!date) continue; // no candidate has both a real date and a Sancti file
    const saint = candidates.find((c) => idToDate.get(c.id) === date);
    counts.coverageChecked++;
    for (const [suffix, tag] of Object.entries(SUFFIX_TO_TAG)) {
      const hasTag = new RegExp(`^\\[${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'm').test(srcText);
      if (!hasTag) continue;
      const expectedPath = path.join(COMMON_DIR, `${newStemFor(propers, suffix)}.yml`);
      if (!existsSync(expectedPath)) {
        buckets['MISSING-FILE'].push({
          file: `src/data/propers/common/${newStemFor(propers, suffix)}.yml`,
          saintId: saint.id,
          date,
          tag,
          expectedSuffix: suffix,
        });
      }
    }
  }
}

// -------------------------------------------------------------------------
// Pass 3: temporal/*.yml -- same single-tag shape as common/, but keyed to
// a temporal id (advent-1, post-pentecost-10, ...) instead of a
// SaintRecord. Prefers an explicit citation when the header has one (same
// regex as common/); falls back to the derivedTemporalFile() table when
// it doesn't, so a "live query only" file can still get a real static
// check when its id is one of the mapped families.
// -------------------------------------------------------------------------

function auditTemporal(cache, buckets, counts) {
  const files = readdirSync(TEMPORAL_DIR).filter((f) => f.endsWith('.yml'));
  counts.temporalTotal = files.length;

  for (const filename of files) {
    const filePath = path.join(TEMPORAL_DIR, filename);
    const raw = readFileSync(filePath, 'utf8');
    const doc = loadYaml(filePath);
    const stem = legacyStem(filename.slice(0, -4));
    const id = stripPropersSuffix(stem) ?? stem.replace(/-benedictus-antiphon$/, '');
    const suffix = stem.slice(id.length);
    const tagFromSuffix = SUFFIX_TO_TAG[suffix] ?? (suffix === '-benedictus-antiphon' ? 'Ant 2' : null);

    const comment = extractHeaderComment(raw);
    const flatComment = comment.replace(/\s+/g, ' ');
    const { sourceFiles, tags } = extractCitations(comment);
    const isLiveQuery = LIVE_QUERY_RE.test(flatComment);
    const relPath = `src/data/propers/temporal/${filename}`;
    const yamlLa = normalize(doc?.text?.la ?? '');
    const yamlEn = normalize(doc?.text?.en ?? '');
    counts.temporalScanned++;

    if (sourceFiles.length > 0 && tags.length > 0) {
      push(buckets, verifyAgainstTags(cache, relPath, comment, yamlLa, yamlEn, sourceFiles, tags));
      continue;
    }

    // No usable citation -- try the derived-file table before giving up.
    // The Ant2=Benedictus/Ant3=Magnificat mapping is confirmed broadly
    // (Advent/Epiphany/post-Pentecost/month-week Sundays all carry both
    // tags) but NOT universal -- e.g. Quad1-0.txt (Lent 1) has only a bare
    // [Ant 1], no [Ant 2]/[Ant 3] at all, a real exception found while
    // building this. A derived-source MISMATCH is therefore lower
    // confidence than a cited-source one: it could mean the YAML is wrong,
    // OR it could mean this file's own tag layout doesn't follow the usual
    // convention. Flagged inline in the report rather than silently
    // trusted at the same confidence as an explicit citation.
    const derived = tagFromSuffix ? resolveTemporalSource(id) : null;
    if (derived) {
      const derivedSourceFiles =
        derived.kind === 'tempora' ? [{ track: 'Tempora', date: derived.file }] : [{ track: 'Sancti', date: derived.date }];
      const result = verifyAgainstTags(cache, relPath, comment, yamlLa, yamlEn, derivedSourceFiles, [tagFromSuffix]);
      result.entry.derivedSource = true;
      push(buckets, result);
      continue;
    }

    if (sourceFiles.length > 0) {
      buckets['source-cited-no-tag'].push({ file: relPath, comment, sourceFiles });
    } else if (isLiveQuery) {
      buckets['live-query-unverifiable'].push({ file: relPath, comment });
    } else {
      buckets['temporal-uncited-unmapped'].push({ file: relPath, comment, id });
    }
  }
}

// -------------------------------------------------------------------------
// Parsing helpers for Tempora/*.txt -- the same reference-.txt parser
// works verbatim (Tempora files use the identical [Tag] bracket format),
// just under a different subdirectory than Sancti/SanctiM. `cache.get`
// already takes a `track` argument, so 'Tempora' works as-is.
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// Pass 4/5: nocturn-readings/ and octave-readings/ -- the multi-lesson
// engine. Both directories collapse several source Lectio tags into one
// continuous reading (this project's own authoring convention); verified
// by re-combining the same tags from source and comparing, rather than a
// single-tag lookup.
// -------------------------------------------------------------------------

/** Resolves a nocturn-readings/octave-readings id to a `{track, date}}`
 * candidate source, trying (in order): a real SaintRecord + calendar date,
 * then the temporal-id derivation table. Returns null if neither applies
 * (e.g. `month-week-*`/`post-pentecost-*` id math needs no help --
 * derivedTemporalFile already covers those -- but a handful of ids in
 * these directories are neither a saint nor a mapped temporal family). */
function resolveReadingIdSource(id, byId, idToDate) {
  const saint = byId.get(id);
  if (saint) {
    const date = idToDate.get(saint.id);
    if (date) return { track: 'Sancti', date };
  }
  const derived = resolveTemporalSource(id);
  if (derived) {
    return derived.kind === 'tempora' ? { track: 'Tempora', date: derived.file } : { track: 'Sancti', date: derived.date };
  }
  return null;
}

function auditNocturnReadings(cache, byId, idToDate, buckets, counts) {
  const files = readdirSync(NOCTURN_READINGS_DIR).filter((f) => f.endsWith('.yml'));
  counts.nocturnTotal = files.length;

  for (const filename of files) {
    const filePath = path.join(NOCTURN_READINGS_DIR, filename);
    const raw = readFileSync(filePath, 'utf8');
    const doc = loadYaml(filePath);
    const comment = extractHeaderComment(raw);
    const relPath = `src/data/propers/nocturn-readings/${filename}`;
    const source = resolveReadingIdSource(doc.id, byId, idToDate);
    const ranges = extractLectioRanges(comment);
    const nonGospelReadings = (doc.readings ?? []).filter((r) => !r.isGospel);
    counts.nocturnScanned++;

    if (!source) {
      buckets['reading-id-unmapped'].push({ file: relPath, id: doc.id, comment });
      continue;
    }
    const parsed = cache.get(source.track, source.date);
    if (parsed.la === null && parsed.en === null) {
      buckets['FILE-NOT-FOUND'].push({ file: relPath, comment, sourceFiles: [source] });
      continue;
    }
    if (ranges.length === 0) {
      buckets['reading-no-range-cited'].push({ file: relPath, comment, source });
      continue;
    }

    // Zip ranges to non-Gospel readings in appearance order -- best-effort,
    // stated limitation (see extractLectioRanges's own doc comment).
    const n = Math.min(ranges.length, nonGospelReadings.length);
    for (let i = 0; i < n; i++) {
      const reading = nonGospelReadings[i];
      const range = ranges[i];
      const combined = combineRangeBilingual(parsed.la, parsed.en, range);
      const yamlLa = normalize(reading.text?.la ?? '');
      const yamlEn = normalize(reading.text?.en ?? '');
      const entryBase = { file: relPath, comment, range: range.join('/'), nocturn: reading.nocturn, source };

      if (!combined) {
        buckets['UNRESOLVABLE-INCLUDE'].push({ ...entryBase, tags: range, yamlLa, yamlEn, sourceFiles: [source], attempts: [] });
        continue;
      }
      const srcLa = normalize(combined.la ?? '');
      const srcEn = normalize(combined.en ?? '');
      const laMatch = !combined.la || srcLa === yamlLa || (yamlLa.includes(srcLa) && srcLa.length > 0);
      const enMatch = !combined.en || srcEn === yamlEn || (yamlEn.includes(srcEn) && srcEn.length > 0);

      if (laMatch && enMatch) {
        buckets.MATCH.push({
          file: relPath,
          matchedOn: { track: source.track, date: source.date, tag: range.join('-'), kind: 'multi-lesson' },
        });
      } else {
        buckets.MISMATCH.push({
          ...entryBase,
          tags: range,
          yamlLa,
          yamlEn,
          sourceFiles: [source],
          attempts: [
            {
              track: source.track,
              date: source.date,
              tag: range.join('-'),
              status: 'checked',
              srcLa,
              srcEn,
              simLa: yamlLa && srcLa ? similarity(yamlLa, srcLa) : null,
              simEn: yamlEn && srcEn ? similarity(yamlEn, srcEn) : null,
            },
          ],
        });
      }

      // Responsory: compare the reading's own inline field (when present)
      // against the range's first tag's own ResponsoryN, per this
      // project's "first responsory following the reading" convention.
      if (reading.responsory?.la || reading.responsory?.en) {
        const srcResp = combineResponsory(parsed.la, parsed.en, combined.responsoryTag);
        if (srcResp) {
          // Both sides label-stripped before comparing -- the YAML's own
          // responsory field is a full "R. ...\nV. ...\nR. ..." display
          // block (labels and a repeated clause), the source is bare
          // wording (see combineResponsory) -- compare on wording alone,
          // via containment (the YAML's repeated closing clause means it's
          // never a byte-for-byte match with the source's single mention).
          const yLa = normalize(stripResponsoryLabels(reading.responsory.la ?? ''));
          const yEn = normalize(stripResponsoryLabels(reading.responsory.en ?? ''));
          const sLa = normalize(srcResp.la ?? '');
          const sEn = normalize(srcResp.en ?? '');
          const respLaMatch = !sLa || yLa.includes(sLa) || sLa === yLa;
          const respEnMatch = !sEn || yEn.includes(sEn) || sEn === yEn;
          if (!respLaMatch && !respEnMatch) {
            buckets['RESPONSORY-MISMATCH'].push({
              file: relPath,
              nocturn: reading.nocturn,
              tag: combined.responsoryTag,
              source,
              yamlResponsory: reading.responsory,
              sourceResponsory: srcResp,
            });
          }
        }
      }
    }
  }
}

function auditOctaveReadings(cache, byId, idToDate, buckets, counts) {
  const files = readdirSync(OCTAVE_READINGS_DIR).filter((f) => f.endsWith('.yml'));
  counts.octaveTotal = files.length;

  for (const filename of files) {
    const filePath = path.join(OCTAVE_READINGS_DIR, filename);
    const raw = readFileSync(filePath, 'utf8');
    const doc = loadYaml(filePath);
    const comment = extractHeaderComment(raw);
    const relPath = `src/data/propers/octave-readings/${filename}`;
    counts.octaveScanned++;

    if (doc.passages) {
      // Scripture-sourced -- verified by construction against the
      // scripture store already (resolvePassages reads it directly); nothing
      // for THIS script to re-derive without duplicating that store. Not a
      // gap, just genuinely out of this engine's job (it audits reference-
      // engine citations, not this app's own already-typed scripture data).
      buckets['octave-scripture-not-checked'].push({ file: relPath });
      continue;
    }

    const m = /^(.+)-octave-day-(\d+)$/.exec(doc.id ?? '');
    const octaveId = m?.[1];
    const dayNumber = m ? Number(m[2]) : null;
    const { sourceFiles, tags } = extractCitations(comment);
    const ranges = extractLectioRanges(comment);

    let source = sourceFiles[0] ? { track: sourceFiles[0].track, date: sourceFiles[0].date } : null;
    if (!source && octaveId && dayNumber) {
      const startDate = idToDate.get(octaveId);
      if (startDate) {
        const [y, mo, d] = startDate.split('-').map(Number);
        const dt = new Date(Date.UTC(y, mo - 1, d));
        dt.setUTCDate(dt.getUTCDate() + dayNumber - 1);
        const derivedDate = `${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
        source = { track: 'Sancti', date: derivedDate };
      }
    }

    if (!source) {
      buckets['reading-id-unmapped'].push({ file: relPath, id: doc.id, comment });
      continue;
    }
    const parsed = cache.get(source.track, source.date);
    if (parsed.la === null && parsed.en === null) {
      buckets['FILE-NOT-FOUND'].push({ file: relPath, comment, sourceFiles: [source] });
      continue;
    }
    if (ranges.length === 0) {
      buckets['reading-no-range-cited'].push({ file: relPath, comment, source });
      continue;
    }

    const range = ranges[0];
    const combined = combineRangeBilingual(parsed.la, parsed.en, range);
    const yamlLa = normalize(doc.text?.la ?? '');
    const yamlEn = normalize(doc.text?.en ?? '');

    if (!combined) {
      buckets['UNRESOLVABLE-INCLUDE'].push({ file: relPath, comment, tags: range, yamlLa, yamlEn, sourceFiles: [source], attempts: [] });
      continue;
    }
    const srcLa = normalize(combined.la ?? '');
    const srcEn = normalize(combined.en ?? '');
    const laMatch = !combined.la || srcLa === yamlLa || (yamlLa.includes(srcLa) && srcLa.length > 0);
    const enMatch = !combined.en || srcEn === yamlEn || (yamlEn.includes(srcEn) && srcEn.length > 0);

    if (laMatch && enMatch) {
      buckets.MATCH.push({ file: relPath, matchedOn: { track: source.track, date: source.date, tag: range.join('-'), kind: 'multi-lesson' } });
    } else {
      buckets.MISMATCH.push({
        file: relPath,
        comment,
        tags: range,
        yamlLa,
        yamlEn,
        sourceFiles: [source],
        attempts: [
          {
            track: source.track,
            date: source.date,
            tag: range.join('-'),
            status: 'checked',
            srcLa,
            srcEn,
            simLa: yamlLa && srcLa ? similarity(yamlLa, srcLa) : null,
            simEn: yamlEn && srcEn ? similarity(yamlEn, srcEn) : null,
          },
        ],
      });
    }
  }
}

function main() {
  const { byPropers, byId } = loadSaintRecords();
  const idToDate = loadSanctoralCalendar();
  const cache = makeReferenceCache();

  const buckets = {
    MISMATCH: [],
    'RESPONSORY-MISMATCH': [],
    'MISSING-FILE': [],
    'TAG-NOT-FOUND': [],
    'FILE-NOT-FOUND': [],
    'MISMATCH-CASE-ONLY': [],
    'UNRESOLVABLE-INCLUDE': [],
    'source-cited-no-tag': [],
    'live-query-unverifiable': [],
    'reading-no-range-cited': [],
    'reading-id-unmapped': [],
    'octave-scripture-not-checked': [],
    'temporal-uncited-unmapped': [],
    'saint-specific-uncited': [],
    'saint-specific-uncited-low-confidence': [],
    MATCH: [],
  };
  const counts = {
    commonTotal: 0,
    commonScanned: 0,
    commonSkip: 0,
    coverageChecked: 0,
    temporalTotal: 0,
    temporalScanned: 0,
    nocturnTotal: 0,
    nocturnScanned: 0,
    octaveTotal: 0,
    octaveScanned: 0,
  };

  auditCommon(cache, byPropers, byId, idToDate, buckets, counts);
  auditCoverage(byPropers, idToDate, buckets, counts);
  auditTemporal(cache, buckets, counts);
  auditNocturnReadings(cache, byId, idToDate, buckets, counts);
  auditOctaveReadings(cache, byId, idToDate, buckets, counts);

  writeFileSync(REPORT_FILE, renderReport(buckets, counts));
  console.log(`Wrote ${REPORT_FILE}`);
  console.log(
    `common/: ${counts.commonScanned} scanned, ${counts.commonSkip} skipped (of ${counts.commonTotal}). ` +
      `coverage: ${counts.coverageChecked} saints checked. ` +
      `temporal/: ${counts.temporalScanned} of ${counts.temporalTotal}. ` +
      `nocturn-readings/: ${counts.nocturnScanned} of ${counts.nocturnTotal}. ` +
      `octave-readings/: ${counts.octaveScanned} of ${counts.octaveTotal}.`,
  );
  for (const [name, items] of Object.entries(buckets)) {
    console.log(`  ${name}: ${items.length}`);
  }
}

function excerpt(text, max = 200) {
  if (!text) return '_(empty)_';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function renderReport(buckets, counts) {
  const lines = [];
  lines.push(`# Source-fidelity audit — ${new Date().toISOString()}`, '');
  lines.push(
    `Scope: \`src/data/propers/common/*.yml\` (saint-specific antiphon/collect/`,
    `commemoration + capitulum/hymn/responsory/versicle/invitatory files),`,
    `a coverage pass over every saint's expected files, \`temporal/*.yml\`,`,
    `\`nocturn-readings/*.yml\`, and \`octave-readings/*.yml\`.`,
    '',
    `**Not scanned:** generic Common-category files with no single saint/date`,
    `(\`common/\`'s own skip bucket), any \`octave-readings/\` file sourced from`,
    `this app's own scripture store (\`passages:\`, verified by construction —`,
    `see \`octave-scripture-not-checked\` below), and anything requiring a`,
    `season-math family this script's \`derivedTemporalFile\` table doesn't`,
    `cover (fixed movable feasts like Ascension/Pentecost, individual Holy`,
    `Week/Passion-week weekday ferias) unless that file cites its own source`,
    `explicitly.`,
    '',
  );
  lines.push('## Bucket counts', '');
  lines.push('| Bucket | Count |', '|---|---|');
  for (const [name, items] of Object.entries(buckets)) {
    lines.push(`| ${name} | ${items.length} |`);
  }
  lines.push('', '## Scan counts', '');
  lines.push('| Directory | Scanned | Total |', '|---|---|---|');
  lines.push(`| common/ (+ ${counts.commonSkip} skipped, out of scope) | ${counts.commonScanned} | ${counts.commonTotal} |`);
  lines.push(`| coverage (saints checked against their own source) | ${counts.coverageChecked} | — |`);
  lines.push(`| temporal/ | ${counts.temporalScanned} | ${counts.temporalTotal} |`);
  lines.push(`| nocturn-readings/ | ${counts.nocturnScanned} | ${counts.nocturnTotal} |`);
  lines.push(`| octave-readings/ | ${counts.octaveScanned} | ${counts.octaveTotal} |`, '');

  const section = (title, blurb, items, render) => {
    lines.push(`## ${title}`, '', blurb, '');
    if (items.length === 0) {
      lines.push('_None._', '');
      return;
    }
    for (const item of items) {
      lines.push(...render(item));
      lines.push('');
    }
  };

  // Sort MISMATCH so the lowest-similarity (most likely a genuine
  // wrong-tag bug) entries lead, and the highest-similarity ones (probably
  // a trivial punctuation/transcription difference) trail — inverse of
  // per-entry candidate sort, but the right order for a human working top
  // to bottom looking for real bugs first.
  const bestScore = (item) => {
    const top = item.attempts[0];
    if (!top) return -1;
    // Average only over dimensions with a real score -- a Latin-only
    // comparison (e.g. a canticle with no English mirror in its source
    // tree) must not have its score dragged down by treating a genuinely
    // absent `simEn` as 0 (a real bug found while adding canticle
    // checking: a 94%-similar match displayed as 47%).
    const scores = [top.simLa, top.simEn].filter((s) => s !== null && s !== undefined);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : -1;
  };
  buckets.MISMATCH.sort((a, b) => bestScore(a) - bestScore(b));

  section('MISMATCH', '**Highest priority — likely real content bugs. Sorted lowest-similarity (most likely a genuine wrong-tag substitution) first.**', buckets.MISMATCH, (item) => {
    const out = [
      `### ${item.file}${item.derivedSource ? ' *(derived source — tag mapping unconfirmed for this family, lower confidence, see script header)*' : ''}`,
      '',
      `Cited tag(s): ${item.tags.map((t) => `\`[${t}]\``).join(', ')}` +
        (item.attempts[0] ? ` — best candidate similarity: ${Math.round(bestScore(item) * 100)}%` : ''),
      '',
    ];
    out.push(`- YAML \`text.la\`: ${excerpt(item.yamlLa)}`);
    out.push(`- YAML \`text.en\`: ${excerpt(item.yamlEn)}`);
    const checked = item.attempts.filter((a) => a.status === 'checked');
    for (const a of checked.slice(0, 3)) {
      out.push(
        `- Source \`[${a.tag}]\` (${a.track}/${a.date}.txt${a.subIndex ? `, entry #${a.subIndex + 1}` : ''}): ` +
          `la=${excerpt(a.srcLa, 120)} (${a.simLa !== null ? Math.round(a.simLa * 100) + '%' : 'n/a'} similar), ` +
          `en=${excerpt(a.srcEn, 120)} (${a.simEn !== null ? Math.round(a.simEn * 100) + '%' : 'n/a'} similar)`,
      );
    }
    return out;
  });

  section(
    'TAG-NOT-FOUND',
    'Cited tag does not exist in the cited source file — either a typo in the citation, or the tag genuinely absent.',
    buckets['TAG-NOT-FOUND'],
    (item) => [`### ${item.file}`, '', `Cited tag(s): ${item.tags.map((t) => `\`[${t}]\``).join(', ')}, source(s): ${item.sourceFiles.map((s) => `${s.track}/${s.date}.txt`).join(', ')}`],
  );

  section(
    'FILE-NOT-FOUND',
    'Cited source file does not exist on disk (wrong date, wrong track, or reference repo not checked out at that path).',
    buckets['FILE-NOT-FOUND'],
    (item) => [`### ${item.file}`, '', `Cited source(s): ${item.sourceFiles.map((s) => `${s.track}/${s.date}.txt`).join(', ')}`],
  );

  section(
    'MISMATCH-CASE-ONLY',
    'Text matches its cited tag except for capitalization — lower priority than MISMATCH, but worth a glance.',
    buckets['MISMATCH-CASE-ONLY'],
    (item) => [`### ${item.file}`, '', `Matched \`[${item.matchedOn.tag}]\` (${item.matchedOn.track}/${item.matchedOn.date}.txt) case-insensitively only.`],
  );

  section(
    'UNRESOLVABLE-INCLUDE',
    "Cited tag's body is itself an `@include` transclusion this script doesn't resolve — can't statically compare.",
    buckets['UNRESOLVABLE-INCLUDE'],
    (item) => [`### ${item.file}`, '', `Cited tag(s): ${item.tags.map((t) => `\`[${t}]\``).join(', ')}`],
  );

  section(
    'source-cited-no-tag',
    "Header names a source file but no recognizable bracket tag — can't auto-verify which section it means.",
    buckets['source-cited-no-tag'],
    (item) => [`### ${item.file}`, '', `Source(s): ${item.sourceFiles.map((s) => `${s.track}/${s.date}.txt`).join(', ')}`, '', `> ${excerpt(item.comment, 300).replace(/\n/g, ' ')}`],
  );

  section(
    'live-query-unverifiable',
    'Header claims live-verification against the reference engine with no static file to statically re-check. **Not a defect signal by itself.**',
    buckets['live-query-unverifiable'],
    (item) => [`### ${item.file}`, '', `> ${excerpt(item.comment, 300).replace(/\n/g, ' ')}`],
  );

  section(
    'saint-specific-uncited',
    'Resolves to a real saint + calendar date (a source file genuinely exists to check against) but the header cites nothing at all. **Priority review bucket** — closest to the original unchecked-Common-fallback bug pattern.',
    buckets['saint-specific-uncited'],
    (item) => [`### ${item.file}`, '', `Saint: \`${item.saintId}\`, date: ${item.date} — expected source: \`Sancti/${item.date}.txt\` (or \`SanctiM/${item.date}.txt\`)`],
  );

  section(
    'saint-specific-uncited (low confidence — check the regex, not just the file)',
    'Header mentions "Sancti"/"SanctiM"/a date but this script could not extract a recognizable citation. Likely a real citation phrased in a way the regex missed — verify manually before trusting the classification.',
    buckets['saint-specific-uncited-low-confidence'],
    (item) => [`### ${item.file}`, '', `Saint: \`${item.saintId}\`, date: ${item.date}`, '', `> ${excerpt(item.comment, 300).replace(/\n/g, ' ')}`],
  );

  section(
    'MISSING-FILE',
    '**Coverage gap — the saint\'s own source has real content for this slot, but no file was ever authored for it at all.** ' +
      'Not a wrong-content bug like MISMATCH — this is content that never got written, silently covered by ' +
      '`resolve-common.ts`\'s Common/ferial fallback with no visible `status: missing` anywhere.',
    buckets['MISSING-FILE'],
    (item) => [
      `### ${item.file}`,
      '',
      `Saint: \`${item.saintId}\`, date: ${item.date} — source has real \`[${item.tag}]\` content, ` +
        `no \`${item.expectedSuffix}\` file exists.`,
    ],
  );

  section(
    'RESPONSORY-MISMATCH',
    "A reading's own inline `responsory` field doesn't match the source's own responsory for the range's first lesson.",
    buckets['RESPONSORY-MISMATCH'],
    (item) => [
      `### ${item.file}${item.nocturn ? ` (Nocturn ${item.nocturn})` : ''}`,
      '',
      `Cited/derived source: ${item.source.track}/${item.source.date}.txt \`[${item.tag}]\``,
      `- YAML responsory: ${excerpt(item.yamlResponsory?.la, 200)}`,
      `- Source \`[${item.tag}]\`: ${excerpt(item.sourceResponsory?.la, 200)}`,
    ],
  );

  section(
    'reading-no-range-cited',
    "Resolved to a real source file, but no \"LectioN-M\" range was found in the header — can't auto-select which lessons to compare.",
    buckets['reading-no-range-cited'],
    (item) => [`### ${item.file}`, '', `Source: ${item.source.track}/${item.source.date}.txt`, '', `> ${excerpt(item.comment, 300).replace(/\n/g, ' ')}`],
  );

  section(
    'reading-id-unmapped',
    "Neither a real saint+date nor a mapped temporal-id family — this script doesn't know what source file to check against.",
    buckets['reading-id-unmapped'],
    (item) => [`### ${item.file}`, '', `id: \`${item.id}\``],
  );

  section(
    'octave-scripture-not-checked',
    'Sourced via `passages:` (this app\'s own scripture store) rather than reference-engine prose — verified by construction, genuinely out of this engine\'s job.',
    buckets['octave-scripture-not-checked'],
    (item) => [`- ${item.file}`],
  );

  section(
    'temporal-uncited-unmapped',
    'No citation, and the id isn\'t one of the mapped temporal families (season math not built for it) — see script header for which families are covered.',
    buckets['temporal-uncited-unmapped'],
    (item) => [`### ${item.file}`, '', `id: \`${item.id}\``, '', `> ${excerpt(item.comment, 200).replace(/\n/g, ' ')}`],
  );

  section('MATCH', 'Confirmed correct — included for completeness and confidence.', buckets.MATCH, (item) => [
    `- ${item.file} — \`[${item.matchedOn.tag}]\` (${item.matchedOn.track}/${item.matchedOn.date}.txt)` +
      (item.matchedOn.kind === 'contains' ? ' — *contains-match (source wrapped in a prefix/suffix, e.g. collect doxology expansion)*' : '') +
      (item.matchedOn.kind === 'multi-lesson' ? ' — *multi-lesson combined reading*' : ''),
  ]);

  lines.push(
    '---',
    '',
    `Skipped ${counts.commonSkip} common/ files that didn't resolve to a real, calendar-mapped saint`,
    `(generic Common-category files, or authored-but-unwired saints) — out of scope by design, not audited.`,
    '',
    'See the script header comment (`scripts/audit-source-fidelity.mjs`) for full stated limitations',
    '(freeform-comment parsing, no `@include` resolution, no fuzzy auto-pass threshold, static-only,',
    'best-effort range-to-reading zipping order for nocturn-readings/).',
  );

  return lines.join('\n');
}

main();
