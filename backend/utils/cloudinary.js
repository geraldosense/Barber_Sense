/**
 * Cloudinary — uploads permanentes (CDN).
 * Se CLOUDINARY_URL estiver mal formatada, ignora e o servidor continua (uploads locais).
 */

function sanitizarEnvCloudinary() {
    const raw = (process.env.CLOUDINARY_URL || '').trim();
    if (!raw) return;

    // Remover aspas acidentais do painel Render
    let url = raw.replace(/^["']|["']$/g, '').trim();

    // Se colaram só "CLOUDINARY_URL=cloudinary://..."
    if (url.toUpperCase().startsWith('CLOUDINARY_URL=')) {
        url = url.slice('CLOUDINARY_URL='.length).trim();
    }

    if (!url.startsWith('cloudinary://')) {
        console.warn(
            '⚠️  CLOUDINARY_URL inválida (deve começar por cloudinary://). Uploads locais até corrigir.'
        );
        delete process.env.CLOUDINARY_URL;
        return;
    }

    process.env.CLOUDINARY_URL = url;
}

sanitizarEnvCloudinary();

const { v2: cloudinary } = require('cloudinary');

function configurarCloudinary() {
    const url = (process.env.CLOUDINARY_URL || '').trim();
    if (url && url.startsWith('cloudinary://')) {
        try {
            cloudinary.config();
            return true;
        } catch (err) {
            console.warn('⚠️  Cloudinary config:', err.message);
            delete process.env.CLOUDINARY_URL;
            return false;
        }
    }

    const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const api_key = (process.env.CLOUDINARY_API_KEY || '').trim();
    const api_secret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    if (cloud_name && api_key && api_secret) {
        try {
            cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
            return true;
        } catch (err) {
            console.warn('⚠️  Cloudinary config:', err.message);
            return false;
        }
    }

    return false;
}

const cloudinaryAtivo = configurarCloudinary();

if (cloudinaryAtivo) {
    cloudinary.api.ping()
        .then(() => console.log('✓ Cloudinary: ligação OK'))
        .catch((err) => console.warn('⚠️  Cloudinary ping falhou:', err.message || err));
}

function uploadsPersistentes() {
    return cloudinaryAtivo;
}

const UPLOAD_TIMEOUT_MS = 90000;

function uploadViaStream(buffer, folder) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout ao enviar imagem para a cloud.'));
        }, UPLOAD_TIMEOUT_MS);

        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image'
            },
            (err, result) => {
                clearTimeout(timeout);
                if (err) reject(err);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

function uploadViaDataUri(buffer, folder, mimetype) {
    const mime = (mimetype && mimetype.startsWith('image/')) ? mimetype : 'image/jpeg';
    const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
    return cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image'
    });
}

/**
 * Envia buffer de imagem para a Cloudinary e devolve URL HTTPS permanente.
 */
async function uploadBuffer(buffer, { folder, mimetype } = {}) {
    const uploadFolder = folder || 'sense-barbershop';

    try {
        return await uploadViaStream(buffer, uploadFolder);
    } catch (streamErr) {
        console.warn('Cloudinary stream falhou, a tentar data URI:', streamErr.message);
        try {
            return await uploadViaDataUri(buffer, uploadFolder, mimetype);
        } catch (uriErr) {
            uriErr.cause = streamErr;
            throw uriErr;
        }
    }
}

/**
 * Mensagem legível para o admin (sem expor segredos).
 */
function mensagemErroUpload(err) {
    const msg = String(err?.message || err || '').toLowerCase();
    const code = err?.http_code || err?.error?.http_code;

    if (msg.includes('too large') || code === 413) {
        return 'A imagem é demasiado grande (máx. 8 MB).';
    }
    if (msg.includes('timeout')) {
        return 'O envio demorou demasiado. Tente uma imagem mais pequena.';
    }
    if (
        msg.includes('invalid image') ||
        msg.includes('unsupported') ||
        msg.includes('format') ||
        msg.includes('heic') ||
        msg.includes('heif')
    ) {
        return 'Formato não suportado. Use JPG ou PNG (fotos iPhone: defina "Mais compatível" nas definições da câmara).';
    }
    if (code === 401 || msg.includes('api key') || msg.includes('invalid credentials')) {
        return 'Configuração da cloud inválida. Verifique CLOUDINARY_URL no Render.';
    }
    if (code === 420 || msg.includes('rate limit')) {
        return 'Limite de uploads atingido. Tente novamente dentro de alguns minutos.';
    }

    return 'Falha ao guardar a imagem na cloud. Use JPG ou PNG até 8 MB.';
}

module.exports = {
    cloudinary,
    cloudinaryAtivo,
    uploadsPersistentes,
    uploadBuffer,
    mensagemErroUpload
};
