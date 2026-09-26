import { execSync } from 'node:child_process';

let cached: string | undefined;

/**
 * Date (YYYY-MM-DD) of the last commit that touched site content, falling back to today when
 * git is unavailable. Used for the sitemap and structured data. CI checks out full history so
 * this reflects the real last change rather than the build date.
 */
export function lastModified(): string {
  if (cached) return cached;
  try {
    const date = execSync('git log -1 --format=%cs -- src public', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return (cached = date);
  } catch {
    // not a git checkout
  }
  return (cached = new Date().toISOString().slice(0, 10));
}
