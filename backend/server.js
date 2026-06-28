// ===== IMPORTAÇÕES =====
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
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
const frontendPath = path.join(__dirname, '..', 'frontend');
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(frontendPath));

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

// ===== ROTA DE SAÚDE =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', online: true, hora: new Date().toISOString() });
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
