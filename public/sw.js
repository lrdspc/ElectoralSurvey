const CACHE_NAME = 'electoral-survey-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  OFFLINE_URL
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
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
      // Take control of all open clients
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => cache.match('/'))
            .then((response) => response || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(request).catch(() => {
          // If both cache and network fail, return offline page for HTML requests
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const method = request.method;
  
  try {
    // Try network first
    const response = await fetch(request.clone());
    
    // Cache successful GET requests
    if (method === 'GET' && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Network request failed, trying cache:', url.pathname);
    
    // For GET requests, try to serve from cache
    if (method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // For POST/PUT requests (like submitting interviews), store in IndexedDB
    if (method === 'POST' || method === 'PUT') {
      await storeOfflineRequest(request);
      
      // Return a success response to prevent errors in the UI
      return new Response(
        JSON.stringify({ 
          success: true, 
          offline: true, 
          message: 'Dados salvos offline. Serão enviados quando a conexão for restaurada.' 
        }),
        {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return error for other methods
    throw error;
  }
}

// Store offline requests in IndexedDB
async function storeOfflineRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: await request.text(),
    timestamp: Date.now()
  };
  
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('OfflineRequests', 1);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      
      store.add(requestData);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    dbRequest.onupgradeneeded = () => {
      const db = dbRequest.result;
      const store = db.createObjectStore('requests', { keyPath: 'timestamp' });
      store.createIndex('url', 'url', { unique: false });
    };
  });
}

// Process offline requests when online
async function processOfflineRequests() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('OfflineRequests', 1);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onsuccess = async () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const requests = getAllRequest.result;
        
        for (const requestData of requests) {
          try {
            const headers = new Headers(requestData.headers);
            
            const response = await fetch(requestData.url, {
              method: requestData.method,
              headers: headers,
              body: requestData.body || undefined
            });
            
            if (response.ok) {
              // Remove successfully processed request
              store.delete(requestData.timestamp);
              console.log('Processed offline request:', requestData.url);
            }
          } catch (error) {
            console.log('Failed to process offline request:', requestData.url, error);
          }
        }
        
        resolve();
      };
    };
  });
}

// Listen for online event to process offline requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_OFFLINE_REQUESTS') {
    event.waitUntil(processOfflineRequests());
  }
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineRequests());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do ElectoralSurvey',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ElectoralSurvey', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
