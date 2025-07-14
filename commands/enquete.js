const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enquete')
        .setDescription('📊 Cria uma enquete interativa')
        .addStringOption(option =>
            option.setName('pergunta')
                .setDescription('A pergunta da enquete')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('opcoes')
                .setDescription('Opções separadas por vírgula (ex: Sim,Não,Talvez)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('duracao')
                .setDescription('Duração da enquete (ex: 1h, 30m, 1d)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            logger.info(`[ENQUETE] Comando executado por ${interaction.user.tag} (${interaction.user.id}) no servidor ${interaction.guild?.name || 'DM'} (${interaction.guild?.id || 'DM'})`);
            const question = interaction.options.getString('pergunta');
            const optionsStr = interaction.options.getString('opcoes');
            const durationStr = interaction.options.getString('duracao');

            // Converter duração para milissegundos
            let duration = 24 * 60 * 60 * 1000; // 24 horas padrão
            if (durationStr) {
                const seconds = parseDuration(durationStr);
                if (seconds === null) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4757')
                        .setTitle('❌ Formato Inválido')
                        .setDescription('Formato de duração inválido. Use: `1h`, `30m`, `1d`, etc.')
                        .addFields(
                            { name: '📝 Exemplos válidos', value: '`30s`, `5m`, `2h`, `1d`', inline: false }
                        )
                        .setTimestamp();
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                duration = seconds * 1000;
            }

            const endTime = Date.now() + duration;
            const endTimeFormatted = Math.floor(endTime / 1000);

            // Processar opções
            let options = ['👍 Sim', '👎 Não'];
            if (optionsStr) {
                options = optionsStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
                if (options.length < 2) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4757')
                        .setTitle('❌ Opções Inválidas')
                        .setDescription('Você precisa fornecer pelo menos 2 opções separadas por vírgula.')
                        .addFields(
                            { name: '📝 Exemplo', value: '`Sim,Não,Talvez`', inline: false }
                        )
                        .setTimestamp();
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                if (options.length > 10) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4757')
                        .setTitle('❌ Muitas Opções')
                        .setDescription('Você pode ter no máximo 10 opções.')
                        .setTimestamp();
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }

            // Criar embed da enquete
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('📊 ENQUETE')
                .setDescription(`**${question}**`)
                .addFields([
                    { name: '⏰ Termina em', value: `<t:${endTimeFormatted}:F>\n(<t:${endTimeFormatted}:R>)`, inline: true },
                    { name: '👥 Votos', value: '0 votos', inline: true },
                    { name: '📋 Opções', value: options.map((opt, index) => `${index + 1}. ${opt}`).join('\n'), inline: false }
                ])
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Enquete criada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            // Criar botões para as opções
            const rows = [];
            const buttonsPerRow = 5;
            for (let i = 0; i < options.length; i += buttonsPerRow) {
                const row = new ActionRowBuilder();
                const rowOptions = options.slice(i, i + buttonsPerRow);
                rowOptions.forEach((option, index) => {
                    const buttonIndex = i + index;
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`poll_${buttonIndex}`)
                            .setLabel(`${buttonIndex + 1}. ${option}`)
                            .setStyle(ButtonStyle.Primary)
                    );
                });
                rows.push(row);
            }

            const response = await interaction.reply({
                embeds: [embed],
                components: rows,
                fetchReply: true
            });

            // Armazenar dados da enquete
            const pollData = {
                messageId: response.id,
                channelId: interaction.channel.id,
                guildId: interaction.guild.id,
                question: question,
                options: options,
                endTime: endTime,
                votes: new Array(options.length).fill(0),
                voters: new Array(options.length).fill().map(() => []),
                ended: false
            };

            global.polls = global.polls || new Map();
            global.polls.set(response.id, pollData);

            // Configurar timer para finalizar a enquete
            setTimeout(() => {
                endPoll(response.id, interaction.client);
            }, duration);

        } catch (error) {
            logger.error(`[ENQUETE] Erro ao criar enquete: ${error}`);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao criar a enquete.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

function parseDuration(durationStr) {
    const regex = /^(\d+)([smhd])$/;
    const match = durationStr.toLowerCase().match(regex);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return null;
    }
}

async function endPoll(messageId, client) {
    try {
        const poll = global.polls.get(messageId);
        if (!poll || poll.ended) return;
        poll.ended = true;
        global.polls.set(messageId, poll);
        const channel = await client.channels.fetch(poll.channelId);
        const message = await channel.messages.fetch(messageId);
        if (!message) return;
        // Calcular resultados
        const totalVotes = poll.votes.reduce((sum, votes) => sum + votes, 0);
        const maxVotes = Math.max(...poll.votes);
        const winners = poll.votes.map((votes, index) => ({ votes, index }))
            .filter(item => item.votes === maxVotes && item.votes > 0)
            .map(item => item.index);
        // Criar embed de resultado
        const resultEmbed = new EmbedBuilder()
            .setColor('#2ed573')
            .setTitle('📊 ENQUETE FINALIZADA!')
            .setDescription(`**${poll.question}**`)
            .addFields([
                { name: '👥 Total de Votos', value: `${totalVotes} votos`, inline: true },
                { name: '🏆 Vencedor(es)', value: winners.length > 0 ? winners.map(i => `${i + 1}. ${poll.options[i]}`).join('\n') : 'Nenhum voto', inline: true }
            ])
            .setThumbnail(channel.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'Lonex - Sistema de Enquetes', iconURL: client.user.displayAvatarURL({ dynamic: true }) });
        // Adicionar resultados detalhados
        const results = poll.options.map((option, index) => {
            const votes = poll.votes[index];
            const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0';
            const bar = createProgressBar(votes, totalVotes);
            return `**${index + 1}. ${option}**\n${bar} ${votes} votos (${percentage}%)`;
        });
        resultEmbed.addFields({ name: '📊 Resultados Detalhados', value: results.join('\n\n'), inline: false });
        // Botões desabilitados
        const disabledRows = [];
        const buttonsPerRow = 5;
        for (let i = 0; i < poll.options.length; i += buttonsPerRow) {
            const row = new ActionRowBuilder();
            const rowOptions = poll.options.slice(i, i + buttonsPerRow);
            rowOptions.forEach((option, index) => {
                const buttonIndex = i + index;
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`poll_${buttonIndex}`)
                        .setLabel(`${buttonIndex + 1}. ${option}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            });
            disabledRows.push(row);
        }
        await message.edit({ embeds: [resultEmbed], components: disabledRows });
    } catch (error) {
        console.error('Erro ao finalizar enquete:', error);
    }
}

function createProgressBar(votes, total) {
    if (total === 0) return '▱▱▱▱▱▱▱▱▱▱';
    const percentage = votes / total;
    const filled = Math.round(percentage * 10);
    const empty = 10 - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

// Event handler para botões da enquete
module.exports.handleButton = async (interaction) => {
    if (!interaction.isButton()) return;
    const poll = global.polls.get(interaction.message.id);
    if (!poll) return;
    if (interaction.customId.startsWith('poll_')) {
        if (poll.ended) {
            return interaction.reply({ content: '❌ Esta enquete já foi finalizada.', ephemeral: true });
        }
        const optionIndex = parseInt(interaction.customId.split('_')[1]);
        const userId = interaction.user.id;
        // Verificar se o usuário já votou
        const userVotedIndex = poll.voters.findIndex(voters => voters.includes(userId));
        if (userVotedIndex !== -1) {
            // Remover voto anterior
            poll.votes[userVotedIndex]--;
            poll.voters[userVotedIndex] = poll.voters[userVotedIndex].filter(id => id !== userId);
        }
        // Adicionar novo voto
        poll.votes[optionIndex]++;
        poll.voters[optionIndex].push(userId);
        global.polls.set(interaction.message.id, poll);
        // Atualizar embed
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        const totalVotes = poll.votes.reduce((sum, votes) => sum + votes, 0);
        embed.fields[1].value = `${totalVotes} votos`;
        await interaction.message.edit({ embeds: [embed] });
        const action = userVotedIndex !== -1 ? 'alterou seu voto para' : 'votou em';
        await interaction.reply({ content: `✅ Você ${action} **${poll.options[optionIndex]}**!`, ephemeral: true });
    }
};