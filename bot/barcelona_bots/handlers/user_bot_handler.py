import asyncio
from datetime import timezone

from aiogram import types, F, Router  # pyright: ignore[reportMissingImports]
from aiogram.filters import CommandStart  # pyright: ignore[reportMissingImports]
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, CallbackQuery, WebAppInfo  # pyright: ignore[reportMissingImports]

from utils.time_scheduler import set_time_table
from config.config import ADMIN_IDS

from config.logger import logger
from config.bots import user_bot as bot
from config.bots import admin_bot
from database.queries import add_new_user, is_user
from materials.materials import text_1, text_2, text_3

router = Router()

@router.message(CommandStart())
async def start_handler(message:types.Message):
    if await is_user(user_id=message.from_user.id) is False:  # pyright: ignore[reportCallIssue]
        user_id = message.from_user.id
        username = message.from_user.username or None
        name = message.from_user.first_name
        surname = message.from_user.last_name or None
        # Делает дату в текущем часовом поясе и превращает в строку
        reg_date = message.date.astimezone(timezone.utc).isoformat()
        await add_new_user(user_id=user_id, username=username, name=name, surname=surname, reg_date=reg_date) # type: ignore
        try:
            # На случай нового клиента 517434370
            await admin_bot.send_message(517434370,f"Новый пользователь @{username if username else user_id} только что зашёл в вашего бота!")
            logger.info(f"Отправлено сообщение о новом пользователе {username if username else user_id} владельцу")
        except Exception as e:
            logger.error(f"Не удалось отправить статистическое сообщение о новом пользователе владельцу из-за ошибки:{e}")

        # Устанавливаем таймер для рассылки сообщений прогревочных
        await set_time_table(user_id=message.from_user.id)  # pyright: ignore[reportCallIssue]

    from urllib.parse import quote

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Оплатить 💳 ", callback_data="buy_product")
            ],
            [
                InlineKeyboardButton(
                    text="Проблема с оплатой",
                    url=f"https://t.me/illariooo?text={quote('У меня кое-что не получилось')}"
                )
            ]
        ]
    )

    # first_video_note_file_id = "DQACAgIAAxkBAAMaaLvkkPDyc897S6AMoilv919TGXIAAl1sAAKOaeFJOJrQgRosPQY2BA"
    # # Отправляем кружочек
    # await message.bot.send_video_note(
    #     chat_id=message.chat.id,
    #     video_note=first_video_note_file_id,
    # )

    # await asyncio.sleep(10)

    # await bot.send_message(
    #     chat_id=message.chat.id,
    #     text=text_1,
    #     disable_notification=True,
    #     parse_mode="MarkdownV2")
    
    # await asyncio.sleep(10)

    webapp_keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Получить AI-Model 2.0 ✅",
                    web_app=WebAppInfo(url="https://illariooo.ru")
                )
            ]
        ]
    )
    photo1_file_id = "AgACAgIAAxkBAAMgaQhq63qBJ0B0JwU870d1eyjJpSwAAk8Naxu0CkBIqtQrxzAPpUMBAAMCAAN5AAM2BA"
    await bot.send_photo(
        chat_id=message.chat.id,
        photo=photo1_file_id,
        caption=r"""Привет 👋

Как и обещал\)\)

Чтобы забрать файл, нажми на кнопку внизу 👇
""",
        disable_notification=True,
        parse_mode="MarkdownV2",
        reply_markup=webapp_keyboard
    )

@router.callback_query(F.data == "buy_product")
async def handele_buy_button(callback: CallbackQuery):
    logger.info(f"Пользователь с id {callback.from_user.id} нажал на кнопку 'Купить'")

    try:
        user_data = callback.from_user.username if callback.from_user.username else callback.from_user.id
        # На случай нового клиента 517434370
        await admin_bot.send_message(517434370,
                                     f"Новый пользователь @{callback.from_user.username if callback.from_user.username else callback.from_user.id} только что зашёл в вашего бота!")
        logger.info(f"Отправлено сообщение о кнопке купить от {user_data} владельцу")
    except Exception as e:
        logger.error(f"Не удалось отправить статистическое сообщение о новом нажатии на кнопку купить владельцу из-за ошибки:{e}")

    from urllib.parse import quote
    # Используем HTML для зачеркнутого текста в сообщении
    price_text = (
        "💰 <b>Выберите способ оплаты:</b>\n\n"
        "💶 <s>250€</s> 175€\n"
        "💵 <s>24.000 ₽</s> 16.500 ₽"
    )
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="КУПИТЬ - 16.500₽", url="https://t.me/tribute/app?startapp=sGCD"),
                InlineKeyboardButton(text="КУПИТЬ - 175€", url="https://t.me/tribute/app?startapp=sGCB")
            ],
            [
                InlineKeyboardButton(
                    text="Проблема с оплатой",
                    url=f"https://t.me/illariooo?text={quote('У меня кое-что не получилось')}"
                )
            ]
        ]
    )
    
    # Редактируем сообщение с зачеркнутыми ценами и новыми кнопками
    try:
        await callback.message.edit_text(
            price_text,
            reply_markup=keyboard,
            parse_mode="HTML"
        )
    except Exception as e:
        # Если не удалось отредактировать текст (например, сообщение с фото), редактируем только кнопки
        logger.warning(f"Не удалось отредактировать текст сообщения: {e}")
        await callback.message.edit_reply_markup(reply_markup=keyboard)

@router.message(F.video_note)  # Фильтр на video note (кружочек)
async def handle_video_note(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return
    video_note_file_id = message.video_note.file_id  # Получаем file_id кружочка
    await message.answer("Кружочек получен! Сейчас перешлю его...")

    # Пересылаем кружочек обратно (или другому пользователю)
    await message.bot.send_video_note(
        chat_id=message.chat.id,  # Можно указать другой chat_id (куда отправить)
        video_note=video_note_file_id,
    )
    await message.answer(video_note_file_id)

@router.message(F.photo)  # Ловим сообщение с фото
async def handle_photo_message(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    # file_id самого большого размера (последний в списке)
    photo_file_id = message.photo[-1].file_id
    await message.answer(photo_file_id)