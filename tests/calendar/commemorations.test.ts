import { describe, expect, it } from 'vitest';
import { decideOccurrence, compareFeastClass, isAtLeast } from '../../src/calendar/commemorations';
import type { SanctoralIdentity } from '../../src/calendar/types';

function saint(rank: SanctoralIdentity['rank']): SanctoralIdentity {
  return { id: 'x', name: 'St. Ereden', rank };
}

describe('compareFeastClass / isAtLeast', () => {
  it('orders the seven ranks low to high, with vigil between simplex and semiduplex', () => {
    expect(compareFeastClass('simplex', 'vigil')).toBeLessThan(0);
    expect(compareFeastClass('vigil', 'semiduplex')).toBeLessThan(0);
    expect(compareFeastClass('semiduplex', 'duplex')).toBeLessThan(0);
    expect(compareFeastClass('duplex-1-classis', 'simplex')).toBeGreaterThan(0);
    expect(compareFeastClass('duplex', 'duplex')).toBe(0);
  });

  it('isAtLeast is inclusive of the threshold itself', () => {
    expect(isAtLeast('duplex-majus', 'duplex-majus')).toBe(true);
    expect(isAtLeast('duplex', 'duplex-majus')).toBe(false);
  });
});

describe('decideOccurrence — no candidate', () => {
  it('temporal wins trivially when nothing is assigned to the date', () => {
    expect(decideOccurrence('ordinary-feria', 'some-feria-id', null)).toEqual({
      winner: { kind: 'temporal', id: 'some-feria-id' },
      commemorations: [],
    });
  });
});

describe('decideOccurrence — ordinary-feria', () => {
  it('always yields to any real feast, uncommemorated, whatever its rank', () => {
    for (const rank of ['simplex', 'vigil', 'semiduplex', 'duplex', 'duplex-1-classis'] as const) {
      const result = decideOccurrence('ordinary-feria', 'id', saint(rank));
      expect(result.winner).toEqual({ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank });
      expect(result.commemorations).toEqual([]);
      expect(result.transfer).toBeUndefined();
    }
  });
});

describe('decideOccurrence — privileged-feria-minor', () => {
  it('semiduplex or higher wins outright, the feria is commemorated in return', () => {
    // Verified: St. Nicholas, Semiduplex, outright wins against an
    // ordinary (non-Ember) Advent Saturday in the real Monastic 1617
    // engine, with the feria itself commemorated back.
    for (const rank of ['semiduplex', 'duplex', 'duplex-1-classis'] as const) {
      const result = decideOccurrence('privileged-feria-minor', 'id', saint(rank));
      expect(result.winner).toEqual({ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank });
      expect(result.commemorations).toEqual([{ kind: 'temporal', id: 'id' }]);
      expect(result.transfer).toBeUndefined();
    }
  });

  it('simplex or vigil stays and is commemorated, not transferred', () => {
    // Verified: St. Bibiana, Simplex, merely commemorated under an
    // ordinary Advent feria in the real Monastic 1617 engine.
    for (const rank of ['simplex', 'vigil'] as const) {
      const result = decideOccurrence('privileged-feria-minor', 'id', saint(rank));
      expect(result.winner).toEqual({ kind: 'temporal', id: 'id' });
      expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank }]);
      expect(result.transfer).toBeUndefined();
    }
  });
});

describe('decideOccurrence — privileged-feria', () => {
  it('behaves exactly like an ordinary Sunday — duplex or higher wins outright, the feria is commemorated in return', () => {
    // Verified: St. Gregory the Great, plain Duplex, outright wins against
    // a Lenten Ember Saturday in the real Monastic 1617 engine.
    const result = decideOccurrence('privileged-feria', 'id', saint('duplex'));
    expect(result.winner).toEqual({ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'duplex' });
    expect(result.commemorations).toEqual([{ kind: 'temporal', id: 'id' }]);
  });

  it('simplex stays and is commemorated, not transferred', () => {
    const result = decideOccurrence('privileged-feria', 'id', saint('simplex'));
    expect(result.winner).toEqual({ kind: 'temporal', id: 'id' });
    expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'simplex' }]);
  });

  it('semiduplex/vigil get nothing here — transfer instead', () => {
    const result = decideOccurrence('privileged-feria', 'id', saint('semiduplex'));
    expect(result.commemorations).toEqual([]);
    expect(result.transfer).toEqual({ candidate: saint('semiduplex'), direction: 'forward' });
  });
});

describe('decideOccurrence — privileged-feria-major', () => {
  it('is never displaced, same as privileged-sunday — duplex-majus and up are commemorated', () => {
    // Verified: St. Mark, Duplex II. classis, only ever commemorated —
    // never wins outright — within the Easter Octave.
    for (const rank of ['duplex-majus', 'duplex-2-classis', 'duplex-1-classis'] as const) {
      const result = decideOccurrence('privileged-feria-major', 'id', saint(rank));
      expect(result.winner).toEqual({ kind: 'temporal', id: 'id' });
      expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank }]);
    }
  });

  it('yields nothing short of duplex-majus — transfers instead', () => {
    const result = decideOccurrence('privileged-feria-major', 'id', saint('duplex'));
    expect(result.winner).toEqual({ kind: 'temporal', id: 'id' });
    expect(result.commemorations).toEqual([]);
    expect(result.transfer).toEqual({ candidate: saint('duplex'), direction: 'forward' });
  });
});

describe('decideOccurrence — ordinary-sunday', () => {
  it('duplex or higher wins outright, and the Sunday itself is commemorated', () => {
    const result = decideOccurrence('ordinary-sunday', 'post-epiphany-2', saint('duplex'));
    expect(result.winner).toEqual({ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'duplex' });
    expect(result.commemorations).toEqual([{ kind: 'temporal', id: 'post-epiphany-2' }]);
    expect(result.transfer).toBeUndefined();
  });

  it('simplex stays and is commemorated, not transferred', () => {
    const result = decideOccurrence('ordinary-sunday', 'post-epiphany-2', saint('simplex'));
    expect(result.winner).toEqual({ kind: 'temporal', id: 'post-epiphany-2' });
    expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank: 'simplex' }]);
    expect(result.transfer).toBeUndefined();
  });

  it('semiduplex gets nothing here — transfers forward', () => {
    const result = decideOccurrence('ordinary-sunday', 'post-epiphany-2', saint('semiduplex'));
    expect(result.winner).toEqual({ kind: 'temporal', id: 'post-epiphany-2' });
    expect(result.commemorations).toEqual([]);
    expect(result.transfer).toEqual({ candidate: saint('semiduplex'), direction: 'forward' });
  });

  it('vigil gets nothing here — transfers backward', () => {
    const result = decideOccurrence('ordinary-sunday', 'post-epiphany-2', saint('vigil'));
    expect(result.transfer).toEqual({ candidate: saint('vigil'), direction: 'backward' });
  });
});

describe('decideOccurrence — privileged-sunday', () => {
  it('is never displaced; duplex-majus and up are commemorated', () => {
    for (const rank of ['duplex-majus', 'duplex-2-classis', 'duplex-1-classis'] as const) {
      const result = decideOccurrence('privileged-sunday', 'advent-1', saint(rank));
      expect(result.winner).toEqual({ kind: 'temporal', id: 'advent-1' });
      expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'x', name: 'St. Ereden', rank }]);
      expect(result.transfer).toBeUndefined();
    }
  });

  it('duplex, semiduplex, and simplex all transfer forward — no bare commemoration here', () => {
    for (const rank of ['duplex', 'semiduplex', 'simplex'] as const) {
      const result = decideOccurrence('privileged-sunday', 'advent-1', saint(rank));
      expect(result.commemorations).toEqual([]);
      expect(result.transfer).toEqual({ candidate: saint(rank), direction: 'forward' });
    }
  });

  it('vigil transfers backward, same as on an ordinary Sunday', () => {
    const result = decideOccurrence('privileged-sunday', 'advent-1', saint('vigil'));
    expect(result.transfer).toEqual({ candidate: saint('vigil'), direction: 'backward' });
  });
});
