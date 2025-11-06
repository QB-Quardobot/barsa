#!/bin/bash
set -euo pipefail

# =====================================
# Quick Database Fix Script
# =====================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_IP="217.198.5.230"
SERVER_USER="root"
DEPLOY_PATH="/var/www/illariooo.ru/bot"
BOT_PATH="barcelona_bots"

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${YELLOW}[STEP]${NC} $1"; }

log_step "Updating database configuration on server..."

# Copy updated config.py
log_info "Copying updated config.py..."
scp ${BOT_PATH}/config/config.py ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/${BOT_PATH}/config/config.py

# Copy updated sending.py
log_info "Copying updated sending.py..."
scp ${BOT_PATH}/utils/sending/sending.py ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/${BOT_PATH}/utils/sending/sending.py

# Create database directory and fix permissions
log_step "Creating database directory and fixing permissions..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    cd /var/www/illariooo.ru/bot/barcelona_bots
    mkdir -p database
    chmod 755 database
    if [ -f database/client.db ]; then
        chmod 644 database/client.db
    fi
    echo "Database directory ready"
ENDSSH

# Restart bot
log_step "Restarting bot..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    cd /var/www/illariooo.ru/bot
    pm2 restart barcelona-bots
    sleep 2
    pm2 logs barcelona-bots --lines 20
ENDSSH

log_success "Database fix applied! Check logs above for any errors."

