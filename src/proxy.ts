// proxy.ts
// This file runs before every page request.
// It checks if the user is logged in and redirects them if needed.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Important: do not add any code between createServerClient and getUser.
    // If you do, users might get randomly logged out.
    const { data: { user } } = await supabase.auth.getUser()

    // These are the pages that anyone can visit, even without logging in
    const isPublicRoute =
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/auth/callback') ||
        request.nextUrl.pathname.startsWith('/api/');

    // If the user is not logged in and tries to visit a private page, send them to login
    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If the user is already logged in and goes to /login, send them to the dashboard instead
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
}

// Tell Next.js which paths this proxy should run on.
// We skip static files and images since they don't need auth checks.
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
