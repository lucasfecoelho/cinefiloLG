'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * 5-pointed star in a 24 × 24 viewBox.
 * Center (12, 12), outer-radius 9, inner-radius 3.6.
 * Points computed at alternating outer/inner positions starting at -90°.
 */
const STAR_PATH =
  'M12 3 L14.12 9.09 L20.56 9.22 L15.42 13.11 L17.29 19.28 L12 15.6 L6.71 19.28 L8.58 13.11 L3.44 9.22 L9.88 9.09 Z';

const GOLD         = '#FBBF24';
const EMPTY_STROKE = '#4B5563';

const SIZE_PX = { sm: 14, md: 20, lg: 26 } as const;

/** Six particles at 60° intervals for the 5-star burst. */
const BURST_ANGLES = [0, 60, 120, 180, 240, 300];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StarRatingProps {
  /** 0–5, supports 0.5 increments. 0 = not rated. */
  rating: number;
  onChange?: (rating: number) => void;
  /** Star icon size. Default: 'lg' for input mode, 'sm' for display mode. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 'input'   — interactive, larger icon (~26 px). Double-tap for half-star.
   * 'display' — read-only, compact icon (~14 px). For showing averages.
   * Default: 'input'.
   */
  mode?: 'input' | 'display';
}

// ─── Fill state helper ────────────────────────────────────────────────────────

type FillState = 'full' | 'half' | 'empty';

function fillState(rating: number, star: number): FillState {
  if (rating >= star)         return 'full';
  if (rating >= star - 0.5)   return 'half';
  return 'empty';
}

// ─── Star SVG glyph ───────────────────────────────────────────────────────────
//
// Renders a single 5-pointed star with three possible fill states:
//   full  — solid gold fill
//   half  — left half filled via clipPath, right half empty
//   empty — outline only

interface StarGlyphProps {
  fill:   FillState;
  px:     number;
  clipId: string; // unique per star to avoid clipPath collisions across instances
}

function StarGlyph({ fill, px, clipId }: StarGlyphProps) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      aria-hidden="true"
      overflow="visible"
    >
      {fill === 'half' && (
        <defs>
          <clipPath id={clipId}>
            {/* Covers exactly the left half of the 24 × 24 viewBox */}
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      )}

      {/* Outline — always visible, gold when any fill, grey when empty */}
      <path
        d={STAR_PATH}
        fill="none"
        stroke={fill === 'empty' ? EMPTY_STROKE : GOLD}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Fill layer — full or clipped-left-half */}
      {fill !== 'empty' && (
        <path
          d={STAR_PATH}
          fill={GOLD}
          stroke="none"
          clipPath={fill === 'half' ? `url(#${clipId})` : undefined}
        />
      )}
    </svg>
  );
}

// ─── StarRating ───────────────────────────────────────────────────────────────

export function StarRating({
  rating,
  onChange,
  size,
  mode = 'input',
}: StarRatingProps) {
  const uid         = useId().replace(/:/g, '');
  const px          = SIZE_PX[size ?? (mode === 'display' ? 'sm' : 'lg')];
  const interactive = mode === 'input' && !!onChange;

  // ── Double-tap detection ──────────────────────────────────────────────────
  const lastTapRef = useRef<{ star: number; time: number } | null>(null);

  function handlePress(star: number) {
    if (!onChange) return;
    const now  = Date.now();
    const last = lastTapRef.current;

    if (last && last.star === star && now - last.time < 300) {
      // Second tap within 300 ms on the same star → half-star
      lastTapRef.current = null;
      onChange(star - 0.5);
      return;
    }

    lastTapRef.current = { star, time: now };
    // Tap on current whole-star rating → clear; otherwise set whole star
    onChange(rating === star ? 0 : star);
  }

  // ── Burst on perfect 5.0 ─────────────────────────────────────────────────
  const prevRatingRef = useRef(rating);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (rating === 5 && prevRatingRef.current !== 5) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 700);
      return () => clearTimeout(t);
    }
    prevRatingRef.current = rating;
  }, [rating]);

  // ── Skip entry animation on initial mount ─────────────────────────────────
  // After the first render the ref flips to true; subsequent key-driven
  // remounts of each star div will use the spring initial.
  const mountedRef = useRef(false);
  useEffect(() => { mountedRef.current = true; }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative inline-flex items-center"
      style={{ overflow: 'visible' }}
    >
      <div
        className={[
          'flex items-center',
          mode === 'display' ? 'gap-px' : 'gap-0.5',
        ].join(' ')}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={
          interactive
            ? 'Avaliação em estrelas'
            : `${rating} de 5 estrelas`
        }
      >
        {([1, 2, 3, 4, 5] as const).map((star) => {
          const fill   = fillState(rating, star);
          const clipId = `sc-${uid}-${star}`;

          /**
           * Inner motion.div:
           *   • key changes whenever fill state changes → triggers remount + spring
           *   • initial=false on first render so existing ratings don't animate in
           *   • delay scales with star index for a left-to-right sequential feel
           */
          const inner = (
            <motion.div
              key={`${star}-${fill}`}
              initial={
                mountedRef.current
                  ? { scale: fill !== 'empty' ? 0.65 : 1.2 }
                  : false
              }
              animate={{ scale: 1 }}
              transition={{
                type:      'spring',
                stiffness: 400,
                damping:   12,
                delay:     fill !== 'empty' ? (star - 1) * 0.04 : 0,
              }}
            >
              <StarGlyph fill={fill} px={px} clipId={clipId} />
            </motion.div>
          );

          if (!interactive) {
            return <div key={star}>{inner}</div>;
          }

          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => handlePress(star)}
              whileTap={{ scale: 1.3 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              aria-label={`${star} estrela${star !== 1 ? 's' : ''}`}
              aria-pressed={rating >= star - 0.4}
              className="focus:outline-none cursor-pointer"
            >
              {inner}
            </motion.button>
          );
        })}
      </div>

      {/* ── Burst particles on 5.0 ───────────────────────────────────────── */}
      <AnimatePresence>
        {burst &&
          BURST_ANGLES.map((deg, i) => {
            const rad  = (deg * Math.PI) / 180;
            const dist = px * 2.8;
            const sz   = Math.max(3, Math.round(px * 0.2));
            return (
              <motion.span
                key={deg}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  scale: 0,
                }}
                exit={{}}
                transition={{
                  duration: 0.6,
                  ease:     'easeOut',
                  delay:    i * 0.02,
                }}
                style={{
                  position:        'absolute',
                  left:            '50%',
                  top:             '50%',
                  width:           sz,
                  height:          sz,
                  borderRadius:    '50%',
                  backgroundColor: GOLD,
                  pointerEvents:   'none',
                  marginLeft:      -(sz / 2),
                  marginTop:       -(sz / 2),
                }}
              />
            );
          })}
      </AnimatePresence>
    </div>
  );
}
