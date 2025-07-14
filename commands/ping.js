const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Mostra a latência do bot'),

    async execute(interaction) {
        try {
            const sent = await interaction.reply({ 
                content: '🏓 Calculando ping...', 
                fetchReply: true 
            });

            const apiLatency = Math.round(interaction.client.ws.ping);
            const botLatency = sent.createdTimestamp - interaction.createdTimestamp;

            // Determinar cor baseada na latência
            let color, status;
            if (apiLatency < 100) {
                color = '#2ed573';
                status = '🟢 Excelente';
            } else if (apiLatency < 200) {
                color = '#ffa502';
                status = '🟡 Boa';
            } else {
                color = '#ff4757';
                status = '🔴 Lenta';
            }

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🏓 Status de Latência')
                .setDescription(`**Lonex** está funcionando perfeitamente!`)
                .addFields([
                    { name: '📡 Latência da API', value: `${apiLatency}ms`, inline: true },
                    { name: '⏱️ Latência do Bot', value: `${botLatency}ms`, inline: true },
                    { name: '📊 Status', value: status, inline: true },
                    { name: '🖥️ Uptime', value: formatUptime(interaction.client.uptime), inline: true },
                    { name: '👥 Servidores', value: `${interaction.client.guilds.cache.size}`, inline: true },
                    { name: '👤 Usuários', value: `${interaction.client.users.cache.size}`, inline: true }
                ])
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Status', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            await interaction.editReply({ content: null, embeds: [embed] });

        } catch (error) {
            console.error('Erro ao calcular ping:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao calcular a latência.')
                .setTimestamp();
            
            await interaction.editReply({ content: null, embeds: [errorEmbed] });
        }
    }
};

function formatUptime(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
} 