const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../config/database');
const EmbedUtils = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 Bane um usuário do servidor permanentemente')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário a ser banido')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do banimento')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dias')
                .setDescription('Número de dias de mensagens para deletar (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado';
            const deleteMessageDays = interaction.options.getInteger('dias') || 0;

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🔨・Confirmação de Banimento')
                .setDescription(`Você está prestes a banir **${user.tag}** do servidor.\n\n🔹 **Motivo:** ${reason}\n⚠️ Esta ação é **permanente** e não pode ser desfeita facilmente.`)
                .addFields(
                    { name: '👤 Usuário', value: `${user} (${user.id})`, inline: true },
                    { name: '📝 Motivo', value: reason, inline: true },
                    { name: '🗑️ Deletar mensagens', value: `${deleteMessageDays} dias`, inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            // Botões de confirmação
            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_ban')
                        .setLabel('🟢 Confirmar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_ban')
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

                if (i.customId === 'confirm_ban') {
                    try {
                        // Verificar se o usuário pode ser banido
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
                                .setDescription('Você não pode banir a si mesmo.')
                                .setTimestamp();
                            
                            return i.update({ embeds: [errorEmbed], components: [] });
                        }

                        if (!member.bannable) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#ff4757')
                                .setTitle('❌ Erro')
                                .setDescription('Não posso banir este usuário. Verifique minhas permissões.')
                                .setTimestamp();
                            
                            return i.update({ embeds: [errorEmbed], components: [] });
                        }

                        // Banir o usuário
                        await member.ban({
                            reason: `${interaction.user.tag}: ${reason}`,
                            deleteMessageDays: deleteMessageDays
                        });

                        // Salvar no banco de dados
                        const db = new Database();
                        await db.addModLog('ban', user.id, null, reason, interaction.user.id, interaction.guild.id);

                        // Embed de sucesso
                        const successEmbed = new EmbedBuilder()
                            .setColor('#2ed573')
                            .setTitle('🔨・Usuário Banido com Sucesso!')
                            .setDescription(`🔨 **${user.tag}** foi banido permanentemente do servidor.\n\n🔹 **Motivo:** ${reason}`)
                            .addFields(
                                { name: '👤 Usuário Banido', value: `${user} (${user.id})`, inline: true },
                                { name: '👮‍♂️ Banido por', value: `${interaction.user}`, inline: true },
                                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                                { name: '🗑️ Mensagens Deletadas', value: `${deleteMessageDays} dias`, inline: true }
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
                                    .setColor('#ff6b6b')
                                    .setTitle('🔨・Log de Banimento')
                                    .setDescription('🔨 Um usuário foi banido do servidor.')
                                    .addFields(
                                        { name: '👤 Usuário Banido', value: `${user} (${user.id})`, inline: true },
                                        { name: '👮‍♂️ Banido por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
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
                        console.error('Erro ao banir usuário:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('❌ Erro')
                            .setDescription('Ocorreu um erro ao banir o usuário.')
                            .setTimestamp();
                        
                        await i.update({ embeds: [errorEmbed], components: [] });
                    }
                } else if (i.customId === 'cancel_ban') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('🔴・Ação Cancelada')
                        .setDescription('O banimento foi cancelado.')
                        .setTimestamp();
                    
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('⏰・Tempo Expirado')
                        .setDescription('O tempo para confirmar o banimento expirou.')
                        .setTimestamp();
                    
                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });

        } catch (error) {
            console.error('Erro no comando ban:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao executar o comando.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 