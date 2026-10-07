import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// Each feast with its own [Lectio Prima] in the reference source must show
// that proper reading at Prime, not its Common category's or the season's.
describe('resolveOrdo("prime", ...) proper Lectio Brevis', () => {
  it.each([
    ['2025-02-02', 'purification', 'Et placébit Dómino'],
    ['2025-03-25', 'annunciation', 'Egrediétur virga de'],
    ['2025-03-24', 'st-gabriel-archangel', 'Scito ergo et'],
    ['2025-05-31', 'queenship-of-the-bvm', 'Qui audit me,'],
    ['2025-01-25', 'conversion-of-st-paul', 'Saulus autem multo'],
    ['2025-05-03', 'finding-of-the-holy-cross', 'Humiliávit semetípsum factus'],
    ['2025-05-08', 'apparition-of-st-michael', 'Factum est prǽlium'],
    ['2025-02-11', 'apparition-of-the-immaculate-bvm', 'In me grátia'],
    ['2025-06-30', 'commemoration-of-st-paul', 'Ego enim sum'],
    ['2025-06-24', 'nativity-of-st-john-the-baptist', 'Reges vidébunt, et'],
    ['2025-03-19', 'st-joseph', 'Prófugum justum dedúxit'],
    ['2025-08-06', 'transfiguration', 'Sústulit me in'],
    ['2025-08-10', 'st-lawrence', 'Potens est autem'],
    ['2025-08-15', 'assumption', 'Tu glória Jerúsalem,'],
    ['2025-10-24', 'st-raphael-archangel', 'Tempus est ut'],
    ['2025-11-01', 'all-saints', 'Benedíctio, et cláritas,'],
    ['2025-10-02', 'guardian-angels', 'Quod, si audíeris'],
    ['2025-12-08', 'immaculate-conception', 'Signum magnum appáruit'],
    ['2025-12-26', 'st-stephen-protomartyr', 'Pósitis autem génibus,'],
    ['2026-12-28', 'holy-innocents', 'Hi empti sunt'],
    ['2025-06-29', 'ss-peter-and-paul', 'Et Petrus ad'],
    ['2025-12-27', 'st-john-apostle', 'In médio Ecclésiæ'],
    ['2026-11-30', 'st-andrew', 'Isaías enim dicit:'],
    ['2026-01-06', 'epiphany', 'Omnes de Saba'],
    ['2025-12-25', 'christmas-day', 'Ipsi períbunt, tu'],
    ['2025-12-24', 'vigil-of-christmas', 'Per quem accépimus'],
    ['2026-04-22', 'patronage-of-st-joseph', 'Fílius accréscens Joseph,'],
    ['2026-12-27', 'christmas-octave-sunday', 'Itaque jam non'],
    ['2025-01-02', 'holy-name-of-jesus', 'Omne quodcúmque fácitis'],
    ['2026-05-24', 'pentecost-sunday', 'Judǽi quoque et'],
    ['2026-06-07', 'post-pentecost-02', 'Filíoli mei, non'],
    ['2026-06-12', 'sacred-heart', 'In caritáte radicáti'],
    ['2026-05-14', 'ascension', 'Viri Galilǽi, quid'],
    ['2026-06-04', 'corpus-christi', 'Quicúmque manducáverit panem'],
    ['2024-03-22', 'friday-passion-week', 'Generatiónem ejus quis'],
    ['2026-08-03', 'finding-of-st-stephen', 'Pósitis autem génibus,'],
    ['2026-08-01', 'st-peter-ad-vincula (Common of St. Peter)', 'Et Petrus ad'],
    ['2026-04-25', 'st-mark (evangelist)', 'Ibant Apóstoli gaudéntes'],
    ['2025-10-18', 'st-luke (evangelist)', 'Ibant Apóstoli gaudéntes'],
  ])('%s (%s) shows its own reading beginning "%s"', (date, _id, incipit) => {
    const lesson = resolveOrdo('prime', date).parts.find(
      (p) => p.kind === 'lesson' && p.label === 'Short Reading',
    );
    expect(lesson && lesson.kind === 'lesson' ? lesson.text.text.la : undefined).toContain(incipit);
  });
});

describe('resolveOrdo("prime", ...) several-women-martyrs Common Lectio Brevis', () => {
  it('2026-03-06 (Ss. Perpetua and Felicity) uses the C6 reading', () => {
    const lesson = resolveOrdo('prime', '2026-03-06').parts.find(
      (p) => p.kind === 'lesson' && p.label === 'Short Reading',
    );
    expect(lesson && lesson.kind === 'lesson' ? lesson.text.text.la : undefined).toContain('Dómine, Deus meus, exaltásti');
  });
});

describe('resolveOrdo("prime", ...) Sunday-only proper readings', () => {
  it("the Second Sunday after Pentecost's reading doesn't leak onto the weekdays after it", () => {
    for (const date of ['2026-06-08', '2026-06-09']) {
      const lesson = resolveOrdo('prime', date).parts.find(
        (p) => p.kind === 'lesson' && p.label === 'Short Reading',
      );
      expect(lesson && lesson.kind === 'lesson' ? lesson.text.text.la : undefined).not.toContain('Filíoli mei');
    }
  });
});
