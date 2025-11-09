# 🔍 ПЛАН КОМПЛЕКСНОГО АУДИТА КОДА

**Цель:** Провести глубокий анализ кода и оптимизировать его до уровня топовых сайтов  
**Методология:** Разбить анализ на категории, каждая в отдельном промпте для качественной работы

---

## 📋 СТРУКТУРА АНАЛИЗА

### **ПРОМПТ #1: PERFORMANCE & CORE WEB VITALS** 🚀
**Приоритет:** КРИТИЧЕСКИЙ

#### Что анализировать:
1. **LCP (Largest Contentful Paint)**
   - Критический путь рендеринга
   - Оптимизация hero изображений
   - Preload критических ресурсов
   - Font loading strategy

2. **FCP (First Contentful Paint)**
   - Critical CSS inline
   - Render-blocking ресурсы
   - DNS prefetch / preconnect

3. **CLS (Cumulative Layout Shift)**
   - Width/height для всех изображений
   - Aspect-ratio для контейнеров
   - Резервирование места для динамического контента

4. **FID / INP (Interaction to Next Paint)**
   - Event handler optimization
   - Debounce/throttle для scroll/resize
   - Passive event listeners

5. **TTI (Time to Interactive)**
   - JavaScript bundle size
   - Code splitting
   - Lazy loading стратегия

6. **Bundle Analysis**
   - Размер JS/CSS бандлов
   - Tree shaking эффективность
   - Dead code elimination
   - Duplicate dependencies

---

### **ПРОМПТ #2: SEO & META OPTIMIZATION** 🔍
**Приоритет:** ВЫСОКИЙ

#### Что анализировать:
1. **Meta Tags**
   - Полнота Open Graph тегов
   - Twitter Card метаданные
   - Canonical URLs
   - hreflang для мультиязычности

2. **Structured Data (Schema.org)**
   - JSON-LD разметка
   - Organization schema
   - Product/Service schema
   - BreadcrumbList schema

3. **Sitemap & Robots.txt**
   - XML sitemap структура
   - Robots.txt правила
   - Priority и changefreq

4. **Semantic HTML**
   - Правильное использование HTML5 тегов
   - Heading hierarchy (h1-h6)
   - Alt тексты для изображений

5. **URL Structure**
   - ЧПУ (человеко-понятные URL)
   - URL длина и структура
   - Redirect chains

---

### **ПРОМПТ #3: ACCESSIBILITY (A11Y)** ♿
**Приоритет:** ВЫСОКИЙ

#### Что анализировать:
1. **ARIA Attributes**
   - Правильное использование aria-*
   - Landmark roles
   - Live regions для динамического контента

2. **Keyboard Navigation**
   - Tab order логичность
   - Focus indicators
   - Skip links
   - Keyboard shortcuts

3. **Screen Reader Support**
   - Alt тексты
   - aria-label / aria-labelledby
   - aria-describedby
   - Hidden decorative elements

4. **Color Contrast**
   - WCAG AA/AAA compliance
   - Focus states visibility
   - Text readability

5. **Form Accessibility**
   - Label associations
   - Error messages
   - Required field indicators

---

### **ПРОМПТ #4: SECURITY** 🔒
**Приоритет:** КРИТИЧЕСКИЙ

#### Что анализировать:
1. **Content Security Policy (CSP)**
   - CSP headers
   - Inline script security
   - External resource whitelist

2. **XSS Prevention**
   - Input sanitization
   - Output encoding
   - Template injection risks

3. **Dependencies Security**
   - Устаревшие пакеты
   - Known vulnerabilities
   - Dependency audit

4. **HTTPS & Security Headers**
   - HSTS
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy

5. **Data Privacy**
   - GDPR compliance
   - Cookie consent
   - Analytics privacy

---

### **ПРОМПТ #5: CODE QUALITY & BEST PRACTICES** 💎
**Приоритет:** СРЕДНИЙ

#### Что анализировать:
1. **DRY Principle**
   - Дублирование кода
   - Reusable components
   - Utility functions

2. **Error Handling**
   - Try-catch coverage
   - Graceful degradation
   - Error boundaries

3. **Memory Management**
   - Event listener cleanup
   - Observer cleanup
   - Memory leaks detection

4. **TypeScript Best Practices**
   - Type safety
   - Interface definitions
   - Type assertions usage

5. **Code Organization**
   - File structure
   - Module boundaries
   - Separation of concerns

---

### **ПРОМПТ #6: MOBILE OPTIMIZATION** 📱
**Приоритет:** ВЫСОКИЙ

#### Что анализировать:
1. **Touch Optimization**
   - Touch target sizes (min 44x44px)
   - Touch event handlers
   - Swipe gestures

2. **Viewport Configuration**
   - Meta viewport settings
   - Safe area insets
   - Orientation handling

3. **Mobile Performance**
   - Mobile-specific optimizations
   - Network-aware loading
   - Battery efficiency

4. **Progressive Web App (PWA)**
   - Service Worker
   - Web App Manifest
   - Offline support

---

### **ПРОМПТ #7: NETWORK & RESOURCE LOADING** 🌐
**Приоритет:** ВЫСОКИЙ

#### Что анализировать:
1. **Resource Hints**
   - Preconnect / DNS-prefetch
   - Preload критических ресурсов
   - Prefetch для следующей страницы

2. **Caching Strategy**
   - Cache-Control headers
   - ETag / Last-Modified
   - Service Worker caching

3. **Image Optimization**
   - Format selection (WebP/AVIF)
   - Responsive images (srcset)
   - Lazy loading implementation

4. **Font Loading**
   - Font-display strategy
   - Font subsetting
   - Variable fonts usage

5. **CDN Configuration**
   - CDN usage для статики
   - Compression (gzip/brotli)
   - Edge caching

---

### **ПРОМПТ #8: JAVASCRIPT OPTIMIZATION** ⚡
**Приоритет:** ВЫСОКИЙ

#### Что анализировать:
1. **Code Splitting**
   - Route-based splitting
   - Component-based splitting
   - Dynamic imports

2. **Tree Shaking**
   - Unused code elimination
   - Side-effect free modules
   - Bundle analyzer

3. **Execution Optimization**
   - RequestAnimationFrame usage
   - requestIdleCallback
   - Web Workers для тяжелых задач

4. **Event Handling**
   - Event delegation
   - Debounce/throttle
   - Passive listeners

5. **Async/Await Patterns**
   - Promise optimization
   - Error handling
   - Race conditions

---

## 🎯 ПРИОРИТИЗАЦИЯ

### Критический приоритет (делать первым):
1. ✅ Performance & Core Web Vitals
2. ✅ Security
3. ✅ Mobile Optimization

### Высокий приоритет:
4. ✅ SEO & Meta
5. ✅ Accessibility
6. ✅ Network & Resource Loading
7. ✅ JavaScript Optimization

### Средний приоритет:
8. ✅ Code Quality & Best Practices

---

## 📊 МЕТРИКИ УСПЕХА

После каждого промпта должны быть:
- ✅ Список найденных проблем
- ✅ Приоритет каждой проблемы
- ✅ Конкретные рекомендации по исправлению
- ✅ Примеры кода (до/после)
- ✅ Ожидаемый эффект от оптимизации

---

## 🔄 ПОРЯДОК ВЫПОЛНЕНИЯ

1. **ПРОМПТ #1** → Performance & Core Web Vitals
2. **ПРОМПТ #2** → SEO & Meta Optimization  
3. **ПРОМПТ #3** → Accessibility
4. **ПРОМПТ #4** → Security
5. **ПРОМПТ #5** → Code Quality
6. **ПРОМПТ #6** → Mobile Optimization
7. **ПРОМПТ #7** → Network & Resource Loading
8. **ПРОМПТ #8** → JavaScript Optimization

---

**Готов начать с ПРОМПТ #1: Performance & Core Web Vitals?** 🚀

