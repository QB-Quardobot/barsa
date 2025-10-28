# UTM Module Documentation

## Обзор

Модуль `src/lib/utm.ts` предоставляет полнофункциональную систему управления UTM-параметрами:
- Автоматический парсинг UTM из URL
- Сохранение в `sessionStorage`
- Добавление UTM к любым ссылкам
- SSR и клиентская поддержка

## API

### `parseUTMFromURL(url?: string): UTMParams`

Парсит UTM-параметры из URL:

```typescript
import { parseUTMFromURL } from '../lib/utm';

const params = parseUTMFromURL('https://example.com?utm_source=google&utm_medium=cpc');
// { utm_source: 'google', utm_medium: 'cpc' }
```

### `storeUTM(utmParams: UTMParams): void`

Сохраняет UTM в `sessionStorage`:

```typescript
import { storeUTM } from '../lib/utm';

storeUTM({ utm_source: 'google', utm_medium: 'cpc' });
```

### `getStoredUTM(): UTMParams`

Извлекает UTM из `sessionStorage`:

```typescript
import { getStoredUTM } from '../lib/utm';

const params = getStoredUTM();
// { utm_source: 'google', utm_medium: 'cpc' }
```

### `initUTM(): void`

Инициализирует систему UTM (парсит текущий URL и сохраняет):

```typescript
import { initUTM } from '../lib/utm';

initUTM(); // Парсит текущий URL и сохраняет в sessionStorage
```

### `withUTM(url: string): string`

Добавляет UTM к любой ссылке:

```typescript
import { withUTM } from '../lib/utm';

const url = withUTM('https://example.com/signup');
// https://example.com/signup?utm_source=google&utm_medium=cpc
```

### `clearUTM(): void`

Очищает сохранённые UTM:

```typescript
import { clearUTM } from '../lib/utm';

clearUTM();
```

## Использование

### В Server-Side (Astro компоненты)

```astro
---
import { parseUTMFromURL } from '../lib/utm';

const url = Astro.url.toString();
const utmParams = parseUTMFromURL(url);
---

<script>
  // Pass to client
  window.utmParams = {JSON.stringify(utmParams)};
</script>
```

### В Client-Side

```javascript
import { initUTM, withUTM } from '../lib/utm';

// Initialize on page load
initUTM();

// Use with any link
const link = withUTM('https://example.com/signup');
console.log(link);
```

### CTA Buttons

Все кнопки с атрибутом `data-cta` автоматически получают UTM:

```astro
<a href="https://example.com/signup" class="btn-primary" data-cta>
  Начать бесплатно
</a>
```

Система автоматически:
1. Берет UTM из URL
2. Сохраняет в `sessionStorage`
3. Добавляет ко всем `data-cta` ссылкам

### Telegram WebApp

В Telegram Mini App UTM добавляются через `openLink()`:

```javascript
const url = withUTM('https://example.com/signup');
window.Telegram.WebApp.openLink(url);
```

### Browser Fallback

В браузере ссылки открываются с UTM:

```javascript
const url = withUTM('https://example.com/signup');
window.open(url, '_blank');
```

## Архитектура

```
URL → parseUTMFromURL() → storeUTM() → sessionStorage
                                          ↓
                         withUTM() ← getStoredUTM()
```

1. **Парсинг**: UTM извлекаются из URL
2. **Сохранение**: Сохраняются в `sessionStorage`
3. **Использование**: Добавляются к любым ссылкам через `withUTM()`

## Примеры

### Базовое использование

```typescript
import { initUTM, withUTM } from '../lib/utm';

// Initialize
initUTM();

// Add to link
const link = withUTM('https://example.com/offer');
console.log(link);
// https://example.com/offer?utm_source=google&utm_medium=cpc
```

### В Astro Component

```astro
---
import { parseUTMFromURL } from '../lib/utm';

const utmParams = parseUTMFromURL(Astro.url.toString());
---

<script>
  // Store in sessionStorage
  const utmParams = {JSON.stringify(utmParams)};
  sessionStorage.setItem('utm_params', utmParams);
</script>
```

### В Client Script

```javascript
// Get stored UTM
const stored = sessionStorage.getItem('utm_params');
const utmParams = stored ? JSON.parse(stored) : {};

// Use with any URL
function withUTM(url) {
  const separator = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams(utmParams);
  return `${url}${separator}${params.toString()}`;
}

// Apply to CTA buttons
document.querySelectorAll('a[data-cta]').forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.href;
    this.href = withUTM(href);
  });
});
```

## Типы

```typescript
interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}
```

## Как это работает в проекте

### 1. Base.astro

```astro
---
import { parseUTMFromURL } from '../lib/utm';

const utmParams = parseUTMFromURL(Astro.url.toString());
---

<script define:vars={{ utmParams: JSON.stringify(utmParams) }}>
  // Store in sessionStorage on client
  sessionStorage.setItem('utm_params', utmParams);
</script>
```

### 2. Client-side Script

```javascript
function withUTM(url) {
  const stored = sessionStorage.getItem('utm_params');
  const utmParams = stored ? JSON.parse(stored) : {};
  
  if (Object.keys(utmParams).length === 0) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams(utmParams);
  return `${url}${separator}${params.toString()}`;
}
```

### 3. CTA Buttons

Все кнопки с `data-cta` автоматически получают UTM при клике.

## Тестирование

### 1. Откройте с UTM

```
http://localhost:4321/?utm_source=telegram&utm_medium=webapp&utm_campaign=test
```

### 2. Проверьте sessionStorage

```javascript
console.log(sessionStorage.getItem('utm_params'));
// {"utm_source":"telegram","utm_medium":"webapp","utm_campaign":"test"}
```

### 3. Кликните на CTA

```javascript
// Before: https://example.com/signup
// After:  https://example.com/signup?utm_source=telegram&utm_medium=webapp&utm_campaign=test
```

## Преимущества

✅ **Автоматическое распространение** — UTM добавляются ко всем CTA  
✅ **Session persistence** — UTM сохраняются на время сессии  
✅ **Telegram-ready** — работает в Telegram WebApp  
✅ **Browser fallback** — работает и в обычном браузере  
✅ **Type-safe** — полная типизация TypeScript  
✅ **SSR support** — работает в Astro SSR

