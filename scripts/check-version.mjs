// Guards the version metadata so it can't drift: package.json, package-lock.json, CHANGELOG.md and git tags.
// Fails on inconsistencies; only warns when user-facing files changed since the last release.
//
//   npm run check:version
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { compareSemver, getReleaseNotes, parseChangelog, parseSemver } from './lib/release.mjs';

const errors = [];
const warnings = [];
const ok = [];
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const gitOk = (...args) => spawnSync('git', args, { stdio: 'ignore' }).status === 0;

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;

// 1. package.json
if (!parseSemver(version)) errors.push(`package.json version "${version}" is not valid SemVer (MAJOR.MINOR.PATCH)`);
else ok.push(`package.json version ${version} is valid SemVer`);

// 2. package-lock.json
if (existsSync('package-lock.json')) {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const lockVersions = [lock.version, lock.packages?.['']?.version];
  if (lockVersions.every((v) => v === version)) ok.push('package-lock.json matches package.json');
  else
    errors.push(
      `package-lock.json is at ${lockVersions.join(' / ')} but package.json is ${version} (run npm install --package-lock-only)`,
    );
}

// 3. CHANGELOG.md
if (!existsSync('CHANGELOG.md')) {
  errors.push('CHANGELOG.md is missing');
} else {
  const markdown = readFileSync('CHANGELOG.md', 'utf8');
  const sections = parseChangelog(markdown);
  const releases = sections.filter((s) => s.version !== 'Unreleased');

  if (!sections.some((s) => s.version === 'Unreleased')) errors.push('CHANGELOG.md has no "## [Unreleased]" section');
  if (sections[0]?.version !== 'Unreleased') errors.push('"## [Unreleased]" must be the first section in CHANGELOG.md');

  for (const s of releases) {
    if (!parseSemver(s.version)) errors.push(`CHANGELOG.md section "[${s.version}]" is not valid SemVer`);
    if (!s.date || Number.isNaN(Date.parse(s.date)) || new Date(s.date).toISOString().slice(0, 10) !== s.date) {
      errors.push(`CHANGELOG.md section [${s.version}] needs a valid date ("## [${s.version}] - YYYY-MM-DD")`);
    }
    if (!s.body) errors.push(`CHANGELOG.md section [${s.version}] is empty`);
  }
  for (let i = 0; i + 1 < releases.length; i++) {
    if (
      parseSemver(releases[i].version) &&
      parseSemver(releases[i + 1].version) &&
      compareSemver(releases[i].version, releases[i + 1].version) <= 0
    ) {
      errors.push(
        `CHANGELOG.md releases must be newest first: [${releases[i].version}] appears before [${releases[i + 1].version}]`,
      );
    }
  }
  if (getReleaseNotes(markdown, version)) ok.push(`CHANGELOG.md documents ${version}`);
  else
    errors.push(
      `CHANGELOG.md has no section for ${version} (run npm run release, or add "## [${version}] - YYYY-MM-DD")`,
    );
  if (releases[0] && releases[0].version !== version) {
    errors.push(`the newest CHANGELOG.md release is [${releases[0].version}] but package.json is ${version}`);
  }
  for (const s of releases) {
    if (!new RegExp(`^\\[${s.version.replace(/\./g, '\\.')}\\]:\\s+\\S+`, 'm').test(markdown))
      warnings.push(`CHANGELOG.md has no link reference for [${s.version}]`);
  }
}

// 4. git tags (skipped when there is no git history, e.g. a source tarball)
let tags = [];
try {
  tags = git('tag', '--list', 'v*')
    .split('\n')
    .filter((t) => t && parseSemver(t.slice(1)))
    .sort((a, b) => compareSemver(a.slice(1), b.slice(1)));
} catch {
  warnings.push('not a git checkout: skipped the tag checks');
}
if (tags.length && parseSemver(version)) {
  const latest = tags.at(-1);
  if (compareSemver(version, latest.slice(1)) < 0)
    errors.push(`package.json (${version}) is lower than the latest tag ${latest}`);
  const own = `v${version}`;
  if (tags.includes(own)) {
    if (!gitOk('merge-base', '--is-ancestor', own, 'HEAD'))
      errors.push(
        `tag ${own} exists but is not part of this branch's history: ${version} was already released elsewhere`,
      );
    else {
      const changed = git('diff', '--name-only', `${own}..HEAD`, '--', 'src', 'public').split('\n').filter(Boolean);
      if (changed.length)
        warnings.push(
          `${changed.length} file(s) under src/ or public/ changed since ${own}. If this should ship as a new version, run: npm run release`,
        );
      else ok.push(`no user-facing changes since ${own}`);
    }
  } else {
    ok.push(`${own} is not tagged yet: this is a pending release`);
  }
}

for (const line of ok) console.log(`  ✓ ${line}`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${warnings.map((w) => `  ! ${w}`).join('\n')}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n${errors.map((e) => `  ✗ ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('\ncheck-version: all checks passed');
