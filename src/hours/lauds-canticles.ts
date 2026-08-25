import type { LanguageCode, TranslationStatus } from '../psalter';

export interface CanticleVerse {
  n: string;
  text: Partial<Record<LanguageCode, string>>;
  status: Partial<Record<LanguageCode, TranslationStatus>>;
}

export interface Canticle {
  id: string;
  name: string;
  citation: string;
  verses: CanticleVerse[];
}

// The 7 Lauds OT canticles (data/hours/lauds-canticles/*.yml) — a small,
// separate store from the Psalter, since these use their own liturgical
// verse-numbering per canticle (not the Psalter's 1-150 numbering) and
// each id is only ever looked up directly by data/hours/lauds-
// antiphons.yml's weekday->canticleId mapping, never by number.
const modules = import.meta.glob<{ default: Canticle }>('../data/hours/lauds-canticles/*.yml', {
  eager: true,
});

const canticles = new Map<string, Canticle>();
for (const mod of Object.values(modules)) {
  canticles.set(mod.default.id, mod.default);
}

export function getCanticle(id: string): Canticle {
  const canticle = canticles.get(id);
  if (!canticle) {
    throw new Error(`No Lauds canticle authored for id '${id}'`);
  }
  return canticle;
}

// Non-throwing lookup for the UI's canticle title — unlike getCanticle,
// callers here may pass ids (nunc-dimittis, benedictus, magnificat, or a
// Matins nocturn-3 scripture-ref-derived id) that this store never holds,
// since only the 7 Lauds weekday OT canticles have an authored English
// `name` distinct from their Latin id.
export function tryGetCanticleName(id: string): string | undefined {
  return canticles.get(id)?.name;
}
