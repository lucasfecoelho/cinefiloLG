'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker once the page has loaded.
 * Rendered in the root layout so it runs on every page.
 */
export function SWRegistrar() {
  useEffect(() => {
    if (
      typeof window === 'undefined'              ||
      !('serviceWorker' in navigator)             ||
      process.env.NODE_ENV !== 'production'
    ) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
    });
  }, []);

  return null;
}
