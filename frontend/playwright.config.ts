import { defineConfig } from '@playwright/test';

// Synthetic visual captures for Argos. Deterministic by design: the backend
// API uses explicit synthetic data. PUBLIC_PAGES in e2e-visual/inventory.ts
// defines the public route matrix. Protected and geometry states remain
// separate; docs/visual-state-inventory.md records their exact scope.
export default defineConfig({
  testDir: './e2e-visual',
  timeout: 30000,
  retries: 0,
  workers: 2,
  fullyParallel: true,
  // Without the Argos reporter, argosScreenshot writes PNG + metadata under
  // ./screenshots. The token-bearing trusted-main step uploads only those files.
  reporter: [['list']],
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
