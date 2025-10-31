# Аналитика кликов — Документация

Полноценная система отслеживания кликов для Telegram Mini App и веб-версии.

## 🎯 Возможности

- ✅ **Локальное хранение** — события сохраняются в `sessionStorage`
- ✅ **Отправка в Telegram бот** — через `Telegram.WebApp.sendData()`
- ✅ **Отправка на сервер** — опциональный endpoint для вашего бэкенда
- ✅ **Пакетная отправка** — уменьшает количество запросов
- ✅ **Автоматическая отправка** — при разрыве соединения или закрытии страницы
- ✅ **Метаданные** — UTM, платформа, версия, глубина прокрутки
- ✅ **Статистика** — встроенные функции для анализа

## 📦 Установка

Модуль уже интегрирован в `Base.astro`. Для ручного использования:

```typescript
import { trackClick, initAnalytics, getStats } from './lib/analytics';

// Инициализация (обычно не требуется, делается автоматически)
initAnalytics({
  enableTelegram: true,
  enableServer: false,
  serverEndpoint: 'https://your-api.com/analytics',
});

// Отслеживание клика
trackClick({
  type: 'cta',
  label: 'Вступить ✅',
  href: 'https://t.me/channel',
});
```

## 🔧 Конфигурация

### Базовые настройки

```typescript
initAnalytics({
  storageKey: 'analytics_events',      // Ключ в sessionStorage
  batchSize: 10,                        // Размер пакета для отправки
  flushInterval: 30000,                 // Интервал авто-отправки (мс)
  maxLocalEvents: 100,                  // Максимум событий в хранилище
  enableTelegram: true,                 // Включить отправку в Telegram
  enableServer: false,                  // Включить отправку на сервер
  serverEndpoint: 'https://api.com/events', // URL сервера
});
```

### Включение серверной отправки

1. **Раскомментируйте в `src/lib/analytics.ts`:**

```typescript
initAnalytics({
  enableServer: true,
  serverEndpoint: 'https://your-api.com/api/analytics/click',
});
```

2. **Создайте endpoint на сервере** (пример для Node.js/Express):

```javascript
app.post('/api/analytics/click', async (req, res) => {
  const events = req.body; // Array of ClickEvent[]
  
  // Сохранить в БД (PostgreSQL, MongoDB, etc.)
  await db.analytics.insertMany(events);
  
  res.json({ success: true, count: events.length });
});
```

## 📊 Данные события

Каждое событие содержит:

```typescript
interface ClickEvent {
  type: 'cta' | 'link' | 'button' | 'other';
  label: string;              // Текст кнопки
  href: string;               // URL ссылки
  timestamp: number;          // Unix timestamp
  sessionId: string;          // ID сессии
  userId?: string;            // Telegram user ID (если доступен)
  platform?: string;         // 'ios' | 'android' | 'web'
  version?: string;          // Telegram WebApp version
  utm_source?: string;       // UTM параметры
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;         // Referrer URL
  userAgent?: string;        // User agent
  viewport?: {
    width: number;
    height: number;
  };
  scrollDepth?: number;      // Процент прокрутки страницы
}
```

## 🔗 Интеграция с Telegram ботом

### 1. Настройка бота (Python/aiogram)

```python
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command

bot = Bot(token="YOUR_BOT_TOKEN")
dp = Dispatcher(bot)

@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def handle_web_app_data(message: types.Message):
    """Обработка данных из Mini App"""
    data = message.web_app_data.data
    event = json.loads(data)
    
    # event содержит:
    # {
    #   "event": "click",
    #   "type": "cta",
    #   "label": "Вступить ✅",
    #   "href": "https://t.me/channel",
    #   "timestamp": 1234567890,
    #   "sessionId": "session_...",
    #   "userId": "123456789",
    #   "platform": "ios",
    #   "utm_source": "telegram",
    #   ...
    # }
    
    # Сохранить в БД
    await save_event_to_db(event)
    
    # Или просто логировать
    print(f"Click: {event['label']} -> {event['href']} (User: {event['userId']})")
    
    await message.answer("✅ Спасибо! Переходим в канал...")

if __name__ == '__main__':
    executor.start_polling(dp, skip_updates=True)
```

### 2. Настройка бота (Node.js/Telegraf)

```javascript
const { Telegraf } = require('telegraf');

const bot = new Telegraf('YOUR_BOT_TOKEN');

bot.on('web_app_data', async (ctx) => {
  const data = JSON.parse(ctx.webAppData.data);
  
  // data содержит объект события
  console.log('Click event:', data);
  
  // Сохранить в БД
  await db.analytics.insertOne(data);
  
  await ctx.reply('✅ Переходим в канал...');
});

bot.launch();
```

## 📈 Просмотр статистики

### В консоли браузера

```javascript
// Все события
import { getAllEvents } from './lib/analytics';
console.table(getAllEvents());

// Статистика
import { getStats } from './lib/analytics';
console.log(getStats());
```

### Пример вывода статистики

```javascript
{
  totalClicks: 25,
  clicksByType: {
    cta: 15,
    link: 8,
    button: 2
  },
  clicksByLabel: {
    "Вступить ✅": 12,
    "Ворваться в новую нишу 💰": 8,
    "Перейти": 5
  },
  clicksByHour: {
    "14:00": 5,
    "15:00": 12,
    "16:00": 8
  },
  uniqueUrls: 3,
  avgScrollDepth: 65,
  platforms: {
    ios: 15,
    android: 8,
    web: 2
  }
}
```

## 🔍 Использование в коде

### Автоматическое отслеживание (уже настроено)

Все ссылки с атрибутом `data-cta` автоматически отслеживаются:

```html
<a href="https://t.me/channel" data-cta>Вступить ✅</a>
```

### Ручное отслеживание

```typescript
import { trackClick } from './lib/analytics';

button.addEventListener('click', () => {
  trackClick({
    type: 'button',
    label: 'Скачать',
    href: '/download',
  });
});
```

## 🗄️ Хранение данных

### Локальное (sessionStorage)

События сохраняются в `sessionStorage` под ключом `analytics_events`:

```javascript
// Посмотреть сохранённые события
JSON.parse(sessionStorage.getItem('analytics_events'));

// Очистить
sessionStorage.removeItem('analytics_events');
```

### На сервере

Если включен `enableServer`, события отправляются пакетами на ваш endpoint.

**Формат запроса:**

```http
POST /api/analytics/click
Content-Type: application/json

[
  {
    "type": "cta",
    "label": "Вступить ✅",
    "href": "https://t.me/channel",
    "timestamp": 1234567890,
    ...
  },
  ...
]
```

## 🎛️ API

### `initAnalytics(config?)`

Инициализирует трекер аналитики.

```typescript
initAnalytics({
  enableTelegram: true,
  enableServer: true,
  serverEndpoint: 'https://api.com/events',
});
```

### `trackClick(data)`

Отслеживает клик.

```typescript
trackClick({
  type: 'cta',
  label: 'Вступить',
  href: 'https://t.me/channel',
});
```

### `flushEvents()`

Принудительно отправляет все накопленные события.

```typescript
await flushEvents();
```

### `getStats()`

Возвращает статистику по текущей сессии.

```typescript
const stats = getStats();
console.log(stats.totalClicks, stats.clicksByType);
```

### `getAllEvents()`

Возвращает все сохранённые события.

```typescript
const events = getAllEvents();
console.table(events);
```

## 🔒 Безопасность и приватность

- ✅ Данные хранятся только локально (sessionStorage)
- ✅ Отправка на сервер опциональна
- ✅ Telegram user ID отправляется только если доступен
- ✅ User agent опционален (можно отключить)
- ✅ UTM параметры сохраняются только если были в URL

## 🐛 Отладка

### Включить логирование

В `src/lib/analytics.ts` добавьте:

```typescript
private trackClick(data: {...}): void {
  const event = {...};
  console.log('[Analytics] Track click:', event); // Добавить это
  this.events.push(event);
  ...
}
```

### Проверка отправки в Telegram

1. Откройте консоль в Telegram Mini App
2. Кликните по кнопке
3. Должно появиться: `[Telegram.WebView] > postEvent`

### Проверка отправки на сервер

1. Включите `enableServer: true`
2. Откройте Network tab в DevTools
3. Кликните по кнопке
4. Должен появиться POST запрос к вашему endpoint

## 📝 Примеры использования

### Отслеживание только важных кнопок

```html
<!-- Автоматически отслеживается -->
<a href="https://t.me/channel" data-cta>Вступить ✅</a>

<!-- Не отслеживается -->
<a href="/about">О нас</a>
```

### Кастомное отслеживание

```typescript
// При загрузке видео
video.addEventListener('play', () => {
  trackClick({
    type: 'other',
    label: 'Video play',
    href: video.src,
  });
});
```

### Группировка по кампаниям

```typescript
// В начале сессии
const campaign = new URLSearchParams(location.search).get('utm_campaign');

// При клике
trackClick({
  type: 'cta',
  label: 'Вступить',
  href: 'https://t.me/channel',
  // UTM автоматически подтянутся из sessionStorage
});
```

## 🚀 Продакшн чеклист

- [ ] Настроить серверный endpoint (если нужен)
- [ ] Настроить обработчик в Telegram боте
- [ ] Протестировать отправку в Telegram
- [ ] Протестировать отправку на сервер
- [ ] Проверить работу на iOS/Android
- [ ] Убедиться, что события не дублируются
- [ ] Настроить очистку старых событий (если используете БД)

## 📚 Дополнительные ресурсы

- [Telegram WebApp API Docs](https://core.telegram.org/bots/webapps)
- [sendData() method](https://core.telegram.org/bots/webapps#initializing-mini-apps)
- [Navigator.sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)

---

**Вопросы?** Откройте issue в репозитории.

