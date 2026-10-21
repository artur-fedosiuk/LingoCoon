# Rules for tests/**

## Security-Critical Path
This directory contains:
- Security boundary tests (104 tests, all must pass)
- Node.js native test runner (`*.test.mjs`)
- Tests for: TTS, reading audio, context studio, AI contracts, cache, auth

## Rules
- **Tests exercise shipped implementation** — not copies of logic
- **Security tests are fail-closed** — they verify boundaries, not happy paths
- **Run full suite before commit** — `npm run test:security`
- **Add tests for new security boundaries** — follow existing patterns
- **No flaky tests** — deterministic, no external dependencies

## Validation
```bash
npm run test:security   # Must show: pass 104, fail 0
```