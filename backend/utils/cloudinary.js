/**
 * Cloudinary — uploads permanentes (CDN).
 * Preferir CLOUDINARY_URL (linha oficial do Dashboard) — evita secret errado nas 3 variáveis.
 */

function limparValor(v) {
    return String(v || '')
        .replace(/^["']|["']$/g, '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, '')
        .trim();
}

function sanitizarEnvCloudinary() {
    const raw = limparValor(process.env.CLOUDINARY_URL);
    if (!raw) return;

    let url = raw;
    if (url.toUpperCase().startsWith('CLOUDINARY_URL=')) {
        url = url.slice('CLOUDINARY_URL='.length);
    }

    if (!url.startsWith('cloudinary://')) {
        console.warn(
            '⚠️  CLOUDINARY_URL inválida (deve começar por cloudinary://).'
        );
        delete process.env.CLOUDINARY_URL;
        return;
    }

    process.env.CLOUDINARY_URL = url;
}

sanitizarEnvCloudinary();

const { v2: cloudinary } = require('cloudinary');

/** cloudinary://KEY:SECRET@cloud_name */
function parseCloudinaryUrl(url) {
    const body = url.replace(/^cloudinary:\/\//, '');
    const at = body.lastIndexOf('@');
    if (at <= 0) return null;

    const cloud_name = limparValor(body.slice(at + 1));
    const creds = body.slice(0, at);
    const colon = creds.indexOf(':');
    if (colon <= 0 || !cloud_name) return null;

    let api_secret = limparValor(creds.slice(colon + 1));
    try {
        api_secret = decodeURIComponent(api_secret);
    } catch (_) {
        /* manter valor original */
    }

    return {
        api_key: limparValor(creds.slice(0, colon)),
        api_secret,
        cloud_name
    };
}

function obterCredenciaisCloudinary() {
    // Preferir a linha oficial do Dashboard (menos erros de colagem)
    const url = (process.env.CLOUDINARY_URL || '').trim();
    if (url && url.startsWith('cloudinary://')) {
        const parsed = parseCloudinaryUrl(url);
        if (parsed?.api_key && parsed?.api_secret && parsed?.cloud_name) {
            return { ...parsed, origem: 'url' };
        }
        console.warn('⚠️  CLOUDINARY_URL mal formatada.');
    }

    const cloud_name = limparValor(process.env.CLOUDINARY_CLOUD_NAME);
    const api_key = limparValor(process.env.CLOUDINARY_API_KEY);
    const api_secret = limparValor(process.env.CLOUDINARY_API_SECRET);

    if (cloud_name && api_key && api_secret) {
        return { cloud_name, api_key, api_secret, origem: 'env_separado' };
    }

    return null;
}

function configurarCloudinary() {
    const creds = obterCredenciaisCloudinary();
    if (!creds) return false;

    try {
        cloudinary.config({
            cloud_name: creds.cloud_name,
            api_key: creds.api_key,
            api_secret: creds.api_secret,
            secure: true
        });
        delete process.env.CLOUDINARY_URL;
        console.log(
            `✓ Cloudinary configurado (${creds.origem}, cloud: ${creds.cloud_name}, secret_len: ${creds.api_secret.length})`
        );
        return true;
    } catch (err) {
        console.warn('⚠️  Cloudinary config:', err.message);
        return false;
    }
}

const cloudinaryAtivo = configurarCloudinary();

let ultimaVerificacaoAuth = null;

async function verificarCloudinaryAuth(force = false) {
    if (!cloudinaryAtivo) {
        return { configurado: false, auth_ok: false };
    }

    const agora = Date.now();
    if (!force && ultimaVerificacaoAuth && agora - ultimaVerificacaoAuth.em < 60000) {
        return ultimaVerificacaoAuth.resultado;
    }

    const cfg = cloudinary.config();
    const base = { configurado: true, cloud_name: cfg.cloud_name || null };

    try {
        await cloudinary.api.ping();
        const resultado = { ...base, auth_ok: true };
        ultimaVerificacaoAuth = { em: agora, resultado };
        console.log('✓ Cloudinary: autenticação OK');
        return resultado;
    } catch (err) {
        const erroMsg =
            err?.message ||
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            (err?.error ? JSON.stringify(err.error) : null) ||
            String(err);
        const resultado = {
            ...base,
            auth_ok: false,
            erro: erroMsg,
            http_code: err?.http_code || err?.error?.http_code
        };
        ultimaVerificacaoAuth = { em: agora, resultado };
        console.warn('⚠️  Cloudinary auth falhou:', resultado.erro);
        return resultado;
    }
}

if (cloudinaryAtivo) {
    verificarCloudinaryAuth(true).catch(() => {});
}

function uploadsPersistentes() {
    if (!cloudinaryAtivo) return false;
    if (ultimaVerificacaoAuth?.resultado) {
        return ultimaVerificacaoAuth.resultado.auth_ok === true;
    }
    return true;
}

const UPLOAD_TIMEOUT_MS = 90000;

function uploadViaStream(buffer, folder) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout ao enviar imagem para a cloud.'));
        }, UPLOAD_TIMEOUT_MS);

        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
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

async function uploadBuffer(buffer, { folder, mimetype } = {}) {
    const uploadFolder = folder || 'sense-barbershop';

    const auth = await verificarCloudinaryAuth(true);
    if (!auth.auth_ok) {
        const err = new Error(auth.erro || 'Cloudinary authentication failed');
        err.http_code = auth.http_code || 401;
        throw err;
    }

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
    if (code === 401 || msg.includes('api key') || msg.includes('invalid credentials') || msg.includes('authentication')) {
        return 'Credenciais Cloudinary inválidas no Render. Apague CLOUDINARY_URL e use CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET (copie do Dashboard Cloudinary → View API Keys).';
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
    mensagemErroUpload,
    verificarCloudinaryAuth
};
