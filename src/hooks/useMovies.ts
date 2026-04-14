import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { genreNames, posterUrl } from '@/lib/tmdb';
import { Movie, MovieStatus, NotificationType, TMDBMovie } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

// ─── Query key factory ────────────────────────────────────────────────────────

const MOVIES_KEY = ['movies'] as const;
const moviesKey = (status?: MovieStatus | 'all') => [...MOVIES_KEY, status ?? 'all'];

// ─── Param types ──────────────────────────────────────────────────────────────

export interface AddToWatchedParams {
  movie: TMDBMovie;
  watchedDate: string; // ISO date string "YYYY-MM-DD"
  score?: number;      // 0–5 from StarRating; stored ×2 in DB (0–10)
  comment?: string;
}

export interface MoveToWatchedParams {
  movieId: string;
  watchedDate: string;
  score?: number;
  comment?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function tmdbMovieToRow(movie: TMDBMovie, userId: string, status: MovieStatus) {
  const year = movie.release_date
    ? parseInt(movie.release_date.slice(0, 4), 10)
    : null;
  return {
    tmdb_id: movie.id,
    title: movie.title,
    year,
    poster_url: posterUrl(movie.poster_path, 'w500'),
    synopsis: movie.overview || null,
    genres: genreNames(movie.genre_ids),
    status,
    suggested_by: userId,
  };
}

async function fetchOtherUserId(currentUserId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', currentUserId)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function createNotification(
  movieId: string,
  type: NotificationType,
  senderId: string,
  recipientId: string,
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('notifications').insert({
    recipient_id: recipientId,
    sender_id: senderId,
    movie_id: movieId,
    type,
    expires_at: expiresAt,
  });
  if (error) console.warn('[useMovies] notification error:', error.message);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMovies(status?: MovieStatus) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch "other user" once (2-person app — this never changes) ─────────────
  const otherUserQuery = useQuery({
    queryKey: ['profiles', 'other', user?.id],
    queryFn: () => fetchOtherUserId(user!.id),
    enabled: !!user,
    staleTime: Infinity,
  });
  const otherUserId = otherUserQuery.data ?? null;

  // ── Movies list ─────────────────────────────────────────────────────────────
  const moviesQuery = useQuery({
    queryKey: moviesKey(status),
    queryFn: async (): Promise<Movie[]> => {
      let q = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Movie[];
    },
    enabled: !!user,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: MOVIES_KEY });

  // ── addToWatchList ──────────────────────────────────────────────────────────
  const addToWatchListMutation = useMutation({
    mutationFn: async (tmdbMovie: TMDBMovie): Promise<Movie> => {
      if (!user) throw new Error('Not authenticated');

      const { data: movie, error } = await supabase
        .from('movies')
        .insert(tmdbMovieToRow(tmdbMovie, user.id, 'to_watch'))
        .select()
        .single();

      if (error) throw error;

      if (otherUserId) {
        await createNotification(movie.id, 'added_to_watch', user.id, otherUserId);
      }

      return movie as Movie;
    },
    onSuccess: invalidate,
  });

  // ── addToWatched ────────────────────────────────────────────────────────────
  const addToWatchedMutation = useMutation({
    mutationFn: async ({
      movie: tmdbMovie,
      watchedDate,
      score,
      comment,
    }: AddToWatchedParams): Promise<Movie> => {
      if (!user) throw new Error('Not authenticated');

      const { data: movie, error } = await supabase
        .from('movies')
        .insert({
          ...tmdbMovieToRow(tmdbMovie, user.id, 'watched'),
          watched_date: watchedDate,
        })
        .select()
        .single();

      if (error) throw error;

      if (score !== undefined && score > 0) {
        await supabase.from('ratings').insert({
          movie_id: movie.id,
          user_id: user.id,
          score: Math.round(score * 2), // 0-5 → 0-10 for half-star support
          comment: comment ?? null,
        });
      }

      if (otherUserId) {
        await createNotification(movie.id, 'added_watched', user.id, otherUserId);
      }

      return movie as Movie;
    },
    onSuccess: invalidate,
  });

  // ── moveToWatched ───────────────────────────────────────────────────────────
  const moveToWatchedMutation = useMutation({
    mutationFn: async ({
      movieId,
      watchedDate,
      score,
      comment,
    }: MoveToWatchedParams): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('movies')
        .update({ status: 'watched', watched_date: watchedDate })
        .eq('id', movieId);

      if (error) throw error;

      if (score !== undefined && score > 0) {
        await supabase.from('ratings').upsert(
          {
            movie_id: movieId,
            user_id: user.id,
            score: Math.round(score * 2),
            comment: comment ?? null,
          },
          { onConflict: 'movie_id,user_id' },
        );
      }

      if (otherUserId) {
        await createNotification(movieId, 'added_watched', user.id, otherUserId);
      }
    },
    onSuccess: invalidate,
  });

  // ── deleteMovie ─────────────────────────────────────────────────────────────
  const deleteMovieMutation = useMutation({
    mutationFn: async (movieId: string): Promise<void> => {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    // Data
    movies: moviesQuery.data ?? [],
    isLoading: moviesQuery.isLoading,
    error: moviesQuery.error,
    refetch: moviesQuery.refetch,

    // Mutations — expose mutateAsync for caller awaiting + isPending for UI
    addToWatchList: addToWatchListMutation.mutateAsync,
    isAddingToWatch: addToWatchListMutation.isPending,

    addToWatched: addToWatchedMutation.mutateAsync,
    isAddingWatched: addToWatchedMutation.isPending,

    moveToWatched: moveToWatchedMutation.mutateAsync,
    isMoving: moveToWatchedMutation.isPending,

    deleteMovie: deleteMovieMutation.mutateAsync,
    isDeleting: deleteMovieMutation.isPending,
  };
}
