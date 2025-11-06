from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, \
    CallbackQuery
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.config import ADMIN_IDS
from config.logger import logger
from database.database import connection
from database.models import Clients
from utils.sending.sending import universal_broadcast

class Sending(StatesGroup):
    wait_materials = State()
    need_button = State()
    wait_button_link = State()
    wait_button_text = State()
    confirmation = State()

class Partner(StatesGroup):
    wait_partner_name = State()

main_adm_kb = ReplyKeyboardMarkup(keyboard=[
    [KeyboardButton(text="✨ Создать рассылку")]
], resize_keyboard=True)

cancel_partner_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text="⛔️ Отмена ввода", callback_data="cancel_partner")]
    ]
)

cancel_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text="⛔️ Отмена рассылки", callback_data="cancel_sending")]
    ]
)

admin_router = Router()

@admin_router.message(CommandStart())
async def start_handler(message: Message, state: FSMContext):
    if message.from_user.id not in ADMIN_IDS:
        logger.info(f"Неожиданный пользователь админского бота - {message.from_user.username if message.from_user.username else message.from_user.id}")
        return
    await state.clear()

    await message.answer(f"Добро пожаловать в админского бота! Доступные функции выведены в виде кнопок ниже👇", reply_markup=main_adm_kb)


@admin_router.message(lambda message: message.text == "✨ Создать рассылку")
async def start_collecting_messages(message: Message, state: FSMContext):
    """Начинает функцию добавления нового дня\+материала"""
    if message.from_user.id not in ADMIN_IDS:
        return

    await state.set_state(Sending.wait_materials)

    await message.answer(f"Реализуется программа создания рассылки!\n\nПришлите мне сообщение для отправки!", reply_markup=cancel_keyboard)

@admin_router.message(Sending.wait_materials)
async def handel_message_to_sent(message: Message, state: FSMContext):
    """Получение сообщения для рассылки"""
    if message.media_group_id:
        await message.answer(f"Этот тип сообщения не поддерживается для рассылки.\n\n"
                             f"Вы можете отправить фото, видео, документ, голосовое сообщение,"
                             f" видео сообщение, текст", reply_markup=cancel_keyboard)
    # Сохраняем в FSM объект message
    await state.update_data(message=message)

    await state.set_state(Sending.need_button)

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Нужна", callback_data="need_button")],
            [InlineKeyboardButton(text="Не нужна", callback_data="without_button")],
            [InlineKeyboardButton(text="⛔️ Отмена рассылки", callback_data="cancel_sending")]
        ]
    )

    await message.answer(f"Получил ваше сообщение! Нужно ли добавить к нему кнопку с ссылкой?", reply_markup=keyboard)

@admin_router.callback_query(F.data == "without_button", Sending.need_button)
async def need_button_handler(callback: CallbackQuery, state: FSMContext):
    """Рассылка без кнопки"""
    await callback.answer()
    # Отправка тестового сообщения админу, который готовит рассылку
    data = await state.get_data()
    message = data.get("message")
    await state.set_state(Sending.confirmation)

    await message.answer(f"Последний шаг! Проверьте, ваше сообщение:")

    # Отправляем админу, инициирующему рассылку сообщение для проверки
    from main import admin_bot
    result = await universal_broadcast(
        send_bot=admin_bot,
        content=message,
        user_ids=[callback.from_user.id]
    )

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Да, рассылаем", callback_data="start_sending")],
            [InlineKeyboardButton(text="Нет, отмена рассылки", callback_data="cancel_sending")]
        ]
    )

    await message.answer(f"Всё верно?", reply_markup=keyboard)

@admin_router.callback_query(F.data == "need_button", Sending.need_button)
async def need_button_handler(callback: CallbackQuery, state: FSMContext):
    """Понадобится кнопка"""
    await state.set_state(Sending.wait_button_link)
    await callback.answer()
    await callback.message.delete()

    await callback.message.answer(f"Понял вас! Пришлите ссылку, которую нужно добавить в кнопку", reply_markup=cancel_keyboard)

@admin_router.message(Sending.wait_button_link)
async def handle_button_link(message: Message, state: FSMContext):
    if not message.text:
        await message.answer(f"Неожиданный формат ссылки, попробуйте отправить новую", reply_markup=cancel_keyboard)
        return

    import re
    from urllib.parse import urlparse
    from typing import Optional, Tuple

    def validate_telegram_url(url: str) -> Tuple[bool, Optional[str]]:
        """
        Проверяет ссылку на валидность для инлайн-кнопки Telegram

        :param url: Ссылка для проверки
        :return: (is_valid, error_message)
        """
        # Минимальная и максимальная длина ссылки
        if len(url) < 5 or len(url) > 2048:
            return False, "Длина ссылки должна быть от 5 до 2048 символов"

        try:
            parsed = urlparse(url)

            # Проверка схемы (http/https/tg)
            if parsed.scheme not in ('http', 'https', 'tg', "tg.me"):
                return False, "Допустимые схемы: http, https, tg"

            # Проверка домена для http/https
            if parsed.scheme in ('http', 'https'):
                if not parsed.netloc:
                    return False, "Отсутствует домен"

                # Запрещенные домены
                banned_domains = ['telegram.me', 't.me']  # Для deep links нужно использовать tg://
                if any(domain in parsed.netloc for domain in banned_domains) and parsed.scheme == 'tg':
                    return False, "Используйте tg:// для Telegram ссылок"
                # if any(domain in parsed.netloc for domain in banned_domains):
                #     return False, "Используйте tg:// для Telegram ссылок"

            # Проверка tg:// ссылок
            elif parsed.scheme == 'tg':
                if not parsed.path:
                    return False, "Некорректный tg:// линк"

                allowed_actions = [
                    'resolve', 'login', 'join', 'addstickers',
                    'share', 'msg', 'confirmphone', 'socks',
                    'proxy', 'privatepost', 'bg', 'setlanguage'
                ]

                action = parsed.path.lstrip('/').split('?')[0]
                if action not in allowed_actions:
                    return False, f"Неподдерживаемое tg:// действие: {action}"

            # Проверка запрещенных символов
            if re.search(r'[\s<>\[\]{}]', url):
                return False, "Ссылка содержит запрещенные символы"

            return True, None

        except Exception as e:
            return False, f"Ошибка парсинга ссылки: {str(e)}"

    is_valid, error = validate_telegram_url(f"{message.text}")

    if not is_valid:
        await message.answer(f"Ошибка при добавлении ссылки: {error}\n\n Пришлите другую ссылку:", reply_markup=cancel_keyboard)
        return

    # Сохраняем ссылку
    await state.update_data(button_link=message.text)

    await state.set_state(Sending.wait_button_text)

    await message.answer(f"Проверил, ссылка рабочая👌\n\n Пришлите текст, который будет на кнопке, но он должен быть не длиннее 64 символов", reply_markup=cancel_keyboard)

@admin_router.message(Sending.wait_button_text)
async def handle_button_text(message: Message, state: FSMContext):
    if not message.text:
        await message.answer(f"Неожиданный формат сообщения, попробуйте отправить текст", reply_markup=cancel_keyboard)
        return

    def is_valid_button_text(text: str, button_type: str = "normal") -> bool:
        """
        Проверяет, подходит ли текст для кнопки Telegram
        :param text: Текст для проверки
        :param button_type: "normal" (64 символа) или "switch" (256 символов)
        :return: True если текст валиден, False если нет
        """
        if not isinstance(text, str) or not text.strip():
            return False

        max_len = 256 if button_type == "switch" else 64
        return len(text) <= max_len and '\n' not in text

    button_text = message.text

    if not is_valid_button_text(button_text):
        await message.answer(f"Текст кнопки, похоже, слишком длинный. Ограничьтесь 64 символами и отправьте новый текст для кнопки:", reply_markup=cancel_keyboard)

    await state.set_state(Sending.confirmation)

    await message.answer(f"Последний шаг! Проверьте, ваше сообщение:")

    data = await state.get_data()

    # Сохраняем для рассылки после подтверждения в FSM
    await state.update_data(button_text=button_text)
    message = data.get("message")
    button_link = data.get("button_link")
    try:
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text=f"{button_text}", url=f"{button_link}")]
            ]
        )
    except Exception as e:
        logger.warning(f"Ошибка формирования клавиатуры для проверки рассылаемого сообщения: {e}")

    from main import admin_bot
    # Отправка тестового сообщения админу, который готовит рассылку
    result = await universal_broadcast(
        send_bot=admin_bot,
        content=message,
        user_ids=[message.from_user.id],
        reply_markup=keyboard
    )

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Да, рассылаем", callback_data="start_sending")],
            [InlineKeyboardButton(text="Нет, отмена рассылки", callback_data="cancel_sending")]
        ]
    )

    await message.answer(f"Всё верно?", reply_markup=keyboard)

@admin_router.callback_query(F.data == "start_sending", Sending.confirmation)
async def start_sending(callback: CallbackQuery, state: FSMContext):
    """Рассылка всем пользователям"""
    await callback.answer()

    await callback.message.delete()

    data = await state.get_data()

    # Получить id всех пользователей
    all_bot_users = await get_all_user_ids()

    button_text = data.get("button_text")
    message = data.get("message")
    button_link = data.get("button_link")
    from config.bots import user_bot
    # Если рассылка с кнопкой
    if button_text and button_link:
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text=f"{button_text}", url=f"{button_link}")]
            ]
        )
        logger.info(f"Админ {callback.from_user.id} начал рассылку с кнопкой")

        result = await universal_broadcast(
            send_bot=user_bot,
            content=message,
            user_ids=all_bot_users,
            reply_markup=keyboard,
            another_bot=True
        )
    # Если рассылка без кнопки
    else:
        logger.info(f"Админ {callback.from_user.id} начал рассылку без кнопки")
        result = await universal_broadcast(
            send_bot=user_bot,
            content=message,
            user_ids=all_bot_users,
            another_bot=True
        )
    await message.answer(f"Рассылка завершена! Сообщений отправлено: {result['success']}")
    logger.info(f"[start_sending]: Рассылка закончилась с результатом: {result['success']}/{len(all_bot_users)}")
    await state.clear()


"""        result = await universal_broadcast(
            send_bot=bot,
            content=message,
            user_ids=all_bot_users,
            another_bot=True
        )
        """

@admin_router.callback_query(F.data == "cancel_sending")
async def cancel_new_word(callback: CallbackQuery, state: FSMContext):
    """Отмена рассылки"""
    await state.clear()
    await callback.answer(f"Действие отменено")
    await callback.message.delete()

    await callback.message.answer(f"Создание рассылки отменено", reply_markup=main_adm_kb)

@connection
async def get_all_user_ids(session: AsyncSession):
    """Функция для запроса id всех пользователей бота"""
    query = select(Clients.user_id)
    id_list = (await session.execute(query)).scalars().all()

    return id_list