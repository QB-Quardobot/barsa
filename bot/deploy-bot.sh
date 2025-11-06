#!/bin/bash
set -euo pipefail

# =====================================
# Barcelona Bot Deployment Script
# =====================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SERVER_IP="217.198.5.230"
SERVER_USER="root"
DEPLOY_PATH="/var/www/illariooo.ru/bot"
BOT_PATH="barcelona_bots"

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Check if .env exists
check_env() {
    log_step "Checking .env file..."
    if [ ! -f "${BOT_PATH}/.env" ]; then
        log_error ".env file not found in ${BOT_PATH}/"
        log_info "Creating .env file template..."
        cat > "${BOT_PATH}/.env" << EOF
# Bot Tokens
USER_TOKEN=8559392109:AAFx4POCNMVa-kRXXIkxXKTGkKZjQgwWQpM
ADMIN_TOKEN=8262351903:AAGygbnC0VWHH7iLEoAglFdRV2qd9tQa-UQ

# Database
DATABASE_URL=sqlite:///./database/client.db

# Admin IDs (comma-separated)
ADMIN_IDS=

# Alex Klyauzer ID
ALEX_KLYAUZER_ID=
EOF
        log_warning "Please fill in ADMIN_IDS and ALEX_KLYAUZER_ID in ${BOT_PATH}/.env"
        log_warning "Then run this script again"
        exit 1
    fi
    log_success ".env file found"
}

# Deploy to server
deploy() {
    log_step "Deploying bot to server..."
    
    # Create directory on server
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${DEPLOY_PATH}"
    
    # Copy bot files
    log_info "Copying bot files..."
    rsync -avz --exclude='__pycache__' --exclude='*.pyc' --exclude='.venv' \
        --exclude='*.db' --exclude='*.log' \
        ./ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/
    
    log_success "Files copied"
    
    # Setup on server
    log_step "Setting up bot on server..."
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        cd /var/www/illariooo.ru/bot/barcelona_bots
        
        # Create virtual environment if not exists
        if [ ! -d ".venv" ]; then
            python3 -m venv .venv
        fi
        
        # Activate venv and install dependencies
        source .venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        
        # Create logs directory
        mkdir -p ../logs
        
        echo "Bot setup completed"
ENDSSH
    
    log_success "Bot setup completed"
    
    # Install PM2 if not exists
    log_step "Checking PM2 installation..."
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            npm install -g pm2
        else
            echo "PM2 already installed"
        fi
ENDSSH
    
    # Start/restart with PM2
    log_step "Starting bot with PM2..."
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        cd /var/www/illariooo.ru/bot
        
        # Stop existing process if running
        pm2 stop barcelona-bots 2>/dev/null || true
        pm2 delete barcelona-bots 2>/dev/null || true
        
        # Start bot
        pm2 start ecosystem.config.js
        pm2 save
        
        # Show status
        pm2 status
ENDSSH
    
    log_success "Bot deployed and started!"
    log_info "Check logs with: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs barcelona-bots'"
}

# Main
main() {
    log_step "Barcelona Bot Deployment"
    echo ""
    
    check_env
    deploy
    
    log_success "Deployment completed successfully!"
}

main "$@"

