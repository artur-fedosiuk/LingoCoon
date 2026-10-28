import { test, describe } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const GUARD_HOOK = join(PROJECT_DIR, '.claude/hooks/guard.mjs');

function runHook(hookPath, input, envOverride = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', [hookPath], {
      env: { ...process.env, CLAUDE_PROJECT_DIR: PROJECT_DIR, ...envOverride },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

let tempDir;

await (async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'guard-'));
  console.log('tempDir:', tempDir);
  execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempDir, stdio: 'ignore' });
  writeFileSync(join(tempDir, 'README.md'), 'test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['remote', 'add', 'origin', 'https://example.com/repo.git'], { cwd: tempDir, stdio: 'ignore' });

  const { execSync } = await import('child_process');
  const branch = execSync('git branch --show-current', { cwd: tempDir, encoding: 'utf8' });
  console.log('branch in tempDir:', branch.trim());
})();

const env = { CLAUDE_PROJECT_DIR: tempDir };

console.log('Running test...');
const result = await runHook(GUARD_HOOK, { tool_name: 'Bash', tool_input: { command: 'git push origin HEAD' } }, env);
console.log('Result:', result);

rmSync(tempDir, { recursive: true, force: true });