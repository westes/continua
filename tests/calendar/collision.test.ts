import { describe, expect, it } from 'vitest';
import { resolveCollision } from '../../src/calendar/collision';
import type { SanctoralIdentity } from '../../src/calendar/types';

function saint(id: string, rank: SanctoralIdentity['rank']): SanctoralIdentity {
  return { id, name: id, rank };
}

describe('resolveCollision', () => {
  it('higher rank wins regardless of which side is incoming vs native', () => {
    const incoming = saint('incoming', 'semiduplex');
    const native = saint('native', 'simplex');
    const result = resolveCollision(incoming, native);
    expect(result.winner).toEqual({ kind: 'sanctoral', id: 'incoming', name: 'incoming', rank: 'semiduplex' });
    expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'native', name: 'native', rank: 'simplex' }]);
  });

  it('a transferred Vigil beats a native Simplex (vigil ranks above simplex for collisions)', () => {
    const result = resolveCollision(saint('vigil-feast', 'vigil'), saint('native', 'simplex'));
    expect(result.winner.kind).toBe('sanctoral');
    expect(result.winner.kind === 'sanctoral' ? result.winner.id : undefined).toBe('vigil-feast');
  });

  it('a native Semiduplex beats a transferred Vigil', () => {
    const result = resolveCollision(saint('vigil-feast', 'vigil'), saint('native', 'semiduplex'));
    expect(result.winner.kind === 'sanctoral' ? result.winner.id : undefined).toBe('native');
    expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'vigil-feast', name: 'vigil-feast', rank: 'vigil' }]);
  });

  it('ties favor the native occupant, the incoming feast is commemorated', () => {
    const result = resolveCollision(saint('incoming', 'duplex'), saint('native', 'duplex'));
    expect(result.winner.kind === 'sanctoral' ? result.winner.id : undefined).toBe('native');
    expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'incoming', name: 'incoming', rank: 'duplex' }]);
  });

  it('the loser is always commemorated, with no rank threshold', () => {
    const result = resolveCollision(saint('incoming', 'duplex-1-classis'), saint('native', 'simplex'));
    expect(result.commemorations).toEqual([{ kind: 'sanctoral', id: 'native', name: 'native', rank: 'simplex' }]);
  });
});
