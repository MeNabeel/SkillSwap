import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/requests',
    '/exchanges',
    '/messages',
    '/notifications',
    '/settings',
    '/ai-assistant',
    '/discover',
  ];

  const authPaths = ['/login', '/signup'];

  const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
  const isAuthPath = authPaths.some((prefix) => path === prefix);
  const isOnboardingPath = path === '/onboarding';

  // 1. Unauthenticated user attempting to access protected route or onboarding
  if (!user && (isProtectedPath || isOnboardingPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user attempting to access auth route (login/signup)
  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Authenticated user onboarding check
  if (user) {
    // Fetch user profile onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    const isOnboardingComplete = Boolean(profile && profile.onboarding_completed);

    // Incomplete profile accessing protected path -> redirect to /onboarding
    if (isProtectedPath && !isOnboardingComplete) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Complete profile accessing /onboarding -> redirect to /dashboard
    if (isOnboardingPath && isOnboardingComplete) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
