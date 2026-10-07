import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';
import { resolveDay } from '../../src/calendar';

// Oct 7 is Our Lady of the Rosary (Duplex II. classis), replacing St.
// Justina, who is deliberately off-calendar (she had no Matins lessons of
// her own and this app has no Common-lesson mechanism) -- see
// data/calendar/saints/our-lady-of-the-rosary.yml and st-justina.yml.
const DATE = '2026-10-07';
const HOURS = ['matins', 'lauds', 'prime', 'terce', 'sext', 'none', 'vespers', 'compline'] as const;

const ordoJson = (hour: (typeof HOURS)[number]) => JSON.stringify(resolveOrdo(hour, DATE));

describe('Our Lady of the Rosary (Oct 7)', () => {
  it('wins the day, with St. Marcus commemorated and St. Justina off-calendar', () => {
    const day = resolveDay(DATE);
    expect(day.winner.id).toBe('our-lady-of-the-rosary');
    expect(day.commemorations.map((c) => c.id)).toEqual(['st-marcus']);
  });

  it.each(HOURS)('%s has no missing parts', (hour) => {
    expect(ordoJson(hour)).not.toContain('"missing"');
  });

  it("Matins carries the feast's own invitatory, hymn, antiphons and readings", () => {
    const json = ordoJson('matins');
    expect(json).toContain('Solemnitátem Rosárii Vírginis Maríæ celebrémus');
    expect(json).toContain('In monte olívis cónsito');
    expect(json).toContain('Conservábat María');
    expect(json).toContain('Veni de Líbano, * sponsa mea');
    // Nocturn 3 pool: the feast's own Gospel and both St. Bernard homilies,
    // plus St. Marcus's commemorated lesson.
    expect(json).toContain('Missus est Angelus Gábriel');
    expect(json).toContain('Heva spina fuit; María rosa éxstitit');
    expect(json).toContain('Verbum caro factum est, et hábitat jam in nobis');
    expect(json).toContain('Marcus, Romanus');
  });

  it("Lauds and Vespers carry the feast's own antiphons, hymn and collect", () => {
    const lauds = ordoJson('lauds');
    expect(lauds).toContain('Lætáre, * Virgo Mater');
    expect(lauds).toContain('Jam morte, victor, óbruta');
    expect(lauds).toContain('Solemnitátem hodiérnam');
    expect(lauds).toContain('Deus, cujus Unigénitus per vitam, mortem et resurrectiónem suam');
    const vespers = ordoJson('vespers');
    expect(vespers).toContain('Quæ est ista, * speciósa sicut colúmba');
    expect(vespers).toContain('Te gestiéntem gáudiis');
    expect(vespers).toContain('Beáta Mater * et intácta Virgo');
  });

  it('First Vespers (Oct 6 evening) takes the feast\'s own First Vespers hymn and Magnificat antiphon; Second Vespers (Oct 7) takes the other pair', () => {
    const first = JSON.stringify(resolveOrdo('vespers', '2026-10-06'));
    expect(first).toContain('Cæléstis aulæ Núntius');
    expect(first).toContain('Beáta es, * Virgo María');
    expect(first).not.toContain('Te gestiéntem gáudiis');
    expect(first).not.toContain('Beáta Mater * et intácta Virgo');
    const second = ordoJson('vespers');
    expect(second).not.toContain('Cæléstis aulæ Núntius');
    expect(second).not.toContain('Beáta es, * Virgo María');
  });

  it('marks self-translated Matins English as draft instead of verified', () => {
    const parts = resolveOrdo('matins', DATE).parts;
    const draftEn = (needle: string) =>
      parts.some((p) => {
        const t = (p as { text?: { text?: Record<string, string>; status?: Record<string, string> } }).text;
        return t?.text?.en?.includes(needle) && t.status?.en === 'draft';
      });
    expect(draftEn('Mary kept')).toBe(true);
    expect(draftEn('Say among the nations')).toBe(true);
    expect(draftEn('In thy gladness, O holy Mother of God')).toBe(true);
  });
});
