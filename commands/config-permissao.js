const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Database = require('../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-permissao')
    .setDescription('Configura cargos permitidos para comandos sensíveis')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('adicionar')
        .setDescription('Adicionar permissão de cargo para um comando')
        .addStringOption(opt =>
          opt.setName('comando')
            .setDescription('Nome do comando (ex: ban, mute, clear)')
            .setRequired(true))
        .addRoleOption(opt =>
          opt.setName('cargo')
            .setDescription('Cargo que poderá usar o comando')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remover')
        .setDescription('Remover permissão de cargo para um comando')
        .addStringOption(opt =>
          opt.setName('comando')
            .setDescription('Nome do comando (ex: ban, mute, clear)')
            .setRequired(true))
        .addRoleOption(opt =>
          opt.setName('cargo')
            .setDescription('Cargo a remover permissão')
            .setRequired(true))
    ),

  async execute(interaction) {
    const db = new Database();
    const sub = interaction.options.getSubcommand();
    const command = interaction.options.getString('comando');
    const role = interaction.options.getRole('cargo');

    if (sub === 'adicionar') {
      await db.setCommandPermission(interaction.guild.id, command, role.id);
      const embed = new EmbedBuilder()
        .setColor('#43b581')
        .setTitle('Permissão Adicionada')
        .setDescription(`O cargo ${role} agora pode usar o comando \\${command}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (sub === 'remover') {
      await db.removeCommandPermission(interaction.guild.id, command, role.id);
      const embed = new EmbedBuilder()
        .setColor('#ff4757')
        .setTitle('Permissão Removida')
        .setDescription(`O cargo ${role} não pode mais usar o comando \\${command}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}; 