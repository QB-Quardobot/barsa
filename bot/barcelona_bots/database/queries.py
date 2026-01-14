from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from config.logger import logger
from database.database import connection
from database.models import Clients, OfferConfirmation


@connection
async def add_new_user(session: AsyncSession, user_id: int, username: str, name: str, surname: str = None, reg_date: str = None):
    """Проверяет, есть ли пользователь в базе. Если нет — добавляет и возвращает True"""
    # Проверяем, есть ли пользователь в базе
    result = await session.execute(select(Clients).where(Clients.user_id == user_id))
    existing_user = result.scalars().first()

    if not existing_user:
        # Добавляем нового пользователя в базу
        user = Clients(user_id=user_id, username=username, name=name, surname=surname, reg_date=reg_date)
        session.add(user)
        await session.commit()
        logger.info(f"Было добавлен новый пользователь с id:{user_id}")
        return True

    return False

@connection
async def is_user(session: AsyncSession, user_id: int):
    """Проверяет, есть ли пользователь в базе. Если да, то True"""
    # Проверяем, есть ли пользователь в базе
    result = await session.execute(select(Clients).where(Clients.user_id == user_id))
    existing_user = result.scalars().first()

    if not existing_user:
        return False

    return True


@connection
async def save_offer_confirmation(
    session: AsyncSession,
    first_name: str,
    last_name: str,
    email: str,
    payment_type: str,
    ip_address: str = None,
    user_agent: str = None,
    additional_data: str = None
):
    """Сохраняет подтверждение оферты и данные клиента"""
    confirmation = OfferConfirmation(
        first_name=first_name,
        last_name=last_name,
        email=email,
        payment_type=payment_type,
        confirmed_at=datetime.now(timezone.utc),
        ip_address=ip_address,
        user_agent=user_agent,
        additional_data=additional_data
    )
    session.add(confirmation)
    await session.commit()
    logger.info(f"Сохранено подтверждение оферты: {email}, тип оплаты: {payment_type}")
    return confirmation.confirmation_id


@connection
async def get_admin_stats(session: AsyncSession):
    """Получает общую статистику для админки"""
    # Всего пользователей бота
    users_count = await session.execute(select(func.count(Clients.client_id)))
    total_users = users_count.scalar() or 0
    
    # Всего подтверждений
    confirmations_count = await session.execute(select(func.count(OfferConfirmation.confirmation_id)))
    total_confirmations = confirmations_count.scalar() or 0
    
    # Разбивка по типам оплаты
    crypto_count = await session.execute(
        select(func.count(OfferConfirmation.confirmation_id))
        .where(OfferConfirmation.payment_type == 'crypto')
    )
    total_crypto = crypto_count.scalar() or 0
    
    installment_count = await session.execute(
        select(func.count(OfferConfirmation.confirmation_id))
        .where(OfferConfirmation.payment_type == 'installment')
    )
    total_installment = installment_count.scalar() or 0
    
    return {
        "total_users": total_users,
        "total_confirmations": total_confirmations,
        "total_crypto": total_crypto,
        "total_installment": total_installment
    }


@connection
async def get_all_confirmations(session: AsyncSession, limit: int = 100):
    """Получает список последних подтверждений"""
    result = await session.execute(
        select(OfferConfirmation)
        .order_by(OfferConfirmation.confirmed_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@connection
async def get_all_users(session: AsyncSession, limit: int = 100):
    """Получает список пользователей бота"""
    result = await session.execute(
        select(Clients)
        .order_by(Clients.client_id.desc())
        .limit(limit)
    )
    return result.scalars().all()
