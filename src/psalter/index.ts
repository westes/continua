import type { Psalm } from './types';

// @rollup/plugin-yaml parses each .yml into a plain object at build time —
// no YAML parser shipped to the client.
const modules = import.meta.glob<{ default: Psalm }>('../data/psalms/*.yml', {
  eager: true,
});

const psalms = new Map<number, Psalm>();
for (const mod of Object.values(modules)) {
  psalms.set(mod.default.number, mod.default);
}

export function getPsalm(number: number): Psalm {
  const psalm = psalms.get(number);
  if (!psalm) {
    throw new Error(`no data for psalm ${number}`);
  }
  return psalm;
}

export type { Psalm, PsalmVerse, LanguageCode, TranslationStatus } from './types';
