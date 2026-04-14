'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bookmark, Eye, Film } from 'lucide-react';

import { Button }   from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TMDBMovie, MovieStatus } from '@/types';
import { genreNames, posterUrl } from '@/lib/tmdb';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchResultCardProps {
  movie: TMDBMovie;
  /** null = not yet in the database */
  existingStatus: MovieStatus | null;
  onAddToWatch:    () => void;
  onAddToWatched:  () => void;
  isAddingWatch:   boolean;
  isAddingWatched: boolean;
  /** Used to stagger entrance animation. */
  index: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Transparent 1×1 PNG — next/image blur placeholder. The dark container bg
 *  shows through, giving the "gray placeholder" effect while the poster loads. */
const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const STATUS_BADGE: Record<MovieStatus, { label: string; className: string }> = {
  to_watch: {
    label: 'Na lista',
    className: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30',
  },
  watched: {
    label: 'Assistido',
    className: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30',
  },
};

const MAX_GENRES = 3;

// ─── Card ─────────────────────────────────────────────────────────────────────

export function SearchResultCard({
  movie,
  existingStatus,
  onAddToWatch,
  onAddToWatched,
  isAddingWatch,
  isAddingWatched,
  index,
}: SearchResultCardProps) {
  const poster = posterUrl(movie.poster_path, 'w185');
  const year   = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const genres = genreNames(movie.genre_ids).slice(0, MAX_GENRES);
  const isExisting = existingStatus !== null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.2, 0, 0, 1],
        delay: Math.min(index * 0.055, 0.35),
      }}
      className={[
        'flex rounded-2xl overflow-hidden',
        'bg-[#1A1A1A] dark:bg-[#1A1A1A]',
        'border border-[#2A2A2A]',
      ].join(' ')}
    >
      {/* ── Poster ──────────────────────────────────────────────────────────── */}
      <div className="relative w-[76px] shrink-0 self-stretch bg-[#2A2A2A]">
        {poster ? (
          <Image
            src={poster}
            alt={`Poster de ${movie.title}`}
            fill
            sizes="76px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film size={22} className="text-[#3F3F46]" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* ── Info ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 px-3 py-3 gap-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#F5F5F5] leading-snug line-clamp-2">
              {movie.title}
            </h3>
            {year && (
              <span className="text-xs text-[#6B7280] mt-0.5 block">{year}</span>
            )}
          </div>
          {/* Status badge */}
          {isExisting && (
            <span
              className={[
                'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                STATUS_BADGE[existingStatus].className,
              ].join(' ')}
            >
              {STATUS_BADGE[existingStatus].label}
            </span>
          )}
        </div>

        {/* Synopsis */}
        {movie.overview ? (
          <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-2">
            {movie.overview}
          </p>
        ) : null}

        {/* Genre chips */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <span
                key={g}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#9CA3AF]"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <Button
            variant="success"
            size="sm"
            onClick={onAddToWatch}
            loading={isAddingWatch}
            disabled={isExisting || isAddingWatch}
            className="flex-1 text-xs"
            aria-label="Adicionar à lista Para Assistir"
          >
            <Bookmark size={13} aria-hidden="true" />
            Para Assistir
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={onAddToWatched}
            loading={isAddingWatched}
            disabled={isExisting || isAddingWatched}
            className="flex-1 text-xs"
            aria-label="Marcar como assistido"
          >
            <Eye size={13} aria-hidden="true" />
            Assistido
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SearchResultCardSkeleton() {
  return (
    <div
      className="flex rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A]"
      aria-hidden="true"
    >
      {/* Poster placeholder */}
      <Skeleton variant="card" width="76px" height="140px" className="rounded-none shrink-0" />

      {/* Info placeholder */}
      <div className="flex flex-col flex-1 min-w-0 px-3 py-3 gap-2.5">
        <Skeleton variant="line" width="75%" height="14px" />
        <Skeleton variant="line" width="30%" height="11px" />
        <Skeleton variant="line" width="100%" height="11px" />
        <Skeleton variant="line" width="85%"  height="11px" />
        <div className="flex gap-1.5 mt-1">
          <Skeleton variant="line" width="50px" height="11px" />
          <Skeleton variant="line" width="44px" height="11px" />
        </div>
        <div className="flex gap-2 mt-auto pt-1">
          <Skeleton variant="card" height="36px" className="flex-1 rounded-xl" />
          <Skeleton variant="card" height="36px" className="flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
