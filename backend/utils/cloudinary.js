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

function uploadsPersistentes() {
    return cloudinaryAtivo;
}

/**
 * Envia buffer de imagem para a Cloudinary e devolve URL HTTPS permanente.
 */
function uploadBuffer(buffer, { folder, filename }) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder || 'sense-barbershop',
                public_id: filename ? filename.replace(/\.[^.]+$/, '') : undefined,
                resource_type: 'image',
                overwrite: false,
                unique_filename: true,
                transformation: [
                    { width: 1600, height: 1600, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (err, result) => {
                if (err) reject(err);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

module.exports = {
    cloudinary,
    cloudinaryAtivo,
    uploadsPersistentes,
    uploadBuffer
};
