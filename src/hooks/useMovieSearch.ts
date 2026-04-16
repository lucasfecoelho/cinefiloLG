import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { searchMovies } from '@/lib/tmdb';
import { TMDBMovie, TMDBSearchResponse } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseMovieSearchResult {
  query: string;
  setQuery: (q: string) => void;
  movies: TMDBMovie[];
  isFetching: boolean;
  isLoading: boolean;
  hasResults: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  error: Error | null;
  clear: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;

export function useMovieSearch(): UseMovieSearchResult {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // ── Debounce ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Infinite query ────────────────────────────────────────────────────────
  const infiniteQuery = useInfiniteQuery<
    TMDBSearchResponse,
    Error,
    { pages: TMDBSearchResponse[]; pageParams: number[] },
    ['tmdb-search', string],
    number
  >({
    queryKey: ['tmdb-search', debouncedQuery],
    queryFn: ({ pageParam }) => searchMovies(debouncedQuery, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    staleTime: 1000 * 60 * 60 * 24, // 24 h — TMDB metadata rarely changes
  });

  const movies = infiniteQuery.data?.pages.flatMap((p) => p.results) ?? [];

  const clear = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return {
    query,
    setQuery,
    movies,
    isFetching: infiniteQuery.isFetching,
    isLoading: infiniteQuery.isLoading,
    hasResults: movies.length > 0,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    error: infiniteQuery.error,
    clear,
  };
}
