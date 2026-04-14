'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StarRatingProps {
  /** 0–5 integer. 0 = not rated. */
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  /** Icon size in px. Default 24. */
  size?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 24,
}: StarRatingProps) {
  return (
    <div
      className="flex items-center gap-0.5"
      role={readonly ? 'img' : 'radiogroup'}
      aria-label={readonly ? `${value} de 5 estrelas` : 'Avaliação'}
    >
      {([1, 2, 3, 4, 5] as const).map((star) => {
        const filled = value >= star;

        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            whileTap={readonly ? undefined : { scale: 1.35 }}
            transition={{ type: 'spring', stiffness: 450, damping: 18, duration: 0.12 }}
            onClick={
              readonly
                ? undefined
                : () => onChange?.(value === star ? 0 : star)
            }
            aria-label={`${star} estrela${star !== 1 ? 's' : ''}`}
            aria-pressed={!readonly ? value === star : undefined}
            className={[
              'focus:outline-none',
              readonly ? 'cursor-default pointer-events-none' : 'cursor-pointer',
            ].join(' ')}
          >
            <Star
              width={size}
              height={size}
              fill={filled ? '#FACC15' : 'none'}
              stroke={filled ? '#FACC15' : '#6B7280'}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </motion.button>
        );
      })}
    </div>
  );
}
