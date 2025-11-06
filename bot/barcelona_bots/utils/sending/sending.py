import asyncio
import os
from typing import Optional, Union, Dict, List

from aiogram import Bot, types
from aiogram.types import BufferedInputFile
from sqlalchemy import Boolean

from config.config import ALEX_KLYAUZER_ID
from config.logger import logger

MAX_MSGS_PER_SEC = 29
MAX_MSGS_PER_USER_PER_SEC = 1
CONCURRENCY_LIMIT = 29  # по сути 30 копий в секунду


# Для отправки из бота для пользователей всегда использовать!
semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
"""
Как работает universal_broadcast?

В приведённых примерах материалы присылаются в admin_bot

1) Отправка сообщения по его id из текущего бота
result = await universal_broadcast(
        send_bot=admin_bot,
        content=message,
        user_ids=[callback.from_user.id]
    )
2) Отправка сообщения через другого бота объектом message
result = await universal_broadcast(
    send_bot=bot,
    content=message,
    user_ids=all_bot_users,
    reply_markup=keyboard,
    another_bot=True
)
3) Отправка сообщения текстового через любого переданного бота


"""


async def universal_broadcast(
        send_bot: Bot,
        content: Union[
            str,
            types.Message
        ],
        user_ids: List[int],
        parse_mode: Optional[str] = None,
        reply_markup: Optional[types.InlineKeyboardMarkup] = None,
        another_bot: Optional[Boolean] = None,
        throttle_delay: float = 0.05,
        chunk_size: int = 100
) -> Dict[str, Union[int, Dict[str, int]]]:
    """
    Универсальная рассылка любых типов контента

    :param send_bot: Бот для отправки
    :param content: Контент для отправки (текст, сообщение, медиа)
    :param user_ids: Список ID пользователей
    :param parse_mode: Форматирование текста
    :param reply_markup: Кнопки под сообщением
    :param another_bot: True если отправка через второго бота
    :param throttle_delay: Задержка между отправками (сек)
    :param chunk_size: Размер пакета пользователей
    :return: Статистика {success, failed, errors}

    Пример вызова для отправки через другого бота:
    result = await universal_broadcast(
        send_bot=admin_bot,
        content=message, # types.Message
        user_ids=users_list)
    """

    stats = {
        'total': len(user_ids),
        'success': 0,
        'failed': 0,
        'errors': {}
    }

    msg_id = None
    # Если передали объект message, то надо отправить ALEX_KLYAUZER_ID.
    if isinstance(content, types.Message) and another_bot:
        from config.bots import user_bot
        # Отправляем админу в приватный чат сообщение для рассылки и получаем id этого сообщения для copy
        msg_id = await forward_message_with_entities(
            source_message= content,
            target_bot=user_bot)

        # Проверяем, что сообщение дошло:
        if msg_id is None:
            logger.warning(f"[universal_broadcast]: Функция forward_message_with_entities не вернула айди сообщения для рассылки!")
            return stats
        # Меняем сообщение из одного бота на такое же в другом
        content = msg_id


    async with semaphore:
        async def send_to_user(user_id: int):
            try:
                logger.info(
                    f"[send_to_user]: Начата отправка пользователю с id {user_id}")
                # if msg_id:
                #     # Должно работать только здесь при передаче another_bot=True
                #     await send_bot.copy_message(
                #         chat_id=user_id,
                #         from_chat_id=ALEX_KLYAUZER_ID,
                #         message_id=msg_id
                #     )
                if content.photo:
                    logger.info(
                        f"[send_to_user]: Отправляется фото в рассылке пользователю с id {user_id}")
                    await send_bot.send_photo(
                        user_id,
                        content.photo[-1].file_id,
                        caption=content.caption or None,
                        caption_entities=content.caption_entities or None,
                        reply_markup=reply_markup or None
                    )
                elif content.video:
                    logger.info(
                        f"[send_to_user]: Отправляется видео в рассылке пользователю с id {user_id}")
                    await send_bot.send_video(
                        user_id,
                        content.video.file_id,
                        caption=content.caption or None,
                        caption_entities=content.caption_entities or None,
                        reply_markup=reply_markup or None
                    )



                elif content.voice:
                    logger.info(
                        f"[send_to_user]: Отправляется голосовое в рассылке пользователю с id {user_id}")
                    await send_bot.send_voice(
                        chat_id=user_id,
                        voice=content.voice.file_id,
                        caption=content.caption or None,
                        caption_entities=content.caption_entities or None,
                        reply_markup=reply_markup or None
                    )
                    # file = await get_file_from_message(content)
                    # await send_bot.send_voice(
                    #     chat_id=user_id,
                    #     voice=file,
                    #     caption=content.caption or None,
                    #     caption_entities=content.caption_entities or None,
                    # )

                elif content.video_note:
                    logger.info(
                        f"[send_to_user]: Отправляется кругляшок в рассылке пользователю с id {user_id}")
                    # file = await get_file_from_message(content)
                    # sent_msg = await send_bot.send_video_note(
                    #     chat_id=user_id,
                    #     video_note=file
                    # )
                    await send_bot.send_video_note(
                        chat_id=user_id,
                        video_note=content.video_note.file_id,
                        reply_markup=reply_markup or None
                    )

                elif content.text:
                    logger.info(
                        f"[send_to_user]: Отправляется текст в рассылке пользователю с id {user_id}")
                    await send_bot.send_message(
                        user_id,
                        content.text,
                        entities=content.entities or None,
                        reply_markup=reply_markup or None
                    )


                # Если передан текст
                elif isinstance(content, str):
                    logger.info(
                        f"[send_to_user]: Отправляется текст (передан как str) в рассылке пользователю с id {user_id}")
                    await send_bot.send_message(
                        user_id,
                        content,
                        parse_mode=parse_mode,
                        reply_markup=reply_markup
                    )
                # Если нет ошибок, то отправлено успешно
                stats['success'] += 1

            except Exception as e:
                error_name = type(e).__name__
                stats['errors'][error_name] = stats['errors'].get(error_name, 0) + 1
                stats['failed'] += 1
                logger.error(f"Ошибка отправки для {user_id}: {e}")

    # Отправка с чанкованием и задержкой
    for i in range(0, len(user_ids), chunk_size):
        chunk = user_ids[i:i + chunk_size]
        tasks = [send_to_user(user_id) for user_id in chunk]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        await asyncio.sleep(throttle_delay * chunk_size)

    return stats

from typing import Tuple, Optional, Union, List
import io
# ALEX_KLYAUZER_ID уже импортирован из config.config в начале файла

async def forward_message_with_entities(
        source_message: types.Message,
        target_bot: Bot,
        target_chat_id: int = ALEX_KLYAUZER_ID,
):
    """
    Пересылает сообщение между ботами с сохранением форматирования
    без сохранения файлов на диск

    :param source_message: Исходное сообщение от первого бота
    :param target_bot: Бот для отправки
    :param target_chat_id: ID чата для пересылки
    :return: msg - объект сообщения в нужном боте
    """
    try:
        async with semaphore:
            # Для текстовых сообщений с форматированием
            if source_message.text:
                logger.info(
                    f"[forward_message_with_entities]: Отправка текстового сообщения через заданного бота для получения id")
                sent_msg = await target_bot.send_message(
                    chat_id=target_chat_id,
                    text=source_message.text,
                    entities=source_message.entities,
                    reply_markup=source_message.reply_markup or None
                )
                return sent_msg

            # Для медиа с подписями и форматированием
            elif source_message.caption:
                # Создаем временный файл в памяти
                file = await get_file_from_message(source_message)

                if source_message.photo:
                    logger.info(
                        f"[forward_message_with_entities]: Отправка фото сообщение с описанием через заданного бота для получения id")
                    sent_msg = await target_bot.send_photo(
                        chat_id=target_chat_id,
                        photo=file,
                        caption=source_message.caption or None,
                        caption_entities=source_message.caption_entities or None,
                        reply_markup=source_message.reply_markup or None
                    )
                elif source_message.video:
                    logger.info(
                        f"[forward_message_with_entities]: Отправка видео сообщение с описанием через заданного бота для получения id")
                    sent_msg = await target_bot.send_video(
                        chat_id=target_chat_id,
                        video=file,
                        caption=source_message.caption or None,
                        caption_entities=source_message.caption_entities or None,
                        reply_markup=source_message.reply_markup or None
                    )
                elif source_message.document:
                    logger.info(
                        f"[forward_message_with_entities]: Отправка документ сообщение с описанием через заданного бота для получения id")
                    sent_msg = await target_bot.send_document(
                        chat_id=target_chat_id,
                        document=file,
                        caption=source_message.caption or None,
                        caption_entities=source_message.caption_entities or None,
                        reply_markup=source_message.reply_markup or None
                    )
                return sent_msg

            # Для медиа без подписи
            elif source_message.photo or source_message.video or source_message.document:
                file = await get_file_from_message(source_message)

                if source_message.photo:
                    logger.info(
                        f"[forward_message_with_entities]: Отправка фото сообщение без описания через заданного бота для получения id")
                    sent_msg = await target_bot.send_photo(
                        chat_id=target_chat_id,
                        photo=file,
                        reply_markup=source_message.reply_markup or None
                    )
                elif source_message.video:
                    logger.info(
                        f"[forward_message_with_entities]: Отправка видео сообщение без описания через заданного бота для получения id")
                    sent_msg = await target_bot.send_video(
                        chat_id=target_chat_id,
                        video=file,
                        reply_markup=source_message.reply_markup or None
                    )
                else:
                    logger.info(
                        f"[forward_message_with_entities]: Отправка документ сообщение без описания через заданного бота для получения id")
                    sent_msg = await target_bot.send_document(
                        chat_id=target_chat_id,
                        document=file,
                        reply_markup=source_message.reply_markup or None
                    )
                return sent_msg

            elif source_message.voice:
                logger.info(f"[forward_message_with_entities]: Отправка голосовое сообщение через заданного бота для получения id")
                file = await get_file_from_message(source_message)
                sent_msg = await target_bot.send_voice(
                    chat_id=target_chat_id,
                    voice=file,
                    caption=source_message.caption or None,
                    caption_entities=source_message.caption_entities or None,
                    reply_markup=source_message.reply_markup or None
                )
                return sent_msg

            elif source_message.video_note:
                logger.info(f"[forward_message_with_entities]: Отправка видео сообщение (кружок) через заданного бота для получения id")
                file = await get_file_from_message(source_message)
                sent_msg = await target_bot.send_video_note(
                    chat_id=target_chat_id,
                    video_note=file,
                    reply_markup=source_message.reply_markup or None
                )
                return sent_msg

            logger.warning(f"Неподдерживаемый тип сообщения для рассылки!!!")
            return None

    except Exception as e:
        logger.warning(f"Ошибка отправки сообщения для рассылки на ALEX_KLYAUZER_ID: {e}")

        return None

async def get_file_from_message(message: types.Message) -> BufferedInputFile:
    """Получает файл из сообщения в память (без сохранения на диск)"""
    file_id = None
    filename = "file"

    if message.photo:
        file_id = message.photo[-1].file_id
        filename = message.photo[-1].file_unique_id + ".jpg"

    elif message.video:
        file_id = message.video.file_id
        filename = message.video.file_name or "video.mp4"

    elif message.document:
        file_id = message.document.file_id
        filename = message.document.file_name or "document"

    elif message.voice:
        file_id = message.voice.file_id
        filename = message.voice.file_unique_id + ".ogg"

    elif message.audio:
        file_id = message.audio.file_id
        filename = message.audio.file_name or message.audio.file_unique_id + ".mp3"

    elif message.video_note:
        file_id = message.video_note.file_id
        filename = message.video_note.file_unique_id + ".mp4"

    elif message.sticker:
        file_id = message.sticker.file_id
        filename = message.sticker.file_unique_id + ".webp"

    else:
        raise ValueError("Unsupported media type")

    file = await message.bot.get_file(file_id)
    file_data = io.BytesIO()
    await message.bot.download_file(file.file_path, destination=file_data)
    file_data.seek(0)

    return BufferedInputFile(file_data.read(), filename=filename)

# async def universal_broadcast(
#         send_bot: Bot,
#         content: Union[
#             str,
#             types.Message
#         ],
#         user_ids: List[int],
#         parse_mode: Optional[str] = None,
#         reply_markup: Optional[types.InlineKeyboardMarkup] = None,
#         another_bot: Optional[Boolean] = None,
#         throttle_delay: float = 0.05,
#         chunk_size: int = 100
# ) -> Dict[str, Union[int, Dict[str, int]]]:
#     """
#     Универсальная рассылка любых типов контента
#
#     :param send_bot: Бот для отправки
#     :param content: Контент для отправки (текст, сообщение, медиа)
#     :param user_ids: Список ID пользователей
#     :param parse_mode: Форматирование текста
#     :param reply_markup: Кнопки под сообщением
#     :param another_bot: True если отправка через второго бота
#     :param throttle_delay: Задержка между отправками (сек)
#     :param chunk_size: Размер пакета пользователей
#     :return: Статистика {success, failed, errors}
#     """
#     stats = {
#         'total': len(user_ids),
#         'success': 0,
#         'failed': 0,
#         'errors': {}
#     }
#
#     msg_id = None
#     # Если передали объект message, то надо отправить ALEX_KLYAUZER_ID.
#     if isinstance(content, types.Message) and another_bot:
#         from main import user_bot
#         # Отправляем админу в приватный чат сообщение для рассылки и получаем id этого сообщения для copy
#         msg_id = await forward_message_with_entities(source_message= content,target_bot=user_bot)
#     async with semaphore:
#         async def send_to_user(user_id: int):
#             try:
#                 if msg_id:
#                     # Должно работать только здесь при передаче another_bot=True
#                     await send_bot.copy_message(
#                         chat_id=user_id,
#                         from_chat_id=ALEX_KLYAUZER_ID,
#                         message_id=msg_id
#                     )
#                 elif content.photo:
#                     await send_bot.send_photo(
#                         user_id,
#                         content.photo[-1].file_id,
#                         caption=content.caption or None,
#                         caption_entities=content.caption_entities or None,
#                         reply_markup=reply_markup or None
#                     )
#                 elif content.video:
#                     await send_bot.send_video(
#                         user_id,
#                         content.video.file_id,
#                         caption=content.caption or None,
#                         caption_entities=content.caption_entities or None,
#                         reply_markup=reply_markup or None
#                     )
#                 # Добавьте другие типы медиа по аналогии
#                 elif content.text:
#                     await send_bot.send_message(
#                         user_id,
#                         content.text,
#                         entities=content.entities or None,
#                         reply_markup=reply_markup or None
#                     )
#
#                 # Если передан текст
#                 elif isinstance(content, str):
#                     await send_bot.send_message(
#                         user_id,
#                         content,
#                         parse_mode=parse_mode,
#                         reply_markup=reply_markup
#                     )
#                 # Если нет ошибок, то отправлено успешно
#                 stats['success'] += 1
#
#             except Exception as e:
#                 error_name = type(e).__name__
#                 stats['errors'][error_name] = stats['errors'].get(error_name, 0) + 1
#                 stats['failed'] += 1
#                 logger.error(f"Ошибка отправки для {user_id}: {e}")
#
#     # Отправка с чанкованием и задержкой
#     for i in range(0, len(user_ids), chunk_size):
#         chunk = user_ids[i:i + chunk_size]
#         tasks = [send_to_user(user_id) for user_id in chunk]
#         results = await asyncio.gather(*tasks, return_exceptions=True)
#         await asyncio.sleep(throttle_delay * chunk_size)
#
#     return stats
#
# from typing import Tuple, Optional
# import io
#
# async def forward_message_with_entities(
#         source_message: types.Message,
#         target_bot: Bot,
#         target_chat_id: int = ALEX_KLYAUZER_ID,
# ) -> Tuple[bool, Optional[int]]:
#     """
#     Пересылает сообщение между ботами с сохранением форматирования
#     без сохранения файлов на диск
#
#     :param source_message: Исходное сообщение от первого бота
#     :param target_bot: Бот для отправки
#     :param target_chat_id: ID чата для пересылки
#     :return: msg_id - ID отправленного сообщения
#     """
#     try:
#         async with semaphore:
#             # Для текстовых сообщений с форматированием
#             if source_message.text:
#                 sent_msg = await target_bot.send_message(
#                     chat_id=target_chat_id,
#                     text=source_message.text,
#                     entities=source_message.entities,
#                 )
#                 return sent_msg.message_id
#
#             # Для медиа с подписями и форматированием
#             elif source_message.caption:
#                 # Создаем временный файл в памяти
#                 file = await get_file_from_message(source_message)
#
#                 if source_message.photo:
#                     sent_msg = await target_bot.send_photo(
#                         chat_id=target_chat_id,
#                         photo=file,
#                         caption=source_message.caption or None,
#                         caption_entities=source_message.caption_entities or None,
#                     )
#                 elif source_message.video:
#                     sent_msg = await target_bot.send_video(
#                         chat_id=target_chat_id,
#                         video=file,
#                         caption=source_message.caption or None,
#                         caption_entities=source_message.caption_entities or None,
#                     )
#                 elif source_message.document:
#                     sent_msg = await target_bot.send_document(
#                         chat_id=target_chat_id,
#                         document=file,
#                         caption=source_message.caption or None,
#                         caption_entities=source_message.caption_entities or None,
#                     )
#                 return sent_msg.message_id
#
#             # Для медиа без подписи
#             elif source_message.photo or source_message.video or source_message.document:
#                 file = await get_file_from_message(source_message)
#
#                 if source_message.photo:
#                     sent_msg = await target_bot.send_photo(
#                         chat_id=target_chat_id,
#                         photo=file
#                     )
#                 elif source_message.video:
#                     sent_msg = await target_bot.send_video(
#                         chat_id=target_chat_id,
#                         video=file
#                     )
#                 else:
#                     sent_msg = await target_bot.send_document(
#                         chat_id=target_chat_id,
#                         document=file
#                     )
#                 return sent_msg.message_id
#
#             logger.warning(f"Неподдерживаемый тип сообщения для рассылки!!!")
#             return None
#
#     except Exception as e:
#         logger.error(f"Ошибка отправки сообщения для рассылки на ALEX_KLYAUZER_ID: {e}")
#
#         return None
#
# async def get_file_from_message(message: types.Message) -> BufferedInputFile:
#     """Получает файл из сообщения в память (без сохранения на диск)"""
#     file_id = (
#         message.photo[-1].file_id if message.photo else
#         message.video.file_id if message.video else
#         message.document.file_id if message.document else
#         None
#     )
#
#     if not file_id:
#         raise ValueError("Unsupported media type")
#
#     file = await message.bot.get_file(file_id)
#     file_data = io.BytesIO()
#     await message.bot.download_file(file.file_path, destination=file_data)
#     file_data.seek(0)
#
#     filename = (
#         message.photo[-1].file_unique_id + ".jpg" if message.photo else
#         message.video.file_name or "video.mp4" if message.video else
#         message.document.file_name or "file"
#     )
#
#     return BufferedInputFile(file_data.read(), filename=filename)