import { describe, it, expect } from 'vitest';
import type { MartyrologyEntry } from '../../src/martyrology/types';

const modules = import.meta.glob<{ default: MartyrologyEntry }>('../../src/data/martyrology/*.yml', {
  eager: true,
});
const entries = Object.values(modules).map((m) => m.default);
const paragraphs = (s: string | undefined) => (s ?? '').split('\n\n').filter((p) => p.trim());

describe('martyrology date files', () => {
  it('cover every day of the year', () => {
    expect(entries).toHaveLength(365);
  });

  it('keep Latin and English in step, paragraph for paragraph', () => {
    const mismatched = entries
      .filter((e) => paragraphs(e.text.la).length !== paragraphs(e.text.en).length)
      .map((e) => e.monthDay);
    expect(mismatched).toEqual([]);
  });
});
