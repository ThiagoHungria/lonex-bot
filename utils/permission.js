const Database = require('../config/database');

const db = new Database();

async function canUseCommand(interaction, commandName) {
  // Admin sempre pode
  if (interaction.member.permissions.has('Administrator')) return true;
  // Buscar permissões customizadas
  const allowedRoles = await db.getCommandPermissions(interaction.guild.id, commandName);
  if (!allowedRoles || allowedRoles.length === 0) return false;
  // Verifica se o usuário tem algum dos cargos permitidos
  return interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));
}

module.exports = { canUseCommand }; 