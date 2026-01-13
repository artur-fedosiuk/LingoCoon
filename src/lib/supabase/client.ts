import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Error thrown when required Supabase environment variables are missing.
 */
class SupabaseConfigError extends Error {
  constructor(missingVar: string) {
    super(
      `Missing required environment variable: ${missingVar}\n\n` +
      `To fix this:\n` +
      `1. Copy .env.local.example to .env.local\n` +
      `2. Fill in your Supabase project values\n` +
      `3. Restart your development server\n\n` +
      `Get your values from: https://supabase.com/dashboard/project/_/settings/api`
    );
    this.name = 'SupabaseConfigError';
  }
}

/**
 * Validates that all required Supabase environment variables are present.
 * Throws a helpful error if any are missing.
 */
function validateEnvVars(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new SupabaseConfigError('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!anonKey) {
    throw new SupabaseConfigError('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}"\n` +
      `Expected format: https://your-project-ref.supabase.co`
    );
  }

  return { url, anonKey };
}

/**
 * Typed Supabase client with Database generics for full type safety.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Singleton Supabase client instance.
 * Lazy initialized on first access to ensure environment variables are available.
 */
let clientInstance: TypedSupabaseClient | null = null;

/**
 * Creates a singleton Supabase browser client for client-side usage.
 * 
 * The client is lazily initialized on first call and reused on subsequent calls.
 * This ensures we don't create multiple client instances which can cause issues
 * with authentication state and real-time subscriptions.
 * 
 * @returns Typed Supabase client instance
 * @throws {SupabaseConfigError} If required environment variables are missing
 * 
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/client';
 * import type { Profile } from '@/lib/supabase/types';
 * 
 * const supabase = createClient();
 * 
 * // Fully typed query
 * const { data, error } = await supabase
 *   .from('profiles')
 *   .select('*')
 *   .single();
 * 
 * // data is typed as Profile | null
 * ```
 */
export function createClient(): TypedSupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  const { url, anonKey } = validateEnvVars();

  clientInstance = createBrowserClient<Database>(url, anonKey);

  return clientInstance;
}

/**
 * Direct access to the singleton Supabase client.
 * This is a convenience export for simple usage patterns.
 * 
 * Note: This will throw if environment variables are not configured.
 * For more control over when the client is initialized, use createClient() instead.
 * 
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase/client';
 * 
 * const { data } = await supabase
 *   .from('profiles')
 *   .select('nickname, xp, streak')
 *   .eq('id', userId)
 *   .single();
 * ```
 */
export const supabase = new Proxy({} as TypedSupabaseClient, {
  get(_, prop) {
    const client = createClient();
    const value = client[prop as keyof TypedSupabaseClient];
    // Bind methods to the client instance
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Re-export types for convenient imports
 */
export type { Database } from './types';
export type {
  Profile,
  LearningProfile,
  OnboardingData,
  ProfileUpdate,
} from './types';
