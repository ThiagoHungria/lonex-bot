const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('🏠 Mostra informações detalhadas do servidor'),

    async execute(interaction) {
        try {
            const guild = interaction.guild;

            // Calcular estatísticas
            const totalMembers = guild.memberCount;
            const onlineMembers = guild.members.cache.filter(member => member.presence?.status !== 'offline').size;
            const botCount = guild.members.cache.filter(member => member.user.bot).size;
            const humanCount = totalMembers - botCount;

            // Canais por tipo
            const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
            const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
            const totalChannels = textChannels + voiceChannels + categories;

            // Cargos
            const totalRoles = guild.roles.cache.size - 1; // -1 para excluir @everyone

            // Boost
            const boostLevel = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount;
            const boostLevelText = {
                0: 'Nenhum',
                1: 'Nível 1',
                2: 'Nível 2',
                3: 'Nível 3'
            };

            // Verificação
            const verificationLevel = {
                0: 'Nenhuma',
                1: 'Baixa',
                2: 'Média',
                3: 'Alta',
                4: 'Muito Alta'
            };

            // Datas
            const createdAt = Math.floor(guild.createdTimestamp / 1000);
            const now = Math.floor(Date.now() / 1000);

            // Criar embed premium
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle(`🏠 Informações de ${guild.name}`)
                .setDescription(guild.description || 'Nenhuma descrição definida.')
                .addFields([
                    { name: '🆔 ID do Servidor', value: guild.id, inline: true },
                    { name: '👑 Proprietário', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '📅 Criado em', value: `<t:${createdAt}:F>\n(<t:${createdAt}:R>)`, inline: true },
                    { name: '👥 Total de Membros', value: `${totalMembers}`, inline: true },
                    { name: '🟢 Membros Online', value: `${onlineMembers}`, inline: true },
                    { name: '🤖 Bots', value: `${botCount}`, inline: true },
                    { name: '📝 Canais de Texto', value: `${textChannels}`, inline: true },
                    { name: '🎤 Canais de Voz', value: `${voiceChannels}`, inline: true },
                    { name: '📁 Categorias', value: `${categories}`, inline: true },
                    { name: '🎭 Cargos', value: `${totalRoles}`, inline: true },
                    { name: '🚀 Boost Level', value: `${boostLevelText[boostLevel]} (${boostCount} boosts)`, inline: true },
                    { name: '🔒 Verificação', value: verificationLevel[guild.verificationLevel], inline: true }
                ])
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Informações', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            // Adicionar informações extras
            const extras = [];
            if (guild.bannerURL()) extras.push(`**Banner:** [Clique aqui](${guild.bannerURL()})`);
            if (guild.splashURL()) extras.push(`**Splash:** [Clique aqui](${guild.splashURL()})`);
            if (guild.discoverySplashURL()) extras.push(`**Discovery Splash:** [Clique aqui](${guild.discoverySplashURL()})`);
            if (guild.vanityURLCode) extras.push(`**Vanity URL:** discord.gg/${guild.vanityURLCode}`);
            if (guild.features.length > 0) extras.push(`**Recursos:** ${guild.features.map(feature => feature.replace(/_/g, ' ').toLowerCase()).join(', ')}`);

            if (extras.length > 0) {
                embed.addFields({ name: '📋 Informações Extras', value: extras.join('\n'), inline: false });
            }

            // Adicionar estatísticas de emojis se disponível
            const emojiCount = guild.emojis.cache.size;
            const animatedEmojis = guild.emojis.cache.filter(emoji => emoji.animated).size;
            const staticEmojis = emojiCount - animatedEmojis;

            if (emojiCount > 0) {
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
            console.error('Erro ao buscar informações do servidor:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao buscar informações do servidor.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 