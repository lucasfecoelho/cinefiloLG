'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { MovieWithRatings, Profile, Rating } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchedCardProps {
  movie:    MovieWithRatings;
  profiles: Profile[];
  index:    number;
  onClick:  () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" → "DD/MM/AAAA" */
function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Returns Unicode star string for a DB score (0-10). */
function starsText(dbScore: number): string {
  const display = dbScore / 2; // DB 0-10 → display 0-5
  const filled  = Math.min(5, Math.round(display));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/** Average of all scores using profiles.length as denominator. */
function calcAverage(ratings: Rating[], profileCount: number): number | null {
  if (ratings.length === 0 || profileCount === 0) return null;
  const sum = ratings.reduce((s, r) => s + r.score / 2, 0);
  return sum / profileCount;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function WatchedCard({ movie, profiles, index, onClick }: WatchedCardProps) {
  const average = calcAverage(movie.ratings, profiles.length);

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
        'flex flex-col gap-2 px-4 py-3.5',
        'bg-[#1A1A1A] rounded-2xl',
        'border border-[#2A2A2A]',
        'active:bg-[#222222]',
        'transition-colors duration-100',
      ].join(' ')}
      aria-label={`Ver detalhes de ${movie.title}`}
    >
      {/* ── Row 1: title + date ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[#F5F5F5] leading-snug flex-1 min-w-0 truncate">
          {movie.title}
        </p>
        <span className="text-xs text-[#6B7280] shrink-0 mt-0.5">
          {fmtDate(movie.watched_date)}
        </span>
      </div>

      {/* ── Row 2: year + genres ───────────────────────────────────────────── */}
      {(movie.year || movie.genres?.length > 0) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {movie.year && (
            <span className="text-xs text-[#6B7280]">{movie.year}</span>
          )}
          {movie.year && movie.genres?.length > 0 && (
            <span className="text-[#3F3F46] text-xs" aria-hidden="true">·</span>
          )}
          {movie.genres?.length > 0 && (
            <span className="text-xs text-[#6B7280] truncate">
              {movie.genres.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* ── Row 3: per-person ratings ──────────────────────────────────────── */}
      {profiles.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {profiles.map((p, pi) => {
            const r = movie.ratings.find((rt) => rt.user_id === p.id);
            const label = r && r.score > 0 ? starsText(r.score) : 'Não avaliado';
            return (
              <span key={p.id} className="text-xs text-[#9CA3AF]">
                {pi > 0 && (
                  <span className="text-[#3F3F46] mr-2" aria-hidden="true">|</span>
                )}
                <span className="text-[#6B7280]">{p.display_name}:</span>{' '}
                <span className={r && r.score > 0 ? 'text-[#FACC15]' : 'text-[#6B7280]'}>
                  {label}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Row 4: average ────────────────────────────────────────────────── */}
      {average !== null && (
        <div className="flex items-center gap-1">
          <Star
            size={11}
            fill="#FACC15"
            stroke="#FACC15"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="text-xs text-[#9CA3AF]">
            Média: <span className="text-[#F5F5F5] font-medium">{average.toFixed(1)}</span>
          </span>
        </div>
      )}
    </motion.button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function WatchedCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton variant="line" width="55%" height="14px" />
        <Skeleton variant="line" width="20%" height="11px" />
      </div>
      <Skeleton variant="line" width="38%" height="11px" />
      <Skeleton variant="line" width="75%" height="11px" />
      <Skeleton variant="line" width="28%" height="11px" />
    </div>
  );
}
