const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Database = require('../config/database');
const EmbedUtils = require('../utils/embeds');
const logger = require('../utils/logger');
const { canUseCommand } = require('../utils/permission');
const feedback = require('../utils/feedback');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🧹 Limpa mensagens do canal')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de mensagens a deletar')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Limpar mensagens apenas deste usuário')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!(await canUseCommand(interaction, 'clear'))) {
            return interaction.reply({ embeds: [feedback.acessoNegado()], ephemeral: true });
        }
        try {
            logger.info(`[CLEAR] Comando executado por ${interaction.user.tag} (${interaction.user.id}) no servidor ${interaction.guild?.name || 'DM'} (${interaction.guild?.id || 'DM'})`);
            const amount = interaction.options.getInteger('quantidade');
            const user = interaction.options.getUser('usuario');

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🧹 Confirmação de Limpeza')
                .setDescription(`Você está prestes a deletar mensagens do canal.`)
                .addFields(
                    { name: '📊 Quantidade', value: `${amount} mensagens`, inline: true },
                    { name: '👤 Filtro', value: user ? `${user.tag}` : 'Todas as mensagens', inline: true },
                    { name: '📝 Canal', value: `${interaction.channel}`, inline: true },
                    { name: '⚠️ Aviso', value: 'Esta ação não pode ser desfeita.', inline: false }
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            // Deferir resposta para dar tempo de deletar as mensagens
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ embeds: [confirmEmbed] });

            // Buscar mensagens
            let messages;
            if (user) {
                messages = await interaction.channel.messages.fetch({ limit: 100 });
                messages = messages.filter(msg => msg.author.id === user.id);
                messages = messages.first(amount);
            } else {
                messages = await interaction.channel.messages.fetch({ limit: amount });
            }

            if (messages.size === 0) {
                const noMessagesEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Nenhuma Mensagem Encontrada')
                    .setDescription('Não foram encontradas mensagens para deletar.')
                    .addFields(
                        { name: '🔍 Filtro Aplicado', value: user ? `Mensagens de ${user.tag}` : 'Todas as mensagens', inline: true },
                        { name: '📊 Quantidade Solicitada', value: `${amount} mensagens`, inline: true }
                    )
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [noMessagesEmbed] });
            }

            // Deletar mensagens
            const deletedMessages = await interaction.channel.bulkDelete(messages, true);

            // Salvar no banco de dados
            const db = new Database();
            await db.addModLog('clear', interaction.user.id, null, `${deletedMessages.size} mensagens deletadas`, interaction.user.id, interaction.guild.id);

            // Embed de sucesso
            const successEmbed = new EmbedBuilder()
                .setColor('#2ed573')
                .setTitle('🧹 Limpeza Concluída com Sucesso!')
                .setDescription(`**${deletedMessages.size}** mensagens foram deletadas do canal.`)
                .addFields(
                    { name: '📊 Mensagens Deletadas', value: `${deletedMessages.size}`, inline: true },
                    { name: '👤 Filtro Aplicado', value: user ? `${user.tag}` : 'Todas as mensagens', inline: true },
                    { name: '📝 Canal', value: `${interaction.channel}`, inline: true },
                    { name: '👮‍♂️ Limpo por', value: `${interaction.user}`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });
            
            await interaction.editReply({ embeds: [successEmbed] });

            // Enviar para canal de logs se configurado
            const config = await db.getGuildConfig(interaction.guild.id);
            if (config?.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setTitle('🧹 Log de Limpeza')
                        .setDescription(`Mensagens foram deletadas de um canal.`)
                        .addFields(
                            { name: '📊 Mensagens Deletadas', value: `${deletedMessages.size}`, inline: true },
                            { name: '👤 Filtro Aplicado', value: user ? `${user.tag} (${user.id})` : 'Todas as mensagens', inline: true },
                            { name: '📝 Canal', value: `${interaction.channel} (${interaction.channel.id})`, inline: true },
                            { name: '👮‍♂️ Limpo por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
                            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        )
                        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: 'Lonex - Sistema de Logs', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            logger.error(`[CLEAR] Erro ao executar clear: ${error}`);
            console.error('Erro ao limpar mensagens:', error);
            return interaction.reply({ embeds: [feedback.erro('Ocorreu um erro ao limpar as mensagens.')], ephemeral: true });
        }
    }
}; 