import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// A Common's text must never silently fall back to the weekday's ferial text.
// Each case pins a part that used to do so (or to a wrong sibling Common's
// text) to the reference engine's actual Common/Sancti source.
const cases: [string, string, string, string, string][] = [
  ['2026-10-08', 'terce', 'chapter', 'Mulíerem fortem', 'Bridget (widow, C7a)'],
  ['2026-10-08', 'sext', 'chapter', 'Manum suam apéruit', 'Bridget (widow, C7a)'],
  ['2026-10-08', 'none', 'chapter', 'Multæ fíliæ', 'Bridget (widow, C7a)'],
  ['2027-03-06', 'terce', 'chapter', 'Confitébor tibi', 'Perpetua and Felicity (C7b->C7)'],
  ['2027-03-06', 'sext', 'chapter', 'Liberásti me', 'Perpetua and Felicity (C7b->C7)'],
  ['2027-03-06', 'none', 'chapter', 'Laudábit usque ad mortem', 'Perpetua and Felicity (C7b->C7)'],
  ['2027-03-06', 'matins', 'hymn', 'Hujus obténtu', 'Perpetua and Felicity (C7b->C7)'],
  ['2026-11-09', 'matins', 'hymn', 'Urbs beáta', 'Dedication (C8)'],
  ['2026-10-24', 'lauds', 'chapter', 'Quando orábas', 'Raphael (Sancti/10-24)'],
  ['2026-10-24', 'terce', 'chapter', 'Quando orábas', 'Raphael (Sancti/10-24)'],
  ['2026-10-24', 'sext', 'chapter', 'Et nunc misit me', 'Raphael (Sancti/10-24)'],
  ['2026-10-24', 'none', 'chapter', 'Tempus est ut revértar', 'Raphael (Sancti/10-24)'],
  ['2026-10-24', 'lauds', 'versicle', 'In conspéctu Angelórum', 'Raphael (Sancti/10-24)'],
  ['2026-10-02', 'lauds', 'chapter', 'Ecce ego mittam Angelum', 'Guardian Angels (Sancti/10-02)'],
  ['2026-10-02', 'terce', 'chapter', 'Ecce ego mittam Angelum', 'Guardian Angels (Sancti/10-02)'],
  ['2026-10-02', 'sext', 'chapter', 'Nec contemnéndum', 'Guardian Angels (Sancti/10-02)'],
  ['2026-10-02', 'none', 'chapter', 'Quod, si audíeris', 'Guardian Angels (Sancti/10-02)'],
  ['2026-03-24', 'terce', 'chapter', 'Ecce vir Gábriel', 'Gabriel (Sancti/03-24)'],
  ['2026-03-24', 'sext', 'chapter', 'Ego autem veni', 'Gabriel (Sancti/03-24)'],
  ['2026-03-24', 'none', 'chapter', 'Scito ergo', 'Gabriel (Sancti/03-24)'],
  ['2026-07-01', 'terce', 'chapter', 'Christus assístens Póntifex', 'Most Precious Blood (Sancti/07-01)'],
  ['2026-07-01', 'sext', 'chapter', 'Si sanguis hircórum', 'Most Precious Blood (Sancti/07-01)'],
  ['2026-07-01', 'none', 'chapter', 'Accípiens Móyses', 'Most Precious Blood (Sancti/07-01)'],
  ['2026-07-01', 'matins', 'hymn', 'Ira justa Conditóris', 'Most Precious Blood (Sancti/07-01)'],
  ['2026-08-06', 'terce', 'chapter', 'Salvatórem exspectámus', 'Transfiguration (Sancti/08-06)'],
  ['2026-08-06', 'sext', 'chapter', 'Nos omnes reveláta', 'Transfiguration (Sancti/08-06)'],
  ['2026-09-14', 'terce', 'chapter', 'Hoc enim sentíte in vobis', 'Exaltation of the Holy Cross (ex Sancti/05-03)'],
  ['2026-09-14', 'none', 'chapter', 'Humiliávit semetípsum', 'Exaltation of the Holy Cross (ex Sancti/05-03)'],
  ['2026-05-03', 'sext', 'chapter', 'Mihi autem absit gloriári', 'Finding of the Holy Cross (Sancti/05-03)'],
];

describe('Common-sourced parts never fall back to ferial or a sibling Common', () => {
  it.each(cases)('%s %s %s contains %s (%s)', (date, hour, kind, expected) => {
    const ordo = resolveOrdo(hour as 'matins', date);
    const texts = ordo.parts
      .filter((p) => p.kind === kind)
      .map((p) => (p as { text: { text: Record<string, string> } }).text.text.la ?? '');
    expect(texts.some((t) => t.includes(expected))).toBe(true);
  });

  it('Gabriel\'s Lauds versicle has no hard-coded Alleluia outside Paschaltide', () => {
    const ordo = resolveOrdo('lauds', '2026-03-24');
    const v = ordo.parts.filter((p) => p.kind === 'versicle').map((p) => (p as { text: { text: Record<string, string> } }).text.text.la ?? '');
    expect(v.some((t) => t.includes('Stetit Angelus') && !/allelúia/i.test(t))).toBe(true);
  });

  it.each([
    ['2026-08-06', 'Assúmpsit Jesus', 'Transfiguration'],
    ['2026-07-01', 'Hi qui amícti sunt', 'Most Precious Blood'],
    ['2026-09-14', 'O magnum pietátis opus', 'Exaltation of the Holy Cross'],
    ['2026-05-03', 'O magnum pietátis opus', 'Finding of the Holy Cross'],
  ])('%s Lauds psalm antiphons are the feast\'s own, not ferial: %s (%s)', (date, expected) => {
    const ordo = resolveOrdo('lauds', date);
    const first = ordo.parts.find((p) => p.kind === 'psalm' && (p as { antiphon?: unknown }).antiphon !== undefined && (p as { psalmNumber: number }).psalmNumber === 92) as
      | { antiphon: { text: Record<string, string> } }
      | undefined;
    expect(first?.antiphon.text.la).toContain(expected);
  });
});
