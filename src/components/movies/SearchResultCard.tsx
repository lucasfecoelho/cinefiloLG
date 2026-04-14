'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bookmark, Eye, Film } from 'lucide-react';

import { Button }   from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TMDBMovie, MovieStatus } from '@/types';
import { genreNames, posterUrl } from '@/lib/tmdb';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchResultCardProps {
  movie:           TMDBMovie;
  /** null = not yet in the database */
  existingStatus:  MovieStatus | null;
  onAddToWatch:    () => void;
  onAddToWatched:  () => void;
  isAddingWatch:   boolean;
  isAddingWatched: boolean;
  /** Used to stagger entrance animation. */
  index:           number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Transparent 1 × 1 PNG — shows the dark container bg while the poster loads. */
const BLUR_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const STATUS_BADGE: Record<MovieStatus, { label: string; className: string }> = {
  to_watch: {
    label:     'Na lista',
    className: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30',
  },
  watched: {
    label:     'Assistido',
    className: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30',
  },
};

/**
 * Characters threshold above which we assume the synopsis needs clamping.
 * Used to set the initial `clampNeeded` state before layout is measured,
 * preventing a visible flash-and-collapse for long texts.
 */
const SYNOPSIS_CLAMP_THRESHOLD = 150;

/** Collapsed height: 3 lines of text-sm (14 px) at leading-relaxed (1.625). */
const COLLAPSED_H = 68;

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
  const src      = posterUrl(movie.poster_path, 'w342');
  const year     = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const genres   = genreNames(movie.genre_ids).slice(0, 3).join(', ');
  const meta     = [year, genres].filter(Boolean).join(' · ');
  const synopsis = movie.overview || null;
  const isExisting = existingStatus !== null;

  // ── Synopsis expand ───────────────────────────────────────────────────────
  const synopsisRef  = useRef<HTMLParagraphElement>(null);
  const [clampNeeded, setClampNeeded] = useState(
    (synopsis?.length ?? 0) > SYNOPSIS_CLAMP_THRESHOLD,
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = synopsisRef.current;
    if (el) setClampNeeded(el.scrollHeight > el.clientHeight + 1);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease:     [0.2, 0, 0, 1],
        delay:    Math.min(index * 0.055, 0.35),
      }}
      className="flex flex-col rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A]"
    >
      {/* ── Poster + info ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 p-3">

        {/* Poster — 2:3 aspect, responsive width */}
        <div className="relative w-27.5 sm:w-35 aspect-2/3 shrink-0 rounded-lg overflow-hidden bg-[#2A2A2A]">
          {src ? (
            <Image
              src={src}
              alt={`Poster de ${movie.title}`}
              fill
              sizes="(min-width: 640px) 140px, 110px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_1X1}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film size={28} className="text-[#3F3F46]" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex flex-col flex-1 min-w-0 gap-1 py-0.5">

          {/* Title + status badge */}
          <div className="flex items-start gap-2">
            <h3 className="text-base font-semibold text-[#F5F5F5] leading-snug line-clamp-3 flex-1 min-w-0">
              {movie.title}
            </h3>
            {isExisting && (
              <span
                className={[
                  'shrink-0 text-[10px] font-semibold px-2 py-0.5',
                  'rounded-full whitespace-nowrap mt-0.5',
                  STATUS_BADGE[existingStatus].className,
                ].join(' ')}
              >
                {STATUS_BADGE[existingStatus].label}
              </span>
            )}
          </div>

          {/* Year · genres */}
          {meta && (
            <p className="text-sm text-[#6B7280] leading-snug">{meta}</p>
          )}
        </div>
      </div>

      {/* ── Synopsis ────────────────────────────────────────────────────────── */}
      {synopsis && (
        <div className="px-3 pb-1">
          <motion.div
            initial={false}
            animate={{ height: !clampNeeded || expanded ? 'auto' : COLLAPSED_H }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <p
              ref={synopsisRef}
              className="text-sm text-[#9CA3AF] leading-relaxed"
            >
              {synopsis}
            </p>
          </motion.div>
          {clampNeeded && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-[#6B7280] hover:text-[#9CA3AF] mt-0.5 transition-colors duration-150"
            >
              {expanded ? 'ver menos ↑' : 'ver mais ↓'}
            </button>
          )}
        </div>
      )}

      {/* ── Action buttons ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-3 pt-2">
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
    </motion.article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SearchResultCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A]"
      aria-hidden="true"
    >
      {/* Top row */}
      <div className="flex gap-3 p-3">
        <Skeleton
          variant="card"
          className="w-27.5 sm:w-35 aspect-2/3 rounded-lg shrink-0"
        />
        <div className="flex flex-col flex-1 gap-2 py-1">
          <Skeleton variant="line" width="85%" height="16px" />
          <Skeleton variant="line" width="55%" height="14px" />
          <Skeleton variant="line" width="40%" height="12px" />
        </div>
      </div>
      {/* Synopsis */}
      <div className="px-3 pb-1 flex flex-col gap-1.5">
        <Skeleton variant="line" width="100%" height="12px" />
        <Skeleton variant="line" width="90%"  height="12px" />
        <Skeleton variant="line" width="70%"  height="12px" />
      </div>
      {/* Buttons */}
      <div className="flex gap-2 p-3 pt-2">
        <Skeleton variant="card" height="36px" className="flex-1 rounded-xl" />
        <Skeleton variant="card" height="36px" className="flex-1 rounded-xl" />
      </div>
    </div>
  );
}
