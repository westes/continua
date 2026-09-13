import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';
import { resolveOfficeWinner } from '../../src/hours/resolve-common';
import { resolveOrdo } from '../../src/hours';

// 2026-09-13: a plain ordinary Sunday (14th ... after Trinity) that falls
// on day 6 of 8 of the Nativity of the BVM's own octave (Sept 8-15,
// `wins: duplex`) -- a genuine mid-octave day, not the octave's own
// closing day (Sept 15). No sanctoral entry exists at all on Sept 13
// (calendar/data/calendar/sanctoral-calendar.yml has none), so there's no
// other contender. Per direct instruction (2026-09-13): a Sunday keeps
// its own office on a day like this, with the octave merely commemorated
// -- see calendar/octaves.ts's octaveGoverningPrivilegedDay for the fix.
describe('an ordinary Sunday on a mere mid-octave day, no other contender', () => {
  const day = resolveDay('2026-09-13');

  it('keeps the Sunday as the real winner, with the octave only commemorated', () => {
    expect(day.winner.kind).toBe('temporal');
    expect(day.commemorations).toContainEqual(
      expect.objectContaining({ kind: 'octave', id: 'nativity-bvm' }),
    );
  });

  it("mentions the Sunday in the header, alongside the octave's own commemoration", () => {
    const label = getDayLabel(day);
    expect(label.en).toContain('Sunday after Trinity');
    expect(label.en).toContain('Octave of the Nativity');
  });

  it("resolveOfficeWinner doesn't synthesize a fake sanctoral winner from the octave", () => {
    expect(resolveOfficeWinner(day).kind).toBe('temporal');
  });

  it("Matins' invitatory antiphon comes from the Sunday's own weekday tier, not the octave's (matins-invitatory-nativity-bvm.yml exists and would otherwise win)", () => {
    const ordo = resolveOrdo('matins', '2026-09-13');
    const invitatoryAntiphon = ordo.parts.find((p) => p.kind === 'antiphon');
    expect(invitatoryAntiphon?.kind).toBe('antiphon');
    if (invitatoryAntiphon?.kind === 'antiphon') {
      expect(invitatoryAntiphon.text.text.la).toContain('Adorémus Dóminum');
      expect(invitatoryAntiphon.text.text.la).not.toContain('Nativitátem');
    }
  });
});
