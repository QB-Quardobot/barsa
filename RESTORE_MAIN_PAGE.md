# 🔄 Восстановление главной страницы

## Текущее состояние

**Главная страница временно заменена на тестовую для отладки Telegram WebApp.**

Бэкап оригинальной страницы сохранен в: `src/pages/index.astro.backup`

## Как вернуть обратно

После завершения тестирования выполните:

```bash
# Вариант 1: Через командную строку
cp src/pages/index.astro.backup src/pages/index.astro

# Вариант 2: Вручную
# Удалите src/pages/index.astro
# Переименуйте src/pages/index.astro.backup в src/pages/index.astro
```

## Что сейчас доступно

### Главная страница (тестовая)
- **URL**: `https://your-domain.trycloudflare.com/` или `https://xxxx.ngrok.io/`
- **Содержимое**: Тестовая страница с отладкой Telegram WebApp
- **Кнопки**: Test Init, Request Fullscreen, Disable Swipes, Show Info
- **Логи**: Видны прямо на странице

### Оригинальная страница
- **URL**: `/test-telegram` (если нужна отдельно)
- **Бэкап**: `src/pages/index.astro.backup`

## Как протестировать

1. Запустите Cloudflare туннель:
   ```bash
   npm run dev:cloudflare
   ```

2. Скопируйте полученный URL (типа `https://xxxx.trycloudflare.com`)

3. Откройте Mini App в Telegram - главная страница теперь тестовая

4. Смотрите логи прямо на экране

5. Нажимайте кнопки для тестирования функций

## После тестирования

Когда убедитесь что всё работает:

1. Восстановите главную страницу (команда выше)
2. Исправления уже применены в `src/layouts/Base.astro`
3. Полноэкранный режим и запрет свайпов будут работать на основной странице
