const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sense-barbearia-dev-secret-change-in-production';

function gerarToken(utilizador) {
    return jwt.sign(
        {
            id: utilizador.id,
            email: utilizador.email,
            nome: utilizador.nome,
            perfil: utilizador.perfil
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verificarToken(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Sessão não autenticada.' });
    }

    try {
        const token = header.split(' ')[1];
        req.utilizador = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ erro: 'Sessão expirada ou inválida.' });
    }
}

function verificarPerfil(...perfis) {
    return (req, res, next) => {
        if (!req.utilizador || !perfis.includes(req.utilizador.perfil)) {
            return res.status(403).json({ erro: 'Acesso não autorizado.' });
        }
        next();
    };
}

module.exports = { gerarToken, verificarToken, verificarPerfil, JWT_SECRET };
