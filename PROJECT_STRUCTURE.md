# Структура проекта

## Ключевые файлы

### Конфигурация

**`astro.config.mjs`**
- Конфигурация Astro
- Интеграция с Tailwind CSS
- Настройка site URL для SEO

**`tailwind.config.js`**
- Конфигурация Tailwind
- Дизайн-токены через CSS переменные
- Контейнер max-width 1200px

**`src/styles/global.css`**
- CSS переменные для цветов (primary, secondary, accent, muted, bg, fg)
- Шрифты Inter с @font-face
- Стандартные стили для кнопок и карточек
- Темная тема по умолчанию

### Layout

**`src/layouts/Base.astro`**
- SEO мета-теги (title, description, OG, Twitter)
- Preload шрифтов
- UTM-парсинг из URL
- Автоматическое добавление UTM к CTA ссылкам (атрибут `data-cta`)

### Pages

**`src/pages/index.astro`**
- Hero секция с большими заголовками
- Секция "О продукте" с карточками
- 2 CTA секции с кнопками
- Атрибут `data-cta` на всех внешних ссылках

**`src/pages/policy.astro`**
- Страница-заглушка с политикой конфиденциальности
- Использует Base layout
- Простой контент с карточками

### Утилиты

**`src/lib/utm.ts`**
- Функция для парсинга UTM из URL
- Функция для добавления UTM к ссылкам

### Public Assets

**`public/fonts/`**
- inter-regular.woff2
- inter-medium.woff2
- inter-bold.woff2

**`public/og.jpg`**
- OG изображение (1200x630 SVG)

**`public/favicon.svg`**
- Фавикон сайта

## Особенности реализации

### UTM-метки
1. Парсинг происходит в `Base.astro` из `Astro.url`
2. UTM параметры передаются в клиентский JS через `define:vars`
3. Все ссылки с `data-cta` автоматически получают UTM при клике
4. UTM добавляются на странице загрузки для всех CTA ссылок

### Дизайн
- Темная тема (#0a0a0a основной, #1a1a1a вторичный фон)
- Большие заголовки (text-6xl, text-8xl)
- Широкие отступы (py-20, px-4)
- Градиентные заголовки (от primary к accent)
- Карточки с border и padding
- Крупные CTA кнопки (px-8 py-4, text-lg)

### Производительность
- Статический HTML без лишнего JS
- Preload шрифтов
- font-display: swap
- Минимальные зависимости
- Оптимизация Lighthouse

## Команды

```bash
npm run dev      # Запуск dev-сервера на localhost:4321
npm run build    # Сборка для продакшена
npm run preview  # Предпросмотр собранного проекта
```

## Деплой на Cloudflare Pages

1. Загрузите проект в GitHub
2. Откройте Cloudflare Dashboard → Pages
3. Connect to Git → выберите репозиторий
4. Настройки:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy

## Тестирование UTM

Откройте сайт с UTM параметрами:
```
http://localhost:4321/?utm_source=google&utm_campaign=test&utm_medium=cpc
```

Все CTA кнопки автоматически получат эти параметры.

