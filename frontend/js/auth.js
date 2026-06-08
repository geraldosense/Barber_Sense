// ===== GESTÃO DE AUTENTICAÇÃO (dados guardados na base de dados SQLite via API) =====
var utilizadorAtual = null;

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

        const painelBtn = ['barbeiro', 'administrador'].includes(utilizadorAtual.perfil)
            ? `<button type="button" class="login-btn" id="btn-adm"><i class="fas fa-images"></i> Painel</button>`
            : '';

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
            <a href="#" class="register-btn" id="btnAgendarNav">Agendar Corte</a>
        `;

        document.getElementById('btnLogout')?.addEventListener('click', (e) => {
            e.preventDefault();
            limparSessao();
            if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
            mostrarNotificacaoAuth('Sessão terminada com sucesso.', 'info');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.getElementById('btn-adm')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof abrirPainel === 'function') abrirPainel();
        });

        document.getElementById('btnAgendarNav')?.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalAgendamentoComAuth();
        });

        if (typeof renderPendingBadge === 'function') renderPendingBadge();
        if (typeof mostrarAreaLogada === 'function') mostrarAreaLogada(false);
    } else {
        if (typeof esconderAreaLogada === 'function') esconderAreaLogada();
        authButtons.innerHTML = `
            <a href="#" class="login-btn" id="btnLogin">Login</a>
            <a href="#" class="register-btn-outline" id="btnRegistar">Registar</a>
            <a href="#" class="register-btn" id="btnAgendarNav">Agendar Corte</a>
        `;

        document.getElementById('btnLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalAuth('login');
        });
        document.getElementById('btnRegistar')?.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalAuth('registo');
        });
        document.getElementById('btnAgendarNav')?.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalAgendamentoComAuth();
        });
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
    mudarTabAuth(tab);
    esconderAuthMessage();
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
    if (!estaAutenticado()) {
        mostrarNotificacaoAuth('Faça login ou crie conta para agendar.', 'info');
        abrirModalAuth('login');
        return;
    }
    if (typeof abrirModal === 'function') abrirModal();
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
        if (typeof mostrarAreaLogada === 'function') mostrarAreaLogada(true);
        mostrarNotificacaoAuth(`Bem-vindo, ${data.utilizador.nome}! A sua área privada está aberta.`, 'success');
        if (typeof renderPendingBadge === 'function') renderPendingBadge();
    } catch {
        mostrarAuthMessage(
            'Erro de ligação ao servidor. Inicie o backend: abra o terminal na pasta backend e execute "npm start", depois abra http://localhost:3000',
            'error'
        );
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

        mostrarAuthMessage(data.mensagem, 'success');
        document.getElementById('formRegisto').reset();
        setTimeout(() => mudarTabAuth('login'), 3000);
    } catch {
        mostrarAuthMessage('Erro de ligação ao servidor. Tente novamente.', 'error');
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
    document.getElementById('btnLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalAuth('login');
    });
    document.getElementById('btnRegistar')?.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalAuth('registo');
    });
    document.getElementById('btnAgendarNav')?.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalAgendamentoComAuth();
    });
}

function configurarAuth() {
    bindAuthHeaderButtons();

    document.getElementById('closeAuthModal')?.addEventListener('click', fecharModalAuth);

    document.getElementById('modalAuth')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalAuth') fecharModalAuth();
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => mudarTabAuth(tab.dataset.tab));
    });

    document.getElementById('formLogin')?.addEventListener('submit', submeterLogin);
    document.getElementById('formRegisto')?.addEventListener('submit', submeterRegisto);
    document.getElementById('formRecuperar')?.addEventListener('submit', submeterRecuperar);
    document.getElementById('formRecuperarCodigo')?.addEventListener('submit', submeterRecuperarCodigo);

    document.getElementById('linkEsqueciPassword')?.addEventListener('click', (e) => {
        e.preventDefault();
        mudarTabAuth('recuperar');
    });

    configurarTogglePassword();
    verificarSessao();
}

document.addEventListener('DOMContentLoaded', configurarAuth);
