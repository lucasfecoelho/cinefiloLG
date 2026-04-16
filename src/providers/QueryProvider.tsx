'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// ─── Stale-time constants (shared with hooks) ─────────────────────────────────

/** User data (Supabase): lists, ratings, profiles — kept fresh for 5 min. */
export const STALE_USER  = 1000 * 60 * 5;

/** TMDB metadata (movie titles, posters, genres) — rarely changes, 24 h. */
export const STALE_TMDB  = 1000 * 60 * 60 * 24;

/** How long unused cache entries survive in memory before GC — 48 h. */
const GC_TIME = 1000 * 60 * 60 * 48;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry:               2,
            staleTime:           STALE_USER,
            gcTime:              GC_TIME,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
