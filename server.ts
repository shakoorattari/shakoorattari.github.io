import 'zone.js/node';

import * as express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { ngExpressEngine } from '@nguniversal/express-engine';

import { AppServerModule } from './src/main.server';

export function app(): express.Express {
  const server = express();
  const distRoot = join(process.cwd(), 'dist/shakoor-portfolio');
  const distFolder = existsSync(join(distRoot, 'browser'))
    ? join(distRoot, 'browser')
    : distRoot;
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index.html';

  server.engine(
    'html',
    ngExpressEngine({
      bootstrap: AppServerModule,
    }),
  );

  server.set('view engine', 'html');
  server.set('views', distFolder);

  server.get('*.*', express.static(distFolder, { maxAge: '1y' }));

  server.get('*', (req, res) => {
    res.render(indexHtml, { req });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

declare const __non_webpack_require__: NodeRequire;

const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename ? mainModule.filename : '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
