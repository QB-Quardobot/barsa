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
            
            if credentials_path and not os.path.exists(credentials_path):
                fallback_path = os.getenv('GOOGLE_SHEETS_CREDENTIALS_FALLBACK', '/var/www/illariooo.ru/bot/credentials.json')
                if os.path.exists(fallback_path):
                    logger.warning(
                        f"Credentials path not found ({credentials_path}). Using fallback: {fallback_path}"
                    )
                    credentials_path = fallback_path

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
                # Проверяем и обновляем заголовки для существующей таблицы
                self._add_headers()
                # Проверяем структуру таблицы и исправляем если нужно
                self._verify_table_structure()
            except gspread.exceptions.WorksheetNotFound:
                # Создаем новый worksheet если не существует
                self.worksheet = self.spreadsheet.add_worksheet(
                    title=worksheet_name,
                    rows=1000,
                    cols=20
                )
                # Добавляем заголовки
                self._add_headers()
            
            # Применяем форматирование для аккуратного вида
            self._apply_sheet_formatting()
            
            self._initialized = True
            logger.info(f"Google Sheets integration initialized: {spreadsheet_id}/{worksheet_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets integration: {e}")
            self._initialized = False
            return False
    
    def _verify_table_structure(self):
        """Проверяет структуру таблицы и исправляет если нужно"""
        if not self.worksheet:
            return
        
        try:
            expected_headers = [
                'Дата и время',
                'Имя',
                'Фамилия',
                'Email',
                'TG User ID',
                'TG Username',
                'Тип оплаты',
                'IP адрес',
                'User Agent',
                'Дополнительные данные'
            ]
            
            existing_headers = self.worksheet.row_values(1)
            
            # Если заголовки не совпадают - обновляем
            if not existing_headers or existing_headers[:len(expected_headers)] != expected_headers:
                logger.info("Table structure mismatch detected, fixing headers...")
                self._add_headers()
                logger.info("Table structure fixed")
        except Exception as e:
            logger.warning(f"Could not verify table structure: {e}")
    
    def _add_headers(self):
        """Добавляет или обновляет заголовки в таблице"""
        if not self.worksheet:
            return
        
        headers = [
            'Дата и время',
            'Имя',
            'Фамилия',
            'Email',
            'TG User ID',
            'TG Username',
            'Тип оплаты',
            'IP адрес',
            'User Agent',
            'Дополнительные данные'
        ]
        
        # Проверяем, есть ли уже заголовки
        existing_headers = self.worksheet.row_values(1)
        
        # Если заголовков нет или они не совпадают - обновляем
        if not existing_headers or existing_headers[:len(headers)] != headers:
            # Обновляем заголовки в первой строке
            # Используем update с range, чтобы точно заменить нужные колонки
            try:
                # Получаем количество существующих колонок
                max_col = len(existing_headers) if existing_headers else 0
                target_cols = len(headers)
                
                # Если нужно больше колонок - расширяем
                if target_cols > max_col:
                    # Добавляем пустые ячейки если нужно
                    if max_col > 0:
                        # Обновляем существующие + добавляем новые
                        range_to_update = f'A1:{chr(64 + target_cols)}1'
                    else:
                        range_to_update = f'A1:{chr(64 + target_cols)}1'
                else:
                    range_to_update = f'A1:{chr(64 + target_cols)}1'
                
                # Обновляем заголовки
                self.worksheet.update(range_to_update, [headers], value_input_option='RAW')
                logger.info(f"Updated headers in Google Sheet: {headers}")
            except Exception as e:
                # Fallback: просто обновляем первую строку
                try:
                    self.worksheet.update('A1', [headers])
                    logger.info(f"Updated headers (fallback method): {headers}")
                except Exception as e2:
                    logger.error(f"Failed to update headers: {e2}")

    def _apply_sheet_formatting(self):
        """Применяет профессиональное форматирование к Google Sheet."""
        if not self.worksheet or not self.spreadsheet:
            return
        
        try:
            sheet_id = getattr(self.worksheet, 'id', None) or self.worksheet._properties.get('sheetId')
            if not sheet_id:
                return
            
            # Получаем количество строк для форматирования
            try:
                all_values = self.worksheet.get_all_values()
                row_count = len(all_values) if all_values else 1
            except:
                row_count = 1000  # Fallback для новых таблиц
            
            # Профессиональная цветовая схема
            # Шапка: темно-синий градиент с белым текстом
            header_bg = {"red": 0.13, "green": 0.20, "blue": 0.35}  # #214A5E
            header_text = {"red": 1.0, "green": 1.0, "blue": 1.0}  # Белый
            
            # Чередующиеся цвета строк (светло-серый и белый)
            even_row_bg = {"red": 0.98, "green": 0.98, "blue": 0.98}  # #FAFAFA
            odd_row_bg = {"red": 1.0, "green": 1.0, "blue": 1.0}  # Белый
            
            # Границы: темно-серые для шапки, светло-серые для данных
            border_color_header = {"red": 0.2, "green": 0.2, "blue": 0.2}
            border_color_data = {"red": 0.85, "green": 0.85, "blue": 0.85}
            
            requests = []
            
            # 1. Замораживаем первую строку (шапку)
            requests.append({
                "updateSheetProperties": {
                    "properties": {
                        "sheetId": sheet_id,
                        "gridProperties": {"frozenRowCount": 1}
                    },
                    "fields": "gridProperties.frozenRowCount"
                }
            })
            
            # 2. Форматирование шапки: фон, текст, выравнивание, границы
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 10
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "backgroundColor": header_bg,
                            "textFormat": {
                                "bold": True,
                                "fontSize": 11,
                                "foregroundColor": header_text,
                                "fontFamily": "Arial"
                            },
                            "horizontalAlignment": "CENTER",
                            "verticalAlignment": "MIDDLE",
                            "borders": {
                                "top": {"style": "SOLID", "width": 2, "color": border_color_header},
                                "bottom": {"style": "SOLID", "width": 2, "color": border_color_header},
                                "left": {"style": "SOLID", "width": 1, "color": border_color_header},
                                "right": {"style": "SOLID", "width": 1, "color": border_color_header}
                            },
                            "padding": {
                                "top": 8,
                                "bottom": 8,
                                "left": 8,
                                "right": 8
                            }
                        }
                    },
                    "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,borders,padding)"
                }
            })
            
            # 3. Высота строки шапки
            requests.append({
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": sheet_id,
                        "dimension": "ROWS",
                        "startIndex": 0,
                        "endIndex": 1
                    },
                    "properties": {"pixelSize": 40},
                    "fields": "pixelSize"
                }
            })
            
            # 4. Чередующиеся цвета строк для данных (если есть данные)
            if row_count > 1:
                # Четные строки (начиная со 2-й, индекс 1)
                requests.append({
                    "repeatCell": {
                        "range": {
                            "sheetId": sheet_id,
                            "startRowIndex": 1,
                            "endRowIndex": min(row_count, 1000),
                            "startColumnIndex": 0,
                            "endColumnIndex": 10
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "backgroundColor": even_row_bg,
                                "borders": {
                                    "top": {"style": "SOLID", "width": 1, "color": border_color_data},
                                    "bottom": {"style": "SOLID", "width": 1, "color": border_color_data},
                                    "left": {"style": "SOLID", "width": 1, "color": border_color_data},
                                    "right": {"style": "SOLID", "width": 1, "color": border_color_data}
                                },
                                "padding": {
                                    "top": 6,
                                    "bottom": 6,
                                    "left": 8,
                                    "right": 8
                                }
                            }
                        },
                        "fields": "userEnteredFormat(backgroundColor,borders,padding)"
                    }
                })
            
            # 5. Выравнивание данных по колонкам
            # Дата и время - по центру
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": min(row_count, 1000),
                        "startColumnIndex": 0,
                        "endColumnIndex": 1
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "horizontalAlignment": "CENTER",
                            "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                }
            })
            
            # Имя, Фамилия, Email - слева
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": min(row_count, 1000),
                        "startColumnIndex": 1,
                        "endColumnIndex": 4
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "horizontalAlignment": "LEFT",
                            "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                }
            })
            
            # TG User ID, TG Username - по центру
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": min(row_count, 1000),
                        "startColumnIndex": 4,
                        "endColumnIndex": 6
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "horizontalAlignment": "CENTER",
                            "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                }
            })
            
            # Тип оплаты - по центру
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": min(row_count, 1000),
                        "startColumnIndex": 6,
                        "endColumnIndex": 7
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "horizontalAlignment": "CENTER",
                            "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                }
            })
            
            # IP адрес, User Agent - слева, моноширинный шрифт
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": min(row_count, 1000),
                        "startColumnIndex": 7,
                        "endColumnIndex": 9
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "horizontalAlignment": "LEFT",
                            "textFormat": {"fontFamily": "Courier New", "fontSize": 9}
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                }
            })
            
            # Дополнительные данные - слева, с переносом текста
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": min(row_count, 1000),
                        "startColumnIndex": 9,
                        "endColumnIndex": 10
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "horizontalAlignment": "LEFT",
                            "wrapStrategy": "WRAP",
                            "textFormat": {"fontFamily": "Arial", "fontSize": 9}
                        }
                    },
                    "fields": "userEnteredFormat(horizontalAlignment,wrapStrategy,textFormat)"
                }
            })
            
            # 6. Ширины колонок (оптимизированные)
            column_widths = [170, 130, 150, 240, 120, 150, 180, 140, 300, 400]
            for idx, width in enumerate(column_widths):
                requests.append({
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": sheet_id,
                            "dimension": "COLUMNS",
                            "startIndex": idx,
                            "endIndex": idx + 1
                        },
                        "properties": {"pixelSize": width},
                        "fields": "pixelSize"
                    }
                })
            
            # 7. Высота строк данных
            requests.append({
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": sheet_id,
                        "dimension": "ROWS",
                        "startIndex": 1,
                        "endIndex": min(row_count, 1000)
                    },
                    "properties": {"pixelSize": 28},
                    "fields": "pixelSize"
                }
            })
            
            # 8. Внешние границы таблицы (более толстые)
            requests.append({
                "updateBorders": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 0,
                        "endRowIndex": min(row_count, 1000),
                        "startColumnIndex": 0,
                        "endColumnIndex": 10
                    },
                    "top": {
                        "style": "SOLID",
                        "width": 2,
                        "color": border_color_header
                    },
                    "bottom": {
                        "style": "SOLID",
                        "width": 2,
                        "color": border_color_header
                    },
                    "left": {
                        "style": "SOLID",
                        "width": 2,
                        "color": border_color_header
                    },
                    "right": {
                        "style": "SOLID",
                        "width": 2,
                        "color": border_color_header
                    }
                }
            })
            
            # Применяем все форматирование одним батчем
            self.spreadsheet.batch_update({"requests": requests})
            logger.info("Professional formatting applied to Google Sheet")
            
        except Exception as e:
            logger.warning(f"Failed to apply Google Sheets formatting: {e}")
    
    def save_offer_confirmation(
        self,
        first_name: str,
        last_name: str,
        email: str,
        payment_type: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        telegram_user_id: Optional[str] = None,
        telegram_username: Optional[str] = None,
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
            
            # Проверяем и обновляем заголовки перед добавлением данных
            self._add_headers()
            
            # Подготавливаем строку данных в правильном порядке
            # ВАЖНО: порядок должен точно соответствовать заголовкам!
            row_data = [
                timestamp,              # Колонка A: Дата и время
                first_name,            # Колонка B: Имя
                last_name,             # Колонка C: Фамилия
                email,                 # Колонка D: Email
                telegram_user_id or '', # Колонка E: TG User ID
                telegram_username or '', # Колонка F: TG Username
                payment_type,          # Колонка G: Тип оплаты
                ip_address or '',      # Колонка H: IP адрес
                user_agent or '',      # Колонка I: User Agent
                additional_data_str    # Колонка J: Дополнительные данные
            ]
            
            # Получаем количество строк ДО добавления для определения четности
            all_values_before = self.worksheet.get_all_values()
            row_count_before = len(all_values_before)
            
            # Добавляем строку в таблицу
            # append_row автоматически добавляет в конец таблицы
            self.worksheet.append_row(row_data)
            
            # Проверяем, что данные добавились правильно
            all_values_after = self.worksheet.get_all_values()
            if len(all_values_after) > row_count_before:
                new_row = all_values_after[-1]
                # Проверяем, что количество колонок совпадает
                if len(new_row) != len(row_data):
                    logger.warning(
                        f"Row data mismatch: expected {len(row_data)} columns, got {len(new_row)}. "
                        f"Row: {new_row}"
                    )
            
            # Применяем форматирование к новой строке
            try:
                # Индекс новой строки (0-based: 0 = шапка, 1+ = данные)
                new_row_index = row_count_before  # Это индекс только что добавленной строки
                
                # Пропускаем форматирование, если это шапка (индекс 0)
                if new_row_index == 0:
                    logger.debug("Skipping formatting for header row")
                else:
                    # Определяем четность строки для чередования цветов
                    # Строка 1 (индекс 0) - шапка, строки 2+ (индекс 1+) - данные
                    # Для данных: индекс 1 = первая строка данных (нечетная), индекс 2 = вторая (четная)
                    is_even = (new_row_index % 2 == 0)
                    row_bg = {"red": 0.98, "green": 0.98, "blue": 0.98} if is_even else {"red": 1.0, "green": 1.0, "blue": 1.0}
                    border_color = {"red": 0.85, "green": 0.85, "blue": 0.85}
                    
                    sheet_id = getattr(self.worksheet, 'id', None) or self.worksheet._properties.get('sheetId')
                    if sheet_id:
                        format_requests = [
                            {
                                "repeatCell": {
                                    "range": {
                                        "sheetId": sheet_id,
                                        "startRowIndex": new_row_index,
                                        "endRowIndex": new_row_index + 1,
                                        "startColumnIndex": 0,
                                        "endColumnIndex": 10
                                    },
                                "cell": {
                                    "userEnteredFormat": {
                                        "backgroundColor": row_bg,
                                        "borders": {
                                            "top": {"style": "SOLID", "width": 1, "color": border_color},
                                            "bottom": {"style": "SOLID", "width": 1, "color": border_color},
                                            "left": {"style": "SOLID", "width": 1, "color": border_color},
                                            "right": {"style": "SOLID", "width": 1, "color": border_color}
                                        },
                                        "padding": {
                                            "top": 6,
                                            "bottom": 6,
                                            "left": 8,
                                            "right": 8
                                        }
                                    }
                                },
                                "fields": "userEnteredFormat(backgroundColor,borders,padding)"
                            }
                        },
                        {
                            "updateDimensionProperties": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "dimension": "ROWS",
                                    "startIndex": new_row_index,
                                    "endIndex": new_row_index + 1
                                },
                                "properties": {"pixelSize": 28},
                                "fields": "pixelSize"
                            }
                        },
                        # Выравнивание: дата - центр
                        {
                            "repeatCell": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": new_row_index,
                                    "endRowIndex": new_row_index + 1,
                                    "startColumnIndex": 0,
                                    "endColumnIndex": 1
                                },
                                "cell": {
                                    "userEnteredFormat": {
                                        "horizontalAlignment": "CENTER",
                                        "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                                    }
                                },
                                "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                            }
                        },
                        # Имя, Фамилия, Email - слева
                        {
                            "repeatCell": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": new_row_index,
                                    "endRowIndex": new_row_index + 1,
                                    "startColumnIndex": 1,
                                    "endColumnIndex": 4
                                },
                                "cell": {
                                    "userEnteredFormat": {
                                        "horizontalAlignment": "LEFT",
                                        "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                                    }
                                },
                                "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                            }
                        },
                        # TG User ID, TG Username - центр
                        {
                            "repeatCell": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": new_row_index,
                                    "endRowIndex": new_row_index + 1,
                                    "startColumnIndex": 4,
                                    "endColumnIndex": 6
                                },
                                "cell": {
                                    "userEnteredFormat": {
                                        "horizontalAlignment": "CENTER",
                                        "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                                    }
                                },
                                "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                            }
                        },
                        # Тип оплаты - центр
                        {
                            "repeatCell": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": new_row_index,
                                    "endRowIndex": new_row_index + 1,
                                    "startColumnIndex": 6,
                                    "endColumnIndex": 7
                                },
                                "cell": {
                                    "userEnteredFormat": {
                                        "horizontalAlignment": "CENTER",
                                        "textFormat": {"fontFamily": "Arial", "fontSize": 10}
                                    }
                                },
                                "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                            }
                        },
                        # IP, User Agent - слева, моноширинный
                        {
                            "repeatCell": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": new_row_index,
                                    "endRowIndex": new_row_index + 1,
                                    "startColumnIndex": 7,
                                    "endColumnIndex": 9
                                },
                                "cell": {
                                    "userEnteredFormat": {
                                        "horizontalAlignment": "LEFT",
                                        "textFormat": {"fontFamily": "Courier New", "fontSize": 9}
                                    }
                                },
                                "fields": "userEnteredFormat(horizontalAlignment,textFormat)"
                            }
                        },
                        # Дополнительные данные - слева, с переносом
                        {
                            "repeatCell": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": new_row_index,
                                    "endRowIndex": new_row_index + 1,
                                    "startColumnIndex": 9,
                                    "endColumnIndex": 10
                                },
                                "cell": {
                                    "userEnteredFormat": {
                                        "horizontalAlignment": "LEFT",
                                        "wrapStrategy": "WRAP",
                                        "textFormat": {"fontFamily": "Arial", "fontSize": 9}
                                    }
                                },
                                "fields": "userEnteredFormat(horizontalAlignment,wrapStrategy,textFormat)"
                            }
                        }
                    ]
                    self.spreadsheet.batch_update({"requests": format_requests})
            except Exception as format_error:
                # Не критично, если форматирование не применилось
                logger.debug(f"Could not format new row (non-critical): {format_error}")
            
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
    telegram_user_id: Optional[str] = None,
    telegram_username: Optional[str] = None,
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
    try:
        sheets = get_google_sheets()
        if not sheets.is_initialized():
            logger.warning("Google Sheets integration not initialized, cannot save data")
            return False
        
        logger.info(f"Calling save_offer_confirmation for: {email}")
        result = sheets.save_offer_confirmation(
            first_name=first_name,
            last_name=last_name,
            email=email,
            payment_type=payment_type,
            ip_address=ip_address,
            user_agent=user_agent,
            telegram_user_id=telegram_user_id,
            telegram_username=telegram_username,
            additional_data=additional_data
        )
        logger.info(f"save_offer_confirmation returned: {result} for {email}")
        return result
    except Exception as e:
        logger.error(f"Error in save_to_google_sheets: {e}", exc_info=True)
        return False
