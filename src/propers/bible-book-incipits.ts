// Traditional liturgical incipits ("Léctio libri Sapiéntiæ" / "A reading
// from the book of Wisdom") for every book abbreviation used under
// src/data/scripture — keyed exactly as ScriptureCitation.book spells them
// (bible-plan.ts, octave-readings.ts). Used to replace the generic
// "Reading"/"Gospel" UI heading (see hour-view.ts's renderLessonLabel) with
// a real attribution wherever no editorial `source`/`label` was authored —
// the common case for the user's own continuous bible-plan readings.
//
// Latin wording is drawn directly from the reference engine's own Sancti/
// Commune/Tempora files (grep for "Léctio" across
// ../divinum-officium-reference) wherever a match was found there; the
// handful of books that never get their own proper-of-saints lesson in the
// reference engine (Baruch, Aggeus, Habacuc, Nahum, Abdias, Sophonias, Josue,
// Judges, Ruth, Proverbs, Ecclesiastes, Canticle of Canticles,
// Ecclesiasticus, Lamentations, and the ordinal Kings/Paralipomenon/Esdras/
// Machabees forms) follow the same standard Vulgate genitive pattern as the
// confirmed ones, not independently re-verified per book.
//
// English keeps the reference engine's own "A reading from..." phrasing
// (2026-09-03, user) but says "Saint Paul"/"Saint James"/etc., not "blessed
// Paul" — the reference engine's English text mixes both, and "Saint" is
// the ordinary modern English way to name an apostle, even though the
// Latin `beáti` this pairs with is left as-is (that's correct Latin usage,
// not the thing being fixed).
//
// Book names: the English column uses the modern common-English book name
// (Joshua, Tobit, Isaiah, 1-2 Samuel/1-2 Kings, Ezra/Nehemiah, Maccabees,
// Sirach, Song of Songs, Revelation, etc.) even where that means a
// different name or split than the Vulgate original — an English reader
// should recognize the book being named. This is deliberately independent
// of the Latin column, which keeps the Vulgate/Douay-Rheims Latinate forms
// (Josue, Tobíæ, Isaíæ, Regum, Machabæórum, Ecclesiástici, Apocalýpsis,
// etc.) as its own correct, separate style (2026-09-11, user: "all those
// english names sound better and will make more sense to english
// readers... it's fine for the latin since that's the latin style name").
export const BOOK_INCIPITS: Record<string, { la: string; en: string }> = {
  // Pentateuch
  gen: { la: 'Léctio libri Génesis', en: 'A reading from the book of Genesis' },
  exod: { la: 'Léctio libri Éxodi', en: 'A reading from the book of Exodus' },
  lev: { la: 'Léctio libri Levítici', en: 'A reading from the book of Leviticus' },
  num: { la: 'Léctio libri Numeri', en: 'A reading from the book of Numbers' },
  deut: { la: 'Léctio libri Deuteronómii', en: 'A reading from the book of Deuteronomy' },
  // Historical books
  jos: { la: 'Léctio libri Josue', en: 'A reading from the book of Joshua' },
  jdc: { la: 'Léctio libri Judicum', en: 'A reading from the book of Judges' },
  ruth: { la: 'Léctio libri Ruth', en: 'A reading from the book of Ruth' },
  '1reg': { la: 'Léctio libri primi Regum', en: 'A reading from the first book of Samuel' },
  '2reg': { la: 'Léctio libri secúndi Regum', en: 'A reading from the second book of Samuel' },
  '3reg': { la: 'Léctio libri tértii Regum', en: 'A reading from the first book of Kings' },
  '4reg': { la: 'Léctio libri quárti Regum', en: 'A reading from the second book of Kings' },
  '1par': { la: 'Léctio libri primi Paralipómenon', en: 'A reading from the first book of Chronicles' },
  '2par': { la: 'Léctio libri secúndi Paralipómenon', en: 'A reading from the second book of Chronicles' },
  '1esdr': { la: 'Léctio libri primi Esdræ', en: 'A reading from the book of Ezra' },
  '2esdr': { la: 'Léctio libri secúndi Esdræ', en: 'A reading from the book of Nehemiah' },
  tob: { la: 'Léctio libri Tobíæ', en: 'A reading from the book of Tobit' },
  jdth: { la: 'Léctio libri Judith', en: 'A reading from the book of Judith' },
  esth: { la: 'Léctio libri Esther', en: 'A reading from the book of Esther' },
  job: { la: 'Léctio libri Job', en: 'A reading from the book of Job' },
  '1mach': { la: 'Léctio libri primi Machabæórum', en: 'A reading from the first book of Maccabees' },
  '2mach': { la: 'Léctio libri secúndi Machabæórum', en: 'A reading from the second book of Maccabees' },
  // Wisdom books
  prov: { la: 'Léctio libri Próverbiórum', en: 'A reading from the book of Proverbs' },
  eccl: { la: 'Léctio libri Ecclesiástæ', en: 'A reading from the book of Ecclesiastes' },
  cant: { la: 'Léctio libri Cánticorum Canticórum', en: 'A reading from the Song of Songs' },
  sap: { la: 'Léctio libri Sapiéntiæ', en: 'A reading from the book of Wisdom' },
  sir: { la: 'Léctio libri Ecclesiástici', en: 'A reading from the book of Sirach' },
  // Major prophets
  isa: { la: 'Léctio Isaíæ Prophétæ', en: 'A reading from the Prophecy of Isaiah' },
  jer: { la: 'Léctio Jeremíæ Prophétæ', en: 'A reading from the Prophecy of Jeremiah' },
  lam: { la: 'Léctio Threnórum Jeremíæ Prophétæ', en: 'A reading from the Lamentations of Jeremiah the Prophet' },
  bar: { la: 'Léctio Baruch Prophétæ', en: 'A reading from the Prophecy of Baruch' },
  ezek: { la: 'Léctio Ezechiélis Prophétæ', en: 'A reading from the Prophecy of Ezekiel' },
  dan: { la: 'Léctio Daniélis Prophétæ', en: 'A reading from the Prophecy of Daniel' },
  // Minor prophets
  osee: { la: 'Léctio Osee Prophétæ', en: 'A reading from the Prophecy of Hosea' },
  joel: { la: 'Léctio Joélis Prophétæ', en: 'A reading from the Prophecy of Joel' },
  amos: { la: 'Léctio Amos Prophétæ', en: 'A reading from the Prophecy of Amos' },
  abd: { la: 'Léctio Abdíæ Prophétæ', en: 'A reading from the Prophecy of Obadiah' },
  jon: { la: 'Léctio Jonæ Prophétæ', en: 'A reading from the Prophecy of Jonah' },
  mich: { la: 'Léctio Michǽæ Prophétæ', en: 'A reading from the Prophecy of Micah' },
  nah: { la: 'Léctio Nahum Prophétæ', en: 'A reading from the Prophecy of Nahum' },
  hab: { la: 'Léctio Habacuc Prophétæ', en: 'A reading from the Prophecy of Habakkuk' },
  soph: { la: 'Léctio Sophoníæ Prophétæ', en: 'A reading from the Prophecy of Zephaniah' },
  agg: { la: 'Léctio Aggǽi Prophétæ', en: 'A reading from the Prophecy of Haggai' },
  zach: { la: 'Léctio Zacharíæ Prophétæ', en: 'A reading from the Prophecy of Zechariah' },
  mal: { la: 'Léctio Malachíæ Prophétæ', en: 'A reading from the Prophecy of Malachi' },
  // Gospels
  matt: { la: 'Léctio sancti Evangélii secúndum Matthǽum', en: 'A reading from the Holy Gospel according to Matthew' },
  marc: { la: 'Léctio sancti Evangélii secúndum Marcum', en: 'A reading from the Holy Gospel according to Mark' },
  luc: { la: 'Léctio sancti Evangélii secúndum Lucam', en: 'A reading from the Holy Gospel according to Luke' },
  joan: { la: 'Léctio sancti Evangélii secúndum Joánnem', en: 'A reading from the Holy Gospel according to John' },
  // Acts
  act: { la: 'Léctio Actuum Apostolórum', en: 'A reading from the Acts of the Apostles' },
  // Pauline epistles
  rom: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Romános', en: 'A reading from the Epistle of Saint Paul the Apostle to the Romans' },
  '1cor': { la: 'Léctio Epístolæ primæ beáti Pauli Apóstoli ad Corínthios', en: 'A reading from the first Epistle of Saint Paul the Apostle to the Corinthians' },
  '2cor': { la: 'Léctio Epístolæ secúndæ beáti Pauli Apóstoli ad Corínthios', en: 'A reading from the second Epistle of Saint Paul the Apostle to the Corinthians' },
  gal: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Gálatas', en: 'A reading from the Epistle of Saint Paul the Apostle to the Galatians' },
  eph: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Ephésios', en: 'A reading from the Epistle of Saint Paul the Apostle to the Ephesians' },
  phil: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Philippénses', en: 'A reading from the Epistle of Saint Paul the Apostle to the Philippians' },
  col: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Colossénses', en: 'A reading from the Epistle of Saint Paul the Apostle to the Colossians' },
  '1thess': { la: 'Léctio Epístolæ primæ beáti Pauli Apóstoli ad Thessalonicénses', en: 'A reading from the first Epistle of Saint Paul the Apostle to the Thessalonians' },
  '2thess': { la: 'Léctio Epístolæ secúndæ beáti Pauli Apóstoli ad Thessalonicénses', en: 'A reading from the second Epistle of Saint Paul the Apostle to the Thessalonians' },
  '1tim': { la: 'Léctio Epístolæ primæ beáti Pauli Apóstoli ad Timótheum', en: 'A reading from the first Epistle of Saint Paul the Apostle to Timothy' },
  '2tim': { la: 'Léctio Epístolæ secúndæ beáti Pauli Apóstoli ad Timótheum', en: 'A reading from the second Epistle of Saint Paul the Apostle to Timothy' },
  tit: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Titum', en: 'A reading from the Epistle of Saint Paul the Apostle to Titus' },
  phlm: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Philémonem', en: 'A reading from the Epistle of Saint Paul the Apostle to Philemon' },
  heb: { la: 'Léctio Epístolæ beáti Pauli Apóstoli ad Hebrǽos', en: 'A reading from the Epistle of Saint Paul the Apostle to the Hebrews' },
  // Catholic epistles
  jac: { la: 'Léctio Epístolæ beáti Jacóbi Apóstoli', en: 'A reading from the Epistle of Saint James the Apostle' },
  '1pet': { la: 'Léctio Epístolæ primæ beáti Petri Apóstoli', en: 'A reading from the first Epistle of Saint Peter the Apostle' },
  '2pet': { la: 'Léctio Epístolæ secúndæ beáti Petri Apóstoli', en: 'A reading from the second Epistle of Saint Peter the Apostle' },
  '1joan': { la: 'Léctio Epístolæ primæ beáti Joánnis Apóstoli', en: 'A reading from the first Epistle of Saint John the Apostle' },
  '2joan': { la: 'Léctio Epístolæ secúndæ beáti Joánnis Apóstoli', en: 'A reading from the second Epistle of Saint John the Apostle' },
  '3joan': { la: 'Léctio Epístolæ tértiæ beáti Joánnis Apóstoli', en: 'A reading from the third Epistle of Saint John the Apostle' },
  jud: { la: 'Léctio Epístolæ beáti Judæ Apóstoli', en: 'A reading from the Epistle of Saint Jude the Apostle' },
  // Apocalypse
  apoc: { la: 'Léctio libri Apocalýpsis beáti Joánnis Apóstoli', en: 'A reading from the book of the Revelation of Saint John the Apostle' },
};

/** Book abbreviation -> {la, en} incipit, or undefined for an unrecognized
 * abbreviation (shouldn't happen for anything actually keyed under
 * src/data/scripture, but callers still get an honest absence rather than
 * a made-up label). */
export function getBookIncipit(book: string): { la: string; en: string } | undefined {
  return BOOK_INCIPITS[book];
}

// Nocturn-readings.ts's own hand-authored Gospel pericopes (unlike
// bible-plan.ts's) carry only an already-formatted `citation` string, not a
// raw ScriptureCitation.book — and that citation's own abbreviation isn't
// authored consistently (e.g. "Luc"/"Luke", "Joann"/"John" across
// src/data/propers/nocturn-readings/*.yml). Restricted to the four Gospels
// since those are the only isGospel:true entries this needs to cover.
const GOSPEL_CITATION_PREFIXES: [RegExp, string][] = [
  [/^matt/i, 'matt'],
  [/^marc|^mark/i, 'marc'],
  [/^luc|^luke/i, 'luc'],
  [/^joann?|^john/i, 'joan'],
];

/** Best-effort incipit lookup from an already-rendered citation string (e.g.
 * "Luc 7:11-16" or "John 14:1-13") — tries the Latin form first, then
 * English, since the Latin abbreviation is the more consistently authored
 * one. Undefined when neither matches a known Gospel prefix. */
export function getGospelIncipitFromCitation(
  citation: Partial<Record<string, string>> | undefined,
): { la: string; en: string } | undefined {
  for (const candidate of [citation?.la, citation?.en]) {
    if (!candidate) continue;
    for (const [pattern, book] of GOSPEL_CITATION_PREFIXES) {
      if (pattern.test(candidate)) return BOOK_INCIPITS[book];
    }
  }
  return undefined;
}
