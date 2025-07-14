const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Database = require('../config/database');
const EmbedUtils = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 Mostra estatísticas detalhadas do servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            const db = new Database();
            const guild = interaction.guild;
            
            // Buscar estatísticas do banco de dados
            const stats = await db.getStats(guild.id);
            
            // Estatísticas em tempo real
            const totalMembers = guild.memberCount;
            const onlineMembers = guild.members.cache.filter(member => member.presence?.status !== 'offline').size;
            const botCount = guild.members.cache.filter(member => member.user.bot).size;
            const humanCount = totalMembers - botCount;

            // Canais
            const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
            const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
            const totalChannels = textChannels + voiceChannels + categories;

            // Cargos
            const totalRoles = guild.roles.cache.size - 1;

            // Boost
            const boostLevel = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount;
            const boostLevelText = {
                0: 'Nenhum',
                1: 'Nível 1',
                2: 'Nível 2',
                3: 'Nível 3'
            };

            // Estatísticas do banco de dados
            const dbStats = stats || {
                total_messages: 0,
                total_commands: 0,
                total_members: totalMembers
            };

            // Calcular porcentagens
            const onlinePercentage = ((onlineMembers / totalMembers) * 100).toFixed(1);
            const botPercentage = ((botCount / totalMembers) * 100).toFixed(1);
            const humanPercentage = ((humanCount / totalMembers) * 100).toFixed(1);

            // Criar embed premium
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle(`📊 Estatísticas de ${guild.name}`)
                .setDescription(`Estatísticas detalhadas e em tempo real do servidor.`)
                .addFields([
                    { name: '👥 Membros', value: `**Total:** ${totalMembers}\n**Online:** ${onlineMembers} (${onlinePercentage}%)\n**Humanos:** ${humanCount} (${humanPercentage}%)\n**Bots:** ${botCount} (${botPercentage}%)`, inline: true },
                    { name: '📝 Canais', value: `**Total:** ${totalChannels}\n**Texto:** ${textChannels}\n**Voz:** ${voiceChannels}\n**Categorias:** ${categories}`, inline: true },
                    { name: '🎭 Cargos', value: `**Total:** ${totalRoles}\n**Boost Level:** ${boostLevelText[boostLevel]}\n**Boosts:** ${boostCount}`, inline: true },
                    { name: '📈 Atividade', value: `**Mensagens:** ${dbStats.total_messages.toLocaleString()}\n**Comandos:** ${dbStats.total_commands.toLocaleString()}\n**Crescimento:** +${dbStats.total_members - (dbStats.total_members || totalMembers)} membros`, inline: true }
                ])
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Estatísticas', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            // Adicionar informações extras se disponível
            const extras = [];
            if (guild.vanityURLCode) extras.push(`**Vanity URL:** discord.gg/${guild.vanityURLCode}`);
            if (guild.features.length > 0) extras.push(`**Recursos:** ${guild.features.length} recursos especiais`);
            if (guild.verificationLevel > 0) extras.push(`**Verificação:** Nível ${guild.verificationLevel}`);

            if (extras.length > 0) {
                embed.addFields({ name: '📋 Informações Extras', value: extras.join('\n'), inline: false });
            }

            // Adicionar estatísticas de emojis se disponível
            const emojiCount = guild.emojis.cache.size;
            if (emojiCount > 0) {
                const animatedEmojis = guild.emojis.cache.filter(emoji => emoji.animated).size;
                const staticEmojis = emojiCount - animatedEmojis;
                
                embed.addFields({ 
                    name: '😄 Emojis', 
                    value: `**Total:** ${emojiCount}\n**Animados:** ${animatedEmojis}\n**Estáticos:** ${staticEmojis}`, 
                    inline: true 
                });
            }

            // Adicionar estatísticas de convites se disponível
            const inviteCount = guild.invites.cache.size;
            if (inviteCount > 0) {
                embed.addFields({ name: '📨 Convites', value: `${inviteCount} convites ativos`, inline: true });
            }

            // Adicionar estatísticas de webhooks se disponível
            const webhookCount = guild.webhooks.cache.size;
            if (webhookCount > 0) {
                embed.addFields({ name: '🔗 Webhooks', value: `${webhookCount} webhooks`, inline: true });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao buscar estatísticas do servidor.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 