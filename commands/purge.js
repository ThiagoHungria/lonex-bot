const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Database = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Limpeza avançada com filtros')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de mensagens a deletar')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Limpar mensagens apenas deste usuário')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('contendo')
                .setDescription('Limpar mensagens contendo esta palavra')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const amount = interaction.options.getInteger('quantidade');
            const type = interaction.options.getString('tipo') || 'all';
            const user = interaction.options.getUser('usuario');
            const contains = interaction.options.getString('contem');

            // Embed de confirmação
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🗑️ Confirmação de Limpeza Avançada')
                .setDescription(`Você está prestes a deletar mensagens do canal.`)
                .addFields([
                    { name: '📊 Quantidade', value: `${amount} mensagens`, inline: true },
                    { name: '📝 Tipo', value: getTypeName(type), inline: true },
                    { name: '👤 Filtro de Usuário', value: user ? `${user.tag}` : 'Todos os usuários', inline: true },
                    { name: '🔍 Filtro de Texto', value: contains ? `"${contains}"` : 'Nenhum', inline: true },
                    { name: '📝 Canal', value: `${interaction.channel}`, inline: true },
                    { name: '⚠️ Aviso', value: 'Esta ação não pode ser desfeita.', inline: false }
                ])
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

            // Deferir resposta para dar tempo de deletar as mensagens
            await interaction.deferReply({ ephemeral: true });

            // Buscar mensagens
            let messages = await interaction.channel.messages.fetch({ limit: 100 });

            // Aplicar filtros
            messages = messages.filter(msg => {
                // Filtro de usuário
                if (user && msg.author.id !== user.id) return false;

                // Filtro de tipo
                if (type !== 'all') {
                    switch (type) {
                        case 'text':
                            if (msg.embeds.length > 0 || msg.attachments.size > 0) return false;
                            break;
                        case 'embeds':
                            if (msg.embeds.length === 0) return false;
                            break;
                        case 'files':
                            if (msg.attachments.size === 0) return false;
                            break;
                        case 'links':
                            if (!msg.content.includes('http')) return false;
                            break;
                        case 'images':
                            const imageAttachments = msg.attachments.filter(att => 
                                att.contentType && att.contentType.startsWith('image/')
                            );
                            if (imageAttachments.size === 0) return false;
                            break;
                        case 'videos':
                            const videoAttachments = msg.attachments.filter(att => 
                                att.contentType && att.contentType.startsWith('video/')
                            );
                            if (videoAttachments.size === 0) return false;
                            break;
                        case 'audio':
                            const audioAttachments = msg.attachments.filter(att => 
                                att.contentType && att.contentType.startsWith('audio/')
                            );
                            if (audioAttachments.size === 0) return false;
                            break;
                    }
                }

                // Filtro de texto
                if (contains && !msg.content.toLowerCase().includes(contains.toLowerCase())) return false;

                return true;
            });

            messages = messages.first(amount);

            if (messages.size === 0) {
                const noMessagesEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Nenhuma Mensagem Encontrada')
                    .setDescription('Não foram encontradas mensagens que atendam aos critérios especificados.')
                    .addFields([
                        { name: '🔍 Filtros Aplicados', value: getFiltersDescription(type, user, contains), inline: false },
                        { name: '📊 Quantidade Solicitada', value: `${amount} mensagens`, inline: true }
                    ])
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [noMessagesEmbed] });
            }

            // Deletar mensagens
            const deletedMessages = await interaction.channel.bulkDelete(messages, true);

            // Salvar no banco de dados
            const db = new Database();
            await db.addModLog('purge', interaction.user.id, null, `${deletedMessages.size} mensagens deletadas (${type})`, interaction.user.id, interaction.guild.id);

            // Criar embed de sucesso
            const successEmbed = new EmbedBuilder()
                .setColor('#2ed573')
                .setTitle('🗑️ Limpeza Avançada Concluída!')
                .setDescription(`**${deletedMessages.size}** mensagens foram deletadas do canal.`)
                .addFields([
                    { name: '📊 Mensagens Deletadas', value: `${deletedMessages.size}`, inline: true },
                    { name: '📝 Tipo', value: getTypeName(type), inline: true },
                    { name: '👤 Filtro de Usuário', value: user ? `${user.tag}` : 'Todos os usuários', inline: true },
                    { name: '🔍 Filtro de Texto', value: contains ? `"${contains}"` : 'Nenhum', inline: true },
                    { name: '📝 Canal', value: `${interaction.channel}`, inline: true },
                    { name: '👮‍♂️ Limpo por', value: `${interaction.user}`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                ])
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
                        .setTitle('🗑️ Log de Limpeza Avançada')
                        .setDescription(`Mensagens foram deletadas de um canal.`)
                        .addFields([
                            { name: '📊 Mensagens Deletadas', value: `${deletedMessages.size}`, inline: true },
                            { name: '📝 Tipo', value: getTypeName(type), inline: true },
                            { name: '👤 Filtro de Usuário', value: user ? `${user.tag} (${user.id})` : 'Todos os usuários', inline: true },
                            { name: '🔍 Filtro de Texto', value: contains ? `"${contains}"` : 'Nenhum', inline: true },
                            { name: '📝 Canal', value: `${interaction.channel} (${interaction.channel.id})`, inline: true },
                            { name: '👮‍♂️ Limpo por', value: `${interaction.user} (${interaction.user.id})`, inline: true },
                            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        ])
                        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: 'Lonex - Sistema de Logs', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erro ao limpar mensagens:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao limpar as mensagens.')
                .addFields(
                    { name: '🔍 Possíveis Causas', value: '• Mensagens muito antigas (14+ dias)\n• Permissões insuficientes\n• Erro de conexão', inline: false }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};

function getTypeName(type) {
    const types = {
        'all': 'Todas',
        'text': 'Apenas texto',
        'embeds': 'Apenas embeds',
        'files': 'Apenas arquivos',
        'links': 'Apenas links',
        'images': 'Apenas imagens',
        'videos': 'Apenas vídeos',
        'audio': 'Apenas áudio'
    };
    return types[type] || 'Todas';
}

function getFiltersDescription(type, user, contains) {
    const filters = [];
    filters.push(`**Tipo:** ${getTypeName(type)}`);
    if (user) filters.push(`**Usuário:** ${user.tag}`);
    if (contains) filters.push(`**Contém:** "${contains}"`);
    return filters.join('\n');
} 