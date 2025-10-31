# Исправление полноэкранного режима и запрета свайпов

## Проблема

Мини-приложение не переходило в полноэкранный режим и не блокировало свайпы для закрытия приложения.

## Решение

Интеграция новых методов Telegram Bot API:
- **Bot API 7.7** (July 2024): `disableVerticalSwipes()`
- **Bot API 8.0** (November 2024): `requestFullscreen()`

## Внесенные изменения

### 1. Обновлены типы TypeScript (`src/lib/telegram.ts`)

Добавлены новые методы и свойства WebApp API:

```typescript
interface WebApp {
  // Новые свойства
  isVerticalSwipesEnabled: boolean;  // Bot API 7.7+
  isFullscreen: boolean;             // Bot API 8.0+
  isActive: boolean;                 // Bot API 8.0+
  
  // Новые методы
  enableVerticalSwipes(): void;      // Bot API 7.7+
  disableVerticalSwipes(): void;     // Bot API 7.7+
  requestFullscreen(): void;         // Bot API 8.0+
  exitFullscreen(): void;            // Bot API 8.0+
}
```

### 2. Обновлена функция инициализации (`src/lib/telegram.ts`)

```typescript
export function initTelegramWebApp(): void {
  // ... существующий код ...
  
  // Запрет свайпов для предотвращения случайного закрытия
  if (typeof webApp.disableVerticalSwipes === 'function') {
    webApp.disableVerticalSwipes();
  }
  
  // Запрос полноэкранного режима
  if (typeof webApp.requestFullscreen === 'function') {
    try {
      webApp.requestFullscreen();
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  }
}
```

### 3. Обновлена инициализация в Base Layout (`src/layouts/Base.astro`)

**Добавлено:**
- Вызов `disableVerticalSwipes()` при инициализации
- Вызов `requestFullscreen()` при инициализации
- Обработчики событий `fullscreenChanged` и `fullscreenFailed`
- Глобальные функции `requestAppFullscreen()` и `exitAppFullscreen()`

**Улучшено:**
- Убраны type casting `as any` благодаря правильным типам
- Упрощена логика инициализации
- Добавлено логирование для отладки

### 4. Обновлена документация (`TELEGRAM_WEBAPP.md`)

Добавлены разделы:
- Полноэкранный режим (Bot API 8.0+)
- Запрет свайпов (Bot API 7.7+)
- Обновлены таблицы методов, событий и свойств
- Примеры использования API

## Как это работает

### При запуске приложения

1. **`ready()`** — сообщает Telegram что приложение готово
2. **`expand()`** — разворачивает приложение на весь BottomSheet
3. **`enableClosingConfirmation()`** — включает подтверждение при закрытии
4. **`disableVerticalSwipes()`** — блокирует свайпы вниз для закрытия
5. **`requestFullscreen()`** — переводит в полноэкранный режим

### Защита от закрытия

Многоуровневая защита:

1. **`disableVerticalSwipes()`** — запрещает свайпы вниз
2. **`enableClosingConfirmation()`** — системное подтверждение
3. **Back Button** — перехват кнопки "Назад" с диалогом подтверждения

**Важно:** Пользователь всегда может закрыть приложение через заголовок Mini App.

### События

Приложение подписывается на события:

```javascript
// Изменение полноэкранного режима
tg.onEvent('fullscreenChanged', () => {
  console.log('Fullscreen state:', tg.isFullscreen);
});

// Ошибка полноэкранного режима
tg.onEvent('fullscreenFailed', (error) => {
  console.warn('Fullscreen failed:', error);
});
```

## Ручное управление

В коде доступны глобальные функции:

```javascript
// Включить полноэкранный режим
window.requestAppFullscreen();

// Выйти из полноэкранного режима
window.exitAppFullscreen();

// Проверить состояние
console.log(Telegram.WebApp.isFullscreen);
console.log(Telegram.WebApp.isVerticalSwipesEnabled);
```

## Совместимость

- ✅ **Bot API 8.0+** — полная поддержка fullscreen
- ✅ **Bot API 7.7+** — полная поддержка disableVerticalSwipes
- ✅ **Старые версии** — graceful degradation (методы не вызываются)

Приложение проверяет наличие методов перед вызовом:

```javascript
if (typeof tg.requestFullscreen === 'function') {
  tg.requestFullscreen();
}
```

## Тестирование

### В Telegram

1. Откройте Mini App в Telegram
2. Приложение автоматически:
   - Развернется на весь экран
   - Перейдет в полноэкранный режим
   - Заблокирует свайпы вниз

### В браузере

Полноэкранный режим и запрет свайпов работают только в Telegram.
В браузере показывается обычная версия.

### Отладка

Откройте консоль браузера / Telegram DevTools:

```javascript
// Проверить статус
console.log('Fullscreen:', Telegram.WebApp.isFullscreen);
console.log('Swipes disabled:', !Telegram.WebApp.isVerticalSwipesEnabled);

// Проверить версию API
console.log('Version:', Telegram.WebApp.version);
```

## Дополнительно

### Документация Telegram

- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Viewport](https://docs.telegram-mini-apps.com/platform/viewport)
- [Swipe Behavior](https://docs.telegram-mini-apps.com/platform/swipe-behavior)

### Полезные ссылки

- Bot API Changelog: https://core.telegram.org/bots/api-changelog
- @BotFather — создание и настройка ботов
- Telegram Mini Apps Examples: https://github.com/telegram-mini-apps

## Итог

✅ Полноэкранный режим работает автоматически  
✅ Свайпы для закрытия заблокированы  
✅ Подтверждение закрытия включено  
✅ Совместимость со старыми версиями API  
✅ Документация обновлена
