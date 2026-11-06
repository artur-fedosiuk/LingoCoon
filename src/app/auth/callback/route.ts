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

function logAuthDebug(label: string, data: Record<string, unknown>) {
  console.log(`[AUTH CALLBACK DEBUG] ${label}:`, JSON.stringify(data, null, 2));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const token = searchParams.get('token');
  const type = searchParams.get('type') as EmailOtpType | null;
  const email = searchParams.get('email');
  const next = getSafeRedirectPath(searchParams.get('next'));

  // DEBUG: Log all incoming params and computed values
  logAuthDebug('incoming request', {
    origin,
    host: new URL(request.url).host,
    pathname: new URL(request.url).pathname,
    searchParams: Object.fromEntries(searchParams.entries()),
    code: !!code,
    token_hash: !!token_hash,
    token: !!token,
    type,
    email,
    next,
  });

  const siteUrl = getSiteUrl(origin);
  logAuthDebug('siteUrl computed', { siteUrl, origin });

  const errorParam = searchParams.get('error_description') || searchParams.get('error');
  if (errorParam) {
    logAuthDebug('oauth error from provider', { errorParam });
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(errorParam)}`);
  }

  const supabase = await createClient();

  if (code) {
    logAuthDebug('exchanging code for session', { codePrefix: code?.slice(0, 10) });
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    logAuthDebug('exchangeCodeForSession result', {
      error: error ? { message: error.message, code: error.code, status: error.status } : null,
      session: data.session ? { user: data.session.user?.id, expiresAt: data.session.expires_at } : null,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });

    if (!error) {
      logAuthDebug('redirecting after success', { redirectTo: `${siteUrl}${next}` });
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  if (token_hash && type) {
    logAuthDebug('verifying OTP (token_hash)', { type, tokenHashPrefix: token_hash?.slice(0, 10) });
    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    logAuthDebug('verifyOtp result', {
      error: error ? { message: error.message, code: error.code, status: error.status } : null,
      session: data.session ? { user: data.session.user?.id } : null,
    });

    if (!error) {
      logAuthDebug('redirecting after OTP success', { redirectTo: `${siteUrl}${next}` });
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  if (token && type && email) {
    logAuthDebug('verifying OTP (token)', { type, email });
    const { error, data } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    logAuthDebug('verifyOtp result', {
      error: error ? { message: error.message, code: error.code, status: error.status } : null,
      session: data.session ? { user: data.session.user?.id } : null,
    });

    if (!error) {
      logAuthDebug('redirecting after OTP success', { redirectTo: `${siteUrl}${next}` });
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  logAuthDebug('all auth methods failed, redirecting to login', { siteUrl });
  return NextResponse.redirect(`${siteUrl}/login?error=Could not authenticate user`);
}
