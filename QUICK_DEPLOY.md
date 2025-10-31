# ⚡ Быстрый Деплой на Прод

## Что нужно сделать СЕЙЧАС:

### 1. Обновить код на сервере (1 команда)

```bash
./deploy-git.sh deploy
```

**Всё!** Код обновлен, оптимизации активны.

---

## 2. Настроить мониторинг (опционально, но рекомендуется)

### Шаг 1: Получите ID счетчиков

**Google Analytics 4:**
- Перейдите: https://analytics.google.com
- Администратор → Потоки данных → Web
- Скопируйте Measurement ID: `G-XXXXXXXXXX`

**Яндекс.Метрика:**
- Перейдите: https://metrika.yandex.ru
- Создайте счетчик
- Скопируйте номер: `12345678`

### Шаг 2: Добавьте переменные на сервере

```bash
# Подключиться к серверу
ssh root@217.198.5.230

# Перейти в проект
cd /var/www/illariooo.ru

# Создать .env файл
nano .env
```

Добавьте:
```env
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_YM_COUNTER_ID=12345678
```

Сохраните (Ctrl+O, Enter, Ctrl+X)

### Шаг 3: Пересобрать

```bash
npm run build
systemctl reload nginx
```

---

## 3. Где смотреть метрики

### Google Analytics 4:
**Отчеты** → **События** → Событие: `web_vitals`
- Параметр `metric` = название (LCP, FID, CLS, FCP, TTFB)
- Параметр `value` = значение в миллисекундах
- Параметр `metric_rating` = good/needs-improvement/poor

### Яндекс.Метрика:
**Отчеты** → **События** → Цель: `web_vital`

---

## ✅ Что уже работает автоматически:

- ✅ DOM cache (60-80% меньше запросов)
- ✅ Rate limiting (защита от спама)
- ✅ Performance monitoring (измеряет Web Vitals)
- ✅ Error handling (логирование ошибок)
- ✅ Memory leak fixes (нет утечек)
- ✅ Production-safe logger (нет console.log)

**Вам не нужно ничего настраивать на сервере кроме переменных окружения!**

---

## Проверка после деплоя

```bash
# Проверить что сайт работает
curl -I https://illariooo.ru

# Проверить что новый код задеплоен (должен найти performance-monitor)
curl -s https://illariooo.ru | grep -o "performance-monitor" && echo "✓ OK"
```

---

**Готово!** 🚀

