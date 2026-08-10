const { v2: cloudinary } = require('cloudinary');

function configurarCloudinary() {
    const url = (process.env.CLOUDINARY_URL || '').trim();
    if (url) {
        // O SDK lê CLOUDINARY_URL automaticamente
        cloudinary.config();
        return true;
    }

    const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const api_key = (process.env.CLOUDINARY_API_KEY || '').trim();
    const api_secret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    if (cloud_name && api_key && api_secret) {
        cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
        return true;
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
