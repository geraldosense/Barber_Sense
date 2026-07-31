// ===== SINCRONIZAÇÃO ENTRE DISPOSITIVOS =====
const express = require('express');
const { verificarToken, verificarPerfil } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/sync
 * Versão global dos dados — telemóvel e PC comparam este valor.
 */
router.get('/', async (req, res) => {
    try {
        const sync = await req.db.obterSync();
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json({
            ok: true,
            ...sync,
            servidor: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/sync/bump
 * Força invalidação (admin) — opcional; rotas de escrita já fazem bump.
 */
router.post('/bump', verificarToken, verificarPerfil('administrador'), async (req, res) => {
    try {
        const sync = await req.db.bumpSync(req.body?.motivo || 'manual');
        const estado = await req.db.obterSync();
        res.json({ ok: true, ...estado, ...sync });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
