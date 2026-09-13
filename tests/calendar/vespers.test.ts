import { describe, expect, it } from 'vitest';
import { resolveEveningDay } from '../../src/calendar/vespers';

describe('resolveEveningDay', () => {
  it('anticipates tomorrow when tomorrow is a Sunday and today is a plain feria (Saturday before Advent I)', () => {
    // Nov 30, 2025 is Advent I Sunday.
    const day = resolveEveningDay('2025-11-29');
    expect(day.date).toBe('2025-11-30');
    expect(day.season).toBe('advent');
  });

  it('does not anticipate between two plain ferias', () => {
    // 2033-09-06: Tuesday, ordinary trinitytide, genuinely free of any
    // saint or active octave on both this date and the next (2026-06-16,
    // used here previously, fell inside Sacred Heart's own octave once
    // that was modeled 2026-08-26 -- see TODO.md).
    const day = resolveEveningDay('2033-09-06');
    expect(day.date).toBe('2033-09-06');
  });

  it('anticipates Easter from Holy Saturday', () => {
    // Easter 2026 is Apr 5, so Holy Saturday is Apr 4.
    const day = resolveEveningDay('2026-04-04');
    expect(day.date).toBe('2026-04-05');
    expect(day.season).toBe('eastertide');
  });

  it('an ordinary Sunday cedes Second Vespers to a following Duplex+ feast, same threshold as its own daytime office', () => {
    // Aug 10, 2026 (Monday) is St. Lawrence, Duplex II classis — well above
    // minimumOutrightWinningRank('ordinary-sunday') (`duplex`), the same
    // threshold that already lets a plain Duplex win an ordinary Sunday's
    // daytime office outright (see commemorations.ts). An ordinary Sunday
    // isn't a rank-independent absolute for Vespers either.
    const day = resolveEveningDay('2026-08-09');
    expect(day.date).toBe('2026-08-10');
    expect(day.winner.kind).toBe('sanctoral');
    if (day.winner.kind === 'sanctoral') {
      expect(day.winner.id).toBe('st-lawrence');
      expect(day.winner.vespersFrom).toBe('firstVespersOfTomorrow');
    }
  });

  it('an ordinary Sunday keeps its own Second Vespers before a lower-ranked weekday feast', () => {
    // Sep 28, 2026 (Monday) is St. Wenceslaus, Semiduplex — below
    // minimumOutrightWinningRank('ordinary-sunday') (`duplex`), so the
    // Sunday keeps its own evening.
    const day = resolveEveningDay('2026-09-27');
    expect(day.date).toBe('2026-09-27');
    expect(day.winner.kind).not.toBe('sanctoral');
  });

  it('an ordinary feria before a real high-ranked feast anticipates it', () => {
    // Aug 14, 2026 (Friday) is a plain feria; Aug 15 is the Assumption,
    // Duplex I classis.
    const day = resolveEveningDay('2026-08-14');
    expect(day.date).toBe('2026-08-15');
    expect(day.winner.kind).toBe('sanctoral');
    if (day.winner.kind === 'sanctoral') {
      expect(day.winner.id).toBe('assumption');
      expect(day.winner.vespersFrom).toBe('firstVespersOfTomorrow');
    }
  });

  // The cases below are live-verified against the real Monastic
  // Tridentinum 1617 engine (see commemorationOfDisplacedPredecessor/
  // -Successor's own doc comments in calendar/vespers.ts) —
  // "commemoratio de præcedenti/sequenti" vs. "nihil de præcedenti" in
  // the raw output, not just inferred from the daytime rule.
  it('a Semiduplex loser is still commemorated when tomorrow claims First Vespers', () => {
    // Aug 8, 2026 (Ss. Cyriacus/Largus/Smaragdus, Semiduplex) loses the
    // evening to Aug 9 (Sunday); still commemorated.
    const day = resolveEveningDay('2026-08-08');
    expect(day.date).not.toBe('2026-08-08');
    expect(day.commemorations).toContainEqual(
      expect.objectContaining({ kind: 'sanctoral', id: 'ss-cyriacus-largus-and-smaragdus' }),
    );
  });

  it('a Simplex loser is not commemorated when tomorrow claims First Vespers', () => {
    // Aug 7, 2026 (St. Donatus, Simplex) loses the evening to Aug 8
    // (Ss. Cyriacus/Largus/Smaragdus, now Semiduplex-threshold-eligible
    // for First Vespers — see hasFirstVespers); not commemorated.
    const day = resolveEveningDay('2026-08-07');
    expect(day.date).not.toBe('2026-08-07');
    expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-donatus')).toBe(false);
  });

  it('a winning day still commemorates a non-Simplex loser on the other side', () => {
    // Jul 25, 2026 (St. James the Greater, Duplex II. classis) keeps its
    // own Second Vespers outright, but still commemorates Jul 26
    // (St. Anne).
    const day = resolveEveningDay('2026-07-25');
    expect(day.date).toBe('2026-07-25');
    expect(day.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'st-anne' }));
  });

  it('a winning day still commemorates a Simplex loser on the other side (asymmetric with the reverse direction)', () => {
    // Aug 24, 2026 (St. Bartholomew, Duplex II. classis) keeps its own
    // Second Vespers outright, but still commemorates Aug 25 (St. Louis,
    // Simplex) -- live-verified "commemoratio de sequenti," unlike the
    // reverse direction (a Simplex predecessor losing to tomorrow's First
    // Vespers, see the Donatus case above) where Simplex IS excluded.
    // Reported by the user 2026-08-26; previously both directions shared
    // one Simplex-excluding commemorationOf, inferred symmetric but never
    // independently verified for this direction.
    const day = resolveEveningDay('2026-08-24');
    expect(day.date).toBe('2026-08-24');
    expect(day.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'st-louis' }));
  });

  it('a higher-ranked today keeps its own Second Vespers against a lower-ranked tomorrow, even below the old duplex-2-classis floor', () => {
    // Jan 22, 2026: Ss. Vincent and Anastasius (Semiduplex) vs. Jan 23's
    // St. Emerentiana (Simplex). Vincent and Anastasius outrank
    // Emerentiana, so they should keep their own evening even though
    // Semiduplex never cleared the old fixed duplex-2-classis floor -- the
    // real "De Concurrentia Officii" rule is a direct comparison against
    // tomorrow's rank, not a fixed threshold on today alone. Originally
    // reported by the user 2026-08-31 against Aug 31/Sep 1 (St. Raymond
    // Nonnatus vs. St. Giles); re-pointed at Feb 5/Feb 6 (St. Agatha vs.
    // St. Dorothea) once St. Giles was dropped from the Sept 1 calendar
    // (2026-09-01), then re-pointed again here once St. Titus was added
    // alongside St. Dorothea on Feb 6, outranking Agatha outright
    // (2026-09-07).
    const day = resolveEveningDay('2026-01-22');
    expect(day.date).toBe('2026-01-22');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'ss-vincent-and-anastasius' });
    expect(day.commemorations).toContainEqual(expect.objectContaining({ kind: 'sanctoral', id: 'st-emerentiana', vespersNote: 'tomorrow' }));
  });

  it('an exact rank tie goes to tomorrow, per the rubric\'s tie-break', () => {
    // Aug 25, 2026: St. Louis (Simplex) vs. Aug 26's St. Zephyrinus (also
    // Simplex) -- live-verified (see hasFirstVespers's own doc comment):
    // "Vespera de sequenti; nihil de præcedenti." Tomorrow wins on the tie,
    // and Louis (Simplex) is excluded from commemoration, same as any other
    // Simplex predecessor.
    const day = resolveEveningDay('2026-08-25');
    expect(day.date).toBe('2026-08-26');
    expect(day.winner).toMatchObject({ kind: 'sanctoral', id: 'st-zephyrinus' });
    expect(day.commemorations.some((c) => c.kind === 'sanctoral' && c.id === 'st-louis')).toBe(false);
  });
});
