// Service Worker for Performance Optimization
// Implements aggressive caching strategies for better UX

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;
const IMAGE_CACHE = `image-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Cache strategies by route pattern
const CACHE_STRATEGIES = {
  // Static assets: Cache first
  static: /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,

  // Images: Cache first with fallback
  images: /\/images\//,

  // API calls: Network first with cache fallback
  api: /\/api\//,

  // Generated content: Network first
  generated: /\/(ai-story|ai-lyrics|text-to-image)/,

  // User uploads: Cache first
  uploads: /\/uploads\//
};

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  images: 7 * 24 * 60 * 60 * 1000,  // 7 days
  api: 60 * 60 * 1000,               // 1 hour
  generated: 24 * 60 * 60 * 1000,    // 24 hours
  uploads: 7 * 24 * 60 * 60 * 1000   // 7 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName =>
              cacheName.includes('cache-') &&
              !cacheName.includes(CACHE_VERSION)
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for known CDNs)
  if (url.origin !== self.location.origin && !isTrustedOrigin(url.origin)) {
    return;
  }

  // Route to appropriate cache strategy
  if (CACHE_STRATEGIES.static.test(url.pathname)) {
    event.respondWith(handleStaticAssets(request));
  } else if (CACHE_STRATEGIES.images.test(url.pathname)) {
    event.respondWith(handleImages(request));
  } else if (CACHE_STRATEGIES.api.test(url.pathname)) {
    event.respondWith(handleAPI(request));
  } else if (CACHE_STRATEGIES.uploads.test(url.pathname)) {
    event.respondWith(handleUploads(request));
  } else if (url.pathname === '/' || url.pathname.includes('.html')) {
    event.respondWith(handleHTML(request));
  } else {
    event.respondWith(handleDefault(request));
  }
});

// Cache first strategy for static assets
async function handleStaticAssets(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATIONS.static)) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Asset not available', { status: 404 });
  }
}

// Cache first with compression for images
async function handleImages(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATIONS.images)) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Only cache successful responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || generateImagePlaceholder();
  }
}

// Network first with cache fallback for API
async function handleAPI(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATIONS.api)) {
      // Add header to indicate cached response
      const modifiedResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...Object.fromEntries(cachedResponse.headers.entries()),
          'X-Cache-Status': 'HIT'
        }
      });
      return modifiedResponse;
    }

    return new Response(JSON.stringify({
      error: 'Network unavailable',
      cached: false
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache first for user uploads
async function handleUploads(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Upload not available', { status: 404 });
  }
}

// Network first for HTML pages
async function handleHTML(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || cache.match('/index.html');
  }
}

// Default strategy - network with cache fallback
async function handleDefault(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    return await cache.match(request);
  }
}

// Helper functions
function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;

  const responseDate = new Date(dateHeader);
  return (Date.now() - responseDate.getTime()) > maxAge;
}

function isTrustedOrigin(origin) {
  const trustedOrigins = [
    'https://storage.googleapis.com', // Google Cloud Storage
    'https://cdn.jsdelivr.net',       // CDN
    'https://unpkg.com',              // Package CDN
    'https://fonts.googleapis.com',   // Google Fonts
    'https://fonts.gstatic.com'       // Google Fonts static
  ];
  return trustedOrigins.includes(origin);
}

function generateImagePlaceholder() {
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#374151"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="14">
        Image not available
      </text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Implement background sync logic for offline actions
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data?.url) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url)
    );
  }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data?.type === 'CACHE_URLS') {
    event.waitUntil(cacheUrls(event.data.urls));
  } else if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(clearCache(event.data.cacheType));
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await Promise.all(urls.map(url => cache.add(url).catch(() => {})));
}

async function clearCache(cacheType) {
  if (cacheType) {
    await caches.delete(`${cacheType}-cache-${CACHE_VERSION}`);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}