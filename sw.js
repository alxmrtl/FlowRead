// FlowRead Service Worker - PWA Implementation
const CACHE_NAME = 'flowread-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/app.js',
  '/js/training.js',
  '/js/assessment.js',
  '/js/progress.js',
  '/js/storage.js',
  '/js/textprocessing.js',
  '/js/reading.js',
  '/js/comprehension.js',
  '/js/drills.js',
  '/js/test.js',
  '/FlowReadLogos/eggshell.png',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('FlowRead SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('FlowRead SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('FlowRead SW: Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('FlowRead SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('FlowRead SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone response because it's a stream
          const responseToCache = response.clone();
          
          // Add to cache for future requests
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(error => {
          console.log('FlowRead SW: Fetch failed, serving offline fallback:', error);
          
          // Return offline page for HTML requests
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          return new Response('FlowRead is offline. Please check your connection.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Background sync for progress data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-progress') {
    console.log('FlowRead SW: Background sync for progress data');
    event.waitUntil(syncProgressData());
  }
});

// Push notifications for training reminders (optional)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/FlowReadLogos/eggshell.png',
      badge: '/FlowReadLogos/eggshell.png',
      tag: 'flowread-notification',
      requireInteraction: false,
      actions: [
        {
          action: 'train',
          title: 'Start Training'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('FlowRead Training Reminder', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'train') {
    event.waitUntil(
      clients.openWindow('/?mode=train')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync progress data function
async function syncProgressData() {
  try {
    // This would sync any pending progress data
    // Integration with your existing storage.js
    console.log('FlowRead SW: Syncing progress data...');
    return Promise.resolve();
  } catch (error) {
    console.error('FlowRead SW: Progress sync failed:', error);
    throw error;
  }
}

// Message handling for communication with main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({version: CACHE_NAME});
  }
});