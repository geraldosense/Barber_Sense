const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verificarToken, verificarPerfil } = require('../middleware/auth');
const { resolverCaminhoUploads } = require('../utils/paths');
const { cloudinaryAtivo, uploadBuffer, mensagemErroUpload } = require('../utils/cloudinary');

const router = express.Router();
const uploadsRoot = resolverCaminhoUploads();

const memoryUpload = multer({
    storage: multer.memoryStorage(),
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

function criarUploaderDisco(subdir) {
    const uploadDir = path.join(uploadsRoot, subdir);
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

function tratarUploadCloud(subdir) {
    return (req, res) => {
        memoryUpload.single('imagem')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ erro: err.message || 'Erro no upload.' });
            }
            if (!req.file) {
                return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
            }

            try {
                const result = await uploadBuffer(req.file.buffer, {
                    folder: `sense-barbershop/${subdir}`,
                    mimetype: req.file.mimetype
                });

                res.status(201).json({
                    mensagem: 'Imagem carregada com sucesso.',
                    url: result.secure_url,
                    persistente: true,
                    provider: 'cloudinary'
                });
            } catch (uploadErr) {
                console.error('Cloudinary upload:', {
                    message: uploadErr.message,
                    http_code: uploadErr.http_code,
                    name: uploadErr.name
                });
                res.status(500).json({ erro: mensagemErroUpload(uploadErr) });
            }
        });
    };
}

function tratarUploadDisco(upload, subdir) {
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
                url: `/uploads/${subdir}/${req.file.filename}`,
                persistente: false,
                provider: 'local'
            });
        });
    };
}

const uploadGaleriaDisco = criarUploaderDisco('galeria');
const uploadServicoDisco = criarUploaderDisco('servicos');

if (cloudinaryAtivo) {
    console.log('✓ Uploads persistentes: Cloudinary');
    router.post('/galeria', verificarToken, verificarPerfil('barbeiro', 'administrador'), tratarUploadCloud('galeria'));
    router.post('/servico', verificarToken, verificarPerfil('administrador'), tratarUploadCloud('servicos'));
} else {
    console.warn('⚠️  Uploads locais (efémeros no Render Free). Configure CLOUDINARY_URL.');
    router.post('/galeria', verificarToken, verificarPerfil('barbeiro', 'administrador'), tratarUploadDisco(uploadGaleriaDisco, 'galeria'));
    router.post('/servico', verificarToken, verificarPerfil('administrador'), tratarUploadDisco(uploadServicoDisco, 'servicos'));
}

module.exports = router;
