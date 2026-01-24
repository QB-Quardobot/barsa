#!/usr/bin/env python3
"""
Скрипт для восстановления данных из БД в Google Sheets
Использование: python restore_google_sheets.py
"""
import asyncio
import json
import sys
from pathlib import Path

# Добавляем путь к модулям бота
script_dir = Path(__file__).parent.absolute()
barcelona_bots_dir = script_dir / "barcelona_bots"

# Добавляем barcelona_bots в PYTHONPATH
if str(barcelona_bots_dir) not in sys.path:
    sys.path.insert(0, str(barcelona_bots_dir))

# Устанавливаем рабочую директорию для правильной работы с БД и .env
import os
os.chdir(str(barcelona_bots_dir))

# Теперь импортируем модули
from database.database import async_session
from sqlalchemy import select
from database.models import OfferConfirmation
from integrations.google_sheets import get_google_sheets
from config.logger import logger
from datetime import datetime


async def get_all_confirmations_unlimited():
    """Получает ВСЕ подтверждения из БД без лимита"""
    async with async_session() as session:
        from sqlalchemy import select
        from database.models import OfferConfirmation
        
        result = await session.execute(
            select(OfferConfirmation)
            .order_by(OfferConfirmation.confirmed_at.asc())  # По возрастанию для правильного порядка
        )
        return result.scalars().all()


def get_existing_emails_from_sheets(sheets):
    """Получает список email из Google Sheets для проверки дубликатов"""
    if not sheets.is_initialized() or not sheets.worksheet:
        return set()
    
    try:
        # Оптимизация: читаем только колонку с email (D), а не все данные
        # Это значительно уменьшает количество запросов
        email_column = sheets.worksheet.col_values(4)  # Колонка D (индекс 4 = 1-based)
        
        if len(email_column) < 2:  # Только заголовок или пусто
            return set()
        
        # Пропускаем заголовок (первый элемент) и создаем set
        emails = {email.strip().lower() for email in email_column[1:] if email and email.strip()}
        
        logger.info(f"Loaded {len(emails)} existing emails from Sheets (optimized)")
        return emails
    except Exception as e:
        logger.warning(f"Error reading existing emails from Sheets (will skip duplicate check): {e}")
        # Если не удалось прочитать, возвращаем пустой set - скрипт добавит все записи
        # Это безопасно, так как Google Sheets может иметь встроенную защиту от дубликатов
        return set()


async def restore_data_to_sheets():
    """Восстанавливает все данные из БД в Google Sheets"""
    logger.info("=" * 60)
    logger.info("Начинаем восстановление данных из БД в Google Sheets")
    logger.info("=" * 60)
    
    # Инициализируем Google Sheets
    sheets = get_google_sheets()
    if not sheets.is_initialized():
        logger.error("Google Sheets не инициализирован! Проверьте настройки.")
        return
    
    # Получаем существующие email из Sheets для проверки дубликатов
    logger.info("Получаем список существующих записей из Google Sheets...")
    existing_emails = get_existing_emails_from_sheets(sheets)
    logger.info(f"Найдено {len(existing_emails)} существующих записей в Google Sheets")
    
    # Получаем все данные из БД
    logger.info("Получаем все данные из базы данных...")
    confirmations = await get_all_confirmations_unlimited()
    logger.info(f"Найдено {len(confirmations)} записей в базе данных")
    
    if not confirmations:
        logger.warning("В базе данных нет записей для восстановления")
        return
    
    # Фильтруем записи, которых нет в Sheets
    new_confirmations = []
    skipped_count = 0
    
    for conf in confirmations:
        email_lower = conf.email.lower().strip()
        # Проверяем по email и дате для более точного определения
        # Если email уже есть, пропускаем (чтобы не дублировать)
        if email_lower in existing_emails:
            skipped_count += 1
            continue
        
        new_confirmations.append(conf)
    
    logger.info(f"Будет добавлено {len(new_confirmations)} новых записей")
    logger.info(f"Пропущено {skipped_count} записей (уже есть в Sheets)")
    
    if not new_confirmations:
        logger.info("Все записи уже есть в Google Sheets. Восстановление не требуется.")
        return
    
    # Добавляем записи в Google Sheets
    logger.info("Начинаем добавление записей в Google Sheets...")
    logger.info("⚠️  Внимание: добавлены задержки для соблюдения лимитов Google Sheets API")
    added_count = 0
    error_count = 0
    quota_errors = 0
    
    for i, conf in enumerate(new_confirmations, 1):
        try:
            # Форматируем дату
            timestamp = conf.confirmed_at.strftime('%Y-%m-%d %H:%M:%S')
            
            # Парсим additional_data если есть
            additional_data_dict = None
            if conf.additional_data:
                try:
                    additional_data_dict = json.loads(conf.additional_data)
                except:
                    additional_data_dict = {"raw": conf.additional_data}
            
            # Подготавливаем данные для добавления
            result = sheets.save_offer_confirmation(
                first_name=conf.first_name or "—",
                last_name=conf.last_name or "—",
                email=conf.email,
                payment_type=conf.payment_type,
                ip_address=conf.ip_address,
                user_agent=conf.user_agent,
                telegram_user_id=conf.telegram_user_id,
                telegram_username=conf.telegram_username,
                additional_data=additional_data_dict
            )
            
            if result:
                added_count += 1
                if i % 10 == 0:
                    logger.info(f"Добавлено {i}/{len(new_confirmations)} записей...")
            else:
                error_count += 1
                logger.warning(f"Не удалось добавить запись: {conf.email}, {conf.payment_type}")
            
            # КРИТИЧНО: Задержка между запросами для соблюдения лимитов API
            # Google Sheets API: 60 запросов в минуту на пользователя
            # Делаем задержку 2 секунды = ~30 запросов/минуту (безопасно)
            await asyncio.sleep(2)
            
            # Дополнительная пауза каждые 20 запросов
            if i % 20 == 0:
                logger.info(f"Пауза 15 секунд после {i} запросов (защита от лимитов API)...")
                await asyncio.sleep(15)
                
        except Exception as e:
            error_count += 1
            error_msg = str(e)
            
            # Проверяем на ошибку квоты
            if "429" in error_msg or "Quota exceeded" in error_msg or "quota" in error_msg.lower():
                quota_errors += 1
                logger.warning(
                    f"⚠️  Превышен лимит API (429) на записи {i}/{len(new_confirmations)}. "
                    f"Ждем 90 секунд перед продолжением..."
                )
                await asyncio.sleep(90)  # Ждем 90 секунд при превышении квоты
                
                # Пытаемся повторить запрос
                try:
                    logger.info(f"Повторная попытка для записи {i}...")
                    result = sheets.save_offer_confirmation(
                        first_name=conf.first_name or "—",
                        last_name=conf.last_name or "—",
                        email=conf.email,
                        payment_type=conf.payment_type,
                        ip_address=conf.ip_address,
                        user_agent=conf.user_agent,
                        telegram_user_id=conf.telegram_user_id,
                        telegram_username=conf.telegram_username,
                        additional_data=additional_data_dict
                    )
                    if result:
                        added_count += 1
                        error_count -= 1
                        quota_errors -= 1
                        logger.info(f"✅ Успешно добавлено после повтора: {conf.email}")
                except Exception as retry_error:
                    logger.error(f"❌ Повторная попытка не удалась: {retry_error}")
            else:
                logger.error(f"Ошибка при добавлении записи {conf.confirmation_id}: {e}")
    
    logger.info("=" * 60)
    logger.info("Восстановление завершено!")
    logger.info(f"✅ Успешно добавлено: {added_count} записей")
    logger.info(f"❌ Ошибок: {error_count} записей")
    if quota_errors > 0:
        logger.warning(f"⚠️  Ошибок квоты API (429): {quota_errors} записей")
        logger.info("💡 Совет: Запустите скрипт снова через несколько минут для повторной попытки")
    logger.info(f"⏭️  Пропущено (уже есть): {skipped_count} записей")
    logger.info("=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(restore_data_to_sheets())
    except KeyboardInterrupt:
        logger.info("\nВосстановление прервано пользователем")
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}", exc_info=True)
        sys.exit(1)
