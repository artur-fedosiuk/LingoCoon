import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/server/site-url';
import { createClient } from '@/lib/supabase/server';

const INTERNAL_URL_BASE = 'http://localhost';

function getSafeRedirectPath(value: string | null) {
  if (!value) return '/onboarding';

  try {
    const redirectUrl = new URL(value, INTERNAL_URL_BASE);
    if (redirectUrl.origin !== INTERNAL_URL_BASE) return '/onboarding';

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return '/onboarding';
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const token = searchParams.get('token');
  const type = searchParams.get('type') as EmailOtpType | null;
  const email = searchParams.get('email');
  const next = getSafeRedirectPath(searchParams.get('next'));

  const siteUrl = getSiteUrl(origin);

  const errorParam = searchParams.get('error_description') || searchParams.get('error');
  if (errorParam) {
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_error`);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[AUTH CALLBACK ERROR] exchangeCodeForSession', { code: error.code, status: error.status });
    } else {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error('[AUTH CALLBACK ERROR] verifyOtp (token_hash)', { code: error.code, status: error.status });
    } else {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  if (token && type && email) {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error) {
      console.error('[AUTH CALLBACK ERROR] verifyOtp (token)', { code: error.code, status: error.status });
    } else {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=invalid_token`);
}
