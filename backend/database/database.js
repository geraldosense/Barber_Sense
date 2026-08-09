// ===== DATABASE CLASS =====
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { resolverCaminhoBaseDados } = require('../utils/paths');

class Database {
    constructor() {
        this.dbPath = resolverCaminhoBaseDados();
        this.db = null;
        console.log(`✓ Caminho da base de dados: ${this.dbPath}`);
    }

    /**
     * Inicializar conexão com banco de dados
     */
    initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async (err) => {
                if (err) {
                    console.error('Erro ao conectar ao banco:', err);
                    reject(err);
                    return;
                }
                console.log('✓ Banco de dados conectado');
                try {
                    await this.configurarPragmas();
                    await this.createTables();
                    await this.migrarColunas();
                    await this.inserirDadosExemplo();
                    await this.bumpSync('init');
                    const integrity = await this.get('PRAGMA integrity_check');
                    console.log('✓ Tabelas criadas/verificadas');
                    console.log(`✓ Integridade BD: ${integrity?.integrity_check || integrity}`);
                    resolve();
                } catch (initErr) {
                    console.error('Erro ao inicializar banco:', initErr);
                    reject(initErr);
                }
            });
        });
    }

    async configurarPragmas() {
        await this.run('PRAGMA foreign_keys = ON');
        await this.run('PRAGMA busy_timeout = 5000');
        try {
            await this.run('PRAGMA journal_mode = WAL');
        } catch (_) {
            /* alguns FS remotos não suportam WAL */
        }
        await this.run('PRAGMA synchronous = NORMAL');
    }

    /**
     * Criar tabelas se não existirem
     */
    async createTables() {
        const statements = [
        // Tabela de Serviços
        `
            CREATE TABLE IF NOT EXISTS servicos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL UNIQUE,
                preco REAL NOT NULL,
                tempo_estimado INTEGER NOT NULL,
                descricao TEXT,
                icone TEXT,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `,
        // Tabela de Barbeiros
        `
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
        `,
        // Tabela de Agendamentos
        // Nota: o UNIQUE antigo (barbeiro_id,data,hora) bloqueava reutilização de slots cancelados.
        // O índice parcial é criado em migrarColunas().
        `
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
                FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id)
            )
        `,
        // Tabela de Cancelamentos
        `
            CREATE TABLE IF NOT EXISTS cancelamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agendamento_id INTEGER NOT NULL,
                motivo TEXT,
                cancelado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id)
            )
        `,
        // Tabela de Utilizadores
        `
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
        `,
        // Tabela de Tokens (confirmação email / recuperação password)
        `
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
        `,
        // Pedidos MB WAY pendentes
        `
            CREATE TABLE IF NOT EXISTS pagamentos_mbway (
                id TEXT PRIMARY KEY,
                usuario_id INTEGER,
                telefone_cliente TEXT NOT NULL,
                telefone_comerciante TEXT NOT NULL,
                valor REAL NOT NULL,
                estado TEXT DEFAULT 'pendente',
                referencia TEXT,
                simulado INTEGER DEFAULT 0,
                provider TEXT,
                expira_em DATETIME NOT NULL,
                confirmado_em DATETIME,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `,
        // Galeria de cortes (portefólio)
        `
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
        `,
        // Tabela de Configurações do site
        `
            CREATE TABLE IF NOT EXISTS configuracoes (
                chave TEXT PRIMARY KEY,
                valor TEXT NOT NULL,
                atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `
        ];

        for (const sql of statements) {
            await this.run(sql);
        }
    }

    async migrarColunas() {
        const cols = await this.all('PRAGMA table_info(utilizadores)');
        const addCol = async (name, sql) => {
            if (!cols.some(c => c.name === name)) {
                await this.run(sql);
                cols.push({ name });
            }
        };

        await addCol('barbeiro_id', 'ALTER TABLE utilizadores ADD COLUMN barbeiro_id INTEGER');
        await addCol('google_id', 'ALTER TABLE utilizadores ADD COLUMN google_id TEXT');
        await addCol('auth_provider', "ALTER TABLE utilizadores ADD COLUMN auth_provider TEXT DEFAULT 'local'");
        await addCol('foto_url', 'ALTER TABLE utilizadores ADD COLUMN foto_url TEXT');
        await addCol('metodo_pagamento', 'ALTER TABLE utilizadores ADD COLUMN metodo_pagamento TEXT');
        await addCol('perfil_completo', 'ALTER TABLE utilizadores ADD COLUMN perfil_completo INTEGER DEFAULT 0');

        await this.run(
            'UPDATE utilizadores SET ativo = 1, email_confirmado = 1 WHERE ativo = 0 OR email_confirmado = 0'
        );
        await this.run(`
            UPDATE utilizadores SET barbeiro_id = (
                SELECT id FROM barbeiros WHERE barbeiros.email = utilizadores.email LIMIT 1
            ) WHERE barbeiro_id IS NULL AND perfil = 'barbeiro'
        `);

        const colsG = await this.all('PRAGMA table_info(galeria)');
        if (colsG && !colsG.some(c => c.name === 'preco')) {
            await this.run('ALTER TABLE galeria ADD COLUMN preco REAL');
        }

        const colsA = await this.all('PRAGMA table_info(agendamentos)');
        if (colsA) {
            if (!colsA.some(c => c.name === 'usuario_id')) {
                await this.run('ALTER TABLE agendamentos ADD COLUMN usuario_id INTEGER');
            }
            if (!colsA.some(c => c.name === 'metodo_pagamento')) {
                await this.run('ALTER TABLE agendamentos ADD COLUMN metodo_pagamento TEXT');
            }
            if (!colsA.some(c => c.name === 'referencia_pagamento')) {
                await this.run('ALTER TABLE agendamentos ADD COLUMN referencia_pagamento TEXT');
            }
            if (!colsA.some(c => c.name === 'valor_pago')) {
                await this.run('ALTER TABLE agendamentos ADD COLUMN valor_pago REAL');
            }
        }

        const colsB = await this.all('PRAGMA table_info(barbeiros)');
        if (!colsB || colsB.length === 0) return;

        const colsServ = await this.all('PRAGMA table_info(servicos)');
        if (colsServ) {
            if (!colsServ.some(c => c.name === 'ativo')) {
                await this.run('ALTER TABLE servicos ADD COLUMN ativo INTEGER DEFAULT 1');
            }
            if (!colsServ.some(c => c.name === 'imagem')) {
                await this.run('ALTER TABLE servicos ADD COLUMN imagem TEXT');
            }
        }

        if (!colsB.some(c => c.name === 'principal')) {
            try {
                await this.run('ALTER TABLE barbeiros ADD COLUMN principal INTEGER DEFAULT 0');
                await this.run(
                    'UPDATE barbeiros SET principal = 1 WHERE id = (SELECT MIN(id) FROM barbeiros WHERE ativo = 1)'
                );
            } catch {
                await this.garantirAdminPrincipal();
                return;
            }
        } else {
            await this.run(
                `UPDATE barbeiros SET principal = 1
                 WHERE id = (SELECT MIN(id) FROM barbeiros WHERE ativo = 1)
                 AND NOT EXISTS (SELECT 1 FROM barbeiros WHERE principal = 1)`
            );
        }

        await this.normalizarBarbeiroPrincipal();
        await this.atualizarEmailOficialSite();
        await this.migrarAgendamentosUniqueParcial();
        await this.criarIndices();
    }

    /**
     * Remove UNIQUE global em (barbeiro_id,data,hora) e cria índice parcial
     * só para marcações confirmadas — assim slots cancelados podem ser reutilizados.
     */
    async migrarAgendamentosUniqueParcial() {
        try {
            const idxs = await this.all('PRAGMA index_list(agendamentos)');
            const temAutoUnique = (idxs || []).some(
                i => i.origin === 'u' && Number(i.unique) === 1 && !String(i.name).includes('confirmado')
            );
            const temParcial = (idxs || []).some(i => i.name === 'idx_agendamentos_slot_confirmado');

            // Limpar tentativa anterior falhada
            const tables = await this.all("SELECT name FROM sqlite_master WHERE type='table' AND name='agendamentos_nova'");
            if (tables.length) {
                await this.run('DROP TABLE IF EXISTS agendamentos_nova');
            }

            if (temAutoUnique) {
                console.log('↻ A migrar tabela agendamentos (unique parcial)…');
                await this.run('PRAGMA foreign_keys = OFF');
                await this.run('BEGIN');
                await this.run(`
                    CREATE TABLE agendamentos_nova (
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
                        usuario_id INTEGER,
                        metodo_pagamento TEXT,
                        referencia_pagamento TEXT,
                        valor_pago REAL,
                        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                const cols = await this.all('PRAGMA table_info(agendamentos)');
                const nomes = new Set((cols || []).map(c => c.name));
                const selectCols = [
                    'id', 'servico_id', 'barbeiro_id', 'cliente_nome', 'cliente_telefone', 'cliente_email',
                    'data', 'hora', 'status', 'observacoes',
                    nomes.has('usuario_id') ? 'usuario_id' : 'NULL AS usuario_id',
                    nomes.has('metodo_pagamento') ? 'metodo_pagamento' : 'NULL AS metodo_pagamento',
                    nomes.has('referencia_pagamento') ? 'referencia_pagamento' : 'NULL AS referencia_pagamento',
                    nomes.has('valor_pago') ? 'valor_pago' : 'NULL AS valor_pago',
                    'criado_em', 'atualizado_em'
                ].join(', ');

                await this.run(`
                    INSERT INTO agendamentos_nova (
                        id, servico_id, barbeiro_id, cliente_nome, cliente_telefone, cliente_email,
                        data, hora, status, observacoes, usuario_id, metodo_pagamento,
                        referencia_pagamento, valor_pago, criado_em, atualizado_em
                    )
                    SELECT ${selectCols} FROM agendamentos
                `);
                await this.run('DROP TABLE agendamentos');
                await this.run('ALTER TABLE agendamentos_nova RENAME TO agendamentos');
                await this.run('COMMIT');
                await this.run('PRAGMA foreign_keys = ON');
                console.log('✓ Tabela agendamentos migrada');
            }

            if (!temParcial || temAutoUnique) {
                await this.run(`
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_agendamentos_slot_confirmado
                    ON agendamentos(barbeiro_id, data, hora)
                    WHERE status = 'confirmado'
                `);
            }
        } catch (err) {
            try { await this.run('ROLLBACK'); } catch (_) { /* ignore */ }
            try { await this.run('PRAGMA foreign_keys = ON'); } catch (_) { /* ignore */ }
            console.error('Erro na migração de agendamentos:', err.message);
        }
    }

    async criarIndices() {
        const indices = [
            `CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data)`,
            `CREATE INDEX IF NOT EXISTS idx_agendamentos_email ON agendamentos(cliente_email)`,
            `CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status)`,
            `CREATE INDEX IF NOT EXISTS idx_utilizadores_email ON utilizadores(email)`,
            `CREATE INDEX IF NOT EXISTS idx_galeria_status ON galeria(status)`,
            `CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens(usuario_id, tipo, usado)`
        ];
        for (const sql of indices) {
            try {
                await this.run(sql);
            } catch (err) {
                console.warn('Índice:', err.message);
            }
        }
    }

    async atualizarEmailOficialSite() {
        const emailOficial = 'sensebarber10@gmail.com';
        try {
            const row = await this.get('SELECT valor FROM configuracoes WHERE chave = ?', ['site_info']);
            let site = {
                telefone: '+351 960 075 690',
                email: emailOficial,
                morada: 'Rua Principal, Caminho Nossa Senhora da Luz n6',
                instagram: 'https://www.instagram.com/sense_barber',
                tiktok: 'https://www.tiktok.com/@sense_barber',
                whatsapp: 'https://wa.me/+351960075690'
            };
            if (row?.valor) {
                try {
                    site = { ...site, ...JSON.parse(row.valor), email: emailOficial };
                } catch { /* usar defaults */ }
            }
            await this.run(
                `INSERT INTO configuracoes (chave, valor, atualizado_em) VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = CURRENT_TIMESTAMP`,
                ['site_info', JSON.stringify(site)]
            );
        } catch (err) {
            console.error('Erro ao atualizar email oficial do site:', err.message);
        }
    }

    async garantirAdminPrincipal() {
        try {
            const email = 'sensebarber10@gmail.com';
            const hash = await bcrypt.hash('12sense12', 12);
            const existente = await this.get('SELECT id FROM utilizadores WHERE email = ?', [email]);

            if (existente) {
                await this.run(
                    `UPDATE utilizadores SET nome = 'Sense Barbershop', password_hash = ?, perfil = 'administrador',
                     ativo = 1, email_confirmado = 1, perfil_completo = 1, telefone = '+351 960 075 690' WHERE email = ?`,
                    [hash, email]
                );
            } else {
                await this.run(
                    `INSERT INTO utilizadores (nome, email, telefone, password_hash, perfil, ativo, email_confirmado, perfil_completo)
                     VALUES ('Sense Barbershop', ?, '+351 960 075 690', ?, 'administrador', 1, 1, 1)`,
                    [email, hash]
                );
            }

            // Único admin oficial — despromove contas antigas
            await this.run(
                `UPDATE utilizadores SET perfil = CASE
                    WHEN email = 'sensegeraldo2@gmail.com' THEN 'barbeiro'
                    ELSE 'cliente'
                 END
                 WHERE perfil = 'administrador' AND LOWER(email) != ?`,
                [email]
            );

            console.log('✓ Administrador oficial: sensebarber10@gmail.com');
        } catch (err) {
            console.error('Erro ao garantir admin principal:', err.message);
        }
    }

    async normalizarBarbeiroPrincipal() {
        const dadosGeraldo = [
            'Geraldo Sense',
            '4 anos de profissionalismo na área da barbearia',
            'Cortes clássicos, Degradê, Barba, Styling',
            'assets/barbeiros/geraldo-sense.jpg',
            '+351 960 075 690',
            'sensegeraldo2@gmail.com'
        ];

        const row = await this.get(
            `SELECT id FROM barbeiros WHERE nome IN ('João Silva', 'Joao Silva', 'Geraldo Sense') ORDER BY id LIMIT 1`
        );

        if (!row) {
            await this.garantirAdminPrincipal();
            return;
        }

        await this.run(
            `UPDATE barbeiros SET nome = ?, experiencia = ?, especialidades = ?, foto = ?, telefone = ?, email = ?, principal = 1, ativo = 1 WHERE id = ?`,
            [...dadosGeraldo, row.id]
        );
        await this.run(
            'UPDATE barbeiros SET ativo = 0 WHERE id != ? AND nome IN (?, ?, ?)',
            [row.id, 'Carlos Santos', 'Miguel Costa', 'João Silva']
        );
        await this.run(
            `UPDATE utilizadores SET nome = 'Geraldo Sense' WHERE email = 'joao@barbeariasense.pt'`
        );
        await this.garantirAdminPrincipal();
    }

    /**
     * Inserir dados de exemplo
     */
    async inserirDadosExemplo() {
        const servicosCount = await this.get('SELECT COUNT(*) as count FROM servicos');
        if (servicosCount && servicosCount.count === 0) {
            console.log('Inserindo dados de exemplo...');

            const servicos = [
                ['Corte Normal', 15.00, 30, 'Corte clássico com acabamento perfeito', '✂️'],
                ['Degradê', 20.00, 40, 'Degradê moderno com transição suave', '💇'],
                ['Barba', 12.00, 25, 'Aparagem e modelagem de barba', '🧔'],
                ['Corte + Barba', 25.00, 55, 'Combinação de corte e barba', '👔'],
                ['Tratamento Capilar', 30.00, 45, 'Hidratação e tratamento profissional', '💆']
            ];

            for (const servico of servicos) {
                await this.run(
                    'INSERT INTO servicos (nome, preco, tempo_estimado, descricao, icone) VALUES (?, ?, ?, ?, ?)',
                    servico
                );
            }

            const barbeiros = [
                ['Geraldo Sense', '4 anos de profissionalismo na área da barbearia', 'Cortes clássicos, Degradê, Barba, Styling', 'assets/barbeiros/geraldo-sense.jpg', '+351 960 075 690', 'sensegeraldo2@gmail.com', 1]
            ];

            for (const barbeiro of barbeiros) {
                await this.run(
                    'INSERT INTO barbeiros (nome, experiencia, especialidades, foto, telefone, email, principal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    barbeiro
                );
            }

            console.log('✓ Dados de exemplo inseridos');
        }

        const usersCount = await this.get('SELECT COUNT(*) as count FROM utilizadores');
        if (usersCount && usersCount.count === 0) {
            const adminHash = await bcrypt.hash('12sense12', 12);
            const barbeiroHash = await bcrypt.hash('barbeiro123', 12);

            const utilizadores = [
                ['Sense Barbershop', 'sensebarber10@gmail.com', '+351960075690', adminHash, 'administrador', 1, 1],
                ['Geraldo Sense', 'sensegeraldo2@gmail.com', '+351960075690', barbeiroHash, 'barbeiro', 1, 1]
            ];

            for (const u of utilizadores) {
                await this.run(
                    `INSERT INTO utilizadores (nome, email, telefone, password_hash, perfil, ativo, email_confirmado)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    u
                );
            }

            console.log('✓ Utilizadores de exemplo criados (sensebarber10@gmail.com)');

            await this.run(
                'UPDATE utilizadores SET barbeiro_id = 1 WHERE email = ?',
                ['sensegeraldo2@gmail.com']
            );
        }
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

    async bumpSync(motivo = 'update') {
        const versao = String(Date.now());
        await this.run(
            `INSERT INTO configuracoes (chave, valor, atualizado_em) VALUES ('sync_version', ?, CURRENT_TIMESTAMP)
             ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = CURRENT_TIMESTAMP`,
            [versao]
        );
        return { versao, motivo };
    }

    async obterSync() {
        const row = await this.get(
            `SELECT valor, atualizado_em FROM configuracoes WHERE chave = 'sync_version'`
        );
        const servicos = await this.get(
            `SELECT COUNT(*) as total FROM servicos WHERE COALESCE(ativo, 1) = 1`
        );
        return {
            versao: row?.valor || '0',
            atualizado_em: row?.atualizado_em || null,
            servicos_ativos: servicos?.total || 0,
            db: path.basename(this.dbPath)
        };
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
