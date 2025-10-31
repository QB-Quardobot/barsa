# Telegram Web App Integration

## Обзор

Проект интегрирован с **Telegram Web App API** для работы в качестве Mini App в Telegram.

## Возможности

✅ **Автоинициализация** — `Telegram.WebApp.ready()` и `Telegram.WebApp.expand()`  
✅ **Полноэкранный режим** — `Telegram.WebApp.requestFullscreen()` (Bot API 8.0+)  
✅ **Запрет свайпа** — `Telegram.WebApp.disableVerticalSwipes()` (Bot API 7.7+)  
✅ **Автонастройка темы** — `Telegram.WebApp.colorScheme` и `themeParams`  
✅ **Подписка на изменения темы** — `themeChanged` event  
✅ **Подписка на fullscreen события** — `fullscreenChanged`, `fullscreenFailed` events  
✅ **Специальная обработка CTA** — `Telegram.WebApp.openLink()` в Telegram  
✅ **Fallback для браузера** — обычные `<a target="_blank">` вне Telegram  
✅ **Баннер "Открй в Telegram"** — автоматически показывается в браузере

## Файлы

### `src/lib/telegram.ts`

Type-safe модуль с полными типами для Telegram WebApp API:

```typescript
// Проверка запуска в Telegram
const isTelegram = isTelegramWebApp();

// Инициализация
initTelegramWebApp();

// Получение темы
const theme = getTelegramTheme(); // 'light' | 'dark'

// Применение цветов темы к CSS
applyTelegramTheme();

// Открытие ссылки (с автоматическим определением среды)
openLink('https://example.com', tryInstantView);

// Haptic feedback
hapticFeedback('medium');
```

### `src/layouts/Base.astro`

**Подключение скрипта:**
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

**Автоинициализация:**
- `Telegram.WebApp.ready()` — готовность к работе
- `Telegram.WebApp.expand()` — расширение на весь экран
- `enableClosingConfirmation()` — подтверждение закрытия
- `disableVerticalSwipes()` — запрет свайпов для закрытия (Bot API 7.7+)
- `requestFullscreen()` — полноэкранный режим (Bot API 8.0+)

**Автонастройка темы:**
- Применение цветов из `themeParams` к CSS-переменным
- Подписка на событие `themeChanged`

**Баннер:**
- Показывается автоматически, если сайт открыт вне Telegram
- Скрывается при запуске в Telegram

**CTA ссылки:**
- В Telegram: `Telegram.WebApp.openLink(url)`
- В браузере: `<a target="_blank" rel="noopener noreferrer">`

## Использование

### CTA кнопки

Все кнопки с атрибутом `data-cta` автоматически работают в Telegram и браузере:

```astro
<!-- Автоматически работает в Telegram и браузере -->
<a href="https://example.com/offer" class="btn-primary" data-cta>
  Начать бесплатно
</a>
```

**В Telegram:**
- Клик вызывает `Telegram.WebApp.openLink()`
- UTM-параметры добавляются автоматически

**В браузере:**
- Открывается в новой вкладке
- Добавляется `target="_blank"` и `rel="noopener noreferrer"`
- UTM-параметры в href

### Telegram themeParams

Доступны CSS-переменные с цветами Telegram:

```css
:root {
  --tg-theme-bg-color: #ffffff;
  --tg-theme-text-color: #000000;
  --tg-theme-hint-color: #999999;
  --tg-theme-link-color: #2481cc;
  --tg-theme-button-color: #2481cc;
  --tg-theme-button-text-color: #ffffff;
  --tg-theme-secondary-bg-color: #f1f1f1;
}
```

Используйте в стилях:

```css
.custom-element {
  background: var(--tg-theme-bg-color, #0a0a0a);
  color: var(--tg-theme-text-color, #ffffff);
}
```

## API Reference

### Официальная документация

📚 https://core.telegram.org/bots/webapps

### Основные методы

| Метод | Описание | Bot API |
|-------|----------|---------|
| `Telegram.WebApp.ready()` | Готовность к работе | — |
| `Telegram.WebApp.expand()` | Расширение на весь экран | — |
| `Telegram.WebApp.close()` | Закрытие WebApp | — |
| `Telegram.WebApp.openLink(url)` | Открытие ссылки | — |
| `Telegram.WebApp.sendData(data)` | Отправка данных боту | — |
| `Telegram.WebApp.enableClosingConfirmation()` | Подтверждение закрытия | — |
| `Telegram.WebApp.disableVerticalSwipes()` | Запретить свайпы для закрытия | 7.7+ |
| `Telegram.WebApp.enableVerticalSwipes()` | Включить свайпы для закрытия | 7.7+ |
| `Telegram.WebApp.requestFullscreen()` | Включить полноэкранный режим | 8.0+ |
| `Telegram.WebApp.exitFullscreen()` | Выйти из полноэкранного режима | 8.0+ |
| `Telegram.WebApp.onEvent(event, handler)` | Подписка на события | — |

### События

| Событие | Описание | Bot API |
|---------|----------|---------|
| `themeChanged` | Изменение темы | — |
| `viewportChanged` | Изменение viewport | — |
| `mainButtonClicked` | Клик по кнопке | — |
| `fullscreenChanged` | Изменение полноэкранного режима | 8.0+ |
| `fullscreenFailed` | Ошибка полноэкранного режима | 8.0+ |

### Свойства

| Свойство | Описание | Bot API |
|----------|----------|---------|
| `colorScheme` | 'light' \| 'dark' | — |
| `themeParams` | Цвета темы | — |
| `isExpanded` | Развёрнуто ли на весь экран | — |
| `isVerticalSwipesEnabled` | Разрешены ли свайпы | 7.7+ |
| `isFullscreen` | Полноэкранный режим | 8.0+ |
| `isActive` | Приложение активно | 8.0+ |
| `platform` | Платформа (web, ios, android) | — |
| `initData` | Данные инициализации | — |
| `initDataUnsafe` | Данные пользователя | — |

## Тестирование

### В Telegram

1. Создайте бота через @BotFather
2. Создайте `/newapp` в @BotFather
3. Укажите URL лендинга
4. Используйте кнопку "Open Mini App" в боте

### В браузере

Откройте сайт в браузере — увидите баннер "Открой в Telegram для лучшего опыта".

CTA кнопки будут открываться в новой вкладке.

### Эмуляция Telegram

Откройте DevTools → Console:

```javascript
// Эмулировать Telegram WebApp
window.Telegram = {
  WebApp: {
    ready: () => console.log('Ready'),
    expand: () => console.log('Expand'),
    colorScheme: 'dark',
    themeParams: {
      bg_color: '#0a0a0a',
      text_color: '#ffffff',
      hint_color: '#9ca3af',
      link_color: '#3b82f6',
      button_color: '#3b82f6',
      button_text_color: '#ffffff',
      secondary_bg_color: '#1a1a1a'
    },
    openLink: (url) => console.log('Open:', url),
    onEvent: (event, handler) => console.log('Event:', event),
    enableClosingConfirmation: () => {},
    isExpanded: true,
    platform: 'web',
    initData: '',
    initDataUnsafe: {},
    version: '7.0',
    viewportHeight: 600,
    viewportStableHeight: 600,
    headerColor: '',
    backgroundColor: '',
    isClosingConfirmationEnabled: false,
    BackButton: { isVisible: false, show: () => {}, hide: () => {} },
    MainButton: { text: '', color: '', textColor: '', isVisible: false, show: () => {}, hide: () => {} },
    HapticFeedback: { impactOccurred: () => {} }
  }
};

// Перезагрузите страницу
location.reload();
```

## Полноэкранный режим и запрет свайпов

### Полноэкранный режим (Bot API 8.0+)

Полноэкранный режим расширяет приложение на весь экран устройства, скрывая верхнюю и нижнюю панели Telegram. Идеально подходит для игр и медиа-контента.

**Автоматическая активация:**
```javascript
// Вызывается автоматически при инициализации в Base.astro
Telegram.WebApp.requestFullscreen();
```

**Ручное управление:**
```javascript
// Включить полноэкранный режим
window.requestAppFullscreen();

// Выйти из полноэкранного режима
window.exitAppFullscreen();

// Проверить статус
console.log(Telegram.WebApp.isFullscreen);
```

**События:**
```javascript
Telegram.WebApp.onEvent('fullscreenChanged', () => {
  console.log('Fullscreen:', Telegram.WebApp.isFullscreen);
});

Telegram.WebApp.onEvent('fullscreenFailed', (error) => {
  console.warn('Fullscreen failed:', error);
});
```

### Запрет свайпов (Bot API 7.7+)

Отключение вертикальных свайпов предотвращает случайное закрытие приложения при взаимодействии с контентом.

**Автоматическая активация:**
```javascript
// Вызывается автоматически при инициализации в Base.astro
Telegram.WebApp.disableVerticalSwipes();
```

**Ручное управление:**
```javascript
// Запретить свайпы
Telegram.WebApp.disableVerticalSwipes();

// Включить свайпы обратно
Telegram.WebApp.enableVerticalSwipes();

// Проверить статус
console.log(Telegram.WebApp.isVerticalSwipesEnabled);
```

**Важно:**
- Пользователь всегда может закрыть приложение через заголовок Mini App
- `enableClosingConfirmation()` показывает подтверждение перед закрытием
- Back Button (Android) перехватывается и показывает диалог подтверждения

## UTM + Telegram

UTM-параметры автоматически добавляются к CTA ссылкам:

```
https://example.com?utm_source=telegram&utm_medium=webapp&utm_campaign=launch
```

Работает как в Telegram, так и в браузере.

## Производительность

✅ Скрипт Telegram загружается **asynchronously**  
✅ Инициализация **до рендера** страницы  
✅ Баннер показывается **только вне Telegram**  
✅ Минимальный JavaScript

## Troubleshooting

### Баннер не скрывается в Telegram

Проверьте, что `window.Telegram?.WebApp` существует:

```javascript
console.log(window.Telegram?.WebApp);
```

### Цвета темы не применяются

Проверьте DevTools → Elements → узел `<html>`:
- Должны быть CSS-переменные `--tg-theme-*`

### CTA не открывается в Telegram

Проверьте, что ссылка имеет `data-cta`:
```html
<a href="..." data-cta>Button</a>
```

### События не работают

Убедитесь, что вызван `Telegram.WebApp.ready()`.

## Примеры Mini Apps

- 🎮 @gamee — игры
- 📊 @etherscan_bot — блокчейн
- 🎨 @fragment — NFT

## Полезные ссылки

- 📚 https://core.telegram.org/bots/webapps
- 🤖 @BotFather — создание ботов
- 💬 https://t.me/BotDevChat — сообщество разработчиков
- 🛠️ https://github.com/telegram-mini-apps/sdk — SDK для других фреймворков

