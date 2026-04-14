import { NextResponse, type NextRequest } from 'next/server';
import { createProxyClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { client: supabase, getResponse } = createProxyClient(request);

  // Refresh the session — MUST happen before any redirect so cookies stay fresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith('/login');

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/para-assistir';
    return NextResponse.redirect(url);
  }

  return getResponse();
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
