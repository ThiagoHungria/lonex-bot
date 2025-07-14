const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('🔒 Trava um canal para impedir mensagens')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal a ser travado (padrão: canal atual)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo para travar o canal')
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

            // Verificar se já está travado
            const overwrite = channel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);
            if (overwrite && overwrite.deny.has('SendMessages')) {
                const alreadyEmbed = new EmbedBuilder()
                    .setColor('#ffa502')
                    .setTitle('🔒 Canal já está travado')
                    .setDescription('Este canal já está travado para mensagens.')
                    .setTimestamp();
                return interaction.reply({ embeds: [alreadyEmbed], ephemeral: true });
            }

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('🔒・Confirmação de Travamento')
                .setDescription(`Você está prestes a travar o canal ${channel}.

${'🔹'} **Motivo:** ${reason}
${'⚠️'} Ninguém poderá enviar mensagens até destravar.`)
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_lock')
                        .setLabel('🟢 Confirmar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_lock')
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

                if (i.customId === 'confirm_lock') {
                    try {
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                            SendMessages: false
                        }, { reason: `${interaction.user.tag}: ${reason}` });

                        // Salvar log no banco
                        const db = new Database();
                        await db.addModLog('lock', interaction.user.id, channel.id, reason, interaction.user.id, interaction.guild.id);

                        // Embed de sucesso
                        const successEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('🔒・Canal Travado com Sucesso!')
                            .setDescription(`🔒 ${channel} foi travado!

${'🔹'} **Motivo:** ${reason}`)
                            .addFields(
                                { name: '📝 Canal', value: `${channel} (${channel.id})`, inline: true },
                                { name: '👮‍♂️ Travado por', value: `${interaction.user}`, inline: true },
                                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                            )
                            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                            .setTimestamp()
                            .setFooter({ text: 'Lonex ・ Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                        await i.update({ embeds: [successEmbed], components: [] });

                        // Mensagem no canal travado
                        const lockEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('🔒・Canal Travado')
                            .setDescription('🔒 Este canal foi travado temporariamente. Aguarde um moderador destravar.')
                            .addFields(
                                { name: '👮‍♂️ Travado por', value: `${interaction.user}`, inline: true },
                                { name: '📝 Motivo', value: reason, inline: true }
                            )
                            .setTimestamp();
                        await channel.send({ embeds: [lockEmbed] });

                        // Log no canal de logs
                        const config = await db.getGuildConfig(interaction.guild.id);
                        if (config?.log_channel_id) {
                            const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                            if (logChannel) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor('#ff4757')
                                    .setTitle('🔒・Log de Travamento')
                                    .setDescription(`🔒 Um canal foi travado no servidor.`)
                                    .addFields(
                                        { name: '📝 Canal', value: `${channel} (${channel.id})`, inline: true },
                                        { name: '👮‍♂️ Travado por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
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
                        console.error('Erro ao travar canal:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('❌ Erro')
                            .setDescription('Ocorreu um erro ao travar o canal.')
                            .setTimestamp();
                        await i.update({ embeds: [errorEmbed], components: [] });
                    }
                } else if (i.customId === 'cancel_lock') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('🔴・Ação Cancelada')
                        .setDescription('O travamento foi cancelado.')
                        .setTimestamp();
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('⏰・Tempo Expirado')
                        .setDescription('O tempo para confirmar o travamento expirou.')
                        .setTimestamp();
                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });

        } catch (error) {
            console.error('Erro no comando lock:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao executar o comando.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 