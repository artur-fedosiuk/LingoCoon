// File: src/middleware.ts  (was: src/proxy.ts)
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Next.js middleware — runs on the server before EVERY page request.
//              Checks if the user is logged in and redirects them if needed.
//              MUST be named "middleware.ts" and export a function called "middleware"
//              for Next.js to recognise it automatically.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

// ─── MIDDLEWARE FUNCTION ──────────────────────────────────────────────────────

/**
 * middleware — the Next.js edge function that guards every route.
 *
 * How it works:
 * 1. Creates a Supabase client that reads the session from the request cookies.
 * 2. Calls getUser() to verify the session cryptographically.
 * 3. If the user is not logged in and tries to visit a protected page → redirect to /login.
 * 4. If the user IS logged in and visits /login → redirect to /dashboard (already logged in).
 * 5. Otherwise, let the request through normally.
 *
 * This MUST be the default export named "middleware" — Next.js looks for this
 * exact name in middleware.ts at the root of /src.
 */
export async function middleware(request: NextRequest) {

  // Start with a "pass through" response — we will override it only if we need to redirect.
  let supabaseResponse = NextResponse.next({ request });

  // Create the Supabase server client for the Edge runtime.
  // The Edge runtime cannot use Node.js APIs, so we use the lightweight SSR client.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read ALL cookies from the incoming request.
        getAll() {
          return request.cookies.getAll();
        },
        // Write cookies onto both the request and the response.
        // This keeps the Supabase session alive without the user having to log in again.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response with the updated cookies attached.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT add any code between createServerClient and getUser().
  // Supabase requires these two calls to be adjacent to correctly refresh sessions.
  const { data: { user } } = await supabase.auth.getUser();

  // ── Route classification ────────────────────────────────────────────────

  // Public routes: pages that anyone can visit without logging in.
  const isPublicRoute =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/api/');

  // ── Redirect logic ──────────────────────────────────────────────────────

  // Case 1: Not logged in + trying to visit a protected page → go to login.
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Case 2: Already logged in + visiting /login → go to dashboard (skip login).
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Case 3: Everything else — let the request continue normally.
  return supabaseResponse;
}

// ─── MATCHER CONFIG ────────────────────────────────────────────────────────────

/**
 * config.matcher tells Next.js which paths this middleware should run on.
 * We skip static files (_next/static), images, and favicon to avoid unnecessary overhead.
 * The regex below matches every path EXCEPT those listed.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
