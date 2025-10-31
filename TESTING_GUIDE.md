# 🧪 Руководство по тестированию Telegram WebApp

## Проблема

Telegram WebApp API не инициализируется должным образом. Полноэкранный режим и запрет свайпов не работают.

## Возможные причины

### 1. **Порядок загрузки скриптов в Astro**

В Astro скрипты с `is:inline` могут выполняться **до** загрузки внешних скриптов.

**Решение**: 
- Внешний скрипт `telegram-web-app.js` загружается **синхронно**
- Инлайн скрипт имеет механизм повторных попыток
- Логирование на каждом этапе для отладки

### 2. **TypeScript vs JavaScript** 

**НЕТ влияния!** Telegram WebApp API - это JavaScript библиотека, работает в любом проекте.

### 3. **Версия Telegram**

Требования:
- **Bot API 7.7+** для `disableVerticalSwipes()`
- **Bot API 8.0+** для `requestFullscreen()`

## Как протестировать

### Шаг 1: Запустите тестовую страницу

```bash
npm run dev
```

Откройте в браузере:
```
http://localhost:4321/test-telegram
```

### Шаг 2: Откройте в Telegram

#### Вариант А: Через туннель (ngrok)

```bash
npm run dev:ngrok
```

После запуска вы получите URL вида: `https://xxxx.ngrok.io`

#### Вариант Б: Через Cloudflare

```bash
npm run dev:cloudflare
```

Получите URL вида: `https://xxxx.trycloudflare.com`

### Шаг 3: Настройте бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. Выберите `/mybots` → ваш бот → **Bot Settings** → **Configure Mini App**
3. Укажите URL: `https://xxxx.ngrok.io/test-telegram`
4. Откройте бот и нажмите кнопку открытия Mini App

### Шаг 4: Проверьте логи

В тестовой странице должны появиться логи:

```
[HH:MM:SS] Script initialized, waiting for page load...
[HH:MM:SS] Page loaded, starting auto-test...
[HH:MM:SS] Testing Telegram WebApp initialization...
[HH:MM:SS] ✅ Telegram WebApp found!
[HH:MM:SS] Version: 8.0
[HH:MM:SS] Platform: ios
[HH:MM:SS] Calling ready()...
[HH:MM:SS] ✅ ready() called
[HH:MM:SS] Calling expand()...
[HH:MM:SS] ✅ expand() called, isExpanded: true
```

### Шаг 5: Откройте консоль

#### В Telegram Desktop (macOS/Windows/Linux)

1. Откройте Mini App
2. Нажмите **Cmd+Alt+I** (macOS) или **Ctrl+Shift+I** (Windows/Linux)
3. Перейдите на вкладку **Console**

#### В Telegram iOS

1. Подключите iPhone к Mac
2. Откройте **Safari** → **Develop** → ваш iPhone → Mini App
3. Смотрите Console

#### В Telegram Android

1. Включите **USB Debugging** на Android
2. Откройте **Chrome** → `chrome://inspect`
3. Найдите Mini App в списке
4. Кликните **Inspect**

## Что проверить в консоли

### Успешная инициализация

```javascript
[Init] Starting initialization...
[Telegram] WebApp loaded, version: 8.0, platform: ios
[Telegram] isExpanded: false, viewportHeight: 320
[Telegram] Calling ready()...
[Telegram] Calling expand()...
[Telegram] Enabling closing confirmation...
[Telegram] Disabling vertical swipes...
[Telegram] isVerticalSwipesEnabled: false
[Telegram] Requesting fullscreen...
[Telegram] Fullscreen requested, isFullscreen: true
[Telegram] Initialization complete. Use getTelegramInfo() for debug info.
```

### Проблема: Telegram WebApp не найден

```javascript
[Init] Starting initialization...
[Telegram] WebApp not available - running in browser
[Init] Telegram WebApp loaded on retry 3
```

**Причина**: Скрипт `telegram-web-app.js` загружается медленно  
**Решение**: Механизм повторных попыток должен найти его через 100-300мс

### Проблема: Старая версия API

```javascript
[Telegram] WebApp loaded, version: 6.9, platform: android
⚠️ requestFullscreen not available (need Bot API 8.0+)
⚠️ disableVerticalSwipes not available (need Bot API 7.7+)
```

**Причина**: Старая версия Telegram  
**Решение**: Обновите Telegram до последней версии

## Отладочные команды

В консоли браузера (если в Telegram):

### Получить информацию о WebApp

```javascript
getTelegramInfo()
```

Вернет:
```json
{
  "version": "8.0",
  "platform": "ios",
  "isExpanded": true,
  "isFullscreen": true,
  "isActive": true,
  "isVerticalSwipesEnabled": false,
  "viewportHeight": 844,
  "colorScheme": "dark",
  "hasRequestFullscreen": true,
  "hasDisableVerticalSwipes": true
}
```

### Включить полноэкранный режим вручную

```javascript
requestAppFullscreen()
```

### Выйти из полноэкранного режима

```javascript
exitAppFullscreen()
```

### Проверить доступность API

```javascript
console.log(window.Telegram?.WebApp?.version)
console.log(typeof window.Telegram?.WebApp?.requestFullscreen)
console.log(typeof window.Telegram?.WebApp?.disableVerticalSwipes)
```

## Типичные ошибки

### ❌ "window.Telegram is undefined"

**Причина**: Скрипт не загрузился  
**Решение**:
1. Проверьте что URL доступен: `https://telegram.org/js/telegram-web-app.js`
2. Проверьте что сайт открыт через HTTPS в Telegram
3. Проверьте консоль на ошибки загрузки

### ❌ "requestFullscreen is not a function"

**Причина**: Старая версия Telegram (< Bot API 8.0)  
**Решение**: Обновите Telegram

### ❌ Полноэкранный режим запрашивается но не активируется

**Причина**: Может быть ограничение платформы или версии  
**Решение**:
1. Проверьте события `fullscreenFailed` в консоли
2. Проверьте `tg.isFullscreen` через 1-2 секунды после запроса

### ❌ Свайпы не блокируются

**Причина**: 
- Старая версия (< Bot API 7.7)
- Свайпы хедера всегда доступны (это норма)

**Решение**:
- Пользователь всегда может закрыть через хедер
- `enableClosingConfirmation()` покажет диалог подтверждения

## Проверка на разных платформах

| Платформа | Fullscreen | Disable Swipes | Примечания |
|-----------|------------|----------------|------------|
| iOS 17+ | ✅ | ✅ | Требует последнюю версию Telegram |
| Android 13+ | ✅ | ✅ | Работает стабильно |
| Telegram Desktop | ✅ | N/A | Нет свайпов на десктопе |
| Web (browser) | ❌ | ❌ | Только в нативном Telegram |

## Следующие шаги

Если тестовая страница работает, но основная нет:

1. **Сравните HTML**: Посмотрите разницу между test-telegram.astro и Base.astro
2. **Проверьте порядок скриптов**: Убедитесь что telegram-web-app.js загружается первым
3. **Проверьте Astro обработку**: Возможно конфликт с обработкой скриптов Astro
4. **Создайте issue**: Если всё равно не работает, создайте подробный отчет

## Полезные ссылки

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [Bot API Changelog](https://core.telegram.org/bots/api-changelog)
- [Telegram Mini Apps Community](https://docs.telegram-mini-apps.com/)
- [@BotFather](https://t.me/BotFather) - создание и настройка ботов
