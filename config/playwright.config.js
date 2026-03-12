import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '../specs',  // relative path from config/
  timeout: 60000,
  reporter: [
    ['list'], // console
    ['html', { open: 'never' }],
    ['json', { outputFile: path.resolve(__dirname, '../test-results/results.json') }] // <-- FIXED
  ],
  globalTeardown: path.resolve(__dirname, '../specs/global-teardown.js'),
});
