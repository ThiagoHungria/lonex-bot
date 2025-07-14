const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('🔮 Pergunta para a bola 8 mágica')
        .addStringOption(option =>
            option.setName('pergunta')
                .setDescription('Sua pergunta para a bola 8')
                .setRequired(true)),

    async execute(interaction) {
        try {
            logger.info(`[8BALL] Comando executado por ${interaction.user.tag} (${interaction.user.id}) no servidor ${interaction.guild?.name || 'DM'} (${interaction.guild?.id || 'DM'})`);
            const question = interaction.options.getString('pergunta');

            // Respostas da bola 8 mágica
            const responses = {
                positive: [
                    'É certo.',
                    'É decididamente assim.',
                    'Sem dúvida.',
                    'Sim, definitivamente.',
                    'Você pode contar com isso.',
                    'Como eu vejo, sim.',
                    'Muito provavelmente.',
                    'Perspectiva boa.',
                    'Sim.',
                    'Sinais apontam para sim.'
                ],
                negative: [
                    'Não conte com isso.',
                    'Minha resposta é não.',
                    'Minhas fontes dizem não.',
                    'Perspectiva não muito boa.',
                    'Muito duvidoso.'
                ],
                neutral: [
                    'Resposta nebulosa, tente novamente.',
                    'Pergunte novamente mais tarde.',
                    'Melhor não te dizer agora.',
                    'Não posso prever agora.',
                    'Concentre-se e pergunte novamente.'
                ]
            };

            // Escolher categoria de resposta
            const random = Math.random();
            let category, color;

            if (random < 0.4) {
                category = 'positive';
                color = '#2ed573';
            } else if (random < 0.7) {
                category = 'negative';
                color = '#ff4757';
            } else {
                category = 'neutral';
                color = '#747d8c';
            }

            // Escolher resposta aleatória
            const response = responses[category][Math.floor(Math.random() * responses[category].length)];

            // Criar embed da resposta
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🔮 Bola 8 Mágica')
                .setDescription(`**${response}**`)
                .addFields([
                    { name: '❓ Sua Pergunta', value: question, inline: false },
                    { name: '🔮 Resposta', value: response, inline: false },
                    { name: '👤 Perguntou', value: `${interaction.user}`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                ])
                .setThumbnail('https://cdn.discordapp.com/emojis/1234567890.png') // Emoji da bola 8
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Jogos', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            logger.error(`[8BALL] Erro ao executar 8ball: ${error}`);
            console.error('Erro ao consultar bola 8:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao consultar a bola 8 mágica.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 