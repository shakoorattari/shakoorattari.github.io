// Builds the site with a *fake* Google Analytics Measurement ID into dist-analytics/ and runs the analytics
// Playwright tests against it. Google's endpoints are mocked in the tests, so nothing leaves the machine and
// no real property is touched.
//
//   npm run test:analytics
import { spawnSync } from 'node:child_process';

const FAKE_ID = 'G-TEST123456';
const shell = process.platform === 'win32';

const run = (command, args, env) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell, env: { ...process.env, ...env } });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

// Hostname 'localhost' is allowed for this build only, so the tests can run; production builds only allow the real domain.
const buildEnv = { PUBLIC_GA_MEASUREMENT_ID: FAKE_ID, PUBLIC_GA_HOSTS: 'localhost', PUBLIC_CF_ANALYTICS_TOKEN: '' };

run('npx', ['astro', 'build', '--outDir', 'dist-analytics'], buildEnv);
run('npx', ['playwright', 'test', 'tests/analytics.spec.ts'], {
  ...buildEnv,
  ANALYTICS_BUILD: '1',
  DIST_DIR: 'dist-analytics',
});
