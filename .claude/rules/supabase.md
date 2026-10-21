# Rules for supabase/**

## Security-Critical Path
This directory contains:
- Database schema and migrations
- RLS (Row Level Security) policies
- Database security tests
- Supabase client configuration

## Rules
- **Never edit migrations after they're applied** — create new forward migrations only
- **RLS policies must be tested** — run `npm run test:security` after any supabase/ change
- **No raw SQL in application code** — use Supabase client methods
- **Never commit credentials** — `.env.local` is gitignored
- **Run safe-database-migration skill** for any schema changes

## Validation
```bash
npm run test:security   # Runs supabase/tests/ security checks
npx supabase db lint    # If supabase CLI available
```