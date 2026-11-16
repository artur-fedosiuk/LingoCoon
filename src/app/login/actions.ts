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
  if (!credentials) redirect('/login?error=fill_all_fields');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    console.error('[AUTH ACTIONS ERROR] signInWithPassword', { code: error.code, status: error.status });
    redirect(`/login?error=${error.code ?? 'unknown'}`);
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function signup(formData: FormData) {
  const credentials = getCredentials(formData);
  if (!credentials) redirect('/login?error=fill_all_fields');

  const siteUrl = getSiteUrl();
  const emailRedirectTo = `${siteUrl}/auth/callback?next=/onboarding`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    console.error('[AUTH ACTIONS ERROR] signUp', { code: error.code, status: error.status });
    redirect(`/login?error=${error.code ?? 'unknown'}`);
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=email_confirmation_sent');
}

export async function loginWithGoogle() {
  const siteUrl = getSiteUrl();
  const redirectTo = `${siteUrl}/auth/callback?next=/onboarding`;

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

  if (error || !data.url) {
    if (error) {
      console.error('[AUTH ACTIONS ERROR] signInWithOAuth', { code: error.code, status: error.status });
    }
    redirect('/login?error=oauth_error');
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
