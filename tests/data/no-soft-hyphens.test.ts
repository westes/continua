import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

describe('data hygiene', () => {
  it('contains no soft hyphens (U+00AD)', () => {
    const offenders = [...walk('src/data')].filter((f) => readFileSync(f, 'utf8').includes('­'));
    expect(offenders).toEqual([]);
  });
});
