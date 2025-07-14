const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment');
moment.locale('pt-BR');

class EmbedUtils {
    static createWelcomeEmbed(member) {
        return new EmbedBuilder()
            .setColor(process.env.EMBED_COLOR || '#00FF00')
            .setTitle('🎉 Bem-vindo ao servidor!')
            .setDescription(`Olá ${member}! Seja bem-vindo ao nosso servidor!\n\nEsperamos que você se divirta aqui!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `ID: ${member.user.id}` })
            .setTimestamp();
    }

    static createModLogEmbed(action, user, moderator, reason, duration = null) {
        const colors = {
            'ban': '#FF0000',
            'unban': '#00FF00',
            'kick': '#FFA500',
            'mute': '#FFFF00',
            'unmute': '#00FF00',
            'warn': '#FFA500',
            'clear': '#0099FF'
        };

        const actionNames = {
            'ban': '🔨 Banimento',
            'unban': '✅ Desbanimento',
            'kick': '👢 Expulsão',
            'mute': '🔇 Mute',
            'unmute': '🔊 Unmute',
            'warn': '⚠️ Advertência',
            'clear': '🧹 Limpeza'
        };

        const embed = new EmbedBuilder()
            .setColor(colors[action] || '#FFA500')
            .setTitle(actionNames[action] || action)
            .addFields([
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🛡️ Moderador', value: `${moderator.tag}`, inline: true },
                { name: '📅 Data', value: moment().format('DD/MM/YYYY HH:mm:ss'), inline: true }
            ])
            .setTimestamp();

        if (reason) {
            embed.addFields({ name: '📝 Motivo', value: reason, inline: false });
        }

        if (duration) {
            embed.addFields({ name: '⏱️ Duração', value: this.formatDuration(duration), inline: true });
        }

        return embed;
    }

    static createUserInfoEmbed(user, member, warns = []) {
        const roles = member.roles.cache
            .filter(role => role.id !== member.guild.id)
            .map(role => role.name)
            .join(', ') || 'Nenhuma';

        const embed = new EmbedBuilder()
            .setColor(process.env.EMBED_COLOR || '#00FF00')
            .setTitle(`📊 Informações de ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields([
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '📅 Criado em', value: moment(user.createdAt).format('DD/MM/YYYY HH:mm:ss'), inline: true },
                { name: '📥 Entrou em', value: moment(member.joinedAt).format('DD/MM/YYYY HH:mm:ss'), inline: true },
                { name: '🎭 Cargos', value: roles, inline: false },
                { name: '⚠️ Advertências', value: warns.length.toString(), inline: true }
            ])
            .setTimestamp();

        if (warns.length > 0) {
            const warnList = warns.slice(0, 5).map((warn, index) => 
                `${index + 1}. ${warn.reason} - ${moment(warn.created_at).format('DD/MM/YYYY')}`
            ).join('\n');
            embed.addFields({ name: '📋 Últimas Advertências', value: warnList, inline: false });
        }

        return embed;
    }

    static createServerInfoEmbed(guild) {
        const owner = guild.members.cache.get(guild.ownerId);
        const channels = guild.channels.cache;
        const roles = guild.roles.cache.size;

        const embed = new EmbedBuilder()
            .setColor(process.env.EMBED_COLOR || '#00FF00')
            .setTitle(`📊 Informações do Servidor`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields([
                { name: '🏷️ Nome', value: guild.name, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '👑 Dono', value: owner ? owner.user.tag : 'Desconhecido', inline: true },
                { name: '👥 Membros', value: guild.memberCount.toString(), inline: true },
                { name: '📅 Criado em', value: moment(guild.createdAt).format('DD/MM/YYYY HH:mm:ss'), inline: true },
                { name: '🌍 Região', value: guild.preferredLocale || 'N/A', inline: true },
                { name: '💬 Canais', value: channels.size.toString(), inline: true },
                { name: '🎭 Cargos', value: roles.toString(), inline: true },
                { name: '🔒 Boost', value: `Nível ${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)`, inline: true }
            ])
            .setTimestamp();

        return embed;
    }

    static createStatsEmbed(stats) {
        return new EmbedBuilder()
            .setColor(process.env.EMBED_COLOR || '#00FF00')
            .setTitle('📊 Estatísticas do Servidor')
            .addFields([
                { name: '💬 Total de Mensagens', value: stats.total_messages?.toString() || '0', inline: true },
                { name: '⚡ Total de Comandos', value: stats.total_commands?.toString() || '0', inline: true },
                { name: '👥 Total de Membros', value: stats.total_members?.toString() || '0', inline: true }
            ])
            .setTimestamp();
    }

    static createWarnEmbed(user, moderator, reason) {
        return new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ Advertência')
            .setDescription(`${user} recebeu uma advertência!`)
            .addFields([
                { name: '👤 Usuário', value: user.tag, inline: true },
                { name: '🛡️ Moderador', value: moderator.tag, inline: true },
                { name: '📝 Motivo', value: reason || 'Nenhum motivo especificado', inline: false }
            ])
            .setTimestamp();
    }

    static createClearEmbed(count, moderator) {
        return new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🧹 Limpeza de Mensagens')
            .setDescription(`${count} mensagens foram deletadas!`)
            .addFields([
                { name: '🛡️ Moderador', value: moderator.tag, inline: true },
                { name: '📅 Data', value: moment().format('DD/MM/YYYY HH:mm:ss'), inline: true }
            ])
            .setTimestamp();
    }

    static createErrorEmbed(message) {
        return new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erro')
            .setDescription(message)
            .setTimestamp();
    }

    static createSuccessEmbed(message) {
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Sucesso')
            .setDescription(message)
            .setTimestamp();
    }

    static createHelpEmbed() {
        return new EmbedBuilder()
            .setColor(process.env.EMBED_COLOR || '#00FF00')
            .setTitle('🤖 Comandos de Administração')
            .setDescription('Lista de comandos disponíveis:')
            .addFields([
                { name: '🛡️ Moderação', value: '`/ban`, `/kick`, `/mute`, `/unmute`, `/warn`, `/clear`', inline: false },
                { name: '📊 Informações', value: '`/userinfo`, `/serverinfo`, `/stats`, `/warns`', inline: false },
                { name: '⚙️ Configuração', value: '`/setup`, `/config`', inline: false },
                { name: '🛠️ Utilitários', value: '`/ping`, `/avatar`, `/role`', inline: false }
            ])
            .setFooter({ text: 'Use /help <comando> para mais informações' })
            .setTimestamp();
    }

    static createConfigEmbed(config) {
        return new EmbedBuilder()
            .setColor(process.env.EMBED_COLOR || '#00FF00')
            .setTitle('⚙️ Configurações do Servidor')
            .addFields([
                { name: '📝 Prefixo', value: config.prefix || '!', inline: true },
                { name: '🎨 Cor dos Embeds', value: config.embed_color || '#00FF00', inline: true },
                { name: '📢 Canal de Logs', value: config.log_channel_id ? `<#${config.log_channel_id}>` : 'Não configurado', inline: true },
                { name: '👋 Canal de Boas-vindas', value: config.welcome_channel_id ? `<#${config.welcome_channel_id}>` : 'Não configurado', inline: true },
                { name: '🎭 Cargo Automático', value: config.auto_role_id ? `<@&${config.auto_role_id}>` : 'Não configurado', inline: true }
            ])
            .setTimestamp();
    }

    static formatDuration(seconds) {
        if (!seconds) return 'Permanente';
        
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m`;
        
        return result.trim() || `${seconds}s`;
    }

    static createPaginationRow(currentPage, totalPages) {
        const row = new ActionRowBuilder();
        
        if (currentPage > 1) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('first')
                    .setLabel('⏮️ Primeira')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️ Anterior')
                    .setStyle(ButtonStyle.Primary)
            );
        }
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('page')
                .setLabel(`${currentPage}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );
        
        if (currentPage < totalPages) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Próxima ▶️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('last')
                    .setLabel('⏭️ Última')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        return row;
    }
}

module.exports = EmbedUtils; 