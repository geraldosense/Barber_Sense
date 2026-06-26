const express = require('express');
const { verificarToken, verificarPerfil } = require('../middleware/auth');

const router = express.Router();

const METODOS_PADRAO = {
    mbway: {
        ativo: true,
        label: 'MB WAY',
        icon: 'fa-mobile-alt',
        tipo: 'telefone',
        telefone: '+351 960 075 690',
        conta: '+351 960 075 690',
        iban: null,
        instrucao: 'Receberá um pedido MB WAY no telemóvel. O pagamento é creditado na conta Sense Barbershop.'
    },
    cartao: {
        ativo: false,
        label: 'Cartão de crédito',
        icon: 'fa-cc-visa',
        tipo: 'gateway',
        telefone: '+351 960 075 690',
        instrucao: 'Visa, Mastercard e American Express.'
    },
    apple_pay: {
        ativo: false,
        label: 'Apple Pay',
        icon: 'fa-apple-pay',
        tipo: 'gateway',
        instrucao: 'Pagamento rápido com Apple Pay.'
    },
    paypal: {
        ativo: true,
        label: 'PayPal',
        icon: 'fa-paypal',
        tipo: 'gateway',
        email: 'sensegeraldo2@gmail.com',
        instrucao: 'Pagamento seguro via PayPal Business.'
    },
    klarna: {
        ativo: false,
        label: 'Klarna',
        icon: 'fa-wallet',
        tipo: 'gateway',
        instrucao: 'Pague em 3 prestações sem juros.'
    },
    visa: {
        ativo: true,
        label: 'Visa',
        icon: 'fa-cc-visa',
        tipo: 'gateway',
        telefone: '+351 960 075 690',
        instrucao: 'Pagamento seguro com cartão Visa.'
    },
    revolut: {
        ativo: true,
        label: 'Revolut',
        icon: 'fa-wallet',
        tipo: 'iban',
        telefone: '+351 960 075 690',
        conta: 'PT50356000019001855789603',
        iban: 'PT50356000019001855789603',
        instrucao: 'Efetue o pagamento pela app Revolut ou MB Way.'
    }
};

function metodosAtivos(metodos) {
    return Object.fromEntries(
        Object.entries(metodos).filter(([, m]) => m.ativo !== false)
    );
}

function normalizarMetodos(raw) {
    const resultado = {};
    for (const [key, padrao] of Object.entries(METODOS_PADRAO)) {
        resultado[key] = { ...padrao, ...(raw?.[key] || {}) };
        resultado[key].ativo = resultado[key].ativo !== false;
    }
    return resultado;
}

/** Dados seguros para o frontend do cliente — sem IBAN */
function metodosParaCliente(metodos) {
    const ativos = metodosAtivos(metodos);
    const resultado = {};

    for (const [key, m] of Object.entries(ativos)) {
        resultado[key] = {
            label: m.label,
            icon: m.icon,
            instrucao: m.instrucao,
            telefone: m.telefone || '+351 960 075 690'
        };
        if (key === 'mbway') {
            resultado[key].destino = m.telefone || m.conta;
        }
        if (key === 'paypal' && m.email) {
            resultado[key].email_destino = m.email;
        }
    }
    return resultado;
}

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
 * GET /api/config/pagamentos — apenas dados visíveis ao cliente
 */
const METODOS_CHECKOUT = ['mbway', 'visa', 'paypal', 'revolut'];

router.get('/pagamentos', async (req, res) => {
    try {
        const metodos = normalizarMetodos(await obterConfig(req.db, 'metodos_pagamento', METODOS_PADRAO));
        for (const key of METODOS_CHECKOUT) {
            if (metodos[key]) metodos[key].ativo = true;
        }
        res.json({ metodos: metodosParaCliente(metodos) });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * PUT /api/config/pagamentos — reservado (contas fixas no servidor)
 */
router.put('/pagamentos', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    res.status(403).json({ erro: 'Os métodos de pagamento são geridos automaticamente pelo sistema.' });
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
module.exports.METODOS_PADRAO = METODOS_PADRAO;
module.exports.normalizarMetodos = normalizarMetodos;
