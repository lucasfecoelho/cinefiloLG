import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { MovieWithRatings, Rating } from '@/types';

// ─── Query key ────────────────────────────────────────────────────────────────

export const WATCHED_QUERY_KEY = ['movies', 'watched', 'with-ratings'] as const;

// ─── Param types ──────────────────────────────────────────────────────────────

export interface UpsertRatingParams {
  movieId: string;
  score: number;    // 0–5 display scale (0 = remove rating)
  comment?: string;
}

// ─── Internal adapter ─────────────────────────────────────────────────────────

// DB stores `rating` DECIMAL(2,1) in the 0.5–5.0 range.
// The UI expects `score` as an integer 0–10 (reads `score / 2` to display).
// These two functions bridge that gap inside the data layer.

// DB row → Rating shape expected by the UI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRating(r: Record<string, any>): Rating {
  return {
    id:         r.id,
    movie_id:   r.movie_id,
    user_id:    r.user_id,
    score:      Math.round((r.rating as number) * 2), // 3.5 → 7
    comment:    r.comment ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWatchedMovies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch movies + all ratings in one shot ──────────────────────────────────
  const moviesQuery = useQuery({
    queryKey: WATCHED_QUERY_KEY,
    queryFn: async (): Promise<MovieWithRatings[]> => {
      const [moviesResult, ratingsResult] = await Promise.all([
        supabase
          .from('movies')
          .select('*')
          .eq('status', 'watched')
          .order('watched_date', { ascending: false }),
        supabase.from('movie_ratings').select('*'),
      ]);

      // Movies are mandatory — fail fast if they can't be loaded.
      if (moviesResult.error) throw moviesResult.error;

      // Ratings are supplementary: if the table is missing (migration not yet
      // applied) or any other error occurs, log it but still return the movies.
      if (ratingsResult.error) {
        console.error(
          '[useWatchedMovies] movie_ratings query failed:',
          ratingsResult.error.message,
          '| code:', ratingsResult.error.code,
          '\n→ Se a tabela não existir, aplique a migration 20260414_movie_ratings.sql no Supabase Dashboard.',
        );
      }

      const movies  = moviesResult.data  ?? [];
      const ratings = ratingsResult.data ?? [];

      // Group ratings by movie_id for O(1) lookup
      const byMovieId = new Map<string, Rating[]>();
      (ratings).forEach((r) => {
        const adapted = rowToRating(r);
        const list = byMovieId.get(r.movie_id) ?? [];
        list.push(adapted);
        byMovieId.set(r.movie_id, list);
      });

      return (movies).map((m) => {
        const movieRatings = byMovieId.get(m.id) ?? [];
        const scored       = movieRatings.filter((r) => r.score > 0);
        const avgRating    = scored.length === 0
          ? null
          : Math.round((scored.reduce((s, r) => s + r.score / 2, 0) / scored.length) * 2) / 2;
        return {
          ...m,
          ratings:       movieRatings,
          my_rating:     movieRatings.find((r) => r.user_id === user?.id),
          avg_rating:    avgRating,
          total_ratings: scored.length,
        } as MovieWithRatings;
      });
    },
    enabled: !!user,
  });

  // ── Upsert rating ───────────────────────────────────────────────────────────
  const upsertRatingMutation = useMutation({
    mutationFn: async ({ movieId, score, comment }: UpsertRatingParams) => {
      if (!user) throw new Error('Not authenticated');

      if (score === 0) {
        // score=0 means "no rating" — remove the existing row if present
        const { error } = await supabase
          .from('movie_ratings')
          .delete()
          .eq('movie_id', movieId)
          .eq('user_id', user.id);
        if (error) throw error;
        return;
      }

      // score is the 0–5 display value; store directly as DECIMAL(2,1)
      const { error } = await supabase.from('movie_ratings').upsert(
        {
          movie_id: movieId,
          user_id:  user.id,
          rating:   score,
          comment:  comment?.trim() || null,
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
    movies:         moviesQuery.data ?? [],
    isLoading:      moviesQuery.isLoading,
    refetch:        moviesQuery.refetch,
    upsertRating:   upsertRatingMutation.mutateAsync,
    isSavingRating: upsertRatingMutation.isPending,
    deleteMovie:    deleteMovieMutation.mutateAsync,
    isDeleting:     deleteMovieMutation.isPending,
  };
}
