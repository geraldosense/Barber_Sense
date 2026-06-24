const express = require('express');
const { verificarToken, verificarPerfil } = require('../middleware/auth');

const router = express.Router();

const METODOS_PADRAO = {
    mbway: { ativo: true, label: 'MB Way', icon: 'fa-mobile-alt' },
    visa: { ativo: true, label: 'Cartão Visa', icon: 'fa-cc-visa' },
    revolut: { ativo: true, label: 'Revolut', icon: 'fa-wallet' },
    paypal: { ativo: true, label: 'PayPal', icon: 'fa-paypal' },
    santander: { ativo: true, label: 'Santander', icon: 'fa-university' }
};

async function obterConfig(db, chave, padrao) {
    const row = await db.get('SELECT valor FROM configuracoes WHERE chave = ?', [chave]);
    if (!row?.valor) return padrao;
    try {
        return JSON.parse(row.valor);
    } catch {
        return padrao;
    }
}

async function guardarConfig(db, chave, valor) {
    await db.run(
        `INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
         ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
        [chave, JSON.stringify(valor)]
    );
}

/**
 * GET /api/config/pagamentos
 */
router.get('/pagamentos', async (req, res) => {
    try {
        const metodos = await obterConfig(req.db, 'metodos_pagamento', METODOS_PADRAO);
        res.json({ metodos });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * PUT /api/config/pagamentos
 */
router.put('/pagamentos', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { metodos } = req.body;
        if (!metodos || typeof metodos !== 'object') {
            return res.status(400).json({ erro: 'Dados de pagamento inválidos.' });
        }
        await guardarConfig(req.db, 'metodos_pagamento', metodos);
        res.json({ mensagem: 'Métodos de pagamento atualizados.', metodos });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/config/site — dados públicos do negócio
 */
router.get('/site', async (req, res) => {
    try {
        const site = await obterConfig(req.db, 'site_info', {
            telefone: '+351 960 075 690',
            email: 'sensegeraldo2@gmail.com',
            morada: 'Rua Principal, Caminho Nossa Senhora da Luz n6',
            instagram: 'https://www.instagram.com/geraldo_sense/?hl=pt',
            facebook: 'https://www.facebook.com/people/Geraldo-De-Assun%C3%A7%C3%A3o/pfbid0EZsz9R6EauiSC1JbNyjtnJEh8BsPz21VbpjJB8gwT3FhUw7QJzhTi6FU5Y825esvl/',
            whatsapp: 'https://wa.me/+351960075690'
        });
        res.json(site);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * PUT /api/config/site
 */
router.put('/site', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const atual = await obterConfig(req.db, 'site_info', {});
        const novo = { ...atual, ...req.body };
        await guardarConfig(req.db, 'site_info', novo);
        res.json({ mensagem: 'Informações do site atualizadas.', site: novo });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
