// Named imports (not `import pkg from '../package.json'`) so the bundler
// tree-shakes out everything else in the file (scripts, dependencies, ...)
// -- only these two fields need to reach client JS.
import { version as pkgVersion, releaseDate } from '../package.json';

// pkgVersion/releaseDate are plain committed data -- written once, in a CI
// release commit, by scripts/release-tag.mjs (see CLAUDE.md's "Versioning"
// section). Reading them is a normal JSON import: nothing here ever runs
// `git` at build or serve time, in any environment.
const version = `v${pkgVersion}`;

// Vite's own VITE_-prefixed env var convention (see package.json's `dev`
// script), not a custom `define` -- this is a dev-only nicety (which exact
// commit is running locally, with a `-dirty` suffix if the working tree has
// uncommitted changes), best-effort: empty if git isn't available wherever
// `npm run dev` runs, never something the app depends on.
const commitSha = import.meta.env.VITE_COMMIT_SHA;

export const APP_VERSION = import.meta.env.DEV && commitSha ? `${version}+${commitSha}` : version;
export const APP_VERSION_DATE = releaseDate;
