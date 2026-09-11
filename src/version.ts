// Named imports (not `import pkg from '../package.json'`) so the bundler
// tree-shakes out everything else in the file (scripts, dependencies, ...)
// -- only these two fields need to reach client JS.
import { version as pkgVersion, releaseDate } from '../package.json';

// pkgVersion/releaseDate are plain committed data -- written once, in a CI
// release commit, by scripts/release-tag.mjs (see CLAUDE.md's "Versioning"
// section). Reading them is a normal JSON import: nothing here ever runs
// `git` at build or serve time, in any environment.
const version = `v${pkgVersion}`;

// Dev-only nicety: which exact commit + working-tree state is running
// locally, with a `-dirty` suffix when there are uncommitted changes. Loaded
// from `virtual:git-info` (see `vite-plugins/dev-git-info.ts`), which is
// recomputed live and triggers a reload on every commit/checkout/edit, so
// this never goes stale across a long-running dev server. The dynamic
// import is guarded by `import.meta.env.DEV` (statically `false` in
// production) so it's dead-code-eliminated from the production bundle
// entirely -- `virtual:git-info` isn't even resolvable during `vite build`,
// since the plugin only applies to the dev server. Best-effort: empty if
// git isn't available wherever `npm run dev` runs, never something the app
// depends on.
let commitSha = '';
if (import.meta.env.DEV) {
  try {
    const gitInfo = await import('virtual:git-info');
    commitSha = gitInfo.dirty ? `${gitInfo.commitSha}-dirty` : gitInfo.commitSha;
  } catch {
    commitSha = '';
  }
}

export const APP_VERSION = import.meta.env.DEV && commitSha ? `${version}+${commitSha}` : version;
export const APP_VERSION_DATE = releaseDate;
