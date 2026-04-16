'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { m } from 'framer-motion';

import { staggerItem }             from '@/theme/animations';
import { usePrefetchMovieDetails } from '@/hooks/usePrefetchMovieDetails';
import { Film } from 'lucide-react';

import { Skeleton } from '@/components/ui/Skeleton';
import type { Movie } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToWatchCardProps {
  movie:   Movie;
  onClick: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUR_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const SYNOPSIS_CLAMP_THRESHOLD = 150;
const COLLAPSED_H = 68; // px — 3 lines of text-sm + leading-relaxed

// ─── Card ─────────────────────────────────────────────────────────────────────

export function ToWatchCard({ movie, onClick }: ToWatchCardProps) {
  const prefetch = usePrefetchMovieDetails();
  const genres   = (movie.genres ?? []).slice(0, 3).join(', ');
  const meta     = [movie.year, genres].filter(Boolean).join(' · ');
  const synopsis = movie.synopsis;

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
    <m.button
      type="button"
      onClick={onClick}
      onPointerEnter={() => prefetch(movie.tmdb_id)}
      layout
      variants={staggerItem}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.97 }}
      className={[
        'w-full text-left flex flex-col',
        'bg-[#1A1A1A] rounded-2xl overflow-hidden',
        'border border-[#2A2A2A]',
        'active:bg-[#1E1E1E] transition-colors duration-100',
      ].join(' ')}
      aria-label={`Ver detalhes de ${movie.title}`}
    >
      {/* ── Poster + info ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 p-3">

        {/* Poster */}
        <div className="relative w-27.5 sm:w-35 aspect-2/3 shrink-0 rounded-lg overflow-hidden bg-[#2A2A2A]">
          {movie.poster_url ? (
            <Image
              src={movie.poster_url}
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

          {/* Title */}
          <h3 className="text-base font-semibold text-[#F5F5F5] leading-snug line-clamp-3">
            {movie.title}
          </h3>

          {/* Year · genres */}
          {meta && (
            <p className="text-sm text-[#6B7280] leading-snug">{meta}</p>
          )}
        </div>
      </div>

      {/* ── Synopsis ────────────────────────────────────────────────────────── */}
      {synopsis && (
        <div className="px-3 pb-3">
          <m.div
            initial={false}
            animate={{ height: !clampNeeded || expanded ? 'auto' : COLLAPSED_H }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <p
              ref={synopsisRef}
              className="text-sm text-[#9CA3AF] leading-relaxed text-left"
            >
              {synopsis}
            </p>
          </m.div>
          {clampNeeded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="text-xs text-[#6B7280] hover:text-[#9CA3AF] mt-0.5 transition-colors duration-150"
            >
              {expanded ? 'ver menos ↑' : 'ver mais ↓'}
            </button>
          )}
        </div>
      )}
    </m.button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ToWatchCardSkeleton() {
  return (
    <div
      className="flex flex-col bg-[#1A1A1A] rounded-2xl overflow-hidden border border-[#2A2A2A]"
      aria-hidden="true"
    >
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
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <Skeleton variant="line" width="100%" height="12px" />
        <Skeleton variant="line" width="80%"  height="12px" />
        <Skeleton variant="line" width="60%"  height="12px" />
      </div>
    </div>
  );
}
