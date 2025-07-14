const { createLogger, format, transports } = require('winston');
const path = require('path');
const axios = require('axios');

const webhookUrl = process.env.DISCORD_LOG_WEBHOOK_URL;

const sendToDiscordWebhook = async (level, message) => {
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, {
      embeds: [
        {
          title: `🚨 Log (${level.toUpperCase()})`,
          description: `
**Mensagem:**
\`\`\`
${message}
\`\`\`
` + (process.env.RAILWAY_STATIC_URL ? `\n**Railway:** ${process.env.RAILWAY_STATIC_URL}` : ''),
          color: level === 'error' ? 0xff4757 : 0xe74c3c,
          timestamp: new Date().toISOString()
        }
      ]
    });
  } catch (err) {
    // Não logar erro de webhook para evitar loop
  }
};

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(__dirname, '../logs/bot.log'), maxsize: 1024 * 1024 * 5, maxFiles: 3 })
  ]
});

// Enviar logs de erro para o Discord
logger.on('data', (log) => {
  if (log.level === 'error') {
    sendToDiscordWebhook(log.level, log.message);
  }
});

module.exports = logger; 