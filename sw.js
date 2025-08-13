// Service Worker - Dinamik Kat Planı Çizici PWA
// Version 1.0.0

const CACHE_NAME = 'floor-plan-generator-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Önbelleğe alınacak statik dosyalar
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icon-16.png',
  '/icon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  // CDN kaynakları
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Önbelleğe alınmayacak URL'ler (analytics, tracking vb.)
const NEVER_CACHE = [
  '/analytics/',
  '/tracking/',
  'google-analytics.com',
  'googletagmanager.com'
];

// Service Worker kurulum eventi
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, {
            cache: 'reload' // Cache bypass for fresh content
          });
        }));
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        // Yeni service worker'ı hemen aktifleştir
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Service Worker aktivasyon eventi
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Eski cache'leri temizle
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Yeni service worker'ı hemen kontrole al
      self.clients.claim()
    ])
  );
});

// Fetch eventi - Network isteklerini yakala
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // POST isteklerini ve önbelleğe alınmaması gereken URL'leri bypass et
  if (event.request.method !== 'GET' || shouldNeverCache(requestUrl.href)) {
    return;
  }
  
  // Statik dosyalar için cache-first stratejisi
  if (isStaticAsset(event.request.url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Diğer istekler için network-first stratejisi
  event.respondWith(networkFirst(event.request));
});

// Cache-first strateji (statik dosyalar için)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('Service Worker: Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache-first error:', error);
    
    // Fallback - Ana sayfa döndür
    if (request.destination === 'document') {
      const fallback = await caches.match('/index.html');
      return fallback || new Response('Uygulama offline durumda', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// Network-first strateji (dinamik içerik için)
async function networkFirst(request) {
  try {
    console.log('Service Worker: Trying network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Son çare - offline sayfası
    if (request.destination === 'document') {
      const fallback = await caches.match('/index.html');
      return fallback || new Response(
        generateOfflinePage(),
        {
          headers: { 'Content-Type': 'text/html' },
          status: 503,
          statusText: 'Service Unavailable'
        }
      );
    }
    
    throw error;
  }
}

// Statik dosya kontrolü
function isStaticAsset(url) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  const urlPath = new URL(url).pathname;
  
  return staticExtensions.some(ext => urlPath.endsWith(ext)) ||
         STATIC_ASSETS.some(asset => url.includes(asset));
}

// Önbelleğe alınmaması gereken URL kontrolü
function shouldNeverCache(url) {
  return NEVER_CACHE.some(pattern => url.includes(pattern));
}

// Offline sayfa HTML'i
function generateOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Dinamik Kat Planı Çizici</title>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
        }
        .offline-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 500px;
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 2rem;
          opacity: 0.8;
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          line-height: 1.6;
        }
        .retry-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 15px 30px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .retry-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📶</div>
        <h1>Bağlantı Yok</h1>
        <p>İnternet bağlantınızı kontrol edin ve tekrar deneyin. Uygulama çevrimdışı çalışmaya devam edecek.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Yeniden Dene
        </button>
      </div>
    </body>
    </html>
  `;
}

// Background sync için event listener
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync işlemleri
async function doBackgroundSync() {
  try {
    console.log('Service Worker: Performing background sync');
    // Burada offline sırasında kaydedilen verileri senkronize edebilirsiniz
    // Örneğin: kullanıcı projelerini sunucuya gönderme
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Push notification eventi
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Yeni bir bildirim alındı',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Uygulamayı Aç',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Dinamik Kat Planı Çizici', options)
  );
});

// Notification click eventi
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message eventi - Ana thread ile iletişim
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Hata yakalama
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred:', event.error);
});

// Unhandled promise rejection yakalama
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('Service Worker: Script loaded successfully');
