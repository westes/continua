import type { HourDefinition, HourPart, ResolvedOrdo, ResolvedPart, ResolvedText } from './types';
import { resolveDay } from '../calendar';
import { getPsalmNumbersFor } from '../psalter/distribution';
import { getPsalm } from '../psalter';
import primeDefinitionData from '../data/hours/prime.yml';

const primeDefinition = primeDefinitionData as HourDefinition;

// No propers data store yet (see plan: "content stores on the horizon") — every
// fixed textRef resolves as pending until that lands. Keeping this as an
// explicit function (rather than inlining) is exactly the seam that gets
// swapped out for a real lookup later.
function resolveTextRef(): ResolvedText {
  return { text: {}, status: { la: 'missing', en: 'missing' } };
}

function resolvePart(part: HourPart, psalmNumbers: number[]): ResolvedPart[] {
  switch (part.kind) {
    case 'hymn':
    case 'chapter':
    case 'responsory':
    case 'versicle':
    case 'prayer':
      return [{ kind: part.kind, text: resolveTextRef() }];
    case 'variable':
      // Only 'by-weekday' is meaningful for Prime; by-season/by-feast-rank
      // don't apply until milestone 4.
      return psalmNumbers.map((n) => {
        const psalm = getPsalm(n);
        return {
          kind: 'psalm' as const,
          psalmNumber: n,
          verses: psalm.verses.map((v) => ({ n: v.n, text: v.text, status: v.status })),
        };
      });
    case 'psalm':
      return [
        {
          kind: 'psalm',
          psalmNumber: part.psalmNumber,
          verses: getPsalm(part.psalmNumber).verses.map((v) => ({
            n: v.n,
            text: v.text,
            status: v.status,
          })),
        },
      ];
    case 'canticle':
      return [{ kind: 'canticle', canticleId: part.canticleId }];
    case 'lesson':
      // Prime has no lessons — Matins is where lesson slotting matters.
      return [];
  }
}

export function resolveOrdo(date: string): ResolvedOrdo {
  const day = resolveDay(date);
  const psalmNumbers = getPsalmNumbersFor('prime', day.weekday);
  const parts = primeDefinition.parts.flatMap((part) => resolvePart(part, psalmNumbers));
  return { hourId: 'prime', date, parts };
}
