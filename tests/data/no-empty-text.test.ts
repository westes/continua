import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (path.endsWith('.yml')) yield path;
  }
}

// An empty string in a text slot reads as real content to the resolver and
// renders as a blank part (the Sacred Heart, Patronage of St. Joseph and
// Immaculate Heart responsories did exactly this). A slot with nothing to say
// should be absent, not empty, whatever its status field claims.
function emptyTexts(value: unknown, path: string, found: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => emptyTexts(v, `${path}[${i}]`, found));
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim() === '' && ['text', 'la', 'en'].includes(key)) {
        found.push(`${path}.${key}`);
      } else {
        emptyTexts(v, `${path}.${key}`, found);
      }
    }
  }
}

describe('data hygiene', () => {
  it('has no empty text, la or en values', () => {
    const offenders: string[] = [];
    for (const file of walk('src/data')) {
      emptyTexts(yaml.load(readFileSync(file, 'utf8')), file, offenders);
    }
    expect(offenders).toEqual([]);
  });
});
