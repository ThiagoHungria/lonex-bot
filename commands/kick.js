const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../config/database');
const EmbedUtils = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 Expulsa um usuário do servidor')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário a ser expulso')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo da expulsão')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado';

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ffa502')
                .setTitle('👢・Confirmação de Expulsão')
                .setDescription(`Você está prestes a expulsar **${user.tag}** do servidor.\n\n🔹 **Motivo:** ${reason}\n⚠️ O usuário poderá reentrar no servidor se tiver um convite válido.`)
                .addFields(
                    { name: '👤 Usuário', value: `${user} (${user.id})`, inline: true },
                    { name: '📝 Motivo', value: reason, inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            // Botões de confirmação
            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_kick')
                        .setLabel('🟢 Confirmar')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_kick')
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

                if (i.customId === 'confirm_kick') {
                    try {
                        // Verificar se o usuário pode ser expulso
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
                                .setDescription('Você não pode expulsar a si mesmo.')
                                .setTimestamp();
                            
                            return i.update({ embeds: [errorEmbed], components: [] });
                        }

                        if (!member.kickable) {
                            const errorEmbed = new EmbedBuilder()
                                .setColor('#ff4757')
                                .setTitle('❌ Erro')
                                .setDescription('Não posso expulsar este usuário. Verifique minhas permissões.')
                                .setTimestamp();
                            
                            return i.update({ embeds: [errorEmbed], components: [] });
                        }

                        // Expulsar o usuário
                        await member.kick(`${interaction.user.tag}: ${reason}`);

                        // Salvar no banco de dados
                        const db = new Database();
                        await db.addModLog('kick', user.id, null, reason, interaction.user.id, interaction.guild.id);

                        // Embed de sucesso
                        const successEmbed = new EmbedBuilder()
                            .setColor('#2ed573')
                            .setTitle('👢・Usuário Expulso com Sucesso!')
                            .setDescription(`👢 **${user.tag}** foi expulso do servidor.\n\n🔹 **Motivo:** ${reason}`)
                            .addFields(
                                { name: '👤 Usuário Expulso', value: `${user} (${user.id})`, inline: true },
                                { name: '👮‍♂️ Expulso por', value: `${interaction.user}`, inline: true },
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
                                    .setColor('#ffa502')
                                    .setTitle('👢・Log de Expulsão')
                                    .setDescription('👢 Um usuário foi expulso do servidor.')
                                    .addFields(
                                        { name: '👤 Usuário Expulso', value: `${user} (${user.id})`, inline: true },
                                        { name: '👮‍♂️ Expulso por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
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
                        console.error('Erro ao expulsar usuário:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('❌ Erro')
                            .setDescription('Ocorreu um erro ao expulsar o usuário.')
                            .setTimestamp();
                        
                        await i.update({ embeds: [errorEmbed], components: [] });
                    }
                } else if (i.customId === 'cancel_kick') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('🔴・Ação Cancelada')
                        .setDescription('A expulsão foi cancelada.')
                        .setTimestamp();
                    
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#747d8c')
                        .setTitle('⏰・Tempo Expirado')
                        .setDescription('O tempo para confirmar a expulsão expirou.')
                        .setTimestamp();
                    
                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });

        } catch (error) {
            console.error('Erro no comando kick:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao executar o comando.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 