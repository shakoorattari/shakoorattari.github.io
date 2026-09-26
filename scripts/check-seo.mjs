// Post-build SEO guard. Reads the built site in dist/ and fails on regressions that quietly cost search
// visibility: over-long or duplicate titles/descriptions, missing canonicals, broken internal links or
// anchors, a sitemap that doesn't match the indexable pages, invalid structured data, unlabeled images.
//
//   npm run build && npm run check:seo
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const SITE = 'https://shakoorattari.com';
const LIMITS = { titleMax: 60, descMin: 70, descMax: 160 };

if (!existsSync(DIST)) {
  console.error('check-seo: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

// ------------------------------------------------------------------ helpers
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");

const parseAttrs = (tag) => {
  const attrs = {};
  for (const m of tag.matchAll(/([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
};
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((m) => parseAttrs(m[1]));
const meta = (html, key, value) => tags(html, 'meta').find((a) => a[key] === value)?.content;

const pathOf = (file) => {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
};

// ------------------------------------------------------------------ load pages
const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const pages = new Map(); // path -> { html, file }
for (const file of htmlFiles) pages.set(pathOf(file), { html: readFileSync(file, 'utf8'), file });

const isRedirect = (html) => /http-equiv="refresh"/i.test(html);
const robotsOf = (html) => meta(html, 'name', 'robots') ?? '';
const indexable = [...pages].filter(([p, { html }]) => !isRedirect(html) && !/noindex/i.test(robotsOf(html)) && p !== '/404.html');

const errors = [];
const warnings = [];
const err = (path, msg) => errors.push(`${path}  ${msg}`);
const warn = (path, msg) => warnings.push(`${path}  ${msg}`);

const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const pageIds = new Map([...pages].map(([p, { html }]) => [p, ids(html)]));
const targetExists = (p) => {
  if (pages.has(p)) return true;
  if (pages.has(p.endsWith('/') ? p : `${p}/`)) return true;
  return existsSync(join(DIST, p.replace(/^\//, ''))) && statSync(join(DIST, p.replace(/^\//, ''))).isFile();
};

// ------------------------------------------------------------------ per-page checks
const seenTitles = new Map();
const seenDescs = new Map();

for (const [path, { html }] of indexable) {
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
  const desc = meta(html, 'name', 'description') ?? '';
  const canonical = tags(html, 'link').find((a) => a.rel === 'canonical')?.href;
  const h1s = (html.match(/<h1[\s>]/gi) ?? []).length;

  if (!title) err(path, 'missing <title>');
  else if (title.length > LIMITS.titleMax) err(path, `title is ${title.length} chars (max ${LIMITS.titleMax}): "${title}"`);
  if (!desc) err(path, 'missing meta description');
  else if (desc.length < LIMITS.descMin || desc.length > LIMITS.descMax)
    err(path, `description is ${desc.length} chars (want ${LIMITS.descMin}-${LIMITS.descMax}): "${desc}"`);
  if (h1s !== 1) err(path, `expected exactly one <h1>, found ${h1s}`);
  if (canonical !== `${SITE}${path}`) err(path, `canonical should be ${SITE}${path}, got ${canonical}`);
  if (!/<html[^>]*\slang="[a-z-]+"/i.test(html)) err(path, 'missing <html lang>');
  if (!meta(html, 'name', 'viewport')) err(path, 'missing viewport meta');

  for (const key of ['og:title', 'og:description', 'og:image', 'og:url'])
    if (!meta(html, 'property', key)) err(path, `missing ${key}`);
  if (meta(html, 'property', 'og:url') !== canonical) err(path, 'og:url differs from canonical');
  const ogImage = meta(html, 'property', 'og:image');
  if (ogImage?.startsWith(SITE) && !existsSync(join(DIST, ogImage.slice(SITE.length)))) err(path, `og:image not found in dist: ${ogImage}`);

  if (seenTitles.has(title)) err(path, `duplicate title also used on ${seenTitles.get(title)}`);
  seenTitles.set(title, path);
  if (seenDescs.has(desc)) err(path, `duplicate description also used on ${seenDescs.get(desc)}`);
  seenDescs.set(desc, path);

  // structured data must parse
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (blocks.length === 0 && path !== '/404.html') warn(path, 'no JSON-LD');
  for (const raw of blocks) {
    try {
      const data = JSON.parse(raw);
      if (data['@context'] !== 'https://schema.org') err(path, 'JSON-LD missing schema.org @context');
      const nodes = data['@graph'] ?? [data];
      const defined = new Set(nodes.map((n) => n['@id']).filter(Boolean));
      // an @id-only reference must resolve on this page (a full reference also carries its @type)
      const walkRefs = (v) => {
        if (Array.isArray(v)) return v.forEach(walkRefs);
        if (v && typeof v === 'object') {
          const keys = Object.keys(v);
          if (keys.length === 1 && keys[0] === '@id' && !defined.has(v['@id'])) err(path, `JSON-LD has a dangling @id-only reference: ${v['@id']}`);
          Object.values(v).forEach(walkRefs);
        }
      };
      nodes.forEach(walkRefs);
    } catch (e) {
      err(path, `invalid JSON-LD: ${e.message}`);
    }
  }

  // images
  for (const img of tags(html, 'img')) {
    if (!('alt' in img)) err(path, `<img> without alt: ${img.src}`);
    if (!img.width || !img.height) err(path, `<img> without width/height: ${img.src}`);
  }

  // links and anchors
  for (const a of tags(html, 'a')) {
    const href = a.href;
    if (!href || /^(mailto:|tel:|https?:|data:|javascript:)/i.test(href)) {
      if (a.target === '_blank' && !/noopener/.test(a.rel ?? '')) err(path, `target=_blank without rel=noopener: ${href}`);
      continue;
    }
    if (href.startsWith('#')) {
      if (href.length > 1 && !pageIds.get(path)?.has(href.slice(1))) err(path, `broken in-page anchor ${href}`);
      continue;
    }
    if (!href.startsWith('/')) continue;
    const [target, hash] = href.split('#');
    const clean = target.split('?')[0];
    if (!targetExists(clean)) err(path, `broken internal link ${href}`);
    else if (hash && !pageIds.get(clean.endsWith('/') ? clean : `${clean}/`)?.has(hash) && !pageIds.get(clean)?.has(hash))
      err(path, `link ${href} points to a missing #${hash}`);
  }
}

// ------------------------------------------------------------------ sitemap must match the indexable pages exactly
const sitemapFile = join(DIST, 'sitemap.xml');
if (!existsSync(sitemapFile)) {
  err('/sitemap.xml', 'missing');
} else {
  const xml = readFileSync(sitemapFile, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const want = new Set(indexable.map(([p]) => `${SITE}${p}`));
  for (const loc of locs) if (!want.has(loc)) err('/sitemap.xml', `lists a non-indexable or unknown URL: ${loc}`);
  for (const w of want) if (!locs.includes(w)) err('/sitemap.xml', `is missing indexable page ${w}`);
  if (new Set(locs).size !== locs.length) err('/sitemap.xml', 'contains duplicate URLs');
  for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) if (!/^\d{4}-\d{2}-\d{2}$/.test(m[1])) err('/sitemap.xml', `bad lastmod ${m[1]}`);
}

const robotsFile = join(DIST, 'robots.txt');
if (!existsSync(robotsFile) || !readFileSync(robotsFile, 'utf8').includes(`Sitemap: ${SITE}/sitemap.xml`)) err('/robots.txt', 'must reference the sitemap');

// ------------------------------------------------------------------ report
console.log(`check-seo: ${indexable.length} indexable page(s), ${pages.size - indexable.length} other HTML file(s) (redirects / noindex / 404)`);
for (const [p] of indexable) console.log(`  ✓ ${p}`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${warnings.map((w) => `  ! ${w}`).join('\n')}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n${errors.map((e) => `  ✗ ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('\ncheck-seo: all checks passed');
