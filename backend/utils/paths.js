const path = require('path');
const fs = require('fs');

/**
 * Resolve caminhos persistentes (BD + uploads).
 * Em produção no Render, usa /var/data se existir (disco persistente).
 */
function raizDados() {
    const fromEnv = (process.env.DATA_DIR || '').trim();
    if (fromEnv) {
        const absolute = path.isAbsolute(fromEnv) ? fromEnv : path.resolve(__dirname, '..', fromEnv);
        fs.mkdirSync(absolute, { recursive: true });
        return absolute;
    }

    const renderDisk = '/var/data';
    if (process.env.NODE_ENV === 'production' && fs.existsSync(renderDisk)) {
        return renderDisk;
    }

    return path.join(__dirname, '..');
}

function resolverCaminhoBaseDados() {
    const fromEnv = (process.env.DATABASE_PATH || '').trim();
    if (fromEnv) {
        const absolute = path.isAbsolute(fromEnv)
            ? fromEnv
            : path.resolve(__dirname, '..', fromEnv);
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        return absolute;
    }

    const root = raizDados();
    if (root === '/var/data' || (process.env.DATA_DIR || '').trim()) {
        return path.join(root, 'barbearia_sense.db');
    }

    // Local: backend/database/barbearia_sense.db
    return path.join(__dirname, '..', 'database', 'barbearia_sense.db');
}

function resolverCaminhoUploads() {
    const fromEnv = (process.env.UPLOADS_PATH || '').trim();
    if (fromEnv) {
        const absolute = path.isAbsolute(fromEnv)
            ? fromEnv
            : path.resolve(__dirname, '..', fromEnv);
        fs.mkdirSync(absolute, { recursive: true });
        return absolute;
    }

    const root = raizDados();
    if (root === '/var/data' || process.env.DATA_DIR) {
        const dir = path.join(root, 'uploads');
        fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    const dir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

module.exports = {
    raizDados,
    resolverCaminhoBaseDados,
    resolverCaminhoUploads
};
