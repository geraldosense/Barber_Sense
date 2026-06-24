const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verificarToken, verificarPerfil } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'galeria');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '') || 'corte';
        cb(null, `${Date.now()}-${base}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens JPG, PNG ou WEBP são permitidas.'));
        }
    }
});

/**
 * POST /api/upload/galeria — upload de imagem de corte
 */
router.post('/galeria', verificarToken, verificarPerfil('barbeiro', 'administrador'), (req, res) => {
    upload.single('imagem')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ erro: err.message || 'Erro no upload.' });
        }
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
        }

        res.status(201).json({
            mensagem: 'Imagem carregada com sucesso.',
            url: `/uploads/galeria/${req.file.filename}`
        });
    });
});

module.exports = router;
