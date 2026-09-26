import { defineConfig, devices } from '@playwright/test';

// Runs against the production build served by scripts/serve-dist.mjs (never `astro dev`: the dev server
// serves drafts and unminified assets, which is not what visitors get). Build first:
//   npm run build && npm run test:e2e
//
// Uses the system Google Chrome (`channel: 'chrome'`): it is preinstalled on GitHub-hosted Ubuntu
// runners and on developer machines, so no browser download is needed. Set PW_CHANNEL= to use
// Playwright's bundled Chromium instead (after `npx playwright install chromium`).
const channel = process.env.PW_CHANNEL === undefined ? 'chrome' : process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    // Not `astro preview`: it detaches into a background daemon, which Playwright reads as a crash.
    command: 'node scripts/serve-dist.mjs 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
