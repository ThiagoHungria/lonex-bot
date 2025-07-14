const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Database = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('⚠️ Avisa um usuário')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário a ser avisado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do aviso')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado';

            // Verificar se o usuário pode ser avisado
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
                    .setDescription('Você não pode avisar a si mesmo.')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (!member.moderatable) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Erro')
                    .setDescription('Não posso avisar este usuário. Verifique minhas permissões.')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Salvar aviso no banco de dados
            const db = new Database();
            await db.addWarn(user.id, interaction.guild.id, interaction.user.id, reason);
            await db.addModLog('warn', user.id, null, reason, interaction.user.id, interaction.guild.id);

            // Buscar total de avisos do usuário
            const warns = await db.getWarns(user.id, interaction.guild.id);

            // Criar embed de sucesso
            const embed = new EmbedBuilder()
                .setColor('#ffa502')
                .setTitle('⚠️ Usuário Avisado com Sucesso!')
                .setDescription(`**${user.tag}** foi avisado.`)
                .addFields([
                    { name: '👤 Usuário Avisado', value: `${user} (${user.id})`, inline: true },
                    { name: '👮‍♂️ Avisado por', value: `${interaction.user}`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false },
                    { name: '⚠️ Total de Avisos', value: `${warns.length} aviso(s)`, inline: true }
                ])
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [embed] });

            // Enviar para canal de logs se configurado
            const config = await db.getGuildConfig(interaction.guild.id);
            if (config?.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#ffa502')
                        .setTitle('⚠️ Log de Aviso')
                        .setDescription(`Um usuário foi avisado no servidor.`)
                        .addFields([
                            { name: '👤 Usuário Avisado', value: `${user} (${user.id})`, inline: true },
                            { name: '👮‍♂️ Avisado por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
                            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                            { name: '📝 Motivo', value: reason, inline: false },
                            { name: '⚠️ Total de Avisos', value: `${warns.length} aviso(s)`, inline: true }
                        ])
                        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: 'Lonex - Sistema de Logs', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erro ao avisar usuário:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao avisar o usuário.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 