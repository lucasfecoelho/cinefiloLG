'use client';

import { AnimatePresence, m } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Wraps page content with AnimatePresence so each route change
 * gets a smooth fade + 6 px slide-up entrance (~180 ms).
 * Place this inside the app layout's scrollable content div.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
