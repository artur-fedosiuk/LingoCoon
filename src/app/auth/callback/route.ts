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
  const next = getSafeRedirectPath(searchParams.get('next'));
  const siteUrl = getSiteUrl(origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=Could not authenticate user`);
}
