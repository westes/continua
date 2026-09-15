#!/usr/bin/env node
// One-off audit: re-verify every src/data/propers/common/*.yml file that
// cites a reference-engine source tag against that tag's actual text in
// ../divinum-officium-reference, to catch the bug class found in commit
// ee88aba (2026-09-14): 23 saints whose Common-tier YAML held the wrong
// text -- either a mis-tagging error (copied from the wrong bracket tag,
// e.g. [Ant 1] used where [Ant 2] belonged) or an unchecked Common-category
// fallback (never checked whether the saint's own source had real, distinct
// text before deferring to generic Common text). Both bug shapes are
// mechanical, source-vs-file comparisons, not liturgical judgment calls --
// that's what makes them worth automating.
//
// Run: `npm run audit:sources`. Writes audit-source-fidelity-report.md to
// the repo root (untracked -- don't `git add` it, it's a disposable report
// for human review, regenerated each run).
//
// Scope, v1: src/data/propers/common/*.yml ONLY. Every file there whose
// filename stem ends in one of the four `${propers}-<suffix>` shapes
// resolve-common.ts actually uses (-antiphon, -magnificat-antiphon,
// -commemoration, -collect -- grepped directly from resolve-common.ts, not
// guessed) is matched back to a real SaintRecord via
// src/data/calendar/saints/*.yml's own `propers` field, then to a real
// calendar date via src/data/calendar/sanctoral-calendar.yml, which is what
// lets this script find that saint's real Sancti/SanctiM MM-DD.txt source
// file to check against.
//
// NOT in scope for this pass, on purpose:
// - src/data/propers/temporal/*.yml -- same text.la/text.en/status shape,
//   but keyed to a temporal-feast id (src/calendar/temporal-feasts.ts) with
//   its own Tempora/*.txt naming scheme, not a SaintRecord. A natural v2
//   extension; not built here.
// - src/data/propers/nocturn-readings/*.yml and
//   src/data/propers/octave-readings/*.yml -- structurally different
//   (multi-lesson ranges, scripture-passage shape rather than one
//   text-per-bracket-tag) and already independently, exhaustively
//   hand-swept per project memory. Re-verifying them needs a different
//   comparison algorithm; bundling them in here would blur this script's
//   one clear job.
// - Files under common/ that DON'T end in one of the four propers suffixes
//   above (e.g. a capitulum/hymn/responsory Common file) are also out of
//   scope for this pass -- resolve-common.ts's `${propers}-...` convention
//   only covers those four parts; extending SaintRecord-matching to other
//   part-types is future work, not silently assumed clean here.
//
// Known limitations (stated, not solved):
// - Header-comment citations are freeform prose, not a structured field --
//   regex extraction of "which source file / which tag" WILL have false
//   negatives on citations phrased unexpectedly. Files that plausibly
//   mention a source but that this script's regex can't parse are flagged
//   in their own low-confidence bucket rather than silently merged into
//   "no citation at all" -- see classify() below.
// - `@include`/transclusion directives in the reference .txt files are not
//   resolved -- a cited tag whose body is itself an `@...` reference is
//   reported as UNRESOLVABLE-INCLUDE, not chased further.
// - No fuzzy auto-pass threshold: every non-exact match after normalization
//   is surfaced as a MISMATCH. A similarity score is included per mismatch
//   purely as a human triage aid, never to auto-suppress a finding.
// - Static-only: doesn't invoke the reference engine's live CGI instance.
//   Files whose header only claims live-verification (no static file/tag)
//   go in their own bucket, not treated as a defect signal by themselves.
// - A file's header comment can mention more than one bracket tag (e.g.
//   explaining "this used to wrongly read [Ant 1], now corrected to
//   [Ant 2]") -- this script tries EVERY tag token it finds in the comment
//   against the source, and calls it a MATCH if any one of them matches
//   exactly. This avoids a false MISMATCH triggered by a stale tag name
//   mentioned only for explanatory/historical reasons in the prose.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REF_HORAS = path.resolve(REPO_ROOT, '..', 'divinum-officium-reference', 'web', 'www', 'horas');
const COMMON_DIR = path.join(REPO_ROOT, 'src', 'data', 'propers', 'common');
const SAINTS_DIR = path.join(REPO_ROOT, 'src', 'data', 'calendar', 'saints');
const SANCTORAL_CALENDAR_FILE = path.join(REPO_ROOT, 'src', 'data', 'calendar', 'sanctoral-calendar.yml');
const REPORT_FILE = path.join(REPO_ROOT, 'audit-source-fidelity-report.md');

// Grepped directly from resolve-common.ts's `${saint.propers}-...` template
// literals -- the exact, complete set. Longest first so
// "-magnificat-antiphon" isn't shadowed by "-antiphon".
const PROPERS_SUFFIXES = ['-magnificat-antiphon', '-commemoration', '-antiphon', '-collect'];

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
  const byPropers = new Map();
  const byId = new Map();
  for (const file of readdirSync(SAINTS_DIR)) {
    if (!file.endsWith('.yml')) continue;
    const record = loadYaml(path.join(SAINTS_DIR, file));
    if (!record?.id) continue;
    byId.set(record.id, record);
    if (record.propers) {
      byPropers.set(record.propers, record);
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
  /** @type {Map<string, { text: string, unresolvableInclude: boolean }[]>} */
  const resolved = new Map();
  for (const [tag, entries] of tags) {
    resolved.set(
      tag,
      entries.map((entryLines) => {
        let unresolvableInclude = false;
        const kept = [];
        for (const raw of entryLines) {
          const line = raw.trim();
          if (line === '') continue;
          if (line.startsWith('!')) continue; // scripture/patristic citation ref, not body text
          if (line === '_') continue; // stanza divider
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
        return { text: text.trim(), unresolvableInclude };
      }),
    );
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

function normalize(text) {
  return stripOptionalAlleluiaParens(text).replace(/\s+/g, ' ').trim();
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
// Main
// -------------------------------------------------------------------------

function stripPropersSuffix(stem) {
  for (const suffix of PROPERS_SUFFIXES) {
    if (stem.endsWith(suffix)) return stem.slice(0, -suffix.length);
  }
  return null;
}

function main() {
  const { byPropers } = loadSaintRecords();
  const idToDate = loadSanctoralCalendar();

  const files = readdirSync(COMMON_DIR).filter((f) => f.endsWith('.yml'));
  const referenceFileCache = new Map(); // "track/date" -> parsed map | null

  const buckets = {
    MISMATCH: [],
    'TAG-NOT-FOUND': [],
    'FILE-NOT-FOUND': [],
    'MISMATCH-CASE-ONLY': [],
    'UNRESOLVABLE-INCLUDE': [],
    'source-cited-no-tag': [],
    'live-query-unverifiable': [],
    'saint-specific-uncited': [],
    'saint-specific-uncited-low-confidence': [],
    MATCH: [],
  };
  let skipCount = 0;
  let scannedCount = 0;

  for (const filename of files) {
    const filePath = path.join(COMMON_DIR, filename);
    const raw = readFileSync(filePath, 'utf8');
    const doc = loadYaml(filePath);
    const stem = filename.slice(0, -4);
    const propersStem = stripPropersSuffix(stem);
    const saint = propersStem ? byPropers.get(propersStem) : undefined;

    if (!saint) {
      skipCount++;
      continue;
    }
    scannedCount++;

    const date = idToDate.get(saint.id);
    const comment = extractHeaderComment(raw);
    const flatComment = comment.replace(/\s+/g, ' ');
    const { sourceFiles, tags } = extractCitations(comment);
    const isLiveQuery = LIVE_QUERY_RE.test(flatComment);

    const relPath = `src/data/propers/common/${filename}`;
    const yamlLa = normalize(doc?.text?.la ?? '');
    const yamlEn = normalize(doc?.text?.en ?? '');

    if (sourceFiles.length > 0 && tags.length > 0) {
      // Bucket (a): verify. Use the first cited source file as primary; try
      // every cited tag against it, both tracks if more than one source
      // file is cited (rare, but don't silently drop a second citation).
      const attempts = [];
      let anyMatch = null;
      let anyCaseOnlyMatch = null;
      let anyUnresolvable = false;
      let anyTagFound = false;
      let anyFileFound = false;

      for (const { track, date: srcDate } of sourceFiles) {
        const cacheKey = `${track}/${srcDate}`;
        if (!referenceFileCache.has(cacheKey)) {
          referenceFileCache.set(cacheKey, {
            la: parseReferenceFile(path.join(REF_HORAS, 'Latin', track, `${srcDate}.txt`)),
            en: parseReferenceFile(path.join(REF_HORAS, 'English', track, `${srcDate}.txt`)),
          });
        }
        const parsed = referenceFileCache.get(cacheKey);
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

          // Try every sub-entry under this tag (most tags have exactly one).
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
            // `-collect.yml` files (and occasionally others) wrap the
            // source's bare core text in a fixed prefix ("Orémus."/"Let us
            // pray.") and expand the source's own trailing `$shorthand`
            // doxology marker into its full boilerplate ("Per eúndem
            // Dóminum... R. Amen.") -- a real, uniform, non-bug pattern
            // (the source's `$Per eumdem` etc. is a macro reference this
            // script's parser deliberately doesn't expand, same spirit as
            // not resolving `@include`). Treat "source's core text is
            // fully contained in the YAML's text" as a match tier of its
            // own, distinct from an exact match, rather than mislabeling
            // every collect a MISMATCH for a difference this script can't
            // meaningfully adjudicate. A genuinely wrong-tag bug would not
            // produce a literal substring match by coincidence.
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

      if (anyMatch) {
        buckets.MATCH.push({ ...entry, matchedOn: anyMatch });
      } else if (anyCaseOnlyMatch) {
        buckets['MISMATCH-CASE-ONLY'].push({ ...entry, matchedOn: anyCaseOnlyMatch });
      } else if (!anyFileFound) {
        buckets['FILE-NOT-FOUND'].push(entry);
      } else if (!anyTagFound) {
        buckets['TAG-NOT-FOUND'].push(entry);
      } else if (anyUnresolvable && attempts.filter((a) => a.status === 'checked').length === 0) {
        buckets['UNRESOLVABLE-INCLUDE'].push(entry);
      } else {
        // Sort checked attempts by best combined similarity for triage —
        // highest-similarity candidate first, so a 93%-similar near-match
        // (probably trivial) sorts ahead of a 20%-similar one (probably the
        // copied-wrong-tag bug) in the report.
        entry.attempts = attempts
          .filter((a) => a.status === 'checked')
          .sort((x, y) => (y.simLa ?? 0) + (y.simEn ?? 0) - ((x.simLa ?? 0) + (x.simEn ?? 0)));
        buckets.MISMATCH.push(entry);
      }
    } else if (sourceFiles.length > 0) {
      buckets['source-cited-no-tag'].push({ file: relPath, comment, sourceFiles });
    } else if (isLiveQuery) {
      buckets['live-query-unverifiable'].push({ file: relPath, comment });
    } else if (date && SOURCE_MENTION_RE.test(flatComment)) {
      buckets['saint-specific-uncited-low-confidence'].push({ file: relPath, comment, saintId: saint.id, date });
    } else if (date) {
      buckets['saint-specific-uncited'].push({ file: relPath, saintId: saint.id, date });
    } else {
      // Resolves to a SaintRecord but that saint has no real calendar date
      // mapped (an authored-but-unwired saint, per project convention) --
      // nothing to check against, not reported as a gap.
      skipCount++;
      scannedCount--;
    }
  }

  writeFileSync(REPORT_FILE, renderReport(buckets, { scannedCount, skipCount, totalFiles: files.length }));
  console.log(`Wrote ${REPORT_FILE}`);
  console.log(`Scanned ${scannedCount} saint-specific files, skipped ${skipCount} generic/unwired files (of ${files.length} total).`);
  for (const [name, items] of Object.entries(buckets)) {
    console.log(`  ${name}: ${items.length}`);
  }
}

function excerpt(text, max = 200) {
  if (!text) return '_(empty)_';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function renderReport(buckets, meta) {
  const lines = [];
  lines.push(`# Source-fidelity audit — ${new Date().toISOString()}`, '');
  lines.push(
    `Scope: \`src/data/propers/common/*.yml\` only. Files matched to a real saint via`,
    `\`SaintRecord.propers\` and a real date via \`sanctoral-calendar.yml\`.`,
    '',
    `**Not scanned by this run** (see script header for why): `,
    `\`src/data/propers/temporal/*.yml\`, `,
    `\`src/data/propers/nocturn-readings/*.yml\`, `,
    `\`src/data/propers/octave-readings/*.yml\`. Absence of findings there`,
    `means nothing — they were never checked by this tool.`,
    '',
  );
  lines.push('## Bucket counts', '');
  lines.push('| Bucket | Count |', '|---|---|');
  for (const [name, items] of Object.entries(buckets)) {
    lines.push(`| ${name} | ${items.length} |`);
  }
  lines.push(`| skip (generic/unwired, not reported) | ${meta.skipCount} |`);
  lines.push(`| total files in common/ | ${meta.totalFiles} |`, '');

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
    return ((top.simLa ?? 0) + (top.simEn ?? 0)) / 2;
  };
  buckets.MISMATCH.sort((a, b) => bestScore(a) - bestScore(b));

  section('MISMATCH', '**Highest priority — likely real content bugs. Sorted lowest-similarity (most likely a genuine wrong-tag substitution) first.**', buckets.MISMATCH, (item) => {
    const out = [
      `### ${item.file}`,
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

  section('MATCH', 'Confirmed correct — included for completeness and confidence.', buckets.MATCH, (item) => [
    `- ${item.file} — \`[${item.matchedOn.tag}]\` (${item.matchedOn.track}/${item.matchedOn.date}.txt)` +
      (item.matchedOn.kind === 'contains' ? ' — *contains-match (source wrapped in a prefix/suffix, e.g. collect doxology expansion)*' : ''),
  ]);

  lines.push(
    '---',
    '',
    `Skipped ${meta.skipCount} files that didn't resolve to a real, calendar-mapped saint`,
    `(generic Common-category files, or authored-but-unwired saints) — out of scope by design, not audited.`,
    '',
    'See the script header comment (`scripts/audit-source-fidelity.mjs`) for full stated limitations',
    '(freeform-comment parsing, no `@include` resolution, no fuzzy auto-pass threshold, static-only).',
  );

  return lines.join('\n');
}

main();
