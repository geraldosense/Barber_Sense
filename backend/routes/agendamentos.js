// ===== ROTAS DE AGENDAMENTOS =====
const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, verificarToken } = require('../middleware/auth');

const router = express.Router();

function authOpcional(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return next();
    try {
        req.utilizador = jwt.verify(header.split(' ')[1], JWT_SECRET);
    } catch {
        /* ignora token inválido em rotas públicas */
    }
    next();
}

function agendamentoNoFuturo(agendamento) {
    const [y, m, d] = agendamento.data.split('-').map(Number);
    const [hh, mm] = agendamento.hora.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mm);
    return dt > new Date();
}

function validarDataAgendamento(data) {
    const dataObj = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataObj < hoje) {
        return 'Não é possível agendar para datas no passado';
    }
    if (dataObj.getDay() === 0) {
        return 'A barbearia está fechada no domingo';
    }
    return null;
}

async function carregarAgendamentoDono(req, res, next) {
    try {
        const agendamento = await req.db.get('SELECT * FROM agendamentos WHERE id = ?', [req.params.id]);
        if (!agendamento) {
            return res.status(404).json({ erro: 'Agendamento não encontrado' });
        }

        req.agendamento = agendamento;

        if (req.utilizador.perfil === 'administrador') {
            return next();
        }

        if (req.utilizador.perfil === 'cliente') {
            if (agendamento.cliente_email !== req.utilizador.email) {
                return res.status(403).json({ erro: 'Não pode alterar esta marcação.' });
            }
            if (agendamento.status !== 'confirmado') {
                return res.status(400).json({ erro: 'Só pode alterar marcações confirmadas.' });
            }
            if (!agendamentoNoFuturo(agendamento)) {
                return res.status(400).json({ erro: 'Não pode alterar marcações passadas.' });
            }
            return next();
        }

        return res.status(403).json({ erro: 'Acesso não autorizado.' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
}

/**
 * GET /api/agendamentos
 * Listar agendamentos com filtros
 */
router.get('/', async (req, res) => {
    try {
        const { email, data, barbeiro_id, status } = req.query;
        
        let sql = `
            SELECT a.id, a.servico_id, a.barbeiro_id, a.cliente_nome, 
                   a.cliente_telefone, a.cliente_email, a.data, a.hora, 
                   a.status, a.criado_em, a.metodo_pagamento, a.referencia_pagamento, a.valor_pago,
                   s.nome as servico_nome, s.preco, s.tempo_estimado,
                   b.nome as barbeiro_nome
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            JOIN barbeiros b ON a.barbeiro_id = b.id
            WHERE 1=1
        `;
        let params = [];

        if (email) {
            sql += ' AND a.cliente_email = ?';
            params.push(email);
        }

        if (data) {
            sql += ' AND a.data = ?';
            params.push(data);
        }

        if (barbeiro_id) {
            sql += ' AND a.barbeiro_id = ?';
            params.push(barbeiro_id);
        }

        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY a.data DESC, a.hora DESC';

        const agendamentos = await req.db.all(sql, params);

        // Formatar resposta
        const resultado = agendamentos.map(a => ({
            id: a.id,
            servico: {
                id: a.servico_id,
                nome: a.servico_nome,
                preco: a.preco,
                tempo: a.tempo_estimado
            },
            barbeiro: {
                id: a.barbeiro_id,
                nome: a.barbeiro_nome
            },
            nome: a.cliente_nome,
            telefone: a.cliente_telefone,
            email: a.cliente_email,
            data: a.data,
            hora: a.hora,
            status: a.status,
            metodo_pagamento: a.metodo_pagamento,
            referencia_pagamento: a.referencia_pagamento,
            valor_pago: a.valor_pago,
            criado_em: a.criado_em
        }));

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/agendamentos/verificar
 * Verificar disponibilidade de horário
 */
router.get('/verificar', async (req, res) => {
    try {
        const { data, hora, barbeiro_id } = req.query;

        if (!data || !hora || !barbeiro_id) {
            return res.status(400).json({
                erro: 'Data, hora e barbeiro_id são obrigatórios'
            });
        }

        const ocupado = await req.db.get(
            'SELECT * FROM agendamentos WHERE barbeiro_id = ? AND data = ? AND hora = ? AND status = "confirmado"',
            [barbeiro_id, data, hora]
        );

        res.json({
            data,
            hora,
            barbeiro_id,
            disponivel: !ocupado
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/agendamentos/ocupados
 * Obter horários ocupados
 */
router.get('/ocupados', async (req, res) => {
    try {
        const { data, barbeiro_id, excluir_id } = req.query;

        if (!data || !barbeiro_id) {
            return res.status(400).json({
                erro: 'Data e barbeiro_id são obrigatórios'
            });
        }

        let sql = 'SELECT hora FROM agendamentos WHERE barbeiro_id = ? AND data = ? AND status = "confirmado"';
        const params = [barbeiro_id, data];

        if (excluir_id) {
            sql += ' AND id != ?';
            params.push(excluir_id);
        }

        sql += ' ORDER BY hora';

        const horariosOcupados = await req.db.all(sql, params);

        res.json({
            data,
            barbeiro_id,
            horarios: horariosOcupados.map(h => h.hora)
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/agendamentos/:id
 * Obter agendamento específico
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const agendamento = await req.db.get(
            `SELECT a.id, a.servico_id, a.barbeiro_id, a.cliente_nome, 
                    a.cliente_telefone, a.cliente_email, a.data, a.hora, 
                    a.status, a.observacoes, a.criado_em,
                    s.nome as servico_nome, s.preco, s.tempo_estimado,
                    b.nome as barbeiro_nome
             FROM agendamentos a
             JOIN servicos s ON a.servico_id = s.id
             JOIN barbeiros b ON a.barbeiro_id = b.id
             WHERE a.id = ?`,
            [id]
        );

        if (!agendamento) {
            return res.status(404).json({ erro: 'Agendamento não encontrado' });
        }

        const resultado = {
            id: agendamento.id,
            servico: {
                id: agendamento.servico_id,
                nome: agendamento.servico_nome,
                preco: agendamento.preco,
                tempo: agendamento.tempo_estimado
            },
            barbeiro: {
                id: agendamento.barbeiro_id,
                nome: agendamento.barbeiro_nome
            },
            nome: agendamento.cliente_nome,
            telefone: agendamento.cliente_telefone,
            email: agendamento.cliente_email,
            data: agendamento.data,
            hora: agendamento.hora,
            status: agendamento.status,
            observacoes: agendamento.observacoes,
            criado_em: agendamento.criado_em
        };

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/agendamentos
 * Criar novo agendamento
 */
router.post('/', authOpcional, async (req, res) => {
    try {
        const { servico_id, barbeiro_id, data, hora, nome, telefone, email, metodo_pagamento, referencia_pagamento, valor_pago, detalhes_pagamento } = req.body;

        // Validar campos obrigatórios
        if (!servico_id || !barbeiro_id || !data || !hora || !nome || !telefone || !email) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios'
            });
        }

        if (req.utilizador?.perfil === 'cliente' && req.utilizador.email !== email.toLowerCase().trim()) {
            return res.status(403).json({ erro: 'Só pode agendar com o email da sua conta.' });
        }

        const servico = await req.db.get('SELECT * FROM servicos WHERE id = ?', [servico_id]);
        const barbeiro = await req.db.get('SELECT * FROM barbeiros WHERE id = ?', [barbeiro_id]);

        if (!servico) {
            return res.status(404).json({ erro: 'Serviço não encontrado' });
        }

        if (!barbeiro) {
            return res.status(404).json({ erro: 'Barbeiro não encontrado' });
        }

        const metodosValidos = ['mbway', 'visa', 'revolut', 'cartao', 'apple_pay', 'paypal', 'klarna'];
        if (!metodo_pagamento || !metodosValidos.includes(metodo_pagamento)) {
            return res.status(400).json({ erro: 'Selecione um método de pagamento válido.' });
        }

        const valorPago = parseFloat(valor_pago);
        if (Number.isNaN(valorPago) || valorPago <= 0) {
            return res.status(400).json({ erro: 'Indique o valor do pagamento.' });
        }

        const precoEsperado = parseFloat(servico.preco);
        if (Math.abs(valorPago - precoEsperado) > 0.01) {
            return res.status(400).json({
                erro: `O valor pago (${valorPago.toFixed(2)}€) não corresponde ao preço do corte (${precoEsperado.toFixed(2)}€).`
            });
        }

        // Verificar se horário já está ocupado
        const horarioOcupado = await req.db.get(
            'SELECT * FROM agendamentos WHERE barbeiro_id = ? AND data = ? AND hora = ? AND status = "confirmado"',
            [barbeiro_id, data, hora]
        );

        if (horarioOcupado) {
            return res.status(409).json({
                erro: 'Este horário já está ocupado para este barbeiro'
            });
        }

        // Validar data (não no passado)
        const dataObj = new Date(data);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (dataObj < hoje) {
            return res.status(400).json({
                erro: 'Não é possível agendar para datas no passado'
            });
        }

        // Validar domingo (fechado)
        if (dataObj.getDay() === 0) {
            return res.status(400).json({
                erro: 'A barbearia está fechada no domingo'
            });
        }

        const nomeReferencia = (referencia_pagamento || nome || '').trim();
        if (req.utilizador?.perfil === 'cliente' && nomeReferencia) {
            const nomeConta = (req.utilizador.nome || '').trim();
            if (nomeConta && nomeReferencia.toLowerCase() !== nomeConta.toLowerCase()) {
                return res.status(400).json({
                    erro: 'A referência de pagamento deve corresponder ao nome da sua conta.'
                });
            }
        }

        // Criar agendamento
        const usuarioId = req.utilizador?.id || null;
        let observacoes = null;
        if (detalhes_pagamento && typeof detalhes_pagamento === 'object') {
            observacoes = JSON.stringify({ detalhes_pagamento });
        }

        const resultado = await req.db.run(
            `INSERT INTO agendamentos 
             (servico_id, barbeiro_id, cliente_nome, cliente_telefone, cliente_email, data, hora, status, usuario_id, metodo_pagamento, referencia_pagamento, valor_pago, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmado', ?, ?, ?, ?, ?)`,
            [servico_id, barbeiro_id, nome, telefone, email.toLowerCase().trim(), data, hora, usuarioId, metodo_pagamento, nomeReferencia || nome, valorPago, observacoes]
        );

        // Retornar agendamento completo
        const agendamento = {
            id: resultado.id,
            servico: {
                id: servico.id,
                nome: servico.nome,
                preco: servico.preco,
                tempo: servico.tempo_estimado
            },
            barbeiro: {
                id: barbeiro.id,
                nome: barbeiro.nome
            },
            nome,
            telefone,
            email,
            data,
            hora,
            status: 'confirmado',
            metodo_pagamento: metodo_pagamento,
            referencia_pagamento: nomeReferencia || nome,
            valor_pago: valorPago
        };

        res.status(201).json(agendamento);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * PUT /api/agendamentos/:id
 * Atualizar agendamento
 */
router.put('/:id', verificarToken, carregarAgendamentoDono, async (req, res) => {
    try {
        const { id } = req.params;
        const agendamento = req.agendamento;
        const { servico_id, barbeiro_id, data, hora, nome, telefone, email, status, observacoes } = req.body;

        const novoServicoId = servico_id || agendamento.servico_id;
        const novoBarbeiroId = barbeiro_id || agendamento.barbeiro_id;
        const novaData = data || agendamento.data;
        const novaHora = hora || agendamento.hora;

        const erroData = validarDataAgendamento(novaData);
        if (erroData) {
            return res.status(400).json({ erro: erroData });
        }

        const servico = await req.db.get('SELECT * FROM servicos WHERE id = ? AND COALESCE(ativo, 1) = 1', [novoServicoId]);
        if (!servico) {
            return res.status(404).json({ erro: 'Serviço não encontrado' });
        }

        const barbeiro = await req.db.get('SELECT * FROM barbeiros WHERE id = ? AND COALESCE(ativo, 1) = 1', [novoBarbeiroId]);
        if (!barbeiro) {
            return res.status(404).json({ erro: 'Barbeiro não encontrado' });
        }

        const horarioOcupado = await req.db.get(
            'SELECT * FROM agendamentos WHERE barbeiro_id = ? AND data = ? AND hora = ? AND id != ? AND status = "confirmado"',
            [novoBarbeiroId, novaData, novaHora, id]
        );

        if (horarioOcupado) {
            return res.status(409).json({ erro: 'Este horário já está ocupado' });
        }

        const valorPago = parseFloat(servico.preco);
        const nomeCliente = req.utilizador.perfil === 'cliente'
            ? agendamento.cliente_nome
            : (nome || agendamento.cliente_nome);
        const telefoneCliente = req.utilizador.perfil === 'cliente'
            ? agendamento.cliente_telefone
            : (telefone || agendamento.cliente_telefone);
        const emailCliente = req.utilizador.perfil === 'cliente'
            ? agendamento.cliente_email
            : (email || agendamento.cliente_email);
        const novoStatus = req.utilizador.perfil === 'cliente'
            ? agendamento.status
            : (status || agendamento.status);

        await req.db.run(
            `UPDATE agendamentos SET 
             servico_id = ?,
             barbeiro_id = ?,
             data = ?,
             hora = ?,
             cliente_nome = ?,
             cliente_telefone = ?,
             cliente_email = ?,
             status = ?,
             observacoes = COALESCE(?, observacoes),
             valor_pago = ?,
             atualizado_em = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                novoServicoId,
                novoBarbeiroId,
                novaData,
                novaHora,
                nomeCliente,
                telefoneCliente,
                emailCliente,
                novoStatus,
                observacoes,
                valorPago,
                id
            ]
        );

        const atualizado = await req.db.get(
            `SELECT a.id, a.servico_id, a.barbeiro_id, a.cliente_nome, a.cliente_telefone,
                    a.cliente_email, a.data, a.hora, a.status, a.valor_pago,
                    s.nome as servico_nome, s.preco, s.tempo_estimado,
                    b.nome as barbeiro_nome
             FROM agendamentos a
             JOIN servicos s ON a.servico_id = s.id
             JOIN barbeiros b ON a.barbeiro_id = b.id
             WHERE a.id = ?`,
            [id]
        );

        res.json({
            mensagem: 'Marcação atualizada com sucesso',
            id,
            servico: {
                id: atualizado.servico_id,
                nome: atualizado.servico_nome,
                preco: atualizado.preco,
                tempo: atualizado.tempo_estimado
            },
            barbeiro: {
                id: atualizado.barbeiro_id,
                nome: atualizado.barbeiro_nome
            },
            nome: atualizado.cliente_nome,
            telefone: atualizado.cliente_telefone,
            email: atualizado.cliente_email,
            data: atualizado.data,
            hora: atualizado.hora,
            status: atualizado.status,
            valor_pago: atualizado.valor_pago
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * DELETE /api/agendamentos/:id
 * Cancelar agendamento
 */
router.delete('/:id', verificarToken, carregarAgendamentoDono, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body || {};

        await req.db.run(
            'UPDATE agendamentos SET status = "cancelado", atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        if (motivo) {
            await req.db.run(
                'INSERT INTO cancelamentos (agendamento_id, motivo) VALUES (?, ?)',
                [id, motivo]
            );
        }

        res.json({
            mensagem: 'Marcação cancelada com sucesso',
            id
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
