import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveAuthAlert } from '../src/lib/auth-alerts.ts';

/**
 * Security test: Scans auth-related directories for unsafe console.log/debug/info calls.
 * This test MUST fail if any console.log, console.debug, or console.info is found in these directories.
 * Only console.error is allowed for error logging (with strict restrictions on what can be logged).
 * Also detects aliasing bypasses like `const log = console.log`.
 */

const ROOT = resolve('src');
const SCAN_DIRS = ['app/auth', 'app/login', 'lib/supabase'];
const SCAN_FILES = ['proxy.ts']; // Additional individual files to scan
const FORBIDDEN_PATTERNS = [
  /\bconsole\.log\s*\(/,
  /\bconsole\.debug\s*\(/,
  /\bconsole\.info\s*\(/,
];

const ALLOWED_PATTERNS = [
  // Allow console.error with only error.code and error.status
  /\bconsole\.error\s*\(\s*['"][^'"]*['"],\s*\{\s*code:\s*error\.code\s*,\s*status:\s*error\.status\s*\}\s*\)/,
  /\bconsole\.error\s*\(\s*['"][^'"]*['"],\s*\{\s*status:\s*error\.status\s*,\s*code:\s*error\.code\s*\}\s*\)/,
];

// Patterns that detect aliasing bypasses: const log = console.log, const dbg = console.debug, etc.
const ALIASING_PATTERNS = [
  /\bconst\s+\w+\s*=\s*console\.(log|debug|info)\b/,
  /\blet\s+\w+\s*=\s*console\.(log|debug|info)\b/,
  /\bvar\s+\w+\s*=\s*console\.(log|debug|info)\b/,
  // Destructuring: const { log } = console
  /\bconst\s+\{\s*\w+\s*\}\s*=\s*console\b/,
  /\blet\s+\{\s*\w+\s*\}\s*=\s*console\b/,
  /\bvar\s+\{\s*\w+\s*\}\s*=\s*console\b/,
];

// Pattern to detect free-text error redirects (e.g., redirect('/login?error=Some free text message'))
// Must use error codes only (snake_case), not free text
// Valid error codes are snake_case: fill_all_fields, invalid_credentials, oauth_error, etc.
// Free text contains: spaces, capitalized words, common English words like "and", "the", "your", etc.
// Known valid error codes to exclude from detection
const VALID_ERROR_CODES = [
  'fill_all_fields',
  'password_min_length',
  'invalid_email',
  'invalid_credentials',
  'email_not_confirmed',
  'weak_password',
  'user_already_exists',
  'signup_disabled',
  'email_conflict',
  'reauthentication_needed',
  'session_not_found',
  'token_expired',
  'invalid_token',
  'oauth_error',
  'provider_disabled',
  'unauthorized',
  'forbidden',
  'server_error',
  'unknown',
];

// Build a negative lookahead pattern to exclude valid error codes
const VALID_CODES_PATTERN = `(?:${VALID_ERROR_CODES.join('|')})`;

// Pattern to detect free-text error redirects - only flags when error= is followed by something
// that is NOT a valid error code
const FREE_TEXT_REDIRECT_PATTERNS = [
  // redirect('/login?error=some free text with spaces')
  /redirect\s*\(\s*['"][^'"]*\?error=(?!${VALID_CODES_PATTERN}(?:['"]|&|$))[^'"]*\s+[^'"]*['"]\s*\)/,
  // redirect('/login?error=Email and password required') - common English words
  /redirect\s*\(\s*['"][^'"]*\?error=(?!${VALID_CODES_PATTERN}(?:['"]|&|$))[^'"]*\b(and|the|your|email|password|required|could|not|start|check|confirm|account)\b[^'"]*['"]\s*\)/i,
  // redirect('/login?error=InvalidCredentials') - capitalized words (not snake_case)
  /redirect\s*\(\s*['"][^'"]*\?error=(?!${VALID_CODES_PATTERN}(?:['"]|&|$))[^'"]*[A-Z][a-z]+[^'"]*['"]\s*\)/,
  // encodeURIComponent(error.message) - using error.message directly
  /encodeURIComponent\s*\(\s*error\.message\s*\)/,
  // Template literals with free text (not valid error code variables)
  // redirect(`/login?error=${someVar}`) where someVar is NOT error.code
  /redirect\s*\(\s*`[^`]*\?error=\$\{(?!error\.code)[^`]*\}[^`]*`\s*\)/,
  // NextResponse.redirect variants with free text
  /NextResponse\.redirect\s*\(\s*['"][^'"]*\?error=(?!${VALID_CODES_PATTERN}(?:['"]|&|$))[^'"]*\s+[^'"]*['"]\s*\)/,
  /NextResponse\.redirect\s*\(\s*['"][^'"]*\?error=(?!${VALID_CODES_PATTERN}(?:['"]|&|$))[^'"]*\b(and|the|your|email|password|required|could|not|start|check|confirm|account)\b[^'"]*['"]\s*\)/i,
  /NextResponse\.redirect\s*\(\s*`[^`]*\?error=\$\{(?!error\.code)[^`]*\}[^`]*`\s*\)/,
];

function getAllTsFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFileForViolations(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check for forbidden patterns (console.log, console.debug, console.info)
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        // Check if this is an allowed console.error pattern
        let isAllowed = false;
        for (const allowedPattern of ALLOWED_PATTERNS) {
          if (allowedPattern.test(line)) {
            isAllowed = true;
            break;
          }
        }

        if (!isAllowed) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            pattern: pattern.source,
          });
        }
      }
    }

    // Check for aliasing bypasses (const log = console.log, etc.)
    for (const pattern of ALIASING_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          pattern: pattern.source,
          type: 'aliasing',
        });
      }
    }
  }

  return violations;
}

describe('Auth Logging Security - No sensitive data in logs', () => {
  let allViolations = [];

  beforeEach(() => {
    allViolations = [];
    // Scan directories
    for (const dir of SCAN_DIRS) {
      const fullDir = resolve(ROOT, dir);
      const files = getAllTsFiles(fullDir);
      for (const file of files) {
        const violations = scanFileForViolations(file);
        allViolations.push(...violations);
      }
    }
    // Scan individual files
    for (const fileName of SCAN_FILES) {
      const filePath = resolve(ROOT, fileName);
      const violations = scanFileForViolations(filePath);
      allViolations.push(...violations);
    }
  });

  test('No console.log, console.debug, or console.info in auth-related directories and proxy.ts', () => {
    if (allViolations.length > 0) {
      const report = allViolations.map(v =>
        `${v.file}:${v.line} - ${v.content}${v.type === 'aliasing' ? ' [ALIASING BYPASS]' : ''}`
      ).join('\n');

      assert.fail(
        `Found ${allViolations.length} unsafe console logging violations in auth-related code:\n${report}\n\n` +
        `Only console.error with { code: error.code, status: error.status } is allowed for error logging.\n` +
        `Never log: tokens, codes, emails, user IDs, URLs, or full query parameters.\n` +
        `Aliasing bypasses (e.g., const log = console.log) are also forbidden.`
      );
    }
  });

  test('No console aliasing bypasses (const log = console.log, etc.)', () => {
    const aliasingViolations = allViolations.filter(v => v.type === 'aliasing');
    if (aliasingViolations.length > 0) {
      const report = aliasingViolations.map(v =>
        `${v.file}:${v.line} - ${v.content}`
      ).join('\n');

      assert.fail(
        `Found ${aliasingViolations.length} console aliasing bypasses:\n${report}\n\n` +
        `Assigning console.log/debug/info to variables or destructuring them is forbidden.`
      );
    }
  });

  test('console.error only logs error.code and error.status', () => {
    const errorViolations = [];

    // Scan directories
    for (const dir of SCAN_DIRS) {
      const fullDir = resolve(ROOT, dir);
      const files = getAllTsFiles(fullDir);

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Check for console.error that logs more than code/status
          if (/\bconsole\.error\s*\(/.test(line)) {
            let isAllowed = false;
            for (const allowedPattern of ALLOWED_PATTERNS) {
              if (allowedPattern.test(line)) {
                isAllowed = true;
                break;
              }
            }

            if (!isAllowed) {
              errorViolations.push({
                file,
                line: i + 1,
                content: line.trim(),
              });
            }
          }
        }
      }
    }
    // Scan individual files
    for (const fileName of SCAN_FILES) {
      const filePath = resolve(ROOT, fileName);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\bconsole\.error\s*\(/.test(line)) {
          let isAllowed = false;
          for (const allowedPattern of ALLOWED_PATTERNS) {
            if (allowedPattern.test(line)) {
              isAllowed = true;
              break;
            }
          }

          if (!isAllowed) {
            errorViolations.push({
              file: filePath,
              line: i + 1,
              content: line.trim(),
            });
          }
        }
      }
    }

    if (errorViolations.length > 0) {
      const report = errorViolations.map(v =>
        `${v.file}:${v.line} - ${v.content}`
      ).join('\n');

      assert.fail(
        `Found ${errorViolations.length} console.error calls logging more than error.code and error.status:\n${report}\n\n` +
        `Allowed format: console.error('[LABEL]', { code: error.code, status: error.status })`
      );
    }
  });

  test('No free-text error redirects - must use error codes only', () => {
    const freeTextViolations = [];

    // Scan directories
    for (const dir of SCAN_DIRS) {
      const fullDir = resolve(ROOT, dir);
      const files = getAllTsFiles(fullDir);

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Check for free-text error redirects
          for (const pattern of FREE_TEXT_REDIRECT_PATTERNS) {
            if (pattern.test(line)) {
              freeTextViolations.push({
                file,
                line: i + 1,
                content: line.trim(),
                pattern: pattern.source,
              });
            }
          }
        }
      }
    }
    // Scan individual files
    for (const fileName of SCAN_FILES) {
      const filePath = resolve(ROOT, fileName);
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of FREE_TEXT_REDIRECT_PATTERNS) {
          if (pattern.test(line)) {
            freeTextViolations.push({
              file: filePath,
              line: i + 1,
              content: line.trim(),
              pattern: pattern.source,
            });
          }
        }
      }
    }

    if (freeTextViolations.length > 0) {
      const report = freeTextViolations.map(v =>
        `${v.file}:${v.line} - ${v.content}`
      ).join('\n');

      assert.fail(
        `Found ${freeTextViolations.length} free-text error redirects (must use error codes only):\n${report}\n\n` +
        `Error redirects must use codes like 'invalid_credentials', 'oauth_error', 'fill_all_fields', etc.\n` +
        `Never use free text: 'Email and password are required', 'Could not authenticate', error.message, etc.`
      );
    }
  });
});

describe('resolveAuthAlert - auth error/message code resolution', () => {
  test('returns null for both errorKey and messageKey when no params provided', () => {
    const result = resolveAuthAlert(null, null);
    assert.deepStrictEqual(result, { errorKey: null, messageKey: null });
  });

  test('returns null errorKey when error param is null', () => {
    const result = resolveAuthAlert(null, 'email_confirmation_sent');
    assert.strictEqual(result.errorKey, null);
    assert.strictEqual(result.messageKey, 'auth.messages.email_confirmation_sent');
  });

  test('returns null messageKey when message param is null', () => {
    const result = resolveAuthAlert('invalid_credentials', null);
    assert.strictEqual(result.errorKey, 'auth.errors.invalid_credentials');
    assert.strictEqual(result.messageKey, null);
  });

  test('maps known error code to correct i18n key', () => {
    const result = resolveAuthAlert('invalid_credentials', null);
    assert.strictEqual(result.errorKey, 'auth.errors.invalid_credentials');
  });

  test('maps all known Supabase error codes', () => {
    const knownCodes = [
      'invalid_credentials',
      'email_not_confirmed',
      'weak_password',
      'user_already_exists',
      'signup_disabled',
      'email_conflict',
      'reauthentication_needed',
      'session_not_found',
      'token_expired',
      'invalid_token',
      'oauth_error',
      'provider_disabled',
      'unauthorized',
      'forbidden',
      'server_error',
    ];

    for (const code of knownCodes) {
      const result = resolveAuthAlert(code, null);
      assert.strictEqual(result.errorKey, `auth.errors.${code}`, `Failed for code: ${code}`);
    }
  });

  test('maps fill_all_fields and password_min_length and invalid_email', () => {
    assert.strictEqual(resolveAuthAlert('fill_all_fields', null).errorKey, 'auth.errors.fill_all_fields');
    assert.strictEqual(resolveAuthAlert('password_min_length', null).errorKey, 'auth.errors.password_min_length');
    assert.strictEqual(resolveAuthAlert('invalid_email', null).errorKey, 'auth.errors.invalid_email');
  });

  test('maps user_not_found to invalid_credentials (security: no user existence leak)', () => {
    const result = resolveAuthAlert('user_not_found', null);
    assert.strictEqual(result.errorKey, 'auth.errors.invalid_credentials');
  });

  test('returns unknown for completely unknown error code', () => {
    const result = resolveAuthAlert('some_unknown_code', null);
    assert.strictEqual(result.errorKey, 'auth.errors.unknown');
  });

  test('returns unknown for prototype pollution attempts', () => {
    // These should not match any known code and fall back to unknown
    const result1 = resolveAuthAlert('constructor', null);
    assert.strictEqual(result1.errorKey, 'auth.errors.unknown');

    const result2 = resolveAuthAlert('__proto__', null);
    assert.strictEqual(result2.errorKey, 'auth.errors.unknown');

    const result3 = resolveAuthAlert('prototype', null);
    assert.strictEqual(result3.errorKey, 'auth.errors.unknown');
  });

  test('maps known message codes to correct i18n keys', () => {
    assert.strictEqual(resolveAuthAlert(null, 'email_confirmation_sent').messageKey, 'auth.messages.email_confirmation_sent');
    assert.strictEqual(resolveAuthAlert(null, 'password_reset_sent').messageKey, 'auth.messages.password_reset_sent');
    assert.strictEqual(resolveAuthAlert(null, 'signed_out').messageKey, 'auth.messages.signed_out');
    assert.strictEqual(resolveAuthAlert(null, 'onboarding_complete').messageKey, 'onboarding.create_account_to_save');
  });

  test('returns null messageKey for unknown message code', () => {
    const result = resolveAuthAlert(null, 'some_random_message');
    assert.strictEqual(result.messageKey, null);
  });

  test('returns null messageKey for prototype pollution attempts in message', () => {
    const result1 = resolveAuthAlert(null, 'constructor');
    assert.strictEqual(result1.messageKey, null);

    const result2 = resolveAuthAlert(null, '__proto__');
    assert.strictEqual(result2.messageKey, null);
  });

  test('both error and message can be resolved simultaneously', () => {
    const result = resolveAuthAlert('invalid_credentials', 'email_confirmation_sent');
    assert.strictEqual(result.errorKey, 'auth.errors.invalid_credentials');
    assert.strictEqual(result.messageKey, 'auth.messages.email_confirmation_sent');
  });
});