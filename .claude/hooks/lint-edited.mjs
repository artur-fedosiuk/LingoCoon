#!/usr/bin/env node
// Post-edit hook: runs lint on the edited file (if it's a TS/JS file)
// Non-blocking - just reports

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

try {
  const input = JSON.parse(process.argv[2] || '{}');
  const filePath = input.file_path || input.path || '';

  // Only lint TypeScript/JavaScript files
  if (!filePath || !/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    process.exit(0);
  }

  // Check if file exists
  try {
    readFileSync(filePath);
  } catch {
    process.exit(0); // File doesn't exist (maybe deleted), skip
  }

  // Run eslint on just this file
  try {
    execSync(`npx eslint "${filePath}" --max-warnings=0`, {
      stdio: 'pipe',
      timeout: 30000,
      cwd: process.cwd()
    });
  } catch (e) {
    // Non-blocking: just report, don't fail the edit
    const output = e.stdout?.toString() || e.stderr?.toString() || e.message;
    if (output.trim()) {
      console.error(`[lint] ${filePath}:\n${output}`);
    }
  }

  process.exit(0);
} catch (e) {
  // Never block on hook errors
  console.error('[lint-hook] error:', e.message);
  process.exit(0);
}