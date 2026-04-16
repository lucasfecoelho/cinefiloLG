import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getMovieDetails } from '@/lib/tmdb';
import { STALE_TMDB }      from '@/providers/QueryProvider';

// ─── Query key helper ─────────────────────────────────────────────────────────

export const tmdbMovieKey = (tmdbId: number) => ['tmdb-movie', tmdbId] as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns a stable callback that prefetches full TMDB movie details
 * (runtime, tagline, production info, etc.) into the React Query cache.
 *
 * Wire up to `onPointerEnter` / `onFocus` on any movie card so the detail
 * modal opens with the data already available.
 */
export function usePrefetchMovieDetails() {
  const queryClient = useQueryClient();

  return useCallback(
    (tmdbId: number) => {
      queryClient.prefetchQuery({
        queryKey: tmdbMovieKey(tmdbId),
        queryFn:  () => getMovieDetails(tmdbId),
        staleTime: STALE_TMDB,
      });
    },
    [queryClient],
  );
}
