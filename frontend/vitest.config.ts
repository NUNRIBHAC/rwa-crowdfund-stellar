import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    // Playwright visual captures are not vitest specs; the visual workflow
    // runs them with the Playwright runner.
    exclude: [...configDefaults.exclude, 'e2e-visual/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      thresholds: { lines: 54, functions: 42, branches: 46 },
    },
  },
});
