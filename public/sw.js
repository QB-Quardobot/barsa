/* Service Worker для кэширования статических ресурсов
   Версия: v1
   Стратегия: Stale-while-revalidate для статики, Network-first для HTML
*/

const CACHE_NAME = 'ai-model-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const STATIC_CACHE = 'static-cache-v1';

// Критические ресурсы для предзагрузки при установке
const PRECACHE_URLS = [
  '/',
  '/how-it-works/',
  '/fonts/inter-regular.woff2',
  '/fonts/inter-medium.woff2',
  '/fonts/inter-bold.woff2',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Принудительная активация нового SW
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые кэши
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Берем контроль над всеми клиентами
      return self.clients.claim();
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Пропускаем внешние запросы (кроме CDN ресурсов, которые мы хотим кэшировать)
  if (url.origin !== location.origin && 
      !url.href.includes('cdn.jsdelivr.net') &&
      !url.href.includes('telegram.org')) {
    return;
  }
  
  // HTML страницы - Network-first стратегия
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Кэшируем успешные ответы
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback к кэшу если сеть недоступна
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback к главной странице
            return caches.match('/');
          });
        })
    );
    return;
  }
  
  // Изображения - Stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Обновляем кэш в фоне
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Игнорируем ошибки сети, используем кэш
          });
          
          // Возвращаем кэш если есть, иначе ждем сеть
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Шрифты и CSS - Cache-first с fallback
  if (request.destination === 'font' || 
      request.destination === 'style' ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff2')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // JavaScript - Stale-while-revalidate для внешних скриптов
  if (request.destination === 'script' || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Fallback к кэшу при ошибке
          });
          
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Остальные ресурсы - пробуем кэш, затем сеть
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

