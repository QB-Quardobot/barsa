/* Service Worker для кэширования статических ресурсов
   Версия: v2.0
   CACHING STRATEGY: Оптимизированные стратегии кэширования для максимальной производительности
   
   Стратегии:
   - HTML: Network-first с fallback к кэшу (для актуальности контента)
   - Static assets (images, fonts, CSS): Cache-first с stale-while-revalidate
   - JavaScript: Stale-while-revalidate (баланс между скоростью и актуальностью)
   - CDN resources: Cache-first с длительным TTL
*/

const SW_VERSION = 'v2.1';
const CACHE_NAME = `ai-model-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;
const STATIC_CACHE = `static-${SW_VERSION}`;
const CDN_CACHE = `cdn-${SW_VERSION}`;

// Максимальный размер кэша (в MB)
const MAX_CACHE_SIZE = 50; // 50MB

// TTL для разных типов ресурсов (в миллисекундах)
const CACHE_TTL = {
  HTML: 1 * 60 * 60 * 1000, // 1 час
  STATIC: 365 * 24 * 60 * 60 * 1000, // 1 год
  CDN: 7 * 24 * 60 * 60 * 1000, // 7 дней
  RUNTIME: 30 * 24 * 60 * 60 * 1000, // 30 дней
};

// Критические ресурсы для предзагрузки при установке
const PRECACHE_URLS = [
  '/',
  '/how-it-works/',
  '/fonts/inter-regular.woff2',
  '/fonts/inter-medium.woff2',
  '/fonts/inter-bold.woff2',
  '/income-proof-900.webp', // Hero image для LCP
];

/**
 * Проверка, не истек ли срок действия кэша
 */
function isCacheExpired(cachedResponse, ttl) {
  if (!cachedResponse) return true;
  
  const cachedDate = cachedResponse.headers.get('date');
  if (!cachedDate) return true;
  
  const cacheTime = new Date(cachedDate).getTime();
  const now = Date.now();
  
  return (now - cacheTime) > ttl;
}

/**
 * Очистка старых кэшей при превышении лимита
 */
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = [CACHE_NAME, RUNTIME_CACHE, STATIC_CACHE, CDN_CACHE];
    
    const deletePromises = cacheNames
      .filter(name => !currentCaches.includes(name))
      .map(name => {
        console.log('[SW] Deleting old cache:', name);
        return caches.delete(name);
      });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('[SW] Cache cleanup error:', error);
  }
}

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${SW_VERSION}...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical resources');
        // Используем addAll с обработкой ошибок для каждого URL
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to precache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        // Принудительная активация нового SW для немедленного обновления
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${SW_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      // Берем контроль над всеми клиентами немедленно
      self.clients.claim()
    ])
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
  
  // Пропускаем Service Worker и manifest (не кэшируем)
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.webmanifest') {
    return;
  }
  
  // HTML страницы - Network-first стратегия с fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          // Сначала пробуем сеть
          const networkResponse = await fetch(request);
          
          // Кэшируем успешные ответы
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return networkResponse;
        } catch (error) {
          // Fallback к кэшу если сеть недоступна
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Проверяем, не устарел ли кэш
            if (!isCacheExpired(cachedResponse, CACHE_TTL.HTML)) {
              return cachedResponse;
            }
          }
          
          // Fallback к главной странице
          const homePage = await caches.match('/');
          if (homePage) {
            return homePage;
          }
          
          // Последний fallback - offline страница (если есть)
          throw error;
        }
      })()
    );
    return;
  }
  
  // CDN ресурсы (Swiper, Telegram) - Cache-first с длительным TTL
  if (url.href.includes('cdn.jsdelivr.net') || 
      url.href.includes('unpkg.com') ||
      url.href.includes('telegram.org')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CDN_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Если есть свежий кэш, возвращаем его
        if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_TTL.CDN)) {
          // Обновляем кэш в фоне (stale-while-revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
          }).catch(() => {
            // Игнорируем ошибки сети
          });
          
          return cachedResponse;
        }
        
        // Если кэша нет или он устарел, загружаем из сети
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Если сеть недоступна, возвращаем устаревший кэш (если есть)
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })()
    );
    return;
  }
  
  // Изображения - Stale-while-revalidate стратегия
  if (request.destination === 'image' || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif|ico)$/i)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Обновляем кэш в фоне
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Игнорируем ошибки сети, используем кэш
        });
        
        // Возвращаем кэш если есть (даже если устарел), иначе ждем сеть
        return cachedResponse || fetchPromise;
      })()
    );
    return;
  }
  
  // Шрифты и CSS - Cache-first стратегия (immutable resources)
  if (request.destination === 'font' || 
      request.destination === 'style' ||
      url.pathname.match(/\.(css|woff|woff2|ttf|eot|otf)$/i)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Если кэша нет, загружаем из сети и кэшируем
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Если сеть недоступна и кэша нет, возвращаем ошибку
          throw error;
        }
      })()
    );
    return;
  }
  
  // JavaScript - Stale-while-revalidate стратегия
  if (request.destination === 'script' || 
      url.pathname.match(/\.js$/i)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Обновляем кэш в фоне
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Fallback к кэшу при ошибке
        });
        
        // Возвращаем кэш если есть, иначе ждем сеть
        return cachedResponse || fetchPromise;
      })()
    );
    return;
  }
  
  // Остальные ресурсы - Cache-first с fallback к сети
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        throw error;
      }
    })()
  );
});

// Периодическая очистка устаревших записей кэша
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});
