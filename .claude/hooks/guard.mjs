#!/usr/bin/env node
/**
 * guard.mjs — PreToolUse hook for LingoCoon
 *
 * Reads the hook payload JSON from stdin and fails closed (exit 2) when a
 * tool call touches protected paths or runs a dangerous Bash command.
 * Exits 0 to allow the call.
 *
 * Blocked:
 *   * File tools (Read, Edit, Write, MultiEdit, Glob, Grep) on any .env* file
 *     except .env.example and .env.local.example, and on *.bak* files under .claude/.
 *   * Bash: cat/cp/mv/source/grep/head/tail/base64 on .env* files,
 *     env/printenv dumps.
 *   * git push targeting main or master: explicit refs, +main, :main,
 *     --force/--mirror/--all, and "git push" with no refspec while the current
 *     branch is main or master (check git branch --show-current).
 *   * gh pr merge.
 *   * Wrapper commands (bash -c, sh -c, zsh -c) that hide dangerous inner commands.
 *   * Commands using node, python, sed, awk to read .env* files.
 *   * Bare `env` or `printenv` without arguments (dumps all env vars).
 *
 * Paths are normalized (resolve against $CLAUDE_PROJECT_DIR, collapse ../,
 * case-insensitive, symlinks) before matching.
 *
 * Accepts both the Claude Code payload shape ({tool:{name,input}})
 * and a flattened shape ({tool_name, file_path, command}).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function getProjectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function getProjectDirLower() {
  return getProjectDir().toLowerCase();
}
const ALLOWED_ENV_BASENAMES = new Set(['.env.example', '.env.local.example']);
const ENV_TOUCHING_COMMANDS = ['cat', 'cp', 'mv', 'source', 'grep', 'head', 'tail', 'base64', 'sed', 'awk'];
const FILE_READ_COMMANDS = ['node', 'python', 'python3', 'perl', 'ruby', 'sed', 'awk', 'head', 'tail', 'cat', 'grep'];
const FILE_TOOLS = new Set(['Read', 'Edit', 'Write', 'MultiEdit', 'Glob', 'Grep']);

// Catastrophic paths that should never be deleted
const CATASTROPHIC_PATHS = new Set([
  '/',
  '/home',
  '/root',
  '/etc',
  '/usr',
  '/var',
  '/bin',
  '/sbin',
  '/lib',
  '/lib64',
  '/opt',
  '/boot',
  '/dev',
  '/proc',
  '/sys',
  '/run',
  '/tmp',
  '/private',
  '/private/var',
  '/System',
  '/Applications',
  '/Library',
  '/Users',
  '~',
  '$HOME',
  '${HOME}',
]);

function readStdinText() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

function failClosed() {
  fs.writeSync(2, 'BLOCKED: Guard input error - failing closed\n');
  process.exit(2);
}

function exitBlocked(reason) {
  fs.writeSync(2, `[guard.mjs] BLOCKED: ${reason}\n`);
  process.exit(2);
}

function normalizeFilePath(filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0) return null;
  const resolved = path.resolve(PROJECT_DIR, filePath);
  let normalized = resolved;
  try {
    normalized = fs.realpathSync(resolved);
  } catch {}
  // Symlink escape protection: resolved path must still be under PROJECT_DIR
  const resolvedLower = normalized.toLowerCase();
  if (!resolvedLower.startsWith(PROJECT_DIR_LOWER + path.sep) && resolvedLower !== PROJECT_DIR_LOWER) {
    return null;
  }
  return resolvedLower;
}

function isUnderDirectory(normalizedPath, directoryName) {
  const rel = path.relative(PROJECT_DIR_LOWER, normalizedPath);
  if (rel === '' || rel === directoryName) return true;
  const parts = rel.split(path.sep);
  return parts[0] === directoryName && !rel.startsWith('..');
}

function isBlockedFilePath(normalizedPath) {
  if (!normalizedPath) return false;
  const basename = path.basename(normalizedPath);
  if (basename.startsWith('.env') && !ALLOWED_ENV_BASENAMES.has(basename)) return true;
  if (isUnderDirectory(normalizedPath, '.claude') && basename.includes('.bak')) return true;
  return false;
}

function extractToolInfo(payload) {
  const tool = payload && typeof payload.tool === 'object' && payload.tool ? payload.tool : null;
  let name, input;
  if (tool) {
    name = typeof tool.name === 'string' ? tool.name : '';
    input = typeof tool.input === 'object' && tool.input ? tool.input : {};
  } else {
    name = typeof payload.tool_name === 'string' ? payload.tool_name : '';
    input =
      typeof payload.tool_input === 'object' && payload.tool_input
        ? payload.tool_input
        : payload;
  }
  return { name: String(name), input: typeof input === 'object' && input ? input : {} };
}

function getFilePath(input) {
  if (typeof input.file_path === 'string') return input.file_path;
  if (typeof input.filePath === 'string') return input.filePath;
  if (typeof input.path === 'string') return input.path;
  if (typeof input.pattern === 'string') return input.pattern;
  return '';
}

function getCommand(input) {
  if (typeof input.command === 'string') return input.command;
  if (typeof input.cmd === 'string') return input.cmd;
  return '';
}

// Strip shell quotes and backslashes so that `.e''nv`, `".en"v`, `.\e\n\v` become `.env`
// We strip the QUOTE CHARACTERS only, preserving content inside
function stripShellQuoting(str) {
  return str
    .replace(/\\/g, '')        // remove backslashes only
    .replace(/'/g, '')         // strip single quotes
    .replace(/"/g, '')         // strip double quotes
    .replace(/`/g, '');        // strip backticks
}

function hasBlockedEnvPath(command) {
  // Check if command contains .env paths (not .env.example)
  // Match .env as basename or anywhere in a path token (e.g., ./.env.local, ../.env.local, /path/.env.local)
  // Also matches command substitution $(cat .env.local) and quoted forms
  // Prefix chars: start of string, whitespace, shell metachars, dot (for ./../), quotes/backticks, slash
  // Also match wildcards *, ?, [ after .env (shell glob patterns)
  const cleaned = stripShellQuoting(command);
  const envPathRegex = /(?:^|[\s|&;<>\(\)\[\]\{\}"'`/.])(\.env(?:\.[a-zA-Z0-9_-]+)?[*?[]?)(?=[\s|&;<>\)\]\}\{\}"'`*]|$)/g;
  let match;
  while ((match = envPathRegex.exec(cleaned)) !== null) {
    const envFile = match[1];
    // Normalize by removing trailing wildcard chars for allowlist check
    const normalized = envFile.replace(/[*?[]+$/, '');
    if (!ALLOWED_ENV_BASENAMES.has(normalized)) return true;
  }
  return false;
}

// Expand environment variables in a path string (e.g., $HOME, ${HOME})
function expandEnvVars(str) {
  return str.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/gi, (_, brace, simple) => {
    const key = brace || simple;
    return process.env[key] || '';
  });
}

function getCurrentGitBranch() {
  try {
    const output = execSync('git branch --show-current', {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      timeout: 5000
    });
    return output.trim();
  } catch {
    return null;
  }
}

// Returns true if a push token (after "git push") names main/master as the
// destination — either directly (main, +main, :main) or as the right side of
// a refspec (refs/heads/main:refs/heads/main, feature:main, etc.).
function refTargetsMainOrMaster(token) {
  const clean = token.replace(/^\+/, '');
  if (clean === 'main' || clean === 'master') return true;
  if (clean === 'refs/heads/main' || clean === 'refs/heads/master') return true;
  if (clean.includes(':')) {
    const dest = clean.split(':')[1];
    if (dest === 'main' || dest === 'master' || dest === 'refs/heads/main' || dest === 'refs/heads/master') return true;
  }
  return false;
}

// Check for wrapper commands (bash -c, sh -c, zsh -c) and recursively check inner command
function checkWrapperCommand(cmd) {
  // Match bash -c "..." or bash -c '...' or bash -c ...
  const wrapperMatch = cmd.match(/^(?:bash|sh|zsh)\s+-c\s+(["'`])(.+?)\1(?:\s|$)/i);
  if (wrapperMatch) {
    const innerCmd = wrapperMatch[2].trim();
    if (isBlockedBashCommand(innerCmd)) return true;
  }
  // Also match without quotes: bash -c command
  const wrapperMatch2 = cmd.match(/^(?:bash|sh|zsh)\s+-c\s+(\S+)(?:\s|$)/i);
  if (wrapperMatch2) {
    const innerCmd = wrapperMatch2[1].trim();
    if (isBlockedBashCommand(innerCmd)) return true;
  }
  return false;
}

// Check if command uses file-reading tools (node, python, sed, awk, etc.) on .env files
function checkFileReadCommand(cmd) {
  // Match patterns like: node -e "...", python -c "...", sed ... .env, awk ... .env, etc.
  const fileReadPatterns = [
    /^node\s+(-e|--eval)\s+["'`].*\.env/gi,
    /^python\s+(-c|--command)\s+["'`].*\.env/gi,
    /^python3\s+(-c|--command)\s+["'`].*\.env/gi,
    /^sed\s+.*\.env(?:\s|$)/gi,
    /^awk\s+.*\.env(?:\s|$)/gi,
    /^perl\s+.*\.env(?:\s|$)/gi,
    /^ruby\s+.*\.env(?:\s|$)/gi,
  ];
  for (const pattern of fileReadPatterns) {
    if (pattern.test(cmd)) return true;
  }
  // Also check if any of the FILE_READ_COMMANDS appear with .env in the command
  if (hasBlockedEnvPath(cmd)) {
    const firstWord = cmd.trim().split(/\s+/)[0];
    if (FILE_READ_COMMANDS.includes(firstWord)) return true;
  }
  return false;
}

// Check for bare env/printenv (no arguments) vs env VAR=value command
function checkBareEnv(cmd) {
  const tokens = cmd.trim().split(/\s+/);
  if (tokens[0] === 'env' || tokens[0] === 'printenv') {
    // Allow: env VAR=value command (environment variable assignment)
    // Block: bare env or printenv (dumps all env vars)
    if (tokens.length === 1) return true;
    // Check if second token is an assignment (VAR=value)
    const secondToken = tokens[1];
    if (!secondToken || !secondToken.includes('=')) {
      // If there are more tokens but no assignment, it's a bare env/printenv
      return true;
    }
    // If second token is VAR=value, it's allowed
    return false;
  }
  return false;
}

// Check for git push to main/master with various prefixes
function isGitPushToMainOrMaster(subCmd) {
  // Remove leading prefixes: sudo, command, env vars (FOO=bar), git -C <dir>
  let normalized = subCmd;

  // Remove sudo
  normalized = normalized.replace(/^sudo\s+/, '');

  // Remove "command"
  normalized = normalized.replace(/^command\s+/, '');

  // Remove env vars at start (FOO=bar BAZ=qux)
  normalized = normalized.replace(/^(\w+=\S+\s+)*/, '');

  // Remove git -C <dir> prefix BUT keep "git" so "git push" detection still works
  normalized = normalized.replace(/^git\s+-c\s+\S+(\s+)/i, 'git$1');

  // Now check if it's a git push command
  const gitPushMatch = normalized.match(/^git\s+push\b/);
  if (!gitPushMatch) return false;

  // Check for force/mirror/all flags anywhere in the sub-command
  if (/(^|\s)--force(\s|$)/.test(normalized) || /(^|\s)-f(\s|$)/.test(normalized) || /(^|\s)--mirror(\s|$)/.test(normalized) || /(^|\s)--all(\s|$)/.test(normalized)) {
    return true;
  }

  // Parse tokens after "git push"
  const afterPush = normalized.replace(/^git\s+push\s*/i, '');
  const tokens = afterPush.split(/\s+/).filter(t => t.length > 0);

  // Skip flags (tokens starting with '-')
  const nonFlagTokens = tokens.filter(t => !t.startsWith('-'));

  if (nonFlagTokens.length === 0) {
    // No tokens at all - just "git push" (or only flags)
    const currentBranch = getCurrentGitBranch();
    if (currentBranch === 'main' || currentBranch === 'master') return true;
    return false;
  }

  // First non-flag token is the remote
  // Remaining tokens are refspecs
  const refspecs = nonFlagTokens.slice(1);

  if (refspecs.length === 0) {
    // No refspec provided - push current branch to same name on remote
    const currentBranch = getCurrentGitBranch();
    if (currentBranch === 'main' || currentBranch === 'master') return true;
    return false;
  }

  // Check each refspec's destination
  for (const refspec of refspecs) {
    let dest;
    if (refspec.includes(':')) {
      // Format: src:dest (src can have + prefix for force)
      dest = refspec.split(':')[1];
    } else {
      // Format: branch (pushes to same name on remote), may have + prefix
      dest = refspec;
    }
    // Strip leading + (force push indicator)
    dest = dest.replace(/^\+/, '');
    // HEAD means current branch (command is lowercased, so check for 'head')
    if (dest === 'head') {
      dest = getCurrentGitBranch() || '';
    }
    if (dest === 'main' || dest === 'master' || dest === 'refs/heads/main' || dest === 'refs/heads/master') {
      return true;
    }
  }

  return false;
}

function isCatastrophicRm(subCmd) {
  if (!/\brm\b/.test(subCmd)) return false;
  if (!/-rf\b/.test(subCmd) && !/\s-r\s+-f\b/.test(subCmd) && !/\s-f\s+-r\b/.test(subCmd)) return false;

  // Extract potential paths after rm -rf
  const rmMatch = subCmd.match(/\brm\s+(?:-rf|-r\s+-f|-f\s+-r)\s+(.+)$/);
  if (!rmMatch) return false;

  const paths = rmMatch[1].split(/\s+/).filter(p => p.length > 0);
  for (const p of paths) {
    // Clean up the path (remove quotes, trailing slashes)
    const cleanPath = p.replace(/^["'`]+|["'`]+$/g, '').replace(/\/$/, '');

    // Expand environment variables before checking
    const expandedPath = expandEnvVars(cleanPath);

    if (CATASTROPHIC_PATHS.has(expandedPath)) {
      return true;
    }
    // Also check if path resolves to project root
    try {
      const resolved = path.resolve(PROJECT_DIR, expandedPath);
      const resolvedLower = resolved.toLowerCase();
      if (resolvedLower === PROJECT_DIR_LOWER) {
        return true;
      }
    } catch {}
  }
  return false;
}

function isBlockedBashCommand(command) {
  if (typeof command !== 'string') return false;
  const lower = command.toLowerCase();
  const trimmed = lower.trim();

  // --- Obfuscation detection (checked on raw command, before char stripping) ---
  // eval as a command (at start or after ; | &), not as part of a filename
  if (/(?:^|[;|&]\s*)eval\b/.test(lower)) return true;
  if (/\bbase64\b/.test(lower) && /\|\s*(sh|bash|zsh)(\s|$)/.test(lower)) return true;

  // Check for curl/wget piped to shell (dangerous pattern) - check on full command BEFORE splitting
  if (/\b(curl|wget)\b/.test(lower) && /\|\s*(sh|bash|zsh)(\s|$)/.test(lower)) {
    return true;
  }

  // Check for gh pr merge
  if (trimmed.startsWith('gh pr merge') || trimmed.startsWith('gh pr merge ')) {
    return true;
  }

  // BROAD CHECK: any .env file reference in the full command (catches command substitution, etc.)
  if (hasBlockedEnvPath(lower)) return true;

  // Split command into sub-commands by shell separators
  // Handles: &&, ||, |, ;, newlines
  const subCommands = splitIntoSubCommands(lower);

  for (const subCmd of subCommands) {
    const subTrimmed = subCmd.trim();
    if (!subTrimmed) continue;

    // Check for wrapper commands (bash -c, sh -c, zsh -c) that hide inner commands
    if (checkWrapperCommand(subTrimmed)) return true;

    // Check for git push with various prefixes (sudo, command, git -C, env vars)
    if (isGitPushToMainOrMaster(subTrimmed)) {
      return true;
    }

    // Check for --no-verify anywhere in sub-command
    if (subTrimmed.includes('--no-verify')) return true;

    // Check for gh pr merge in sub-command
    if (subTrimmed.startsWith('gh pr merge')) return true;

    // Check for catastrophic rm -rf (only catastrophic paths)
    if (isCatastrophicRm(subTrimmed)) {
      return true;
    }

    // Check for bare env/printenv dumps (no arguments)
    if (checkBareEnv(subTrimmed)) return true;

    // Check for file-reading commands (node, python, sed, awk) targeting .env files
    if (checkFileReadCommand(subTrimmed)) return true;
  }

  return false;
}

function splitIntoSubCommands(command) {
  // Split on shell separators: &&, ||, |, ;, newlines
  // Note: We don't handle quoted strings perfectly, but this catches the main bypasses
  return command.split(/\s*(&&|\|\||[|;])\s*/).filter((_, i) => {
    // Keep only the command parts, not the separators (even indices are commands)
    return i % 2 === 0;
  });
}

async function main() {
  let raw;
  try {
    raw = await readStdinText();
  } catch {
    failClosed();
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    failClosed();
  }

  const { name: toolName, input: toolInput } = extractToolInfo(payload);

  // Fail-closed: unknown or empty tool name is a bypass attempt
  if (!toolName || typeof toolName !== 'string' || toolName.trim() === '') {
    exitBlocked('Missing or empty tool_name');
  }

  if (FILE_TOOLS.has(toolName)) {
    const filePath = getFilePath(toolInput);
    const normalized = normalizeFilePath(filePath);
    if (isBlockedFilePath(normalized)) {
      const basename = path.basename(normalized || filePath);
      if (isUnderDirectory(normalized || '', '.claude') && basename.includes('.bak')) {
        exitBlocked(`Access to .claude backup files is not allowed: ${filePath}`);
      }
      exitBlocked(`Access to .env files is not allowed: ${filePath}`);
    }
  }

  if (toolName === 'Bash') {
    if (isBlockedBashCommand(getCommand(toolInput))) {
      exitBlocked(`Dangerous bash command detected: ${String(getCommand(toolInput)).slice(0, 300)}`);
    }
  }

  process.exit(0);
}

main().catch(failClosed);