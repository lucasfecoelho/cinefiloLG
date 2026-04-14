'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'danger' | 'success' | 'info' | 'ghost';
export type ButtonSize    = 'sm' | 'md' | 'lg';

// Base on HTMLMotionProps so Framer Motion event types are used directly —
// avoids the React 19 ↔ Framer Motion 12 onAnimationStart / onDragStart conflicts.
export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: React.ReactNode;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-(--color-primary) text-white ' +
    'hover:bg-(--color-primary-light) active:bg-(--color-primary-dark)',
  danger:
    'bg-[#EF4444] text-white hover:bg-[#F87171] active:bg-[#B91C1C]',
  success:
    'bg-[#22C55E] text-white hover:bg-[#4ADE80] active:bg-[#15803D]',
  info:
    'bg-[#3B82F6] text-white hover:bg-[#60A5FA] active:bg-[#1D4ED8]',
  ghost:
    'bg-transparent text-[#6B7280] dark:text-[#9CA3AF] ' +
    'border border-[#E5E7EB] dark:border-[#2A2A2A] ' +
    'hover:bg-black/5 dark:hover:bg-white/5',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9  px-4 text-sm  gap-1.5',
  md: 'h-12 px-5 text-sm  gap-2',
  lg: 'h-14 px-6 text-base gap-2',
};

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin shrink-0"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size    = 'md',
      loading = false,
      disabled,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        transition={{ duration: 0.1, ease: [0.3, 0, 1, 1] }}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center rounded-xl font-semibold',
          'transition-colors duration-150 select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          VARIANT[variant],
          SIZE[size],
          className,
        ].join(' ')}
        {...rest}
      >
        {loading && <Spinner />}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
