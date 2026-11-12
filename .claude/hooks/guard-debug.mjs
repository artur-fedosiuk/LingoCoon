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
  const resolved = path.resolve(getProjectDir(), filePath);
  let normalized = resolved;
  try {
    normalized = fs.realpathSync(resolved);
  } catch {}
  const resolvedLower = normalized.toLowerCase();
  if (!resolvedLower.startsWith(getProjectDirLower() + path.sep) && resolvedLower !== getProjectDirLower()) {
    return null;
  }
  return resolvedLower;
}

function isUnderDirectory(normalizedPath, directoryName) {
  const rel = path.relative(getProjectDirLower(), normalizedPath);
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
function stripShellQuoting(str) {
  return str
    .replace(/\\/g, '')
    .replace(/'/g, '')
    .replace(/"/g, '')
    .replace(/`/g, '');
}

function hasBlockedEnvPath(command) {
  const cleaned = stripShellQuoting(command);
  const envPathRegex = /(?:^|[\s|&;<>\(\)\[\]\{\}"'`/.])(\.env(?:\.[a-zA-Z0-9_-]+)?[*?[]?)(?=[\s|&;<>\)\]\}\{\}"'`*]|$)/g;
  let match;
  while ((match = envPathRegex.exec(cleaned)) !== null) {
    const envFile = match[1];
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
      cwd: getProjectDir(),
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      timeout: 5000
    });
    return output.trim();
  } catch {
    return null;
  }
}

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

function checkWrapperCommand(cmd) {
  const wrapperMatch = cmd.match(/^(?:bash|sh|zsh)\s+-c\s+(["'`])(.+?)\1(?:\s|$)/i);
  if (wrapperMatch) {
    const innerCmd = wrapperMatch[2].trim();
    if (isBlockedBashCommand(innerCmd)) return true;
  }
  const wrapperMatch2 = cmd.match(/^(?:bash|sh|zsh)\s+-c\s+(\S+)(?:\s|$)/i);
  if (wrapperMatch2) {
    const innerCmd = wrapperMatch2[1].trim();
    if (isBlockedBashCommand(innerCmd)) return true;
  }
  return false;
}

function checkFileReadCommand(cmd) {
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
  if (hasBlockedEnvPath(cmd)) {
    const firstWord = cmd.trim().split(/\s+/)[0];
    if (FILE_READ_COMMANDS.includes(firstWord)) return true;
  }
  return false;
}

function checkBareEnv(cmd) {
  const tokens = cmd.trim().split(/\s+/);
  if (tokens[0] === 'env' || tokens[0] === 'printenv') {
    if (tokens.length === 1) return true;
    const secondToken = tokens[1];
    if (!secondToken || !secondToken.includes('=')) {
      return true;
    }
    return false;
  }
  return false;
}

function isGitPushToMainOrMaster(subCmd) {
  console.error('DEBUG isGitPushToMainOrMaster input:', JSON.stringify(subCmd));
  let normalized = subCmd;

  normalized = normalized.replace(/^sudo\s+/, '');
  normalized = normalized.replace(/^command\s+/, '');
  normalized = normalized.replace(/^(\w+=\S+\s+)*/, '');
  normalized = normalized.replace(/^git\s+-c\s+\S+(\s+)/i, 'git$1');

  const gitPushMatch = normalized.match(/^git\s+push\b/);
  if (!gitPushMatch) return false;

  if (/(^|\s)--force(\s|$)/.test(normalized) || /(^|\s)-f(\s|$)/.test(normalized) || /(^|\s)--mirror(\s|$)/.test(normalized) || /(^|\s)--all(\s|$)/.test(normalized)) {
    return true;
  }

  const afterPush = normalized.replace(/^git\s+push\s*/i, '');
  const tokens = afterPush.split(/\s+/).filter(t => t.length > 0);

  const nonFlagTokens = tokens.filter(t => !t.startsWith('-'));

  if (nonFlagTokens.length === 0) {
    const currentBranch = getCurrentGitBranch();
    console.error('DEBUG no tokens, branch:', JSON.stringify(currentBranch));
    if (currentBranch === 'main' || currentBranch === 'master') return true;
    return false;
  }

  const refspecs = nonFlagTokens.slice(1);

  if (refspecs.length === 0) {
    const currentBranch = getCurrentGitBranch();
    console.error('DEBUG no refspecs, branch:', JSON.stringify(currentBranch));
    if (currentBranch === 'main' || currentBranch === 'master') return true;
    return false;
  }

  for (const refspec of refspecs) {
    let dest;
    if (refspec.includes(':')) {
      dest = refspec.split(':')[1];
    } else {
      dest = refspec;
    }
    dest = dest.replace(/^\+/, '');
    console.error('DEBUG refspec dest:', JSON.stringify(dest));
    if (dest === 'head') {
      dest = getCurrentGitBranch() || '';
      console.error('DEBUG HEAD resolved to:', JSON.stringify(dest));
    }
    if (dest === 'main' || dest === 'master' || dest === 'refs/heads/main' || dest === 'refs/heads/master') {
      console.error('DEBUG BLOCKED: targets main/master');
      return true;
    }
  }

  return false;
}

function isCatastrophicRm(subCmd) {
  if (!/\brm\b/.test(subCmd)) return false;
  if (!/-rf\b/.test(subCmd) && !/\s-r\s+-f\b/.test(subCmd) && !/\s-f\s+-r\b/.test(subCmd)) return false;

  const rmMatch = subCmd.match(/\brm\s+(?:-rf|-r\s+-f|-f\s+-r)\s+(.+)$/);
  if (!rmMatch) return false;

  const paths = rmMatch[1].split(/\s+/).filter(p => p.length > 0);
  for (const p of paths) {
    const cleanPath = p.replace(/^["'`]+|["'`]+$/g, '').replace(/\/$/, '');
    const expandedPath = expandEnvVars(cleanPath);

    if (CATASTROPHIC_PATHS.has(expandedPath)) {
      return true;
    }
    try {
      const resolved = path.resolve(getProjectDir(), expandedPath);
      const resolvedLower = resolved.toLowerCase();
      if (resolvedLower === getProjectDirLower()) {
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

  if (/(?:^|[;|&]\s*)eval\b/.test(lower)) return true;
  if (/\bbase64\b/.test(lower) && /\|\s*(sh|bash|zsh)(\s|$)/.test(lower)) return true;

  if (/\b(curl|wget)\b/.test(lower) && /\|\s*(sh|bash|zsh)(\s|$)/.test(lower)) {
    return true;
  }

  if (trimmed.startsWith('gh pr merge') || trimmed.startsWith('gh pr merge ')) {
    return true;
  }

  if (hasBlockedEnvPath(lower)) return true;

  const subCommands = splitIntoSubCommands(lower);

  for (const subCmd of subCommands) {
    const subTrimmed = subCmd.trim();
    if (!subTrimmed) continue;

    if (checkWrapperCommand(subTrimmed)) return true;

    if (isGitPushToMainOrMaster(subTrimmed)) {
      return true;
    }

    if (subTrimmed.includes('--no-verify')) return true;

    if (subTrimmed.startsWith('gh pr merge')) return true;

    if (isCatastrophicRm(subTrimmed)) {
      return true;
    }

    if (checkBareEnv(subTrimmed)) return true;

    if (checkFileReadCommand(subTrimmed)) return true;
  }

  return false;
}

function splitIntoSubCommands(command) {
  return command.split(/\s*(&&|\|\||[|;])\s*/).filter((_, i) => {
    return i % 2 === 0;
  });
}

async function main() {
  console.error('DEBUG HOOK START: CLAUDE_PROJECT_DIR=', process.env.CLAUDE_PROJECT_DIR, 'cwd=', process.cwd());

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
    const cmd = getCommand(toolInput);
    console.error('DEBUG HOOK: Checking Bash command:', JSON.stringify(cmd));
    if (isBlockedBashCommand(cmd)) {
      console.error('DEBUG HOOK: command blocked');
      exitBlocked(`Dangerous bash command detected: ${String(cmd).slice(0, 300)}`);
    }
  }

  console.error('DEBUG HOOK: Exiting 0 (allowed)');
  process.exit(0);
}

main().catch(failClosed);
