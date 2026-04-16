'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';

import { useAuth } from '@/providers/AuthProvider';

// ─── Clapboard SVG ────────────────────────────────────────────────────────────

function ClapboardIcon() {
  return (
    <svg
      width="120"
      height="104"
      viewBox="0 0 120 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Body ── */}
      <rect x="4" y="44" width="112" height="56" rx="10" fill="#22C55E" />

      {/* "LG" on body */}
      {/* L */}
      <rect x="28" y="58" width="8" height="28" rx="2" fill="#0A0A0A" />
      <rect x="28" y="78" width="20" height="8" rx="2" fill="#0A0A0A" />
      {/* G */}
      <path
        d="M64 58 C52 58 52 86 64 86 C76 86 76 72 76 72 L66 72 L66 79 L68 79 C68 80 64 81 64 78 C58 78 58 64 64 64 C68 64 70 66 70 66 L77 60 C74 59 69 58 64 58 Z"
        fill="#0A0A0A"
      />

      {/* ── Flap (rotates from -35° closed at top-center) ── */}
      <m.g
        initial={{ rotate: -35 }}
        animate={{ rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 520,
          damping: 22,
          delay: 0.35,
        }}
        style={{ transformOrigin: '60px 44px' }}
      >
        {/* Flap body */}
        <rect x="4" y="16" width="112" height="32" rx="8" fill="#141414" />
        {/* Diagonal stripes */}
        <clipPath id="flap-clip">
          <rect x="4" y="16" width="112" height="32" rx="8" />
        </clipPath>
        <g clipPath="url(#flap-clip)">
          {[-20, 0, 20, 40, 60, 80, 100, 120].map((x) => (
            <rect
              key={x}
              x={x}
              y="10"
              width="12"
              height="50"
              fill="#22C55E"
              opacity="0.85"
              transform="skewX(-30)"
            />
          ))}
        </g>
        {/* Hinge line */}
        <rect x="4" y="42" width="112" height="4" rx="2" fill="#0A0A0A" opacity="0.5" />
        {/* Hinge pegs */}
        <circle cx="22" cy="44" r="5" fill="#0A0A0A" />
        <circle cx="98" cy="44" r="5" fill="#0A0A0A" />
      </m.g>
    </svg>
  );
}

// ─── SplashScreen ─────────────────────────────────────────────────────────────

const MIN_DISPLAY_MS = 900;

export function SplashScreen() {
  const { loading } = useAuth();

  const [show,       setShow]       = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  // Enforce a minimum display time so the animation plays fully
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading && minElapsed) setShow(false);
  }, [loading, minElapsed]);

  return (
    <AnimatePresence>
      {show && (
        <m.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.3, 0, 1, 1] }}
          className={[
            'fixed inset-0 z-[100]',
            'flex flex-col items-center justify-center gap-6',
            'bg-[#0A0A0A]',
          ].join(' ')}
          aria-label="Carregando"
          aria-live="polite"
        >
          {/* Logo */}
          <m.div
            initial={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            transition={{ duration: 0.4, ease: [0, 0, 0, 1] }}
          >
            <ClapboardIcon />
          </m.div>

          {/* App name */}
          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0, 1], delay: 0.2 }}
            className="text-lg font-bold text-[#F5F5F5] tracking-wide"
          >
            Cinefilos LG
          </m.p>
        </m.div>
      )}
    </AnimatePresence>
  );
}
