import { execSync } from 'node:child_process';
import { watch as fsWatch, type FSWatcher } from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const VIRTUAL_ID = 'virtual:git-info';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

interface GitInfo {
  commitSha: string;
  dirty: boolean;
}

function computeGitInfo(root: string): GitInfo {
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
    return { commitSha, dirty: status.trim().length > 0 };
  } catch {
    return { commitSha: '', dirty: false };
  }
}

/**
 * Dev-only: exposes the live git commit hash + working-tree dirty state as
 * `virtual:git-info`, recomputed fresh on every load. Watches for commits,
 * checkouts, staging, and file edits, and triggers a full reload whenever
 * that state actually changes -- so the About panel always reflects exactly
 * what's running locally, without a manual dev-server restart.
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
        `export const dirty = ${JSON.stringify(info.dirty)};\n`
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
        const next = JSON.stringify(computeGitInfo(root));
        if (next === last) return;
        last = next;
        const mod = s.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) s.moduleGraph.invalidateModule(mod);
        s.ws.send({ type: 'full-reload' });
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
  };
}

function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}
