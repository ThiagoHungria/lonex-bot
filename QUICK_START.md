# 🚀 Início Rápido - Bot de Administração Lonex Store

## ⚡ Configuração em 5 minutos

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o bot
```bash
npm run setup
```
Siga as instruções e forneça as informações solicitadas.

### 3. Registrar comandos
```bash
npm run deploy
```

### 4. Iniciar o bot
```bash
npm start
```

## 📋 Informações necessárias

Antes de executar o setup, você precisará:

### Do Discord Developer Portal:
- **Token do Bot**: Encontrado em Bot > Token
- **Client ID**: Encontrado em General Information > Application ID

### Do seu servidor Discord:
- **ID do Servidor**: Clique com botão direito no servidor > Copiar ID
- **ID do Canal de Logs** (opcional): Clique com botão direito no canal > Copiar ID
- **ID do Canal de Boas-vindas** (opcional): Clique com botão direito no canal > Copiar ID
- **ID da Role de Administrador** (opcional): Clique com botão direito na role > Copiar ID
- **ID da Role de Moderador** (opcional): Clique com botão direito na role > Copiar ID

## 🔧 Configuração do Servidor

### Estrutura recomendada:
```
📁 Servidor Discord
├── #📊・logs (canal de logs)
├── #👋・boas-vindas (canal de boas-vindas)
├── 👑 Admin (role)
└── 🛡️ Moderador (role)
```

### Permissões do Bot:
- ✅ Enviar Mensagens
- ✅ Gerenciar Mensagens
- ✅ Banir Membros
- ✅ Expulsar Membros
- ✅ Moderar Membros
- ✅ Gerenciar Cargos
- ✅ Ver Canais
- ✅ Ler Histórico de Mensagens
- ✅ Usar Comandos Slash
- ✅ Incorporar Links
- ✅ Anexar Arquivos

## 🎯 Teste Rápido

1. **Teste de ping**: Digite `/ping` para verificar se o bot está funcionando
2. **Informações do servidor**: Digite `/serverinfo` para ver detalhes do servidor
3. **Comando de ajuda**: Digite `/help` para ver todos os comandos disponíveis
4. **Teste de moderação**: Use `/userinfo @usuario` para ver informações de um usuário

## 🛡️ Comandos de Moderação

### Básicos:
- `/ban @usuario motivo:Spam` - Banir usuário
- `/kick @usuario motivo:Comportamento inadequado` - Expulsar usuário
- `/mute @usuario duracao:1h motivo:Spam` - Silenciar usuário
- `/clear 10` - Limpar 10 mensagens

### Informações:
- `/userinfo @usuario` - Informações detalhadas do usuário
- `/serverinfo` - Informações do servidor
- `/stats` - Estatísticas do servidor

### Utilitários:
- `/ping` - Latência do bot
- `/avatar @usuario` - Avatar do usuário
- `/help` - Lista de comandos

## 🆘 Problemas Comuns

### Bot não responde:
- Verifique se o token está correto
- Confirme se o bot está online
- Verifique as permissões

### Comandos não aparecem:
- Execute `npm run deploy` para registrar os comandos
- Verifique se o bot tem permissão para usar comandos slash
- Aguarde alguns minutos para os comandos aparecerem

### Erro de permissões:
- Verifique se o bot tem todas as permissões necessárias
- Confirme se as roles estão configuradas corretamente

### Comandos de moderação não funcionam:
- Verifique se o bot tem permissão para banir/expulsar/moderar
- Confirme se o usuário alvo não tem cargo superior ao bot

## 📞 Suporte

Se precisar de ajuda, consulte o `README.md` completo ou entre em contato. 