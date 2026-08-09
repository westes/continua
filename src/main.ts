// Latin subset only — this content is Latin/English, no need to ship
// cyrillic/greek glyph data into the offline precache.
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-600.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import './ui/styles.css';
import { registerSW } from 'virtual:pwa-register';
import { initRouter } from './router';
import { mountShell } from './ui/shell';

const root = document.getElementById('app');
if (!root) {
  throw new Error('missing #app root element');
}

initRouter();
mountShell(root);

registerSW({ immediate: true });
