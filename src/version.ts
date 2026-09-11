// Named imports (not `import pkg from '../package.json'`) so the bundler
// tree-shakes out everything else in the file (scripts, dependencies, ...)
// -- only these two fields need to reach client JS.
import { version as pkgVersion, releaseDate } from '../package.json';

// pkgVersion/releaseDate are plain committed data -- written once, in a CI
// release commit, by scripts/release-tag.mjs (see CLAUDE.md's "Versioning"
// section). Reading them is a normal JSON import: nothing here ever runs
// `git` at build or serve time, in any environment. In dev these two get
// overwritten below with the live values from `virtual:git-info` -- kept
// here too (rather than reading package.json only through the virtual
// module) so production tree-shaking still sees a plain named import.
let baseVersion = `v${pkgVersion}`;
let releaseDateLive = releaseDate;

function withCommitSha(commitSha: string): string {
  return commitSha ? `${baseVersion}+${commitSha}` : baseVersion;
}

// Dev-only nicety: which exact commit + working-tree state is running
// locally, with a `-dirty` suffix when there are uncommitted changes, and
// the live `version`/`releaseDate` straight out of package.json -- so a CI
// release-tag bump landing via `git pull` shows up immediately without
// forcing a full page reload of this app's tens-of-MB eager bundle (see
// `vite-plugins/dev-git-info.ts`'s `handleHotUpdate`, which is what actually
// suppresses that reload; this virtual module just supplies the new
// values). Loaded from `virtual:git-info`. Best-effort: empty/unchanged if
// git isn't available wherever `npm run dev` runs, never something the app
// depends on. The dynamic import is guarded by `import.meta.env.DEV`
// (statically `false` in production) so it's dead-code-eliminated from the
// production bundle entirely -- `virtual:git-info` isn't even resolvable
// during `vite build`, since the plugin only applies to the dev server.
let commitSha = '';
if (import.meta.env.DEV) {
  try {
    const gitInfo = await import('virtual:git-info');
    commitSha = gitInfo.dirty ? `${gitInfo.commitSha}-dirty` : gitInfo.commitSha;
    if (gitInfo.version) baseVersion = `v${gitInfo.version}`;
    if (gitInfo.releaseDate) releaseDateLive = gitInfo.releaseDate;
  } catch {
    commitSha = '';
  }
}

export let APP_VERSION = withCommitSha(commitSha);
export let APP_VERSION_DATE = releaseDateLive;

export type VersionChangeListener = (version: string, releaseDate: string) => void;
const versionChangeListeners = new Set<VersionChangeListener>();

/** Dev-only: notified whenever the live commit hash, dirty state, or
 * package.json version/releaseDate changes (pushed by
 * `vite-plugins/dev-git-info.ts`), so a mounted view can patch its own
 * already-rendered version text in place. Deliberately not a full page
 * reload -- this app eagerly bundles tens of MB of offline content, so
 * reloading everything for a one-line version-string change is needlessly
 * slow. No-op in production, where `import.meta.hot` doesn't exist. */
export function onVersionChange(listener: VersionChangeListener): void {
  if (import.meta.hot) versionChangeListeners.add(listener);
}

if (import.meta.hot) {
  import.meta.hot.on(
    'continua:git-info',
    (data: { commitSha: string; dirty: boolean; version: string; releaseDate: string }) => {
      const sha = data.dirty && data.commitSha ? `${data.commitSha}-dirty` : data.commitSha;
      if (data.version) baseVersion = `v${data.version}`;
      if (data.releaseDate) releaseDateLive = data.releaseDate;
      APP_VERSION = withCommitSha(sha);
      APP_VERSION_DATE = releaseDateLive;
      for (const listener of versionChangeListeners) listener(APP_VERSION, APP_VERSION_DATE);
    },
  );
}
