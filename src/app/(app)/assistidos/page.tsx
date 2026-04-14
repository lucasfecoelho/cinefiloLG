'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Search, SlidersHorizontal, X } from 'lucide-react';

import { useWatchedMovies }  from '@/hooks/useWatchedMovies';
import { useProfiles }       from '@/hooks/useProfiles';
import { useAuth }           from '@/providers/AuthProvider';
import { Input }             from '@/components/ui/Input';
import { EmptyState }        from '@/components/ui/EmptyState';
import {
  WatchedCard,
  WatchedCardSkeleton,
}                            from '@/components/movies/WatchedCard';
import { WatchedDetailModal } from '@/components/movies/WatchedDetailModal';
import {
  FilterModal,
  DEFAULT_FILTER,
  isFilterActive,
}                            from '@/components/movies/FilterModal';
import type { MovieWithRatings } from '@/types';
import type { FilterState }      from '@/components/movies/FilterModal';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssistidosPage() {
  // ── Data ─────────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const { movies, isLoading, upsertRating, isSavingRating, deleteMovie, isDeleting } =
    useWatchedMovies();
  const { data: profiles = [] } = useProfiles();

  // ── Toolbar ──────────────────────────────────────────────────────────────────
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localSearch,    setLocalSearch]    = useState('');
  const [filterVisible,  setFilterVisible]  = useState(false);
  const [filter,         setFilter]         = useState<FilterState>(DEFAULT_FILTER);

  // ── Detail modal ─────────────────────────────────────────────────────────────
  const [selectedMovie, setSelectedMovie] = useState<MovieWithRatings | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentUserId = user?.id ?? '';

  /** Profiles sorted so the current user is always first. */
  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return 0;
      }),
    [profiles, currentUserId],
  );

  const partnerProfile = sortedProfiles.find((p) => p.id !== currentUserId) ?? null;

  const profilesMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p.display_name])),
    [profiles],
  );

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [movies]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => {
      if (m.watched_date) set.add(m.watched_date.slice(0, 7));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a)); // descending
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    // Local name search
    const q = localSearch.trim().toLowerCase();
    if (q) result = result.filter((m) => m.title.toLowerCase().includes(q));

    // Genre
    if (filter.genre) result = result.filter((m) => m.genres?.includes(filter.genre!));

    // Suggested by
    if (filter.suggestedBy) result = result.filter((m) => m.suggested_by === filter.suggestedBy);

    // Month
    if (filter.month) result = result.filter((m) => m.watched_date?.startsWith(filter.month!));

    // My score
    if (filter.myScore !== null) {
      result = result.filter((m) => {
        const myR = m.ratings.find((r) => r.user_id === currentUserId);
        return myR ? myR.score / 2 === filter.myScore : false;
      });
    }

    // Partner score
    if (filter.partnerScore !== null) {
      result = result.filter((m) => {
        const partnerR = m.ratings.find((r) => r.user_id !== currentUserId);
        return partnerR ? partnerR.score / 2 === filter.partnerScore : false;
      });
    }

    // Sort
    if (filter.sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
    else if (filter.sort === 'za') result.sort((a, b) => b.title.localeCompare(a.title, 'pt'));
    // 'recent' = server default (watched_date desc)

    return result;
  }, [movies, localSearch, filter, currentUserId]);

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
              {filterActive && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-(--color-primary) pointer-events-none"
                  aria-label="Filtro ativo"
                />
              )}
            </div>

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
              <motion.div
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="px-4 pb-8">

          {/* Skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <WatchedCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty — no watched movies yet */}
          {!isLoading && movies.length === 0 && (
            <EmptyState
              icon={<CheckCircle2 size={52} />}
              title="Nenhum filme assistido"
              description="Vocês ainda não assistiram nenhum filme juntos!"
            />
          )}

          {/* Empty — filters returned nothing */}
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
            <div className="flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {filteredMovies.map((movie, index) => (
                  <WatchedCard
                    key={movie.id}
                    movie={movie}
                    profiles={sortedProfiles}
                    index={index}
                    onClick={() => setSelectedMovie(movie)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      <WatchedDetailModal
        movie={selectedMovie}
        visible={selectedMovie !== null}
        onClose={() => setSelectedMovie(null)}
        suggestedByName={
          selectedMovie ? (profilesMap.get(selectedMovie.suggested_by) ?? null) : null
        }
        profiles={sortedProfiles}
        currentUserId={currentUserId}
        onSaveRating={upsertRating}
        isSavingRating={isSavingRating}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {/* ── Filter modal ──────────────────────────────────────────────────── */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        value={filter}
        onChange={setFilter}
        availableGenres={availableGenres}
        profiles={profiles}
        availableMonths={availableMonths}
        myScoreLabel="Minha avaliação"
        partnerScoreLabel={
          partnerProfile ? `Avaliação de ${partnerProfile.display_name}` : 'Avaliação do parceiro'
        }
      />
    </>
  );
}
