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
const { temBaseRemota } = require('./utils/libsql');
const { uploadsPersistentes, verificarCloudinaryAuth } = require('./utils/cloudinary');
const uploadsPath = resolverCaminhoUploads();
console.log(`✓ Uploads: ${uploadsPath}${uploadsPersistentes() ? ' (cloud)' : ' (local)'}`);

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
    const persistencia = diagnosticoPersistencia(db.dbPath, uploadsPath, {
        remota: !!(db.remote || db.persistente || temBaseRemota())
    });
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

    const cloudinary = await verificarCloudinaryAuth();
    const uploadsOk = cloudinary.auth_ok === true;

    let status = dbInfo?.integrity === 'ok' ? 'ok' : 'degraded';
    if (!persistencia.persistente && persistencia.render) status = 'critical';
    if (persistencia.persistente && cloudinary.configurado && !cloudinary.auth_ok) status = 'degraded';

    res.json({
        status,
        online: true,
        hora: new Date().toISOString(),
        frontend: fs.existsSync(publicPath) ? 'public' : 'dev',
        versao: require('./package.json').version,
        sync,
        database: dbInfo,
        uploads: uploadsPath,
        uploads_persistentes: uploadsOk,
        cloudinary,
        persistencia,
        acao_necessaria: persistencia.persistente && uploadsOk ? null : {
            titulo: 'Completar persistência',
            passos: [
                ...(persistencia.persistente ? [] : [
                    'Base de dados: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN'
                ]),
                ...(uploadsOk ? [] : [
                    'Fotos: Cloudinary → View API Keys → olho → copiar API environment variable',
                    'No Render: apague CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET',
                    'Adicione só CLOUDINARY_URL = cloudinary://API_KEY:API_SECRET@CLOUD_NAME',
                    'Save, rebuild and deploy'
                ])
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
        const persistencia = diagnosticoPersistencia(db.dbPath, uploadsPath, {
            remota: !!(db.remote || db.persistente || temBaseRemota())
        });
        if (!persistencia.persistente) {
            console.warn(`
╔══════════════════════════════════════════════════════════╗
║  ⚠️  DADOS NÃO PERSISTENTES — vão apagar-se no restart   ║
║  BD: ${db.dbPath}
║  ${(persistencia.avisos || []).join('\n║  ')}
║                                                          ║
║  Solução A (recomendada no Free): Turso (SQLite cloud)   ║
║    Env: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN            ║
║  Solução B (plano Starter+): Disk mount /var/data        ║
╚══════════════════════════════════════════════════════════╝
`);
        } else {
            console.log(`✓ BD persistente: ${persistencia.modo || db.dbPath}`);
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
