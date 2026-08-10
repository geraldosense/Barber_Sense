const path = require('path');
const fs = require('fs');

const RENDER_DISK = '/var/data';
const SENTINEL = '.sense-persist';

function emRender() {
    return !!(
        process.env.RENDER === 'true' ||
        process.env.RENDER_SERVICE_ID ||
        process.env.RENDER_EXTERNAL_URL ||
        process.env.RENDER_EXTERNAL_HOSTNAME
    );
}

function emProducao() {
    return process.env.NODE_ENV === 'production' || emRender();
}

function podeEscrever(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        const probe = path.join(dir, `.write-test-${process.pid}`);
        fs.writeFileSync(probe, String(Date.now()));
        fs.unlinkSync(probe);
        return true;
    } catch {
        return false;
    }
}

function discoMontado(dir) {
    try {
        if (!fs.existsSync(dir)) return false;
        if (fs.existsSync('/proc/mounts')) {
            const mounts = fs.readFileSync('/proc/mounts', 'utf8');
            const linhas = mounts.split('\n');
            return linhas.some((l) => {
                const parts = l.split(/\s+/);
                return parts[1] === dir;
            });
        }
        // macOS/local: se a pasta existe e é escrevível, aceitar
        return podeEscrever(dir);
    } catch {
        return false;
    }
}

function garantirDir(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        return true;
    } catch (err) {
        console.warn(`⚠️  Não foi possível criar ${dir}: ${err.message}`);
        return false;
    }
}

/**
 * Resolve a raiz de dados persistentes.
 * Em Render/produção: /var/data (disco persistente).
 */
function raizDados() {
    const fromEnv = (process.env.DATA_DIR || '').trim();
    if (fromEnv) {
        const absolute = path.isAbsolute(fromEnv) ? fromEnv : path.resolve(__dirname, '..', fromEnv);
        garantirDir(absolute);
        return absolute;
    }

    if (emProducao()) {
        if (garantirDir(RENDER_DISK) && podeEscrever(RENDER_DISK)) {
            return RENDER_DISK;
        }
        // Fallback temporário (ainda efémero) até o disco ser montado
        const fallback = path.join(__dirname, '..', 'data');
        garantirDir(fallback);
        console.warn(`⚠️  ${RENDER_DISK} indisponível — fallback temporário: ${fallback}`);
        return fallback;
    }

    if (fs.existsSync(RENDER_DISK) && podeEscrever(RENDER_DISK)) {
        return RENDER_DISK;
    }

    return path.join(__dirname, '..');
}

function candidatosBdEfemerica() {
    return [
        path.join(__dirname, '..', 'database', 'barbearia_sense.db'),
        '/opt/render/project/src/backend/database/barbearia_sense.db',
        path.join(process.cwd(), 'database', 'barbearia_sense.db')
    ];
}

function copiarFicheiroSeNecessario(origem, destino) {
    if (!fs.existsSync(origem)) return false;
    if (fs.existsSync(destino) && fs.statSync(destino).size > 0) return false;

    garantirDir(path.dirname(destino));
    fs.copyFileSync(origem, destino);

    for (const ext of ['-wal', '-shm']) {
        const o = origem + ext;
        const d = destino + ext;
        if (fs.existsSync(o) && !fs.existsSync(d)) {
            try {
                fs.copyFileSync(o, d);
            } catch (_) { /* ignore */ }
        }
    }

    console.log(`✓ BD migrada: ${origem} → ${destino}`);
    return true;
}

function migrarUploadsSeNecessario(destinoUploads) {
    const candidatos = [
        path.join(__dirname, '..', 'uploads'),
        '/opt/render/project/src/backend/uploads'
    ];

    for (const origem of candidatos) {
        if (!fs.existsSync(origem) || origem === destinoUploads) continue;
        try {
            const ficheiros = fs.readdirSync(origem);
            if (!ficheiros.length) continue;
            garantirDir(destinoUploads);
            let copiados = 0;
            for (const nome of ficheiros) {
                const from = path.join(origem, nome);
                const to = path.join(destinoUploads, nome);
                if (fs.statSync(from).isFile() && !fs.existsSync(to)) {
                    fs.copyFileSync(from, to);
                    copiados += 1;
                }
            }
            if (copiados) {
                console.log(`✓ Uploads migrados (${copiados}) → ${destinoUploads}`);
            }
        } catch (err) {
            console.warn('Migração de uploads:', err.message);
        }
    }
}

function resolverCaminhoBaseDados() {
    const fromEnv = (process.env.DATABASE_PATH || '').trim();
    let absolute;

    if (fromEnv) {
        absolute = path.isAbsolute(fromEnv)
            ? fromEnv
            : path.resolve(__dirname, '..', fromEnv);
    } else if (emProducao()) {
        absolute = path.join(raizDados(), 'barbearia_sense.db');
    } else {
        const root = raizDados();
        if (root === RENDER_DISK || (process.env.DATA_DIR || '').trim()) {
            absolute = path.join(root, 'barbearia_sense.db');
        } else {
            absolute = path.join(__dirname, '..', 'database', 'barbearia_sense.db');
        }
    }

    // Em produção no Render, preferir disco /var/data; se a BD estiver no projeto sem mount, migrar
    if (emProducao() && absolute.includes('/opt/render/project/') && !discoMontado(path.dirname(absolute))) {
        if (garantirDir(RENDER_DISK) && podeEscrever(RENDER_DISK)) {
            console.warn(`⚠️  DATABASE_PATH efémero detetado (${absolute}) — a migrar para ${RENDER_DISK}`);
            const novo = path.join(RENDER_DISK, 'barbearia_sense.db');
            copiarFicheiroSeNecessario(absolute, novo);
            absolute = novo;
        }
    }

    // Se /var/data foi pedido mas não é escrevível, usar fallback
    if (!garantirDir(path.dirname(absolute)) || !podeEscrever(path.dirname(absolute))) {
        const fallback = path.join(__dirname, '..', 'data', 'barbearia_sense.db');
        console.warn(`⚠️  Sem escrita em ${absolute} — fallback: ${fallback}`);
        absolute = fallback;
        garantirDir(path.dirname(absolute));
    }

    if (!fs.existsSync(absolute) || fs.statSync(absolute).size === 0) {
        for (const candidato of candidatosBdEfemerica()) {
            if (candidato === absolute) continue;
            if (copiarFicheiroSeNecessario(candidato, absolute)) break;
        }
    }

    return absolute;
}

function resolverCaminhoUploads() {
    const fromEnv = (process.env.UPLOADS_PATH || '').trim();
    let absolute;

    if (fromEnv) {
        absolute = path.isAbsolute(fromEnv)
            ? fromEnv
            : path.resolve(__dirname, '..', fromEnv);
    } else if (emProducao()) {
        absolute = path.join(raizDados(), 'uploads');
    } else {
        const root = raizDados();
        if (root === RENDER_DISK || process.env.DATA_DIR) {
            absolute = path.join(root, 'uploads');
        } else {
            absolute = path.join(__dirname, '..', 'uploads');
        }
    }

    if (emProducao() && absolute.includes('/opt/render/project/')) {
        absolute = path.join(raizDados(), 'uploads');
    }

    if (!garantirDir(absolute) || !podeEscrever(absolute)) {
        absolute = path.join(__dirname, '..', 'data', 'uploads');
        garantirDir(absolute);
    }

    migrarUploadsSeNecessario(absolute);
    return absolute;
}

function diagnosticoPersistencia(dbPath, uploadsPath, opts = {}) {
    const remota = !!(opts && opts.remota) || !!(
        process.env.TURSO_DATABASE_URL ||
        process.env.LIBSQL_URL ||
        process.env.LIBSQL_DATABASE_URL
    );
    if (remota) {
        return {
            persistente: true,
            render: emRender(),
            disco_montado: false,
            modo: 'turso-libsql',
            caminho_bd: dbPath,
            uploads: uploadsPath,
            sentinel: true,
            avisos: []
        };
    }

    const dataRoot = path.dirname(String(dbPath || '.'));
    const candidatosMount = [
        RENDER_DISK,
        path.join(__dirname, '..', 'data'),
        dataRoot,
        '/opt/render/project/src/backend/data'
    ];
    const montado = candidatosMount.some((dir) => discoMontado(dir));
    const escreve = podeEscrever(dataRoot);
    const sobProjeto = String(dbPath).includes('/opt/render/project/');

    let sentinelOk = false;
    try {
        const sentinelPath = path.join(dataRoot, SENTINEL);
        if (!fs.existsSync(sentinelPath)) {
            fs.writeFileSync(sentinelPath, JSON.stringify({
                criado_em: new Date().toISOString(),
                servico: process.env.RENDER_SERVICE_NAME || 'sense-barbershop'
            }));
        }
        sentinelOk = fs.existsSync(sentinelPath);
    } catch (_) {
        sentinelOk = false;
    }

    const persistenteRender = emRender() ? (montado && escreve) : true;
    const persistente = emProducao() ? (emRender() ? persistenteRender : escreve) : true;

    const avisos = [];
    if (emRender() && !montado) {
        avisos.push(
            'Sem disco local. No plano Free use Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN em Environment). No Starter+: Disks → Mount /var/data.'
        );
    }
    if (sobProjeto && !montado) {
        avisos.push('A base de dados está no filesystem efémero do projeto.');
    }
    if (emProducao() && !escreve) {
        avisos.push('Sem permissão de escrita no caminho da base de dados.');
    }

    return {
        persistente,
        render: emRender(),
        disco_montado: montado,
        modo: montado ? 'disco' : 'efemero',
        caminho_bd: dbPath,
        uploads: uploadsPath,
        sentinel: sentinelOk,
        avisos
    };
}

module.exports = {
    raizDados,
    resolverCaminhoBaseDados,
    resolverCaminhoUploads,
    diagnosticoPersistencia,
    emRender,
    emProducao,
    RENDER_DISK
};
