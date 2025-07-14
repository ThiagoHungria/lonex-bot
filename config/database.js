const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, '../data/admin.db'), (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco de dados:', err);
            } else {
                console.log('✅ Conectado ao banco de dados SQLite');
                this.initTables();
            }
        });
    }

    initTables() {
        // Tabela de logs de moderação
        const createModLogsTable = `
            CREATE TABLE IF NOT EXISTS mod_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                user_id TEXT NOT NULL,
                target_id TEXT,
                reason TEXT,
                moderator_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabela de configurações do servidor
        const createGuildConfigTable = `
            CREATE TABLE IF NOT EXISTS guild_config (
                guild_id TEXT PRIMARY KEY,
                welcome_channel_id TEXT,
                log_channel_id TEXT,
                auto_role_id TEXT,
                welcome_message TEXT,
                embed_color TEXT DEFAULT '#00FF00',
                prefix TEXT DEFAULT '!',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabela de warns
        const createWarnsTable = `
            CREATE TABLE IF NOT EXISTS warns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabela de mutes
        const createMutesTable = `
            CREATE TABLE IF NOT EXISTS mutes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                reason TEXT,
                duration INTEGER,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabela de estatísticas
        const createStatsTable = `
            CREATE TABLE IF NOT EXISTS stats (
                guild_id TEXT PRIMARY KEY,
                total_messages INTEGER DEFAULT 0,
                total_commands INTEGER DEFAULT 0,
                total_members INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createModLogsTable, (err) => {
            if (err) {
                console.error('Erro ao criar tabela mod_logs:', err);
            } else {
                console.log('✅ Tabela mod_logs criada/verificada');
            }
        });

        this.db.run(createGuildConfigTable, (err) => {
            if (err) {
                console.error('Erro ao criar tabela guild_config:', err);
            } else {
                console.log('✅ Tabela guild_config criada/verificada');
            }
        });

        this.db.run(createWarnsTable, (err) => {
            if (err) {
                console.error('Erro ao criar tabela warns:', err);
            } else {
                console.log('✅ Tabela warns criada/verificada');
            }
        });

        this.db.run(createMutesTable, (err) => {
            if (err) {
                console.error('Erro ao criar tabela mutes:', err);
            } else {
                console.log('✅ Tabela mutes criada/verificada');
            }
        });

        this.db.run(createStatsTable, (err) => {
            if (err) {
                console.error('Erro ao criar tabela stats:', err);
            } else {
                console.log('✅ Tabela stats criada/verificada');
            }
        });
    }

    // Métodos para logs de moderação
    addModLog(action, userId, targetId, reason, moderatorId, guildId) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO mod_logs (action, user_id, target_id, reason, moderator_id, guild_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [action, userId, targetId, reason, moderatorId, guildId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    getModLogs(guildId, limit = 50) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM mod_logs 
                WHERE guild_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            
            this.db.all(query, [guildId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Métodos para configurações do servidor
    getGuildConfig(guildId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM guild_config WHERE guild_id = ?';
            
            this.db.get(query, [guildId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    setGuildConfig(guildId, config) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO guild_config 
                (guild_id, welcome_channel_id, log_channel_id, auto_role_id, welcome_message, embed_color, prefix, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            this.db.run(query, [
                guildId,
                config.welcome_channel_id,
                config.log_channel_id,
                config.auto_role_id,
                config.welcome_message,
                config.embed_color,
                config.prefix
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Métodos para warns
    addWarn(userId, guildId, moderatorId, reason) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO warns (user_id, guild_id, moderator_id, reason)
                VALUES (?, ?, ?, ?)
            `;
            
            this.db.run(query, [userId, guildId, moderatorId, reason], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    getWarns(userId, guildId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM warns WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC';
            
            this.db.all(query, [userId, guildId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Métodos para mutes
    addMute(userId, guildId, moderatorId, reason, duration) {
        return new Promise((resolve, reject) => {
            const expiresAt = duration ? new Date(Date.now() + duration * 1000) : null;
            const query = `
                INSERT INTO mutes (user_id, guild_id, moderator_id, reason, duration, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [userId, guildId, moderatorId, reason, duration, expiresAt], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    getActiveMutes(guildId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM mutes 
                WHERE guild_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
                ORDER BY created_at DESC
            `;
            
            this.db.all(query, [guildId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Métodos para estatísticas
    updateStats(guildId, stats) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO stats 
                (guild_id, total_messages, total_commands, total_members, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            this.db.run(query, [
                guildId,
                stats.total_messages || 0,
                stats.total_commands || 0,
                stats.total_members || 0
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    getStats(guildId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM stats WHERE guild_id = ?';
            
            this.db.get(query, [guildId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Erro ao fechar banco de dados:', err);
            } else {
                console.log('✅ Banco de dados fechado');
            }
        });
    }
}

module.exports = Database; 