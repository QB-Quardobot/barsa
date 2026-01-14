# Интеграция модального окна оферты на странице How It Works

## Обзор

Модальное окно оферты (`initOfferModal`) на странице `/how-it-works` теперь интегрировано с API сервером и поддерживает все интеграции:
- ✅ Сохранение в БД
- ✅ Google Sheets (если настроено)
- ✅ Email уведомления (если настроено)
- ✅ Webhook (если настроено)

## Как это работает

### Пользовательский путь

1. Пользователь выбирает тариф на странице `/how-it-works`
2. Открывается модальное окно выбора валюты
3. Пользователь выбирает валюту (₽ или €)
4. Открывается модальное окно оферты (`initOfferModal`)
5. Пользователь заполняет форму (Имя, Фамилия, Email)
6. Ставит галочку согласия
7. Нажимает "Далее"
8. **Данные сохраняются:**
   - В localStorage (fallback)
   - На API сервер → БД → Интеграции (Google Sheets, Email, Webhook)
9. Редирект на Tribute для оплаты

### Формат данных

Данные отправляются на API в формате:

```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "email": "ivan@example.com",
  "payment_type": "tariff_1_rub",
  "additional_data": {
    "tariff_id": "1",
    "tariff_name": "Самостоятельный",
    "currency": "rub",
    "payment_url": "https://t.me/tribute/app?startapp=sFEK",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Payment Type

Для основного процесса оплаты используется формат:
- `tariff_{tariffId}_{currency}`
- Например: `tariff_1_rub`, `tariff_2_eur`

Это позволяет различать:
- Основные тарифы (через how-it-works) - `tariff_*`
- Рассрочку - `installment`
- Криптоплатёж - `crypto`

## Настройка

### 1. API Endpoint

Установите переменную окружения:

```env
PUBLIC_API_ENDPOINT=http://localhost:8000/api/offer-confirmation
```

В продакшене:
```env
PUBLIC_API_ENDPOINT=https://your-api-domain.com/api/offer-confirmation
```

### 2. Интеграции

Настройте нужные интеграции (см. `INTEGRATIONS_SETUP.md`):
- Google Sheets
- Email уведомления
- Webhook

## Код

Функция `saveUserData` в `src/lib/how-it-works.ts` (строка ~2173):

```typescript
async function saveUserData(data: {
  firstName: string;
  lastName: string;
  email: string;
  tariffId: string;
  tariffName: string;
  currency: string;
  paymentUrl: string;
  timestamp: string;
}): Promise<void> {
  const API_ENDPOINT = import.meta.env.PUBLIC_API_ENDPOINT || 'http://localhost:8000/api/offer-confirmation';
  const paymentType = `tariff_${data.tariffId}_${data.currency}`;
  
  // Сохранение в localStorage (fallback)
  // ...
  
  // Отправка на API сервер
  await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      payment_type: paymentType,
      additional_data: { ... }
    }),
  });
}
```

## Особенности

- ✅ **Не блокирует оплату** - даже если API недоступен, пользователь все равно переходит к оплате
- ✅ **Fallback на localStorage** - данные сохраняются локально если API не работает
- ✅ **Логирование ошибок** - все ошибки логируются в консоль, но не прерывают процесс
- ✅ **Автоматические интеграции** - Google Sheets, Email, Webhook работают автоматически если настроены

## Проверка

1. Откройте `/how-it-works`
2. Выберите тариф
3. Выберите валюту
4. Заполните форму оферты
5. Нажмите "Далее"
6. Проверьте:
   - Консоль браузера - должен быть лог успешного сохранения
   - БД - новая запись
   - Google Sheets - новая строка (если настроено)
   - Email - уведомление (если настроено)
   - Webhook - запрос (если настроено)

## Отличия от страниц `/installment` и `/crypto`

| Параметр | How It Works | Installment/Crypto |
|----------|--------------|-------------------|
| Payment Type | `tariff_1_rub` | `installment` / `crypto` |
| Дополнительные данные | Тариф, валюта, URL | Только базовые данные |
| Источник | Модальное окно | Отдельная страница |
| API Endpoint | Тот же | Тот же |

Все используют один и тот же API endpoint и интеграции!
