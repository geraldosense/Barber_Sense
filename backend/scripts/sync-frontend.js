/**
 * Copia frontend/ para backend/public no deploy (Render rootDir = backend).
 * Sem isto, pushes só em frontend/ não disparam redeploy no Render.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'frontend');
const dest = path.join(__dirname, '..', 'public');

function copyDir(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        const srcPath = path.join(from, entry.name);
        const destPath = path.join(to, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

if (!fs.existsSync(src)) {
    console.error('sync-frontend: pasta frontend/ não encontrada em', src);
    process.exit(1);
}

if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
}

copyDir(src, dest);
console.log('sync-frontend: copiado', src, '->', dest);
