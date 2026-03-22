// src/lib/supabase/client.ts
// Creates the Supabase client for use in the browser (client-side).
// Each call to createClient() returns the same cached instance.

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// createBrowserClient creates a Supabase connection that works in the browser.
// It reads the URL and key from environment variables.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Re-export common types so other files can import them from one place
export type { Database } from './types';
export type { Profile, OnboardingData } from './types';
