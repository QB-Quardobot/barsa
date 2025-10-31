# Production Deployment Guide

## Server Information
- **IP:** 217.198.5.230
- **User:** root
- **OS:** Ubuntu/Debian (assumed)

## Prerequisites

### Local Machine
- Node.js 20+
- npm/yarn
- SSH access to server
- rsync installed

### Server Requirements
- Ubuntu 20.04+ or Debian 11+
- 2GB RAM minimum
- 10GB disk space
- Root or sudo access

## Quick Deployment

### 1. First Time Setup
```bash
# Make deploy script executable
chmod +x deploy.sh

# Setup server (installs Nginx, certbot, configures firewall)
./deploy.sh setup

# Deploy application
./deploy.sh deploy
```

### 2. Subsequent Deployments
```bash
./deploy.sh deploy
```

### 3. Rollback (if needed)
```bash
./deploy.sh rollback
```

## Detailed Steps

### Step 1: Server Setup (First Time Only)

```bash
# Connect to server
ssh root@217.198.5.230

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js (if needed for SSR)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

The deploy script will automatically:
- Install Nginx
- Configure firewall (UFW)
- Install Certbot for SSL
- Setup fail2ban for security
- Configure rate limiting

### Step 2: Configure Domain

Update `astro.config.mjs`:
```javascript
export default defineConfig({
  site: 'https://yourdomain.com', // Change this
  // ...
});
```

### Step 3: Deploy

```bash
# From local machine
./deploy.sh deploy
```

This will:
1. Run pre-flight checks
2. Build project locally
3. Test server connection
4. Create backup of current deployment
5. Deploy files via rsync
6. Configure Nginx
7. Verify deployment

### Step 4: Configure SSL

```bash
# On server
ssh root@217.198.5.230

# Install SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
certbot renew --dry-run
```

## Nginx Configuration

The deployment includes:
- **HTTP/2** enabled
- **Gzip & Brotli** compression
- **Security headers** (CSP, X-Frame-Options, etc.)
- **Rate limiting** (10 req/s general, 5 req/s API)
- **Static asset caching** (1 year for images, 1 month for CSS/JS)
- **Telegram WebApp CSP** configured

### Configuration Files
- Main config: `/etc/nginx/sites-available/ai-model-landing`
- Logs: `/var/log/nginx/ai-model-landing-*.log`

## Security Features

### Firewall (UFW)
```bash
# Check status
ufw status

# Allowed ports:
# - 22 (SSH)
# - 80 (HTTP)
# - 443 (HTTPS)
```

### Fail2ban
Protects against brute-force attacks
```bash
# Check status
fail2ban-client status

# Check nginx jail
fail2ban-client status nginx-http-auth
```

### SSL/TLS
- TLS 1.2 and 1.3 only
- Modern cipher suites
- HSTS enabled (via headers)

## Monitoring

### Check Application Status
```bash
# On server
curl http://localhost/health
# Should return: OK

# Check Nginx
systemctl status nginx

# Check logs
tail -f /var/log/nginx/ai-model-landing-access.log
tail -f /var/log/nginx/ai-model-landing-error.log
```

### Performance Metrics
```bash
# Install monitoring tools
apt-get install htop iotop nethogs

# Check system resources
htop

# Check disk usage
df -h

# Check network
nethogs
```

## Backup & Recovery

### Automatic Backups
- Location: `/var/backups/ai-model-landing/`
- Retention: Last 5 deployments
- Format: `backup-YYYYMMDD-HHMMSS.tar.gz`

### Manual Backup
```bash
# On server
cd /var/www/ai-model-landing
tar -czf ~/backup-$(date +%Y%m%d-%H%M%S).tar.gz .
```

### Restore from Backup
```bash
# Using deploy script (recommended)
./deploy.sh rollback

# Manual restore
tar -xzf /var/backups/ai-model-landing/backup-XXXXXX.tar.gz -C /var/www/ai-model-landing/
systemctl reload nginx
```

## Troubleshooting

### Nginx fails to start
```bash
# Check configuration
nginx -t

# Check logs
journalctl -u nginx -n 50

# Check if port 80/443 is in use
netstat -tlnp | grep ':80\|:443'
```

### Site not accessible
```bash
# Check firewall
ufw status

# Check Nginx is running
systemctl status nginx

# Test from server
curl -I http://localhost

# Check DNS (if using domain)
dig yourdomain.com
```

### Permission errors
```bash
# Fix ownership
chown -R www-data:www-data /var/www/ai-model-landing

# Fix permissions
find /var/www/ai-model-landing -type d -exec chmod 755 {} \;
find /var/www/ai-model-landing -type f -exec chmod 644 {} \;
```

### SSL issues
```bash
# Check certificate
certbot certificates

# Renew manually
certbot renew --nginx

# Force renewal
certbot renew --force-renewal
```

## Performance Optimization

### Enable Brotli (if not available)
```bash
# Install Brotli module
apt-get install nginx-module-brotli

# Add to nginx.conf
load_module modules/ngx_http_brotli_filter_module.so;
load_module modules/ngx_http_brotli_static_module.so;
```

### Configure Cache
Already configured in Nginx:
- Images/Fonts: 1 year
- CSS/JS: 1 month
- HTML: No cache (for updates)

### CDN Integration (Optional)
Consider using:
- Cloudflare (free tier)
- AWS CloudFront
- Bunny CDN

## Telegram WebApp Configuration

### Update Bot Settings
```bash
# Set WebApp URL in BotFather
/setmenubutton
# Enter your production URL
```

### Test in Telegram
1. Open bot in Telegram
2. Tap menu button
3. Verify fullscreen works
4. Test haptics on buttons

## Maintenance

### Update Application
```bash
# Local changes
git pull origin main
./deploy.sh deploy
```

### Update System Packages
```bash
# On server
apt-get update && apt-get upgrade -y
```

### Renew SSL (automatic via cron)
Certbot sets up automatic renewal. Check with:
```bash
systemctl list-timers | grep certbot
```

### Rotate Logs
Nginx logs auto-rotate via logrotate:
```bash
# Check config
cat /etc/logrotate.d/nginx
```

## Environment Variables

For sensitive data, create `.env` file on server:
```bash
# On server
cat > /var/www/ai-model-landing/.env << EOF
NODE_ENV=production
# Add other variables as needed
EOF
```

## CI/CD Integration (Future)

Example GitHub Actions workflow:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: ./deploy.sh deploy
```

## Support Contacts

- **DevOps:** [Your contact]
- **Server Provider:** [Provider contact]
- **Emergency:** [On-call number]

## Changelog

- **2025-10-31:** Initial production deployment
  - Astro static site
  - Nginx with SSL
  - Telegram WebApp integration
  - Security hardening
  - Automated backups
