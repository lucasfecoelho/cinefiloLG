/* ─── Cinefilos LG — Service Worker v2 ────────────────────────────────────────
 * Strategies:
 *   TMDB images        → cache-first, 30-day TTL, LRU max 200 entries
 *   _next/static       → cache-first, permanent (content-hashed filenames)
 *   Public static files→ cache-first
 *   Supabase REST API  → network-first, fallback to cached response
 *   Navigation (HTML)  → network-first, fallback to cached shell
 * ─────────────────────────────────────────────────────────────────────────── */

const VERSION      = 'v2';
const STATIC_CACHE = `cinefilos-static-${VERSION}`;
const TMDB_CACHE   = `cinefilos-tmdb-${VERSION}`;
const API_CACHE    = `cinefilos-api-${VERSION}`;
const ALL_CACHES   = [STATIC_CACHE, TMDB_CACHE, API_CACHE];

const TMDB_MAX_ENTRIES = 200;
const TMDB_TTL_MS      = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Routes to cache on first navigate so they're available offline. */
const PRECACHE_ROUTES = ['/para-assistir', '/assistidos', '/busca'];

// ─── Install ─────────────────────────────────────────────────────────────────
// skipWaiting so the new SW takes control immediately on update.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// ─── Activate ─────────────────────────────────────────────────────────────────
// Delete any caches from a previous SW version, then claim all clients.
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
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // TMDB poster images — cache-first with TTL + LRU eviction
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(tmdbCacheFirst(request));
    return;
  }

  // Next.js static assets (_next/static/) — cache-first, permanent
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staticCacheFirst(request));
    return;
  }

  // Public static files (icons, manifest, fonts)
  if (
    url.pathname.match(/\.(png|ico|svg|webmanifest|woff2?)$/) &&
    url.origin === self.location.origin
  ) {
    event.respondWith(staticCacheFirst(request));
    return;
  }

  // Supabase REST API — network-first, stale-while-revalidate fallback
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // HTML navigation — network-first, fall back to cached shell if offline
  if (request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(request));
    return;
  }

  // Everything else: network only (auth, realtime, etc.)
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/** Cache-first for immutable static assets. */
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
    return new Response('Asset unavailable offline.', { status: 503 });
  }
}

/**
 * Cache-first for TMDB images with:
 *   - 30-day TTL (via `x-cached-at` header on the stored response)
 *   - LRU eviction when the cache exceeds TMDB_MAX_ENTRIES
 */
async function tmdbCacheFirst(request) {
  const cache  = await caches.open(TMDB_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    const cachedAt = parseInt(cached.headers.get('x-cached-at') ?? '0', 10);
    if (Date.now() - cachedAt < TMDB_TTL_MS) {
      return cached; // Still fresh
    }
    // Expired — delete and fall through to network
    await cache.delete(request);
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Attach timestamp header so we can check TTL on next request
      const headers = new Headers(response.headers);
      headers.set('x-cached-at', String(Date.now()));
      const timestamped = new Response(response.clone().body, {
        status:     response.status,
        statusText: response.statusText,
        headers,
      });
      await cache.put(request, timestamped);
      await evictTmdbOldest(cache);
    }
    return response;
  } catch {
    // Return transparent 1×1 PNG when completely offline
    const b64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return new Response(bytes, { headers: { 'Content-Type': 'image/gif' } });
  }
}

/** Delete the oldest entries so the cache stays ≤ TMDB_MAX_ENTRIES. */
async function evictTmdbOldest(cache) {
  const keys = await cache.keys();
  if (keys.length <= TMDB_MAX_ENTRIES) return;
  const excess = keys.slice(0, keys.length - TMDB_MAX_ENTRIES);
  await Promise.all(excess.map((k) => cache.delete(k)));
}

/**
 * Network-first with cache fallback.
 * Used for Supabase API responses — provides an offline data snapshot.
 */
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    // Only cache successful, non-auth responses
    if (response.ok && !request.headers.has('Authorization')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response(JSON.stringify({ error: 'offline' }), {
      status:  503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Network-first for HTML navigation.
 * Caches route shells on first visit so they're available offline.
 */
async function navigationNetworkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const response = await fetch(request);
    // Cache the HTML shell for known app routes
    const url = new URL(request.url);
    if (response.ok && PRECACHE_ROUTES.some((r) => url.pathname.startsWith(r))) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response('Você está offline.', {
      status:  503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
