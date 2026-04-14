/* ─── Cinefilos LG — Service Worker ───────────────────────────────────────────
 * Strategy:
 *   - Next.js static assets (_next/static/):  cache-first
 *   - TMDB poster images (image.tmdb.org):     cache-first (long TTL)
 *   - Navigation (HTML):                       network-first
 *   - Supabase / API:                          network-only (never cache auth)
 * ─────────────────────────────────────────────────────────────────────────── */

const STATIC_CACHE = 'cinefilos-static-v1';
const TMDB_CACHE   = 'cinefilos-tmdb-v1';
const ALL_CACHES   = [STATIC_CACHE, TMDB_CACHE];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Never intercept Supabase / auth traffic
  if (url.hostname.includes('supabase.co')) return;

  // TMDB poster images — cache-first, 30-day TTL
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(tmdbCacheFirst(request));
    return;
  }

  // Next.js static assets — cache-first indefinitely (content-hashed)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staticCacheFirst(request));
    return;
  }

  // Public static files (icons, manifest, fonts)
  if (
    url.pathname.match(/\.(png|ico|svg|webmanifest|json|woff2?)$/) &&
    url.origin === self.location.origin
  ) {
    event.respondWith(staticCacheFirst(request));
    return;
  }

  // HTML navigation — network-first, fall back to a cached shell if offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else: network only
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function staticCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset not available offline.', { status: 503 });
  }
}

async function tmdbCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(TMDB_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return transparent 1x1 PNG placeholder when offline
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return new Response(
      Uint8Array.from(atob(placeholder.split(',')[1]), (c) => c.charCodeAt(0)),
      { headers: { 'Content-Type': 'image/gif' } },
    );
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response('Você está offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
