#!/bin/bash

# Скрипт для быстрого запуска админ-панели

echo "🚀 Запуск админ-панели..."
echo ""

# Проверяем, запущен ли API сервер
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "⚠️  API сервер не запущен на порту 8000"
    echo "📝 Запустите API сервер в отдельном терминале:"
    echo "   cd bot/barcelona_bots"
    echo "   source .venv/bin/activate"
    echo "   python3 api_server.py"
    echo ""
    echo "   Или запустите все вместе:"
    echo "   cd bot/barcelona_bots"
    echo "   source .venv/bin/activate"
    echo "   python3 main.py"
    echo ""
else
    echo "✅ API сервер работает на http://localhost:8000"
fi

echo ""
echo "🌐 Запускаем Astro dev сервер..."
echo "📱 Админ-панель будет доступна на:"
echo "   http://localhost:4321/admin"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo ""

# Запускаем Astro
npm run dev
