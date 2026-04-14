import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Creates a Supabase client suitable for the proxy (middleware) context.
 * Returns a `getResponse()` getter that captures any cookie mutations made
 * by Supabase's session refresh, so the final response always carries
 * up-to-date session cookies.
 */
export function createProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagate cookie mutations to both the request and the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { client, getResponse: () => response };
}
