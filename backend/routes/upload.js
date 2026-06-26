const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verificarToken, verificarPerfil } = require('../middleware/auth');

const router = express.Router();

function criarUploader(subdir) {
    const uploadDir = path.join(__dirname, '..', 'uploads', subdir);
    fs.mkdirSync(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
            const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '') || 'imagem';
            cb(null, `${Date.now()}-${base}${ext}`);
        }
    });

    return multer({
        storage,
        limits: { fileSize: 8 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (/^image\/(jpeg|jpg|png|webp|gif|heic|heif)$/i.test(file.mimetype) ||
                /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.originalname)) {
                cb(null, true);
            } else {
                cb(new Error('Apenas imagens JPG, PNG, WEBP ou HEIC são permitidas.'));
            }
        }
    });
}

const uploadGaleria = criarUploader('galeria');
const uploadServico = criarUploader('servicos');

function tratarUpload(upload, subdir) {
    return (req, res) => {
        upload.single('imagem')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ erro: err.message || 'Erro no upload.' });
            }
            if (!req.file) {
                return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
            }

            res.status(201).json({
                mensagem: 'Imagem carregada com sucesso.',
                url: `/uploads/${subdir}/${req.file.filename}`
            });
        });
    };
}

/**
 * POST /api/upload/galeria — upload de imagem de corte
 */
router.post('/galeria', verificarToken, verificarPerfil('barbeiro', 'administrador'), tratarUpload(uploadGaleria, 'galeria'));

/**
 * POST /api/upload/servico — upload de imagem de serviço
 */
router.post('/servico', verificarToken, verificarPerfil('administrador'), tratarUpload(uploadServico, 'servicos'));

module.exports = router;
