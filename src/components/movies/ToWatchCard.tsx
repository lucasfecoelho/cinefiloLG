'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Movie } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToWatchCardProps {
  movie:   Movie;
  index:   number;
  onClick: () => void;
}

const MAX_GENRES = 3;

// ─── Card ─────────────────────────────────────────────────────────────────────

export function ToWatchCard({ movie, index, onClick }: ToWatchCardProps) {
  const genres = (movie.genres ?? []).slice(0, MAX_GENRES);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{
        duration: 0.26,
        ease: [0.2, 0, 0, 1],
        delay: Math.min(index * 0.045, 0.3),
      }}
      whileTap={{ scale: 0.97 }}
      className={[
        'w-full text-left',
        'flex items-center gap-3 px-4 py-3.5',
        'bg-[#1A1A1A] rounded-2xl',
        'border border-[#2A2A2A]',
        'active:bg-[#222222]',
        'transition-colors duration-100',
      ].join(' ')}
      aria-label={`Ver detalhes de ${movie.title}`}
    >
      {/* Text block */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F5F5F5] leading-snug truncate">
          {movie.title}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {movie.year && (
            <span className="text-xs text-[#6B7280]">{movie.year}</span>
          )}
          {genres.length > 0 && (
            <>
              {movie.year && (
                <span className="text-[#3F3F46] text-xs" aria-hidden="true">·</span>
              )}
              <span className="text-xs text-[#6B7280] truncate">
                {genres.join(', ')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight
        size={16}
        className="shrink-0 text-[#3F3F46]"
        aria-hidden="true"
      />
    </motion.button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ToWatchCardSkeleton() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]"
      aria-hidden="true"
    >
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton variant="line" width="65%" height="14px" />
        <Skeleton variant="line" width="40%" height="11px" />
      </div>
      <Skeleton variant="circle" width="16px" height="16px" />
    </div>
  );
}
