const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🤖 Configuração do Bot de Administração Lonex Store');
console.log('===================================================\n');

const questions = [
    {
        name: 'DISCORD_TOKEN',
        question: 'Digite o token do seu bot Discord: ',
        required: true
    },
    {
        name: 'CLIENT_ID',
        question: 'Digite o Client ID (Application ID) do seu bot: ',
        required: true
    },
    {
        name: 'GUILD_ID',
        question: 'Digite o ID do seu servidor Discord: ',
        required: true
    },
    {
        name: 'LOG_CHANNEL_ID',
        question: 'Digite o ID do canal de logs (opcional, deixe vazio para pular): ',
        required: false
    },
    {
        name: 'WELCOME_CHANNEL_ID',
        question: 'Digite o ID do canal de boas-vindas (opcional, deixe vazio para pular): ',
        required: false
    },
    {
        name: 'ADMIN_ROLE_ID',
        question: 'Digite o ID da role de administrador (opcional, deixe vazio para pular): ',
        required: false
    },
    {
        name: 'MODERATOR_ROLE_ID',
        question: 'Digite o ID da role de moderador (opcional, deixe vazio para pular): ',
        required: false
    },
    {
        name: 'PREFIX',
        question: 'Digite o prefixo para comandos (padrão: !): ',
        required: false,
        default: '!'
    },
    {
        name: 'EMBED_COLOR',
        question: 'Digite a cor padrão dos embeds em hex (padrão: #00FF00): ',
        required: false,
        default: '#00FF00'
    }
];

const answers = {};

function askQuestion(index) {
    if (index >= questions.length) {
        createEnvFile();
        return;
    }

    const question = questions[index];
    
    rl.question(question.question, (answer) => {
        if (question.required && !answer.trim()) {
            console.log('❌ Esta informação é obrigatória!');
            askQuestion(index);
            return;
        }
        
        // Se não é obrigatório e está vazio, usar valor padrão ou deixar vazio
        if (!question.required && !answer.trim() && question.default) {
            answers[question.name] = question.default;
        } else {
            answers[question.name] = answer.trim() || '';
        }
        
        askQuestion(index + 1);
    });
}

function createEnvFile() {
    const envContent = Object.keys(answers)
        .filter(key => answers[key] !== '') // Remover campos vazios
        .map(key => `${key}=${answers[key]}`)
        .join('\n');

    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Arquivo .env criado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute: npm install');
    console.log('2. Execute: npm run deploy');
    console.log('3. Execute: npm start');
    console.log('\n🎉 Seu bot de administração está pronto para uso!');
    console.log('\n📖 Comandos principais:');
    console.log('• /ban - Banir usuários');
    console.log('• /kick - Expulsar usuários');
    console.log('• /mute - Silenciar usuários');
    console.log('• /clear - Limpar mensagens');
    console.log('• /userinfo - Informações de usuário');
    console.log('• /serverinfo - Informações do servidor');
    console.log('• /help - Lista de comandos');
    
    rl.close();
}

// Iniciar configuração
askQuestion(0); 