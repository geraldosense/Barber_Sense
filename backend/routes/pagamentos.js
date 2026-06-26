const express = require('express');
const { verificarToken } = require('../middleware/auth');
const { criarPedidoMbWay, MERCHANT_PHONE } = require('../utils/mbway');

const router = express.Router();

const SIMULACAO_TEMPO_MS = 12000;

/**
 * POST /api/pagamentos/mbway/pedido — envia pedido MB WAY ao telemóvel do cliente
 */
router.post('/mbway/pedido', verificarToken, async (req, res) => {
    try {
        const { telefone, indicativo, valor, referencia, descricao, email } = req.body;

        const pedido = await criarPedidoMbWay({
            telefone,
            indicativo,
            valor,
            referencia,
            descricao,
            email: email || req.utilizador?.email
        });

        const expira = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        await req.db.run(
            `INSERT INTO pagamentos_mbway (id, usuario_id, telefone_cliente, telefone_comerciante, valor, estado, referencia, simulado, provider, expira_em)
             VALUES (?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?)`,
            [
                pedido.id,
                req.utilizador?.id || null,
                pedido.telefone_cliente,
                pedido.telefone_comerciante,
                pedido.valor,
                referencia || req.utilizador?.nome || '',
                pedido.simulado ? 1 : 0,
                pedido.provider,
                expira
            ]
        );

        if (pedido.simulado) {
            const db = req.db;
            setTimeout(async () => {
                try {
                    await db.run(
                        `UPDATE pagamentos_mbway SET estado = 'confirmado', confirmado_em = datetime('now')
                         WHERE id = ? AND estado = 'pendente'`,
                        [pedido.id]
                    );
                } catch { /* silencioso */ }
            }, SIMULACAO_TEMPO_MS);
        }

        res.json({
            ...pedido,
            comerciante: MERCHANT_PHONE,
            instrucao: 'Abra a app MB WAY no telemóvel e confirme o pagamento quando receber a notificação ou SMS.'
        });
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

/**
 * GET /api/pagamentos/mbway/estado/:id — consultar confirmação MB WAY
 */
router.get('/mbway/estado/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const row = await req.db.get(
            'SELECT id, estado, telefone_cliente, valor, simulado, confirmado_em, expira_em FROM pagamentos_mbway WHERE id = ?',
            [id]
        );

        if (!row) {
            return res.status(404).json({ erro: 'Pedido MB WAY não encontrado.' });
        }

        if (row.estado === 'pendente' && new Date(row.expira_em) < new Date()) {
            await req.db.run(
                "UPDATE pagamentos_mbway SET estado = 'expirado' WHERE id = ?",
                [id]
            );
            row.estado = 'expirado';
        }

        res.json({
            id: row.id,
            estado: row.estado,
            telefone_cliente: row.telefone_cliente,
            valor: row.valor,
            simulado: !!row.simulado,
            confirmado: row.estado === 'confirmado',
            mensagem: row.estado === 'confirmado'
                ? 'Pagamento MB WAY confirmado com sucesso.'
                : row.estado === 'expirado'
                    ? 'Pedido MB WAY expirado. Tente novamente.'
                    : 'Aguarde confirmação no telemóvel (notificação ou SMS MB WAY).'
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/pagamentos/comerciante — dados públicos do destino MB WAY
 */
router.get('/comerciante', (_req, res) => {
    res.json({
        mbway: MERCHANT_PHONE,
        nome: 'Sense Barbershop'
    });
});

module.exports = router;
