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
        all_values = sheets.worksheet.get_all_values()
        if len(all_values) < 2:  # Только заголовки или пусто
            return set()
        
        # Email в колонке D (индекс 3)
        emails = set()
        for row in all_values[1:]:  # Пропускаем заголовок
            if len(row) > 3 and row[3]:  # Проверяем, что есть email
                emails.add(row[3].strip().lower())
        return emails
    except Exception as e:
        logger.error(f"Error reading existing emails from Sheets: {e}")
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
    added_count = 0
    error_count = 0
    
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
            
            # Небольшая задержка чтобы не перегружать API
            if i % 50 == 0:
                await asyncio.sleep(1)
                
        except Exception as e:
            error_count += 1
            logger.error(f"Ошибка при добавлении записи {conf.confirmation_id}: {e}")
    
    logger.info("=" * 60)
    logger.info("Восстановление завершено!")
    logger.info(f"✅ Успешно добавлено: {added_count} записей")
    logger.info(f"❌ Ошибок: {error_count} записей")
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
