const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('🎭 Mostra informações detalhadas de um cargo')
        .addRoleOption(option =>
            option.setName('cargo')
                .setDescription('Cargo para ver informações')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const role = interaction.options.getRole('cargo') || interaction.member.roles.highest;

            // Calcular estatísticas
            const memberCount = role.members.size;
            const totalMembers = interaction.guild.memberCount;
            const percentage = ((memberCount / totalMembers) * 100).toFixed(1);

            // Permissões importantes
            const permissions = [];
            if (role.permissions.has('Administrator')) permissions.push('👑 Administrador');
            if (role.permissions.has('ManageGuild')) permissions.push('⚙️ Gerenciar Servidor');
            if (role.permissions.has('ManageChannels')) permissions.push('📝 Gerenciar Canais');
            if (role.permissions.has('ManageMessages')) permissions.push('💬 Gerenciar Mensagens');
            if (role.permissions.has('BanMembers')) permissions.push('🔨 Banir Membros');
            if (role.permissions.has('KickMembers')) permissions.push('👢 Expulsar Membros');
            if (role.permissions.has('ModerateMembers')) permissions.push('🔇 Moderar Membros');
            if (role.permissions.has('ManageRoles')) permissions.push('🎭 Gerenciar Cargos');
            if (role.permissions.has('ViewAuditLog')) permissions.push('📋 Ver Logs de Auditoria');
            if (role.permissions.has('SendMessages')) permissions.push('💬 Enviar Mensagens');
            if (role.permissions.has('EmbedLinks')) permissions.push('🔗 Enviar Embeds');
            if (role.permissions.has('AttachFiles')) permissions.push('📎 Anexar Arquivos');
            if (role.permissions.has('AddReactions')) permissions.push('😄 Adicionar Reações');
            if (role.permissions.has('UseExternalEmojis')) permissions.push('😀 Usar Emojis Externos');
            if (role.permissions.has('Connect')) permissions.push('🎤 Conectar em Canais de Voz');
            if (role.permissions.has('Speak')) permissions.push('🗣️ Falar em Canais de Voz');

            // Datas
            const createdAt = Math.floor(role.createdTimestamp / 1000);

            // Criar embed premium
            const embed = new EmbedBuilder()
                .setColor(role.color === 0 ? '#747d8c' : role.color)
                .setTitle(`🎭 Informações de ${role.name}`)
                .setDescription(`Informações detalhadas sobre o cargo **${role.name}**`)
                .addFields([
                    { name: '🆔 ID do Cargo', value: role.id, inline: true },
                    { name: '📅 Criado em', value: `<t:${createdAt}:F>\n(<t:${createdAt}:R>)`, inline: true },
                    { name: '👥 Membros', value: `${memberCount} (${percentage}%)`, inline: true },
                    { name: '🎨 Cor', value: role.hexColor, inline: true },
                    { name: '📊 Posição', value: `${role.position}/${interaction.guild.roles.cache.size}`, inline: true },
                    { name: '🔒 Mencionável', value: role.mentionable ? 'Sim' : 'Não', inline: true },
                    { name: '👁️ Exibido Separadamente', value: role.hoist ? 'Sim' : 'Não', inline: true },
                    { name: '🤖 Gerenciado por Bot', value: role.managed ? 'Sim' : 'Não', inline: true },
                    { name: '🔑 Permissões', value: role.permissions.toArray().length > 0 ? role.permissions.toArray().length : '0', inline: true }
                ])
                .setThumbnail(role.iconURL({ dynamic: true, size: 256 }))
                .setTimestamp()
                .setFooter({ text: 'Lonex - Sistema de Informações', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });

            // Adicionar permissões importantes se houver
            if (permissions.length > 0) {
                embed.addFields({ name: '🔑 Permissões Importantes', value: permissions.join('\n'), inline: false });
            }

            // Adicionar todas as permissões se não forem muitas
            const allPermissions = role.permissions.toArray();
            if (allPermissions.length > 0 && allPermissions.length <= 20) {
                embed.addFields({ 
                    name: '📋 Todas as Permissões', 
                    value: allPermissions.map(perm => `• ${perm}`).join('\n'), 
                    inline: false 
                });
            } else if (allPermissions.length > 20) {
                embed.addFields({ 
                    name: '📋 Permissões', 
                    value: `${allPermissions.length} permissões (muitas para exibir)`, 
                    inline: false 
                });
            }

            // Adicionar informações extras
            const extras = [];
            if (role.tags?.botId) extras.push(`**Bot:** <@${role.tags.botId}>`);
            if (role.tags?.integrationId) extras.push(`**Integração:** ${role.tags.integrationId}`);
            if (role.tags?.premiumSubscriberRole) extras.push(`**Boost:** Sim`);
            if (role.tags?.availableForPurchase) extras.push(`**Vendável:** Sim`);
            if (role.tags?.guildConnections) extras.push(`**Conexões:** Sim`);

            if (extras.length > 0) {
                embed.addFields({ name: '📋 Informações Extras', value: extras.join('\n'), inline: false });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao buscar informações do cargo:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Erro')
                .setDescription('Ocorreu um erro ao buscar informações do cargo.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 