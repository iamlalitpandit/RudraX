/**
 * RudraX WebUI PM2 Ecosystem — Production Process Manager
 *
 * Usage:
 *   npm run webui:pm2         — Start WebUI with PM2
 *   npm run webui:pm2:stop    — Stop WebUI PM2 process
 *   npm run webui:pm2:restart — Restart WebUI PM2 process
 *   npm run webui:pm2:logs    — View WebUI logs
 *
 * Or manually:
 *   pm2 start ecosystem.config.mjs
 *   pm2 stop rudrax-webui
 *   pm2 restart rudrax-webui
 *   pm2 logs rudrax-webui
 *   pm2 save
 */

const ROOT_DIR = import.meta.dir || new URL('.', import.meta.url).pathname;

export default {
  apps: [{
    name: 'rudrax-webui',
    script: './webui/server.js',
    cwd: ROOT_DIR,
    env: {
      NODE_ENV: 'production',
      RUDRAX_WEBUI_PORT: 5555,
    },
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    watch: false,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '~/.rudrax/logs/webui-error.log',
    out_file: '~/.rudrax/logs/webui-out.log',
    merge_logs: true,
    time: true,
  }],
};