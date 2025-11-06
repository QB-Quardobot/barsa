module.exports = {
  apps: [
    {
      name: 'barcelona-bots',
      script: 'barcelona_bots/main.py',
      interpreter: 'barcelona_bots/.venv/bin/python',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      cwd: '/var/www/illariooo.ru/bot',
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      time: true,
    },
  ],
};


