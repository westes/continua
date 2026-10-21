import { describe, expect, it } from 'vitest';
import { languageNeutralShape, sourceFiles } from '../../src/propers/store';

// Each language's file repeats the language-neutral structure (psalm numbers,
// canticle references, reading counts). They must never disagree.
const shared = [...sourceFiles].flatMap(([slot, byLang]) => {
  const langs = Object.keys(byLang);
  if (langs.length < 2) return [];
  const [first, ...others] = langs as [string, ...string[]];
  return others.flatMap((other) =>
    Object.keys(byLang[first] ?? {})
      .filter((key) => key in (byLang[other] ?? {}))
      .map((key) => ({ slot, key, first, other, a: byLang[first]?.[key], b: byLang[other]?.[key] })),
  );
});

describe('per-language data files', () => {
  it('finds sections present in more than one language', () => {
    expect(shared.length).toBeGreaterThan(0);
  });
  it('every section has the same structure in both languages', () => {
    const strip = (body: unknown) => {
      const { temporal, ...rest } = (body ?? {}) as Record<string, unknown>;
      return rest;
    };
    const mismatched = shared
      .filter((s) => JSON.stringify(languageNeutralShape(s.key, strip(s.a))) !== JSON.stringify(languageNeutralShape(s.key, strip(s.b))))
      .map((s) => `${s.slot} ${s.key} (${s.first}/${s.other})`);
    expect(mismatched).toEqual([]);
  });
});
