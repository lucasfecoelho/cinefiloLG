import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { MovieWithRatings, Rating } from '@/types';

// ─── Query key ────────────────────────────────────────────────────────────────

export const WATCHED_QUERY_KEY = ['movies', 'watched', 'with-ratings'] as const;

// ─── Param types ──────────────────────────────────────────────────────────────

export interface UpsertRatingParams {
  movieId: string;
  score: number;    // 0–5 display scale; stored ×2 (0–10) in DB
  comment?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWatchedMovies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch movies + all ratings in one shot ──────────────────────────────────
  const moviesQuery = useQuery({
    queryKey: WATCHED_QUERY_KEY,
    queryFn: async (): Promise<MovieWithRatings[]> => {
      const [{ data: movies, error: moviesErr }, { data: ratings, error: ratingsErr }] =
        await Promise.all([
          supabase
            .from('movies')
            .select('*')
            .eq('status', 'watched')
            .order('watched_date', { ascending: false }),
          supabase.from('ratings').select('*'),
        ]);

      if (moviesErr) throw moviesErr;
      if (ratingsErr) throw ratingsErr;

      // Group ratings by movie_id for O(1) lookup
      const byMovieId = new Map<string, Rating[]>();
      (ratings ?? []).forEach((r) => {
        const list = byMovieId.get(r.movie_id) ?? [];
        list.push(r as Rating);
        byMovieId.set(r.movie_id, list);
      });

      return (movies ?? []).map((m) => {
        const movieRatings = byMovieId.get(m.id) ?? [];
        return {
          ...m,
          ratings: movieRatings,
          my_rating: movieRatings.find((r) => r.user_id === user?.id),
        } as MovieWithRatings;
      });
    },
    enabled: !!user,
  });

  // ── Upsert rating ───────────────────────────────────────────────────────────
  const upsertRatingMutation = useMutation({
    mutationFn: async ({ movieId, score, comment }: UpsertRatingParams) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('ratings').upsert(
        {
          movie_id: movieId,
          user_id: user.id,
          score: Math.round(score * 2), // 0–5 → 0–10
          comment: comment?.trim() || null,
        },
        { onConflict: 'movie_id,user_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WATCHED_QUERY_KEY }),
  });

  // ── Delete movie ────────────────────────────────────────────────────────────
  const deleteMovieMutation = useMutation({
    mutationFn: async (movieId: string) => {
      const { error } = await supabase.from('movies').delete().eq('id', movieId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHED_QUERY_KEY });
      // Keep global movies cache consistent (to-watch screen existingMovies map)
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });

  return {
    movies: moviesQuery.data ?? [],
    isLoading: moviesQuery.isLoading,
    refetch: moviesQuery.refetch,
    upsertRating: upsertRatingMutation.mutateAsync,
    isSavingRating: upsertRatingMutation.isPending,
    deleteMovie: deleteMovieMutation.mutateAsync,
    isDeleting: deleteMovieMutation.isPending,
  };
}
