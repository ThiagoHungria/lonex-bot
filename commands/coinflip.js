const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('🪙 Joga cara ou coroa'),

    async execute(interaction) {
        try {
            // Simular lançamento da moeda
            const result = Math.random() < 0.5 ? 'cara' : 'coroa';
            const emoji = result === 'cara' ? '🪙' : '🪙';
            const color = result === 'cara' ? '#f39c12' : '#e74c3c';

            // Criar embed do resultado
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🪙 Cara ou Coroa')
                .setDescription(`**${emoji} ${result.toUpperCase()}!**`)
                .addFields([
                    { name: '🎲 Resultado', value: result === 'cara' ? 'Cara (🪙)' : 'Coroa (🪙)', inline: true },
                    { name: '👤 Jogador', value: `${interaction.user}`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                ])
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Jogos', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao jogar cara ou coroa:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao jogar cara ou coroa.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 