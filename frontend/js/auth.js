// ===== GESTÃO DE AUTENTICAÇÃO (Google + email legado) =====
var utilizadorAtual = null;
var pendingGoogleCredential = null;
var googleClientId = null;

function obterToken() {
    return localStorage.getItem('authToken');
}

function estaAutenticado() {
    return !!obterToken() && !!utilizadorAtual;
}

function guardarSessao(token, utilizador) {
    sessionStorage.removeItem('admPainelOk');
    localStorage.setItem('authToken', token);
    localStorage.setItem('utilizador', JSON.stringify(utilizador));
    if (utilizador?.email) {
        localStorage.setItem('senseUltimoEmail', utilizador.email.toLowerCase().trim());
        localStorage.setItem('senseContaRegistada', '1');
    }
    utilizadorAtual = utilizador;
    atualizarUIAuth();
}

function limparSessao() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('utilizador');
    utilizadorAtual = null;
    atualizarUIAuth();
}

async function verificarSessao() {
    const token = obterToken();
    const guardado = localStorage.getItem('utilizador');

    if (guardado) {
        try {
            utilizadorAtual = JSON.parse(guardado);
        } catch {
            utilizadorAtual = null;
        }
    }

    if (!token) {
        atualizarUIAuth();
        if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            utilizadorAtual = data.utilizador;
            const emPaginaAdmin = /admin-login|painel/.test(window.location.pathname);
            if (utilizadorAtual?.perfil === 'administrador' && sessionStorage.getItem('admPainelOk') !== '1' && !emPaginaAdmin) {
                limparSessao();
                return;
            }
            localStorage.setItem('utilizador', JSON.stringify(utilizadorAtual));
        } else {
            limparSessao();
        }
    } catch {
        /* mantém sessão local se backend offline */
    }

    atualizarUIAuth();
    if (utilizadorAtual && obterToken()) {
        if (typeof mostrarAreaLogada === 'function') mostrarAreaLogada(false);
    } else {
        if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
    }
}

function atualizarUIAuth() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;

    if (utilizadorAtual && obterToken()) {
        const perfilIcon = {
            cliente: 'fa-user',
            barbeiro: 'fa-cut',
            administrador: 'fa-cog'
        }[utilizadorAtual.perfil] || 'fa-user';

        const perfilLabel = {
            cliente: 'Cliente',
            barbeiro: 'Barbeiro',
            administrador: 'Admin'
        }[utilizadorAtual.perfil] || 'Utilizador';

        const painelBtn = '';

        authButtons.classList.remove('auth-buttons--empty');
        authButtons.innerHTML = `
            <div class="user-profile">
                <div class="user-avatar"><i class="fas ${perfilIcon}"></i></div>
                <div class="user-info">
                    <span class="user-name">${escapeHtml(utilizadorAtual.nome.split(' ')[0])}</span>
                    <span class="user-perfil">${perfilLabel}</span>
                </div>
                <button type="button" class="logout-btn" id="btnLogout">${typeof t === 'function' ? t('auth.logout') : 'Sair'}</button>
            </div>
            ${painelBtn}
            <a href="marcacao.html" class="register-btn" id="btnAgendarNav">${typeof t === 'function' ? t('auth.bookNow') : 'Reservar'}</a>
        `;

        document.getElementById('btnLogout')?.addEventListener('click', (e) => {
            e.preventDefault();
            limparSessao();
            if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
            mostrarNotificacaoAuth('Sessão terminada com sucesso.', 'info');
            window.location.href = 'conta.html';
        });

        document.getElementById('btnAgendarNav')?.addEventListener('click', (e) => {
            e.preventDefault();
            irParaMarcacao();
        });

        if (typeof renderPendingBadge === 'function') renderPendingBadge();
        if (typeof mostrarAreaLogada === 'function') mostrarAreaLogada(false);
    } else {
        if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
        authButtons.classList.remove('auth-buttons--empty');
        authButtons.innerHTML = `
            <a href="conta.html" class="login-btn" id="btnLogin"><i class="fas fa-user"></i> ${typeof t === 'function' ? t('auth.login') : 'Entrar'}</a>
            <a href="marcacao.html" class="register-btn" id="btnAgendarNav">${typeof t === 'function' ? t('auth.bookNow') : 'Reservar'}</a>
        `;

        document.getElementById('btnLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'conta.html';
        });
        document.getElementById('btnAgendarNav')?.addEventListener('click', (e) => {
            e.preventDefault();
            irParaMarcacao();
        });
    }
}

function redirecionarAposAuth(utilizador) {
    if (!utilizador) return;

    if (utilizador.perfil === 'barbeiro') {
        window.location.href = 'index.html#minha-area';
        return;
    }

    window.location.href = 'marcacao.html';
}

function irParaConta(tab) {
    const url = tab ? `conta.html?tab=${tab}` : 'conta.html';
    window.location.href = url;
}

function irParaMarcacao() {
    if (estaAutenticado() && utilizadorAtual?.perfil === 'cliente') {
        window.location.href = 'marcacao.html';
    } else {
        window.location.href = 'conta.html';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function abrirModalAuth(tab = 'login') {
    const modal = document.getElementById('modalAuth');
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    resetarPainelGoogle();
    mudarTabAuth(tab);
    esconderAuthMessage();
}

function resetarPainelGoogle() {
    pendingGoogleCredential = null;
    const perfilPanel = document.getElementById('panelCompletarPerfil');
    perfilPanel?.classList.add('hidden');
    perfilPanel?.classList.remove('active');
    document.getElementById('googleSignInWrap')?.classList.remove('hidden');
    document.getElementById('panel-login')?.classList.add('active');
    document.getElementById('formCompletarPerfil')?.reset();
}

function fecharModalAuth() {
    const modal = document.getElementById('modalAuth');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    esconderAuthMessage();
}

function mudarTabAuth(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.auth-panel').forEach(p => {
        p.classList.toggle('active', p.id === `panel-${tab}`);
    });

    const titulo = document.getElementById('contaTitulo');
    const subtitulo = document.getElementById('contaSubtitulo');
    if (titulo && subtitulo) {
        const tr = typeof t === 'function' ? t : (k) => k;
        if (tab === 'registo') {
            titulo.textContent = tr('auth.titleRegister');
            subtitulo.textContent = tr('auth.subRegister');
        } else if (tab === 'recuperar') {
            titulo.textContent = tr('auth.titleRecover');
            subtitulo.textContent = tr('auth.subRecover');
        } else {
            titulo.textContent = tr('auth.titleLogin');
            subtitulo.textContent = tr('auth.subLogin');
        }
    }

    const esconderGoogle = tab === 'recuperar';
    document.getElementById('googleSignInWrap')?.classList.toggle('hidden', esconderGoogle);
    document.getElementById('authDivider')?.classList.toggle('hidden', esconderGoogle);
    document.getElementById('googleNota')?.classList.toggle('hidden', esconderGoogle);
}

function mostrarAuthMessage(mensagem, tipo = 'info') {
    const el = document.getElementById('authMessage');
    if (!el) return;
    el.textContent = mensagem;
    el.className = `auth-message ${tipo}`;
    el.classList.remove('hidden');
}

function esconderAuthMessage() {
    const el = document.getElementById('authMessage');
    if (el) el.classList.add('hidden');
}

function guardarEmailCliente(email) {
    const limpo = (email || '').toLowerCase().trim();
    if (!limpo) return;
    localStorage.setItem('senseUltimoEmail', limpo);
    localStorage.setItem('senseContaRegistada', '1');
}

function preencherEmailGuardado() {
    const email = localStorage.getItem('senseUltimoEmail');
    const loginEl = document.getElementById('loginEmail');
    if (!email || !loginEl || loginEl.value.trim()) return;
    loginEl.value = email;
    if (localStorage.getItem('senseContaRegistada') === '1') {
        verificarEmailRegistado(email, 'login', true);
    }
}

let verificarEmailTimer = null;

async function verificarEmailRegistado(email, contexto = 'login', silencioso = false) {
    const limpo = (email || '').trim();
    if (!limpo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) return;

    try {
        const res = await fetch(`${API_URL}/auth/verificar-email?email=${encodeURIComponent(limpo)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (contexto === 'login' && data.registado) {
            if (!silencioso) {
                if (data.auth_provider === 'google') {
                    mostrarAuthMessage(
                        `Conta encontrada (${data.nome}). Use o botão «Entrar com Google».`,
                        'success'
                    );
                } else {
                    mostrarAuthMessage(
                        `Bem-vindo de volta, ${data.nome}! A sua conta já está registada — introduza a palavra-passe.`,
                        'success'
                    );
                }
            }
            document.getElementById('loginPassword')?.focus();
            return;
        }

        if (contexto === 'registo' && data.registado) {
            document.getElementById('loginEmail').value = limpo;
            mudarTabAuth('login');
            if (data.auth_provider === 'google') {
                mostrarAuthMessage(
                    `Este email já está registado com Google (${data.nome}). Use o botão Google para entrar.`,
                    'info'
                );
            } else {
                mostrarAuthMessage(
                    `Este email já está registado. Introduza a palavra-passe na aba Entrar.`,
                    'info'
                );
                document.getElementById('loginPassword')?.focus();
            }
        }
    } catch {
        /* silencioso */
    }
}

function agendarVerificacaoEmail(email, contexto) {
    clearTimeout(verificarEmailTimer);
    verificarEmailTimer = setTimeout(() => verificarEmailRegistado(email, contexto), 500);
}

function mostrarNotificacaoAuth(mensagem, tipo = 'info') {
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao(mensagem, tipo);
    } else {
        alert(mensagem);
    }
}

function abrirModalAgendamentoComAuth() {
    irParaMarcacao();
}

async function processarRespostaAuth(data) {
    if (data.needsProfile) {
        document.getElementById('googleSignInWrap')?.classList.add('hidden');
        document.getElementById('panel-login')?.classList.remove('active');
        const perfilPanel = document.getElementById('panelCompletarPerfil');
        perfilPanel?.classList.remove('hidden');
        perfilPanel?.classList.add('active');
        mostrarAuthMessage(data.mensagem || 'Indique o seu telefone para continuar.', 'info');
        return;
    }

    guardarSessao(data.token, data.utilizador);
    fecharModalAuth();
    redirecionarAposAuth(data.utilizador);
}

async function loginComGoogle(credential) {
    pendingGoogleCredential = credential;
    esconderAuthMessage();

    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
        });
        const data = await res.json();

        if (!res.ok) {
            mostrarAuthMessage(data.erro || 'Erro na autenticação Google.', 'error');
            return;
        }

        await processarRespostaAuth(data);
    } catch {
        mostrarAuthMessage('O sistema está a arrancar. Aguarde alguns segundos — a ligação é automática.', 'error');
    }
}

async function submeterCompletarPerfil(e) {
    e.preventDefault();
    esconderAuthMessage();

    const telefone = document.getElementById('googleTelefone').value.trim();
    if (!telefone) {
        mostrarAuthMessage('Indique um telefone válido.', 'error');
        return;
    }
    if (!pendingGoogleCredential) {
        mostrarAuthMessage('Sessão Google expirada. Tente entrar novamente.', 'error');
        resetarPainelGoogle();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: pendingGoogleCredential, telefone })
        });
        const data = await res.json();

        if (!res.ok) {
            mostrarAuthMessage(data.erro || 'Erro ao completar perfil.', 'error');
            return;
        }

        await processarRespostaAuth(data);
    } catch {
        mostrarAuthMessage('Erro de ligação ao servidor.', 'error');
    }
}

async function carregarConfigAuth() {
    try {
        const res = await fetch(`${API_URL}/auth/config`);
        if (!res.ok) return;
        const data = await res.json();
        googleClientId = data.googleClientId || '';
        window.GOOGLE_CLIENT_ID = googleClientId;
    } catch {
        /* backend offline */
    }
}

function inicializarGoogleSignIn() {
    const wrap = document.getElementById('googleSignInWrap');
    if (!googleClientId) {
        if (wrap) {
            wrap.innerHTML = '<p class="auth-google-nota"><i class="fas fa-info-circle"></i> Configure <strong>GOOGLE_CLIENT_ID</strong> no ficheiro backend/.env para activar o login Google.</p>';
        }
        return;
    }

    const init = () => {
        if (!window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => loginComGoogle(response.credential),
            auto_select: false
        });

        const btn = document.getElementById('googleSignInBtn');
        if (btn) {
            btn.innerHTML = '';
            window.google.accounts.id.renderButton(btn, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'pill',
                width: 320
            });
        }

        const nota = document.getElementById('googleNota');
        if (nota) {
            nota.innerHTML = '<i class="fab fa-google"></i> Entrar com conta Google verificada';
        }
    };

    if (window.google?.accounts?.id) {
        init();
    } else {
        window.addEventListener('load', init);
    }
}

async function submeterRegisto(e) {
    e.preventDefault();
    esconderAuthMessage();

    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const telefone = document.getElementById('regTelefone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regPasswordConfirm').value;

    if (password !== confirm) {
        mostrarAuthMessage('As palavras-passe não coincidem.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/registo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, telefone, password })
        });

        const data = await res.json();

        if (!res.ok) {
            if (res.status === 409 || data.codigo === 'EMAIL_JA_REGISTADO') {
                guardarEmailCliente(email);
                document.getElementById('loginEmail').value = email;
                mudarTabAuth('login');
                mostrarAuthMessage(
                    data.erro || 'Este email já está registado. Utilize a palavra-passe para entrar.',
                    'info'
                );
                document.getElementById('loginPassword')?.focus();
                return;
            }
            mostrarAuthMessage(data.erro || 'Erro ao criar conta.', 'error');
            return;
        }

        if (data.token && data.utilizador) {
            guardarSessao(data.token, data.utilizador);
            guardarEmailCliente(email);
            mostrarAuthMessage(data.mensagem || 'Conta criada e validada! A iniciar sessão...', 'success');
            setTimeout(() => redirecionarAposAuth(data.utilizador), 900);
            return;
        }

        guardarEmailCliente(email);
        document.getElementById('loginEmail').value = email;
        mostrarAuthMessage(data.mensagem || 'Conta criada com sucesso! Pode entrar com o seu email.', 'success');
        mudarTabAuth('login');
    } catch {
        mostrarAuthMessage('Erro de ligação ao servidor.', 'error');
    }
}

async function submeterLogin(e) {
    e.preventDefault();
    esconderAuthMessage();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            if (data.codigo === 'EMAIL_NAO_REGISTADO') {
                document.getElementById('regEmail').value = email;
                mostrarAuthMessage(data.erro, 'info');
                mudarTabAuth('registo');
                return;
            }
            if (data.codigo === 'PASSWORD_INVALIDA') {
                mostrarAuthMessage(data.erro, 'error');
                document.getElementById('loginPassword')?.focus();
                return;
            }
            const tipo = data.codigo === 'USE_GOOGLE' ? 'info' : 'error';
            mostrarAuthMessage(data.erro || 'Email ou palavra-passe inválidos.', tipo);
            return;
        }

        guardarEmailCliente(email);
        guardarSessao(data.token, data.utilizador);
        fecharModalAuth();
        mostrarAuthMessage('Sessão iniciada com sucesso!', 'success');
        redirecionarAposAuth(data.utilizador);
    } catch {
        mostrarAuthMessage(
            'O Sense Barbershop está a iniciar. Aguarde — a ligação é feita automaticamente.',
            'error'
        );
    }
}

async function submeterRecuperar(e) {
    e.preventDefault();
    esconderAuthMessage();

    const email = document.getElementById('recEmail').value.trim();

    try {
        const res = await fetch(`${API_URL}/auth/recuperar-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        mostrarAuthMessage(data.mensagem || 'Instruções enviadas por email.', 'success');
        document.getElementById('formRecuperar').reset();
    } catch {
        mostrarAuthMessage('Erro de ligação ao servidor.', 'error');
    }
}

async function submeterRecuperarCodigo(e) {
    e.preventDefault();
    esconderAuthMessage();

    const email = document.getElementById('recEmailCodigo').value.trim();
    const codigo = document.getElementById('recCodigo').value.trim();
    const password = document.getElementById('recNovaPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/redefinir-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, codigo, password })
        });

        const data = await res.json();

        if (!res.ok) {
            mostrarAuthMessage(data.erro || 'Código inválido.', 'error');
            return;
        }

        mostrarAuthMessage(data.mensagem, 'success');
        document.getElementById('formRecuperarCodigo').reset();
        setTimeout(() => mudarTabAuth('login'), 2500);
    } catch {
        mostrarAuthMessage('Erro de ligação ao servidor.', 'error');
    }
}

function configurarTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}

function bindAuthHeaderButtons() {
    document.getElementById('btnAgendarNav')?.addEventListener('click', (e) => {
        e.preventDefault();
        irParaMarcacao();
    });
}

function configurarAuth() {
    bindAuthHeaderButtons();

    const params = new URLSearchParams(window.location.search);
    const tabInicial = params.get('tab');
    if (tabInicial && ['login', 'registo', 'recuperar'].includes(tabInicial)) {
        mudarTabAuth(tabInicial);
    }

    document.getElementById('closeAuthModal')?.addEventListener('click', fecharModalAuth);

    document.getElementById('modalAuth')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalAuth') fecharModalAuth();
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => mudarTabAuth(tab.dataset.tab));
    });

    document.getElementById('formLogin')?.addEventListener('submit', submeterLogin);
    document.getElementById('formRegisto')?.addEventListener('submit', submeterRegisto);
    document.getElementById('formCompletarPerfil')?.addEventListener('submit', submeterCompletarPerfil);
    document.getElementById('formRecuperar')?.addEventListener('submit', submeterRecuperar);

    document.getElementById('linkEsqueciPassword')?.addEventListener('click', (e) => {
        e.preventDefault();
        mudarTabAuth('recuperar');
    });

    document.getElementById('linkIrLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        esconderAuthMessage();
        const regEmail = document.getElementById('regEmail')?.value.trim();
        if (regEmail) {
            document.getElementById('loginEmail').value = regEmail;
        }
        mudarTabAuth('login');
        if (regEmail) verificarEmailRegistado(regEmail, 'login');
    });

    document.getElementById('linkIrRegisto')?.addEventListener('click', (e) => {
        e.preventDefault();
        esconderAuthMessage();
        const loginEmail = document.getElementById('loginEmail')?.value.trim();
        if (loginEmail) {
            document.getElementById('regEmail').value = loginEmail;
        }
        mudarTabAuth('registo');
    });

    document.getElementById('loginEmail')?.addEventListener('blur', (e) => {
        verificarEmailRegistado(e.target.value.trim(), 'login');
    });

    document.getElementById('loginEmail')?.addEventListener('input', (e) => {
        agendarVerificacaoEmail(e.target.value.trim(), 'login');
    });

    document.getElementById('regEmail')?.addEventListener('blur', (e) => {
        verificarEmailRegistado(e.target.value.trim(), 'registo');
    });

    configurarTogglePassword();
    preencherEmailGuardado();
    carregarConfigAuth().then(() => {
        inicializarGoogleSignIn();
        if (document.body.dataset.authPage !== 'conta') {
            verificarSessao();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.authPage === 'conta') return;
    configurarAuth();
});

document.addEventListener('sense:langchange', () => {
    atualizarUIAuth();
    const activeTab = document.querySelector('.auth-tab.active')?.dataset.tab || 'login';
    if (document.getElementById('contaTitulo')) mudarTabAuth(activeTab);
});
