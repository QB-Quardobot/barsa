"""
Google Sheets Integration
Сохраняет данные оферты в Google Sheets
"""
import os
import gspread
from google.oauth2.service_account import Credentials
from typing import Dict, Any, Optional
from datetime import datetime
import json

from config.logger import logger


class GoogleSheetsIntegration:
    """Интеграция с Google Sheets для сохранения данных оферты"""
    
    def __init__(self):
        self.client: Optional[gspread.Client] = None
        self.spreadsheet: Optional[gspread.Spreadsheet] = None
        self.worksheet: Optional[gspread.Worksheet] = None
        self._initialized = False
    
    def initialize(self) -> bool:
        """
        Инициализирует подключение к Google Sheets
        
        Returns:
            bool: True если инициализация успешна, False иначе
        """
        try:
            # Получаем путь к credentials файлу из переменных окружения
            credentials_path = os.getenv('GOOGLE_SHEETS_CREDENTIALS_PATH')
            spreadsheet_id = os.getenv('GOOGLE_SHEETS_ID')
            worksheet_name = os.getenv('GOOGLE_SHEETS_WORKSHEET_NAME', 'Offer Confirmations')
            
            if not credentials_path:
                logger.warning("GOOGLE_SHEETS_CREDENTIALS_PATH not set, Google Sheets integration disabled")
                return False
            
            if not spreadsheet_id:
                logger.warning("GOOGLE_SHEETS_ID not set, Google Sheets integration disabled")
                return False
            
            # Определяем scope для доступа к Google Sheets
            scopes = ['https://www.googleapis.com/auth/spreadsheets']
            
            # Загружаем credentials
            creds = Credentials.from_service_account_file(
                credentials_path,
                scopes=scopes
            )
            
            # Авторизуем клиент
            self.client = gspread.authorize(creds)
            
            # Открываем таблицу по ID
            self.spreadsheet = self.client.open_by_key(spreadsheet_id)
            
            # Получаем или создаем worksheet
            try:
                self.worksheet = self.spreadsheet.worksheet(worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                # Создаем новый worksheet если не существует
                self.worksheet = self.spreadsheet.add_worksheet(
                    title=worksheet_name,
                    rows=1000,
                    cols=20
                )
                # Добавляем заголовки
                self._add_headers()
            
            self._initialized = True
            logger.info(f"Google Sheets integration initialized: {spreadsheet_id}/{worksheet_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets integration: {e}")
            self._initialized = False
            return False
    
    def _add_headers(self):
        """Добавляет заголовки в таблицу если она пустая"""
        if not self.worksheet:
            return
        
        headers = [
            'Дата и время',
            'Имя',
            'Фамилия',
            'Email',
            'Тип оплаты',
            'IP адрес',
            'User Agent',
            'Дополнительные данные'
        ]
        
        # Проверяем, есть ли уже заголовки
        existing_headers = self.worksheet.row_values(1)
        if not existing_headers or existing_headers[0] != headers[0]:
            self.worksheet.append_row(headers)
            logger.info("Added headers to Google Sheet")
    
    def save_offer_confirmation(
        self,
        first_name: str,
        last_name: str,
        email: str,
        payment_type: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Сохраняет подтверждение оферты в Google Sheets
        
        Args:
            first_name: Имя клиента
            last_name: Фамилия клиента
            email: Email клиента
            payment_type: Тип оплаты ('installment' или 'crypto')
            ip_address: IP адрес (опционально)
            user_agent: User Agent (опционально)
            additional_data: Дополнительные данные (опционально)
        
        Returns:
            bool: True если сохранение успешно, False иначе
        """
        if not self._initialized or not self.worksheet:
            logger.warning("Google Sheets not initialized, skipping save")
            return False
        
        try:
            # Форматируем дату и время
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # Преобразуем дополнительные данные в строку
            additional_data_str = ''
            if additional_data:
                additional_data_str = json.dumps(additional_data, ensure_ascii=False)
            
            # Подготавливаем строку данных
            row_data = [
                timestamp,
                first_name,
                last_name,
                email,
                payment_type,
                ip_address or '',
                user_agent or '',
                additional_data_str
            ]
            
            # Добавляем строку в таблицу
            self.worksheet.append_row(row_data)
            
            logger.info(f"Data saved to Google Sheets: {email}, {payment_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save to Google Sheets: {e}")
            return False
    
    def is_initialized(self) -> bool:
        """Проверяет, инициализирована ли интеграция"""
        return self._initialized


# Глобальный экземпляр интеграции
_google_sheets: Optional[GoogleSheetsIntegration] = None


def get_google_sheets() -> GoogleSheetsIntegration:
    """Получает глобальный экземпляр Google Sheets интеграции"""
    global _google_sheets
    if _google_sheets is None:
        _google_sheets = GoogleSheetsIntegration()
        _google_sheets.initialize()
    return _google_sheets


def save_to_google_sheets(
    first_name: str,
    last_name: str,
    email: str,
    payment_type: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Удобная функция для сохранения данных в Google Sheets
    
    Args:
        first_name: Имя клиента
        last_name: Фамилия клиента
        email: Email клиента
        payment_type: Тип оплаты
        ip_address: IP адрес
        user_agent: User Agent
        additional_data: Дополнительные данные
    
    Returns:
        bool: True если сохранение успешно
    """
    sheets = get_google_sheets()
    if not sheets.is_initialized():
        return False
    
    return sheets.save_offer_confirmation(
        first_name=first_name,
        last_name=last_name,
        email=email,
        payment_type=payment_type,
        ip_address=ip_address,
        user_agent=user_agent,
        additional_data=additional_data
    )
