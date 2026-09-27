import { execFileSync } from 'node:child_process';
import pkg from '../../package.json';
import { site } from '../data/site';

export interface BuildInfo {
  name: string;
  /** Semantic version from package.json, e.g. "1.2.0". */
  version: string;
  /** SemVer with build metadata, e.g. "1.2.0+abc1234". */
  versionFull: string;
  commit: string;
  commitShort: string;
  /** ISO 8601 date of the commit. Deliberately not a build timestamp: the same commit always builds the same output. */
  commitDate: string;
  /** True only for local builds from a working tree with uncommitted changes. */
  dirty: boolean;
  environment: 'production' | 'development';
  repository: string;
  /** The GitHub Release page for this version. */
  releaseUrl: string;
}

const git = (...args: string[]): string => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

let cached: BuildInfo | undefined;

/** Version and build metadata, resolved once at build time. */
export function getBuildInfo(): BuildInfo {
  if (cached) return cached;
  const commit = git('rev-parse', 'HEAD') || process.env.GITHUB_SHA || 'unknown';
  const commitShort = commit === 'unknown' ? 'unknown' : commit.slice(0, 7);
  return (cached = {
    name: pkg.name,
    version: pkg.version,
    versionFull: `${pkg.version}+${commitShort}`,
    commit,
    commitShort,
    commitDate: git('log', '-1', '--format=%cI') || 'unknown',
    dirty: git('status', '--porcelain', '--untracked-files=no') !== '',
    environment: import.meta.env.PROD ? 'production' : 'development',
    repository: site.repository,
    releaseUrl: `${site.repository}/releases/tag/v${pkg.version}`,
  });
}
