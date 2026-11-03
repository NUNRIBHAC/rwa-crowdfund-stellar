import { defineConfig } from '@playwright/test';

// Synthetic visual captures for Argos. Deterministic by design: the backend
// API uses explicit synthetic data. All 24 public routes x 11 locales x
// three widths are captured. Protected account states remain separate.
export default defineConfig({
  testDir: './e2e-visual',
  timeout: 30000,
  retries: 0,
  workers: 2,
  fullyParallel: true,
  reporter: [['list'], ['@argos-ci/playwright/reporter', { uploadToArgos: !!process.env.ARGOS_TOKEN }]],
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: {
      ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
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
