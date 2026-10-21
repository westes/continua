// Presents the per-language Common / feast files (src/data/<lang>/{commons,
// propers}/*.yml) as the four flat directories the source-fidelity audit was
// written against -- common/, temporal/, nocturn-readings/, octave-readings/ --
// one entry per text, carrying its header comment (taken from the Latin file,
// which is the only one that keeps them) and its parsed body in the old
// `{ id, text: { la, en }, status: { la, en } }` shape.
//
// This is a Node-side twin of src/propers/store.ts, which cannot be imported
// here because it relies on Vite's import.meta.glob. The section-key rules and
// the WRAPPED key sets below must be kept in step with that file.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const WRAPPED = {
  text: new Set(['text', 'status', 'citation']),
  psalmody: new Set(['antiphon', 'antiphonStatus', 'v', 'r', 'status']),
  'nocturn-readings': new Set(['citation', 'responsory', 'status', 'text']),
  'octave-readings': new Set(['text', 'status', 'responsory', 'source', 'citation']),
};

function family(head) {
  if (head.endsWith('-psalmody')) return 'psalmody';
  return head === 'nocturn-readings' || head === 'octave-readings' ? head : 'text';
}

const isEmptyObject = (x) => !!x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length === 0;

function mergeLanguages(a, b, wrapped, key) {
  if (key && wrapped.has(key)) {
    const pair = {};
    if (a !== undefined && !isEmptyObject(a)) pair.la = a;
    if (b !== undefined && !isEmptyObject(b)) pair.en = b;
    return pair;
  }
  const either = a ?? b;
  if (Array.isArray(either)) {
    const left = a ?? [];
    const right = b ?? [];
    return Array.from({ length: Math.max(left.length, right.length) }, (_, i) => mergeLanguages(left[i], right[i], wrapped));
  }
  if (either && typeof either === 'object') {
    const left = a ?? {};
    const right = b ?? {};
    const out = {};
    for (const k of new Set([...Object.keys(left), ...Object.keys(right)])) out[k] = mergeLanguages(left[k], right[k], wrapped, k);
    return out;
  }
  return either;
}

/** Top-level sections of a file's raw text -> section key -> the comment block
 * immediately above it, as '# ...' lines. */
function sectionComments(raw) {
  const out = new Map();
  let pending = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith('#')) pending.push(line);
    else if (/^[^\s#][^:]*:/.test(line)) {
      out.set(line.slice(0, line.indexOf(':')).replace(/^["']|["']$/g, ''), pending.join('\n').trim());
      pending = [];
    } else if (line.trim() === '') {
      // Keep blank lines inside a comment block: extractHeaderComment in the
      // audit stops at the first one, as it did on the old one-text files.
      if (pending.length > 0) pending.push('');
    } else pending = []; // indented body line: the comment above belongs to an earlier section
  }
  return out;
}

/** @returns {Record<'common'|'temporal'|'nocturn-readings'|'octave-readings', Map<string, {raw: string, doc: any, where: string}>>} */
export function loadLegacyView(dataRoot) {
  const view = {
    common: new Map(),
    temporal: new Map(),
    'nocturn-readings': new Map(),
    'octave-readings': new Map(),
  };
  const owners = new Map(); // `${kind}/${owner}` -> { lang: {path, raw, doc} }
  for (const lang of readdirSync(dataRoot).filter((d) => /^[a-z]{2,3}$/.test(d))) {
    for (const kind of ['commons', 'propers', 'ordinary']) {
      const dir = path.join(dataRoot, lang, kind);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.yml'))) {
        const raw = readFileSync(path.join(dir, f), 'utf8');
        const slot = owners.get(`${kind}/${f.slice(0, -4)}`) ?? {};
        slot[lang] = { raw, doc: yaml.load(raw) ?? {} };
        owners.set(`${kind}/${f.slice(0, -4)}`, slot);
      }
    }
  }
  for (const [slotKey, slot] of owners) {
    const [kind, owner] = slotKey.split('/');
    const comments = sectionComments(slot.la?.raw ?? '');
    const keys = new Set(Object.values(slot).flatMap((s) => Object.keys(s.doc)));
    for (const key of keys) {
      const [head, pattern] = key.split('/');
      const fam = family(head);
      if (fam === 'psalmody') continue; // psalmody schemes are not audited here
      const wrapped = WRAPPED[fam];
      const withOwner = (p) => (p ? p.replace('~', owner) : owner);
      const merged = mergeLanguages(slot.la?.doc[key], slot.en?.doc[key], wrapped);
      const where = `src/data/<lang>/${kind}/${owner}.yml [${key}]`;
      const raw = `${comments.get(key) ?? ''}\n`;
      if (fam === 'text') {
        const stem = kind === 'ordinary' ? key : `${head}-${withOwner(pattern)}`;
        const { temporal, ...rest } = merged;
        view[temporal === true ? 'temporal' : 'common'].set(`${stem}.yml`, { raw, doc: { id: stem, ...rest }, where });
      } else {
        const id = withOwner(pattern);
        view[fam].set(`${id}.yml`, { raw, doc: { id, ...merged }, where });
      }
    }
  }
  return view;
}
