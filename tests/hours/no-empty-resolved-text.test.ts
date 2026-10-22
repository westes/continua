import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { HOUR_IDS } from '../../src/hours/types';

// Collects every ResolvedText-shaped value ({ text, status }) whose status
// says the text exists but whose text is empty. 'missing' slots are expected
// to be empty and are checked elsewhere.
function emptyButClaimed(value: unknown, path: string, found: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => emptyButClaimed(v, `${path}[${i}]`, found));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  const { text, status } = obj;
  if (text && typeof text === 'object' && status && typeof status === 'object') {
    for (const [lang, s] of Object.entries(status as Record<string, string>)) {
      const t = (text as Record<string, string | undefined>)[lang];
      if (s !== 'missing' && (t === undefined || t.trim() === '')) found.push(`${path}.${lang} (${s})`);
    }
  }
  for (const [key, v] of Object.entries(obj)) emptyButClaimed(v, `${path}.${key}`, found);
}

function* days(year: number): Generator<string> {
  for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
    yield d.toISOString().slice(0, 10);
  }
}

describe('resolved text', () => {
  it('is never empty where its status says it exists, on any day in 2026 and 2027', () => {
    const offenders: string[] = [];
    for (const year of [2026, 2027]) {
      for (const date of days(year)) {
        for (const hour of HOUR_IDS) {
          emptyButClaimed(resolveOrdo(hour, date).parts, `${date}/${hour}`, offenders);
        }
      }
    }
    expect(offenders).toEqual([]);
  }, 120000);
});
