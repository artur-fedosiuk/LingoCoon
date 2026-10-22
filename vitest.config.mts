import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,js,mts,mjs}'],
    exclude: [
      'node_modules/**',
      '.next/**',
      '.claude/hooks/**',
      'tests/test-setup.mjs',
    ],
    environment: 'node',
  },
});
