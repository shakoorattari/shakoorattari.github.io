import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CHANGELOG_TEMPLATE,
  bumpVersion,
  compareSemver,
  getReleaseNotes,
  getUnreleasedNotes,
  insertRelease,
  parseChangelog,
  parseCommit,
  parseSemver,
  recommendBump,
  renderBody,
} from './release.mjs';

const REPO = 'https://github.com/example/site';

describe('parseSemver', () => {
  it('accepts valid versions, pre-releases and build metadata', () => {
    assert.deepEqual(parseSemver('1.2.3'), { major: 1, minor: 2, patch: 3, prerelease: [], build: [] });
    assert.deepEqual(parseSemver('1.0.0-rc.1+abc1234'), {
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: ['rc', '1'],
      build: ['abc1234'],
    });
  });

  it('rejects anything that is not SemVer', () => {
    for (const bad of ['1.0', 'v1.0.0', '01.0.0', '1.0.0-', '1.0.0-01', '1.a.0', '', 'latest']) {
      assert.equal(parseSemver(bad), null, bad);
    }
  });
});

describe('compareSemver', () => {
  it('orders the example precedence chain from the specification', () => {
    const ordered = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
    ];
    for (let i = 0; i < ordered.length - 1; i++) {
      assert.equal(compareSemver(ordered[i], ordered[i + 1]), -1, `${ordered[i]} < ${ordered[i + 1]}`);
      assert.equal(compareSemver(ordered[i + 1], ordered[i]), 1);
    }
  });

  it('compares numerically, not as text, and ignores build metadata', () => {
    assert.equal(compareSemver('1.10.0', '1.9.0'), 1);
    assert.equal(compareSemver('1.0.0+a', '1.0.0+b'), 0);
    assert.equal(compareSemver('2.0.0', '1.99.99'), 1);
  });
});

describe('bumpVersion', () => {
  it('bumps major, minor and patch', () => {
    assert.equal(bumpVersion('1.2.3', 'patch'), '1.2.4');
    assert.equal(bumpVersion('1.2.3', 'minor'), '1.3.0');
    assert.equal(bumpVersion('1.2.3', 'major'), '2.0.0');
  });

  it('finalises a pre-release on patch', () => {
    assert.equal(bumpVersion('1.3.0-rc.1', 'patch'), '1.3.0');
  });

  it('accepts a higher explicit version and rejects a lower or equal one', () => {
    assert.equal(bumpVersion('1.2.3', '1.4.0-rc.1'), '1.4.0-rc.1');
    assert.throws(() => bumpVersion('1.2.3', '1.2.3'), /not higher/);
    assert.throws(() => bumpVersion('1.2.3', '1.0.0'), /not higher/);
  });

  it('rejects an unknown bump and an invalid current version', () => {
    assert.throws(() => bumpVersion('1.2.3', 'huge'), /Unknown bump/);
    assert.throws(() => bumpVersion('nope', 'patch'), /not valid SemVer/);
  });
});

describe('parseCommit / recommendBump', () => {
  it('parses type, scope and description', () => {
    assert.deepEqual(parseCommit({ hash: 'a', subject: 'feat(seo): add sitemap' }), {
      hash: 'a',
      type: 'feat',
      scope: 'seo',
      description: 'add sitemap',
      breaking: false,
      conventional: true,
    });
  });

  it('detects breaking changes from "!" and from the footer', () => {
    assert.equal(parseCommit({ subject: 'feat!: drop the old URLs' }).breaking, true);
    assert.equal(parseCommit({ subject: 'fix: x', body: 'BREAKING CHANGE: routes moved' }).breaking, true);
    assert.equal(parseCommit({ subject: 'fix: x', body: 'no such thing' }).breaking, false);
  });

  it('keeps non-conventional subjects as untyped changes', () => {
    const c = parseCommit({ subject: 'Merge stuff and things' });
    assert.equal(c.conventional, false);
    assert.equal(c.type, null);
    assert.equal(c.description, 'Merge stuff and things');
  });

  it('recommends major > minor > patch', () => {
    const commit = (subject) => parseCommit({ subject });
    assert.equal(recommendBump([commit('fix: a'), commit('docs: b')]), 'patch');
    assert.equal(recommendBump([commit('fix: a'), commit('feat: b')]), 'minor');
    assert.equal(recommendBump([commit('feat: a'), commit('refactor!: b')]), 'major');
  });
});

describe('renderBody', () => {
  it('groups commits into Added / Changed / Fixed and skips release commits', () => {
    const commits = [
      'feat(seo): add llms.txt',
      'fix: broken anchor',
      'perf(contact): lazy-load Turnstile',
      'docs: update README',
      'chore(release): v1.1.0',
      'refactor!: rename the data folder',
    ].map((subject) => parseCommit({ subject }));

    assert.equal(
      renderBody(commits),
      [
        '### Added',
        '',
        '- **seo:** Add llms.txt',
        '',
        '### Changed',
        '',
        '- **contact:** Lazy-load Turnstile',
        '- Update README',
        '- **BREAKING:** Rename the data folder',
        '',
        '### Fixed',
        '',
        '- Broken anchor',
      ].join('\n'),
    );
  });

  it('omits empty groups', () => {
    assert.equal(renderBody([parseCommit({ subject: 'fix: a' })]), '### Fixed\n\n- A');
  });
});

const SAMPLE = `# Changelog

Intro text.

## [Unreleased]

## [1.0.0] - 2026-09-26

### Added

- First release.

[Unreleased]: ${REPO}/compare/v1.0.0...HEAD
[1.0.0]: ${REPO}/releases/tag/v1.0.0
`;

describe('changelog parsing', () => {
  it('finds each section with its date and body', () => {
    const sections = parseChangelog(SAMPLE);
    assert.deepEqual(
      sections.map((s) => [s.version, s.date]),
      [
        ['Unreleased', null],
        ['1.0.0', '2026-09-26'],
      ],
    );
    assert.equal(sections[1].body, '### Added\n\n- First release.');
  });

  it('returns release notes for a version, or null', () => {
    assert.equal(getReleaseNotes(SAMPLE, '1.0.0'), '### Added\n\n- First release.');
    assert.equal(getReleaseNotes(SAMPLE, '9.9.9'), null);
  });

  it('reads hand-written Unreleased notes', () => {
    assert.equal(getUnreleasedNotes(SAMPLE), '');
    assert.equal(
      getUnreleasedNotes(SAMPLE.replace('## [Unreleased]\n', '## [Unreleased]\n\n### Added\n\n- Draft.\n')),
      '### Added\n\n- Draft.',
    );
  });
});

describe('insertRelease', () => {
  it('adds the section under [Unreleased], empties it and updates the links', () => {
    const next = insertRelease(SAMPLE, {
      version: '1.1.0',
      date: '2026-10-01',
      body: '### Added\n\n- Thing.',
      repoUrl: REPO,
      previousVersion: '1.0.0',
    });

    assert.match(
      next,
      /## \[Unreleased\]\n\n## \[1\.1\.0\] - 2026-10-01\n\n### Added\n\n- Thing\.\n\n## \[1\.0\.0\] - 2026-09-26/,
    );
    assert.match(next, new RegExp(`\\[Unreleased\\]: ${REPO}/compare/v1\\.1\\.0\\.\\.\\.HEAD`));
    assert.match(next, new RegExp(`\\[1\\.1\\.0\\]: ${REPO}/compare/v1\\.0\\.0\\.\\.\\.v1\\.1\\.0`));
    assert.match(next, new RegExp(`\\[1\\.0\\.0\\]: ${REPO}/releases/tag/v1\\.0\\.0`));
    assert.equal(next.match(/\[Unreleased\]:/g).length, 1, 'exactly one [Unreleased] link');
    assert.equal(getUnreleasedNotes(next), '');
    assert.equal(getReleaseNotes(next, '1.1.0'), '### Added\n\n- Thing.');
    assert.ok(next.endsWith('\n') && !next.endsWith('\n\n'));
  });

  it('works on a brand-new changelog with no previous release', () => {
    const next = insertRelease(CHANGELOG_TEMPLATE, {
      version: '1.0.0',
      date: '2026-09-26',
      body: '### Added\n\n- Everything.',
      repoUrl: REPO,
      previousVersion: null,
    });
    assert.equal(getReleaseNotes(next, '1.0.0'), '### Added\n\n- Everything.');
    assert.match(next, new RegExp(`\\[1\\.0\\.0\\]: ${REPO}/releases/tag/v1\\.0\\.0`));
  });

  it('throws without an [Unreleased] heading', () => {
    assert.throws(
      () => insertRelease('# Changelog\n', { version: '1.0.0', date: '2026-01-01', body: 'x', repoUrl: REPO }),
      /Unreleased/,
    );
  });
});
