import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { promisify } from 'node:util';

// Only the disposable CI service is supported. No URL or production credentials.
assert.equal(process.env.PGDATABASE, 'lingocoon_ci');
assert.ok(['127.0.0.1', 'localhost'].includes(process.env.PGHOST));
assert.equal(process.env.PGUSER, 'postgres');
assert.equal(process.env.LINGOCOON_ISOLATED_DB, 'true');
const options = { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 };
const args = ['-X', '-v', 'ON_ERROR_STOP=1'];
const query = (sql) => execFileSync('psql', [...args, '-At', '-c', sql], options).trim();
const file = (path) => {
  execFileSync('psql', [...args, '-f', path], { ...options, stdio: 'inherit' });
};

file('supabase/tests/isolated-bootstrap.sql');
file('supabase/baseline/20260901_public_schema.sql');
for (const name of readdirSync('supabase/migrations').filter(name => name.endsWith('.sql')).sort()) {
  if (name === '20260915010000_chirp_tts.sql') {
    query(`insert into public.google_tts_budget_periods
      (starts_at, ends_at, outside_characters, reserved_characters, reconciled_at, enabled)
      values ('2000-01-01', '2000-02-01', 10, 100, '2000-01-01', true)`);
  }
  file(`supabase/migrations/${name}`);
  if (name === '20260915010000_chirp_tts.sql') {
    assert.equal(query(`select character_limit || ':' || reserved_characters || ':' || enabled || ':' || voice_tier
      from public.google_tts_budget_periods where starts_at = '2000-01-01'`), '999700:100:false:wavenet');
    query("delete from public.google_tts_budget_periods where starts_at = '2000-01-01'");
  }
}
for (const name of ['database_security.sql', 'reading_tts.sql', 'google_tts_budget.sql', 'tts_admission.sql']) {
  file(`supabase/tests/${name}`);
}

// Real concurrent PostgreSQL sessions must not oversubscribe the last 100 units.
const owner = '00000000-0000-4000-8000-000000000099';
query(`insert into auth.users(id,email) values ('${owner}','concurrency@example.test');
  update public.reading_tts_budget set lifetime_limit=1000000, daily_limit=1000000,
    user_daily_limit=1000000, credit_expires_at=clock_timestamp()+interval '1 day';
  insert into public.google_tts_budget_periods(starts_at,ends_at,outside_characters,reconciled_at,enabled)
    values (clock_timestamp()-interval '1 day',clock_timestamp()+interval '1 day',998900,clock_timestamp(),true)`);
const run = promisify(execFile);
const responses = await Promise.all(['a', 'b'].map(async (key) => {
  const result = await run('psql', [...args, '-At', '-c', `select public.reading_tts_reserve_google(
    '${owner}',repeat('${key}',64),60,repeat('c',64),gen_random_uuid(),60)->>'status'`], options);
  return result.stdout.trim();
}));
assert.deepEqual(responses.sort(), ['quota_exceeded', 'reserved']);
assert.equal(query('select reserved_characters from public.google_tts_budget_periods'), '60');
assert.equal(query('select lifetime_used from public.reading_tts_budget'), '60');
assert.equal(query('select count(*) from public.reading_tts_cache'), '1');

// Reapplying the idempotent cache migration must preserve live accounting.
file('supabase/migrations/20260913010000_reading_tts.sql');
assert.equal(query('select lifetime_used from public.reading_tts_budget'), '60');
assert.equal(query('select count(*) from public.reading_tts_cache'), '1');
console.log('Database upgrade, ACL/RLS, budget, cache and parallel reservation checks passed.');
console.log('Managed Supabase Storage HTTP, auth and provider playback remain separate acceptance gates.');
