# 🤖 Lonex - Bot de Administração Premium

Um bot de Discord avançado e premium inspirado na Loritta, desenvolvido em Node.js com Discord.js v14.

## ✨ Funcionalidades Premium

### 🛡️ Sistema de Moderação Avançado
- **Ban/Kick/Mute** com confirmação interativa e logs detalhados
- **Sistema de Avisos** com histórico completo
- **Limpeza Avançada** com filtros por tipo de mensagem
- **Travar/Destravar** canais com notificações
- **Modo Lento** configurável
- **Logs Automáticos** para todas as ações de moderação

### 🎮 Comandos de Diversão
- **Sorteios Interativos** com botões e temporizador
- **Enquetes Avançadas** com gráficos de progresso
- **Cara ou Coroa** com embeds modernos
- **Dados Personalizados** (2-100 lados)
- **Bola 8 Mágica** com respostas categorizadas

### 📊 Sistema de Informações Premium
- **Userinfo Detalhado** com permissões e status
- **Serverinfo Completo** com estatísticas em tempo real
- **Roleinfo Avançado** com análise de permissões
- **Avatar/Banner/Servericon** em alta qualidade
- **Stats Premium** com métricas detalhadas

### ⚙️ Utilitários Avançados
- **Sistema de Lembretes** (em desenvolvimento)
- **Configuração Interativa** (em desenvolvimento)
- **Ping Aprimorado** com status de latência
- **Help Categorizado** com navegação por botões

### 🔧 Comandos de Administração
- **Purge Avançado** com filtros múltiplos
- **Lock/Unlock** com notificações
- **Slowmode** configurável
- **Roleinfo** detalhado
- **Servericon/Banner** em alta qualidade

## 🚀 Instalação

### Pré-requisitos
- Node.js 16.9.0 ou superior
- npm ou yarn
- Conta de desenvolvedor do Discord

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/lonex-bot.git
cd lonex-bot
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
TOKEN=seu_token_do_bot
CLIENT_ID=id_do_seu_bot
GUILD_ID=id_do_seu_servidor
```

4. **Configure o banco de dados**
```bash
npm run setup
```

5. **Registre os comandos slash**
```bash
npm run deploy
```

6. **Inicie o bot**
```bash
npm start
```

## 📋 Comandos Disponíveis

### 🛡️ Moderação
- `/ban` - Bane um usuário permanentemente
- `/kick` - Expulsa um usuário do servidor
- `/mute` - Silencia um usuário temporariamente
- `/unmute` - Remove o silenciamento de um usuário
- `/warn` - Avisa um usuário
- `/clear` - Limpa mensagens do canal
- `/purge` - Limpeza avançada com filtros

### 🎮 Diversão
- `/sorteio` - Cria um sorteio interativo
- `/enquete` - Cria uma enquete com botões
- `/coinflip` - Joga cara ou coroa
- `/dice` - Rola dados personalizados
- `/8ball` - Consulta a bola 8 mágica

### 📊 Informações
- `/userinfo` - Informações detalhadas de usuário
- `/serverinfo` - Informações completas do servidor
- `/roleinfo` - Informações detalhadas de cargo
- `/avatar` - Avatar em alta qualidade
- `/servericon` - Ícone do servidor
- `/banner` - Banner do servidor
- `/stats` - Estatísticas premium do servidor
- `/ping` - Status de latência do bot

### ⚙️ Utilitários
- `/lock` - Trava um canal
- `/unlock` - Destrava um canal
- `/slowmode` - Define modo lento
- `/help` - Sistema de ajuda categorizado

## 🔧 Configuração

### Sistema de Logs
Configure um canal de logs no banco de dados:
```sql
INSERT INTO guild_configs (guild_id, log_channel_id) VALUES ('seu_guild_id', 'seu_canal_id');
```

### Permissões Recomendadas
- **Administrador** para comandos de moderação
- **Gerenciar Canais** para lock/unlock/slowmode
- **Gerenciar Mensagens** para clear/purge
- **Banir Membros** para ban
- **Expulsar Membros** para kick
- **Moderar Membros** para mute/unmute/warn

## 🎨 Características Visuais

### Embeds Modernos
- **Cores Dinâmicas** baseadas na ação
- **Thumbnails e Imagens** de alta qualidade
- **Timestamps** formatados
- **Footers Personalizados** com branding

### Botões Interativos
- **Confirmações** para ações importantes
- **Navegação** no sistema de ajuda
- **Participação** em sorteios e enquetes
- **Links Diretos** para avatars e ícones

### Feedback Aprimorado
- **Mensagens de Erro** detalhadas
- **Progress Bars** em enquetes
- **Status Indicators** no ping
- **Logs Detalhados** para todas as ações

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
lonex-bot/
├── commands/          # Comandos slash
├── config/           # Configurações
├── events/           # Eventos do bot
├── handlers/         # Handlers de eventos
├── utils/           # Utilitários
├── database/        # Scripts de banco
└── docs/           # Documentação
```

### Adicionando Novos Comandos
1. Crie um arquivo em `commands/`
2. Use a estrutura padrão com `SlashCommandBuilder`
3. Implemente embeds modernos
4. Adicione logs quando necessário
5. Registre o comando com `npm run deploy`

## 📈 Recursos Premium

### Sistema de Logs Automático
- Logs detalhados para todas as ações de moderação
- Configuração por servidor
- Embeds informativos com contexto completo

### Interatividade Avançada
- Botões de confirmação para ações críticas
- Coletores de tempo para evitar ações acidentais
- Feedback em tempo real

### Visual Moderno
- Embeds com cores dinâmicas
- Thumbnails e imagens de alta qualidade
- Formatação consistente em todos os comandos

### Performance Otimizada
- Defer replies para operações longas
- Filtros eficientes para limpeza
- Cache inteligente de dados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- **Discord:** [Servidor de Suporte](https://discord.gg/seu-servidor)
- **Issues:** [GitHub Issues](https://github.com/seu-usuario/lonex-bot/issues)
- **Documentação:** [Wiki](https://github.com/seu-usuario/lonex-bot/wiki)

## 🙏 Agradecimentos

- **Discord.js** pela excelente API
- **Loritta** pela inspiração
- **Comunidade Discord** pelo feedback

---

**Lonex** - Bot de Administração Premium para Discord 🚀 