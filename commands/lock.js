const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../config/database');
const logger = require('../utils/logger');
const { canUseCommand } = require('../utils/permission');
const feedback = require('../utils/feedback');

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
        if (!(await canUseCommand(interaction, 'lock'))) {
            return interaction.reply({ embeds: [feedback.acessoNegado()], ephemeral: true });
        }
        try {
            logger.info(`[LOCK] Comando executado por ${interaction.user.tag} (${interaction.user.id}) no servidor ${interaction.guild?.name || 'DM'} (${interaction.guild?.id || 'DM'})`);
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
                            .setDescription(`🔒 ${channel} foi travado!\n\n🔹 **Motivo:** ${reason}`)
                            .setTimestamp()
                            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

                        return interaction.followUp({ embeds: [successEmbed], ephemeral: true });
                    } catch (error) {
                        logger.error(`[LOCK] Erro ao travar canal: ${error.message}`);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff4757')
                            .setTitle('❌ Erro ao Travar Canal')
                            .setDescription('Ocorreu um erro ao tentar travar o canal.');
                        return interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                    }
                }

                if (i.customId === 'cancel_lock') {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#ff4757')
                        .setTitle('🔴・Travamento Cancelado')
                        .setDescription('Travamento do canal cancelado pelo usuário.');
                    return interaction.followUp({ embeds: [cancelEmbed], ephemeral: true });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#ff4757')
                        .setTitle('⚠️・Travamento Expirado')
                        .setDescription('Travamento do canal não foi confirmado dentro do tempo limite.');
                    return interaction.followUp({ embeds: [timeoutEmbed], ephemeral: true });
                }
            });
        } catch (error) {
            logger.error(`[LOCK] Erro inesperado: ${error.message}`);
            return interaction.reply({ embeds: [feedback.erro('Ocorreu um erro inesperado ao tentar travar o canal.')], ephemeral: true });
        }
    },
};