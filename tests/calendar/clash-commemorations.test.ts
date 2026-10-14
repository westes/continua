import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { decideOccurrence } from '../../src/calendar/commemorations';
import type { SanctoralIdentity } from '../../src/calendar/types';

// When two saints share a calendar date, the loser of that contest used to
// be appended as a commemoration unconditionally, even on a day whose own
// rule forbids commemorating anything. It now goes through the same
// decideOccurrence rule a native candidate would.
//
// Dates were found by sweeping 2026-2050 for days where a refusing or
// thresholded temporal category met two sanctoral candidates.

const sanctoralCommemorationIds = (iso: string): string[] =>
  resolveDay(iso)
    .commemorations.filter((c) => c.kind === 'sanctoral')
    .map((c) => c.id);

describe('same-date saint contest losers obey the day\'s own commemoration rule', () => {
  it('Easter Thursday (Easter octave, nothing commemorated): Robert, Catherine of Siena and Odo all lapse', () => {
    const day = resolveDay('2038-04-29');
    expect(day.winner).toMatchObject({ kind: 'temporal', id: 'easter-thursday' });
    expect(sanctoralCommemorationIds('2038-04-29')).toEqual([]);
  });

  it('Septuagesima Sunday (privileged Sunday): Titus and Dorothea share Feb 6, neither is commemorated', () => {
    const day = resolveDay('2039-02-06');
    expect(day.winner).toMatchObject({ kind: 'temporal', id: 'septuagesima' });
    expect(sanctoralCommemorationIds('2039-02-06')).toEqual([]);
  });

  it('Advent I (privileged Sunday): the Vigil of St. Andrew and St. Saturninus are not commemorated', () => {
    expect(sanctoralCommemorationIds('2026-11-29')).toEqual([]);
  });

  it('Vigil of Pentecost: a contest loser below duplex-majus lapses, Isidore is transferred away', () => {
    // May 15 2027 is the Vigil of Pentecost. Isidore (duplex) wins the
    // contest, is impeded, and de la Salle (semiduplex) lapses rather than
    // leaking through as a commemoration.
    const day = resolveDay('2027-05-15');
    expect(day.winner).toMatchObject({ kind: 'temporal', id: 'sunday-after-ascension' });
    expect(sanctoralCommemorationIds('2027-05-15')).toEqual([]);
    expect(day.transferredAway?.candidate.id).toBe('st-isidore-the-farmer');
  });

  it('Corpus Christi: the duplex-2-classis contest winner is commemorated, the simplex loser is not', () => {
    // Corpus Christi is not in the verified no-commemoration span, so it
    // keeps the older rule: Duplex majus and above get a bare commemoration.
    expect(resolveDay('2029-05-31').winner).toMatchObject({ kind: 'temporal', id: 'corpus-christi' });
    expect(sanctoralCommemorationIds('2029-05-31')).toEqual(['queenship-of-the-bvm']);
  });

  it('unaffected: simplex saints sharing an ordinary feria all still appear (St. Paschal I joined Boniface and Pachomius in 2026-10)', () => {
    const day = resolveDay('2027-05-14');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-boniface' });
    expect(sanctoralCommemorationIds('2027-05-14')).toEqual(['st-pachomius', 'st-paschal-i']);
  });
});

describe('privileged-feria-major vs privileged-feria-major-commemorating', () => {
  const saint = (rank: SanctoralIdentity['rank']): SanctoralIdentity => ({ id: 'x', name: 'X', nameLa: 'X', rank });

  it('Palm Sunday-Low Sunday and Ash Wednesday: nothing is commemorated at any rank', () => {
    for (const rank of ['simplex', 'duplex', 'duplex-majus', 'duplex-2-classis', 'duplex-1-classis'] as const) {
      const r = decideOccurrence('privileged-feria-major', 't', saint(rank));
      expect(r.commemorations).toEqual([]);
      expect(r.transfer?.candidate.id).toBe('x');
    }
  });

  it('vigils, Corpus Christi, Sacred Heart: duplex-majus and above commemorated, lower transfers', () => {
    expect(decideOccurrence('privileged-feria-major-commemorating', 't', saint('duplex-majus')).commemorations).toHaveLength(1);
    expect(decideOccurrence('privileged-feria-major-commemorating', 't', saint('duplex-1-classis')).commemorations).toHaveLength(1);
    const lower = decideOccurrence('privileged-feria-major-commemorating', 't', saint('duplex'));
    expect(lower.commemorations).toEqual([]);
    expect(lower.transfer?.candidate.id).toBe('x');
  });
});
