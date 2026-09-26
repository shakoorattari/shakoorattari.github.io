// Writes sitemap.xml into the build output with a real <lastmod>.
// Run after `ng build` / `ng run …:prerender` (see the npm scripts).
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://shakoorattari.com';
const OUT_DIR = join(process.cwd(), 'dist', 'shakoor-portfolio');
// Only the home page is indexable: /about, /skills, … are anchors into the same
// single-page layout and canonicalise to "/".
const ROUTES = [{ path: '/', changefreq: 'monthly', priority: '1.0' }];

function lastModified() {
  try {
    const date = execSync('git log -1 --format=%cs -- src', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch {
    // not a git checkout — fall through
  }
  return new Date().toISOString().slice(0, 10);
}

if (!existsSync(OUT_DIR)) {
  console.error(`sitemap: ${OUT_DIR} does not exist — build first.`);
  process.exit(1);
}

const lastmod = lastModified();
const urls = ROUTES.map(
  ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(OUT_DIR, 'sitemap.xml'), xml);
console.log(`sitemap: wrote ${ROUTES.length} URL(s), lastmod ${lastmod}`);
