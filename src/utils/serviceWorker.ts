// Service Worker registration and management utilities

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Register service worker
export function registerSW(config: ServiceWorkerConfig = {}) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);

    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('Service worker registered for development');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      config.onOnline?.();
    });

    window.addEventListener('offline', () => {
      config.onOffline?.();
    });
  }
}

// Register valid service worker
function registerValidSW(swUrl: string, config: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              config.onUpdate?.(registration);
              console.log('New content available, please refresh');
            } else {
              // Content cached for offline use
              config.onSuccess?.(registration);
              console.log('Content cached for offline use');
            }
          }
        };
      };
    })
    .catch(error => {
      console.error('Service worker registration failed:', error);
    });
}

// Check if service worker file exists
function checkValidServiceWorker(swUrl: string, config: ServiceWorkerConfig) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Service worker not found, reload page
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection, app running in offline mode');
    });
}

// Unregister service worker
export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error('Service worker unregistration failed:', error);
      });
  }
}

// Update service worker
export function updateSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      } else {
        registration.update();
      }
    });
  }
}

// Cache URLs for offline use
export function cacheUrls(urls: string[]) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_URLS',
          urls
        });
      }
    });
  }
}

// Clear cache
export function clearCache(cacheType?: string) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'CLEAR_CACHE',
          cacheType
        });
      }
    });
  }
}

// Check if app is running in standalone mode (PWA)
export function isPWA(): boolean {
  return (
    window.matchMedia &&
    window.matchMedia('(display-mode: standalone)').matches
  ) || (window.navigator as any).standalone;
}

// Check network status
export function getNetworkStatus() {
  return {
    online: navigator.onLine,
    effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
    downlink: (navigator as any).connection?.downlink || 0,
    rtt: (navigator as any).connection?.rtt || 0
  };
}

// Performance monitoring for service worker
export function monitorSWPerformance() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Monitor cache hit rates
      const measureCachePerformance = async () => {
        try {
          const cacheNames = await caches.keys();
          const stats = [];

          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            stats.push({
              name: cacheName,
              size: requests.length
            });
          }

          console.log('Cache performance stats:', stats);
          return stats;
        } catch (error) {
          console.error('Failed to measure cache performance:', error);
        }
      };

      // Run performance check every 5 minutes
      setInterval(measureCachePerformance, 5 * 60 * 1000);
    });
  }
}

// React hook for service worker management
export function useServiceWorker(config: ServiceWorkerConfig = {}) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = React.useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      config.onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      config.onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    registerSW({
      onSuccess: (registration) => {
        setSwRegistration(registration);
        config.onSuccess?.(registration);
      },
      onUpdate: (registration) => {
        setUpdateAvailable(true);
        config.onUpdate?.(registration);
      },
      onOnline: handleOnline,
      onOffline: handleOffline
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerUpdate = () => {
    updateSW();
    setUpdateAvailable(false);
  };

  return {
    isOnline,
    swRegistration,
    updateAvailable,
    triggerUpdate,
    cacheUrls,
    clearCache,
    isPWA: isPWA(),
    networkStatus: getNetworkStatus()
  };
}