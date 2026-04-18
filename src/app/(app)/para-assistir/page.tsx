'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { staggerContainer } from '@/theme/animations';
import { Bookmark, Dices, Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { useMovies }              from '@/hooks/useMovies';
import { useProfiles }            from '@/hooks/useProfiles';
import { Input }                  from '@/components/ui/Input';
import { EmptyState }             from '@/components/ui/EmptyState';
import { useToast }               from '@/components/ui/Toast';
import { ModalSkeleton }          from '@/components/ui/ModalSkeleton';
import { ToWatchCard, ToWatchCardSkeleton } from '@/components/movies/ToWatchCard';
import { DEFAULT_FILTER, isFilterActive } from '@/components/movies/FilterModal';
import type { Movie }             from '@/types';
import type { FilterState }       from '@/components/movies/FilterModal';
import type { MarkAsWatchedParams } from '@/components/movies/MarkAsWatchedModal';

const ToWatchDetailModal = dynamic(
  () => import('@/components/movies/ToWatchDetailModal').then(m => m.ToWatchDetailModal),
  { ssr: false, loading: () => <ModalSkeleton /> },
);

const FilterModal = dynamic(
  () => import('@/components/movies/FilterModal').then(m => m.FilterModal),
  { ssr: false },
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParaAssistirPage() {
  const router        = useRouter();
  const { showToast } = useToast();

  // ── Data ─────────────────────────────────────────────────────────────────────
  const {
    movies,
    isLoading,
    moveToWatched,
    isMoving,
    deleteMovie,
    isDeleting,
  } = useMovies('to_watch');

  const { data: profiles = [] } = useProfiles();

  // ── Toolbar state ────────────────────────────────────────────────────────────
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localSearch,    setLocalSearch]    = useState('');
  const [filterVisible,  setFilterVisible]  = useState(false);
  const [filter,         setFilter]         = useState<FilterState>(DEFAULT_FILTER);

  // ── Detail modal state ───────────────────────────────────────────────────────
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const profilesMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p.display_name])),
    [profiles],
  );

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    // Local name search
    const q = localSearch.trim().toLowerCase();
    if (q) result = result.filter((m) => m.title.toLowerCase().includes(q));

    // Genre filter
    if (filter.genre) result = result.filter((m) => m.genres?.includes(filter.genre!));

    // Suggested by filter
    if (filter.suggestedBy) result = result.filter((m) => m.suggested_by === filter.suggestedBy);

    // Sort (server returns 'recent' by default)
    if (filter.sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
    else if (filter.sort === 'za') result.sort((a, b) => b.title.localeCompare(a.title, 'pt'));

    return result;
  }, [movies, localSearch, filter]);

  const filterActive = isFilterActive(filter);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSearchToggle = () => {
    if (searchExpanded) {
      setLocalSearch('');
      setSearchExpanded(false);
    } else {
      setSearchExpanded(true);
    }
  };

  const handleRandomPick = () => {
    if (filteredMovies.length === 0) return;
    const idx = Math.floor(Math.random() * filteredMovies.length);
    setSelectedMovie(filteredMovies[idx]);
  };

  const handleMoveToWatched = async (params: MarkAsWatchedParams) => {
    if (!selectedMovie) return;
    try {
      await moveToWatched({
        movieId:     selectedMovie.id,
        watchedDate: params.watchedDate,
        score:       params.score > 0 ? params.score : undefined,
        comment:     params.comment.trim() || undefined,
      });
      setSelectedMovie(null);
      showToast('Filme marcado como assistido!', 'success');
      router.push('/assistidos');
    } catch {
      showToast('Erro ao mover filme.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedMovie) return;
    await deleteMovie(selectedMovie.id);
    setSelectedMovie(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="min-h-screen bg-[#0A0A0A]">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-3">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            {/* Search toggle */}
            <button
              type="button"
              onClick={handleSearchToggle}
              aria-label={searchExpanded ? 'Fechar busca' : 'Buscar na lista'}
              className={[
                'p-2 rounded-xl transition-colors duration-150',
                searchExpanded
                  ? 'bg-(--color-primary-subtle) text-(--color-primary)'
                  : 'text-[#6B7280] hover:text-[#9CA3AF]',
              ].join(' ')}
            >
              {searchExpanded
                ? <X size={18} aria-hidden="true" />
                : <Search size={18} aria-hidden="true" />}
            </button>

            {/* Filter toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterVisible(true)}
                aria-label="Abrir filtros"
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#9CA3AF] transition-colors duration-150"
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
              </button>
              {/* Active filter dot */}
              {filterActive && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-(--color-primary) pointer-events-none"
                  aria-label="Filtro ativo"
                />
              )}
            </div>

            {/* Random pick */}
            {!isLoading && filteredMovies.length > 0 && (
              <button
                type="button"
                onClick={handleRandomPick}
                aria-label="Escolher filme aleatório"
                title="Escolher aleatório"
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#9CA3AF] transition-colors duration-150"
              >
                <Dices size={18} aria-hidden="true" />
              </button>
            )}

            {/* Count */}
            {!isLoading && (
              <span className="ml-auto text-xs text-[#6B7280]">
                {filteredMovies.length}{' '}
                {filteredMovies.length === 1 ? 'filme' : 'filmes'}
              </span>
            )}
          </div>

          {/* Expandable search input */}
          <AnimatePresence>
            {searchExpanded && (
              <m.div
                key="search-input"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <Input
                    variant="search"
                    placeholder="Filtrar por nome..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="px-4 pb-8">

          {/* Skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <ToWatchCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state — no movies at all */}
          {!isLoading && movies.length === 0 && (
            <EmptyState
              icon={<Bookmark size={52} />}
              title="Nenhum filme na lista"
              description="Vá na aba Busca para adicionar filmes!"
            />
          )}

          {/* Empty state — search/filter returned nothing */}
          {!isLoading && movies.length > 0 && filteredMovies.length === 0 && (
            <EmptyState
              icon={<Search size={52} />}
              title="Nenhum resultado"
              description={
                localSearch.trim()
                  ? `Nenhum filme corresponde a "${localSearch}"`
                  : 'Nenhum filme corresponde aos filtros aplicados.'
              }
            />
          )}

          {/* Cards */}
          {!isLoading && filteredMovies.length > 0 && (
            <m.div
              className="flex flex-col gap-2.5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence initial={false}>
                {filteredMovies.map((movie) => (
                  <ToWatchCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </AnimatePresence>
            </m.div>
          )}
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      <ToWatchDetailModal
        movie={selectedMovie}
        visible={selectedMovie !== null}
        onClose={() => setSelectedMovie(null)}
        suggestedByName={
          selectedMovie ? (profilesMap.get(selectedMovie.suggested_by) ?? null) : null
        }
        onMoveToWatched={handleMoveToWatched}
        isMoving={isMoving}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        value={filter}
        onChange={setFilter}
        availableGenres={availableGenres}
        profiles={profiles}
      />
    </>
  );
}
