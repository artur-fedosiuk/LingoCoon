// Description: Next.js 16 proxy — runs BEFORE every page request on the server.
//              Checks if the user is logged in and redirects accordingly.
//              Next.js 16 renamed "middleware" to "proxy". The function must be
//              exported as "proxy" and the file must be named "proxy.ts".

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

/**
 * proxy — called automatically by Next.js before every page request.
 *
 * What it does, step by step:
 * 1. Creates a Supabase client that reads the session from HTTP-only cookies.
 * 2. Calls getUser() to verify the session token cryptographically.
 * 3. If the user is NOT logged in and tries to open a protected page → redirect to /login.
 * 4. If the user IS logged in and opens /login → redirect to /dashboard (already in).
 * 5. Otherwise → let the request through normally.
 */
export async function proxy(request: NextRequest) {
  // Start with a "pass through" response.
  // We only change this if we need to redirect.
  let supabaseResponse = NextResponse.next({ request });

  // Create a Supabase client that works in the Edge runtime.
  // Edge runtime is a lightweight server environment — it cannot use Node.js APIs.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read all cookies from the incoming request.
        getAll() {
          return request.cookies.getAll();
        },
        // Write cookies to both the request and the response.
        // This keeps the Supabase session alive so the user stays logged in.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // DO NOT add any code between createServerClient and getUser().
  // Supabase requires these two calls to be adjacent to refresh sessions correctly.
  const { data: { user } } = await supabase.auth.getUser();

  // ── Classify the requested route ─────────────────────────────────────────

  // Public routes can be visited WITHOUT being logged in.
  const isPublicRoute =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/api/');

  // ── Redirect logic ────────────────────────────────────────────────────────

  // Not logged in + trying to open a protected page → send to login.
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already logged in + opening /login → skip to dashboard.
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Everything else → continue normally.
  return supabaseResponse;
}

// ─── MATCHER ─────────────────────────────────────────────────────────────────

/**
 * config.matcher tells Next.js which paths this proxy should run on.
 * We skip static files and images — they don't need authentication checks.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
