#!/bin/bash
set -euo pipefail

# =====================================
# Git-Based Production Deployment
# Senior DevOps Professional Workflow
# Domain: illariooo.ru
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
DOMAIN="illariooo.ru"
APP_NAME="ai-model-landing"
DEPLOY_PATH="/var/www/${DOMAIN}"
REPO_URL="https://github.com/coolpac/barsa.git"
BRANCH="master"
NODE_VERSION="20"

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check if we're in git repo
    if [ ! -d ".git" ]; then
        log_error "Not a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        log_warning "Uncommitted changes detected"
        echo ""
        git status -s
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Prerequisites checked"
}

# Push to git
push_to_git() {
    log_step "Pushing to git repository..."
    
    # Get current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        log_warning "Current branch: ${CURRENT_BRANCH}, target: ${BRANCH}"
        read -p "Switch to ${BRANCH}? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git checkout "$BRANCH"
        fi
    fi
    
    # Commit if needed
    if [[ -n $(git status -s) ]]; then
        log_info "Committing changes..."
        git add .
        git commit -m "Production deployment $(date +%Y-%m-%d\ %H:%M:%S)" || true
    fi
    
    # Push
    log_info "Pushing to remote..."
    git push origin "$BRANCH"
    
    log_success "Pushed to git"
}

# Test server connection
test_connection() {
    log_step "Testing server connection..."
    
    if ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo 'OK'" &> /dev/null; then
        log_success "Server connection OK"
    else
        log_error "Cannot connect to server"
        log_info "Setup SSH key: ssh-copy-id ${SERVER_USER}@${SERVER_IP}"
        exit 1
    fi
}

# Initial server setup
initial_setup() {
    log_step "Initial server setup..."
    
    ssh ${SERVER_USER}@${SERVER_IP} bash << 'ENDSSH'
        set -euo pipefail
        
        echo "📦 Installing system packages..."
        apt-get update -qq
        apt-get install -y nginx certbot python3-certbot-nginx git curl build-essential ufw fail2ban -qq
        
        echo "🔧 Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs -qq
        
        echo "🔒 Configuring firewall..."
        ufw --force enable
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        echo "🚀 Enabling services..."
        systemctl enable nginx
        systemctl enable fail2ban
        
        echo "✅ Server setup complete"
ENDSSH
    
    log_success "Initial setup complete"
}

# Setup git repository on server
setup_git_repo() {
    log_step "Setting up git repository on server..."
    
    ssh ${SERVER_USER}@${SERVER_IP} bash << ENDSSH
        set -euo pipefail
        
        DOMAIN="${DOMAIN}"
        DEPLOY_PATH="/var/www/\${DOMAIN}"
        REPO_URL="${REPO_URL}"
        BRANCH="${BRANCH}"
        
        echo "📁 Creating directory structure..."
        mkdir -p "\${DEPLOY_PATH}"
        cd "\${DEPLOY_PATH}"
        
        if [ ! -d ".git" ]; then
            echo "🔄 Cloning repository..."
            git clone "\${REPO_URL}" .
            git checkout "\${BRANCH}"
        else
            echo "🔄 Repository exists, pulling latest..."
            git fetch origin
            git reset --hard origin/\${BRANCH}
        fi
        
        echo "📦 Installing dependencies..."
        # Server has only ~1GB RAM, optimize heavily
        export NODE_OPTIONS="--max-old-space-size=512"
        # Remove node_modules to avoid ENOTEMPTY errors
        rm -rf node_modules package-lock.json 2>/dev/null || true
        # Clear npm cache to free memory
        npm cache clean --force 2>/dev/null || true
        # Use npm install (less memory intensive than npm ci)
        npm install --production=false --prefer-offline --no-audit --legacy-peer-deps
        
        echo "🔨 Building project..."
        # Optimize build memory usage
        export NODE_OPTIONS="--max-old-space-size=512"
        npm run build
        
        echo "🔒 Setting permissions..."
        chown -R www-data:www-data "\${DEPLOY_PATH}/dist"
        find "\${DEPLOY_PATH}/dist" -type d -exec chmod 755 {} \\;
        find "\${DEPLOY_PATH}/dist" -type f -exec chmod 644 {} \\;
        
        echo "✅ Git repository setup complete"
ENDSSH
    
    log_success "Git repository configured"
}

# Configure Nginx
configure_nginx() {
    log_step "Configuring Nginx for ${DOMAIN}..."
    
    ssh ${SERVER_USER}@${SERVER_IP} bash << 'ENDSSH'
        DOMAIN="illariooo.ru"
        DEPLOY_PATH="/var/www/${DOMAIN}"
        
        echo "🔒 Creating temporary self-signed certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/ssl/private/nginx-selfsigned.key \
            -out /etc/ssl/certs/nginx-selfsigned.crt \
            -subj "/C=RU/ST=Moscow/L=Moscow/O=Dev/CN=illariooo.ru"
        
        echo "📝 Creating Nginx configuration..."
        cat > /etc/nginx/sites-available/${DOMAIN} << 'EOF'
# AI Model 2.0 Landing - Production Configuration
# Domain: illariooo.ru
# Optimized for Telegram WebApp

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;

# Redirect www to non-www
server {
    listen 80;
    listen [::]:80;
    server_name www.illariooo.ru;
    return 301 https://illariooo.ru$request_uri;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name illariooo.ru;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server - Main
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name illariooo.ru;
    
    root /var/www/illariooo.ru/dist;
    index index.html;
    
    # SSL Configuration (will be added by certbot)
    # Temporary self-signed cert for initial config
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    # SSL Security - Modern Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Telegram WebApp CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://telegram.org; frame-ancestors 'self' https://web.telegram.org https://telegram.org;" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types 
        text/plain 
        text/css 
        text/xml 
        text/javascript 
        application/json 
        application/javascript 
        application/x-javascript
        application/xml+rss 
        application/rss+xml 
        font/truetype 
        font/opentype 
        application/vnd.ms-fontobject 
        image/svg+xml;
    
    # Brotli Compression (if available)
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css text/xml text/javascript application/json application/javascript;
    
    # Cache Control - Static Assets
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    location ~* \.(woff|woff2|ttf|eot|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    location ~* \.(css|js)$ {
        expires 1M;
        add_header Cache-Control "public";
        access_log off;
    }
    
    # Rate Limiting
    location / {
        limit_req zone=general burst=20 nodelay;
        try_files $uri $uri/ /index.html =404;
    }
    
    # API Rate Limiting (if you add API endpoints)
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        try_files $uri $uri/ =404;
    }
    
    # Health Check Endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
    
    # Block Hidden Files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Robots.txt
    location = /robots.txt {
        access_log off;
        log_not_found off;
    }
    
    # Sitemap
    location = /sitemap.xml {
        access_log off;
    }
    
    # Logging
    access_log /var/log/nginx/illariooo.ru-access.log;
    error_log /var/log/nginx/illariooo.ru-error.log warn;
}

# HTTPS - www redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.illariooo.ru;
    
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    return 301 https://illariooo.ru$request_uri;
}
EOF
        
        echo "🔗 Enabling site..."
        ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        echo "✅ Testing configuration..."
        nginx -t
        
        echo "🔄 Reloading Nginx..."
        systemctl reload nginx
        
        echo "✅ Nginx configured for ${DOMAIN}"
ENDSSH
    
    log_success "Nginx configured"
}

# Setup SSL
setup_ssl() {
    log_step "Setting up SSL certificate..."
    
    ssh ${SERVER_USER}@${SERVER_IP} bash << ENDSSH
        set -euo pipefail
        
        DOMAIN="${DOMAIN}"
        
        echo "📝 Creating certbot webroot..."
        mkdir -p /var/www/certbot
        
        echo "🔒 Requesting SSL certificate..."
        certbot --nginx -d \${DOMAIN} -d www.\${DOMAIN} \
            --non-interactive \
            --agree-tos \
            --email admin@\${DOMAIN} \
            --redirect
        
        echo "✅ SSL certificate installed"
        echo "📅 Auto-renewal configured via systemd timer"
        
        # Test renewal
        certbot renew --dry-run
ENDSSH
    
    log_success "SSL configured"
}

# Deploy (git pull and rebuild)
deploy() {
    log_step "Deploying via git pull..."
    
    # Get current commit
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    log_info "Current commit: ${CURRENT_COMMIT}"
    
    ssh ${SERVER_USER}@${SERVER_IP} bash << ENDSSH
        set -euo pipefail
        
        DOMAIN="${DOMAIN}"
        DEPLOY_PATH="/var/www/\${DOMAIN}"
        BRANCH="${BRANCH}"
        
        cd "\${DEPLOY_PATH}"
        
        echo "📥 Pulling latest changes..."
        git fetch origin
        git reset --hard origin/\${BRANCH}
        
        DEPLOYED_COMMIT=\$(git rev-parse --short HEAD)
        echo "📍 Deployed commit: \${DEPLOYED_COMMIT}"
        
        echo "📦 Installing dependencies..."
        # Server has only ~1GB RAM, optimize heavily
        export NODE_OPTIONS="--max-old-space-size=512"
        # Remove node_modules to avoid ENOTEMPTY errors
        rm -rf node_modules package-lock.json 2>/dev/null || true
        # Clear npm cache to free memory
        npm cache clean --force 2>/dev/null || true
        # Use npm install (less memory intensive than npm ci)
        npm install --production=false --prefer-offline --no-audit --legacy-peer-deps
        
        echo "🔨 Building project..."
        # Optimize build memory usage
        export NODE_OPTIONS="--max-old-space-size=512"
        npm run build
        
        echo "🔒 Setting permissions..."
        chown -R www-data:www-data "\${DEPLOY_PATH}/dist"
        
        echo "🔄 Reloading Nginx..."
        systemctl reload nginx
        
        echo "✅ Deployment complete: \${DEPLOYED_COMMIT}"
ENDSSH
    
    log_success "Deployment complete"
}

# Verify deployment
verify() {
    log_step "Verifying deployment..."
    
    # Check Nginx
    ssh ${SERVER_USER}@${SERVER_IP} "systemctl is-active nginx" &> /dev/null
    if [ $? -eq 0 ]; then
        log_success "Nginx is running"
    else
        log_error "Nginx is not running"
        exit 1
    fi
    
    # Check site responds
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN}/health || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Site is responding (HTTP ${HTTP_CODE})"
    else
        log_warning "Site returned HTTP ${HTTP_CODE}"
    fi
    
    # Check HTTPS (if configured)
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/health 2>/dev/null || echo "000")
    if [ "$HTTPS_CODE" = "200" ]; then
        log_success "HTTPS is working (HTTP ${HTTPS_CODE})"
    else
        log_info "HTTPS not yet configured or returned ${HTTPS_CODE}"
    fi
    
    log_success "Verification complete"
}

# Rollback
rollback() {
    log_step "Rolling back to previous commit..."
    
    ssh ${SERVER_USER}@${SERVER_IP} bash << ENDSSH
        set -euo pipefail
        
        DOMAIN="${DOMAIN}"
        DEPLOY_PATH="/var/www/\${DOMAIN}"
        
        cd "\${DEPLOY_PATH}"
        
        echo "⏪ Rolling back..."
        git log --oneline -n 5
        
        read -p "Enter commit hash to rollback to: " COMMIT_HASH
        
        git reset --hard \${COMMIT_HASH}
        
        echo "📦 Installing dependencies..."
        # Server has only ~1GB RAM, optimize heavily
        export NODE_OPTIONS="--max-old-space-size=512"
        # Remove node_modules to avoid ENOTEMPTY errors
        rm -rf node_modules package-lock.json 2>/dev/null || true
        # Clear npm cache to free memory
        npm cache clean --force 2>/dev/null || true
        # Use npm install (less memory intensive than npm ci)
        npm install --production=false --prefer-offline --no-audit --legacy-peer-deps
        
        echo "🔨 Building..."
        npm run build
        
        echo "🔄 Reloading..."
        systemctl reload nginx
        
        echo "✅ Rollback complete"
ENDSSH
    
    log_success "Rollback complete"
}

# Show logs
show_logs() {
    ssh ${SERVER_USER}@${SERVER_IP} bash << 'ENDSSH'
        DOMAIN="illariooo.ru"
        
        echo "=== Nginx Access Log (last 20 lines) ==="
        tail -n 20 /var/log/nginx/${DOMAIN}-access.log
        
        echo ""
        echo "=== Nginx Error Log (last 20 lines) ==="
        tail -n 20 /var/log/nginx/${DOMAIN}-error.log
ENDSSH
}

# Main
main() {
    clear
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚀 Git-Based Production Deployment"
    echo "  Domain: ${DOMAIN}"
    echo "  Server: ${SERVER_IP}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    case "${1:-}" in
        setup)
            check_prerequisites
            push_to_git
            test_connection
            initial_setup
            setup_git_repo
            configure_nginx
            verify
            
            echo ""
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            log_success "  Initial Setup Complete!"
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            log_warning "Next step: Setup SSL"
            echo "  Run: ./deploy-git.sh ssl"
            echo ""
            ;;
        
        ssl)
            test_connection
            setup_ssl
            verify
            
            echo ""
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            log_success "  SSL Certificate Installed!"
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            log_info "Site: https://${DOMAIN}"
            echo ""
            ;;
        
        deploy)
            check_prerequisites
            push_to_git
            test_connection
            deploy
            verify
            
            echo ""
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            log_success "  Deployment Successful!"
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            log_info "Site: https://${DOMAIN}"
            echo ""
            ;;
        
        rollback)
            test_connection
            rollback
            ;;
        
        logs)
            test_connection
            show_logs
            ;;
        
        verify)
            test_connection
            verify
            ;;
        
        *)
            echo "Usage: $0 {setup|ssl|deploy|rollback|logs|verify}"
            echo ""
            echo "Commands:"
            echo "  setup     - Initial server setup and first deployment"
            echo "  ssl       - Setup SSL certificate with Let's Encrypt"
            echo "  deploy    - Deploy latest changes (git pull + build)"
            echo "  rollback  - Rollback to previous commit"
            echo "  logs      - Show Nginx logs"
            echo "  verify    - Verify deployment status"
            echo ""
            exit 1
            ;;
    esac
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO"' ERR

# Run
main "$@"
