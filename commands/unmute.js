const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('🔊 Remove o silenciamento (mute) de um usuário')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário a ser desmutado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do desmute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado';

            // Buscar membro
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Usuário Não Encontrado')
                    .setDescription('O usuário especificado não foi encontrado neste servidor.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (member.id === interaction.user.id) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Erro')
                    .setDescription('Você não pode desmutar a si mesmo.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (!member.moderatable) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Erro')
                    .setDescription('Não posso desmutar este usuário. Verifique minhas permissões.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Verificar se está mutado
            if (!member.isCommunicationDisabled()) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Usuário Não Está Mutado')
                    .setDescription('Este usuário não está silenciado.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#2d98da')
                .setTitle('🔊・Confirmação de Desmute')
                .setDescription(`Você está prestes a remover o mute de **${user.tag}**.\n\n🔹 **Motivo:** ${reason}\n⚠️ O usuário poderá enviar mensagens normalmente após o desmute.`)
                .addFields(
                    { name: '👤 Usuário', value: `${user} (${user.id})`, inline: true },
                    { name: '📝 Motivo', value: reason, inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_unmute')
                        .setLabel('🟢 Confirmar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_unmute')
                        .setLabel('🔴 Cancelar')
                        .setStyle(ButtonStyle.Danger)
                );

            const response = await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                fetchReply: true
            });

            const collector = response.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '❌ Apenas quem executou o comando pode confirmar esta ação.', ephemeral: true });
                }

                if (i.customId === 'confirm_unmute') {
                    try {
                        await member.timeout(null, `${interaction.user.tag}: ${reason}`);
                        // Salvar log no banco
                        const db = new Database();
                        await db.addModLog('unmute', user.id, null, reason, interaction.user.id, interaction.guild.id);

                        // Embed de sucesso
                        const successEmbed = new EmbedBuilder()
                            .setColor('#2ed573')
                            .setTitle('🔊・Usuário Desmutado com Sucesso!')
                            .setDescription(`🔊 **${user.tag}** foi desmutado.\n\n🔹 **Motivo:** ${reason}`)
                            .addFields(
                                { name: '👤 Usuário Desmutado', value: `${user} (${user.id})`, inline: true },
                                { name: '👮‍♂️ Desmutado por', value: `${interaction.user}`, inline: true },
                                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                            )
                            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                            .setTimestamp()
                            .setFooter({ text: 'Lonex ・ Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                        await i.update({ embeds: [successEmbed], components: [] });

                        // Log no canal de logs
                        const config = await db.getGuildConfig(interaction.guild.id);
                        if (config?.log_channel_id) {
                            const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                            if (logChannel) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor('#2ed573')
                                    .setTitle('🔊・Log de Desmute')
                                    .setDescription('🔊 Um usuário foi desmutado no servidor.')
                                    .addFields(
                                        { name: '👤 Usuário Desmutado', value: `${user} (${user.id})`, inline: true },
                                        { name: '👮‍♂️ Desmutado por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
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
                        console.error('Erro ao desmutar usuário:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('❌ Erro')
                            .setDescription('Ocorreu um erro ao desmutar o usuário.')
                            .setTimestamp();
                        await i.update({ embeds: [errorEmbed], components: [] });
                    }
                } else if (i.customId === 'cancel_unmute') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('🔴・Ação Cancelada')
                        .setDescription('O desmute foi cancelado.')
                        .setTimestamp();
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('⏰・Tempo Expirado')
                        .setDescription('O tempo para confirmar o desmute expirou.')
                        .setTimestamp();
                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });

        } catch (error) {
            console.error('Erro no comando unmute:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao executar o comando.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 