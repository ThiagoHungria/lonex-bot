# 🎮 Configuração do Discord - Bot de Administração

## 📋 Pré-requisitos

1. **Conta Discord** com permissões de administrador
2. **Servidor Discord** onde você tem permissões de administrador
3. **Acesso ao Discord Developer Portal**

## 🔧 Passo a Passo

### 1. Criar Aplicação no Discord Developer Portal

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em **"New Application"**
3. Digite um nome (ex: "Lonex Admin Bot")
4. Clique em **"Create"**

### 2. Configurar o Bot

1. No menu lateral, clique em **"Bot"**
2. Clique em **"Add Bot"**
3. Em **"Token"**, clique em **"Copy"** (você precisará deste token)
4. Em **"Privileged Gateway Intents"**, ative:
   - ✅ **Message Content Intent**
   - ✅ **Server Members Intent**
   - ✅ **Presence Intent**

### 3. Configurar Permissões

1. Ainda na seção **"Bot"**
2. Em **"Bot Permissions"**, selecione:
   - ✅ **Send Messages**
   - ✅ **Manage Messages**
   - ✅ **Ban Members**
   - ✅ **Kick Members**
   - ✅ **Moderate Members**
   - ✅ **Manage Roles**
   - ✅ **View Channels**
   - ✅ **Read Message History**
   - ✅ **Use Slash Commands**
   - ✅ **Embed Links**
   - ✅ **Attach Files**

### 4. Gerar Link de Convite

1. No menu lateral, clique em **"OAuth2"**
2. Clique em **"URL Generator"**
3. Em **"Scopes"**, selecione:
   - ✅ **bot**
   - ✅ **applications.commands**
4. Em **"Bot Permissions"**, selecione as mesmas permissões da etapa 3
5. Copie o **URL gerado**

### 5. Convidar o Bot

1. Abra o URL copiado em uma nova aba
2. Selecione seu servidor
3. Clique em **"Authorize"**
4. Complete o captcha se necessário

## 🏗️ Configurar o Servidor

### 1. Criar Canais Opcionais

#### Canal de Logs:
1. Clique com botão direito em uma área vazia
2. Selecione **"Create Channel"**
3. Tipo: **Text Channel**
4. Nome: `📊・logs`
5. Clique com botão direito no canal > **"Copy ID"**

#### Canal de Boas-vindas:
1. Clique com botão direito em uma área vazia
2. Selecione **"Create Channel"**
3. Tipo: **Text Channel**
4. Nome: `👋・boas-vindas`
5. Clique com botão direito no canal > **"Copy ID"**

### 2. Criar Roles Opcionais

#### Role de Administrador:
1. Vá em **Server Settings** > **Roles**
2. Clique em **"Create Role"**
3. Nome: `👑 Admin`
4. Cor: Vermelho (opcional)
5. Clique com botão direito na role > **"Copy ID"**

#### Role de Moderador:
1. Vá em **Server Settings** > **Roles**
2. Clique em **"Create Role"**
3. Nome: `🛡️ Moderador`
4. Cor: Azul (opcional)
5. Clique com botão direito na role > **"Copy ID"**

### 3. Configurar Permissões

#### Para o Canal de Logs:
1. Clique com botão direito no canal `📊・logs`
2. **Edit Channel**
3. Em **Permissions**, configure:
   - **@everyone**: ❌ View Channel
   - **@Admin**: ✅ View Channel, Send Messages, Read Message History
   - **@Moderador**: ✅ View Channel, Send Messages, Read Message History

#### Para o Canal de Boas-vindas:
1. Clique com botão direito no canal `👋・boas-vindas`
2. **Edit Channel**
3. Em **Permissions**, configure:
   - **@everyone**: ✅ View Channel, Send Messages, Read Message History

## 📊 Estrutura Final

Seu servidor deve ficar assim:

```
📁 Servidor Discord
├── #📊・logs (canal privado)
├── #👋・boas-vindas (canal público)
├── 👑 Admin (role)
└── 🛡️ Moderador (role)
```

## 🔍 Verificar IDs

Para obter os IDs necessários:

1. **Ativar Modo Desenvolvedor**:
   - User Settings > Advanced > Developer Mode

2. **Copiar IDs**:
   - **Servidor**: Clique com botão direito no nome do servidor > Copy ID
   - **Canais**: Clique com botão direito no canal > Copy ID
   - **Roles**: Clique com botão direito na role > Copy ID

## ✅ Checklist de Verificação

- [ ] Bot criado no Developer Portal
- [ ] Token copiado
- [ ] Permissões configuradas
- [ ] Bot convidado para o servidor
- [ ] Canal de logs criado (opcional)
- [ ] Canal de boas-vindas criado (opcional)
- [ ] Role de administrador criada (opcional)
- [ ] Role de moderador criada (opcional)
- [ ] Permissões configuradas
- [ ] Todos os IDs copiados
- [ ] Modo desenvolvedor ativado

## 🚀 Próximos Passos

Após configurar o Discord:

1. Execute `npm run setup`
2. Forneça os IDs coletados
3. Execute `npm run deploy`
4. Execute `npm start`

## 🛡️ Teste dos Comandos

Após iniciar o bot, teste os comandos:

1. **Ping**: `/ping` - Verificar se o bot está funcionando
2. **Informações**: `/serverinfo` - Ver detalhes do servidor
3. **Ajuda**: `/help` - Ver todos os comandos
4. **Moderação**: `/userinfo @usuario` - Ver informações de usuário

## 🆘 Problemas Comuns

### Bot não aparece online:
- Verifique se o token está correto
- Confirme se o bot foi convidado corretamente

### Comandos não aparecem:
- Execute `npm run deploy` para registrar os comandos
- Aguarde alguns minutos para os comandos aparecerem
- Verifique se o bot tem permissão para usar comandos slash

### Erro de permissões:
- Verifique se o bot tem todas as permissões necessárias
- Confirme se as roles foram criadas corretamente

### Comandos de moderação não funcionam:
- Verifique se o bot tem permissão para banir/expulsar/moderar
- Confirme se o usuário alvo não tem cargo superior ao bot
- Verifique se o bot tem permissão para gerenciar roles

### IDs não funcionam:
- Verifique se o modo desenvolvedor está ativado
- Confirme se os IDs foram copiados corretamente 