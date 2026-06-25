// ===== DATABASE CLASS =====
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'barbearia_sense.db');
        this.db = null;
    }

    /**
     * Inicializar conexão com banco de dados
     */
    initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Erro ao conectar ao banco:', err);
                    reject(err);
                } else {
                    console.log('✓ Banco de dados conectado');
                    this.createTables();
                    resolve();
                }
            });
        });
    }

    /**
     * Criar tabelas se não existirem
     */
    createTables() {
        // Tabela de Serviços
        this.db.run(`
            CREATE TABLE IF NOT EXISTS servicos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL UNIQUE,
                preco REAL NOT NULL,
                tempo_estimado INTEGER NOT NULL,
                descricao TEXT,
                icone TEXT,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de Barbeiros
        this.db.run(`
            CREATE TABLE IF NOT EXISTS barbeiros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL UNIQUE,
                experiencia TEXT,
                especialidades TEXT,
                foto TEXT,
                telefone TEXT,
                email TEXT,
                ativo INTEGER DEFAULT 1,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de Agendamentos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS agendamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                servico_id INTEGER NOT NULL,
                barbeiro_id INTEGER NOT NULL,
                cliente_nome TEXT NOT NULL,
                cliente_telefone TEXT NOT NULL,
                cliente_email TEXT NOT NULL,
                data DATE NOT NULL,
                hora TIME NOT NULL,
                status TEXT DEFAULT 'confirmado',
                observacoes TEXT,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servico_id) REFERENCES servicos(id),
                FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id),
                UNIQUE(barbeiro_id, data, hora)
            )
        `);

        // Tabela de Cancelamentos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS cancelamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agendamento_id INTEGER NOT NULL,
                motivo TEXT,
                cancelado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id)
            )
        `);

        // Tabela de Utilizadores
        this.db.run(`
            CREATE TABLE IF NOT EXISTS utilizadores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                telefone TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                perfil TEXT DEFAULT 'cliente',
                ativo INTEGER DEFAULT 0,
                email_confirmado INTEGER DEFAULT 0,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de Tokens (confirmação email / recuperação password)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                token TEXT NOT NULL,
                codigo TEXT,
                tipo TEXT NOT NULL,
                expira_em DATETIME NOT NULL,
                usado INTEGER DEFAULT 0,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES utilizadores(id)
            )
        `);

        // Galeria de cortes (portefólio)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS galeria (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                barbeiro_id INTEGER,
                usuario_id INTEGER NOT NULL,
                titulo TEXT NOT NULL,
                tipo_corte TEXT NOT NULL,
                descricao TEXT,
                imagem_url TEXT,
                video_url TEXT,
                duracao TEXT,
                status TEXT DEFAULT 'pendente',
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                publicado_em DATETIME,
                FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id),
                FOREIGN KEY (usuario_id) REFERENCES utilizadores(id)
            )
        `);

        // Tabela de Configurações do site
        this.db.run(`
            CREATE TABLE IF NOT EXISTS configuracoes (
                chave TEXT PRIMARY KEY,
                valor TEXT NOT NULL,
                atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        this.migrarColunas(() => {
            console.log('✓ Tabelas criadas/verificadas');
            this.inserirDadosExemplo();
        });
    }

    migrarColunas(done) {
        this.db.all('PRAGMA table_info(utilizadores)', (err, cols) => {
            if (err || !cols) return done?.();
            const addCol = (name, sql) => {
                if (!cols.some(c => c.name === name)) {
                    this.db.run(sql);
                }
            };
            addCol('barbeiro_id', 'ALTER TABLE utilizadores ADD COLUMN barbeiro_id INTEGER');
            addCol('google_id', 'ALTER TABLE utilizadores ADD COLUMN google_id TEXT');
            addCol('auth_provider', "ALTER TABLE utilizadores ADD COLUMN auth_provider TEXT DEFAULT 'local'");
            addCol('foto_url', 'ALTER TABLE utilizadores ADD COLUMN foto_url TEXT');
            addCol('metodo_pagamento', 'ALTER TABLE utilizadores ADD COLUMN metodo_pagamento TEXT');
            addCol('perfil_completo', 'ALTER TABLE utilizadores ADD COLUMN perfil_completo INTEGER DEFAULT 0');
            this.db.run(
                'UPDATE utilizadores SET ativo = 1, email_confirmado = 1 WHERE ativo = 0 OR email_confirmado = 0'
            );
            this.db.run(`
                UPDATE utilizadores SET barbeiro_id = (
                    SELECT id FROM barbeiros WHERE barbeiros.email = utilizadores.email LIMIT 1
                ) WHERE barbeiro_id IS NULL AND perfil = 'barbeiro'
            `);

            this.db.all('PRAGMA table_info(galeria)', (err2, colsG) => {
                if (!err2 && colsG && !colsG.some(c => c.name === 'preco')) {
                    this.db.run('ALTER TABLE galeria ADD COLUMN preco REAL');
                }

                this.db.all('PRAGMA table_info(agendamentos)', (err3, colsA) => {
                    if (!err3 && colsA && !colsA.some(c => c.name === 'usuario_id')) {
                        this.db.run('ALTER TABLE agendamentos ADD COLUMN usuario_id INTEGER');
                    }
                    if (!err3 && colsA && !colsA.some(c => c.name === 'metodo_pagamento')) {
                        this.db.run('ALTER TABLE agendamentos ADD COLUMN metodo_pagamento TEXT');
                    }
                    if (!err3 && colsA && !colsA.some(c => c.name === 'referencia_pagamento')) {
                        this.db.run('ALTER TABLE agendamentos ADD COLUMN referencia_pagamento TEXT');
                    }
                    if (!err3 && colsA && !colsA.some(c => c.name === 'valor_pago')) {
                        this.db.run('ALTER TABLE agendamentos ADD COLUMN valor_pago REAL');
                    }

                    this.db.all('PRAGMA table_info(barbeiros)', (err4, colsB) => {
                        if (err4 || !colsB) return done?.();

                        if (!colsB.some(c => c.name === 'principal')) {
                            this.db.run(
                                'ALTER TABLE barbeiros ADD COLUMN principal INTEGER DEFAULT 0',
                                (alterErr) => {
                                    if (!alterErr) {
                                        this.db.run(
                                            'UPDATE barbeiros SET principal = 1 WHERE id = (SELECT MIN(id) FROM barbeiros WHERE ativo = 1)',
                                            () => this.normalizarBarbeiroPrincipal(done)
                                        );
                                    } else {
                                        this.garantirAdminPrincipal(done);
                                    }
                                }
                            );
                        } else {
                            this.db.run(
                                `UPDATE barbeiros SET principal = 1
                                 WHERE id = (SELECT MIN(id) FROM barbeiros WHERE ativo = 1)
                                 AND NOT EXISTS (SELECT 1 FROM barbeiros WHERE principal = 1)`,
                                () => {
                                    this.normalizarBarbeiroPrincipal(done);
                                }
                            );
                        }
                    });
                });
            });
        });
    }

    async garantirAdminPrincipal(done) {
        try {
            const email = 'sensegeraldo2@gmail.com';
            const hash = await bcrypt.hash('12sense12', 12);
            const existente = await this.get('SELECT id FROM utilizadores WHERE email = ?', [email]);

            if (existente) {
                await this.run(
                    `UPDATE utilizadores SET nome = 'Geraldo Sense', password_hash = ?, perfil = 'administrador',
                     ativo = 1, email_confirmado = 1, perfil_completo = 1, telefone = '+351 960 075 690' WHERE email = ?`,
                    [hash, email]
                );
            } else {
                await this.run(
                    `INSERT INTO utilizadores (nome, email, telefone, password_hash, perfil, ativo, email_confirmado, perfil_completo)
                     VALUES ('Geraldo Sense', ?, '+351 960 075 690', ?, 'administrador', 1, 1, 1)`,
                    [email, hash]
                );
            }
            console.log('✓ Administrador principal: Geraldo Sense / 12sense12');
        } catch (err) {
            console.error('Erro ao garantir admin principal:', err.message);
        }
        done?.();
    }

    normalizarBarbeiroPrincipal(done) {
        const dadosGeraldo = [
            'Geraldo Sense',
            '15+ anos',
            'Cortes clássicos, Degradê, Barba, Styling',
            'assets/logo.png',
            '+351 960 075 690',
            'sensegeraldo2@gmail.com'
        ];

        this.db.get(
            `SELECT id FROM barbeiros WHERE nome IN ('João Silva', 'Joao Silva', 'Geraldo Sense') ORDER BY id LIMIT 1`,
            (err, row) => {
                if (err || !row) return this.garantirAdminPrincipal(done);

                this.db.run(
                    `UPDATE barbeiros SET nome = ?, experiencia = ?, especialidades = ?, foto = ?, telefone = ?, email = ?, principal = 1, ativo = 1 WHERE id = ?`,
                    [...dadosGeraldo, row.id],
                    () => {
                        this.db.run(
                            'UPDATE barbeiros SET ativo = 0 WHERE id != ? AND nome IN (?, ?, ?)',
                            [row.id, 'Carlos Santos', 'Miguel Costa', 'João Silva'],
                            () => {
                                this.db.run(
                                    `UPDATE utilizadores SET nome = 'Geraldo Sense' WHERE email = 'joao@barbeariasense.pt'`,
                                    () => this.garantirAdminPrincipal(done)
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    /**
     * Inserir dados de exemplo
     */
    inserirDadosExemplo() {
        // Verificar se já existem dados
        this.db.get('SELECT COUNT(*) as count FROM servicos', (err, row) => {
            if (err || !row || row.count !== 0) return;

            console.log('Inserindo dados de exemplo...');

            const servicos = [
                ['Corte Normal', 15.00, 30, 'Corte clássico com acabamento perfeito', '✂️'],
                ['Degradê', 20.00, 40, 'Degradê moderno com transição suave', '💇'],
                ['Barba', 12.00, 25, 'Aparagem e modelagem de barba', '🧔'],
                ['Corte + Barba', 25.00, 55, 'Combinação de corte e barba', '👔'],
                ['Tratamento Capilar', 30.00, 45, 'Hidratação e tratamento profissional', '💆']
            ];

            servicos.forEach(servico => {
                this.db.run(
                    'INSERT INTO servicos (nome, preco, tempo_estimado, descricao, icone) VALUES (?, ?, ?, ?, ?)',
                    servico
                );
            });

            const barbeiros = [
                ['Geraldo Sense', '15+ anos', 'Cortes clássicos, Degradê, Barba, Styling', 'assets/logo.png', '+351 960 075 690', 'sensegeraldo2@gmail.com', 1]
            ];

            barbeiros.forEach(barbeiro => {
                this.db.run(
                    'INSERT INTO barbeiros (nome, experiencia, especialidades, foto, telefone, email, principal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    barbeiro
                );
            });

            console.log('✓ Dados de exemplo inseridos');
        });

        this.db.get('SELECT COUNT(*) as count FROM utilizadores', async (err, row) => {
            if (err || !row || row.count > 0) return;

            const adminHash = await bcrypt.hash('admin123', 12);
            const barbeiroHash = await bcrypt.hash('barbeiro123', 12);

            const utilizadores = [
                ['Administrador Sense', 'admin@sensebarbearia.pt', '+351960075690', adminHash, 'administrador', 1, 1],
                ['Geraldo Sense', 'sensegeraldo2@gmail.com', '+351960075690', barbeiroHash, 'barbeiro', 1, 1]
            ];

            utilizadores.forEach(u => {
                this.db.run(
                    `INSERT INTO utilizadores (nome, email, telefone, password_hash, perfil, ativo, email_confirmado)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    u
                );
            });

            console.log('✓ Utilizadores de exemplo criados (admin@sensebarbearia.pt / admin123)');

            setTimeout(() => {
                this.db.run(
                    'UPDATE utilizadores SET barbeiro_id = 1 WHERE email = ?',
                    ['joao@barbeariasense.pt']
                );
            }, 500);
        });

        this.db.get('SELECT COUNT(*) as count FROM galeria', (err, row) => {
            if (err || row.count > 0) return;

            const exemplos = [
                [1, 2, 'Degradê Moderno', 'Degradê', 'Fade suave com linha definida', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600', '', '40 min', 'aprovado'],
                [2, 2, 'Barba Clássica', 'Barba', 'Modelagem e acabamento premium', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600', '', '25 min', 'aprovado']
            ];

            exemplos.forEach(e => {
                this.db.run(
                    `INSERT INTO galeria (barbeiro_id, usuario_id, titulo, tipo_corte, descricao, imagem_url, video_url, duracao, status, publicado_em)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                    e
                );
            });
        });
    }

    /**
     * Executar query simples
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    /**
     * Obter um único resultado
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Obter todos os resultados
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Fechar conexão
     */
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = Database;
