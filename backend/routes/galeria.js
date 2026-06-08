const express = require('express');
const { verificarToken, verificarPerfil } = require('../middleware/auth');

const router = express.Router();

function formatarCorte(row) {
    return {
        id: row.id,
        titulo: row.titulo,
        tipo_corte: row.tipo_corte,
        descricao: row.descricao,
        imagem_url: row.imagem_url,
        video_url: row.video_url,
        duracao: row.duracao,
        status: row.status,
        barbeiro_id: row.barbeiro_id,
        barbeiro_nome: row.barbeiro_nome,
        usuario_id: row.usuario_id,
        autor_nome: row.autor_nome,
        criado_em: row.criado_em,
        publicado_em: row.publicado_em
    };
}

const SQL_BASE = `
    SELECT g.*, b.nome as barbeiro_nome, u.nome as autor_nome
    FROM galeria g
    LEFT JOIN barbeiros b ON b.id = g.barbeiro_id
    LEFT JOIN utilizadores u ON u.id = g.usuario_id
`;

/**
 * GET /api/galeria — cortes aprovados (público)
 */
router.get('/', async (req, res) => {
    try {
        const cortes = await req.db.all(
            `${SQL_BASE} WHERE g.status = 'aprovado' ORDER BY g.publicado_em DESC, g.criado_em DESC`
        );
        res.json(cortes.map(formatarCorte));
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/galeria/pendentes/count — contagem para badge (admin: todos; barbeiro: só os seus)
 */
router.get('/pendentes/count', verificarToken, verificarPerfil('barbeiro', 'administrador'), async (req, res) => {
    try {
        let sql = `${SQL_BASE} WHERE g.status = 'pendente'`;
        const params = [];

        // Badge do admin = todos os cortes a aprovar; barbeiro = apenas os seus
        if (req.utilizador.perfil === 'barbeiro') {
            sql += ' AND g.usuario_id = ?';
            params.push(req.utilizador.id);
        }

        const rows = await req.db.all(sql, params);
        res.json({ total: rows.length });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/galeria/pendentes — lista pendentes
 */
router.get('/pendentes', verificarToken, verificarPerfil('barbeiro', 'administrador'), async (req, res) => {
    try {
        let sql = `${SQL_BASE} WHERE g.status = 'pendente'`;
        const params = [];

        if (req.utilizador.perfil === 'barbeiro') {
            sql += ' AND g.usuario_id = ?';
            params.push(req.utilizador.id);
        }

        sql += ' ORDER BY g.criado_em DESC';

        const cortes = await req.db.all(sql, params);
        res.json(cortes.map(formatarCorte));
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/galeria — publicar novo corte (fica pendente)
 */
router.post('/', verificarToken, verificarPerfil('barbeiro', 'administrador'), async (req, res) => {
    try {
        const { titulo, tipo_corte, descricao, imagem_url, video_url, duracao } = req.body;

        if (!titulo || !tipo_corte) {
            return res.status(400).json({ erro: 'Título e tipo de corte são obrigatórios.' });
        }

        const utilizador = await req.db.get(
            'SELECT id, barbeiro_id, perfil FROM utilizadores WHERE id = ?',
            [req.utilizador.id]
        );

        let barbeiroId = utilizador.barbeiro_id;

        if (!barbeiroId && utilizador.perfil === 'barbeiro') {
            const barbeiro = await req.db.get(
                'SELECT id FROM barbeiros WHERE email = ?',
                [req.utilizador.email]
            );
            barbeiroId = barbeiro?.id || null;
        }

        const status = utilizador.perfil === 'administrador' ? 'aprovado' : 'pendente';
        const publicadoEm = status === 'aprovado' ? new Date().toISOString() : null;

        const resultado = await req.db.run(
            `INSERT INTO galeria (barbeiro_id, usuario_id, titulo, tipo_corte, descricao, imagem_url, video_url, duracao, status, publicado_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                barbeiroId,
                req.utilizador.id,
                titulo.trim(),
                tipo_corte.trim(),
                descricao?.trim() || '',
                imagem_url?.trim() || '',
                video_url?.trim() || '',
                duracao?.trim() || '',
                status,
                publicadoEm
            ]
        );

        const corte = await req.db.get(`${SQL_BASE} WHERE g.id = ?`, [resultado.id]);

        res.status(201).json({
            mensagem: status === 'aprovado'
                ? 'Corte publicado com sucesso!'
                : 'Corte submetido! Aguarda aprovação do administrador.',
            corte: formatarCorte(corte)
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/galeria/:id/aprovar — administrador aprova
 */
router.post('/:id/aprovar', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { id } = req.params;

        const corte = await req.db.get('SELECT * FROM galeria WHERE id = ? AND status = ?', [id, 'pendente']);
        if (!corte) {
            return res.status(404).json({ erro: 'Corte pendente não encontrado.' });
        }

        await req.db.run(
            `UPDATE galeria SET status = 'aprovado', publicado_em = datetime('now') WHERE id = ?`,
            [id]
        );

        const atualizado = await req.db.get(`${SQL_BASE} WHERE g.id = ?`, [id]);

        res.json({
            mensagem: 'Corte aprovado e publicado na galeria!',
            corte: formatarCorte(atualizado)
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/galeria/:id/rejeitar — administrador rejeita
 */
router.post('/:id/rejeitar', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const { id } = req.params;

        const corte = await req.db.get('SELECT * FROM galeria WHERE id = ? AND status = ?', [id, 'pendente']);
        if (!corte) {
            return res.status(404).json({ erro: 'Corte pendente não encontrado.' });
        }

        await req.db.run(`UPDATE galeria SET status = 'rejeitado' WHERE id = ?`, [id]);

        res.json({ mensagem: 'Corte rejeitado e removido da fila de aprovação.' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
