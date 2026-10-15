import { describe, expect, it } from 'vitest';
import { resolveOrdo } from '../../src/hours';

// Engine-verified results of the 2026-10 Vespers audit (Monastic Tridentinum
// 1617 live engine, or Divino Afflatu 1954 where the feast postdates 1617).
const ordo = (hour: 'matins' | 'lauds' | 'vespers', date: string) => resolveOrdo(hour, date);
const text = (hour: 'lauds' | 'vespers', date: string) => JSON.stringify(ordo(hour, date));
const psalmNumbers = (date: string) =>
  ordo('vespers', date)
    .parts.filter((p) => p.kind === 'psalm')
    .map((p) => (p as { psalmNumber: number }).psalmNumber);
const partText = (hour: 'lauds' | 'vespers', date: string, kind: string) => {
  // The office's own chapter/responsory/hymn/versicle follow the chapter; the
  // opening "Deus in adjutórium" versicle precedes the psalmody.
  const parts = ordo(hour, date).parts;
  const from = parts.findIndex((p) => p.kind === 'chapter');
  const part = parts.slice(Math.max(from, 0)).find((p) => p.kind === kind) as { text: { text: { la?: string } } } | undefined;
  return part?.text.text.la ?? '';
};

describe('proper bundles no longer fall through to the ferial chapter/hymn/versicle', () => {
  it('Visitation takes the BVM Common bundle at Second Vespers (Sir 24:14, Ave maris stella, Dignáre me)', () => {
    expect(partText('vespers', '2026-07-02', 'chapter')).toContain('Ab inítio et ante sǽcula');
    expect(partText('vespers', '2026-07-02', 'hymn')).toContain('Ave maris stella');
    expect(partText('vespers', '2026-07-02', 'versicle')).toContain('Dignáre me laudáre te');
  });

  it("St. Michael (Sept 29) has his own Lauds responsory and Vespers hymn, first/second versicles", () => {
    expect(partText('lauds', '2026-09-29', 'chapter')).toContain('Significávit Deus');
    expect(partText('lauds', '2026-09-29', 'responsory')).toContain('In conspéctu Angelórum');
    expect(partText('lauds', '2026-09-29', 'responsory')).not.toContain('Allelúja');
    expect(partText('vespers', '2026-09-29', 'hymn')).toContain('Tibi Christe splendor Patris');
    expect(partText('vespers', '2026-09-29', 'versicle')).toContain('In conspéctu Angelórum psallam tibi, Deus meus.');
    expect(partText('vespers', '2026-09-28', 'versicle')).toContain('Stetit Angelus juxta aram templi.');
  });

  it('the Dedication feasts take the Common of a Dedication (Rev 21:2, Urbs beáta, Locus iste)', () => {
    for (const date of ['2026-11-09', '2026-11-17']) {
      expect(partText('vespers', date, 'chapter')).toContain('Vidi civitátem sanctam');
      expect(partText('vespers', date, 'hymn')).toContain('Urbs beáta Jerúsalem');
      expect(partText('vespers', date, 'responsory')).toContain('Locus iste sanctus est');
    }
    expect(partText('vespers', '2026-11-09', 'versicle')).toContain('Domum tuam, Dómine, decet sanctitúdo');
    expect(partText('vespers', '2026-11-17', 'versicle')).toContain('Hæc est domus Dómini');
    expect(partText('lauds', '2026-11-09', 'hymn')).toContain('Anguláris fundaméntum');
  });

  it('a Confessor Pope (St. Leo II) uses the Confessor Bishop bundle', () => {
    expect(partText('lauds', '2026-07-03', 'chapter')).toContain('Ecce sacérdos magnus');
    expect(partText('lauds', '2026-07-03', 'hymn')).toContain('Jesu Redémptor ómnium');
  });

  it("Ss. Perpetua and Felicity take the Several Women Martyrs bundle (Sir 51:1-3)", () => {
    expect(partText('lauds', '2027-03-06', 'chapter')).toContain('Confitébor tibi, Dómine, Rex');
    expect(partText('lauds', '2027-03-06', 'responsory')).toContain('Spécie tua');
  });

  it("St. Mary Magdalene has her own Vespers, Lauds and Matins hymns", () => {
    expect(partText('vespers', '2026-07-22', 'hymn')).toContain('Pater supérni lúminis');
    expect(partText('lauds', '2026-07-22', 'hymn')).toContain('Ætérne Patris Unice');
    const matins = JSON.stringify(ordo('matins', '2026-07-22'));
    expect(matins).toContain('Nardo María pístico');
  });
});

describe('First/Second Vespers psalmody the engine renders', () => {
  it('Ss. Philip and James: Ps 109/110/111/112 at First, 109/112/115/125 at Second Vespers', () => {
    expect(psalmNumbers('2026-04-30')).toEqual([109, 110, 111, 112]);
    expect(psalmNumbers('2026-05-01')).toEqual([109, 112, 115, 125]);
  });

  it("the Apostles' Common has its own First Vespers antiphons (Hoc est præcéptum meum)", () => {
    expect(text('vespers', '2026-02-23')).toContain('Hoc est præcéptum meum');
    expect(text('vespers', '2026-02-24')).not.toContain('Hoc est præcéptum meum');
  });

  it('Decollation of St. John: antiphons 1, 2, 3 and 5 on Ps 109-112', () => {
    expect(psalmNumbers('2027-08-29')).toEqual([109, 110, 111, 112]);
    expect(text('vespers', '2027-08-29')).toContain('Da mihi in disco');
    expect(text('vespers', '2027-08-29')).not.toContain('Arguébat');
  });

  it('Easter Sunday Vespers has its own antiphons', () => {
    expect(text('vespers', '2027-03-28')).toContain('Angelus autem Dómini');
  });

  // The Doctor cases use St. Peter Canisius (Apr 27) and St. Albert the Great
  // (Nov 15), not St. Jerome: his Sep 30 evening is not his own once Our
  // Lady, Mediatrix of All Graces (Duplex majus, Oct 1) has First Vespers.
  it('St. Peter Canisius takes the Confessor-not-Bishop antiphons, not the Bishop-Doctors', () => {
    const antiphons = ordo('vespers', '2027-04-27')
      .parts.filter((p) => p.kind === 'psalm')
      .map((p) => JSON.stringify((p as { antiphon?: unknown }).antiphon ?? ''))
      .join(' ');
    expect(antiphons).toContain('Dómine, quinque talénta');
    expect(antiphons).not.toContain('Ecce sacérdos magnus');
  });

  it('a Doctor\'s Magnificat antiphon names the saint instead of a literal "N."', () => {
    const t = text('vespers', '2027-11-15');
    expect(t).toContain('beáte Alberte');
    expect(t).not.toContain('beáte N.');
  });

  it('a Doctor commemorated at Vespers names the saint in the commemoration antiphon too', () => {
    // St. John Chrysostom is commemorated at Vespers on Jan 26, 2027 (St.
    // Polycarp's day); his antiphon used to read "beáte N." there.
    const v = text('vespers', '2027-01-26');
    expect(v).toContain('beáte Joánnes Chrysóstome');
    expect(v).not.toContain('beáte N.');
  });

  it('Purification and the Octave of Ss. Peter and Paul have their own versicles', () => {
    expect(partText('vespers', '2026-02-02', 'versicle')).toContain('Respónsum accépit Símeon');
    expect(partText('vespers', '2026-07-06', 'versicle')).toContain('Constítues eos príncipes');
  });

  it('St. Joseph keeps his own Common-proper versicle (the 1617 engine treats him as a plain confessor; Divino Afflatu agrees with this app)', () => {
    expect(partText('vespers', '2029-03-19', 'versicle')).toContain('Constítuit eum dóminum domus suæ');
  });
});

describe('Paschaltide Alleluia on saints and Commons (engine rule: antiphons, versicle, short responsory)', () => {
  it('St. Robert Bellarmine (May 12, Paschaltide): antiphon, versicle and responsory carry the Alleluia', () => {
    const j = text('vespers', '2026-05-12');
    expect(j).toContain('iustus, allelúja.');
    expect(partText('vespers', '2026-05-12', 'versicle')).toContain('Amávit eum Dóminus, et ornávit eum, allelúja.');
    expect(partText('vespers', '2026-05-12', 'versicle')).toContain('Stolam glóriæ índuit eum, allelúja.');
    expect(partText('vespers', '2026-05-12', 'responsory')).toContain('* Allelúja, allelúja.');
  });

  it('outside Paschaltide the same texts stay plain', () => {
    expect(partText('vespers', '2026-11-11', 'versicle')).not.toMatch(/allelúja/i);
    expect(partText('vespers', '2026-11-11', 'responsory')).not.toMatch(/allelúja/i);
  });
});

describe('scripture lessons proper to a feast are labelled by book, not as a saint\'s life', () => {
  it('the Sirach lesson on Our Lady of the Rosary is headed "A reading from the book of Sirach"', () => {
    const lessons = ordo('matins', '2026-10-07').parts.filter((p) => p.kind === 'lesson') as unknown as {
      text: { citation?: { en?: string } };
      label?: string | { la?: string; en?: string };
    }[];
    const sirach = lessons.find((l) => l.text.citation?.en?.startsWith('Sir 24'));
    expect(sirach).toBeDefined();
    expect(JSON.stringify(sirach?.label)).toContain('A reading from the book of Sirach');
    expect(JSON.stringify(sirach?.label)).not.toContain('On Our Lady of the Rosary');
  });
});

describe('Easter-week and Septuagesima-eve dismissal takes the double alleluia', () => {
  const plain = 'Benedicámus Dómino.';
  const dbl = 'Benedicámus Dómino, allelúja, allelúja.';
  it.each([
    ['lauds', '2026-04-06'],
    ['lauds', '2026-04-11'],
    ['vespers', '2026-04-05'],
    ['vespers', '2026-04-09'],
    ['vespers', '2026-01-31'],
  ] as const)('%s %s', (hour, date) => {
    const t = text(hour, date);
    expect(t).toContain(dbl);
    expect(t).not.toContain(plain);
  });
  it.each([
    ['vespers', '2026-04-11'],
    ['lauds', '2026-04-12'],
    ['lauds', '2026-05-26'],
    ['vespers', '2026-01-30'],
  ] as const)('%s %s stays plain', (hour, date) => {
    expect(text(hour, date)).toContain(plain);
  });
});

describe('Triduum Vespers follow the engine', () => {
  const kinds = (date: string) => ordo('vespers', date).parts.map((p) => p.kind);
  it.each(['2026-04-02', '2026-04-03'])('%s drops chapter/hymn/responsory/versicle/preces and keeps one collect', (d) => {
    const k = kinds(d);
    for (const x of ['chapter', 'hymn', 'responsory', 'versicle', 'preces']) expect(k).not.toContain(x);
    expect(k.filter((x) => x === 'prayer')).toHaveLength(1);
    expect(k).toContain('canticle');
  });
  it('Holy Saturday evening is its own short Vespers', () => {
    const t = text('vespers', '2026-04-04');
    expect(ordo('vespers', '2026-04-04').parts.filter((p) => p.kind === 'psalm')).toHaveLength(1);
    expect(psalmNumbers('2026-04-04')).toEqual([116]);
    expect(t).toContain('Véspere autem sábbati');
    expect(t).toContain('Spíritum nobis, Dómine');
    expect(t).toContain('Benedicámus Dómino, allelúja, allelúja.');
    expect(kinds('2026-04-04')).not.toContain('hymn');
  });
});

describe('seasonal Sundays, Prime capitulum, Saturday First Vespers, Epiphany octave', () => {
  const lat = (hour: 'lauds' | 'vespers' | 'prime' | 'terce', date: string) => JSON.stringify(ordo(hour as 'lauds', date));
  it('Septuagesima Sunday Lauds takes its own antiphons and chapter, not the per-annum Sunday set', () => {
    const t = lat('lauds', '2027-01-24');
    expect(t).toContain('Miserére');
    expect(t).toContain('Nescítis quod ii qui in stádio currunt');
    expect(t).not.toContain('Tres púeri');
  });
  it('Advent I Terce has its own antiphon and chapter', () => {
    expect(lat('terce', '2026-11-29')).not.toContain('Sana me, Dómine');
  });
  it('Prime capitulum: ferial text on a bare weekday and a Vigil, Sunday text on feasts and in Eastertide', () => {
    expect(lat('prime', '2027-02-16')).toContain('Pacem et veritátem');
    expect(lat('prime', '2027-06-23')).toContain('Pacem et veritátem');
    expect(lat('prime', '2026-12-25')).toContain('Regi sæculórum');
    expect(lat('prime', '2027-04-08')).toContain('Regi sæculórum');
  });
  it('Saturday evening before a per-annum Sunday uses the Saturday hymn, not the Sunday one', () => {
    const t = lat('vespers', '2025-11-15');
    expect(t).not.toContain('Lucis Creátor');
  });
  it('Epiphany octave days carry their own antiphons and the closing day beats the next saint at Vespers', () => {
    expect(lat('lauds', '2027-01-07')).toContain('Ab Oriénte');
    expect(lat('vespers', '2027-01-13')).toContain('Tribus miráculis');
    expect(lat('vespers', '2027-01-12')).toContain('Magi vidéntes');
  });
  it('the Octave days of St. John and the Holy Innocents take the office on Jan 3 and 4', () => {
    expect(lat('lauds', '2027-01-03')).toContain('Iste est Joánnes');
    expect(lat('lauds', '2027-01-04')).toContain('Hi sunt');
  });
  it('apostle First Vespers has its own versicle', () => {
    expect(lat('vespers', '2027-06-28')).toContain('In omnem terram');
  });
  it('Epiphany on a Sunday (2030): Jan 12 is the 7th octave day with its own Benedictus antiphon', () => {
    expect(lat('lauds', '2030-01-12')).toContain('Maniféste magnum');
  });
});
