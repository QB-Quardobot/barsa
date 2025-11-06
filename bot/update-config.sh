#!/bin/bash
# Быстрое обновление config.py на сервере

SERVER_IP="217.198.5.230"
SERVER_USER="root"

echo "Обновление config.py на сервере..."

scp bot/barcelona_bots/config/config.py ${SERVER_USER}@${SERVER_IP}:/var/www/illariooo.ru/bot/barcelona_bots/config/config.py

echo "Перезапуск бота..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    cd /var/www/illariooo.ru/bot
    pm2 restart barcelona-bots
    sleep 2
    pm2 logs barcelona-bots --lines 10 --nostream
ENDSSH

echo "Готово!"

