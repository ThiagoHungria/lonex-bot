const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Define modo lento')
        .addIntegerOption(option =>
            option.setName('segundos')
                .setDescription('Tempo em segundos (0 para desativar)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal para aplicar o modo lento')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo para definir modo lento')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const seconds = interaction.options.getInteger('segundos');
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

            // Definir modo lento
            await channel.setRateLimitPerUser(seconds, `${interaction.user.tag}: ${reason}`);

            // Formatar tempo
            const timeText = seconds === 0 ? 'Desativado' : formatTime(seconds);

            // Criar embed de sucesso
            const embed = new EmbedBuilder()
                .setColor(seconds === 0 ? '#2ed573' : '#ffa502')
                .setTitle('🐌 Modo Lento Configurado!')
                .setDescription(`**${channel}** teve seu modo lento configurado.`)
                .addFields([
                    { name: '📝 Canal', value: `${channel} (${channel.id})`, inline: true },
                    { name: '👮‍♂️ Configurado por', value: `${interaction.user}`, inline: true },
                    { name: '⏱️ Tempo', value: timeText, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false }
                ])
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Moderação', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [embed] });

            // Enviar mensagem no canal se modo lento foi ativado
            if (seconds > 0) {
                const slowmodeEmbed = new EmbedBuilder()
                    .setColor('#ffa502')
                    .setTitle('🐌 Modo Lento Ativado')
                    .setDescription(`Este canal agora tem modo lento de **${timeText}**.`)
                    .addFields([
                        { name: '👮‍♂️ Ativado por', value: `${interaction.user}`, inline: true },
                        { name: '📝 Motivo', value: reason, inline: true }
                    ])
                    .setTimestamp();

                await channel.send({ embeds: [slowmodeEmbed] });
            }

        } catch (error) {
            console.error('Erro ao configurar modo lento:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao configurar o modo lento.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

function formatTime(seconds) {
    if (seconds === 0) return 'Desativado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0 || result === '') result += `${secs}s`;
    
    return result.trim();
} 