// Use a timestamp-based cache name to force updates
const CACHE_NAME = `wordslide-${Date.now()}`;
const OFFLINE_URL = '/';
const APP_VERSION = '1.0.0'; // Update this for major releases

// Force immediate activation of new service worker
const FORCE_UPDATE = true;

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/styles.css',
  '/src/utils/mobileOptimizations.js',
  '/manifest.json',
  '/icon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`Service Worker installing... Version: ${APP_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        // Notify clients that a new version is ready
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATE_READY',
              version: APP_VERSION,
              message: 'New version available! The app will update automatically.'
            });
          });
        });
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  
  // Force immediate activation - don't wait for existing tabs to close
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`Service Worker activating... Version: ${APP_VERSION}`);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force immediate control of all clients
      return self.clients.claim();
    }).then(() => {
      // Notify clients that the update is complete and force reload
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION,
            message: 'App updated successfully! Reloading...'
          });
          // Force reload the page to ensure latest version
          client.navigate(client.url);
        });
      });
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (event.request.url.includes('/api/') || event.request.url.includes('amazonaws.com')) {
    // For API requests, try network first, then show offline message
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return a custom offline response for API calls
          return new Response(
            JSON.stringify({ 
              error: 'offline', 
              message: 'You are currently offline. Some features may not be available.' 
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // For static assets, try network first for updates, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response for caching
        const responseToCache = response.clone();
        
        // Cache successful responses
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If both cache and network fail, return offline page
            return caches.match(OFFLINE_URL);
          });
      })
  );
});

// Handle background sync (for when the app comes back online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Here you could sync any pending data when back online
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
