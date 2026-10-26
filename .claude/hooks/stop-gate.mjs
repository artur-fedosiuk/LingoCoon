#!/usr/bin/env node
/**
 * stop-gate.mjs — Stop hook for LingoCoon
 *
 * Runs when Claude is about to stop. If tracked or untracked source files
 * changed in this session, runs quality checks. If anything fails, prints
 * failures to stderr and exits 2 so the user keeps fixing.
 *
 * Respects stop_hook_active to avoid infinite loops:
 * - First failure: prints failures, BLOCKS stop (exit 2)
 * - If stop_hook_active is true AND previous run also failed: prints
 *   explicit warning, ALLOWS stop (exit 0) to break infinite loop
 *
 * Check commands are injectable via STOP_GATE_CHECK_CMDS env var (comma-separated).
 * Default: npm run typecheck, npm run lint, npm run test:security, npm run security:secrets
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_DIR = join(PROJECT_DIR, '.claude', '.stop-gate-state');
const STATE_FILE = join(STATE_DIR, 'last-result.json');

const SOURCE_GLOBS = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx',
  'supabase/**/*.sql',
  'tests/**/*.mjs',
  'tests/**/*.js',
  '.claude/hooks/**/*.mjs'
];

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
  process.stderr.write(`[stop-gate.mjs] BLOCKED: ${message}\n`);
  process.exit(2);
}

function getChangedFiles() {
  try {
    const trackedOutput = execSync('git diff --name-only', {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      timeout: 5000
    }).trim();

    const stagedOutput = execSync('git diff --cached --name-only', {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      timeout: 5000
    }).trim();

    const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      timeout: 5000
    }).trim();

    const allFiles = [];
    if (trackedOutput) allFiles.push(...trackedOutput.split('\n'));
    if (stagedOutput) allFiles.push(...stagedOutput.split('\n'));
    if (untrackedOutput) allFiles.push(...untrackedOutput.split('\n'));

    const minimatch = (filepath, pattern) => {
      // Convert glob pattern to regex: **/ → zero-or-more directory segments, * → filename chars
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*\//g, '(?:.+/)?')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
      return new RegExp(`^${regexPattern}$`).test(filepath);
    };

    return allFiles.filter(file => {
      return SOURCE_GLOBS.some(glob => minimatch(file, glob));
    });
  } catch {
    return [];
  }
}

function runCommand(cmd, extraOpts = {}) {
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      timeout: 120000,
      env: { ...process.env, FORCE_COLOR: '0' },
      ...extraOpts
    });
    return { success: true, output: output.trim() };
  } catch (e) {
    return { success: false, output: (e.stdout?.toString() || '') + (e.stderr?.toString() || '') || e.message };
  }
}

function readState() {
  try {
    if (existsSync(STATE_FILE)) {
      const content = readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch {}
  return { lastFailed: false };
}

function writeState(state) {
  try {
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true });
    }
    writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch {}
}

function getCheckCommands() {
  // Allow injection via env var: comma-separated list of "name:cmd" pairs
  // e.g., STOP_GATE_CHECK_CMDS="typecheck:npm run typecheck,lint:npm run lint"
  const envCmds = process.env.STOP_GATE_CHECK_CMDS;
  if (envCmds && envCmds.trim()) {
    return envCmds.split(',').map(pair => {
      const [name, cmd] = pair.split(':');
      return { name: name.trim(), cmd: cmd.trim() };
    }).filter(c => c.name && c.cmd);
  }
  // Default checks
  return [
    { name: 'typecheck', cmd: 'npm run typecheck' },
    { name: 'lint', cmd: 'npm run lint' },
    { name: 'test:security', cmd: 'npm run test:security' },
    { name: 'security:secrets', cmd: 'npm run security:secrets' }
  ];
}

async function main() {
  let raw;
  try {
    raw = await readStdinText();
  } catch (e) {
    failClosed(`stdin read error: ${e.message}`);
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    failClosed(`JSON parse error: ${e.message}`);
    return;
  }

  const stopHookActive = payload.stop_hook_active === true;
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    writeState({ lastFailed: false });
    process.exit(0);
  }

  process.stderr.write(`[stop-gate.mjs] Source files changed (${changedFiles.length}), running checks...\n`);

  const checks = getCheckCommands();

  const failures = [];

  for (const check of checks) {
    process.stderr.write(`[stop-gate.mjs] Running ${check.name}...\n`);
    const result = runCommand(check.cmd, { shell: true });
    if (!result.success) {
      failures.push({ name: check.name, output: result.output });
    }
  }

  if (failures.length === 0) {
    process.stderr.write('[stop-gate.mjs] All checks passed.\n');
    writeState({ lastFailed: false });
    process.exit(0);
  }

  process.stderr.write('[stop-gate.mjs] CHECKS FAILED:\n');
  for (const failure of failures) {
    process.stderr.write(`\n=== ${failure.name} ===\n`);
    process.stderr.write(failure.output);
    process.stderr.write('\n');
  }

  const state = readState();

  // If stop_hook_active AND previous run also failed: allow stop to break infinite loop
  if (stopHookActive && state.lastFailed) {
    process.stderr.write('\n[stop-gate.mjs] REPEATED FAILURE with stop_hook_active=true - ALLOWING stop to break infinite loop. Fix the issues before next run.\n');
    writeState({ lastFailed: true });
    process.exit(0);
  }

  // First failure (or subsequent without stop_hook_active): BLOCK stop
  process.stderr.write('\n[stop-gate.mjs] CHECKS FAILED - BLOCKING stop. Fix the issues above and try again.\n');
  writeState({ lastFailed: true });
  process.exit(2);
}

main().catch((e) => {
  failClosed(`unexpected error: ${e.message}`);
});