#!/bin/bash
# Server Cleanup Script
# Cleans unnecessary files to free up space and memory

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }

echo "🧹 Server Cleanup Script"
echo "========================"
echo ""

# Show current disk usage
log_info "Current disk usage:"
df -h / | tail -1
echo ""

# Ask for confirmation
read -p "Continue with cleanup? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
log_info "Starting cleanup..."

# 1. Clean npm cache
log_info "Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true
log_success "npm cache cleaned"

# 2. Clean old npm logs
log_info "Cleaning npm logs..."
rm -rf ~/.npm/_logs/* 2>/dev/null || true
log_success "npm logs cleaned"

# 3. Clean node_modules in common locations (optional - be careful!)
log_info "Checking for old node_modules..."
if [ -d "/var/www/illariooo.ru/node_modules" ]; then
    SIZE=$(du -sh /var/www/illariooo.ru/node_modules 2>/dev/null | cut -f1)
    log_warn "Found node_modules: ${SIZE}"
    read -p "Remove node_modules? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf /var/www/illariooo.ru/node_modules
        log_success "node_modules removed"
    fi
fi

# 4. Clean system package cache
log_info "Cleaning system package cache..."
if command -v apt-get &> /dev/null; then
    apt-get clean 2>/dev/null || true
    apt-get autoclean 2>/dev/null || true
    log_success "apt cache cleaned"
elif command -v yum &> /dev/null; then
    yum clean all 2>/dev/null || true
    log_success "yum cache cleaned"
fi

# 5. Clean old logs
log_info "Cleaning old logs..."
# Keep last 7 days of logs
find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +30 -delete 2>/dev/null || true
log_success "Old logs cleaned"

# 6. Clean temporary files
log_info "Cleaning temporary files..."
rm -rf /tmp/* 2>/dev/null || true
rm -rf /var/tmp/* 2>/dev/null || true
log_success "Temporary files cleaned"

# 7. Clean old build artifacts
log_info "Cleaning old build artifacts..."
if [ -d "/var/www/illariooo.ru/dist" ]; then
    # Keep current dist, but clean if it's too old
    find /var/www/illariooo.ru/dist -type f -mtime +30 -delete 2>/dev/null || true
    log_success "Old build artifacts cleaned"
fi

# 8. Clean Docker (if installed)
if command -v docker &> /dev/null; then
    log_info "Cleaning Docker..."
    docker system prune -f 2>/dev/null || true
    log_success "Docker cleaned"
fi

# 9. Clean journal logs (systemd)
if command -v journalctl &> /dev/null; then
    log_info "Cleaning journal logs..."
    journalctl --vacuum-time=7d 2>/dev/null || true
    log_success "Journal logs cleaned"
fi

# 10. Clean old git objects
log_info "Cleaning git repositories..."
if [ -d "/var/www/illariooo.ru/.git" ]; then
    cd /var/www/illariooo.ru
    git gc --prune=now 2>/dev/null || true
    log_success "Git repository cleaned"
fi

echo ""
log_info "Final disk usage:"
df -h / | tail -1

echo ""
log_success "Cleanup complete!"

