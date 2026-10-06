import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  outputDir: `test-results/run-${Date.now()}`,
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'retain-on-failure' },
  globalSetup: './tests/e2e/setup.ts',
});
