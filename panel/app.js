const express = require('express');
const basicAuth = require('basic-auth');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PANEL_PORT || 3001;
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || 'admin123';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware de autenticação básica
app.use((req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.name !== 'admin' || user.pass !== PANEL_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Painel LonexBOT"');
    return res.status(401).send('Autenticação necessária');
  }
  next();
});

// Página inicial: status do bot
app.get('/', (req, res) => {
  // Status simples (pode ser expandido depois)
  res.render('index', {
    status: 'online',
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
    date: new Date()
  });
});

// Página de logs
app.get('/logs', (req, res) => {
  const logPath = path.join(__dirname, '../logs/bot.log');
  let logs = '';
  try {
    logs = fs.readFileSync(logPath, 'utf8');
  } catch (e) {
    logs = 'Nenhum log encontrado.';
  }
  res.render('logs', { logs });
});

app.listen(PORT, () => {
  console.log(`Painel LonexBOT rodando em http://localhost:${PORT}`);
}); 