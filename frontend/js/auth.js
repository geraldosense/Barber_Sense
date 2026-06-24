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
    localStorage.setItem('authToken', token);
    localStorage.setItem('utilizador', JSON.stringify(utilizador));
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

        const painelBtn = utilizadorAtual.perfil === 'administrador'
            ? `<a href="painel.html" class="login-btn" id="btn-adm"><i class="fas fa-cog"></i> Painel</a>`
            : '';

        authButtons.classList.remove('auth-buttons--empty');
        authButtons.innerHTML = `
            <div class="user-profile">
                <div class="user-avatar"><i class="fas ${perfilIcon}"></i></div>
                <div class="user-info">
                    <span class="user-name">${escapeHtml(utilizadorAtual.nome.split(' ')[0])}</span>
                    <span class="user-perfil">${perfilLabel}</span>
                </div>
                <button type="button" class="logout-btn" id="btnLogout">Sair</button>
            </div>
            ${painelBtn}
            <a href="marcacao.html" class="register-btn" id="btnAgendarNav">Reservar</a>
        `;

        document.getElementById('btnLogout')?.addEventListener('click', (e) => {
            e.preventDefault();
            limparSessao();
            if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
            mostrarNotificacaoAuth('Sessão terminada com sucesso.', 'info');
            window.location.href = 'conta.html';
        });

        document.getElementById('btn-adm')?.addEventListener('click', () => {
            sessionStorage.setItem('admPainelOk', '1');
        });

        document.getElementById('btnAgendarNav')?.addEventListener('click', (e) => {
            e.preventDefault();
            irParaMarcacao();
        });

        if (typeof renderPendingBadge === 'function') renderPendingBadge();
        if (typeof mostrarAreaLogada === 'function') mostrarAreaLogada(false);
    } else {
        if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
        authButtons.innerHTML = '';
        authButtons.classList.add('auth-buttons--empty');
    }
}

function redirecionarAposAuth(utilizador) {
    if (!utilizador) return;

    if (utilizador.perfil === 'administrador') {
        sessionStorage.setItem('admPainelOk', '1');
        window.location.href = 'painel.html';
        return;
    }

    if (utilizador.perfil === 'barbeiro') {
        window.location.href = 'index.html#minha-area';
        return;
    }

    if (!utilizador.perfil_completo) {
        window.location.href = 'finalizar.html';
        return;
    }

    window.location.href = 'marcacao.html';
}

function irParaConta(tab) {
    const url = tab ? `conta.html?tab=${tab}` : 'conta.html';
    window.location.href = url;
}

function irParaMarcacao() {
    if (estaAutenticado() && ['cliente', 'administrador'].includes(utilizadorAtual?.perfil)) {
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
        mostrarAuthMessage('Erro de ligação ao servidor. Inicie o backend em http://localhost:3000', 'error');
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
                shape: 'rectangular',
                width: 320
            });
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
            mostrarAuthMessage(data.erro || 'Erro ao criar conta.', 'error');
            return;
        }

        if (data.token && data.utilizador) {
            guardarSessao(data.token, data.utilizador);
            redirecionarAposAuth(data.utilizador);
            return;
        }

        mostrarAuthMessage(data.mensagem || 'Conta criada com sucesso!', 'success');
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
            mostrarAuthMessage(data.erro || 'Email ou palavra-passe inválidos.', 'error');
            return;
        }

        guardarSessao(data.token, data.utilizador);
        fecharModalAuth();
        redirecionarAposAuth(data.utilizador);
    } catch {
        mostrarAuthMessage(
            'Erro de ligação ao servidor. Inicie o backend: abra o terminal na pasta backend e execute "npm start", depois abra http://localhost:3000',
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

    configurarTogglePassword();
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
