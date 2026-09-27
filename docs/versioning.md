# Versioning and releases

The site has a real version number, shown on the site and recorded in `CHANGELOG.md`, git tags and GitHub Releases. The version is a fact about the **deployed site**, not just about the code.

## Standards followed

| Standard | Used for |
|---|---|
| [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) | The version number: `MAJOR.MINOR.PATCH`, optional pre-release (`1.3.0-rc.1`) and build metadata (`1.2.0+abc1234`) |
| [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) | `CHANGELOG.md`: a human-written history, newest first, grouped as Added / Changed / Fixed / … |
| [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) | Commit messages (`feat:`, `fix:`, `feat!:` …) that tell `npm run release` which bump to recommend |
| Git tags + GitHub Releases | `vX.Y.Z` marks the exact commit that was published; the release notes are the changelog section |

## Where the version lives

| Where | What | Notes |
|---|---|---|
| `package.json` `version` | **The single source of truth** | `package-lock.json` must match (CI checks) |
| Site footer | `v1.2.0`, linked to its GitHub Release | Tooltip: `Version 1.2.0 · build 4b6c5f6 · 2026-09-26` (commit and commit date) |
| `/version.json` | Machine-readable build info | `version`, `versionFull` (`1.2.0+4b6c5f6`), `commit`, `commitDate`, `dirty`, `environment`, `repository`, `releaseNotes` |
| `<html data-version data-commit>` | For debugging in DevTools | |
| `CHANGELOG.md` | What changed in each version | |
| Git tag `vX.Y.Z` and the GitHub Release | The published record | Created by CI after a verified deploy |

The build date is the **commit date**, not a build timestamp, so the same commit always produces the same output. `dirty` is `true` only for a local build with uncommitted changes; it is always `false` in CI.

## What a version number means for this site

SemVer was written for libraries; for a website, read it from a visitor's or a linker's point of view.

| Bump | When | Examples |
|---|---|---|
| **MAJOR** | Something a visitor or an external link could depend on breaks, or the site is fundamentally rebuilt | A public URL is removed or renamed without a redirect · the résumé PDF URL changes · a re-platform or full redesign (1.0.0 was the Angular → Astro rebuild) |
| **MINOR** | New visible capability, backwards-compatible | A new page, section or feature (the service pages and blog were 1.1.0) · a new integration · the version display itself (1.2.0) |
| **PATCH** | Fixes and refinements | A bug fix · copy or content edits in `src/data/` · dependency updates · accessibility or performance fixes |

Tooling, docs and CI changes that don't alter the deployed site don't need a release of their own; they appear under **Changed** in the next release. Every push to `main` deploys, so a pre-release version (`1.3.0-rc.1`) would be live too: use one only if that is what you want visitors to see.

## Conventional Commits → recommended bump

| Commit | Bump |
|---|---|
| `feat!:` / `BREAKING CHANGE:` footer (any type) | **major** |
| `feat:` | **minor** |
| `fix:`, `perf:`, `refactor:`, `docs:`, `ci:`, `chore:` … | **patch** |

You can always override the recommendation.

## How to release

Releasing is part of the pull request that should ship a new version. `main` deploys on every merge, so the version bump travels with the change.

1. **Land the work** with conventional commit messages.
2. **Prepare the release** on the same branch:
   ```bash
   npm run release -- --dry-run     # see the plan and the changelog section; writes nothing
   npm run release                  # recommended bump (major if breaking, minor if a feat, else patch)
   npm run release -- minor         # or force major | minor | patch | an explicit version (1.4.0-rc.1)
   ```
   The script bumps `package.json` and `package-lock.json`, writes the new `CHANGELOG.md` section, and refreshes the compare links. It does **not** commit or tag. If `[Unreleased]` already has hand-written notes it uses those; otherwise it drafts the section from commit messages (commit subjects are terse, so tidy the wording for readers).
3. **Review the diff**, run `npm run verify`, commit it as `chore(release): vX.Y.Z`, and open the PR.
4. **Merge.** `deploy.yml` then:
   1. runs every quality gate (including `check:version`), deploys the tested build;
   2. **verifies** `/version.json` on the live site reports the commit that was just deployed;
   3. if `vX.Y.Z` doesn't exist yet, **creates the tag and a GitHub Release** whose notes are the changelog section.

If a PR doesn't bump the version, nothing is tagged. `npm run check:version` only warns that user-facing files changed since the last tag.

## What CI checks (`npm run check:version`, in the `ci.yml` quality job)

- `package.json` holds a valid SemVer version and `package-lock.json` matches it;
- `CHANGELOG.md` has `## [Unreleased]` first, every release has a valid date and a body, releases are newest-first, and there is a section for the current version;
- the version is not lower than the latest git tag, and an existing `vX.Y.Z` tag belongs to this branch's history;
- **warning only:** `src/` or `public/` changed since the last tagged release.

The release logic itself has unit tests (`npm run test:unit`), and Playwright checks the footer, `/version.json` and the `<html>` attributes on every page.

## History

| Version | What | Commit |
|---|---|---|
| 1.0.0 | The Astro rebuild (PR #1) | `e730451` |
| 1.1.0 | Service and case-study pages, blog, discovery tooling, CI quality gates (PR #2) | `4b6c5f6` |
| 1.2.0 | Versioning: footer display, `/version.json`, release tooling (this change) | tagged by CI on merge |

The Angular site was never versioned. v1.0.0 and v1.1.0 were released before tagging existed, so they have to be created **retroactively**. Do this **before** merging the versioning PR so the changelog compare links resolve:

```bash
git tag -a v1.0.0 e730451 -m "v1.0.0" && git tag -a v1.1.0 4b6c5f6 -m "v1.1.0"
git push origin v1.0.0 v1.1.0
gh release create v1.0.0 --verify-tag --title v1.0.0 --notes "$(node scripts/release-notes.mjs 1.0.0)"
gh release create v1.1.0 --verify-tag --title v1.1.0 --notes "$(node scripts/release-notes.mjs 1.1.0)"
```

## Why not release-please or semantic-release?

They are good tools, and adopting one later is straightforward (the changelog and tags already follow the same formats). For now a small, tested script fits a solo-maintained site better:

- release-please opens its release PRs with the default `GITHUB_TOKEN`, which needs a repository setting turned on and whose PRs don't trigger the CI checks unless a personal token or GitHub App is added;
- semantic-release releases on every merge, which doesn't match "bump only when a change should ship as a version";
- everything here runs locally and in the existing workflows, with no extra permissions or accounts, and the release logic is unit-tested.

## Troubleshooting

- **`check:version` says the changelog has no section for X.Y.Z** — you bumped `package.json` by hand; run `npm run release` instead, or add `## [X.Y.Z] - YYYY-MM-DD` with notes.
- **`npm run release` says a version is "already prepared"** — `package.json` is ahead of the latest tag, so a release is waiting to be merged. Merge it (CI tags it) or revert the release commit; don't prepare a second one.
- **`npm run release` says no release tag was found** — pass `--from <ref>` (the commit of your last release), or create the retroactive tags above.
- **The footer link 404s for a few seconds after a deploy** — the GitHub Release is created just after the deploy is verified.
- **The deploy job fails at "Verify the live site"** — the site is deployed but didn't report the new commit within 5 minutes (CDN caching, or the deploy went to a different domain). Check `https://shakoorattari.com/version.json?x=1`; re-run the workflow if it has caught up. No release is created until this passes.
