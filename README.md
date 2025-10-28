# Landing Page - Astro + Tailwind CSS

Современный статический лендинг на Astro с Tailwind CSS в стиле темной темы.

## 🚀 Особенности

- **Astro** - быстрый статический генератор
- **Tailwind CSS** - utility-first CSS фреймворк
- **Темная тема** по умолчанию
- **Lighthouse 95+** - оптимизированная производительность
- **UTM-метки** - автоматическое добавление к CTA ссылкам
- **SEO-оптимизация** - мета-теги, Open Graph, Twitter Card
- **Локальные шрифты** - Inter с preload и font-display: swap
- **Адаптивный дизайн** - мобильные устройства и десктоп

## 📁 Структура проекта

```
.
├── public/
│   ├── fonts/          # Локальные шрифты Inter (woff2)
│   ├── favicon.svg     # Иконка сайта
│   └── og.jpg          # OG изображение
├── src/
│   ├── layouts/
│   │   └── Base.astro  # Базовый layout с SEO и UTM
│   ├── lib/
│   │   └── utm.ts      # Утилиты для работы с UTM
│   ├── pages/
│   │   ├── index.astro # Главная страница
│   │   └── policy.astro # Политика конфиденциальности
│   └── styles/
│       └── global.css  # Глобальные стили и токены
├── astro.config.mjs    # Конфигурация Astro
├── tailwind.config.js  # Конфигурация Tailwind
└── package.json
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

- ✅ Статический HTML без лишнего JS
- ✅ Минимальный размер бандла
- ✅ Lazy loading для изображений (добавьте `loading="lazy"`)
- ✅ Оптимизированные шрифты (woff2)
- ✅ Минимальные внешние зависимости

## 📝 Лицензия

MIT

## 🤝 Поддержка

Для вопросов и предложений создайте Issue в репозитории.

---

Создано с помощью [Astro](https://astro.build) и [Tailwind CSS](https://tailwindcss.com)
