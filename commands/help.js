const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 Mostra a lista de comandos disponíveis')
        .addStringOption(option =>
            option.setName('comando')
                .setDescription('Comando específico para ver mais detalhes')
                .setRequired(false)),

    async execute(interaction) {
        try {
            logger.info(`[HELP] Comando executado por ${interaction.user.tag} (${interaction.user.id}) no servidor ${interaction.guild?.name || 'DM'} (${interaction.guild?.id || 'DM'})`);
            const commandName = interaction.options.getString('comando');

            if (commandName) {
                // Mostrar ajuda específica do comando
                const commandHelp = getCommandHelp(commandName);
                if (commandHelp) {
                    const embed = new EmbedBuilder()
                        .setColor('#3498db')
                        .setTitle(`📖 Ajuda: /${commandName}`)
                        .setDescription(commandHelp.description)
                        .addFields(
                            { name: '🔧 Uso', value: commandHelp.usage, inline: false },
                            { name: '📝 Descrição', value: commandHelp.description, inline: false },
                            { name: '🔑 Permissão', value: commandHelp.permission || 'Nenhuma', inline: true },
                            { name: '💡 Exemplo', value: commandHelp.example, inline: true }
                        )
                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: 'Lonex - Sistema de Ajuda', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                    await interaction.reply({ embeds: [embed] });
                } else {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4757')
                        .setTitle('❌ Comando Não Encontrado')
                        .setDescription(`O comando **/${commandName}** não foi encontrado.`)
                        .addFields(
                            { name: '💡 Dica', value: 'Use `/help` para ver todos os comandos disponíveis.', inline: false }
                        )
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } else {
                // Mostrar lista geral de comandos
                const embed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle('📖 Central de Ajuda - Lonex')
                    .setDescription('Bem-vindo ao sistema de ajuda do **Lonex**! Escolha uma categoria abaixo para ver os comandos disponíveis.')
                    .addFields([
                        { name: '🛡️ Moderação', value: '`/ban`, `/kick`, `/mute`, `/clear`, `/warn`, `/unmute`', inline: true },
                        { name: '📊 Informações', value: '`/userinfo`, `/serverinfo`, `/stats`, `/ping`, `/avatar`', inline: true },
                        { name: '🎮 Diversão', value: '`/sorteio`, `/enquete`, `/coinflip`, `/dice`, `/8ball`', inline: true },
                        { name: '⚙️ Utilitários', value: '`/remind`, `/lock`, `/unlock`, `/slowmode`, `/config`', inline: true },
                        { name: '🔧 Administração', value: '`/roleinfo`, `/servericon`, `/banner`, `/purge`', inline: true }
                    ])
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp()
                    .setFooter({ text: 'Lonex - Sistema de Ajuda', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                // Botões para categorias
                const row1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('help_moderation')
                            .setLabel('🛡️ Moderação')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('help_info')
                            .setLabel('📊 Informações')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('help_fun')
                            .setLabel('🎮 Diversão')
                            .setStyle(ButtonStyle.Primary)
                    );

                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('help_utils')
                            .setLabel('⚙️ Utilitários')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('help_admin')
                            .setLabel('🔧 Administração')
                            .setStyle(ButtonStyle.Primary)
                    );

                const response = await interaction.reply({
                    embeds: [embed],
                    components: [row1, row2],
                    fetchReply: true
                });

                // Coletor de botões
                const collector = response.createMessageComponentCollector({ time: 300000 });

                collector.on('collect', async (i) => {
                    if (i.user.id !== interaction.user.id) {
                        return i.reply({ content: '❌ Apenas quem executou o comando pode usar estes botões.', ephemeral: true });
                    }

                    const categoryEmbeds = {
                        'help_moderation': createModerationEmbed(),
                        'help_info': createInfoEmbed(),
                        'help_fun': createFunEmbed(),
                        'help_utils': createUtilsEmbed(),
                        'help_admin': createAdminEmbed()
                    };

                    const categoryEmbed = categoryEmbeds[i.customId];
                    if (categoryEmbed) {
                        await i.update({ embeds: [categoryEmbed] });
                    }
                });

                collector.on('end', async (collected) => {
                    if (collected.size === 0) {
                        const timeoutEmbed = new EmbedBuilder()
                            .setColor('#747d8c')
                            .setTitle('⏰ Tempo Expirado')
                            .setDescription('O tempo para navegar pela ajuda expirou.')
                            .setTimestamp();
                        
                        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                    }
                });
            }

        } catch (error) {
            logger.error(`[HELP] Erro ao mostrar ajuda: ${error}`);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao mostrar a ajuda.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

function getCommandHelp(commandName) {
    const helpTexts = {
        'ban': {
            usage: '`/ban <usuario> [motivo] [dias]`',
            description: 'Bane um usuário permanentemente do servidor.',
            permission: 'Banir Membros',
            example: '`/ban @usuario Spam 7`'
        },
        'kick': {
            usage: '`/kick <usuario> [motivo]`',
            description: 'Expulsa um usuário do servidor.',
            permission: 'Expulsar Membros',
            example: '`/kick @usuario Comportamento inadequado`'
        },
        'mute': {
            usage: '`/mute <usuario> [duracao] [motivo]`',
            description: 'Silencia um usuário temporariamente.',
            permission: 'Moderar Membros',
            example: '`/mute @usuario 1h Spam`'
        },
        'clear': {
            usage: '`/clear <quantidade> [usuario]`',
            description: 'Deleta mensagens do canal.',
            permission: 'Gerenciar Mensagens',
            example: '`/clear 10 @usuario`'
        },
        'userinfo': {
            usage: '`/userinfo [usuario]`',
            description: 'Mostra informações detalhadas de um usuário.',
            permission: 'Nenhuma',
            example: '`/userinfo @usuario`'
        },
        'serverinfo': {
            usage: '`/serverinfo`',
            description: 'Mostra informações detalhadas do servidor.',
            permission: 'Nenhuma',
            example: '`/serverinfo`'
        },
        'stats': {
            usage: '`/stats`',
            description: 'Mostra estatísticas do servidor.',
            permission: 'Gerenciar Servidor',
            example: '`/stats`'
        },
        'ping': {
            usage: '`/ping`',
            description: 'Mostra a latência do bot.',
            permission: 'Nenhuma',
            example: '`/ping`'
        },
        'avatar': {
            usage: '`/avatar [usuario]`',
            description: 'Mostra o avatar de um usuário em tamanho grande.',
            permission: 'Nenhuma',
            example: '`/avatar @usuario`'
        }
    };

    return helpTexts[commandName] || null;
}

function createModerationEmbed() {
    return new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🛡️ Comandos de Moderação')
        .setDescription('Comandos para moderar o servidor e manter a ordem.')
        .addFields([
            { name: '🔨 /ban', value: 'Bane um usuário permanentemente', inline: true },
            { name: '👢 /kick', value: 'Expulsa um usuário do servidor', inline: true },
            { name: '🔇 /mute', value: 'Silencia um usuário temporariamente', inline: true },
            { name: '🧹 /clear', value: 'Deleta mensagens do canal', inline: true },
            { name: '⚠️ /warn', value: 'Avisa um usuário', inline: true },
            { name: '🔊 /unmute', value: 'Remove o silenciamento de um usuário', inline: true }
        ])
        .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
        .setTimestamp()
        .setFooter({ text: 'Lonex - Sistema de Moderação', iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png' });
}

function createInfoEmbed() {
    return new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📊 Comandos de Informações')
        .setDescription('Comandos para obter informações sobre usuários, servidor e bot.')
        .addFields([
            { name: '👤 /userinfo', value: 'Informações detalhadas de um usuário', inline: true },
            { name: '🏠 /serverinfo', value: 'Informações detalhadas do servidor', inline: true },
            { name: '📈 /stats', value: 'Estatísticas do servidor', inline: true },
            { name: '🏓 /ping', value: 'Latência do bot', inline: true },
            { name: '🖼️ /avatar', value: 'Avatar de um usuário em tamanho grande', inline: true }
        ])
        .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
        .setTimestamp()
        .setFooter({ text: 'Lonex - Sistema de Informações', iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png' });
}

function createFunEmbed() {
    return new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('🎮 Comandos de Diversão')
        .setDescription('Comandos divertidos para entreter os membros.')
        .addFields([
            { name: '🎉 /sorteio', value: 'Cria um sorteio', inline: true },
            { name: '📊 /enquete', value: 'Cria uma enquete', inline: true },
            { name: '🪙 /coinflip', value: 'Cara ou coroa', inline: true },
            { name: '🎲 /dice', value: 'Rola um dado', inline: true },
            { name: '🔮 /8ball', value: 'Bola 8 mágica', inline: true }
        ])
        .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
        .setTimestamp()
        .setFooter({ text: 'Lonex - Sistema de Diversão', iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png' });
}

function createUtilsEmbed() {
    return new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('⚙️ Comandos Utilitários')
        .setDescription('Comandos úteis para o dia a dia.')
        .addFields([
            { name: '⏰ /remind', value: 'Define um lembrete', inline: true },
            { name: '🔒 /lock', value: 'Trava um canal', inline: true },
            { name: '🔓 /unlock', value: 'Destrava um canal', inline: true },
            { name: '🐌 /slowmode', value: 'Define modo lento', inline: true },
            { name: '⚙️ /config', value: 'Configurações do servidor', inline: true }
        ])
        .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
        .setTimestamp()
        .setFooter({ text: 'Lonex - Sistema de Utilitários', iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png' });
}

function createAdminEmbed() {
    return new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('🔧 Comandos de Administração')
        .setDescription('Comandos avançados para administradores.')
        .addFields([
            { name: '🎭 /roleinfo', value: 'Informações de um cargo', inline: true },
            { name: '🖼️ /servericon', value: 'Ícone do servidor', inline: true },
            { name: '🏳️ /banner', value: 'Banner do servidor', inline: true },
            { name: '🗑️ /purge', value: 'Limpeza avançada de mensagens', inline: true }
        ])
        .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png')
        .setTimestamp()
        .setFooter({ text: 'Lonex - Sistema de Administração', iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png' });
} 