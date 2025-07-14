const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('🏳️ Mostra o banner do servidor em alta qualidade'),

    async execute(interaction) {
        try {
            const guild = interaction.guild;

            // Verificar se o servidor tem banner
            if (!guild.bannerURL()) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Sem Banner')
                    .setDescription('Este servidor não possui um banner definido.')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // URLs para diferentes tamanhos
            const bannerURL = guild.bannerURL({ size: 1024 });
            const pngURL = guild.bannerURL({ size: 1024, format: 'png' });
            const jpgURL = guild.bannerURL({ size: 1024, format: 'jpg' });
            const webpURL = guild.bannerURL({ size: 1024, format: 'webp' });

            // Criar embed do banner
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle(`🏳️ Banner de ${guild.name}`)
                .setDescription(`Banner do servidor **${guild.name}** em alta qualidade.`)
                .addFields([
                    { name: '🏠 Servidor', value: `${guild.name} (${guild.id})`, inline: true },
                    { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: '👥 Membros', value: `${guild.memberCount}`, inline: true }
                ])
                .setImage(bannerURL)
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
                        .setURL(bannerURL)
                        .setStyle(ButtonStyle.Link)
                );

            await interaction.reply({ 
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Erro ao mostrar banner do servidor:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao mostrar o banner do servidor.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 