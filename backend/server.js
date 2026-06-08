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

// ===== CONFIGURAÇÃO DA APLICAÇÃO =====
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== INICIALIZAR BANCO DE DADOS =====
const db = new Database();
db.initialize();

// ===== PASSAR DB PARA ROTAS =====
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ===== FRONTEND (mesmo servidor = sem erro de ligação) =====
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ===== ROTAS API =====
app.use('/api/servicos', servicosRoutes);
app.use('/api/barbeiros', barbeirosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/galeria', galeriaRoutes);

// ===== ROTA DE TESTE =====
app.get('/api', (req, res) => {
    res.json({
        mensagem: 'API da Barbearia Sense',
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
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║  🧔 Barbearia Sense - Backend         ║
    ║  Servidor iniciado em porta ${PORT}       ║
    ║  URL: http://localhost:${PORT}              ║
    ╚═══════════════════════════════════════╝
    `);
});

module.exports = app;
