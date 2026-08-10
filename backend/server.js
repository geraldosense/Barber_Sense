// ===== IMPORTAÇÕES =====
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Database = require('./database/database');
const servicosRoutes = require('./routes/servicos');
const barbeirosRoutes = require('./routes/barbeiros');
const agendamentosRoutes = require('./routes/agendamentos');
const emailRoutes = require('./routes/email');
const authRoutes = require('./routes/auth');
const galeriaRoutes = require('./routes/galeria');
const uploadRoutes = require('./routes/upload');
const configRoutes = require('./routes/config');
const pagamentosRoutes = require('./routes/pagamentos');
const syncRoutes = require('./routes/sync');

// ===== CONFIGURAÇÃO DA APLICAÇÃO =====
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== INICIALIZAR BANCO DE DADOS =====
const db = new Database();

// ===== PASSAR DB PARA ROTAS =====
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ===== FRONTEND (mesmo servidor = sem erro de ligação) =====
const publicPath = path.join(__dirname, 'public');
const devFrontendPath = path.join(__dirname, '..', 'frontend');
const frontendPath = fs.existsSync(publicPath) ? publicPath : devFrontendPath;
const { resolverCaminhoUploads, diagnosticoPersistencia } = require('./utils/paths');
const uploadsPath = resolverCaminhoUploads();
console.log(`✓ Uploads: ${uploadsPath}`);

app.use((req, res, next) => {
    if (/\.(html?|css|js)$/i.test(req.path) || req.path === '/') {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
});

app.use('/uploads', express.static(uploadsPath));
app.use(express.static(frontendPath, {
    setHeaders(res, filePath) {
        if (/\.(html?|css|js)$/i.test(filePath)) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// ===== ROTAS API =====
app.use('/api/servicos', servicosRoutes);
app.use('/api/barbeiros', barbeirosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/pagamentos', pagamentosRoutes);
app.use('/api/sync', syncRoutes);

// ===== ROTA DE SAÚDE =====
app.get('/api/health', async (req, res) => {
    let sync = null;
    let dbInfo = null;
    const persistencia = diagnosticoPersistencia(db.dbPath, uploadsPath);
    try {
        sync = await db.obterSync();
        const integrity = await db.get('PRAGMA integrity_check');
        const fk = await db.get('PRAGMA foreign_keys');
        const journal = await db.get('PRAGMA journal_mode');
        dbInfo = {
            path: db.dbPath,
            persistente: persistencia.persistente,
            integrity: integrity?.integrity_check || integrity,
            foreign_keys: fk?.foreign_keys,
            journal_mode: journal?.journal_mode,
            tabelas: {
                utilizadores: (await db.get('SELECT COUNT(*) as n FROM utilizadores'))?.n || 0,
                servicos: (await db.get('SELECT COUNT(*) as n FROM servicos'))?.n || 0,
                agendamentos: (await db.get('SELECT COUNT(*) as n FROM agendamentos'))?.n || 0,
                galeria: (await db.get('SELECT COUNT(*) as n FROM galeria'))?.n || 0,
                barbeiros: (await db.get('SELECT COUNT(*) as n FROM barbeiros'))?.n || 0
            }
        };
    } catch (err) {
        dbInfo = { erro: err.message, path: db.dbPath, persistente: persistencia.persistente };
    }

    const status = !persistencia.persistente && persistencia.render
        ? 'critical'
        : (dbInfo?.integrity === 'ok' ? 'ok' : 'degraded');

    res.json({
        status,
        online: true,
        hora: new Date().toISOString(),
        frontend: fs.existsSync(publicPath) ? 'public' : 'dev',
        versao: require('./package.json').version,
        sync,
        database: dbInfo,
        uploads: uploadsPath,
        persistencia,
        acao_necessaria: persistencia.persistente ? null : {
            titulo: 'Ativar disco persistente no Render',
            passos: [
                'Abra o serviço sense-barbershop no Render Dashboard',
                'Vá a Disks → Add Disk',
                'Mount path: /var/data | Size: 1 GB',
                'Environment → confirme DATABASE_PATH=/var/data/barbearia_sense.db',
                'Environment → confirme UPLOADS_PATH=/var/data/uploads e DATA_DIR=/var/data',
                'Guarde e aguarde o redeploy — depois /api/health deve mostrar persistente: true'
            ]
        }
    });
});

// ===== ROTA DE TESTE =====
app.get('/api', (req, res) => {
    res.json({
        mensagem: 'API da Sense Barbershop',
        versao: '1.0.0',
        status: 'Online'
    });
});

// ===== TRATAMENTO DE ERROS =====
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        erro: 'Erro interno do servidor',
        mensagem: err.message
    });
});

// ===== SPA — páginas HTML do frontend =====
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ erro: 'Rota não encontrada', mensagem: `${req.method} ${req.url}` });
    }
    const page = req.path.endsWith('.html') ? req.path.slice(1) : 'index.html';
    res.sendFile(path.join(frontendPath, page), (err) => {
        if (err) next();
    });
});

// ===== INICIAR SERVIDOR =====
db.initialize()
    .then(() => {
        const persistencia = diagnosticoPersistencia(db.dbPath, uploadsPath);
        if (!persistencia.persistente) {
            console.warn(`
╔══════════════════════════════════════════════════════════╗
║  ⚠️  DADOS NÃO PERSISTENTES — vão apagar-se no restart   ║
║  BD: ${db.dbPath}
║  ${(persistencia.avisos || []).join('\n║  ')}
║                                                          ║
║  Render → Disks → Add Disk → Mount path: /var/data       ║
║  Env: DATABASE_PATH=/var/data/barbearia_sense.db         ║
║       UPLOADS_PATH=/var/data/uploads                     ║
║       DATA_DIR=/var/data                                 ║
╚══════════════════════════════════════════════════════════╝
`);
        } else {
            console.log(`✓ BD persistente: ${db.dbPath}`);
        }

        app.listen(PORT, () => {
            console.log(`
    ╔═══════════════════════════════════════╗
    ║  🧔 Sense Barbershop - Backend         ║
    ║  Servidor iniciado em porta ${PORT}       ║
    ║  URL: http://localhost:${PORT}              ║
    ╚═══════════════════════════════════════╝
    `);
        });
    })
    .catch((err) => {
        console.error('Falha ao iniciar o servidor:', err);
        process.exit(1);
    });

module.exports = app;
