// Runs the same Lighthouse budgets as lighthouserc.json with the DARK theme forced, on the pages that carry the most
// colour. The main run (`npm run lighthouse`) is pinned to light, so between them both themes are audited; a theme that
// quietly fails contrast would otherwise ship, because Lighthouse only sees whichever scheme the browser prefers.
//
// The config is derived from lighthouserc.json (one place for the thresholds), so a budget change applies to both.
//   npm run build && npm run lighthouse:dark
//
// Chrome's `preferredColorScheme` flag: 0 = dark, 1 = light.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PAGES = [
  '/index.html',
  '/services/index.html',
  '/work/index.html',
  '/work/earth-cone/index.html',
  '/quote/index.html',
  '/projects/oneportal-iam/index.html',
];

const config = JSON.parse(readFileSync('lighthouserc.json', 'utf8'));
const known = new Set(config.ci.collect.url);
const missing = PAGES.filter((page) => !known.has(page));
if (missing.length) {
  console.error(
    `lighthouse-dark: not in lighthouserc.json, so not audited in the light run either: ${missing.join(', ')}`,
  );
  process.exit(1);
}

config.ci.collect.url = PAGES;
config.ci.collect.settings.chromeFlags = '--no-sandbox --blink-settings=preferredColorScheme=0';
config.ci.upload = { target: 'filesystem', outputDir: '.lighthouseci/reports-dark' };

mkdirSync('.lighthouseci', { recursive: true });
const file = '.lighthouseci/lighthouserc.dark.json';
writeFileSync(file, JSON.stringify(config, null, 2));

// Same pinned version as the workflow and `npm run lighthouse` (see docs/ci-cd.md).
const result = spawnSync('npx', ['--yes', '@lhci/cli@0.14.0', 'autorun', `--config=./${file}`], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
