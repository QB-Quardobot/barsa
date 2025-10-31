# Production Deployment

## Quick Start

```bash
# 1. Setup SSH key
ssh-copy-id root@217.198.5.230

# 2. Deploy
./deploy-git.sh setup    # First time only
./deploy-git.sh ssl      # Setup SSL certificate
./deploy-git.sh deploy   # Regular updates
```

## Domain: illariooo.ru

Сервер: 217.198.5.230

## DNS Setup

Добавьте в регистраторе доменов:
- A record: `illariooo.ru` → `217.198.5.230`
- A record: `www.illariooo.ru` → `217.198.5.230`

Проверка: `dig illariooo.ru +short`

## Commands

```bash
./deploy-git.sh setup      # Initial server setup
./deploy-git.sh ssl        # Install SSL certificate
./deploy-git.sh deploy     # Deploy updates
./deploy-git.sh rollback   # Rollback to previous version
./deploy-git.sh logs       # View logs
./deploy-git.sh verify     # Check status
```

## Workflow

```bash
# Make changes
git add .
git commit -m "Update"

# Deploy
./deploy-git.sh deploy
```

## Telegram Bot

После деплоя настройте в @BotFather:
```
/setmenubutton
URL: https://illariooo.ru
```

## Troubleshooting

**DNS not working?**
```bash
dig illariooo.ru +short  # Should return: 217.198.5.230
```

**SSH issues?**
```bash
ssh-copy-id root@217.198.5.230
```

**Site down?**
```bash
ssh root@217.198.5.230 "systemctl status nginx"
```

## Architecture

- **Git-based deployment** (server pulls from GitHub)
- **Zero downtime** updates
- **Automatic SSL** (Let's Encrypt)
- **Nginx** with HTTP/2, Gzip, caching
- **Security**: Firewall, Fail2ban, HSTS, CSP

## Monitoring

```bash
# Health check
curl https://illariooo.ru/health

# Logs
./deploy-git.sh logs

# Server status
ssh root@217.198.5.230 "systemctl status nginx"
```

## Structure on Server

```
/var/www/illariooo.ru/
├── .git/           # Git repo
├── dist/           # Built files (served)
├── src/            # Source code
└── package.json
```

That's it! 🚀
