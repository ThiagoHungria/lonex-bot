const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('🎲 Rola um dado')
        .addIntegerOption(option =>
            option.setName('lados')
                .setDescription('Número de lados do dado (2-100)')
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(100))
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de dados para rolar (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    async execute(interaction) {
        try {
            const sides = interaction.options.getInteger('lados') || 6;
            const quantity = interaction.options.getInteger('quantidade') || 1;

            // Rolar os dados
            const results = [];
            let total = 0;

            for (let i = 0; i < quantity; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                results.push(roll);
                total += roll;
            }

            // Criar embed do resultado
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('🎲 Resultado do Dado')
                .setDescription(`**${quantity} dado(s) de ${sides} lados**`)
                .addFields([
                    { name: '🎯 Resultados', value: results.map((r, i) => `Dado ${i + 1}: **${r}**`).join('\n'), inline: true },
                    { name: '📊 Total', value: `**${total}**`, inline: true },
                    { name: '📈 Média', value: `**${(total / quantity).toFixed(1)}**`, inline: true },
                    { name: '👤 Jogador', value: `${interaction.user}`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                ])
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Jogos', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            // Adicionar informações extras para dados especiais
            if (sides === 6 && quantity === 1) {
                const result = results[0];
                let extra = '';
                
                if (result === 1) extra = ' (Pior resultado possível!)';
                else if (result === 6) extra = ' (Melhor resultado possível!)';
                else if (result >= 5) extra = ' (Bom resultado!)';
                else if (result <= 2) extra = ' (Resultado baixo)';
                
                if (extra) {
                    embed.addFields({ name: '💡 Observação', value: extra, inline: false });
                }
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao rolar dado:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao rolar o dado.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 