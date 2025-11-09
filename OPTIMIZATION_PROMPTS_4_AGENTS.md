# 🚀 ПРОМПТЫ ДЛЯ 4 АГЕНТОВ - ОПТИМИЗАЦИЯ И АНИМАЦИИ

## 📊 АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ САЙТА

### Технологический стек
- **Framework**: Astro 5.15.2
- **CSS**: Tailwind CSS 4.1.16
- **Слайдеры**: Swiper 11
- **Анимации**: Собственная система на IntersectionObserver

### Сильные стороны проекта
✅ Уже реализована система reveal анимаций через IntersectionObserver  
✅ Lazy loading изображений с shimmer эффектом  
✅ Адаптивные изображения с srcset  
✅ Оптимизация шрифтов (font-display: swap)  
✅ Семантическая HTML разметка  
✅ CSS переменные для дизайн-системы  
✅ Плавные градиентные фоны  

### Зоны для улучшения
⚠️ **Производительность:**
- Внешние CDN-зависимости (Swiper)
- Можно оптимизировать критический CSS
- Отсутствует Service Worker для PWA
- Нет preconnect для внешних ресурсов

⚠️ **Анимации:**
- Базовые reveal анимации (fade, up, scale)
- Отсутствуют продвинутые эффекты (stagger, parallax, морфинг)
- Нет анимации на взаимодействие (hover effects, micro-interactions)

⚠️ **SEO:**
- Базовая мета-оптимизация присутствует
- Можно улучшить Open Graph и Twitter Cards
- Отсутствует JSON-LD структурированная разметка

---

## 🤖 АГЕНТ #1: ТЕХНИЧЕСКАЯ ОПТИМИЗАЦИЯ И ПРОИЗВОДИТЕЛЬНОСТЬ

### Цель
Максимально повысить производительность сайта, достичь 95+ баллов в Google PageSpeed Insights, оптимизировать Core Web Vitals (LCP, FID, CLS).

### ПРОМПТ ДЛЯ АГЕНТА #1

```
Ты - эксперт по веб-производительности и оптимизации Astro-сайтов. 

КОНТЕКСТ:
- Проект на Astro 5.15.2 + Tailwind CSS 4.1.16
- Две основные страницы: index.astro и how-it-works.astro
- Использует Swiper через CDN
- Уже реализован lazy loading изображений
- Базовая оптимизация шрифтов есть

ТВОИ ЗАДАЧИ:

1. **КРИТИЧЕСКИЙ CSS**
   - Выдели критический CSS для above-the-fold контента
   - Создай inline critical CSS для первого экрана
   - Отложи загрузку некритического CSS
   - Используй media="print" onload="this.media='all'" технику

2. **ОПТИМИЗАЦИЯ ЗАГРУЗКИ РЕСУРСОВ**
   - Добавь preconnect для внешних доменов:
     ```html
     <link rel="preconnect" href="https://cdn.jsdelivr.net">
     <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
     ```
   - Реализуй preload для критических ресурсов (шрифты, hero image)
   - Оптимизируй порядок загрузки скриптов (defer vs async)

3. **УЛУЧШЕНИЕ ИЗОБРАЖЕНИЙ**
   - Проверь, что все изображения используют современные форматы (WebP)
   - Добавь size hints (width/height) для всех изображений (борьба с CLS)
   - Реализуй progressive image loading с placeholder blur
   - Используй fetchpriority="high" для hero изображения

4. **JAVASCRIPT ОПТИМИЗАЦИЯ**
   - Минимизируй использование external libraries
   - Реализуй code splitting для крупных модулей
   - Добавь tree shaking для неиспользуемого кода
   - Переведи Swiper на нативную CSS Scroll Snap (если возможно)

5. **CACHING СТРАТЕГИЯ**
   - Настрой Service Worker для offline-работы
   - Реализуй кэширование статических ресурсов
   - Добавь stale-while-revalidate стратегию
   - Настрой правильные Cache-Control заголовки

6. **ASTRO-СПЕЦИФИЧНАЯ ОПТИМИЗАЦИЯ**
   - Используй Astro Islands для изоляции интерактивности
   - Примени client:load, client:visible, client:idle директивы стратегически
   - Оптимизируй SSR/SSG стратегию
   - Минимизируй JavaScript bundle через парциальную гидратацию

7. **CORE WEB VITALS**
   - LCP < 2.5s: оптимизируй hero изображение и critical path
   - FID < 100ms: минимизируй JavaScript на главном потоке
   - CLS < 0.1: фиксируй размеры всех динамических элементов
   - INP < 200ms: оптимизируй обработчики событий

РЕЗУЛЬТАТ:
- Детальный отчет с метриками до/после
- Конкретные изменения в коде
- Настройки astro.config.mjs для production
- Рекомендации по серверной конфигурации
```

### Конкретные рекомендации для реализации

#### 1. Создать `astro.config.optimized.mjs`:
```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://illariooo.ru',
  output: 'static',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'swiper': ['swiper'],
          },
        },
      },
    },
    server: {
      host: true,
      allowedHosts: ['.trycloudflare.com', '.ngrok.io', '.localhost']
    }
  },
  experimental: {
    contentCollectionCache: true,
  }
});
```

#### 2. Критический CSS для above-the-fold
```css
/* critical-inline.css - вставить в <head> */
:root{--bg:#0a0a0a;--panel:#0d0d10;--fg:#f5f5f5;--primary:#60a5fa}
body{background:#0a0a0a;color:#f5f5f5;font-family:Inter,system-ui,sans-serif;line-height:1.5}
.hero-section{min-height:100vh;display:flex;align-items:center}
/* ... только критические стили для первого экрана */
```

#### 3. Preload ресурсов в `<head>`:
```html
<!-- Критические шрифты -->
<link rel="preload" href="/fonts/inter-bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-medium.woff2" as="font" type="font/woff2" crossorigin>

<!-- Hero изображение -->
<link rel="preload" as="image" href="/income-proof-600.webp" imagesrcset="/income-proof-600.webp 600w, /income-proof-900.webp 900w" imagesizes="100vw" fetchpriority="high">

<!-- Внешние ресурсы -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
```

#### 4. Service Worker для PWA:
```javascript
// sw.js
const CACHE_NAME = 'ai-model-v1';
const RUNTIME_CACHE = 'runtime-cache';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/how-it-works/',
        '/fonts/inter-bold.woff2',
        '/fonts/inter-medium.woff2',
        '/fonts/inter-regular.woff2',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate для изображений
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
```

---

## 🎨 АГЕНТ #2: SEO И МЕТА-ОПТИМИЗАЦИЯ

### Цель
Максимально улучшить видимость сайта в поисковых системах, социальных сетях и мессенджерах.

### ПРОМПТ ДЛЯ АГЕНТА #2

```
Ты - эксперт по SEO-оптимизации и семантической разметке сайтов.

КОНТЕКСТ:
- Лендинг для продажи курса по AI-моделям
- Целевая аудитория: молодые люди 18-30 лет, интересующиеся заработком онлайн
- Две страницы: главная (лид-магнит) и "Как это работает" (подробная информация)
- Важные ключевые фразы: "заработок на AI-моделях", "AI Model 2.0", "создание AI-модели"

ТВОИ ЗАДАЧИ:

1. **СТРУКТУРИРОВАННАЯ РАЗМЕТКА (JSON-LD)**
   Создай Schema.org разметку для:
   - WebPage (основная информация о странице)
   - Course (информация о курсе)
   - Organization (информация об авторе/компании)
   - Product (тарифные планы)
   - Review (отзывы учеников)
   - FAQPage (блок вопросов-ответов)
   - BreadcrumbList (хлебные крошки для второй страницы)

2. **OPEN GRAPH & TWITTER CARDS**
   Оптимизируй мета-теги для соцсетей:
   ```html
   <!-- Open Graph -->
   <meta property="og:type" content="website">
   <meta property="og:title" content="[оптимизированный заголовок]">
   <meta property="og:description" content="[цепляющее описание 150-160 символов]">
   <meta property="og:image" content="[URL изображения 1200x630]">
   <meta property="og:image:width" content="1200">
   <meta property="og:image:height" content="630">
   <meta property="og:url" content="https://illariooo.ru">
   <meta property="og:site_name" content="AI Model 2.0">
   <meta property="og:locale" content="ru_RU">
   
   <!-- Twitter Cards -->
   <meta name="twitter:card" content="summary_large_image">
   <meta name="twitter:title" content="[заголовок для Twitter]">
   <meta name="twitter:description" content="[описание]">
   <meta name="twitter:image" content="[URL изображения]">
   
   <!-- Telegram Preview -->
   <meta property="telegram:channel" content="@channel_name">
   ```

3. **СЕМАНТИЧЕСКАЯ HTML-РАЗМЕТКА**
   - Убедись в правильной иерархии заголовков (H1->H2->H3)
   - Добавь ARIA-атрибуты для улучшения доступности
   - Используй семантические теги (<article>, <section>, <nav>, <aside>)
   - Добавь микроразметку для цен, отзывов, рейтингов

4. **ОПТИМИЗАЦИЯ МЕТА-ТЕГОВ**
   Для главной страницы:
   - Title: 50-60 символов, включает основные keywords
   - Description: 150-160 символов, содержит CTA
   - Keywords: релевантные ключевые слова (10-15 шт)
   
   Для страницы "Как это работает":
   - Title: более информативный, с long-tail keywords
   - Description: описание пошаговой системы
   - Canonical URL для избежания дублей

5. **ROBOTS.TXT И SITEMAP.XML**
   - Проверь актуальность robots.txt
   - Оптимизируй sitemap.xml (приоритеты, частота обновления)
   - Добавь ссылку на sitemap в robots.txt
   - Настрой правильные директивы для ботов

6. **ВНУТРЕННЯЯ ПЕРЕЛИНКОВКА**
   - Создай логичную структуру внутренних ссылок
   - Используй якорные ссылки с правильным anchor text
   - Добавь breadcrumbs для улучшения навигации
   - Реализуй "хлебные крошки" для второй страницы

7. **LIGHTHOUSE SEO AUDIT**
   Убедись что все пункты проходят проверку:
   - ✅ Valid HTML (без критических ошибок)
   - ✅ Мета-описание уникально и полезно
   - ✅ Title оптимизирован
   - ✅ Все изображения имеют alt атрибуты
   - ✅ Все ссылки описательные (не "кликни здесь")
   - ✅ robots.txt правильно настроен
   - ✅ Страница имеет корректные <link rel="canonical">

8. **ЛОКАЛЬНАЯ SEO (если применимо)**
   - Добавь LocalBusiness разметку
   - Укажи регион таргетинга
   - Добавь мультиязычность (hreflang) при необходимости

РЕЗУЛЬТАТ:
- Готовые JSON-LD схемы для вставки в <head>
- Оптимизированные мета-теги для обеих страниц
- Рекомендации по контенту (ключевые слова, заголовки)
- Чек-лист для SEO-аудита
- Прогноз улучшения позиций в поисковой выдаче
```

### Пример реализации JSON-LD для главной страницы:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://illariooo.ru/#webpage",
      "url": "https://illariooo.ru/",
      "name": "AI Model 2.0 - Заработок $500-$2500 на AI-моделях",
      "description": "Пошаговая система заработка на AI-моделях без команды, без лица и без вложений. Курс от Ilya Che.",
      "inLanguage": "ru-RU",
      "isPartOf": {
        "@id": "https://illariooo.ru/#website"
      }
    },
    {
      "@type": "Course",
      "name": "AI Model 2.0",
      "description": "Полная система создания и монетизации AI-моделей",
      "provider": {
        "@type": "Organization",
        "name": "Ilya Che",
        "url": "https://illariooo.ru"
      },
      "offers": [
        {
          "@type": "Offer",
          "price": "250",
          "priceCurrency": "EUR",
          "name": "Тариф 1 - Самостоятельный",
          "description": "Полная база обучения для самостоятельного запуска",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "price": "600",
          "priceCurrency": "EUR",
          "name": "Тариф 2 - Все и сразу",
          "description": "Расширенное обучение + поддержка + чат",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "price": "5000",
          "priceCurrency": "EUR",
          "name": "Тариф 3 - Личное ведение",
          "description": "Персональное наставничество 2 месяца",
          "availability": "https://schema.org/InStock"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "150",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Какие нужны вложения помимо обучения?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "До 50 $ — на генерацию фото и видео твоей модели."
          }
        },
        {
          "@type": "Question",
          "name": "Это сложно? Я смогу сам создать модель?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Нет! Ученики без опыта создают свою первую AI-модель уже в первый день обучения. Все пошагово: просто повторяешь за мной."
          }
        }
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://illariooo.ru/#organization",
      "name": "AI Model 2.0 by Ilya Che",
      "url": "https://illariooo.ru",
      "logo": {
        "@type": "ImageObject",
        "url": "https://illariooo.ru/og.jpg",
        "width": 1200,
        "height": 630
      },
      "founder": {
        "@type": "Person",
        "name": "Ilya Che",
        "jobTitle": "Эксперт по AI-моделям"
      }
    }
  ]
}
</script>
```

---

## ✨ АГЕНТ #3: КРАСИВЫЕ REVEAL АНИМАЦИИ ДЛЯ ВТОРОЙ СТРАНИЦЫ

### Цель
Создать WOW-эффект на странице "Как это работает" с помощью современных, плавных и производительных анимаций. **НЕ ТРОГАТЬ блок "Как это работает" (how-it-works-section)!**

### ПРОМПТ ДЛЯ АГЕНТА #3

```
Ты - эксперт по веб-анимациям и motion design. Специализируешься на создании производительных, красивых анимаций для современных сайтов.

КОНТЕКСТ:
- Страница: /how-it-works/
- Уже есть базовая система reveal анимаций через IntersectionObserver
- Текущие анимации: reveal-up, reveal-scale, reveal-fade
- Стиль сайта: современный, tech, с градиентами (#60a5fa, #22d3ee)
- Фоновый градиент с анимацией

⚠️ ВАЖНО: НЕ ТРОГАЙ блок .how-it-works-section (строки 101-262 в how-it-works.astro)
Этот блок уже оптимизирован и работает отлично!

ТВОИ ЗАДАЧИ:

1. **РАСШИРИТЬ БИБЛИОТЕКУ REVEAL АНИМАЦИЙ**
   Создай новые reveal классы:
   
   A. reveal-slide-left / reveal-slide-right (плавное появление сбоку)
   B. reveal-blur (появление с размытием)
   C. reveal-rotate (появление с лёгким поворотом)
   D. reveal-bounce (появление с пружинистым эффектом)
   E. reveal-stagger (последовательное появление дочерних элементов)
   F. reveal-parallax (parallax эффект при скролле)
   G. reveal-morph (морфинг формы элемента)
   H. reveal-glow (появление со свечением)

2. **STAGGER ANIMATIONS**
   Реализуй каскадное появление элементов:
   ```css
   .reveal-stagger > * {
     transition-delay: calc(var(--stagger-index, 0) * 100ms);
   }
   ```
   
   Примени к:
   - Pricing cards (тарифы) - появляются последовательно
   - FAQ items - плавное раскрытие вопросов
   - Testimonials grid - каскадное появление отзывов
   - Format cards (тренер, бьюти-блогер, и тд)

3. **ПАРАЛЛАКС ЭФФЕКТЫ**
   Добавь тонкие parallax эффекты для:
   - Hero section - фоновые элементы двигаются медленнее
   - Pricing section - карточки с лёгким 3D эффектом
   - Photo elements - изображения с depth эффектом
   
   Используй CSS transform3d для производительности:
   ```css
   .parallax-layer {
     transform: translate3d(0, calc(var(--scroll-y) * 0.3), 0);
     will-change: transform;
   }
   ```

4. **HOVER & INTERACTION ANIMATIONS**
   Микро-анимации при наведении:
   - Pricing cards - подъём и свечение при hover
   - CTA buttons - пульсация и расширение
   - Images - лёгкий zoom эффект
   - FAQ questions - плавное изменение цвета
   
   Пример для кнопок:
   ```css
   .btn-capsule {
     transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   .btn-capsule:hover {
     transform: translateY(-2px) scale(1.02);
     box-shadow: 0 12px 40px rgba(96, 165, 250, 0.4);
   }
   ```

5. **LOADING STATES & SKELETON SCREENS**
   Улучши shimmer эффект для загрузки изображений:
   ```css
   @keyframes shimmer-flow {
     0% {
       background-position: -1000px 0;
     }
     100% {
       background-position: 1000px 0;
     }
   }
   
   .shimmer-overlay {
     background: linear-gradient(
       90deg,
       rgba(255,255,255,0) 0%,
       rgba(255,255,255,0.1) 20%,
       rgba(255,255,255,0.2) 50%,
       rgba(255,255,255,0.1) 80%,
       rgba(255,255,255,0) 100%
     );
     background-size: 1000px 100%;
     animation: shimmer-flow 2s linear infinite;
   }
   ```

6. **SCROLL-TRIGGERED COUNTERS**
   Анимированные счётчики для статистики:
   - "150+ учеников" - число появляется с анимацией счёта
   - "100% легальность"
   - "0$ на рекламу"
   
   ```javascript
   function animateCounter(element, target, duration = 2000) {
     let start = 0;
     const increment = target / (duration / 16);
     const timer = setInterval(() => {
       start += increment;
       element.textContent = Math.floor(start);
       if (start >= target) {
         element.textContent = target;
         clearInterval(timer);
       }
     }, 16);
   }
   ```

7. **GRADIENT ANIMATIONS**
   Анимированные градиенты для выделенных блоков:
   ```css
   .gradient-text {
     background: linear-gradient(
       90deg,
       #60a5fa 0%,
       #22d3ee 50%,
       #60a5fa 100%
     );
     background-size: 200% auto;
     -webkit-background-clip: text;
     -webkit-text-fill-color: transparent;
     animation: gradient-shift 3s ease infinite;
   }
   
   @keyframes gradient-shift {
     0%, 100% { background-position: 0% 50%; }
     50% { background-position: 100% 50%; }
   }
   ```

8. **CURSOR FOLLOW EFFECTS** (для desktop)
   Элементы реагируют на движение курсора:
   ```javascript
   document.addEventListener('mousemove', (e) => {
     const cards = document.querySelectorAll('.pricing-card');
     cards.forEach(card => {
       const rect = card.getBoundingClientRect();
       const x = e.clientX - rect.left - rect.width / 2;
       const y = e.clientY - rect.top - rect.height / 2;
       
       card.style.transform = `
         perspective(1000px)
         rotateY(${x / 50}deg)
         rotateX(${-y / 50}deg)
         scale3d(1.02, 1.02, 1.02)
       `;
     });
   });
   ```

9. **SECTION-SPECIFIC ANIMATIONS**
   
   **Two Paths Section:**
   - Карточки появляются с противоположных сторон
   - Лёгкое покачивание при hover
   
   **Alternative Content Section:**
   - Format cards появляются с stagger эффектом
   - Иконки пульсируют при входе в viewport
   
   **About Ilya Section:**
   - Фото с parallax эффектом
   - Текст появляется построчно с задержкой
   
   **Before/After Section:**
   - Split-screen reveal эффект
   - Карточки появляются с flip анимацией
   
   **Difference Section:**
   - Animated gradient background
   - Trends visualization с анимацией заполнения баров
   
   **Comparison Section (Live vs AI):**
   - Карточки с 3D flip эффектом
   - VS divider с пульсацией
   
   **Pricing Section:**
   - Популярная карточка с glow эффектом
   - Buttons с ripple эффектом при клике
   
   **Reviews Section:**
   - Slider items с плавным fade
   - Statistics counter animation
   - Model gallery с hover zoom
   
   **Era Section:**
   - Text reveal построчно
   - Quote с typewriter эффектом (опционально)
   
   **FAQ Section:**
   - Accordion с smooth expand/collapse
   - Icons rotate при открытии
   
   **Final CTA:**
   - Pulsating attention-grabber
   - Button с magnetic effect (притягивается к курсору)

10. **PERFORMANCE OPTIMIZATION**
    Все анимации должны использовать:
    - `transform` и `opacity` (GPU-accelerated properties)
    - `will-change` только когда активно
    - `requestAnimationFrame` для JS анимаций
    - Проверка `prefers-reduced-motion`
    - Passive event listeners где возможно
    
    ```css
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```

11. **ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩЕЙ СИСТЕМОЙ**
    - Расширь класс RevealAnimations в src/lib/reveal.ts
    - Добавь новые типы анимаций в handleIntersection
    - Сохрани совместимость с fast-scroll режимом
    - Используй существующий IntersectionObserver

РЕЗУЛЬТАТ:
- Расширенный CSS файл с новыми анимациями (animations-extended.css)
- Обновлённый reveal.ts с поддержкой новых эффектов
- Примеры применения анимаций для каждой секции
- Performance report (FPS во время анимаций)
- Видео-демонстрация (опционально)

СТИЛЕВЫЕ РЕФЕРЕНСЫ:
- Apple website transitions (плавные, минималистичные)
- Stripe landing page (микро-интеракции)
- Awwwards winning sites (креативные эффекты)
- Linear app (современные, быстрые)

ВАЖНО:
❌ Не перегружай страницу анимациями
✅ Каждая анимация должна иметь цель
✅ Все эффекты должны быть тонкими и элегантными
✅ Производительность > красота (60 FPS обязательно)
```

### Пример реализации расширенных анимаций:

**animations-extended.css:**
```css
/* ============================================
   EXTENDED REVEAL ANIMATIONS
   ============================================ */

/* === Slide Animations === */
.reveal-slide-left {
  opacity: 0;
  transform: translateX(-80px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-slide-left.is-revealed {
  opacity: 1;
  transform: translateX(0);
}

.reveal-slide-right {
  opacity: 0;
  transform: translateX(80px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-slide-right.is-revealed {
  opacity: 1;
  transform: translateX(0);
}

/* === Blur Reveal === */
.reveal-blur {
  opacity: 0;
  filter: blur(10px);
  transform: scale(0.98);
  transition: opacity 0.5s ease-out,
              filter 0.5s ease-out,
              transform 0.5s ease-out;
}

.reveal-blur.is-revealed {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}

/* === Rotate Reveal === */
.reveal-rotate {
  opacity: 0;
  transform: rotateY(15deg) rotateX(5deg);
  transform-style: preserve-3d;
  transition: opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.reveal-rotate.is-revealed {
  opacity: 1;
  transform: rotateY(0) rotateX(0);
}

/* === Bounce Reveal === */
.reveal-bounce {
  opacity: 0;
  transform: scale(0.3);
  transition: opacity 0.4s ease-out,
              transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.reveal-bounce.is-revealed {
  opacity: 1;
  transform: scale(1);
}

/* === Glow Reveal === */
.reveal-glow {
  opacity: 0;
  filter: brightness(0.5);
  box-shadow: 0 0 0 rgba(96, 165, 250, 0);
  transition: opacity 0.5s ease-out,
              filter 0.5s ease-out,
              box-shadow 0.5s ease-out;
}

.reveal-glow.is-revealed {
  opacity: 1;
  filter: brightness(1);
  box-shadow: 0 0 30px rgba(96, 165, 250, 0.3);
}

/* === Stagger Animation === */
.reveal-stagger {
  opacity: 1;
}

.reveal-stagger > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out,
              transform 0.5s ease-out;
  transition-delay: calc(var(--stagger-delay, 0) * 80ms);
}

.reveal-stagger.is-revealed > * {
  opacity: 1;
  transform: translateY(0);
}

/* === Parallax === */
.parallax-layer {
  will-change: transform;
  transition: transform 0.1s ease-out;
}

/* === Enhanced Hover Effects === */
.pricing-card {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pricing-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(96, 165, 250, 0.3);
}

.pricing-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(96, 165, 250, 0) 0%,
    rgba(96, 165, 250, 0.1) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: inherit;
}

.pricing-card:hover::before {
  opacity: 1;
}

/* === Button Animations === */
.btn-capsule {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-capsule::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-capsule:hover::before {
  width: 300px;
  height: 300px;
}

.btn-capsule:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 12px 40px rgba(96, 165, 250, 0.5);
}

.btn-capsule:active {
  transform: translateY(0) scale(0.98);
}

/* === Image Hover Zoom === */
.image-wrapper {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.image-wrapper img {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-wrapper:hover img {
  transform: scale(1.05);
}

/* === FAQ Accordion Enhanced === */
.faq-question {
  transition: all 0.3s ease;
}

.faq-question:hover {
  background: rgba(96, 165, 250, 0.05);
  padding-left: calc(var(--spacing-md) + 4px);
}

.faq-question .question-icon {
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.faq-question[aria-expanded="true"] .question-icon {
  transform: rotate(45deg);
}

/* === Gradient Shimmer === */
@keyframes gradient-shimmer {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.gradient-text-animated {
  background: linear-gradient(
    90deg,
    #60a5fa 0%,
    #22d3ee 25%,
    #60a5fa 50%,
    #22d3ee 75%,
    #60a5fa 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shimmer 4s ease infinite;
}

/* === Counter Animation === */
@keyframes count-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.stat-number {
  display: inline-block;
  overflow: hidden;
}

.stat-number.is-counting span {
  display: inline-block;
  animation: count-up 0.3s ease-out;
}

/* === Pulse Animation for Badges === */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(96, 165, 250, 0.6);
  }
}

.popular-badge {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* === VS Divider Animation === */
@keyframes vs-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.vs-text {
  animation: vs-pulse 2s ease-in-out infinite;
}

/* === Enhanced Shimmer for Images === */
@keyframes shimmer-wave {
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
  }
}

.shimmer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 20%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.1) 80%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer-wave 2s linear infinite;
  pointer-events: none;
}

.lazy-image.loaded + .shimmer-overlay {
  animation: none;
  opacity: 0;
}

/* === Reduced Motion Support === */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* === Performance Optimization === */
.reveal-slide-left,
.reveal-slide-right,
.reveal-blur,
.reveal-rotate,
.reveal-bounce,
.reveal-glow {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* Используем will-change только для активных анимаций */
.is-animating {
  will-change: transform, opacity;
}

.is-animating.animation-complete {
  will-change: auto;
}
```

**reveal-extended.ts (расширение для reveal.ts):**
```typescript
// Добавить в класс RevealAnimations

private animateStagger(element: HTMLElement) {
  const children = element.children;
  Array.from(children).forEach((child, index) => {
    (child as HTMLElement).style.setProperty('--stagger-delay', index.toString());
  });
}

private animateCounter(element: HTMLElement) {
  const target = parseInt(element.dataset.counterTarget || '0');
  const duration = parseInt(element.dataset.counterDuration || '2000');
  
  let start = 0;
  const increment = target / (duration / 16);
  
  const timer = setInterval(() => {
    start += increment;
    element.textContent = Math.floor(start).toString();
    
    if (start >= target) {
      element.textContent = target.toString();
      clearInterval(timer);
      element.classList.remove('is-counting');
    }
  }, 16);
}

private setupParallax() {
  let ticking = false;
  let scrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        const parallaxElements = document.querySelectorAll('.parallax-layer');
        
        parallaxElements.forEach((el) => {
          const speed = parseFloat((el as HTMLElement).dataset.parallaxSpeed || '0.3');
          const yPos = -(scrollY * speed);
          (el as HTMLElement).style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
        
        ticking = false;
      });
      
      ticking = true;
    }
  }, { passive: true });
}

// Добавить в constructor
constructor(options?: RevealOptions) {
  this.options = { ...this.options, ...options };
  this.trackScrollVelocity();
  this.init();
  this.setupParallax(); // Новое
}

// Обновить handleIntersection для поддержки новых типов
private handleIntersection(entries: IntersectionObserverEntry[]) {
  requestAnimationFrame(() => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        
        if (element.classList.contains('is-revealed')) {
          return;
        }
        
        // Stagger animation
        if (element.classList.contains('reveal-stagger')) {
          this.animateStagger(element);
        }
        
        // Counter animation
        if (element.classList.contains('stat-number') && element.dataset.counterTarget) {
          element.classList.add('is-counting');
          this.animateCounter(element);
        }
        
        // Fast scroll handling
        if (this.isFastScrolling) {
          element.style.transition = 'none';
          element.style.opacity = '1';
          element.style.transform = 'none';
          element.classList.add('is-revealed');
          
          setTimeout(() => {
            element.style.transition = '';
            element.style.willChange = 'auto';
          }, 100);
        } else {
          element.style.willChange = 'opacity, transform';
          element.offsetHeight;
          element.classList.add('is-revealed');
          element.classList.add('is-animating');
          
          setTimeout(() => {
            element.style.willChange = 'auto';
            element.classList.remove('is-animating');
            element.classList.add('animation-complete');
          }, 600);
        }
        
        if (this.options.once) {
          this.observer?.unobserve(element);
          if (this.prerenderObserver) {
            this.prerenderObserver.unobserve(element);
          }
        }
      }
    });
  });
}
```

**Примеры применения в how-it-works.astro:**

```html
<!-- Two Paths Section - карточки появляются с разных сторон -->
<div class="paths-ladder">
  <div class="path-card path-card-1 reveal-slide-left">
    <!-- content -->
  </div>
  
  <div class="path-card path-card-2 reveal-slide-right">
    <!-- content -->
  </div>
</div>

<!-- Alternative Content - stagger effect для format cards -->
<div class="formats-grid reveal-stagger">
  <div class="format-card reveal-bounce">
    <div class="format-icon-wrapper">
      <div class="format-icon">💪</div>
    </div>
    <h3 class="format-title">Тренер</h3>
  </div>
  <!-- ... остальные карточки ... -->
</div>

<!-- Pricing Section - enhanced hover effects -->
<div class="pricing-grid reveal-scale">
  <div class="pricing-card reveal-glow">
    <!-- content -->
  </div>
  
  <div class="pricing-card pricing-card-popular reveal-glow">
    <div class="popular-badge">⭐ Самый популярный</div>
    <!-- content -->
  </div>
  
  <div class="pricing-card reveal-glow">
    <!-- content -->
  </div>
</div>

<!-- Stats Block with animated counters -->
<div class="stats-block reveal-up">
  <div class="stat-item">
    <div class="stat-number gradient-text-animated" data-counter-target="150" data-counter-duration="2000">0</div>
    <div class="stat-label">учеников с первыми продажами</div>
  </div>
  <!-- ... -->
</div>

<!-- About Ilya Section with parallax -->
<div class="ilya-photo-wrapper image-wrapper reveal-scale parallax-layer" data-parallax-speed="0.2">
  <div class="shimmer-wrapper">
    <img 
      src="/images/ilya-photo.png"
      alt="Ilya Che"
      class="ilya-photo lazy-image"
      loading="lazy"
    />
    <div class="shimmer-overlay"></div>
  </div>
</div>

<!-- Comparison Section with rotate effect -->
<div class="comparison-ladder reveal-scale">
  <div class="comparison-card live-model-card reveal-rotate">
    <!-- content -->
  </div>
  
  <div class="vs-divider reveal-fade">
    <span class="vs-text">VS</span>
  </div>
  
  <div class="comparison-card ai-model-card reveal-rotate">
    <!-- content -->
  </div>
</div>
```

---

## 🎯 АГЕНТ #4: UX/UI УЛУЧШЕНИЯ И ТЕСТИРОВАНИЕ

### Цель
Обеспечить идеальный пользовательский опыт, доступность и кросс-браузерную совместимость.

### ПРОМПТ ДЛЯ АГЕНТА #4

```
Ты - эксперт по UX/UI дизайну, доступности (a11y) и кросс-браузерному тестированию.

КОНТЕКСТ:
- Лендинг для продажи курса AI Model 2.0
- Две страницы: главная (/) и "Как это работает" (/how-it-works/)
- Целевая аудитория: молодые люди 18-30 лет
- Устройства: 70% mobile, 25% desktop, 5% tablet
- Основные браузеры: Chrome, Safari, Firefox, Telegram WebApp

ТВОИ ЗАДАЧИ:

1. **ACCESSIBILITY AUDIT (WCAG 2.1 AA)**
   
   A. Keyboard Navigation:
   - Все интерактивные элементы доступны через Tab
   - Видимый focus indicator
   - Skip to content ссылка
   - Логичный порядок табуляции
   
   B. Screen Reader Support:
   - ARIA labels для всех кнопок и ссылок
   - Alt text для изображений описательный и полезный
   - Правильная семантика heading structure (h1->h2->h3)
   - aria-live regions для динамического контента
   
   C. Color Contrast:
   - Контраст текста минимум 4.5:1 (AA)
   - Контраст UI элементов минимум 3:1
   - Тестирование с различными типами цветовой слепоты
   
   D. Responsive Design:
   - Touch targets минимум 44x44px (WCAG guidelines)
   - Текст читаем без зума (min 16px base font)
   - Контент доступен в portrait и landscape ориентации
   
   E. Motion & Animations:
   - Респект для prefers-reduced-motion
   - Возможность отключить автоплей
   - Анимации не мешают чтению контента

2. **MOBILE UX ОПТИМИЗАЦИЯ**
   
   A. Touch Interactions:
   - Swipe gestures для слайдеров интуитивные
   - Pull-to-refresh не конфликтует со скроллом
   - Proper touch feedback (тактильная обратная связь)
   - Защита от случайных кликов
   
   B. Performance:
   - Lazy loading для off-screen контента
   - Оптимизированные изображения для мобильных сетей
   - Skeleton screens для улучшения perceived performance
   - Минимальный JavaScript на главном потоке
   
   C. Mobile-specific Features:
   - Tap-to-call для телефонных номеров (если есть)
   - Smooth scroll anchors
   - Sticky CTA button (не перекрывающий контент)
   - iOS Safari meta tags (viewport, apple-touch-icon)
   
   D. Form Optimization:
   - Правильные input types (email, tel, url)
   - Autofocus на первое поле (осторожно на мобайле)
   - Clear validation messages
   - Submit buttons always accessible

3. **TELEGRAM WEBAPP ОПТИМИЗАЦИЯ**
   
   - Интеграция с Telegram WebApp API
   - BackButton handling
   - MainButton для CTAs
   - HapticFeedback для обратной связи
   - Theme colors из Telegram
   - Правильная инициализация и expand()
   - Disable vertical swipes для предотвращения закрытия

4. **LOADING & ERROR STATES**
   
   A. Loading States:
   - Skeleton screens для контента
   - Spinner/progress indicators для действий
   - Optimistic UI updates где возможно
   - Timeout handling (что если загрузка >10сек?)
   
   B. Error States:
   - User-friendly error messages (не tech жаргон)
   - Retry mechanisms
   - Graceful degradation (fallback для неподдерживаемых фич)
   - 404 страница с навигацией
   
   C. Empty States:
   - Понятные сообщения когда данных нет
   - Подсказки что делать дальше
   - Визуально привлекательно

5. **INTERACTIVE ELEMENTS POLISH**
   
   A. Buttons:
   - Hover, active, focus, disabled states
   - Loading state (spinner в кнопке)
   - Success/error feedback после action
   - Proper cursor (pointer vs default)
   
   B. Links:
   - Отличаются от обычного текста
   - Hover underline или color change
   - External links с иконкой (опционально)
   - Visited links с другим цветом (для информационных страниц)
   
   C. Modals:
   - Backdrop blur
   - Close на Escape, backdrop click, close button
   - Trap focus внутри модала
   - Restore focus после закрытия
   - Body scroll lock когда модал открыт
   
   D. FAQ Accordion:
   - Smooth expand/collapse
   - Icon rotation
   - Only one open at a time vs multiple
   - Deep linking к открытому вопросу (опционально)

6. **CROSS-BROWSER TESTING**
   
   Тестируй на:
   - Chrome (latest, latest-1)
   - Firefox (latest, latest-1)
   - Safari (latest on macOS/iOS)
   - Edge (latest)
   - Samsung Internet (Android)
   - Telegram WebApp (iOS/Android)
   
   Проверь:
   - CSS Grid/Flexbox layout
   - CSS Custom Properties (--variables)
   - IntersectionObserver API
   - Fetch API
   - CSS Animations/Transitions
   - WebP image support (fallback)
   - Smooth scroll behavior

7. **PERFORMANCE TESTING**
   
   A. Metrics to Track:
   - First Contentful Paint (FCP) < 1.8s
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1
   - Interaction to Next Paint (INP) < 200ms
   - Time to Interactive (TTI) < 3.8s
   
   B. Tools to Use:
   - Lighthouse (в Chrome DevTools)
   - WebPageTest.org
   - PageSpeed Insights
   - Chrome User Experience Report
   - Real User Monitoring (если настроен)
   
   C. Test Conditions:
   - Fast 3G network throttling
   - CPU throttling (4x slowdown)
   - Various device emulation (low-end Android)

8. **USABILITY TESTING CHECKLIST**
   
   A. Navigation:
   - [ ] Пользователь понимает где он находится
   - [ ] Легко вернуться на главную
   - [ ] CTA buttons очевидны и заметны
   - [ ] Breadcrumbs (если многостраничник)
   
   B. Content:
   - [ ] Заголовки понятны и описательны
   - [ ] Параграфы не слишком длинные (max 3-4 строки)
   - [ ] Важная информация выделена
   - [ ] Без орфографических ошибок
   - [ ] Consistent tone of voice
   
   C. CTAs:
   - [ ] Каждая секция имеет clear next step
   - [ ] Button copy action-oriented ("Получить доступ" vs "Нажми сюда")
   - [ ] Контрастируют с фоном
   - [ ] Достаточно большие для тача
   
   D. Forms (если есть):
   - [ ] Labels ясны
   - [ ] Required fields отмечены
   - [ ] Validation в реальном времени
   - [ ] Success message после отправки
   - [ ] Privacy policy ссылка видна
   
   E. Images:
   - [ ] Не растянуты/сжаты
   - [ ] Имеют правильный aspect ratio
   - [ ] Loading states (skeleton/blur)
   - [ ] Fallback если не загрузились

9. **EDGE CASES & ERROR HANDLING**
   
   - Что если JavaScript отключен? (Graceful degradation)
   - Что если WebP не поддерживается? (Fallback к JPG)
   - Что если IntersectionObserver не доступен? (Показать все immediately)
   - Что если сеть медленная? (Skeleton screens, retry buttons)
   - Что если viewport очень узкий (< 320px)? (Still readable)
   - Что если очень широкий (> 2560px)? (Max-width containers)
   - Что если пользователь сильно зумит? (Content не ломается)
   - Что если вкладка неактивна долго? (Refresh data при возврате)

10. **КАЧЕСТВО КОДА**
    
    A. HTML:
    - Валидный HTML5
    - Семантические теги
    - Proper document outline
    - No duplicate IDs
    
    B. CSS:
    - No unused styles
    - Consistent naming (BEM или другая методология)
    - Responsive без хардкодных breakpoints
    - Логическая группировка
    
    C. JavaScript:
    - No console errors
    - Proper error handling (try/catch)
    - Memory leaks check (event listeners cleanup)
    - No blocking main thread

11. **SECURITY CHECKLIST**
    
    - [ ] HTTPS everywhere
    - [ ] No sensitive data in URLs
    - [ ] Content Security Policy headers
    - [ ] XSS protection
    - [ ] No inline event handlers (onclick="...")
    - [ ] External links с rel="noopener noreferrer"

12. **FINАЛЬНОЕ ТЕСТИРОВАНИЕ**
    
    A. Manual Testing:
    - Пройди весь user journey как реальный пользователь
    - Попробуй сломать интерфейс (rapid clicking, weird inputs)
    - Тестируй на реальных устройствах, не только эмуляторах
    
    B. Automated Testing (опционально):
    - Lighthouse CI
    - Cypress/Playwright для E2E
    - Jest для unit tests
    - Axe для accessibility testing
    
    C. Stakeholder Review:
    - Демо на совещании
    - Собери feedback
    - Приоритизируй fixes
    - Repeat cycle

РЕЗУЛЬТАТ:
- Comprehensive audit report (Excel/Google Sheets)
- Prioritized list of issues (Critical/High/Medium/Low)
- Screenshots/videos of bugs
- Recommended fixes для каждой проблемы
- Before/After metrics comparison
- Sign-off checklist для launch
```

### Accessibility Checklist Template:

```markdown
# ACCESSIBILITY AUDIT REPORT

## Page: [URL]
**Date:** [Date]
**Auditor:** Agent #4
**WCAG Level Target:** AA

---

### ✅ PASSED (Green)

#### Keyboard Navigation
- [x] All interactive elements accessible via Tab
- [x] Visible focus indicators
- [x] Logical tab order
- [x] No keyboard traps

#### Screen Readers
- [x] All images have alt text
- [x] Proper heading hierarchy (h1 -> h2 -> h3)
- [x] ARIA labels on icon buttons
- [x] Form labels properly associated

#### Color & Contrast
- [x] Text contrast ratio 4.5:1+ (normal text)
- [x] Text contrast ratio 3:1+ (large text 18px+)
- [x] UI components contrast 3:1+

---

### ⚠️ WARNINGS (Yellow)

#### Issue #1: Modal backdrop contrast
**Location:** Currency selection modal  
**Current:** 2.8:1  
**Required:** 3:1  
**Fix:** Увеличить opacity backdrop с 0.8 до 0.9  
**Priority:** Medium  

#### Issue #2: Button focus indicator barely visible
**Location:** .btn-capsule  
**Current:** 1px solid rgba(96, 165, 250, 0.3)  
**Fix:** Использовать outline: 2px solid #60a5fa  
**Priority:** High  

---

### ❌ FAILED (Red)

#### Issue #1: Images without alt text
**Location:** testimonials/review-3.jpg  
**Current:** alt=""  
**Required:** Descriptive alt text  
**Fix:** alt="Отзыв ученика о результатах курса"  
**Priority:** Critical  

---

### 📊 OVERALL SCORE

| Category | Score | Status |
|----------|-------|--------|
| Keyboard Navigation | 95/100 | ✅ Pass |
| Screen Reader Support | 88/100 | ⚠️ Needs Work |
| Color Contrast | 92/100 | ✅ Pass |
| Touch Targets | 100/100 | ✅ Pass |
| Forms | N/A | - |
| **TOTAL** | **93/100** | **✅ Pass** |

---

### 🎯 PRIORITY FIXES

1. **Critical:** Add alt text to all images (2 hours)
2. **High:** Improve focus indicators (1 hour)
3. **Medium:** Increase modal backdrop contrast (30 min)
4. **Low:** Add skip-to-content link (1 hour)

---

### 📱 MOBILE TESTING

**Devices Tested:**
- iPhone 13 Pro (iOS 16) - Safari ✅
- Samsung Galaxy S21 (Android 12) - Chrome ✅
- iPad Air (iOS 15) - Safari ✅
- Telegram WebApp (iOS) ✅
- Telegram WebApp (Android) ✅

**Issues Found:**
- [ ] Touch targets на FAQ слишком маленькие (< 44px) - iPad
- [ ] Swiper navigation buttons не работают на Safari iOS 15 (fixed in later versions)

---

### 🌐 CROSS-BROWSER TESTING

| Browser | Version | Status | Issues |
|---------|---------|--------|--------|
| Chrome | 120 | ✅ Pass | - |
| Firefox | 121 | ✅ Pass | - |
| Safari | 17 | ⚠️ Minor | CSS Grid gap issue |
| Edge | 120 | ✅ Pass | - |
| Samsung Internet | 23 | ✅ Pass | - |

---

### 💡 RECOMMENDATIONS

1. **Add prefers-reduced-motion support**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

2. **Improve semantic HTML**
   - Wrap pricing cards в <article> tags
   - Use <aside> for testimonials sidebar
   - Add <nav> для footer links

3. **Performance optimization**
   - Defer non-critical JavaScript
   - Lazy load below-the-fold images
   - Minimize third-party scripts

---

### ✅ SIGN-OFF CHECKLIST

Before going live:
- [ ] All Critical issues fixed
- [ ] All High priority issues fixed
- [ ] Medium issues documented for future
- [ ] Tested on all target browsers
- [ ] Tested on real mobile devices
- [ ] Lighthouse score 90+
- [ ] WCAG AA compliance verified
- [ ] Stakeholder approval received

**Status:** Ready for launch? ⚠️ After critical fixes

**Next Steps:**
1. Fix alt text issues (Agent #4)
2. Improve focus indicators (Agent #3)
3. Re-test after fixes (Agent #4)
4. Final stakeholder demo
```

---

## 📋 ИТОГОВАЯ СТРАТЕГИЯ ПАРАЛЛЕЛЬНОЙ РАБОТЫ

### Timeline (оптимальный порядок работы):

**День 1-2: Подготовка и анализ**
- **Агент #1**: Проводит performance audit, выявляет bottlenecks
- **Агент #2**: SEO audit, собирает ключевые слова, анализирует конкурентов
- **Агент #3**: Изучает дизайн, собирает референсы анимаций
- **Агент #4**: Accessibility audit, кросс-браузерное тестирование

**День 3-5: Реализация**
- **Агент #1**: Внедряет оптимизации (critical CSS, preload, Service Worker)
- **Агент #2**: Добавляет JSON-LD схемы, оптимизирует мета-теги
- **Агент #3**: Создаёт расширенные анимации, интегрирует в страницы
- **Агент #4**: Фиксит accessibility issues, улучшает UX

**День 6-7: Тестирование и полировка**
- **Все агенты**: Тестируют изменения друг друга
- **Агент #4**: Финальный QA, проверка метрик
- **Агент #1**: Performance re-test после добавления анимаций
- **Агент #2**: Проверка что SEO оптимизации не сломались

---

## 🎯 КЛЮЧЕВЫЕ МЕТРИКИ УСПЕХА

### Performance (Агент #1):
- ✅ Google PageSpeed: 95+ (mobile), 98+ (desktop)
- ✅ LCP < 2.5s
- ✅ CLS < 0.1
- ✅ FID < 100ms

### SEO (Агент #2):
- ✅ All pages indexed правильно
- ✅ Rich snippets в поисковой выдаче
- ✅ 0 critical SEO errors
- ✅ Structured data valid

### Animations (Агент #3):
- ✅ 60 FPS во время всех анимаций
- ✅ Плавные reveal эффекты без "дёрганий"
- ✅ Работает на low-end devices
- ✅ Поддержка prefers-reduced-motion

### UX/Accessibility (Агент #4):
- ✅ WCAG 2.1 AA compliance
- ✅ Lighthouse Accessibility score 95+
- ✅ 0 critical bugs на топ-5 браузерах
- ✅ Touch targets всех кнопок 44x44px+

---

## 📚 ПОЛЕЗНЫЕ РЕСУРСЫ

### Performance:
- https://web.dev/measure/
- https://www.webpagetest.org/
- https://developer.chrome.com/docs/lighthouse/

### SEO:
- https://schema.org/
- https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data
- https://search.google.com/test/rich-results

### Animations:
- https://cubic-bezier.com/
- https://easings.net/
- https://animista.net/

### Accessibility:
- https://www.w3.org/WAI/WCAG21/quickref/
- https://webaim.org/resources/contrastchecker/
- https://www.a11yproject.com/checklist/

### Testing:
- https://caniuse.com/
- https://browserstack.com/
- https://www.lambdatest.com/

---

## ⚡ QUICK START КОМАНДЫ

### Запуск dev сервера:
```bash
npm run dev
```

### Production build:
```bash
npm run build
```

### Preview production:
```bash
npm run preview
```

### Анализ bundle size:
```bash
npx vite-bundle-visualizer
```

### Lighthouse CI:
```bash
npx lighthouse https://illariooo.ru --view
```

### Accessibility test:
```bash
npx axe https://illariooo.ru --save report.json
```

---

## 🤝 КООРДИНАЦИЯ МЕЖДУ АГЕНТАМИ

### Communication Protocol:

1. **Daily Sync (асинхронно через комментарии в коде)**
   - Каждый агент оставляет комментарии вида:
   ```javascript
   // @agent-1: Оптимизировал загрузку шрифтов, теперь используй preload
   // @agent-3: Не забудь добавить will-change для новых анимаций
   ```

2. **Code Review чек-лист:**
   - ✅ Не сломал ли чужие оптимизации?
   - ✅ Добавленный CSS минифицирован?
   - ✅ Новые анимации не нагружают CPU?
   - ✅ Accessibility не пострадала?

3. **Conflict Resolution:**
   - Агент #1 (Performance) имеет приоритет в технических решениях
   - Агент #4 (UX) имеет veto право если что-то вредит пользователю
   - Агент #2 (SEO) консультирует по контенту
   - Агент #3 (Animations) адаптируется под performance constraints

---

## 🎉 ФИНАЛЬНЫЙ ЧЕК-ЛИСТ ПЕРЕД ЗАПУСКОМ

### Technical:
- [ ] Все скрипты минифицированы
- [ ] Service Worker зарегистрирован
- [ ] Все изображения оптимизированы
- [ ] Critical CSS inline
- [ ] Robots.txt и sitemap.xml актуальны

### Content:
- [ ] Нет Lorem Ipsum
- [ ] Все ссылки работают
- [ ] Контактная информация актуальна
- [ ] Legal pages доступны (Privacy Policy, Terms)

### SEO:
- [ ] JSON-LD на всех страницах
- [ ] Open Graph теги настроены
- [ ] Canonical URLs корректны
- [ ] Alt text у всех изображений

### UX:
- [ ] Все формы работают
- [ ] CTA buttons очевидны
- [ ] Mobile navigation плавная
- [ ] Loading states везде
- [ ] Error states обработаны

### Analytics:
- [ ] Google Analytics подключен (если нужен)
- [ ] Conversion tracking настроен
- [ ] Heatmaps/Session recording (опционально)

### Security:
- [ ] HTTPS включён
- [ ] Security headers настроены
- [ ] No XSS vulnerabilities
- [ ] Dependencies обновлены

---

**Успехов в оптимизации! 🚀**

*Этот документ создан как комплексный гайд для параллельной работы 4 AI-агентов над улучшением сайта AI Model 2.0. Каждый агент имеет чёткую зону ответственности и набор задач, но все работают синхронизированно для достижения общей цели - создания максимально быстрого, красивого и user-friendly лендинга.*









