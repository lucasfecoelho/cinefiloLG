'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkeletonVariant = 'card' | 'line' | 'circle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** CSS width string. Default: '100%' for card/line, equals height for circle. */
  width?: string;
  /** CSS height string. Default: '80px' for card, '16px' for line, '40px' for circle. */
  height?: string;
  className?: string;
}

// ─── Base ─────────────────────────────────────────────────────────────────────

const BASE = 'animate-pulse bg-[#F3F4F6] dark:bg-[#1E1E1E]';

// ─── Component ───────────────────────────────────────────────────────────────

export function Skeleton({
  variant  = 'line',
  width,
  height,
  className = '',
}: SkeletonProps) {
  if (variant === 'circle') {
    const dim = width ?? height ?? '40px';
    return (
      <div
        className={`${BASE} rounded-full shrink-0 ${className}`}
        style={{ width: dim, height: dim }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`${BASE} rounded-xl ${className}`}
        style={{ width: width ?? '100%', height: height ?? '80px' }}
        aria-hidden="true"
      />
    );
  }

  // line
  return (
    <div
      className={`${BASE} rounded-md ${className}`}
      style={{ width: width ?? '100%', height: height ?? '16px' }}
      aria-hidden="true"
    />
  );
}

// ─── Preset composites ────────────────────────────────────────────────────────

/** Pre-built movie-card skeleton matching ToWatchCard / WatchedCard dimensions. */
export function MovieCardSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3" aria-hidden="true">
      <Skeleton variant="card" width="52px" height="76px" className="rounded-lg shrink-0" />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <Skeleton variant="line" width="70%"  height="14px" />
        <Skeleton variant="line" width="45%"  height="12px" />
        <Skeleton variant="line" width="55%"  height="12px" />
      </div>
    </div>
  );
}
