// Pure helpers for versioning and changelogs (no file or git access), so they are easy to unit-test.
//
// Standards followed:
//   Semantic Versioning 2.0.0   https://semver.org
//   Keep a Changelog 1.1.0      https://keepachangelog.com
//   Conventional Commits 1.0.0  https://www.conventionalcommits.org

// ---------------------------------------------------------------------------------------------- SemVer

const IDENT = '(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)';
export const SEMVER_RE = new RegExp(
  `^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-(${IDENT}(?:\\.${IDENT})*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$`,
);

/** @returns {{major:number, minor:number, patch:number, prerelease:string[], build:string[]} | null} */
export function parseSemver(version) {
  const m = SEMVER_RE.exec(String(version));
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ? m[4].split('.') : [],
    build: m[5] ? m[5].split('.') : [],
  };
}

const isNumeric = (s) => /^\d+$/.test(s);

/** SemVer 2.0.0 §11 precedence: -1, 0 or 1. Build metadata is ignored. */
export function compareSemver(a, b) {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (!x || !y) throw new Error(`Cannot compare "${a}" and "${b}": not valid SemVer`);
  for (const key of ['major', 'minor', 'patch']) {
    if (x[key] !== y[key]) return x[key] < y[key] ? -1 : 1;
  }
  if (!x.prerelease.length && !y.prerelease.length) return 0;
  if (!x.prerelease.length) return 1; // a release outranks its pre-releases
  if (!y.prerelease.length) return -1;
  for (let i = 0; i < Math.max(x.prerelease.length, y.prerelease.length); i++) {
    const p = x.prerelease[i];
    const q = y.prerelease[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    if (p === q) continue;
    if (isNumeric(p) && isNumeric(q)) return Number(p) < Number(q) ? -1 : 1;
    if (isNumeric(p)) return -1; // numeric identifiers rank below alphanumeric ones
    if (isNumeric(q)) return 1;
    return p < q ? -1 : 1;
  }
  return 0;
}

/**
 * Next version. `kind` is "major" | "minor" | "patch", or an explicit version (which must be higher).
 * Bumping "patch" on a pre-release finalises it (1.3.0-rc.1 -> 1.3.0).
 */
export function bumpVersion(current, kind) {
  const v = parseSemver(current);
  if (!v) throw new Error(`Current version "${current}" is not valid SemVer`);
  if (parseSemver(kind)) {
    if (compareSemver(kind, current) <= 0) throw new Error(`Version ${kind} is not higher than ${current}`);
    return kind;
  }
  switch (kind) {
    case 'major':
      return `${v.major + 1}.0.0`;
    case 'minor':
      return `${v.major}.${v.minor + 1}.0`;
    case 'patch':
      return v.prerelease.length ? `${v.major}.${v.minor}.${v.patch}` : `${v.major}.${v.minor}.${v.patch + 1}`;
    default:
      throw new Error(`Unknown bump "${kind}" (use major, minor, patch, or an explicit version like 1.4.0)`);
  }
}

// ------------------------------------------------------------------------------ Conventional Commits

const COMMIT_RE = /^(\w+)(?:\(([^)]*)\))?(!)?:\s+(.+)$/;

/** @returns {{hash:string, type:string|null, scope:string|null, description:string, breaking:boolean, conventional:boolean}} */
export function parseCommit({ hash = '', subject, body = '' }) {
  const m = COMMIT_RE.exec(subject.trim());
  const breakingFooter = /^BREAKING[ -]CHANGE:/m.test(body);
  if (!m)
    return {
      hash,
      type: null,
      scope: null,
      description: subject.trim(),
      breaking: breakingFooter,
      conventional: false,
    };
  return {
    hash,
    type: m[1].toLowerCase(),
    scope: m[2] || null,
    description: m[4].trim(),
    breaking: breakingFooter || m[3] === '!',
    conventional: true,
  };
}

/** Commits that describe the release itself, not a change to the site. */
export const isReleaseNoise = (commit) => commit.type === 'chore' && commit.scope === 'release';

/** "major" for breaking changes, "minor" if anything is a feature, otherwise "patch". */
export function recommendBump(commits) {
  if (commits.some((c) => c.breaking)) return 'major';
  if (commits.some((c) => c.type === 'feat')) return 'minor';
  return 'patch';
}

const capitalise = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function bullet(commit) {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  const breaking = commit.breaking ? '**BREAKING:** ' : '';
  return `- ${breaking}${scope}${capitalise(commit.description)}`;
}

/** Keep a Changelog body (### Added / Changed / Fixed) from parsed commits. */
export function renderBody(commits) {
  const relevant = commits.filter((c) => !isReleaseNoise(c));
  const groups = [
    ['Added', relevant.filter((c) => c.type === 'feat')],
    ['Changed', relevant.filter((c) => c.type !== 'feat' && c.type !== 'fix')],
    ['Fixed', relevant.filter((c) => c.type === 'fix')],
  ];
  return groups
    .filter(([, list]) => list.length)
    .map(([title, list]) => `### ${title}\n\n${list.map(bullet).join('\n')}`)
    .join('\n\n');
}

// ------------------------------------------------------------------------------------------ Changelog

const UNRELEASED_HEADING = /^## \[Unreleased\]\s*$/;
const RELEASE_HEADING = /^## \[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/;
const LINK_REF = /^\[([^\]]+)\]:\s+\S+/;

export const CHANGELOG_TEMPLATE = `# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
`;

/** Every "## [x.y.z] - date" section, in file order. Body excludes the heading and trailing link references. */
export function parseChangelog(markdown) {
  const lines = markdown.split('\n');
  const headings = [];
  lines.forEach((line, i) => {
    if (UNRELEASED_HEADING.test(line)) headings.push({ version: 'Unreleased', date: null, line: i });
    else {
      const m = RELEASE_HEADING.exec(line);
      if (m) headings.push({ version: m[1], date: m[2] ?? null, line: i });
    }
  });
  const firstLink = lines.findIndex((l) => LINK_REF.test(l));
  return headings.map((h, idx) => {
    const end = idx + 1 < headings.length ? headings[idx + 1].line : firstLink === -1 ? lines.length : firstLink;
    return {
      ...h,
      body: lines
        .slice(h.line + 1, Math.max(end, h.line + 1))
        .join('\n')
        .trim(),
    };
  });
}

/** The release notes for one version (used for the GitHub Release), or null. */
export function getReleaseNotes(markdown, version) {
  return parseChangelog(markdown).find((s) => s.version === version)?.body || null;
}

/**
 * Turn "[Unreleased]" into a new release section and reset "[Unreleased]" to empty, keeping the
 * link references at the bottom (compare URLs) up to date.
 */
export function insertRelease(markdown, { version, date, body, repoUrl, previousVersion }) {
  const lines = markdown.split('\n');
  const unreleasedAt = lines.findIndex((l) => UNRELEASED_HEADING.test(l));
  if (unreleasedAt === -1) throw new Error('CHANGELOG.md has no "## [Unreleased]" heading');

  const sections = parseChangelog(markdown);
  const first = sections.find((s) => s.version !== 'Unreleased');
  const restFrom = first ? first.line : lines.findIndex((l, i) => i > unreleasedAt && LINK_REF.test(l));
  const head = lines.slice(0, unreleasedAt + 1);
  const tail = restFrom === -1 ? [] : lines.slice(restFrom);

  const refs = [];
  const tagUrl = `${repoUrl}/releases/tag/v${version}`;
  refs.push(`[Unreleased]: ${repoUrl}/compare/v${version}...HEAD`);
  refs.push(
    previousVersion ? `[${version}]: ${repoUrl}/compare/v${previousVersion}...v${version}` : `[${version}]: ${tagUrl}`,
  );

  // Drop the old [Unreleased] reference, keep every other reference as-is.
  const tailWithoutOldUnreleased = tail.filter((l) => !/^\[Unreleased\]:/.test(l));
  const firstRefInTail = tailWithoutOldUnreleased.findIndex((l) => LINK_REF.test(l));
  let body2;
  if (firstRefInTail === -1) {
    body2 = [...tailWithoutOldUnreleased, '', ...refs];
  } else {
    body2 = [
      ...tailWithoutOldUnreleased.slice(0, firstRefInTail),
      ...refs,
      ...tailWithoutOldUnreleased.slice(firstRefInTail).filter((l) => !l.startsWith(`[${version}]:`)),
    ];
  }
  const out = [...head, '', `## [${version}] - ${date}`, '', body.trim(), '', ...body2];
  return `${out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`;
}

/** The Unreleased notes written by hand (empty string when there are none). */
export function getUnreleasedNotes(markdown) {
  return parseChangelog(markdown).find((s) => s.version === 'Unreleased')?.body ?? '';
}
