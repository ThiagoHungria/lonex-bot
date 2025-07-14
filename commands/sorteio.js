const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sorteio')
        .setDescription('🎉 Cria um sorteio interativo')
        .addStringOption(option =>
            option.setName('premio')
                .setDescription('O que será sorteado')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('vencedores')
                .setDescription('Número de vencedores (1-10)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addStringOption(option =>
            option.setName('duracao')
                .setDescription('Duração do sorteio (ex: 1h, 30m, 1d)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('requisitos')
                .setDescription('Requisitos para participar')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            const prize = interaction.options.getString('premio');
            const winners = interaction.options.getInteger('vencedores');
            const durationStr = interaction.options.getString('duracao');
            const requirements = interaction.options.getString('requisitos') || 'Nenhum requisito especial';

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

            // Criar embed do sorteio
            const embed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('🎉 SORTEIO!')
                .setDescription(`**${prize}**`)
                .addFields([
                    { name: '🏆 Vencedores', value: `${winners} vencedor(es)`, inline: true },
                    { name: '⏰ Termina em', value: `<t:${endTimeFormatted}:F>\n(<t:${endTimeFormatted}:R>)`, inline: true },
                    { name: '👥 Participantes', value: '0 participantes', inline: true },
                    { name: '📋 Requisitos', value: requirements, inline: false }
                ])
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Sorteio criado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            // Botões do sorteio
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('join_giveaway')
                        .setLabel('🎉 Participar')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('leave_giveaway')
                        .setLabel('❌ Sair')
                        .setStyle(ButtonStyle.Secondary)
                );

            const response = await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

            // Armazenar dados do sorteio (em produção, use um banco de dados)
            const giveawayData = {
                messageId: response.id,
                channelId: interaction.channel.id,
                guildId: interaction.guild.id,
                prize: prize,
                winners: winners,
                endTime: endTime,
                requirements: requirements,
                participants: [],
                ended: false
            };

            // Simular armazenamento (em produção, salve no banco de dados)
            global.giveaways = global.giveaways || new Map();
            global.giveaways.set(response.id, giveawayData);

            // Configurar timer para finalizar o sorteio
            setTimeout(() => {
                endGiveaway(response.id);
            }, duration);

        } catch (error) {
            console.error('Erro ao criar sorteio:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao criar o sorteio.')
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

async function endGiveaway(messageId) {
    try {
        const giveaway = global.giveaways.get(messageId);
        if (!giveaway || giveaway.ended) return;

        giveaway.ended = true;
        global.giveaways.set(messageId, giveaway);

        const channel = await global.client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(messageId);

        if (!message) return;

        // Selecionar vencedores
        const participants = giveaway.participants;
        const winners = [];
        
        for (let i = 0; i < Math.min(giveaway.winners, participants.length); i++) {
            const randomIndex = Math.floor(Math.random() * participants.length);
            winners.push(participants[randomIndex]);
            participants.splice(randomIndex, 1);
        }

        // Criar embed de resultado
        const resultEmbed = new EmbedBuilder()
            .setColor(winners.length > 0 ? '#2ed573' : '#ff4757')
            .setTitle('🎉 SORTEIO FINALIZADO!')
            .setDescription(`**${giveaway.prize}**`)
            .addFields([
                { name: '🏆 Vencedores', value: winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'Nenhum participante', inline: false },
                { name: '👥 Participantes', value: `${giveaway.participants.length + winners.length} participantes`, inline: true },
                { name: '📋 Requisitos', value: giveaway.requirements, inline: true }
            ])
            .setThumbnail(channel.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'Lonex - Sistema de Sorteios', iconURL: global.client.user.displayAvatarURL({ dynamic: true }) });

        // Botão desabilitado
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_giveaway')
                    .setLabel('🎉 Sorteio Finalizado')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        await message.edit({ embeds: [resultEmbed], components: [disabledRow] });

        // Anunciar vencedores
        if (winners.length > 0) {
            const announcementEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('🎉 PARABÉNS!')
                .setDescription(`**${winners.map(id => `<@${id}>`).join(', ')}**\n\nVocê(s) ganhou(aram): **${giveaway.prize}**!`)
                .setTimestamp();

            await channel.send({ 
                content: winners.map(id => `<@${id}>`).join(', '),
                embeds: [announcementEmbed] 
            });
        }

    } catch (error) {
        console.error('Erro ao finalizar sorteio:', error);
    }
}

// Event handler para botões do sorteio
module.exports.handleButton = async (interaction) => {
    if (!interaction.isButton()) return;

    const giveaway = global.giveaways.get(interaction.message.id);
    if (!giveaway) return;

    if (interaction.customId === 'join_giveaway') {
        if (giveaway.ended) {
            return interaction.reply({ content: '❌ Este sorteio já foi finalizado.', ephemeral: true });
        }

        const userId = interaction.user.id;
        const participants = giveaway.participants;

        if (participants.includes(userId)) {
            return interaction.reply({ content: '❌ Você já está participando deste sorteio!', ephemeral: true });
        }

        participants.push(userId);
        giveaway.participants = participants;
        global.giveaways.set(interaction.message.id, giveaway);

        // Atualizar embed
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        embed.fields[2].value = `${participants.length} participantes`;

        await interaction.message.edit({ embeds: [embed] });
        await interaction.reply({ content: '✅ Você entrou no sorteio! Boa sorte!', ephemeral: true });

    } else if (interaction.customId === 'leave_giveaway') {
        if (giveaway.ended) {
            return interaction.reply({ content: '❌ Este sorteio já foi finalizado.', ephemeral: true });
        }

        const userId = interaction.user.id;
        const participants = giveaway.participants;

        if (!participants.includes(userId)) {
            return interaction.reply({ content: '❌ Você não está participando deste sorteio!', ephemeral: true });
        }

        const index = participants.indexOf(userId);
        participants.splice(index, 1);
        giveaway.participants = participants;
        global.giveaways.set(interaction.message.id, giveaway);

        // Atualizar embed
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        embed.fields[2].value = `${participants.length} participantes`;

        await interaction.message.edit({ embeds: [embed] });
        await interaction.reply({ content: '✅ Você saiu do sorteio.', ephemeral: true });
    }
}; 