'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSiteUrl } from '@/lib/server/site-url';
import { createClient } from '@/lib/supabase/server';

function getCredentials(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    return null;
  }

  return { email: email.trim(), password };
}

export async function login(formData: FormData) {
  const credentials = getCredentials(formData);
  if (!credentials) redirect('/login?error=Email and password are required');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  logAuthDebug('signInWithPassword result', {
    error: error ? { message: error.message, code: error.code, status: error.status } : null,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function signup(formData: FormData) {
  const credentials = getCredentials(formData);
  if (!credentials) redirect('/login?error=Email and password are required');

  const siteUrl = getSiteUrl();
  const emailRedirectTo = `${siteUrl}/auth/callback?next=/onboarding`;

  logAuthDebug('signup start', { siteUrl, emailRedirectTo });

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo,
    },
  });

  logAuthDebug('signUp result', {
    error: error ? { message: error.message, code: error.code, status: error.status } : null,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/', 'layout');
  redirect('/login?message=Check your email to confirm your account');
}

function logAuthDebug(label: string, data: Record<string, unknown>) {
  console.log(`[AUTH ACTIONS DEBUG] ${label}:`, JSON.stringify(data, null, 2));
}

export async function loginWithGoogle() {
  const siteUrl = getSiteUrl();
  const redirectTo = `${siteUrl}/auth/callback?next=/onboarding`;

  logAuthDebug('loginWithGoogle start', { siteUrl, redirectTo });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  logAuthDebug('signInWithOAuth result', {
    error: error ? { message: error.message, code: error.code, status: error.status } : null,
    url: data.url,
  });

  if (error || !data.url) {
    logAuthDebug('redirecting to login with error', { error: error?.message });
    redirect('/login?error=Could not start Google login');
  }

  logAuthDebug('redirecting to Google', { url: data.url });
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
