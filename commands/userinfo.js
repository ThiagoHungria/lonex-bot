const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../config/database');
const EmbedUtils = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('👤 Mostra informações detalhadas de um usuário')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário para ver informações')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('usuario') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Usuário Não Encontrado')
                    .setDescription('O usuário especificado não foi encontrado neste servidor.')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Buscar warns do usuário
            const db = new Database();
            const warns = await db.getWarns(user.id, interaction.guild.id);

            // Calcular datas
            const createdAt = Math.floor(user.createdTimestamp / 1000);
            const joinedAt = Math.floor(member.joinedTimestamp / 1000);
            const now = Math.floor(Date.now() / 1000);

            // Status do usuário
            const status = {
                'online': '🟢 Online',
                'idle': '🟡 Ausente',
                'dnd': '🔴 Não Perturbe',
                'offline': '⚫ Offline'
            };

            // Permissões importantes
            const permissions = [];
            if (member.permissions.has('Administrator')) permissions.push('👑 Administrador');
            if (member.permissions.has('ManageGuild')) permissions.push('⚙️ Gerenciar Servidor');
            if (member.permissions.has('ManageChannels')) permissions.push('📝 Gerenciar Canais');
            if (member.permissions.has('ManageMessages')) permissions.push('💬 Gerenciar Mensagens');
            if (member.permissions.has('BanMembers')) permissions.push('🔨 Banir Membros');
            if (member.permissions.has('KickMembers')) permissions.push('👢 Expulsar Membros');
            if (member.permissions.has('ModerateMembers')) permissions.push('🔇 Moderar Membros');

            // Cargos ordenados por posição
            const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString())
                .slice(0, 10); // Limitar a 10 cargos

            // Criar embed premium
            const embed = new EmbedBuilder()
                .setColor(member.displayHexColor === '#000000' ? '#3498db' : member.displayHexColor)
                .setTitle(`👤 Informações de ${user.tag}`)
                .setDescription(`Informações detalhadas sobre **${user.tag}**`)
                .addFields([
                    { name: '🆔 ID do Usuário', value: user.id, inline: true },
                    { name: '📅 Conta Criada', value: `<t:${createdAt}:F>\n(<t:${createdAt}:R>)`, inline: true },
                    { name: '🎉 Entrou no Servidor', value: `<t:${joinedAt}:F>\n(<t:${joinedAt}:R>)`, inline: true },
                    { name: '📊 Status', value: status[member.presence?.status || 'offline'], inline: true },
                    { name: '🎭 Cargo Mais Alto', value: member.roles.highest.toString(), inline: true },
                    { name: '🎨 Cor do Cargo', value: member.displayHexColor, inline: true },
                    { name: '⚠️ Avisos', value: warns.length > 0 ? `${warns.length} aviso(s)` : 'Nenhum aviso', inline: true },
                    { name: '🤖 Bot', value: user.bot ? 'Sim' : 'Não', inline: true },
                    { name: '🔒 Verificado', value: user.verified ? 'Sim' : 'Não', inline: true }
                ])
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Informações', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            // Adicionar permissões se houver
            if (permissions.length > 0) {
                embed.addFields({ name: '🔑 Permissões Importantes', value: permissions.join('\n'), inline: false });
            }

            // Adicionar cargos se houver
            if (roles.length > 0) {
                const rolesText = roles.join(', ');
                embed.addFields({ 
                    name: `🎭 Cargos (${member.roles.cache.size - 1})`, 
                    value: rolesText.length > 1024 ? rolesText.substring(0, 1021) + '...' : rolesText, 
                    inline: false 
                });
            }

            // Adicionar informações extras
            const extras = [];
            if (member.nickname) extras.push(`**Apelido:** ${member.nickname}`);
            if (member.voice.channel) extras.push(`**Canal de Voz:** ${member.voice.channel}`);
            if (member.premiumSince) extras.push(`**Boost desde:** <t:${Math.floor(member.premiumSince / 1000)}:F>`);

            if (extras.length > 0) {
                embed.addFields({ name: '📋 Informações Extras', value: extras.join('\n'), inline: false });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao buscar informações do usuário.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 