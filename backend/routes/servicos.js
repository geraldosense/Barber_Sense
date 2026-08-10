// ===== ROTAS DE SERVIÇOS =====
const express = require('express');
const { verificarToken, verificarPerfil } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/servicos
 * Listar todos os serviços
 */
router.get('/', async (req, res) => {
    try {
        const servicos = await req.db.all(
            `SELECT id, nome, preco, tempo_estimado as tempo, descricao, icone as icon, imagem
             FROM servicos WHERE COALESCE(ativo, 1) = 1 ORDER BY nome`
        );
        res.json(servicos);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/servicos/:id
 * Obter serviço específico
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const servico = await req.db.get(
            `SELECT id, nome, preco, tempo_estimado as tempo, descricao, icone as icon, imagem
             FROM servicos WHERE id = ? AND COALESCE(ativo, 1) = 1`,
            [id]
        );

        if (!servico) {
            return res.status(404).json({ erro: 'Serviço não encontrado' });
        }

        res.json(servico);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/servicos
 * Criar novo serviço
 */
router.post('/', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { nome, preco, tempo, descricao, icon, imagem } = req.body;

        if (!nome || preco === undefined || preco === null || !tempo) {
            return res.status(400).json({
                erro: 'Nome, preço e tempo são obrigatórios'
            });
        }

        const resultado = await req.db.run(
            'INSERT INTO servicos (nome, preco, tempo_estimado, descricao, icone, imagem, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [nome, Number(preco), Number(tempo), descricao || '', icon || '✂️', imagem || null]
        );

        await req.db.bumpSync('servico_criar');

        res.status(201).json({
            id: resultado.id,
            nome,
            preco: Number(preco),
            tempo: Number(tempo),
            descricao: descricao || '',
            icon: icon || '✂️',
            imagem: imagem || null
        });
    } catch (error) {
        if (String(error.message || '').includes('UNIQUE')) {
            res.status(400).json({ erro: 'Este serviço já existe' });
        } else {
            res.status(500).json({ erro: error.message });
        }
    }
});

/**
 * PUT /api/servicos/:id
 * Atualizar serviço (apenas campos enviados)
 */
router.put('/:id', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, preco, tempo, descricao, icon, imagem } = req.body;

        const servico = await req.db.get(
            'SELECT * FROM servicos WHERE id = ? AND COALESCE(ativo, 1) = 1',
            [id]
        );
        if (!servico) {
            return res.status(404).json({ erro: 'Serviço não encontrado' });
        }

        const campos = [];
        const valores = [];

        if (nome !== undefined && nome !== null) {
            campos.push('nome = ?');
            valores.push(String(nome).trim());
        }
        if (preco !== undefined && preco !== null && preco !== '') {
            campos.push('preco = ?');
            valores.push(Number(preco));
        }
        if (tempo !== undefined && tempo !== null && tempo !== '') {
            campos.push('tempo_estimado = ?');
            valores.push(Number(tempo));
        }
        if (descricao !== undefined) {
            campos.push('descricao = ?');
            valores.push(descricao);
        }
        if (icon !== undefined) {
            campos.push('icone = ?');
            valores.push(icon);
        }
        if (imagem !== undefined) {
            campos.push('imagem = ?');
            valores.push(imagem);
        }

        if (!campos.length) {
            return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
        }

        valores.push(id);
        await req.db.run(
            `UPDATE servicos SET ${campos.join(', ')} WHERE id = ?`,
            valores
        );

        await req.db.bumpSync('servico_atualizar');

        const atualizado = await req.db.get(
            `SELECT id, nome, preco, tempo_estimado as tempo, descricao, icone as icon, imagem
             FROM servicos WHERE id = ?`,
            [id]
        );

        res.json(atualizado || {
            id: Number(id),
            nome: nome ?? servico.nome,
            preco: preco !== undefined ? Number(preco) : servico.preco,
            tempo: tempo !== undefined ? Number(tempo) : servico.tempo_estimado,
            descricao: descricao ?? servico.descricao,
            icon: icon ?? servico.icone,
            imagem: imagem ?? servico.imagem
        });
    } catch (error) {
        if (String(error.message || '').includes('UNIQUE')) {
            return res.status(400).json({ erro: 'Já existe um serviço com este nome.' });
        }
        res.status(500).json({ erro: error.message });
    }
});

/**
 * DELETE /api/servicos/:id
 * Eliminar serviço (soft-delete; fallback hard-delete)
 */
router.delete('/:id', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { id } = req.params;

        const servico = await req.db.get(
            'SELECT * FROM servicos WHERE id = ? AND COALESCE(ativo, 1) = 1',
            [id]
        );
        if (!servico) {
            return res.status(404).json({ erro: 'Serviço não encontrado' });
        }

        try {
            await req.db.run('UPDATE servicos SET ativo = 0 WHERE id = ?', [id]);
        } catch (err) {
            // Bases antigas sem coluna ativo
            if (String(err.message || '').toLowerCase().includes('no such column')) {
                await req.db.run('DELETE FROM servicos WHERE id = ?', [id]);
            } else {
                throw err;
            }
        }

        await req.db.bumpSync('servico_eliminar');

        res.json({
            mensagem: 'Serviço eliminado com sucesso',
            id: Number(id)
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
