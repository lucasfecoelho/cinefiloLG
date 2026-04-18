'use client';

import Image from 'next/image';
import { AnimatePresence, m } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserAvatarProps {
  displayName?: string | null;
  avatarUrl?:   string | null;
  size?:        'sm' | 'md' | 'lg';
  /** Extra Tailwind classes applied to the outer circle */
  className?:   string;
  /** Show ring (active state) */
  active?:      boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_PX: Record<NonNullable<UserAvatarProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 80,
};

const TEXT_CLASS: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'text-[11px] font-bold',
  md: 'text-sm    font-bold',
  lg: 'text-2xl   font-bold',
};

// ─── UserAvatar ───────────────────────────────────────────────────────────────

export function UserAvatar({
  displayName,
  avatarUrl,
  size = 'md',
  className = '',
  active = false,
}: UserAvatarProps) {
  const px      = SIZE_PX[size];
  const initial = displayName?.[0]?.toUpperCase() ?? '?';

  const ring = active
    ? 'ring-2 ring-(--color-primary) ring-offset-[3px] ring-offset-[#141414]'
    : '';

  return (
    <span
      className={[
        'relative rounded-full overflow-hidden shrink-0',
        'bg-(--color-primary)',
        'flex items-center justify-center',
        'transition-all duration-200',
        ring,
        className,
      ].join(' ')}
      style={{ width: px, height: px, minWidth: px }}
      aria-hidden="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        {avatarUrl ? (
          <m.span
            key={avatarUrl}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={avatarUrl}
              alt={displayName ?? 'Avatar'}
              fill
              sizes={`${px}px`}
              className="object-cover"
              unoptimized
            />
          </m.span>
        ) : (
          <m.span
            key="initials"
            className={`${TEXT_CLASS[size]} text-white leading-none`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {initial}
          </m.span>
        )}
      </AnimatePresence>
    </span>
  );
}
