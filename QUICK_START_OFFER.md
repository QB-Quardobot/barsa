# Быстрый старт - Страницы оферты и оплаты

## Что было реализовано

✅ Две страницы оферты:
- `/installment` - для внутренней рассрочки
- `/crypto` - для криптоплатежа

✅ Страница оплаты:
- `/payment` - с редиректом на платёжную систему

✅ База данных:
- Модель `OfferConfirmation` для хранения данных

✅ API сервер:
- FastAPI endpoint для сохранения данных
- Запускается параллельно с ботом

✅ Безопасность:
- `noindex, nofollow` для всех страниц
- Исключены из sitemap
- Защита от повторной отправки

## Что нужно настроить

### 1. Текст оферты

Замените `OFFER_TEXT` в файлах:
- `src/pages/installment.astro`
- `src/pages/crypto.astro`

### 2. Платёжные ссылки

Установите через переменные окружения:
```env
PUBLIC_INSTALLMENT_PAYMENT_URL=https://your-link.com/installment
PUBLIC_CRYPTO_PAYMENT_URL=https://your-link.com/crypto
```

Или напрямую в `src/pages/payment.astro`

### 3. API Endpoint

Установите URL API сервера:
```env
PUBLIC_API_ENDPOINT=http://localhost:8000/api/offer-confirmation
```

В продакшене: `https://your-api-domain.com/api/offer-confirmation`

### 4. Запуск

```bash
# Установить зависимости
cd bot/barcelona_bots
pip install fastapi uvicorn[standard]

# Запустить бота с API
python main.py
```

## Использование

Отправьте клиентам ссылки:
- Рассрочка: `https://your-domain.com/installment`
- Крипта: `https://your-domain.com/crypto`

## Проверка

1. Откройте `/installment` или `/crypto`
2. Заполните форму
3. Проверьте сохранение в БД
4. Проверьте переход на `/payment`
5. Проверьте редирект на платёжную систему

Подробная документация: `OFFER_PAGES_SETUP.md`
