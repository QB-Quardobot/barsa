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


# class Materials(Base):
#     __tablename__ = 'materials'
#
#     id = Column(Integer, primary_key=True, autoincrement=True)
#     message_text = Column(String, nullable=True)  # Оставим для текста
#     file_id = Column(String, nullable=True)  # Добавим для файлов
#     file_type = Column(String, nullable=True)  # Тип файла (document, photo и т.д.)
#     entities = Column(String, nullable=True) # Форматирование текста, если есть
