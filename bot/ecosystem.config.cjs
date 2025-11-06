module.exports = {
  apps: [
    {
      name: 'barcelona-bots',
      script: 'barcelona_bots/main.py',
      interpreter: process.env.PYTHON_INTERPRETER || 'python3',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_restarts: 10,
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


