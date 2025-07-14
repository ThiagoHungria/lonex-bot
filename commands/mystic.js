const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Database = require('../config/database');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mystic')
        .setDescription('🔮 Dá mute no Mystic por 1h com motivo fixo.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            logger.info(`[MYSTIC] Comando executado por ${interaction.user.tag} (${interaction.user.id}) no servidor ${interaction.guild?.name || 'DM'} (${interaction.guild?.id || 'DM'})`);
            const userId = '1327078145039532042';
            const reason = 'para de ser chato mystic';
            const duration = 3600; // 1 hora em segundos
            const durationText = '1 hora';

            // Buscar membro
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (!member) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Usuário Não Encontrado')
                    .setDescription('O usuário Mystic não foi encontrado neste servidor.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (!member.moderatable) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Erro')
                    .setDescription('Não posso silenciar o Mystic. Verifique minhas permissões.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Aplicar timeout
            await member.timeout(duration * 1000, `${interaction.user.tag}: ${reason}`);

            // Salvar no banco de dados
            const db = new Database();
            await db.addMute(userId, interaction.guild.id, interaction.user.id, reason, duration);
            await db.addModLog('mute', userId, null, reason, interaction.user.id, interaction.guild.id);

            // Embed de sucesso
            const successEmbed = new EmbedBuilder()
                .setColor('#2ed573')
                .setTitle('🔮・Mystic Silenciado!')
                .setDescription(`🔇 <@${userId}> foi silenciado por 1 hora.\n\n🔹 **Motivo:** ${reason}`)
                .addFields(
                    { name: '👤 Usuário Silenciado', value: `<@${userId}> (${userId})`, inline: true },
                    { name: '👮‍♂️ Silenciado por', value: `${interaction.user}`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Lonex ・ Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [successEmbed] });

            // Log no canal de logs
            const config = await db.getGuildConfig(interaction.guild.id);
            if (config?.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#ff9ff3')
                        .setTitle('🔇・Log de Silenciamento')
                        .setDescription('🔇 Mystic foi silenciado no servidor.')
                        .addFields(
                            { name: '👤 Usuário Silenciado', value: `<@${userId}> (${userId})`, inline: true },
                            { name: '👮‍♂️ Silenciado por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
                            { name: '⏱️ Duração', value: durationText, inline: true },
                            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                            { name: '📝 Motivo', value: reason, inline: false }
                        )
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: 'Lonex ・ Sistema de Logs', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            logger.error(`[MYSTIC] Erro ao executar comando: ${error}`);
            console.error('Erro ao mutar Mystic:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao silenciar o Mystic.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 