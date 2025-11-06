#!/bin/bash
# Альтернативный способ запуска бота без PM2 (через systemd или screen)

cd "$(dirname "$0")/barcelona_bots"

# Активируем виртуальное окружение
source .venv/bin/activate

# Запускаем бота
python main.py

