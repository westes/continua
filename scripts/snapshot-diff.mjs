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
    // Align per kind (the nth hymn with the nth hymn) so one part appearing or
    // disappearing doesn't read as every later part changing.
    const group = (list) => {
      const m = new Map();
      for (const e of list) m.set(e[0], [...(m.get(e[0]) ?? []), e]);
      return m;
    };
    const gb = group(flat(JSON.parse(before[key])));
    const ga = group(flat(JSON.parse(after[key])));
    for (const kind of new Set([...gb.keys(), ...ga.keys()])) {
      const lb = gb.get(kind) ?? [], la = ga.get(kind) ?? [];
      for (let i = 0; i < Math.max(lb.length, la.length); i++) {
        const x = lb[i], y = la[i];
        if (JSON.stringify(x) === JSON.stringify(y)) continue;
        kinds.add(!x ? `+${kind}` : !y ? `-${kind}` : kind);
        if (kind === detailKind) console.log(`${key}\n   before: ${x ? first(x[1]) : '-'}\n   after:  ${y ? first(y[1]) : '-'}`);
      }
    }
  }
  if (!byDay.has(day)) byDay.set(day, []);
  byDay.get(day).push(`${hour}:${[...kinds].join(',')}`);
}
for (const [day, parts] of [...byDay].sort()) console.log(`${day}  ${parts.join('; ')}`);
console.log(`${slots} changed hour-slots on ${byDay.size} days`);
