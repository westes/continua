#!/usr/bin/env node
// Compares two snapshots from `npm run snapshot` and lists, per day and hour,
// which kinds of part changed (hymn, chapter, antiphon, ...).
//   node scripts/snapshot-diff.mjs before.json after.json [--detail kind]
// --detail <kind> also prints the first line of the before/after text for
// every changed part of that kind.
import { readFileSync } from 'node:fs';

const [before, after] = process.argv.slice(2, 4).map((p) => JSON.parse(readFileSync(p, 'utf8')));
const di = process.argv.indexOf('--detail');
const detailKind = di >= 0 ? process.argv[di + 1] : undefined;

const flat = (o, acc = []) => {
  if (Array.isArray(o)) o.forEach((v) => flat(v, acc));
  else if (o && typeof o === 'object') {
    if ('kind' in o && 'text' in o) acc.push([o.kind, JSON.stringify(o.text)]);
    Object.values(o).forEach((v) => flat(v, acc));
  }
  return acc;
};
const first = (j) => {
  try {
    const t = JSON.parse(j);
    return (t.text?.la ?? t.text?.en ?? JSON.stringify(t)).split('\n')[0].slice(0, 70);
  } catch {
    return j.slice(0, 70);
  }
};

const byDay = new Map();
let slots = 0;
for (const key of Object.keys(before)) {
  if (before[key] === after[key]) continue;
  slots++;
  const [day, hour] = key.split('/');
  let kinds = new Set();
  if (before[key].startsWith('ERR') || after[key].startsWith('ERR')) kinds.add('ERROR');
  else {
    const fb = flat(JSON.parse(before[key]));
    const fa = flat(JSON.parse(after[key]));
    for (let i = 0; i < Math.max(fb.length, fa.length); i++) {
      const x = fb[i], y = fa[i];
      if (JSON.stringify(x) === JSON.stringify(y)) continue;
      const kind = (x ?? y)[0];
      kinds.add(kind);
      if (kind === detailKind) console.log(`${key}\n   before: ${x ? first(x[1]) : '-'}\n   after:  ${y ? first(y[1]) : '-'}`);
    }
  }
  if (!byDay.has(day)) byDay.set(day, []);
  byDay.get(day).push(`${hour}:${[...kinds].join(',')}`);
}
for (const [day, parts] of [...byDay].sort()) console.log(`${day}  ${parts.join('; ')}`);
console.log(`${slots} changed hour-slots on ${byDay.size} days`);
