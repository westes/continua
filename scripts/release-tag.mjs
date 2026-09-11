#!/usr/bin/env node
// Auto-tags a new vX.Y.Z release from Conventional Commits history, run as
// a CI step in .gitea/workflows/deploy.yml on every push to master (see
// CLAUDE.md's "Versioning" section for the commit-type -> bump mapping).
// `vite.config.ts` reads the resulting tag at build time -- this script is
// the only thing that ever creates a version tag; nothing else in this repo
// touches package.json's version field, which is left at "1.0.0" and not
// meant to be read.
//
// Bump rule, highest wins across all commits since the last tag:
//   - breaking (`!` after type/scope, or a `BREAKING CHANGE:` footer) -> major
//   - `feat`                                                          -> minor
//   - `fix`                                                           -> patch
//   - anything else (docs, chore, refactor, test, style, ci, build...) -> no bump
//
// Safe to run with nothing to do: exits 0 and creates no tag. Pushes over
// SSH (git@<host>:<owner>/<repo>.git, derived from origin's HTTPS URL) using
// whatever key `GIT_SSH_COMMAND` points at -- the CI step sets that up from
// the CONTINUA_RELEASE_SSH_KEY repo secret (a write-access Gitea deploy key,
// see CLAUDE.md's "Versioning" section) before invoking this script.
// Without an SSH key configured, creates the tag locally and prints what
// would have been pushed, so this is harmless to run by hand for a dry run.

import { execFileSync } from 'node:child_process';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const TAG_PATTERN = /^v\d+\.\d+\.\d+$/;

function latestTag() {
  const tags = git(['tag', '-l', 'v*.*.*']).split('\n').filter((t) => TAG_PATTERN.test(t));
  if (tags.length === 0) return null;
  // Sort by semver value, not lexicographically ("v10.0.0" < "v2.0.0" as
  // strings but not as versions).
  tags.sort((a, b) => {
    const [aMaj, aMin, aPat] = a.slice(1).split('.').map(Number);
    const [bMaj, bMin, bPat] = b.slice(1).split('.').map(Number);
    return aMaj - bMaj || aMin - bMin || aPat - bPat;
  });
  return tags[tags.length - 1];
}

function commitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const log = git(['log', range, '--format=%H']);
  if (!log) return [];
  return log.split('\n').map((hash) => ({
    subject: git(['show', '-s', '--format=%s', hash]),
    body: git(['show', '-s', '--format=%b', hash]),
  }));
}

const CONVENTIONAL_SUBJECT = /^(\w+)(\([^)]+\))?(!)?:\s/;

function classify({ subject, body }) {
  const match = CONVENTIONAL_SUBJECT.exec(subject);
  if (!match) return 'none';
  const [, type, , breakingBang] = match;
  if (breakingBang || /BREAKING CHANGE:/.test(body)) return 'major';
  if (type === 'feat') return 'minor';
  if (type === 'fix') return 'patch';
  return 'none';
}

function highestBump(bumps) {
  if (bumps.includes('major')) return 'major';
  if (bumps.includes('minor')) return 'minor';
  if (bumps.includes('patch')) return 'patch';
  return 'none';
}

function nextVersion(tag, bump) {
  const [major, minor, patch] = tag.slice(1).split('.').map(Number);
  if (bump === 'major') return `v${major + 1}.0.0`;
  if (bump === 'minor') return `v${major}.${minor + 1}.0`;
  return `v${major}.${minor}.${patch + 1}`;
}

const tag = latestTag();
if (!tag) {
  console.log('No existing vX.Y.Z tag found -- baseline tag is created manually, not by this script. Skipping.');
  process.exit(0);
}

const commits = commitsSince(tag);
const bump = highestBump(commits.map(classify));
if (bump === 'none') {
  console.log(`No feat/fix commits since ${tag} (${commits.length} commit(s) checked) -- no version bump.`);
  process.exit(0);
}

const newTag = nextVersion(tag, bump);
console.log(`${bump} bump: ${tag} -> ${newTag}`);

git([
  '-c', 'user.name=Continua Release Bot',
  '-c', 'user.email=ci@reground.org',
  'tag', '-a', newTag, '-m', `release: ${newTag}`,
]);

if (!process.env.GIT_SSH_COMMAND) {
  console.log(`GIT_SSH_COMMAND not set (no release SSH key configured) -- tag ${newTag} created locally but not pushed.`);
  process.exit(0);
}

// origin is the HTTPS clone URL (https://<host>/<owner>/<repo>.git); the
// deploy key only grants SSH access, so push against the SSH form instead.
const httpsUrl = git(['remote', 'get-url', 'origin']);
const sshUrl = httpsUrl.replace(/^https:\/\/([^/]+)\/(.+)$/, 'git@$1:$2');
git(['push', sshUrl, newTag]);
console.log(`Pushed ${newTag}.`);
