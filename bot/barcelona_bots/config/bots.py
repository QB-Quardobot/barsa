# config/bots.py
from aiogram import Bot
from config.config import USER_TOKEN, ADMIN_TOKEN

user_bot = Bot(token=USER_TOKEN)
admin_bot = Bot(token=ADMIN_TOKEN)