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

        if (!nome || !preco || !tempo) {
            return res.status(400).json({
                erro: 'Nome, preço e tempo são obrigatórios'
            });
        }

        const resultado = await req.db.run(
            'INSERT INTO servicos (nome, preco, tempo_estimado, descricao, icone, imagem, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [nome, preco, tempo, descricao || '', icon || '✂️', imagem || null]
        );

        res.status(201).json({
            id: resultado.id,
            nome,
            preco,
            tempo,
            descricao,
            icon: icon || '✂️',
            imagem: imagem || null
        });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            res.status(400).json({ erro: 'Este serviço já existe' });
        } else {
            res.status(500).json({ erro: error.message });
        }
    }
});

/**
 * PUT /api/servicos/:id
 * Atualizar serviço
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

        await req.db.run(
            `UPDATE servicos SET 
             nome = COALESCE(?, nome),
             preco = COALESCE(?, preco),
             tempo_estimado = COALESCE(?, tempo_estimado),
             descricao = COALESCE(?, descricao),
             icone = COALESCE(?, icone),
             imagem = COALESCE(?, imagem)
             WHERE id = ?`,
            [nome, preco, tempo, descricao, icon, imagem, id]
        );

        res.json({
            id,
            nome: nome || servico.nome,
            preco: preco || servico.preco,
            tempo: tempo || servico.tempo_estimado,
            descricao: descricao || servico.descricao,
            icon: icon || servico.icone,
            imagem: imagem || servico.imagem
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * DELETE /api/servicos/:id
 * Deletar serviço
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

        await req.db.run('UPDATE servicos SET ativo = 0 WHERE id = ?', [id]);

        res.json({
            mensagem: 'Serviço eliminado com sucesso',
            id
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
