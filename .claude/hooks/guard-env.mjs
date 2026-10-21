#!/usr/bin/env node
// Fail-closed guard: blocks edits to .env* files
// Returns non-zero exit code to block the tool call

import { readFileSync } from 'fs';

try {
  const input = JSON.parse(process.argv[2] || '{}');
  const filePath = input.file_path || input.path || '';

  // Block any .env file (including .env.local, .env.production, etc.)
  if (filePath && /(^|\/)\.env(\.|$)/.test(filePath)) {
    console.error(`BLOCKED: Editing .env files is not allowed: ${filePath}`);
    process.exit(1);
  }

  // Also block .claude/*.bak* files
  if (filePath && /\.claude\/.*\.bak/.test(filePath)) {
    console.error(`BLOCKED: Editing .claude backup files is not allowed: ${filePath}`);
    process.exit(1);
  }

  // Allow everything else
  process.exit(0);
} catch (e) {
  // Fail closed: on any error, block
  console.error('BLOCKED: Guard error - failing closed:', e.message);
  process.exit(1);
}