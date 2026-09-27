// Prepare a release: choose the next SemVer version from the Conventional Commits since the last tag,
// write the CHANGELOG.md section, and bump package.json / package-lock.json.
//
//   npm run release                       recommended bump (major if breaking, minor if a feat, else patch)
//   npm run release -- minor              force a bump: major | minor | patch | an explicit version (1.4.0-rc.1)
//   npm run release -- --dry-run          show the plan and the changelog section; write nothing
//   npm run release -- --from <ref>       count commits since <ref> (needed until the first tag exists)
//   npm run release -- --date 2026-10-01  release date (default: today)
//
// It does NOT commit or tag. Review the diff, commit it as `chore(release): vX.Y.Z` in your pull request,
// and merge: the deploy workflow publishes the site, verifies it, then creates the tag and GitHub Release.
// See docs/versioning.md.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  CHANGELOG_TEMPLATE,
  bumpVersion,
  compareSemver,
  getUnreleasedNotes,
  insertRelease,
  isReleaseNoise,
  parseCommit,
  parseSemver,
  recommendBump,
  renderBody,
} from './lib/release.mjs';

const argv = process.argv.slice(2);
const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const dryRun = argv.includes('--dry-run');
const positional = argv.filter((a, i) => !a.startsWith('--') && !['--from', '--date'].includes(argv[i - 1]));

const fail = (message) => {
  console.error(`release: ${message}`);
  process.exit(1);
};
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const repoUrl = String(pkg.repository?.url ?? pkg.repository ?? '')
  .replace(/^git\+/, '')
  .replace(/\.git$/, '');
if (!repoUrl.startsWith('https://'))
  fail('package.json needs a "repository.url" (used for the changelog compare links)');

// Latest release tag = highest valid SemVer among "v*" tags.
const tags = git('tag', '--list', 'v*')
  .split('\n')
  .filter((t) => t && parseSemver(t.slice(1)));
tags.sort((a, b) => compareSemver(a.slice(1), b.slice(1)));
const latestTag = tags.at(-1) ?? null;

const from = option('--from') ?? latestTag;
if (!from) fail('no release tag found. Pass --from <ref> (e.g. the commit of your last release).');

if (!dryRun && git('status', '--porcelain'))
  fail('the working tree has uncommitted changes. Commit or stash them first.');

const log = git('log', `${from}..HEAD`, '--no-merges', '--format=%H%x1f%s%x1f%b%x1e');
const commits = log
  .split('\x1e')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [hash, subject, body = ''] = entry.split('\x1f');
    return parseCommit({ hash, subject, body });
  })
  .filter((commit) => !isReleaseNoise(commit));

const current = pkg.version;
if (latestTag && compareSemver(current, latestTag.slice(1)) < 0) {
  fail(`package.json is at ${current} but the latest tag is ${latestTag}. Fix package.json first.`);
}
if (latestTag && compareSemver(current, latestTag.slice(1)) > 0) {
  fail(
    `v${current} is already prepared (package.json is ahead of the latest tag ${latestTag}) but not released yet.\n` +
      'Merge it first (the deploy workflow then tags it), or revert the release commit, before preparing another.',
  );
}

const recommended = recommendBump(commits);
const kind = positional[0] ?? recommended;
let next;
try {
  next = bumpVersion(current, kind);
} catch (error) {
  fail(error.message);
}

const changelogPath = 'CHANGELOG.md';
const changelog = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : CHANGELOG_TEMPLATE;
const handWritten = getUnreleasedNotes(changelog);
const body = handWritten || renderBody(commits);
if (!body) fail(`no changes since ${from}: nothing to release.`);

const today = new Date();
const date =
  option('--date') ??
  [today.getFullYear(), today.getMonth() + 1, today.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`invalid --date "${date}" (use YYYY-MM-DD)`);

const counts = (type) => commits.filter((c) => c.type === type).length;
console.log(`Release plan
  since:         ${from}${latestTag && from === latestTag ? '' : '  (--from)'}
  commits:       ${commits.length} (${counts('feat')} feat, ${counts('fix')} fix, ${commits.length - counts('feat') - counts('fix')} other)
  package.json:  ${current}
  recommended:   ${recommended}${positional[0] ? `  (you chose: ${positional[0]})` : ''}
  next version:  ${next}
  date:          ${date}
  notes from:    ${handWritten ? 'the [Unreleased] section of CHANGELOG.md' : 'the commit messages'}
`);

if (dryRun) {
  console.log(`--- CHANGELOG section (dry run, nothing written) ---\n\n## [${next}] - ${date}\n\n${body}\n`);
  process.exit(0);
}

writeFileSync(
  changelogPath,
  insertRelease(changelog, { version: next, date, body, repoUrl, previousVersion: latestTag?.slice(1) ?? null }),
);
execFileSync('npm', ['version', next, '--no-git-tag-version'], { stdio: 'pipe' });

console.log(`Prepared v${next}.

Next:
  1. Review the CHANGELOG.md diff and tidy the wording (it is written for readers, not git).
  2. npm run verify
  3. git commit -am "chore(release): v${next}"   and open the pull request
  4. On merge, the deploy workflow publishes, verifies the live version, then tags v${next} and creates the GitHub Release.`);
