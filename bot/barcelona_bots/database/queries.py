from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.logger import logger
from database.database import connection
from database.models import Clients


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