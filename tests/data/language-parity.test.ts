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
  it.each(shared.map((s) => [`${s.slot} ${s.key} (${s.first}/${s.other})`, s] as const))('%s has the same structure in both languages', (_name, s) => {
    const strip = (body: unknown) => {
      const { temporal, ...rest } = (body ?? {}) as Record<string, unknown>;
      return rest;
    };
    expect(languageNeutralShape(s.key, strip(s.a))).toEqual(languageNeutralShape(s.key, strip(s.b)));
  });
});
