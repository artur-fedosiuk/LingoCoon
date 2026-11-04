import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  test: {
    // Only run vitest-style tests (describe/it/expect). Exclude node:test files (*.test.mjs).
    include: ['src/**/*.test.{ts,tsx,mts,mjs}', 'tests/**/*.vitest.{ts,tsx,mts,mjs}'],
    exclude: [
      'node_modules/**',
      '.next/**',
      '.claude/hooks/**',
      'tests/test-setup.mjs',
      'tests/*.test.mjs',
    ],
    environment: 'node',
  },
});
