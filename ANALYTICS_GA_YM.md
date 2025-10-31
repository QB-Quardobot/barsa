# Google Analytics 4 & Яндекс.Метрика — Инструкция

Простая интеграция аналитики с поддержкой UTM меток для Telegram Mini App и браузера.

## 📋 Настройка

### 1. Получите ID счетчиков

**Google Analytics 4:**
1. Перейдите в [Google Analytics](https://analytics.google.com/)
2. Создайте свойство или выберите существующее
3. Перейдите в **Администратор → Потоки данных → Web**
4. Скопируйте **Measurement ID** (формат: `G-XXXXXXXXXX`)

**Яндекс.Метрика:**
1. Перейдите в [Яндекс.Метрика](https://metrika.yandex.ru/)
2. Создайте счетчик или выберите существующий
3. Скопируйте **Номер счетчика** (обычно 8 цифр, например: `12345678`)

### 2. Настройте переменные окружения

Создайте файл `.env` в корне проекта:

```env
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_YM_COUNTER_ID=12345678
```

**Важно:** 
- Используйте префикс `PUBLIC_` чтобы переменные были доступны на клиенте
- В Astro переменные без `PUBLIC_` доступны только на сервере

### 3. Переменные окружения на сервере

Если деплоите на сервер, добавьте переменные в `.env` или через панель хостинга:

```bash
# На сервере
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_YM_COUNTER_ID=12345678
```

## ✅ Что отслеживается автоматически

### UTM параметры
- `utm_source` — источник трафика
- `utm_medium` — канал
- `utm_campaign` — кампания
- `utm_term` — ключевое слово
- `utm_content` — контент

UTM параметры:
- ✅ Автоматически извлекаются из URL
- ✅ Сохраняются в `sessionStorage`
- ✅ Передаются в события GA4 и Яндекс.Метрики

### События кликов по CTA кнопкам

Все ссылки с атрибутом `data-cta` автоматически отслеживаются:

```html
<a href="https://t.me/channel" data-cta>Вступить ✅</a>
```

**GA4:** Событие `cta_click` с категорией `CTA`
**Яндекс.Метрика:** Цель `cta_click`

### Просмотры страниц

Автоматически отслеживаются с UTM параметрами из URL.

## 📊 Просмотр данных

### Google Analytics 4

1. **События:**
   - Перейдите в **Отчеты → События**
   - Найдите событие `cta_click`
   - Смотрите количество кликов, метки, UTM параметры

2. **UTM кампании:**
   - Перейдите в **Приобретение → Кампании**
   - Фильтруйте по `utm_campaign`

3. **Источники:**
   - Перейдите в **Приобретение → Обзор**
   - Смотрите `utm_source` и `utm_medium`

### Яндекс.Метрика

1. **Цели:**
   - Перейдите в **Отчеты → Цели**
   - Найдите цель `cta_click`
   - Смотрите конверсии и воронку

2. **UTM метки:**
   - Перейдите в **Стандартные отчеты → Источники → Метки UTM**
   - Фильтруйте по кампаниям и источникам

3. **Посещения:**
   - Перейдите в **Стандартные отчеты → Посещаемость → Посещения**
   - Смотрите источники трафика

## 🔧 Настройка целей в Яндекс.Метрике

### Создание цели для CTA кликов

1. Перейдите в **Настройки → Цели**
2. Нажмите **Добавить цель**
3. Выберите тип: **JavaScript-событие**
4. Настройки:
   - **Идентификатор:** `cta_click`
   - **Категория:** `CTA`
   - **Действие:** (любое)
5. Сохраните

После этого все клики по кнопкам с `data-cta` будут учитываться как конверсии.

## 📱 Работа в Telegram Mini App

Система автоматически работает в:
- ✅ Telegram Mini App (WebView)
- ✅ Обычном браузере
- ✅ Мобильных браузерах
- ✅ Desktop браузерах

UTM параметры сохраняются в `sessionStorage` и автоматически передаются во все события.

## 🔗 Примеры UTM ссылок

### Для Telegram канала

```
https://illariooo.ru/?utm_source=telegram&utm_medium=miniapp&utm_campaign=launch
```

### Для рекламы

```
https://illariooo.ru/?utm_source=vk&utm_medium=ad&utm_campaign=summer_sale&utm_content=banner
```

### Для email рассылки

```
https://illariooo.ru/?utm_source=email&utm_medium=newsletter&utm_campaign=promo&utm_term=subscribers
```

## 🛠️ Расширенное использование

### Отслеживание скролла (опционально)

В `src/layouts/Base.astro` можно добавить:

```javascript
// Track scroll depth
let maxScroll = 0;
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = Math.round((scrollTop / docHeight) * 100);
  
  if (scrollPercent >= 50 && maxScroll < 50) {
    maxScroll = 50;
    if (typeof gtag !== 'undefined') {
      gtag('event', 'scroll', { value: 50 });
    }
  }
  // Аналогично для 75% и 100%
});
```

### Отслеживание времени на сайте

```javascript
// Track time on page (optional)
let startTime = Date.now();
window.addEventListener('beforeunload', () => {
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  if (typeof gtag !== 'undefined') {
    gtag('event', 'time_on_page', { value: timeSpent });
  }
});
```

## 🐛 Отладка

### Проверка загрузки GA4

1. Откройте DevTools (F12)
2. Вкладка **Network**
3. Фильтр: `gtag/js`
4. Должен быть запрос к `googletagmanager.com`

### Проверка загрузки Яндекс.Метрики

1. Откройте DevTools (F12)
2. Вкладка **Network**
3. Фильтр: `metrika`
4. Должен быть запрос к `mc.yandex.ru`

### Проверка событий в GA4

1. В GA4 перейдите в **Отчеты → События в реальном времени**
2. Кликните по кнопке с `data-cta`
3. Должно появиться событие `cta_click`

### Проверка целей в Яндекс.Метрике

1. В Яндекс.Метрике перейдите в **Отчеты → Онлайн**
2. Кликните по кнопке с `data-cta`
3. Должна засчитаться цель `cta_click`

### Проверка UTM в консоли

```javascript
// Проверить сохраненные UTM
JSON.parse(sessionStorage.getItem('utm_params'))

// Проверить события GA4
window.dataLayer
```

## ⚠️ Важные замечания

1. **GDPR/Privacy:**
   - Убедитесь, что используете согласие на cookies где требуется
   - Можно добавить cookie banner для EU пользователей

2. **Блокировщики:**
   - AdBlock может блокировать GA4 и Яндекс.Метрику
   - Это нормально, часть пользователей не будет отслеживаться

3. **Производительность:**
   - Скрипты загружаются асинхронно, не блокируют рендеринг
   - Используется `preconnect` для ускорения подключения

4. **Telegram Mini App:**
   - Работает через WebView, все стандартные методы аналитики работают
   - UTM параметры сохраняются между переходами внутри приложения

## 📚 Полезные ссылки

- [Google Analytics 4 Docs](https://developers.google.com/analytics/devguides/collection/ga4)
- [Яндекс.Метрика API](https://yandex.ru/support/metrica/code/install.html)
- [UTM Generator](https://ga-dev-tools.web.app/campaign-url-builder/)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps)

---

**Готово!** После настройки переменных окружения аналитика начнет работать автоматически.

