// ===== ROTAS DE BARBEIROS =====
const express = require('express');
const { verificarToken, verificarPerfil } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/barbeiros
 * Listar todos os barbeiros
 */
router.get('/', async (req, res) => {
    try {
        const { principal } = req.query;

        if (principal === '1') {
            const barbeiro = await req.db.get(
                `SELECT id, nome, experiencia, especialidades, foto, email, telefone, ativo, principal
                 FROM barbeiros WHERE ativo = 1 AND principal = 1
                 ORDER BY id LIMIT 1`
            ) || await req.db.get(
                `SELECT id, nome, experiencia, especialidades, foto, email, telefone, ativo, principal
                 FROM barbeiros WHERE ativo = 1 ORDER BY id LIMIT 1`
            );
            return res.json(barbeiro ? [barbeiro] : []);
        }

        const barbeiros = await req.db.all(
            `SELECT id, nome, experiencia, especialidades, foto, email, telefone, ativo, principal
             FROM barbeiros WHERE ativo = 1 ORDER BY principal DESC, nome`
        );
        res.json(barbeiros);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/barbeiros/:id
 * Obter barbeiro específico
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const barbeiro = await req.db.get(
            'SELECT id, nome, experiencia, especialidades, foto, email, telefone, ativo FROM barbeiros WHERE id = ? AND ativo = 1',
            [id]
        );

        if (!barbeiro) {
            return res.status(404).json({ erro: 'Barbeiro não encontrado' });
        }

        res.json(barbeiro);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/barbeiros/:id/agendamentos
 * Obter agendamentos de um barbeiro
 */
router.get('/:id/agendamentos', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.query;

        let sql = `
            SELECT a.id, a.cliente_nome, a.cliente_telefone, a.cliente_email, 
                   a.data, a.hora, a.status, s.nome as servico, s.preco
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            WHERE a.barbeiro_id = ? AND a.status = 'confirmado'
        `;
        let params = [id];

        if (data) {
            sql += ' AND a.data = ?';
            params.push(data);
        }

        sql += ' ORDER BY a.data, a.hora';

        const agendamentos = await req.db.all(sql, params);
        res.json(agendamentos);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/barbeiros
 * Criar novo barbeiro
 */
router.post('/', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { nome, experiencia, especialidades, foto, telefone, email, principal } = req.body;

        if (!nome) {
            return res.status(400).json({
                erro: 'Nome é obrigatório'
            });
        }

        const resultado = await req.db.run(
            'INSERT INTO barbeiros (nome, experiencia, especialidades, foto, telefone, email, principal) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nome, experiencia || '', especialidades || '', foto || 'assets/default-barbeiro.jpg', telefone || '', email || '', principal ? 1 : 0]
        );

        res.status(201).json({
            id: resultado.id,
            nome,
            experiencia,
            especialidades,
            foto,
            telefone,
            email,
            ativo: 1
        });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            res.status(400).json({ erro: 'Este barbeiro já existe' });
        } else {
            res.status(500).json({ erro: error.message });
        }
    }
});

/**
 * PUT /api/barbeiros/:id
 * Atualizar barbeiro
 */
router.put('/:id', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, experiencia, especialidades, foto, telefone, email, ativo } = req.body;

        // Verificar se barbeiro existe
        const barbeiro = await req.db.get('SELECT * FROM barbeiros WHERE id = ?', [id]);
        if (!barbeiro) {
            return res.status(404).json({ erro: 'Barbeiro não encontrado' });
        }

        await req.db.run(
            `UPDATE barbeiros SET 
             nome = COALESCE(?, nome),
             experiencia = COALESCE(?, experiencia),
             especialidades = COALESCE(?, especialidades),
             foto = COALESCE(?, foto),
             telefone = COALESCE(?, telefone),
             email = COALESCE(?, email),
             ativo = COALESCE(?, ativo)
             WHERE id = ?`,
            [nome, experiencia, especialidades, foto, telefone, email, ativo, id]
        );

        res.json({
            id,
            nome: nome || barbeiro.nome,
            experiencia: experiencia || barbeiro.experiencia,
            especialidades: especialidades || barbeiro.especialidades,
            foto: foto || barbeiro.foto,
            telefone: telefone || barbeiro.telefone,
            email: email || barbeiro.email,
            ativo: ativo !== undefined ? ativo : barbeiro.ativo
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * DELETE /api/barbeiros/:id
 * Deletar barbeiro (desativar)
 */
router.delete('/:id', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { id } = req.params;

        const barbeiro = await req.db.get('SELECT * FROM barbeiros WHERE id = ? AND ativo = 1', [id]);
        if (!barbeiro) {
            return res.status(404).json({ erro: 'Barbeiro não encontrado' });
        }

        const ativos = await req.db.get(
            'SELECT COUNT(*) as count FROM barbeiros WHERE ativo = 1'
        );
        if (ativos.count <= 1) {
            return res.status(400).json({
                erro: 'Não é possível eliminar o último barbeiro ativo da barbearia.'
            });
        }

        const futuros = await req.db.get(
            "SELECT COUNT(*) as count FROM agendamentos WHERE barbeiro_id = ? AND status = 'confirmado' AND data >= date('now')",
            [id]
        );

        let extra = '';
        if (futuros.count > 0) {
            await req.db.run(
                `UPDATE agendamentos SET status = 'cancelado', atualizado_em = datetime('now')
                 WHERE barbeiro_id = ? AND status = 'confirmado' AND data >= date('now')`,
                [id]
            );
            extra = ` ${futuros.count} marcação(ões) futura(s) cancelada(s).`;
        }

        await req.db.run('UPDATE barbeiros SET ativo = 0, principal = 0 WHERE id = ?', [id]);

        if (barbeiro.principal) {
            const proximo = await req.db.get(
                'SELECT id FROM barbeiros WHERE ativo = 1 ORDER BY id LIMIT 1'
            );
            if (proximo) {
                await req.db.run('UPDATE barbeiros SET principal = 0 WHERE ativo = 1');
                await req.db.run('UPDATE barbeiros SET principal = 1 WHERE id = ?', [proximo.id]);
            }
        }

        res.json({
            mensagem: `Barbeiro eliminado com sucesso.${extra}`,
            id
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/barbeiros/:id/disponibilidade
 * Obter disponibilidade de um barbeiro
 */
router.get('/:id/disponibilidade', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.query;

        if (!data) {
            return res.status(400).json({
                erro: 'Data é obrigatória'
            });
        }

        // Obter agendamentos do barbeiro para a data
        const agendamentos = await req.db.all(
            `SELECT hora FROM agendamentos 
             WHERE barbeiro_id = ? AND data = ? AND status = 'confirmado'
             ORDER BY hora`,
            [id, data]
        );

        // Horários disponíveis
        const horariosDisponiveis = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
            '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
        ];

        const horariosOcupados = agendamentos.map(a => a.hora);
        const horariosMarcados = horariosDisponiveis.filter(h => !horariosOcupados.includes(h));

        res.json({
            data,
            barbeiro_id: id,
            horarios_disponiveis: horariosMarcados,
            horarios_ocupados: horariosOcupados
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
