import { describe, expect, it } from 'vitest';
import { getCommonProper } from '../../src/propers';

// Sweep of the 2026-08 bulk-authoring pass: sanctoralCommemorationPart
// (hours/resolve-common.ts) was silently falling back to a bare collect
// with no antiphon for any saint without a dedicated `${propers}-
// commemoration.yml` bundle -- 217 of 220 saints with a collect, at the
// time this was found (St. Raymond Nonnatus, the Decollation of St. John
// the Baptist, live-reported by the user). Fixed with a bulk pass:
// reused each saint's own proper antiphon where one exists
// (`${propers}-antiphon.yml`), else the standard de-Communi `[Ant 2]`/
// `[Versum 2]` for that saint's own Common category (the tags actually
// paired for a mere commemoration in the reference engine -- confirmed
// against ss-felix-and-adauctus/st-clare/st-sabina's own already
// live-verified commemorations, all three of which turned out to match
// `[Ant 2]`, not the `[Ant 1]`/`[Nocturn 2 Versum]` originally guessed).
// This is a broad structural sweep, not per-saint verification -- every
// entry not independently live-verified is marked `status: draft`, see
// each file's own header for which is which. This list is a static
// snapshot (not glob-derived -- Node's `fs` isn't available in this
// jsdom test environment the way `import.meta.glob` is at build time) --
// regenerate it if a future pass adds/removes commemoration files.
const commemorationIds = [
  'chair-of-st-peter-at-antioch-commemoration', 'chair-of-st-peter-at-rome-commemoration', 'commemoration-of-st-paul-commemoration', 'conversion-of-st-paul-commemoration',
  'decollation-of-st-john-baptist-commemoration', 'finding-of-st-stephen-commemoration', 'forty-holy-martyrs-commemoration', 'holy-innocents-commemoration',
  'nativity-of-st-john-the-baptist-commemoration', 'ss-abdon-and-sennen-commemoration', 'ss-alexander-eventius-theodulus-and-juvenal-commemoration', 'ss-basilides-cyrinus-nabor-and-nazarius-commemoration',
  'ss-chrysanthus-and-daria-commemoration', 'ss-cosmas-and-damian-commemoration', 'ss-cyprian-and-justina-commemoration', 'ss-cyriacus-largus-and-smaragdus-commemoration',
  'ss-cyril-and-methodius-commemoration', 'ss-dionysius-and-companions-commemoration', 'ss-euphemia-lucia-and-geminianus-commemoration', 'ss-fabian-and-sebastian-commemoration',
  'ss-felix-and-adauctus-commemoration', 'ss-felix-simplicius-faustinus-and-beatrix-commemoration', 'ss-gervase-and-protase-commemoration', 'ss-hippolytus-and-cassian-commemoration',
  'ss-john-and-paul-commemoration', 'ss-machabees-commemoration', 'ss-marcellinus-peter-and-erasmus-commemoration', 'ss-marius-martha-audifax-and-abachum-commemoration',
  'ss-mark-and-marcellian-commemoration', 'ss-maurice-and-companions-commemoration', 'ss-nabor-and-felix-commemoration', 'ss-nazarius-celsus-victor-and-innocent-commemoration',
  'ss-nereus-achilleus-domitilla-and-pancras-commemoration', 'ss-peter-and-paul-commemoration', 'ss-philip-and-james-commemoration', 'ss-primus-and-felicianus-commemoration',
  'ss-protus-and-hyacinth-commemoration', 'ss-seven-brothers-rufina-and-secunda-commemoration', 'ss-simon-and-jude-commemoration', 'ss-symphorosa-and-seven-sons-commemoration',
  'ss-tiburtius-and-susanna-commemoration', 'ss-tiburtius-valerian-and-maximus-commemoration', 'ss-tryphon-and-companions-commemoration', 'ss-twelve-brothers-commemoration',
  'ss-vincent-and-anastasius-commemoration', 'ss-vitus-modestus-and-crescentia-commemoration', 'st-agnes-commemoration', 'st-agnes-secunda-commemoration',
  'st-aloysius-gonzaga-commemoration', 'st-andrew-commemoration', 'st-andrew-corsini-commemoration', 'st-angela-merici-commemoration',
  'st-anne-commemoration', 'st-anthony-mary-zaccaria-commemoration', 'st-anthony-of-padua-commemoration', 'st-antoninus-commemoration',
  'st-apollinaris-commemoration', 'st-apollonia-commemoration', 'st-athanasius-commemoration', 'st-augustine-commemoration',
  'st-augustine-of-canterbury-commemoration', 'st-barnabas-commemoration', 'st-bartholomew-commemoration', 'st-basil-the-great-commemoration',
  'st-benedict-commemoration', 'st-bernard-commemoration', 'st-bernardine-of-siena-commemoration', 'st-bibiana-commemoration',
  'st-boniface-commemoration', 'st-boniface-of-mainz-commemoration', 'st-bridget-of-sweden-commemoration', 'st-bruno-commemoration',
  'st-callistus-commemoration', 'st-catherine-commemoration', 'st-catherine-of-siena-commemoration', 'st-cecilia-commemoration',
  'st-charles-borromeo-commemoration', 'st-chrysogonus-commemoration', 'st-clare-commemoration', 'st-clement-commemoration',
  'st-cyril-of-jerusalem-commemoration', 'st-damasus-commemoration', 'st-dominic-commemoration', 'st-donatus-commemoration',
  'st-dorothea-commemoration', 'st-edward-king-commemoration', 'st-eleutherius-commemoration', 'st-elizabeth-of-portugal-commemoration',
  'st-felicitas-commemoration', 'st-felix-of-valois-commemoration', 'st-felix-presbyter-commemoration', 'st-fidelis-of-sigmaringen-commemoration',
  'st-frances-of-rome-commemoration', 'st-francis-borgia-commemoration', 'st-francis-caracciolo-commemoration', 'st-francis-commemoration',
  'st-francis-de-sales-commemoration', 'st-francis-of-paola-commemoration', 'st-francis-xavier-commemoration', 'st-gabriel-of-our-lady-of-sorrows-commemoration',
  'st-george-commemoration', 'st-gertrude-commemoration', 'st-gregory-the-great-commemoration', 'st-henry-commemoration',
  'st-hermenegild-commemoration', 'st-hermes-commemoration', 'st-hilary-of-poitiers-commemoration', 'stigmata-of-st-francis-commemoration',
  'st-ignatius-of-loyola-commemoration', 'st-james-the-greater-commemoration', 'st-jane-frances-de-chantal-commemoration', 'st-jerome-commemoration',
  'st-joachim-commemoration', 'st-john-apostle-commemoration', 'st-john-baptist-de-la-salle-commemoration', 'st-john-baptist-de-rossi-commemoration',
  'st-john-before-the-latin-gate-commemoration', 'st-john-bosco-commemoration', 'st-john-cantius-commemoration', 'st-john-capistrano-commemoration',
  'st-john-chrysostom-commemoration', 'st-john-eudes-commemoration', 'st-john-i-commemoration', 'st-john-of-god-commemoration',
  'st-john-of-matha-commemoration', 'st-joseph-calasanctius-commemoration', 'st-joseph-commemoration', 'st-joseph-of-cupertino-commemoration',
  'st-lawrence-commemoration', 'st-leo-i-commemoration', 'st-louis-commemoration', 'st-lucius-i-commemoration',
  'st-lucy-commemoration', 'st-luke-commemoration', 'st-marcellus-i-commemoration', 'st-marcus-commemoration',
  'st-margaret-mary-alacoque-commemoration', 'st-margaret-of-antioch-commemoration', 'st-margaret-of-scotland-commemoration', 'st-mark-commemoration',
  'st-martin-of-tours-commemoration', 'st-mary-magdalene-commemoration', 'st-mary-magdalene-de-pazzi-commemoration', 'st-matthew-commemoration',
  'st-matthias-commemoration', 'st-monica-commemoration', 'st-nicholas-commemoration', 'st-norbert-commemoration',
  'st-paschal-baylon-commemoration', 'st-patrick-commemoration', 'st-paulinus-of-nola-commemoration', 'st-paul-the-hermit-commemoration',
  'st-peter-ad-vincula-commemoration', 'st-peter-celestine-commemoration', 'st-peter-martyr-commemoration', 'st-peter-of-alcantara-commemoration',
  'st-prisca-commemoration', 'st-raymond-nonnatus-commemoration', 'st-robert-commemoration', 'st-sabina-commemoration',
  'st-saturninus-commemoration', 'st-scholastica-commemoration', 'st-silvester-abbot-commemoration', 'st-stanislaus-commemoration',
  'st-stephen-of-hungary-commemoration', 'st-stephen-protomartyr-commemoration', 'st-teresa-of-avila-commemoration', 'st-thecla-commemoration',
  'st-therese-of-lisieux-commemoration', 'st-thomas-apostle-commemoration', 'st-thomas-aquinas-commemoration', 'st-thomas-becket-commemoration',
  'st-ubald-commemoration', 'st-urban-i-commemoration', 'st-valentine-commemoration', 'st-venantius-commemoration',
  'st-vincent-de-paul-commemoration', 'st-vincent-ferrer-commemoration', 'st-vitalis-commemoration', 'st-wenceslaus-commemoration',
  'st-william-abbot-commemoration', 'st-zephyrinus-commemoration',
];

describe('sanctoral commemoration bundles (bulk 2026-08 sweep)', () => {
  it.each(commemorationIds)('%s has a real antiphon+versicle+collect, never bare/missing', (id) => {
    const proper = getCommonProper(id);
    expect(proper.status.la).not.toBe('missing');
    expect(proper.text.la).toContain('Ant.');
    expect(proper.text.la).toMatch(/V\.|℣\./);
    expect(proper.text.la).toContain('Orémus');
  });
});
