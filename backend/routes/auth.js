const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { gerarToken, verificarToken } = require('../middleware/auth');
const { enviarEmail, templateBase } = require('../utils/mailer');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
const MSG_LOGIN_INVALIDO = 'Email ou palavra-passe inválidos.';

function gerarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function gerarTokenSeguro() {
    return crypto.randomBytes(32).toString('hex');
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarPassword(password) {
    return password && password.length >= 6;
}

/**
 * POST /api/auth/registo
 */
router.post('/registo', async (req, res) => {
    try {
        const { nome, email, telefone, password } = req.body;

        if (!nome || !email || !telefone || !password) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'Email inválido.' });
        }

        if (!validarPassword(password)) {
            return res.status(400).json({ erro: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
        }

        const existente = await req.db.get(
            'SELECT id FROM utilizadores WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        if (existente) {
            return res.status(409).json({ erro: 'Este email já está registado.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const resultado = await req.db.run(
            `INSERT INTO utilizadores (nome, email, telefone, password_hash, perfil, ativo, email_confirmado)
             VALUES (?, ?, ?, ?, 'cliente', 0, 0)`,
            [nome.trim(), email.toLowerCase().trim(), telefone.trim(), passwordHash]
        );

        const token = gerarTokenSeguro();
        const expira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await req.db.run(
            `INSERT INTO tokens (usuario_id, token, tipo, expira_em) VALUES (?, ?, 'confirmacao', ?)`,
            [resultado.id, token, expira]
        );

        const linkConfirmacao = `${FRONTEND_URL}/confirmar-email.html?token=${token}`;

        const html = templateBase('Confirme o seu email', `
            <p>Olá <strong>${nome.trim()}</strong>,</p>
            <p>Obrigado por criar conta na Sense Barbearia. A sua conta está <strong>pendente</strong> até confirmar o email.</p>
            <p style="text-align:center;margin:30px 0;">
                <a href="${linkConfirmacao}" style="background:#d4af37;color:#1a1a1a;padding:14px 28px;border-radius:5px;text-decoration:none;font-weight:bold;">
                    Confirmar Email
                </a>
            </p>
            <p style="font-size:13px;color:#666;">Ou copie este link: ${linkConfirmacao}</p>
            <p style="font-size:13px;color:#666;">O link expira em 24 horas.</p>
        `);

        await enviarEmail({
            para: email.toLowerCase().trim(),
            assunto: 'Confirme o seu email - Sense Barbearia',
            html
        });

        console.log(`✉️  Link de confirmação: ${linkConfirmacao}`);

        res.status(201).json({
            mensagem: 'Conta criada com sucesso. Verifique o seu email para ativar a conta.',
            pendente: true
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/auth/confirmar-email
 */
router.get('/confirmar-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ erro: 'Token de confirmação inválido.' });
        }

        const registo = await req.db.get(
            `SELECT t.*, u.email, u.nome FROM tokens t
             JOIN utilizadores u ON u.id = t.usuario_id
             WHERE t.token = ? AND t.tipo = 'confirmacao' AND t.usado = 0`,
            [token]
        );

        if (!registo) {
            return res.status(400).json({ erro: 'Link de confirmação inválido ou já utilizado.' });
        }

        if (new Date(registo.expira_em) < new Date()) {
            return res.status(400).json({ erro: 'Link de confirmação expirado. Solicite um novo registo.' });
        }

        await req.db.run(
            'UPDATE utilizadores SET ativo = 1, email_confirmado = 1 WHERE id = ?',
            [registo.usuario_id]
        );
        await req.db.run('UPDATE tokens SET usado = 1 WHERE id = ?', [registo.id]);

        res.json({
            mensagem: 'Email confirmado com sucesso! A sua conta está ativa.',
            email: registo.email,
            nome: registo.nome
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ erro: MSG_LOGIN_INVALIDO });
        }

        const utilizador = await req.db.get(
            `SELECT id, nome, email, telefone, password_hash, perfil, ativo, email_confirmado, barbeiro_id
             FROM utilizadores WHERE email = ?`,
            [email.toLowerCase().trim()]
        );

        if (!utilizador) {
            return res.status(401).json({ erro: MSG_LOGIN_INVALIDO });
        }

        const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ erro: MSG_LOGIN_INVALIDO });
        }

        if (!utilizador.email_confirmado || !utilizador.ativo) {
            return res.status(403).json({
                erro: MSG_LOGIN_INVALIDO,
                pendente: true,
                mensagemInterna: 'Conta não confirmada.'
            });
        }

        const token = gerarToken(utilizador);

        res.json({
            mensagem: 'Login efetuado com sucesso.',
            token,
            utilizador: {
                id: utilizador.id,
                nome: utilizador.nome,
                email: utilizador.email,
                telefone: utilizador.telefone,
                perfil: utilizador.perfil,
                barbeiro_id: utilizador.barbeiro_id
            }
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * GET /api/auth/me
 */
router.get('/me', verificarToken, async (req, res) => {
    try {
        const utilizador = await req.db.get(
            `SELECT id, nome, email, telefone, perfil, ativo, email_confirmado, barbeiro_id
             FROM utilizadores WHERE id = ?`,
            [req.utilizador.id]
        );

        if (!utilizador || !utilizador.ativo) {
            return res.status(401).json({ erro: 'Conta inativa ou não encontrada.' });
        }

        res.json({ utilizador });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/auth/recuperar-password
 */
router.post('/recuperar-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validarEmail(email)) {
            return res.status(400).json({ erro: 'Email inválido.' });
        }

        const utilizador = await req.db.get(
            'SELECT id, nome, email FROM utilizadores WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        // Resposta genérica por segurança (não revelar se email existe)
        const respostaGenerica = {
            mensagem: 'Se o email existir na nossa base de dados, receberá instruções de recuperação.'
        };

        if (!utilizador) {
            return res.json(respostaGenerica);
        }

        const token = gerarTokenSeguro();
        const codigo = gerarCodigo();
        const expira = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await req.db.run(
            `INSERT INTO tokens (usuario_id, token, codigo, tipo, expira_em) VALUES (?, ?, ?, 'recuperacao', ?)`,
            [utilizador.id, token, codigo, expira]
        );

        const linkRecuperacao = `${FRONTEND_URL}/redefinir-password.html?token=${token}`;

        const html = templateBase('Recuperação de Palavra-passe', `
            <p>Olá <strong>${utilizador.nome}</strong>,</p>
            <p>Recebemos um pedido para redefinir a sua palavra-passe.</p>
            <p style="text-align:center;margin:25px 0;">
                <a href="${linkRecuperacao}" style="background:#d4af37;color:#1a1a1a;padding:14px 28px;border-radius:5px;text-decoration:none;font-weight:bold;">
                    Redefinir Palavra-passe
                </a>
            </p>
            <p><strong>Código temporário:</strong> <span style="font-size:24px;letter-spacing:4px;color:#d4af37;">${codigo}</span></p>
            <p style="font-size:13px;color:#666;">O link e o código expiram em 1 hora.</p>
            <p style="font-size:13px;color:#666;">Se não solicitou esta alteração, ignore este email.</p>
        `);

        await enviarEmail({
            para: utilizador.email,
            assunto: 'Recuperação de Palavra-passe - Sense Barbearia',
            html
        });

        console.log(`🔑 Link recuperação: ${linkRecuperacao}`);
        console.log(`🔑 Código temporário: ${codigo}`);

        res.json(respostaGenerica);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/auth/redefinir-password
 */
router.post('/redefinir-password', async (req, res) => {
    try {
        const { token, codigo, email, password } = req.body;

        if (!password || !validarPassword(password)) {
            return res.status(400).json({ erro: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
        }

        let registo;

        if (token) {
            registo = await req.db.get(
                `SELECT t.*, u.email FROM tokens t
                 JOIN utilizadores u ON u.id = t.usuario_id
                 WHERE t.token = ? AND t.tipo = 'recuperacao' AND t.usado = 0`,
                [token]
            );
        } else if (codigo && email) {
            registo = await req.db.get(
                `SELECT t.*, u.email FROM tokens t
                 JOIN utilizadores u ON u.id = t.usuario_id
                 WHERE t.codigo = ? AND u.email = ? AND t.tipo = 'recuperacao' AND t.usado = 0`,
                [codigo, email.toLowerCase().trim()]
            );
        } else {
            return res.status(400).json({ erro: 'Token ou código de recuperação necessário.' });
        }

        if (!registo) {
            return res.status(400).json({ erro: 'Código ou link de recuperação inválido.' });
        }

        if (new Date(registo.expira_em) < new Date()) {
            return res.status(400).json({ erro: 'Link ou código expirado. Solicite nova recuperação.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await req.db.run(
            'UPDATE utilizadores SET password_hash = ? WHERE id = ?',
            [passwordHash, registo.usuario_id]
        );
        await req.db.run('UPDATE tokens SET usado = 1 WHERE id = ?', [registo.id]);

        res.json({ mensagem: 'Palavra-passe redefinida com sucesso. Pode fazer login.' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
