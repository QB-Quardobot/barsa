# AI Model 2.0 Landing Page

> Профессиональный лендинг для продвижения системы заработка на AI-моделях. Построен на Astro + Tailwind CSS с поддержкой Telegram WebApp.

[![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Telegram](https://img.shields.io/badge/Telegram-0088cc?logo=telegram&logoColor=white)](https://core.telegram.org/bots/webapps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Особенности

- **Astro** - быстрый статический генератор с SSR
- **Tailwind CSS** - utility-first CSS фреймворк
- **Telegram WebApp API** - нативная поддержка Telegram Mini Apps
- **Intersection Observer** - плавные reveal-анимации
- **Темная тема** - профессиональный дизайн в стиле tgmonopoly.ru
- **UTM-метки** - автоматическое отслеживание кампаний
- **SEO-оптимизация** - Open Graph, Twitter Card, meta-теги
- **Accessibility (A11Y)** - WCAG 2.1 AA compliance
- **Lighthouse 95+** - максимальная производительность
- **Локальные шрифты** - Inter с preload и font-display: swap
- **Адаптивный дизайн** - мобильные устройства и десктоп

## 🛠 Технологии

- [Astro](https://astro.build) - Static Site Generator
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Telegram WebApp](https://core.telegram.org/bots/webapps) - Mini Apps API
- [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Scroll animations

## 📁 Структура проекта

```
.
├── public/
│   ├── fonts/                    # Локальные шрифты Inter (woff2)
│   ├── favicon.svg               # Иконка сайта
│   ├── og.jpg                    # OG изображение
│   └── placeholder-*.svg         # Placeholder изображения для галереи
├── src/
│   ├── components/
│   │   ├── Countdown.astro       # Таймер обратного отсчёта (24ч)
│   │   ├── Countdown.ts          # Логика таймера (vanilla TS)
│   │   └── FeatureCard.astro     # Карточки фич (1px border-gradient)
│   ├── layouts/
│   │   └── Base.astro            # Базовый layout: SEO + Telegram + UTM
│   ├── lib/
│   │   ├── reveal.ts             # Intersection Observer анимации
│   │   ├── reveal-init.ts        # Инициализация reveal
│   │   ├── telegram.ts           # Telegram WebApp API wrapper
│   │   └── utm.ts                # UTM parsing и sessionStorage
│   ├── pages/
│   │   ├── index.astro           # Главная страница (Hero + Features + Stats)
│   │   └── policy.astro          # Политика конфиденциальности
│   └── styles/
│       └── global.css             # Дизайн-токены, reveal-анимации, типографика
├── astro.config.mjs              # Конфигурация Astro
├── tailwind.config.js            # Конфигурация Tailwind (1200px container)
├── package.json
└── README.md
```

## 🛠 Установка и запуск

### Требования

- Node.js 18+
- npm или yarn

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сайт будет доступен на http://localhost:4321

# Запуск с ngrok туннелем для тестирования Telegram Mini App
npm run dev:ngrok

# Или используйте Cloudflare Tunnel (БЕСПЛАТНО, без регистрации!)
npm run dev:cloudflare
```

📱 **Тестирование в Telegram:** См. [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) для подробных инструкций.

**Проще всего:** `npm run dev:cloudflare` - работает без регистрации!

### Деплой на Cloudflare Pages (для Telegram Mini App)

```bash
# Быстрый деплой одной командой
npm run deploy:cf

# Получите URL вида: https://ai-model-landing.pages.dev
# Используйте его в BotFather как домен для вашего бота!
```

### Сборка для продакшена

```bash
# Сборка проекта
npm run build

# Предпросмотр собранного проекта
npm run preview
```

## 🌐 Деплой на Cloudflare Pages

### Через CLI

```bash
# Установка Wrangler CLI
npm install -g wrangler

# Авторизация
wrangler login

# Деплой
npm run build
wrangler pages deploy dist
```

### Через GitHub

1. Загрузите проект в GitHub репозиторий
2. Перейдите в Cloudflare Dashboard → Pages
3. Создайте новый проект → Connect to Git
4. Выберите репозиторий
5. Настройки сборки:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Нажмите "Save and Deploy"

### Через GitLab/GitHub Actions

Добавьте workflow файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: your-project-name
          directory: dist
```

## 🎨 Настройка дизайн-токенов

Дизайн-токены определены в `src/styles/global.css` через CSS переменные:

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
  --color-accent: #f59e0b;
  --color-muted: #6b7280;
  --color-bg: #0a0a0a;
  --color-bg-secondary: #1a1a1a;
  --color-fg: #ffffff;
  --color-fg-muted: #9ca3af;
}
```

Изменяйте эти значения для настройки цветовой схемы.

## 📱 UTM-метки

Все CTA ссылки автоматически получают UTM-параметры из URL:

- `utm_source` - источник трафика
- `utm_medium` - канал
- `utm_campaign` - название кампании
- `utm_term` - ключевое слово
- `utm_content` - контент

Пример: `https://yoursite.com/?utm_source=google&utm_campaign=summer2024`

CTA ссылки добавят эти параметры автоматически.

## 🤖 Telegram WebApp Integration

Проект включает нативную поддержку [Telegram WebApp API](https://core.telegram.org/bots/webapps):

- Автоматическое обнаружение Telegram-окружения
- Применение темы из `Telegram.WebApp.themeParams`
- Инициализация через `Telegram.WebApp.ready()` и `Telegram.WebApp.expand()`
- Открытие ссылок через `Telegram.WebApp.openLink()` (в Telegram)
- Banner "Открой в Telegram" для обычных браузеров
- Подписка на `themeChanged` для динамической смены темы

Документация: `TELEGRAM_WEBAPP.md`

## 🔍 SEO

Страницы включают:
- Meta title и description
- Open Graph теги для Facebook
- Twitter Card теги
- Корректный viewport
- Canonical URL
- Preload для шрифтов

Обновите мета-данные в каждом layout.

## 🎯 Производительность

Для достижения Lighthouse 95+:

- ✅ **Static HTML** - нулевой JS в основной сборке
- ✅ **Минимальный бандл** - только необходимый код
- ✅ **Lazy loading** - все изображения с `loading="lazy"`
- ✅ **WebP/градиенты** - оптимизированные ассеты
- ✅ **Font preload** - Inter шрифты с `font-display: swap`
- ✅ **Intersection Observer** - reveal-анимации без тяжёлых библиотек
- ✅ **CSS Variables** - дизайн-токены без JS
- ✅ **Page Visibility API** - остановка таймера при неактивной вкладке

## ♿ Accessibility (A11Y)

Проект соответствует [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/):

- ✅ Правильная иерархия заголовков (H1-H6)
- ✅ ARIA-атрибуты для интерактивных элементов
- ✅ Focus-стейты для всех интерактивных элементов
- ✅ Skip-to-content ссылка для screen readers
- ✅ `prefers-reduced-motion` поддержка
- ✅ Контрастность текста >= 4.5:1

Документация: `A11Y_AUDIT_FIXES.md`

## 📝 Лицензия

MIT

## 🤝 Поддержка

Для вопросов и предложений создайте Issue в репозитории.

---

Создано с помощью [Astro](https://astro.build) и [Tailwind CSS](https://tailwindcss.com)
