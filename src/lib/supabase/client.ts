import { createBrowserClient } from '@supabase/ssr';

// || instead of ?? because .env.local sets empty strings (not undefined).
// Placeholder values let module evaluation succeed during build-time SSR
// of static pages (/_not-found). Real requests require env vars to be set.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL    || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
);
