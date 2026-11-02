import { defineConfig } from '@playwright/test';

// Synthetic visual captures for Argos. Deterministic by design: the backend
// API is stubbed offline, so captures cover static content pages and the
// designed API-unavailable states - never live data, never all pages.
export default defineConfig({
  testDir: './e2e-visual',
  timeout: 30000,
  retries: 0,
  reporter: [['list'], ['@argos-ci/playwright/reporter', { uploadToArgos: !!process.env.ARGOS_TOKEN }]],
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: {
      args: ['--disable-lcd-text', '--font-render-hinting=none'],
    },
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
