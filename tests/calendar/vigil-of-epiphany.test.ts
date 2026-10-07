import { describe, expect, it } from 'vitest';
import { resolveDay } from '../../src/calendar';
import { getDayLabel } from '../../src/calendar/day-label';
import { resolveOrdo } from '../../src/hours';

// Jan 5 is the Vigil of the Epiphany (Sancti/01-05.txt: Semiduplex), with
// St. Telesphorus commemorated. Its collect, Lauds antiphons, chapter and
// short reading are the Sunday-within-the-Christmas-octave's (`@Tempora/
// Nat1-0` in the source); only its Matins readings are its own.
describe('Jan 5, the Vigil of the Epiphany', () => {
  it.each(['2026-01-05', '2027-01-05', '2028-01-05'])('%s: the Vigil wins, Telesphorus commemorated, no Sunday commemoration', (date) => {
    const day = resolveDay(date);
    expect(day.winner).toEqual({ kind: 'temporal', id: 'vigil-of-epiphany' });
    expect(day.commemorations.map((c) => c.id)).toEqual(['st-telesphorus']);
  });

  it('is labelled "Vigil of the Epiphany (Semiduplex)"', () => {
    expect(getDayLabel(resolveDay('2026-01-05')).en).toContain('Vigil of the Epiphany (Semiduplex)');
  });

  it('Matins reads Augustine and the Gospel with Jerome\'s homily', () => {
    const texts = resolveOrdo('matins', '2026-01-05')
      .parts.map((p) => JSON.stringify(p))
      .join('\n');
    expect(texts).toContain('Dóminus noster Jesus Christus, fratres caríssimi');
    expect(texts).toContain('Matt 2:19-23');
    expect(texts).toContain('Ex hoc loco intellígimus');
  });

  it("Lauds uses the Christmas-octave Sunday's antiphons and chapter", () => {
    const lauds = JSON.stringify(resolveOrdo('lauds', '2026-01-05').parts);
    expect(lauds).toContain('Quem vidístis');
    expect(lauds).toContain('Fratres: Quanto témpore heres párvulus est');
  });

  it("Prime's Short Reading is Gal 4:7", () => {
    const lesson = resolveOrdo('prime', '2026-01-05').parts.find((p) => p.kind === 'lesson' && p.label === 'Short Reading');
    expect(lesson && lesson.kind === 'lesson' ? lesson.text.text.la : undefined).toContain('Itaque jam non est servus');
  });

  it('no hour has missing content', () => {
    for (const hour of ['matins', 'lauds', 'prime', 'terce', 'sext', 'none', 'vespers', 'compline'] as const) {
      expect(JSON.stringify(resolveOrdo(hour, '2026-01-05').parts)).not.toContain('"missing"');
    }
  });
});
