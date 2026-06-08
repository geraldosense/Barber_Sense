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

        this.migrarColunas();
        console.log('✓ Tabelas criadas/verificadas');
        this.inserirDadosExemplo();
    }

    migrarColunas() {
        this.db.all('PRAGMA table_info(utilizadores)', (err, cols) => {
            if (err || !cols) return;
            if (!cols.some(c => c.name === 'barbeiro_id')) {
                this.db.run('ALTER TABLE utilizadores ADD COLUMN barbeiro_id INTEGER');
            }
            this.db.run(`
                UPDATE utilizadores SET barbeiro_id = (
                    SELECT id FROM barbeiros WHERE barbeiros.email = utilizadores.email LIMIT 1
                ) WHERE barbeiro_id IS NULL AND perfil = 'barbeiro'
            `);
        });
    }

    /**
     * Inserir dados de exemplo
     */
    inserirDadosExemplo() {
        // Verificar se já existem dados
        this.db.get('SELECT COUNT(*) as count FROM servicos', (err, row) => {
            if (row.count === 0) {
                console.log('Inserindo dados de exemplo...');

                // Inserir Serviços
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

                // Inserir Barbeiros
                const barbeiros = [
                    ['João Silva', '10 anos', 'Cortes, Degradês, Barba', 'assets/barbeiro1.jpg', '+351 XXX XXX XXX', 'joao@barbeariasense.pt'],
                    ['Carlos Santos', '8 anos', 'Cortes, Tratamentos', 'assets/barbeiro2.jpg', '+351 XXX XXX XXX', 'carlos@barbeariasense.pt'],
                    ['Miguel Costa', '6 anos', 'Degradês, Barba, Styling', 'assets/barbeiro3.jpg', '+351 XXX XXX XXX', 'miguel@barbeariasense.pt']
                ];

                barbeiros.forEach(barbeiro => {
                    this.db.run(
                        'INSERT INTO barbeiros (nome, experiencia, especialidades, foto, telefone, email) VALUES (?, ?, ?, ?, ?, ?)',
                        barbeiro
                    );
                });

                console.log('✓ Dados de exemplo inseridos');
            }
        });

        this.db.get('SELECT COUNT(*) as count FROM utilizadores', async (err, row) => {
            if (err || row.count > 0) return;

            const adminHash = await bcrypt.hash('admin123', 12);
            const barbeiroHash = await bcrypt.hash('barbeiro123', 12);

            const utilizadores = [
                ['Administrador Sense', 'admin@sensebarbearia.pt', '+351960075690', adminHash, 'administrador', 1, 1],
                ['João Silva', 'joao@barbeariasense.pt', '+351960075691', barbeiroHash, 'barbeiro', 1, 1]
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
