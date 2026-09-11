import { execSync } from 'node:child_process';
import { watch as fsWatch, readFileSync, type FSWatcher } from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const VIRTUAL_ID = 'virtual:git-info';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

interface GitInfo {
  commitSha: string;
  dirty: boolean;
  version: string;
  releaseDate: string;
}

function computePackageInfo(root: string): Pick<GitInfo, 'version' | 'releaseDate'> {
  try {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8'));
    return { version: pkg.version ?? '', releaseDate: pkg.releaseDate ?? '' };
  } catch {
    return { version: '', releaseDate: '' };
  }
}

function computeGitInfo(root: string): GitInfo {
  const { version, releaseDate } = computePackageInfo(root);
  try {
    const commitSha = execSync('git rev-parse --short HEAD', {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    const status = execSync('git status --porcelain', {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return { commitSha, dirty: status.trim().length > 0, version, releaseDate };
  } catch {
    return { commitSha: '', dirty: false, version, releaseDate };
  }
}

/**
 * Dev-only: exposes the live git commit hash + working-tree dirty state as
 * `virtual:git-info`, recomputed fresh on every load. Watches for commits,
 * checkouts, staging, and file edits, and pushes a `continua:git-info`
 * custom HMR event whenever that state actually changes -- so the About
 * panel always reflects exactly what's running locally, without a manual
 * dev-server restart. Deliberately not a full-reload: this app eagerly
 * bundles tens of MB of offline content (see vite.config.ts's manualChunks
 * comment), so reloading the whole page for a one-line version-string
 * change was noticeably slow (2026-09-11 user report) -- the client side
 * (src/version.ts) instead patches its own already-rendered text in place.
 *
 * Inactive during `vite build` (`apply: 'serve'`); production never derives
 * anything from git at build or serve time (see CLAUDE.md's "Versioning"
 * section) -- this plugin only ever runs against the dev server process.
 */
export function devGitInfoPlugin(): Plugin {
  let server: ViteDevServer | undefined;
  const fsWatchers: FSWatcher[] = [];

  return {
    name: 'continua-dev-git-info',
    // Matches vitest too (it resolves as command 'serve'), and needs to:
    // `virtual:git-info`'s dynamic import in version.ts is resolved
    // statically by Vite's transform step regardless of the surrounding
    // `if (import.meta.env.DEV)`/try-catch, so resolveId/load must stay
    // registered under vitest or every test run fails to transform. Only
    // the fs.watch() setup below is skipped there (see configureServer) --
    // vitest has no real dev server to hang a cleanup hook off, so those
    // watchers would otherwise keep the process alive after tests finish.
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      const root = server?.config.root ?? process.cwd();
      const info = computeGitInfo(root);
      return (
        `export const commitSha = ${JSON.stringify(info.commitSha)};\n` +
        `export const dirty = ${JSON.stringify(info.dirty)};\n` +
        `export const version = ${JSON.stringify(info.version)};\n` +
        `export const releaseDate = ${JSON.stringify(info.releaseDate)};\n`
      );
    },
    configureServer(s) {
      server = s;
      // vitest runs through this same dev-server machinery but never
      // closes an httpServer, so skip the watch/reload wiring entirely --
      // resolveId/load above already give it a resolvable module.
      if (process.env.VITEST) return;
      const root = s.config.root;
      let last = JSON.stringify(computeGitInfo(root));

      const recheck = () => {
        const info = computeGitInfo(root);
        const next = JSON.stringify(info);
        if (next === last) return;
        last = next;
        const mod = s.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) s.moduleGraph.invalidateModule(mod);
        s.ws.send({ type: 'custom', event: 'continua:git-info', data: info });
      };
      const debounced = debounce(recheck, 150);

      // Ordinary source edits already fire these -- reuse them to catch a
      // dirty tree becoming clean again (e.g. `git checkout -- file`).
      s.watcher.on('change', debounced);
      s.watcher.on('add', debounced);
      s.watcher.on('unlink', debounced);

      // .git/HEAD (commits, checkouts) and .git/index (staging) sit outside
      // Vite's watched globs (ignored by default), so they need their own
      // watch to catch a commit that doesn't otherwise touch a source file.
      for (const f of ['HEAD', 'index']) {
        try {
          fsWatchers.push(fsWatch(path.join(root, '.git', f), debounced));
        } catch {
          // No .git present (e.g. a tarball checkout) -- info just stays empty.
        }
      }
      s.httpServer?.once('close', () => {
        for (const w of fsWatchers) w.close();
      });
    },
    // `src/version.ts` still has a plain static `import ... from
    // '../package.json'` (needed in production so Rollup can tree-shake it
    // down to just the two fields it reads -- a dynamic import can't be
    // shaken the same way). That static edge means Vite's own core HMR walk
    // treats package.json as a real dependency of version.ts and, since a
    // JSON module can't itself accept an update, escalates to a full page
    // reload on every change -- including the `chore(release): vX.Y.Z`
    // commit that bumps `version`/`releaseDate`, which is exactly the
    // "version actually changed" case this plugin exists to make cheap.
    // Returning `[]` here tells Vite's core "handled, don't also reload" for
    // that one file; the `change` listener above (which fired regardless)
    // already pushed the real new values through `continua:git-info`.
    handleHotUpdate(ctx) {
      if (ctx.file === path.join(ctx.server.config.root, 'package.json')) {
        return [];
      }
    },
  };
}

function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}
