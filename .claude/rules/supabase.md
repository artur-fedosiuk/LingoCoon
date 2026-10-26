---
paths:
  - supabase/**
---

# Rules for supabase/**

## Security-Critical Path
- Database schema and migrations
- RLS (Row Level Security) policies
- Database security tests
- Supabase client configuration

## Rules
- **Never edit migrations after they're applied** — create new forward migrations only
- **Pinned `search_path` in every migration** — `SET search_path TO public;` at the top
- **RLS enabled on every table** — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- **RLS policies with `WITH CHECK` and ownership checks** — never allow INSERT/UPDATE without verifying `auth.uid()` ownership
- **No raw SQL in application code** — use Supabase client methods only
- **Never commit credentials** — `.env.local` is gitignored
- **Run `safe-database-migration` skill** for any schema changes

## Validation
```bash
npm run test:security   # Runs supabase/tests/ security checks
npx supabase db lint    # If supabase CLI available
```