const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { gerarToken, verificarToken } = require('../middleware/auth');
const { enviarEmail, emailConfigurado, templateBase } = require('../utils/mailer');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'sensegeraldo2@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const MSG_LOGIN_INVALIDO = 'Email ou palavra-passe inválidos.';
function formatarUtilizador(row) {
    return {
        id: row.id,
        nome: row.nome,
        email: row.email,
        telefone: row.telefone,
        perfil: row.perfil,
        barbeiro_id: row.barbeiro_id,
        foto_url: row.foto_url || null,
        auth_provider: row.auth_provider || 'local',
        metodo_pagamento: row.metodo_pagamento || null,
        perfil_completo: !!row.perfil_completo
    };
}

/** Sessão pública do site — sempre perfil cliente (painel admin só via admin-login) */
function utilizadorCliente(row) {
    return { ...row, perfil: 'cliente' };
}

function responderSessaoCliente(res, row, mensagem, status = 200) {
    const cliente = utilizadorCliente(row);
    const payload = {
        mensagem,
        token: gerarToken(cliente),
        utilizador: formatarUtilizador(cliente)
    };
    if (status === 201) {
        return res.status(201).json(payload);
    }
    return res.json(payload);
}

async function verificarCredencialGoogle(credential) {
    if (!googleClient || !GOOGLE_CLIENT_ID) {
        throw new Error('Google Sign-In não configurado. Defina GOOGLE_CLIENT_ID no .env');
    }

    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
        throw new Error('Conta Google inválida.');
    }

    if (!payload.email_verified) {
        throw new Error('Utilize uma conta Google com email verificado.');
    }

    return payload;
}

function perfilParaEmail(_email) {
    return 'cliente';
}

/**
 * POST /api/auth/google — login/registo com conta Google
 */
router.post('/google', async (req, res) => {
    try {
        const { credential, telefone } = req.body;

        if (!credential) {
            return res.status(400).json({ erro: 'Credencial Google em falta.' });
        }

        const payload = await verificarCredencialGoogle(credential);
        const email = payload.email.toLowerCase().trim();
        const googleId = payload.sub;
        const nome = (payload.name || payload.given_name || email.split('@')[0]).trim();
        const foto = payload.picture || '';

        let utilizador = await req.db.get(
            `SELECT id, nome, email, telefone, password_hash, perfil, ativo, email_confirmado, barbeiro_id, google_id, auth_provider, foto_url
             FROM utilizadores WHERE google_id = ? OR email = ?`,
            [googleId, email]
        );

        const perfilAlvo = 'cliente';

        if (!utilizador) {
            if (!telefone || !telefone.trim()) {
                return res.json({
                    needsProfile: true,
                    email,
                    nome,
                    mensagem: 'Indique o seu telefone para concluir o registo.'
                });
            }

            const resultado = await req.db.run(
                `INSERT INTO utilizadores (nome, email, telefone, password_hash, perfil, ativo, email_confirmado, google_id, auth_provider, foto_url)
                 VALUES (?, ?, ?, '', ?, 1, 1, ?, 'google', ?)`,
                [nome, email, telefone.trim(), perfilAlvo, googleId, foto]
            );

            utilizador = await req.db.get(
                `SELECT id, nome, email, telefone, password_hash, perfil, ativo, email_confirmado, barbeiro_id, google_id, auth_provider, foto_url
                 FROM utilizadores WHERE id = ?`,
                [resultado.id]
            );
        } else {
            await req.db.run(
                `UPDATE utilizadores SET
                    google_id = COALESCE(google_id, ?),
                    auth_provider = 'google',
                    ativo = 1,
                    email_confirmado = 1,
                    foto_url = COALESCE(?, foto_url)
                 WHERE id = ?`,
                [googleId, foto, utilizador.id]
            );

            if (telefone?.trim() && (!utilizador.telefone || utilizador.telefone === '—')) {
                await req.db.run('UPDATE utilizadores SET telefone = ? WHERE id = ?', [telefone.trim(), utilizador.id]);
            }

            utilizador = await req.db.get(
                `SELECT id, nome, email, telefone, password_hash, perfil, ativo, email_confirmado, barbeiro_id, google_id, auth_provider, foto_url
                 FROM utilizadores WHERE id = ?`,
                [utilizador.id]
            );
        }

        if (!utilizador.telefone || utilizador.telefone === '—') {
            return res.json({
                needsProfile: true,
                email: utilizador.email,
                nome: utilizador.nome,
                mensagem: 'Indique o seu telefone para concluir o registo.'
            });
        }

        return responderSessaoCliente(res, utilizador, 'Sessão iniciada com Google.');
    } catch (error) {
        res.status(400).json({ erro: error.message || 'Erro na autenticação Google.' });
    }
});

/**
 * GET /api/auth/config — configuração pública de autenticação
 */
router.get('/config', (_req, res) => {
    res.json({
        googleClientId: GOOGLE_CLIENT_ID,
        googleAtivo: !!GOOGLE_CLIENT_ID,
        emailAtivo: emailConfigurado()
    });
});

/**
 * GET /api/auth/verificar-email — verifica se o email já tem conta (público)
 */
router.get('/verificar-email', async (req, res) => {
    try {
        const email = (req.query.email || '').toLowerCase().trim();

        if (!email || !validarEmail(email)) {
            return res.json({ registado: false });
        }

        const utilizador = await req.db.get(
            `SELECT nome, auth_provider, google_id, ativo, email_confirmado
             FROM utilizadores WHERE email = ?`,
            [email]
        );

        if (!utilizador) {
            return res.json({ registado: false });
        }

        if (!utilizador.ativo || !utilizador.email_confirmado) {
            await req.db.run(
                'UPDATE utilizadores SET ativo = 1, email_confirmado = 1 WHERE email = ?',
                [email]
            );
        }

        const usaGoogle = !!(utilizador.google_id || utilizador.auth_provider === 'google');
        const primeiroNome = (utilizador.nome || email.split('@')[0]).split(' ')[0];

        res.json({
            registado: true,
            nome: primeiroNome,
            auth_provider: usaGoogle ? 'google' : 'local',
            email_confirmado: true
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

async function criarTokenConfirmacao(db, usuarioId) {
    await db.run(
        `UPDATE tokens SET usado = 1 WHERE usuario_id = ? AND tipo = 'confirmacao' AND usado = 0`,
        [usuarioId]
    );

    const token = gerarTokenSeguro();
    const codigo = gerarCodigo();
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.run(
        `INSERT INTO tokens (usuario_id, token, codigo, tipo, expira_em) VALUES (?, ?, ?, 'confirmacao', ?)`,
        [usuarioId, token, codigo, expira]
    );

    return { token, codigo, expira };
}

async function enviarEmailConfirmacao({ nome, email, token, codigo }) {
    const linkConfirmacao = `${FRONTEND_URL}/confirmar-email.html?token=${token}`;

    const html = templateBase('Confirme o seu email', `
        <p>Olá <strong>${nome}</strong>,</p>
        <p>Obrigado por criar conta na Sense Barbershop. Para ativar a conta, confirme o seu email:</p>
        <p style="text-align:center;margin:30px 0;">
            <a href="${linkConfirmacao}" style="background:#d4af37;color:#1a1a1a;padding:14px 28px;border-radius:5px;text-decoration:none;font-weight:bold;">
                Confirmar Email
            </a>
        </p>
        <p style="text-align:center;margin:20px 0;">
            <strong>Código de confirmação:</strong><br>
            <span style="font-size:32px;letter-spacing:8px;color:#d4af37;font-weight:bold;">${codigo}</span>
        </p>
        <p style="font-size:13px;color:#666;">Introduza o código em <a href="${FRONTEND_URL}/ativar-conta.html?email=${encodeURIComponent(email)}">ativar-conta.html</a> se preferir não usar o link.</p>
        <p style="font-size:13px;color:#666;">O link e o código expiram em 24 horas.</p>
    `);

    const texto = `Sense Barbershop — Código de confirmação: ${codigo}\nLink: ${linkConfirmacao}`;

    const resultado = await enviarEmail({
        para: email,
        assunto: 'Confirme o seu email - Sense Barbershop',
        html,
        texto
    });

    console.log(`✉️  Confirmação ${email}: ${linkConfirmacao} | Código: ${codigo}`);

    return { linkConfirmacao, resultado };
}


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
            return res.status(409).json({
                erro: 'Este email já está registado. Faça login com a sua palavra-passe.',
                codigo: 'EMAIL_JA_REGISTADO'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const perfil = perfilParaEmail(email.toLowerCase().trim());
        const resultado = await req.db.run(
            `INSERT INTO utilizadores (nome, email, telefone, password_hash, perfil, ativo, email_confirmado, auth_provider, perfil_completo)
             VALUES (?, ?, ?, ?, ?, 1, 1, 'local', 1)`,
            [nome.trim(), email.toLowerCase().trim(), telefone.trim(), passwordHash, perfil]
        );

        const utilizador = await req.db.get(
            `SELECT id, nome, email, telefone, perfil, ativo, email_confirmado, barbeiro_id, metodo_pagamento, perfil_completo, auth_provider
             FROM utilizadores WHERE id = ?`,
            [resultado.id]
        );
        return responderSessaoCliente(res, utilizador, 'Conta criada e validada! Pode iniciar sessão com este email.', 201);
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

        const utilizador = await req.db.get(
            `SELECT id, nome, email, telefone, perfil, ativo, email_confirmado, barbeiro_id, metodo_pagamento, perfil_completo
             FROM utilizadores WHERE id = ?`,
            [registo.usuario_id]
        );
        const tokenJwt = gerarToken(utilizador);

        res.json({
            mensagem: 'Email confirmado com sucesso! A sua conta está ativa.',
            email: registo.email,
            nome: registo.nome,
            token: tokenJwt,
            utilizador: formatarUtilizador(utilizador),
            proximoPasso: `${FRONTEND_URL}/finalizar.html`
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/auth/confirmar-codigo
 */
router.post('/confirmar-codigo', async (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({ erro: 'Email e código são obrigatórios.' });
        }

        const registo = await req.db.get(
            `SELECT t.*, u.email, u.nome FROM tokens t
             JOIN utilizadores u ON u.id = t.usuario_id
             WHERE u.email = ? AND t.codigo = ? AND t.tipo = 'confirmacao' AND t.usado = 0`,
            [email.toLowerCase().trim(), String(codigo).trim()]
        );

        if (!registo) {
            return res.status(400).json({ erro: 'Código inválido ou já utilizado.' });
        }

        if (new Date(registo.expira_em) < new Date()) {
            return res.status(400).json({ erro: 'Código expirado. Solicite um novo email de confirmação.' });
        }

        await req.db.run(
            'UPDATE utilizadores SET ativo = 1, email_confirmado = 1 WHERE id = ?',
            [registo.usuario_id]
        );
        await req.db.run('UPDATE tokens SET usado = 1 WHERE id = ?', [registo.id]);

        const utilizador = await req.db.get(
            `SELECT id, nome, email, telefone, perfil, ativo, email_confirmado, barbeiro_id, metodo_pagamento, perfil_completo
             FROM utilizadores WHERE id = ?`,
            [registo.usuario_id]
        );
        const tokenJwt = gerarToken(utilizador);

        res.json({
            mensagem: 'Conta ativada com sucesso!',
            email: registo.email,
            nome: registo.nome,
            token: tokenJwt,
            utilizador: formatarUtilizador(utilizador),
            proximoPasso: `${FRONTEND_URL}/finalizar.html`
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/auth/reenviar-confirmacao
 */
router.post('/reenviar-confirmacao', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validarEmail(email)) {
            return res.status(400).json({ erro: 'Email inválido.' });
        }

        const utilizador = await req.db.get(
            'SELECT id, nome, email, email_confirmado FROM utilizadores WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        const respostaGenerica = {
            mensagem: 'Se existir uma conta pendente com este email, enviámos novas instruções.'
        };

        if (!utilizador || utilizador.email_confirmado) {
            return res.json(respostaGenerica);
        }

        const { token, codigo } = await criarTokenConfirmacao(req.db, utilizador.id);
        const { resultado } = await enviarEmailConfirmacao({
            nome: utilizador.nome,
            email: utilizador.email,
            token,
            codigo
        });

        const resposta = { ...respostaGenerica, emailEnviado: resultado.enviado };

        if (!resultado.enviado && process.env.NODE_ENV !== 'production') {
            resposta.codigoDesenvolvimento = codigo;
        }

        res.json(resposta);
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
            `SELECT id, nome, email, telefone, password_hash, perfil, ativo, email_confirmado, barbeiro_id,
                    metodo_pagamento, perfil_completo, auth_provider, google_id
             FROM utilizadores WHERE email = ?`,
            [email.toLowerCase().trim()]
        );

        if (!utilizador) {
            return res.status(404).json({
                erro: 'Este email não está registado. Crie conta na aba Registar.',
                codigo: 'EMAIL_NAO_REGISTADO'
            });
        }

        const semPasswordLocal = !utilizador.password_hash || utilizador.password_hash === '';
        if (semPasswordLocal && (utilizador.google_id || utilizador.auth_provider === 'google')) {
            return res.status(401).json({
                erro: 'Esta conta foi criada com Google. Use o botão "Entrar com Google".',
                codigo: 'USE_GOOGLE'
            });
        }

        if (semPasswordLocal) {
            return res.status(401).json({
                erro: 'Conta sem palavra-passe. Use Google ou recupere a palavra-passe.',
                codigo: 'SEM_PASSWORD'
            });
        }

        const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
        if (!passwordValida) {
            return res.status(401).json({
                erro: 'Palavra-passe incorreta. Tente novamente ou recupere a palavra-passe.',
                codigo: 'PASSWORD_INVALIDA'
            });
        }

        if (!utilizador.email_confirmado || !utilizador.ativo) {
            await req.db.run(
                'UPDATE utilizadores SET ativo = 1, email_confirmado = 1 WHERE id = ?',
                [utilizador.id]
            );
            utilizador.ativo = 1;
            utilizador.email_confirmado = 1;
        }

        return responderSessaoCliente(res, utilizador, 'Login efetuado com sucesso.');
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/auth/admin-login — painel administrativo (apenas administrador principal)
 */
router.post('/admin-login', async (req, res) => {
    try {
        const { utilizador, password } = req.body;

        if (!utilizador || !password) {
            return res.status(400).json({ erro: 'Utilizador e palavra-passe são obrigatórios.' });
        }

        const mapaUtilizadores = {
            admin: 'admin@sensebarbearia.pt',
            geraldo: 'sensegeraldo2@gmail.com',
            geraldo_sense: 'sensegeraldo2@gmail.com',
            'geraldo sense': 'sensegeraldo2@gmail.com'
        };

        const chave = utilizador.toLowerCase().trim();
        let email = chave.includes('@') ? chave : (mapaUtilizadores[chave] || null);

        let row = null;
        if (email) {
            row = await req.db.get(
                `SELECT id, nome, email, telefone, password_hash, perfil, ativo, email_confirmado, barbeiro_id, metodo_pagamento, perfil_completo
                 FROM utilizadores WHERE email = ?`,
                [email.toLowerCase().trim()]
            );
        }

        if (!row) {
            row = await req.db.get(
                `SELECT id, nome, email, telefone, password_hash, perfil, ativo, email_confirmado, barbeiro_id, metodo_pagamento, perfil_completo
                 FROM utilizadores WHERE LOWER(TRIM(nome)) = ?`,
                [utilizador.toLowerCase().trim()]
            );
        }

        if (!row) {
            return res.status(401).json({ erro: 'Credenciais incorretas. Tente novamente.' });
        }

        const perfilAdmin = row.perfil === 'administrador' || ADMIN_EMAILS.includes(row.email.toLowerCase());
        if (!perfilAdmin) {
            return res.status(403).json({ erro: 'Acesso reservado ao administrador principal.' });
        }

        const passwordValida = await bcrypt.compare(password, row.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ erro: 'Credenciais incorretas. Tente novamente.' });
        }

        if (!row.ativo || !row.email_confirmado) {
            await req.db.run(
                'UPDATE utilizadores SET ativo = 1, email_confirmado = 1 WHERE id = ?',
                [row.id]
            );
        }

        if (row.perfil !== 'administrador') {
            await req.db.run(
                "UPDATE utilizadores SET perfil = 'administrador' WHERE id = ?",
                [row.id]
            );
            row.perfil = 'administrador';
        }

        const token = gerarToken(row);

        res.json({
            mensagem: 'Sessão de administrador iniciada.',
            token,
            utilizador: formatarUtilizador(row)
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
            `SELECT id, nome, email, telefone, perfil, ativo, email_confirmado, barbeiro_id, metodo_pagamento, perfil_completo
             FROM utilizadores WHERE id = ?`,
            [req.utilizador.id]
        );

        if (!utilizador || !utilizador.ativo) {
            return res.status(401).json({ erro: 'Conta inativa ou não encontrada.' });
        }

        res.json({ utilizador: formatarUtilizador(utilizador) });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/auth/completar-perfil — método de pagamento e finalização
 */
router.post('/completar-perfil', verificarToken, async (req, res) => {
    try {
        const { metodo_pagamento } = req.body;
        const metodosValidos = ['mbway', 'visa', 'revolut'];

        if (!metodo_pagamento || !metodosValidos.includes(metodo_pagamento)) {
            return res.status(400).json({ erro: 'Selecione um método de pagamento válido.' });
        }

        await req.db.run(
            'UPDATE utilizadores SET metodo_pagamento = ?, perfil_completo = 1 WHERE id = ?',
            [metodo_pagamento, req.utilizador.id]
        );

        const utilizador = await req.db.get(
            `SELECT id, nome, email, telefone, perfil, ativo, email_confirmado, barbeiro_id, metodo_pagamento, perfil_completo
             FROM utilizadores WHERE id = ?`,
            [req.utilizador.id]
        );

        res.json({
            mensagem: 'Perfil concluído com sucesso.',
            utilizador: formatarUtilizador(utilizador)
        });
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
            assunto: 'Recuperação de Palavra-passe - Sense Barbershop',
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
