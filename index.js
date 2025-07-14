require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const Database = require('./config/database');
const fs = require('fs');
const path = require('path');

// Criar cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Inicializar banco de dados
const db = new Database();

// Coleção para comandos
client.commands = new Collection();

// Carregar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando carregado: ${command.data.name}`);
    } else {
        console.log(`⚠️ Comando em ${filePath} está faltando propriedades obrigatórias.`);
    }
}

// Evento: Bot pronto
client.once(Events.ClientReady, () => {
    console.log(`🤖 ${client.user.tag} está online!`);
    console.log(`📊 Servindo ${client.guilds.cache.size} servidores`);
    console.log(`👥 Total de ${client.users.cache.size} usuários`);
    console.log(`⚡ ${client.commands.size} comandos carregados`);
    
    // Definir status do bot
    client.user.setActivity('Lonex', { type: 'WATCHING' });
});

// Evento: Interação com comandos
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) {
                console.error(`Comando ${interaction.commandName} não encontrado.`);
                return;
            }

            await command.execute(interaction);
        }
    } catch (error) {
        console.error('Erro ao processar comando:', error);
        
        const errorMessage = {
            content: '❌ Ocorreu um erro ao executar este comando.',
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Evento: Membro entrou no servidor
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const config = await db.getGuildConfig(member.guild.id);
        
        if (config?.welcome_channel_id) {
            const welcomeChannel = member.guild.channels.cache.get(config.welcome_channel_id);
            if (welcomeChannel) {
                const welcomeEmbed = EmbedUtils.createWelcomeEmbed(member);
                await welcomeChannel.send({ embeds: [welcomeEmbed] });
            }
        }

        // Atribuir cargo automático se configurado
        if (config?.auto_role_id) {
            const autoRole = member.guild.roles.cache.get(config.auto_role_id);
            if (autoRole) {
                await member.roles.add(autoRole).catch(console.error);
            }
        }

        // Atualizar estatísticas
        const stats = await db.getStats(member.guild.id) || {};
        stats.total_members = member.guild.memberCount;
        await db.updateStats(member.guild.id, stats);

    } catch (error) {
        console.error('Erro ao processar novo membro:', error);
    }
});

// Evento: Membro saiu do servidor
client.on(Events.GuildMemberRemove, async (member) => {
    try {
        // Atualizar estatísticas
        const stats = await db.getStats(member.guild.id) || {};
        stats.total_members = member.guild.memberCount;
        await db.updateStats(member.guild.id, stats);
    } catch (error) {
        console.error('Erro ao processar saída de membro:', error);
    }
});

// Evento: Mensagem enviada
client.on(Events.MessageCreate, async (message) => {
    try {
        // Ignorar mensagens de bots
        if (message.author.bot) return;

        // Atualizar estatísticas de mensagens
        const stats = await db.getStats(message.guild.id) || {};
        stats.total_messages = (stats.total_messages || 0) + 1;
        await db.updateStats(message.guild.id, stats);

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});

// Evento: Erro não capturado
process.on('unhandledRejection', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Exceção não capturada:', error);
});

// Evento: Sinal de encerramento
process.on('SIGINT', () => {
    console.log('\n🔄 Encerrando bot...');
    db.close();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Encerrando bot...');
    db.close();
    client.destroy();
    process.exit(0);
});

// Verificar variáveis de ambiente
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'CLIENT_ID',
    'GUILD_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente ausentes:', missingVars.join(', '));
    console.error('Por favor, configure o arquivo .env com todas as variáveis necessárias.');
    process.exit(1);
}

// Conectar ao Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Erro ao fazer login:', error);
    process.exit(1);
}); 