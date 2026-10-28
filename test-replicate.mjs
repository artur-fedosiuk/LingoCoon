import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const GUARD_HOOK = path.join(PROJECT_DIR, '.claude/hooks/guard.mjs');

let tempDir;
tempDir = fs.mkdtempSync(path.join(tmpdir(), 'guard-'));
console.log('tempDir:', tempDir);

execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir, stdio: 'ignore' });
execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tempDir, stdio: 'ignore' });
execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tempDir, stdio: 'ignore' });
fs.writeFileSync(path.join(tempDir, 'README.md'), 'test\n');
execFileSync('git', ['add', 'README.md'], { cwd: tempDir, stdio: 'ignore' });
execFileSync('git', ['commit', '-m', 'initial'], { cwd: tempDir, stdio: 'ignore' });
execFileSync('git', ['remote', 'add', 'origin', 'https://example.com/repo.git'], { cwd: tempDir, stdio: 'ignore' });

const { execSync } = await import('child_process');
const branch = execSync('git branch --show-current', { cwd: tempDir, encoding: 'utf8' });
console.log('branch in tempDir:', branch.trim());

const env = { CLAUDE_PROJECT_DIR: tempDir };

// This is EXACTLY what runHook does
const child = spawn('node', [GUARD_HOOK], {
  env: { ...process.env, CLAUDE_PROJECT_DIR: PROJECT_DIR, ...env },
  stdio: ['pipe', 'pipe', 'pipe']
});

const payload = { tool_name: 'Bash', tool_input: { command: 'git push origin HEAD' } };
child.stdin.write(JSON.stringify(payload));
child.stdin.end();

let stdout = '', stderr = '';
child.stdout.on('data', (data) => { stdout += data.toString(); });
child.stderr.on('data', (data) => { stderr += data.toString(); });

child.on('close', (code) => {
  console.log('code:', code);
  console.log('stdout:', JSON.stringify(stdout));
  console.log('stderr:', JSON.stringify(stderr));
  fs.rmSync(tempDir, { recursive: true, force: true });
});