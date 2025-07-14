const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('🖼️ Mostra o avatar de um usuário em alta qualidade')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para ver o avatar')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('usuario') || interaction.user;

            // URLs para diferentes tamanhos
            const avatarURL = user.displayAvatarURL({ size: 1024, dynamic: true });
            const pngURL = user.displayAvatarURL({ size: 1024, format: 'png' });
            const jpgURL = user.displayAvatarURL({ size: 1024, format: 'jpg' });
            const webpURL = user.displayAvatarURL({ size: 1024, format: 'webp' });

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle(`🖼️ Avatar de ${user.tag}`)
                .setDescription(`Avatar de **${user.tag}** em alta qualidade.`)
                .addFields([
                    { name: '👤 Usuário', value: `${user} (${user.id})`, inline: true },
                    { name: '📅 Conta Criada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: '🎨 Formato', value: user.avatar?.startsWith('a_') ? 'GIF' : 'PNG/JPG', inline: true }
                ])
                .setImage(avatarURL)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Avatars', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

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
                        .setURL(avatarURL)
                        .setStyle(ButtonStyle.Link)
                );

            await interaction.reply({ 
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Erro ao mostrar avatar:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao mostrar o avatar.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 