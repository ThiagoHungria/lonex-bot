const { EmbedBuilder } = require('discord.js');

function erro(msg) {
  return new EmbedBuilder()
    .setColor('#ff4757')
    .setTitle('❌ Erro')
    .setDescription(msg)
    .setTimestamp();
}

function sucesso(msg) {
  return new EmbedBuilder()
    .setColor('#43b581')
    .setTitle('✅ Sucesso')
    .setDescription(msg)
    .setTimestamp();
}

function acessoNegado(msg = 'Você não tem permissão para usar este comando.') {
  return new EmbedBuilder()
    .setColor('#ff4757')
    .setTitle('🔒 Acesso Negado')
    .setDescription(msg)
    .setTimestamp();
}

module.exports = { erro, sucesso, acessoNegado }; 