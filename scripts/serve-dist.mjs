// Minimal static file server for dist/, used by the Playwright suite (`npm run test:e2e`).
//
// It serves the built site the way GitHub Pages does: `/dir/` -> `/dir/index.html`, a real 404
// status with dist/404.html for anything missing, correct content types. `astro preview` is not used
// because it detaches into a background daemon, which test runners read as a crashed server.
//
//   node scripts/serve-dist.mjs [port]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
const root = join(process.cwd(), 'dist');

if (!existsSync(root)) {
  console.error('serve-dist: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

const resolveFile = (pathname) => {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, safe);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  return file.startsWith(root) && existsSync(file) && statSync(file).isFile() ? file : null;
};

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = resolveFile(pathname);
  const target = file ?? resolveFile('/404.html');
  const status = file ? 200 : 404;

  if (!target) {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  response.writeHead(status, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(response);
}).listen(port, () => console.log(`serving dist/ on http://localhost:${port}`));
