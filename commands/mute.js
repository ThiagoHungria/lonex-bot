const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../config/database');
const EmbedUtils = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('🔇 Silencia um usuário temporariamente')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário a ser silenciado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duracao')
                .setDescription('Duração do mute (ex: 1h, 30m, 1d)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('usuario');
            const durationStr = interaction.options.getString('duracao');
            const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado';

            // Duração obrigatória
            if (!durationStr) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Duração Obrigatória')
                    .setDescription('Você precisa informar uma duração para o mute. Exemplo: `1h`, `30m`, `1d`.')
                    .addFields({ name: '📝 Exemplos válidos', value: '`30s`, `5m`, `2h`, `1d`', inline: false })
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            let duration = parseDuration(durationStr);
            if (duration === null || duration <= 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Formato Inválido')
                    .setDescription('Formato de duração inválido. Use: `1h`, `30m`, `1d`, etc.')
                    .addFields({ name: '📝 Exemplos válidos', value: '`30s`, `5m`, `2h`, `1d`', inline: false })
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            let durationText = formatDuration(duration);

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff9ff3')
                .setTitle('🔇・Confirmação de Silenciamento')
                .setDescription(`Você está prestes a silenciar **${user.tag}**.\n\n🔹 **Motivo:** ${reason}\n⏱️ **Duração:** ${durationText}\n⚠️ O usuário não poderá enviar mensagens durante este período.`)
                .addFields(
                    { name: '👤 Usuário', value: `${user} (${user.id})`, inline: true },
                    { name: '⏱️ Duração', value: durationText, inline: true },
                    { name: '📝 Motivo', value: reason, inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_mute')
                        .setLabel('🟢 Confirmar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_mute')
                        .setLabel('🔴 Cancelar')
                        .setStyle(ButtonStyle.Danger)
                );

            const response = await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                fetchReply: true
            });

            // Coletor de botões
            const collector = response.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '❌ Apenas quem executou o comando pode confirmar esta ação.', ephemeral: true });
                }

                if (i.customId === 'confirm_mute') {
                    try {
                        // Verificar se o usuário pode ser mutado
                        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                        
                        if (!member) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#ff4757')
                                .setTitle('❌ Erro')
                                .setDescription('Usuário não encontrado no servidor.')
                                .setTimestamp();
                            
                            return i.update({ embeds: [errorEmbed], components: [] });
                        }

                        if (member.id === interaction.user.id) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#ff4757')
                                .setTitle('❌ Erro')
                                .setDescription('Você não pode silenciar a si mesmo.')
                                .setTimestamp();
                            
                            return i.update({ embeds: [errorEmbed], components: [] });
                        }

                        if (!member.moderatable) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#ff4757')
                                .setTitle('❌ Erro')
                                .setDescription('Não posso silenciar este usuário. Verifique minhas permissões.')
                                .setTimestamp();
                            
                            return i.update({ embeds: [errorEmbed], components: [] });
                        }

                        // Aplicar timeout
                        await member.timeout(duration * 1000, `${interaction.user.tag}: ${reason}`);

                        // Salvar no banco de dados
                        const db = new Database();
                        await db.addMute(user.id, interaction.guild.id, interaction.user.id, reason, duration);
                        await db.addModLog('mute', user.id, null, reason, interaction.user.id, interaction.guild.id);

                        // Embed de sucesso
                        const successEmbed = new EmbedBuilder()
                            .setColor('#2ed573')
                            .setTitle('🔇・Usuário Silenciado com Sucesso!')
                            .setDescription(`🔇 **${user.tag}** foi silenciado temporariamente.\n\n🔹 **Motivo:** ${reason}\n⏱️ **Duração:** ${durationText}`)
                            .addFields(
                                { name: '👤 Usuário Silenciado', value: `${user} (${user.id})`, inline: true },
                                { name: '👮‍♂️ Silenciado por', value: `${interaction.user}`, inline: true },
                                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                            )
                            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                            .setTimestamp()
                            .setFooter({ text: 'Lonex ・ Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                        await i.update({ embeds: [successEmbed], components: [] });

                        // Enviar para canal de logs se configurado
                        const config = await db.getGuildConfig(interaction.guild.id);
                        if (config?.log_channel_id) {
                            const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                            if (logChannel) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor('#ff9ff3')
                                    .setTitle('🔇・Log de Silenciamento')
                                    .setDescription('🔇 Um usuário foi silenciado no servidor.')
                                    .addFields(
                                        { name: '👤 Usuário Silenciado', value: `${user} (${user.id})`, inline: true },
                                        { name: '👮‍♂️ Silenciado por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
                                        { name: '⏱️ Duração', value: durationText, inline: true },
                                        { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                                        { name: '📝 Motivo', value: reason, inline: false }
                                    )
                                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                                    .setTimestamp()
                                    .setFooter({ text: 'Lonex ・ Sistema de Logs', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                                await logChannel.send({ embeds: [logEmbed] });
                            }
                        }

                    } catch (error) {
                        console.error('Erro ao silenciar usuário:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('❌ Erro')
                            .setDescription('Ocorreu um erro ao silenciar o usuário.')
                            .setTimestamp();
                        
                        await i.update({ embeds: [errorEmbed], components: [] });
                    }
                } else if (i.customId === 'cancel_mute') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('🔴・Ação Cancelada')
                        .setDescription('O silenciamento foi cancelado.')
                        .setTimestamp();
                    
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('⏰・Tempo Expirado')
                        .setDescription('O tempo para confirmar o silenciamento expirou.')
                        .setTimestamp();
                    
                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });

        } catch (error) {
            console.error('Erro no comando mute:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao executar o comando.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

function parseDuration(durationStr) {
    const regex = /^(\d+)([smhd])$/;
    const match = durationStr.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return null;
    }
}

function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds} segundos`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(seconds / 86400);
        return `${days} dia${days > 1 ? 's' : ''}`;
    }
} 