import type { ProperText } from './types';

// Only the "common" propers store exists so far — sanctoral/temporal propers
// (source: 'sanctoral' | 'temporal') are milestone-4 concerns and have no
// data directory yet.
const modules = import.meta.glob<{ default: ProperText }>('../data/propers/common/*.yml', {
  eager: true,
});

const commonPropers = new Map<string, ProperText>();
for (const mod of Object.values(modules)) {
  commonPropers.set(mod.default.id, mod.default);
}

export function getCommonProper(id: string): ProperText {
  const proper = commonPropers.get(id);
  if (proper) {
    return proper;
  }
  // Same "resolve as pending" convention as psalm/martyrology/regula lookups
  // — an unauthored id isn't a bug, it's content waiting to be written.
  return { id, text: {}, status: { la: 'missing', en: 'missing' } };
}

export type { ProperText } from './types';
