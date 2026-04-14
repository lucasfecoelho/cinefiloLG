'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputVariant = 'text' | 'password' | 'search';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  variant?: InputVariant;
  /** Optional icon shown on the left. Defaults to a magnifier for 'search' variant. */
  icon?: React.ReactNode;
  /** Renders a red error message below the input. */
  error?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { variant = 'text', icon, error, className = '', ...rest },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType =
      variant === 'password'
        ? showPassword ? 'text' : 'password'
        : variant === 'search'
        ? 'search'
        : 'text';

    const leftIcon = icon ?? (variant === 'search' ? <Search size={18} aria-hidden="true" /> : null);
    const hasLeft  = leftIcon !== null;
    const hasRight = variant === 'password';

    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="relative w-full">
          {/* Left icon */}
          {hasLeft && (
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#6B7280] pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            type={inputType}
            // 16px prevents iOS Safari auto-zoom on focus
            style={{ fontSize: '16px' }}
            className={[
              'w-full h-12 rounded-xl',
              'bg-white dark:bg-[#1A1A1A]',
              'text-[#111827] dark:text-[#F5F5F5]',
              'placeholder-[#9CA3AF] dark:placeholder-[#6B7280]',
              'border',
              error
                ? 'border-[#EF4444] focus:border-[#EF4444]'
                : 'border-[#E5E7EB] dark:border-[#2A2A2A] focus:border-(--color-primary)',
              'focus:outline-none focus:ring-2',
              error
                ? 'focus:ring-[#EF4444]/15'
                : 'focus:ring-[var(--color-primary-subtle,rgba(0,0,0,0.08))]',
              'transition-colors duration-150',
              hasLeft  ? 'pl-11' : 'pl-4',
              hasRight ? 'pr-11' : 'pr-4',
              className,
            ].join(' ')}
            {...rest}
          />

          {/* Password toggle */}
          {variant === 'password' && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className={[
                'absolute right-4 top-1/2 -translate-y-1/2',
                'text-[#9CA3AF] dark:text-[#6B7280]',
                'hover:text-[#6B7280] dark:hover:text-[#9CA3AF]',
                'transition-colors duration-150',
              ].join(' ')}
            >
              {showPassword
                ? <EyeOff size={18} aria-hidden="true" />
                : <Eye    size={18} aria-hidden="true" />}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-[#EF4444] px-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
