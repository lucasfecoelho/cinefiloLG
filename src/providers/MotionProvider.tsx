'use client';

import { LazyMotion, domAnimation } from 'framer-motion';

/**
 * Provides Framer Motion features lazily (~15 KB instead of ~30 KB).
 * Must wrap every component that uses `m.*` (replaces `motion.*`).
 * `strict` throws a dev error if any component imports the full `motion` object.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
