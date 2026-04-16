'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { staggerContainer } from '@/theme/animations';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { useMovieSearch }       from '@/hooks/useMovieSearch';
import { useMovies }            from '@/hooks/useMovies';
import { Input }                from '@/components/ui/Input';
import { Button }               from '@/components/ui/Button';
import { useToast }             from '@/components/ui/Toast';
import {
  SearchResultCard,
  SearchResultCardSkeleton,
}                               from '@/components/movies/SearchResultCard';
import type { TMDBMovie, MovieStatus } from '@/types';
import type { MarkAsWatchedParams }    from '@/components/movies/MarkAsWatchedModal';

const MarkAsWatchedModal = dynamic(
  () => import('@/components/movies/MarkAsWatchedModal').then(m => m.MarkAsWatchedModal),
  { ssr: false },
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuscaPage() {
  const router     = useRouter();
  const { showToast } = useToast();

  // ── Search state ─────────────────────────────────────────────────────────────
  const {
    query,
    setQuery,
    movies,
    isFetching,
    hasResults,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMovieSearch();

  // ── Existing movies (to mark as already added) ───────────────────────────────
  const { movies: existingMovies, addToWatchList, addToWatched, isAddingWatched } =
    useMovies();

  const existingMap = useMemo(() => {
    const map = new Map<number, MovieStatus>();
    for (const m of existingMovies) map.set(m.tmdb_id, m.status);
    return map;
  }, [existingMovies]);

  // ── "Para Assistir" loading state per-card ───────────────────────────────────
  const [watchingId, setWatchingId] = useState<number | null>(null);

  const handleAddToWatch = async (movie: TMDBMovie) => {
    setWatchingId(movie.id);
    try {
      await addToWatchList(movie);
      showToast('Filme adicionado à lista!', 'success');
      router.push('/para-assistir');
    } catch {
      showToast('Erro ao adicionar filme.', 'error');
    } finally {
      setWatchingId(null);
    }
  };

  // ── "Assistido" modal ────────────────────────────────────────────────────────
  const [pendingMovie, setPendingMovie] = useState<TMDBMovie | null>(null);

  const handleConfirmWatched = async (params: MarkAsWatchedParams) => {
    if (!pendingMovie) return;
    try {
      await addToWatched({ movie: pendingMovie, ...params });
      setPendingMovie(null);
      showToast('Filme marcado como assistido!', 'success');
      router.push('/assistidos');
    } catch {
      showToast('Erro ao adicionar filme.', 'error');
    }
  };

  // ── Derived view states ──────────────────────────────────────────────────────
  const trimmed      = query.trim();
  const showEmpty    = trimmed.length === 0;
  const showSkeleton = isFetching && !hasResults;
  const showNoResult = trimmed.length >= 2 && !isFetching && !hasResults;
  const showResults  = hasResults;

  return (
    <>
      <main className="min-h-screen bg-[#0A0A0A]">
        {/* ── Header + search bar ─────────────────────────────────────────────── */}
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 bg-[#0A0A0A]/95 backdrop-blur-sm px-4 pt-3 pb-3 border-b border-[#141414]">
          <Input
            variant="search"
            placeholder="Pesquisar filmes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* ── Content area ────────────────────────────────────────────────────── */}
        <div className="px-4 py-4">

          {/* Empty state — no query */}
          <AnimatePresence mode="wait">
            {showEmpty && (
              <m.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center justify-center gap-4 pt-20 text-center"
              >
                <Search size={56} className="text-[#2A2A2A]" aria-hidden="true" />
                <p className="text-[#6B7280] text-sm">
                  Pesquise um filme para começar
                </p>
              </m.div>
            )}

            {/* Skeleton — first fetch */}
            {showSkeleton && (
              <m.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3"
                aria-label="Carregando resultados"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <SearchResultCardSkeleton key={i} />
                ))}
              </m.div>
            )}

            {/* No results */}
            {showNoResult && (
              <m.p
                key="no-result"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center text-[#6B7280] text-sm mt-16"
              >
                Nenhum filme encontrado para{' '}
                <span className="text-[#9CA3AF] font-medium">&ldquo;{query}&rdquo;</span>
              </m.p>
            )}

            {/* Results */}
            {showResults && (
              <m.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3"
              >
                <m.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3"
                >
                  {movies.map((movie) => (
                    <SearchResultCard
                      key={movie.id}
                      movie={movie}
                      existingStatus={existingMap.get(movie.id) ?? null}
                      onAddToWatch={() => handleAddToWatch(movie)}
                      onAddToWatched={() => setPendingMovie(movie)}
                      isAddingWatch={watchingId === movie.id}
                      isAddingWatched={false}
                    />
                  ))}
                </m.div>

                {/* Load more */}
                {hasNextPage && (
                  <div className="flex justify-center pt-2 pb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      loading={isFetchingNextPage}
                    >
                      Carregar mais
                    </Button>
                  </div>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Watched modal ──────────────────────────────────────────────────────── */}
      <MarkAsWatchedModal
        visible={pendingMovie !== null}
        onClose={() => setPendingMovie(null)}
        onConfirm={handleConfirmWatched}
        loading={isAddingWatched}
        movieTitle={pendingMovie?.title}
      />
    </>
  );
}
