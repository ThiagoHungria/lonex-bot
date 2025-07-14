const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Destrava um canal')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal a ser destravado (padrão: canal atual)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo para destravar o canal')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('canal') || interaction.channel;
            const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado';

            // Verificar se é um canal de texto
            if (channel.type !== 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Canal Inválido')
                    .setDescription('Este comando só funciona em canais de texto.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Verificar permissões
            if (!channel.permissionsFor(interaction.guild.members.me).has('ManageChannels')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Permissões Insuficientes')
                    .setDescription('Não tenho permissão para gerenciar este canal.')
                    .setTimestamp();
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Verificar se já está destravado
            const overwrite = channel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);
            if (!overwrite || !overwrite.deny.has('SendMessages')) {
                const alreadyEmbed = new EmbedBuilder()
                    .setColor('#2ed573')
                    .setTitle('🔓 Canal já está destravado')
                    .setDescription('Este canal já está liberado para mensagens.')
                    .setTimestamp();
                return interaction.reply({ embeds: [alreadyEmbed], ephemeral: true });
            }

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#2ed573')
                .setTitle('🔓・Confirmação de Destravamento')
                .setDescription(`Você está prestes a destravar o canal ${channel}.

${'🔹'} **Motivo:** ${reason}
${'⚠️'} Todos poderão enviar mensagens após destravar.`)
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_unlock')
                        .setLabel('🟢 Confirmar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_unlock')
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

                if (i.customId === 'confirm_unlock') {
                    try {
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            SendMessages: null
                        }, { reason: `${interaction.user.tag}: ${reason}` });

                        // Salvar log no banco
                        const db = new Database();
                        await db.addModLog('unlock', interaction.user.id, channel.id, reason, interaction.user.id, interaction.guild.id);

                        // Embed de sucesso
                        const successEmbed = new EmbedBuilder()
                            .setColor('#2ed573')
                            .setTitle('🔓・Canal Destravado com Sucesso!')
                            .setDescription(`🔓 ${channel} foi destravado!

${'🔹'} **Motivo:** ${reason}`)
                            .addFields(
                                { name: '📝 Canal', value: `${channel} (${channel.id})`, inline: true },
                                { name: '👮‍♂️ Destravado por', value: `${interaction.user}`, inline: true },
                                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                            )
                            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                            .setTimestamp()
                            .setFooter({ text: 'Lonex ・ Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                        await i.update({ embeds: [successEmbed], components: [] });

                        // Mensagem no canal destravado
                        const unlockEmbed = new EmbedBuilder()
                            .setColor('#2ed573')
                            .setTitle('🔓・Canal Destravado')
                            .setDescription('🔓 Este canal foi destravado. Você pode enviar mensagens novamente.')
                            .addFields(
                                { name: '👮‍♂️ Destravado por', value: `${interaction.user}`, inline: true },
                                { name: '📝 Motivo', value: reason, inline: true }
                            )
                            .setTimestamp();
                        await channel.send({ embeds: [unlockEmbed] });

                        // Log no canal de logs
                        const config = await db.getGuildConfig(interaction.guild.id);
                        if (config?.log_channel_id) {
                            const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                            if (logChannel) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor('#2ed573')
                                    .setTitle('🔓・Log de Destravamento')
                                    .setDescription(`🔓 Um canal foi destravado no servidor.`)
                                    .addFields(
                                        { name: '📝 Canal', value: `${channel} (${channel.id})`, inline: true },
                                        { name: '👮‍♂️ Destravado por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
                                        { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                                        { name: '🔹 Motivo', value: reason, inline: false }
                                    )
                                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                                    .setTimestamp()
                                    .setFooter({ text: 'Lonex ・ Sistema de Logs', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });
                                await logChannel.send({ embeds: [logEmbed] });
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao destravar canal:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('❌ Erro')
                            .setDescription('Ocorreu um erro ao destravar o canal.')
                            .setTimestamp();
                        await i.update({ embeds: [errorEmbed], components: [] });
                    }
                } else if (i.customId === 'cancel_unlock') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('🔴・Ação Cancelada')
                        .setDescription('O destravamento foi cancelado.')
                        .setTimestamp();
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('⏰・Tempo Expirado')
                        .setDescription('O tempo para confirmar o destravamento expirou.')
                        .setTimestamp();
                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });

        } catch (error) {
            console.error('Erro no comando unlock:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao executar o comando.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 