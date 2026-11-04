# Local Development

## Status

Authoritative local workflow for development and repository verification.

- Version: 1.4
- Last reviewed: 2026-09-02

## Setup

Install dependencies after cloning the repository or changing `package-lock.json`:

```bash
npm ci
```

Copy `.env.local.example` to `.env.local` and configure only the providers used by the current application. Never commit `.env.local` or downloaded credential files.

## Development server

```bash
npm run dev
```

The default local URL is `http://localhost:3000`.

## Required verification

Run the checks relevant to the change before reporting completion:

```bash
npm run security:secrets
npm run test:security
npm run lint
npm run typecheck
npm run build
```

Run the same sequence through the aggregate command:

```bash
npm run check
```

GitHub Actions runs this verification on pull requests targeting `main` and pushes to `main`. The workflow intentionally uses no provider or production secrets.

`npm run test:security` currently runs 11 Node tests. It is not the complete application test suite; use [test strategy](test-strategy.md) to select additional database, browser, accessibility, performance, provider, or manual evidence.

Use the history scan before publishing rewritten history or after investigating credential exposure:

```bash
npm run security:secrets:history
```

Use the scanner self-test after changing `scripts/check-secrets.mjs`:

```bash
npm run security:secrets:self-test
```

## Supabase schema changes

The remote Supabase project is an external system. Do not apply dashboard SQL or
push a migration before the following review sequence is complete:

1. Compare the current remote schema with the versioned baseline without
   credentials or data.
2. Review the baseline and all existing forward migrations.
3. Add one small forward migration for the approved change.
4. Test the migration and RLS behavior against a local or isolated database.
5. Review the exact SQL, expected data effect, rollback approach, and production
   verification before applying it to the linked project.

The current legacy baseline was captured from the production catalog on
2026-09-01 and is stored under `supabase/baseline/`. Before a future Supabase
CLI `db push`, reconcile that snapshot as the remote starting state instead of
replaying it against production. The live schema already enforces the
`study_progress` uniqueness invariant on `(user_id, card_id)`. Forward
migrations must preserve that constraint, narrow only verified excess
privileges, and avoid changes to auth or storage system schemas.

Never use `db reset`, destructive SQL, or a guessed migration against the
remote project. A migration is not a backup; export or verify a recoverable
backup path before a destructive data operation.

## Repository inspection

```bash
git status --short
git diff
git diff --cached
git log --all --graph --decorate --oneline
```

Search source files with ripgrep:

```bash
rg "search-term" src
rg --files src
```

## Completion evidence

Report the commands that ran, their results, relevant manual checks, and any skipped or unavailable verification. A successful build alone does not prove runtime behavior, accessibility, authorization, provider configuration, or production readiness.
