#!/usr/bin/env node
/**
 * lint.mjs — PostToolUse hook for LingoCoon
 *
 * Runs eslint on edited .ts/.tsx files.
 * Reads JSON from stdin, exit code 2 blocks on lint failure.
 * Fails closed on parse errors.
 */

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const ESLINT_TIMEOUT = 30000;

function readStdinText() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

function failClosed(message) {
  process.stderr.write(`[lint.mjs] BLOCKED: ${message}\n`);
  process.exit(2);
}

async function main() {
  let raw;
  try {
    raw = await readStdinText();
  } catch (e) {
    failClosed(`stdin read error: ${e.message}`);
    return;
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch (e) {
    failClosed(`JSON parse error: ${e.message}`);
    return;
  }

  // Support both payload shapes (real shape has tool_input at top level)
  const toolName = input.tool_name || input.name || (input.tool && input.tool.name) || '';
  const filePath = input.tool_input?.file_path
    || input.file_path
    || input.path
    || (input.tool && input.tool.input && input.tool.input.file_path)
    || (input.tool && input.tool.input && input.tool.input.path)
    || '';

  // Only run on Edit, Write, MultiEdit for .ts/.tsx files
  if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) {
    process.exit(0);
  }

  if (!filePath || !/\.(ts|tsx)$/.test(filePath)) {
    process.exit(0);
  }

  // Resolve absolute path
  const absolutePath = resolve(PROJECT_DIR, filePath);

  // Check if file exists
  if (!existsSync(absolutePath)) {
    process.exit(0);
  }

  // Run eslint on just this file (no shell — prevents command injection via filename)
  try {
    execFileSync('npx', ['eslint', absolutePath, '--max-warnings=0'], {
      stdio: 'pipe',
      timeout: ESLINT_TIMEOUT,
      cwd: PROJECT_DIR,
      env: { ...process.env, FORCE_COLOR: '0' }
    });
    process.exit(0);
  } catch (e) {
    const output = e.stdout?.toString() || e.stderr?.toString() || e.message;
    if (output.trim()) {
      process.stderr.write(output);
    }
    process.exit(2);
  }
}

main().catch((e) => {
  failClosed(`unexpected error: ${e.message}`);
});