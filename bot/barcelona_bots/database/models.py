from sqlalchemy import Column, Integer, String, DateTime
from database.database import Base

class Clients(Base):
    """Модель представления клиента"""
    __tablename__ = 'clients'
    # id клиента в базе данных
    client_id = Column(Integer, primary_key=True, autoincrement=True)
    # Юзерайди клиента (пригодится для рассылки)
    user_id = Column(Integer, nullable=False)
    # Username tg
    username = Column(String)
    # Имя в тг
    name = Column(String)
    # Фамаилия в тг
    surname = Column(String)
    # Дата регистрации
    reg_date = Column(String)

class SendTime(Base):
    __tablename__ = 'sending_time'

    # айди записи в таблице
    send_id = Column(Integer, primary_key=True, autoincrement=True)
    # user_id, которому надо отправить материалы
    user_id = Column(Integer, nullable=False)
    # время, в которое отправлять
    time_to_send = Column(DateTime(timezone=True), nullable=False)
    # Первый или второй материал отправлять
    material_id = Column(Integer, nullable=False)


class OfferConfirmation(Base):
    """Модель для хранения подтверждений оферты и данных клиентов"""
    __tablename__ = 'offer_confirmations'
    
    # id записи в базе данных
    confirmation_id = Column(Integer, primary_key=True, autoincrement=True)
    # Имя клиента
    first_name = Column(String, nullable=False)
    # Фамилия клиента
    last_name = Column(String, nullable=False)
    # Email клиента
    email = Column(String, nullable=False)
    # Тип оплаты: 'installment' (рассрочка) или 'crypto' (крипта)
    payment_type = Column(String, nullable=False)
    # Дата и время подтверждения
    confirmed_at = Column(DateTime(timezone=True), nullable=False)
    # IP адрес (опционально, для логирования)
    ip_address = Column(String)
    # User Agent (опционально, для логирования)
    user_agent = Column(String)
    # Telegram user id (опционально)
    telegram_user_id = Column(String)
    # Telegram username (опционально)
    telegram_username = Column(String)
    # Дополнительные данные (JSON строка, если нужно)
    additional_data = Column(String)


# class Materials(Base):
#     __tablename__ = 'materials'
#
#     id = Column(Integer, primary_key=True, autoincrement=True)
#     message_text = Column(String, nullable=True)  # Оставим для текста
#     file_id = Column(String, nullable=True)  # Добавим для файлов
#     file_type = Column(String, nullable=True)  # Тип файла (document, photo и т.д.)
#     entities = Column(String, nullable=True) # Форматирование текста, если есть
