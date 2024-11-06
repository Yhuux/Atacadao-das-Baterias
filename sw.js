// Version control
const CACHE_VERSION = 1.0;  // Increment this when files are updated
const CACHE_NAME = `Catarinense-Baterias-v${CACHE_VERSION}`;

// Add timestamp to cache name for automatic updates
const DYNAMIC_CACHE_NAME = `dynamic-${Date.now()}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Google+Sans:wght@400;500&display=swap'
];

// Function to hash file content
async function calculateHash(response) {
  const buffer = await response.clone().arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Install event - cache static assets with content hashing
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Opened cache');
        
        // Create a map of file hashes
        const hashMap = new Map();
        
        // Fetch and cache each asset while calculating its hash
        const cachePromises = STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            const hash = await calculateHash(response);
            hashMap.set(url, hash);
            return cache.put(url, response);
          } catch (error) {
            console.error(`Failed to cache ${url}:`, error);
          }
        });
        
        await Promise.all(cachePromises);
        
        // Store the hash map in cache
        await cache.put('asset-hashes', new Response(JSON.stringify([...hashMap])));
        
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old version caches and dynamic caches
            if (cacheName !== CACHE_NAME && cacheName.startsWith('atacadao-baterias-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            if (cacheName.startsWith('dynamic-') && cacheName !== DYNAMIC_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event with automatic update checking
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle WhatsApp links differently
  if (event.request.url.includes('wa.me') || event.request.url.includes('whatsapp.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(async (cachedResponse) => {
        // Check if resource is in STATIC_ASSETS
        const isStaticAsset = STATIC_ASSETS.includes(new URL(event.request.url).pathname);
        
        if (isStaticAsset) {
          // Fetch new version in background
          const fetchPromise = fetch(event.request)
            .then(async (networkResponse) => {
              if (networkResponse.ok) {
                // Calculate hash of new response
                const newHash = await calculateHash(networkResponse);
                
                // Get cached hash map
                const cache = await caches.open(CACHE_NAME);
                const hashMapResponse = await cache.match('asset-hashes');
                const hashMap = hashMapResponse ? new Map(JSON.parse(await hashMapResponse.text())) : new Map();
                
                const oldHash = hashMap.get(event.request.url);
                
                // If hash different, update cache
                if (newHash !== oldHash) {
                  console.log(`Updating cached file: ${event.request.url}`);
                  const cacheClone = networkResponse.clone();
                  await cache.put(event.request, cacheClone);
                  
                  // Update hash map
                  hashMap.set(event.request.url, newHash);
                  await cache.put('asset-hashes', new Response(JSON.stringify([...hashMap])));
                  
                  return networkResponse;
                }
              }
              return cachedResponse || networkResponse;
            });
          
          // Return cached response immediately while updating in background
          return cachedResponse || fetchPromise;
        }
        
        // For non-static assets, use network-first strategy
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return cachedResponse || response;
            }
            
            // Cache successful responses in dynamic cache
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            return cachedResponse || caches.match('/offline.html');
          });
      })
  );
});

// Keep existing push notification and sync handlers
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForm());
  }
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/badge-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/checkmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Atacadão das Baterias', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Helper functions
async function syncContactForm() {
  try {
    const entries = await getOfflineFormData();
    
    for (const entry of entries) {
      await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
      
      await removeOfflineFormData(entry.id);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineFormData() {
  return [];
}

async function removeOfflineFormData(id) {
  return;
}
