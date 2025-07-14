const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servericon')
        .setDescription('🖼️ Mostra o ícone do servidor em alta qualidade'),

    async execute(interaction) {
        try {
            const guild = interaction.guild;

            // Verificar se o servidor tem ícone
            if (!guild.iconURL()) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Sem Ícone')
                    .setDescription('Este servidor não possui um ícone definido.')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // URLs para diferentes tamanhos
            const iconURL = guild.iconURL({ dynamic: true, size: 1024 });
            const pngURL = guild.iconURL({ size: 1024, format: 'png' });
            const jpgURL = guild.iconURL({ size: 1024, format: 'jpg' });
            const webpURL = guild.iconURL({ size: 1024, format: 'webp' });

            // Criar embed do ícone
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle(`🖼️ Ícone de ${guild.name}`)
                .setDescription(`Ícone do servidor **${guild.name}** em alta qualidade.`)
                .addFields([
                    { name: '🏠 Servidor', value: `${guild.name} (${guild.id})`, inline: true },
                    { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: '👥 Membros', value: `${guild.memberCount}`, inline: true }
                ])
                .setImage(iconURL)
                .setThumbnail(guild.iconURL({ dynamic: true, size: 128 }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Informações', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            // Botões para diferentes formatos
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('PNG')
                        .setURL(pngURL)
                        .setStyle(ButtonStyle.Link),
                    new ButtonBuilder()
                        .setLabel('JPG')
                        .setURL(jpgURL)
                        .setStyle(ButtonStyle.Link),
                    new ButtonBuilder()
                        .setLabel('WEBP')
                        .setURL(webpURL)
                        .setStyle(ButtonStyle.Link),
                    new ButtonBuilder()
                        .setLabel('Original')
                        .setURL(iconURL)
                        .setStyle(ButtonStyle.Link)
                );

            await interaction.reply({ 
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Erro ao mostrar ícone do servidor:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao mostrar o ícone do servidor.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 