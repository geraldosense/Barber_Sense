// ===== ÁREA PRIVADA APÓS LOGIN / REGISTO =====

var dashTabAtual = 'inicio';

function mostrarAreaLogada(redirecionar) {
    const area = document.getElementById('minha-area');
    const hero = document.getElementById('home');
    const navLink = document.getElementById('navMinhaArea');

    if (!utilizadorAtual || !area) return;

    area.classList.remove('hidden');
    if (hero) hero.classList.add('hero-compact');
    if (navLink) navLink.style.display = '';

    document.getElementById('dash-nome').textContent = utilizadorAtual.nome.split(' ')[0];

    const perfilEl = document.getElementById('dash-perfil');
    const perfis = {
        cliente: { label: 'Cliente', cls: 'cliente', icon: 'fa-user' },
        barbeiro: { label: 'Barbeiro', cls: 'barbeiro', icon: 'fa-cut' },
        administrador: { label: 'Administrador', cls: 'admin', icon: 'fa-cog' }
    };
    const p = perfis[utilizadorAtual.perfil] || perfis.cliente;
    perfilEl.className = `dash-perfil-badge ${p.cls}`;
    perfilEl.innerHTML = `<i class="fas ${p.icon}"></i> ${p.label}`;

    renderizarTabsArea();
    mudarTabArea(dashTabAtual || 'inicio');

    if (redirecionar !== false) {
        setTimeout(() => {
            area.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

function esconderAreaLogada() {
    const area = document.getElementById('minha-area');
    const hero = document.getElementById('home');
    const navLink = document.getElementById('navMinhaArea');

    if (area) area.classList.add('hidden');
    if (hero) hero.classList.remove('hero-compact');
    if (navLink) navLink.style.display = 'none';
}

function renderizarTabsArea() {
    const nav = document.getElementById('area-tabs');
    if (!nav || !utilizadorAtual) return;

    const perfil = utilizadorAtual.perfil;
    let tabs = [{ id: 'inicio', icon: 'fa-home', label: 'Início' }];

    if (perfil === 'cliente') {
        tabs.push(
            { id: 'agendamentos', icon: 'fa-calendar-check', label: 'Marcações' },
            { id: 'agendar', icon: 'fa-plus', label: 'Agendar' }
        );
    } else if (perfil === 'barbeiro') {
        tabs.push(
            { id: 'publicar', icon: 'fa-camera', label: 'Publicar Corte' },
            { id: 'pendentes', icon: 'fa-clock', label: 'Meus Pendentes' },
            { id: 'agendamentos', icon: 'fa-calendar', label: 'Agenda' }
        );
    } else if (perfil === 'administrador') {
        tabs.push(
            { id: 'aprovar', icon: 'fa-check-circle', label: 'Aprovar Cortes' },
            { id: 'publicar', icon: 'fa-camera', label: 'Publicar' },
            { id: 'agendamentos', icon: 'fa-chart-bar', label: 'Agendamentos' }
        );
    }

    nav.innerHTML = tabs.map(t => `
        <button type="button" class="area-tab ${t.id === dashTabAtual ? 'active' : ''}" data-dash="${t.id}">
            <i class="fas ${t.icon}"></i> ${t.label}
        </button>
    `).join('');

    nav.querySelectorAll('.area-tab').forEach(btn => {
        btn.addEventListener('click', () => mudarTabArea(btn.dataset.dash));
    });
}

function mudarTabArea(tab) {
    dashTabAtual = tab;
    document.querySelectorAll('.area-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.dash === tab);
    });

    const main = document.getElementById('area-main-content');
    if (!main) return;

    switch (tab) {
        case 'inicio': renderDashInicio(main); break;
        case 'agendamentos': renderDashAgendamentos(main); break;
        case 'agendar': renderDashAgendar(main); break;
        case 'publicar': renderDashPublicar(main); break;
        case 'pendentes': renderDashPendentes(main); break;
        case 'aprovar': renderDashAprovar(main); break;
        default: renderDashInicio(main);
    }
}

function renderDashInicio(el) {
    const perfil = utilizadorAtual.perfil;
    let cards = '';

    if (perfil === 'cliente') {
        cards = `
            <div class="dash-card" onclick="mudarTabArea('agendar')">
                <i class="fas fa-calendar-plus"></i>
                <h3>Agendar Corte</h3>
                <p>Marque o seu próximo corte online</p>
            </div>
            <div class="dash-card" onclick="mudarTabArea('agendamentos')">
                <i class="fas fa-history"></i>
                <h3>Minhas Marcações</h3>
                <p>Consulte histórico e próximas visitas</p>
            </div>`;
    } else if (perfil === 'barbeiro') {
        cards = `
            <div class="dash-card" onclick="mudarTabArea('publicar')">
                <i class="fas fa-camera"></i>
                <h3>Publicar Corte</h3>
                <p>Adicione fotos à galeria</p>
            </div>
            <div class="dash-card" onclick="mudarTabArea('pendentes')">
                <i class="fas fa-clock"></i>
                <h3>Pendentes</h3>
                <p>Cortes à espera de aprovação</p>
            </div>
            <div class="dash-card" onclick="abrirPainel()">
                <i class="fas fa-images"></i>
                <h3>Painel Completo</h3>
                <p>Gestão avançada de publicações</p>
            </div>`;
    } else {
        cards = `
            <div class="dash-card" onclick="mudarTabArea('aprovar')">
                <i class="fas fa-check-double"></i>
                <h3>Aprovar Cortes</h3>
                <p>Rever e publicar trabalhos dos barbeiros</p>
            </div>
            <div class="dash-card" onclick="mudarTabArea('agendamentos')">
                <i class="fas fa-chart-line"></i>
                <h3>Agendamentos</h3>
                <p>Ver todas as marcações</p>
            </div>
            <div class="dash-card" onclick="abrirPainel()">
                <i class="fas fa-cog"></i>
                <h3>Painel Admin</h3>
                <p>Gestão completa do sistema</p>
            </div>`;
    }

    el.innerHTML = `
        <h3 class="area-main-title">Área de ${utilizadorAtual.nome}</h3>
        <p class="area-main-sub">Bem-vindo à sua área privada. Escolha uma opção abaixo.</p>
        <div class="dash-cards">${cards}</div>
        <div class="dash-info">
            <p><i class="fas fa-envelope"></i> ${escDash(utilizadorAtual.email)}</p>
            <p><i class="fas fa-phone"></i> ${escDash(utilizadorAtual.telefone || '—')}</p>
        </div>`;
}

async function renderDashAgendamentos(el) {
    el.innerHTML = '<p class="painel-loading"><i class="fas fa-spinner fa-spin"></i> A carregar marcações...</p>';

    try {
        let url = `${API_URL}/agendamentos?`;
        if (utilizadorAtual.perfil === 'cliente') {
            url += `email=${encodeURIComponent(utilizadorAtual.email)}`;
        }

        const res = await fetch(url, {
            headers: localStorage.getItem('authToken')
                ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                : {}
        });

        const lista = res.ok ? await res.json() : [];

        if (!lista.length) {
            el.innerHTML = `
                <h3 class="area-main-title">Marcações</h3>
                <p class="painel-empty">Nenhuma marcação encontrada.</p>
                ${utilizadorAtual.perfil === 'cliente' ? '<button class="cta-button" onclick="mudarTabArea(\'agendar\')">Agendar Agora</button>' : ''}`;
            return;
        }

        el.innerHTML = `
            <h3 class="area-main-title">Marcações (${lista.length})</h3>
            <div class="dash-lista">
                ${lista.map(a => `
                    <div class="dash-item">
                        <div class="dash-item-header">
                            <strong>${escDash(a.servico?.nome || a.servico_nome || 'Serviço')}</strong>
                            <span class="dash-status">${escDash(a.status || 'confirmado')}</span>
                        </div>
                        <p><i class="fas fa-user"></i> ${escDash(a.barbeiro?.nome || a.barbeiro_nome || '—')}</p>
                        <p><i class="fas fa-calendar"></i> ${escDash(a.data)} às ${escDash(a.hora)}</p>
                        ${a.nome ? `<p><i class="fas fa-id-card"></i> ${escDash(a.nome)}</p>` : ''}
                    </div>
                `).join('')}
            </div>`;
    } catch {
        el.innerHTML = '<p class="painel-empty">Erro ao carregar. Verifique se o backend está a correr em <strong>http://localhost:3000</strong></p>';
    }
}

function renderDashAgendar(el) {
    el.innerHTML = `
        <h3 class="area-main-title">Agendar Novo Corte</h3>
        <p class="area-main-sub">Os seus dados já estão preenchidos com a conta <strong>${escDash(utilizadorAtual.email)}</strong></p>
        <button type="button" class="cta-button" id="dashBtnAgendar">
            <i class="fas fa-calendar-plus"></i> Abrir Agendamento
        </button>`;

    document.getElementById('dashBtnAgendar')?.addEventListener('click', () => {
        if (typeof abrirModal === 'function') abrirModal();
    });
}

function renderDashPublicar(el) {
    el.innerHTML = `
        <h3 class="area-main-title">Publicar Novo Corte</h3>
        <p class="area-main-sub">Submeta um trabalho para a galeria pública.</p>
        <button type="button" class="cta-button" id="dashBtnPublicar">
            <i class="fas fa-upload"></i> Abrir Painel de Publicação
        </button>`;

    document.getElementById('dashBtnPublicar')?.addEventListener('click', () => {
        if (typeof abrirPainel === 'function') abrirPainel();
    });
}

async function renderDashPendentes(el) {
    el.innerHTML = '<p class="painel-loading"><i class="fas fa-spinner fa-spin"></i> A carregar...</p>';

    try {
        const res = await fetch(`${API_URL}/galeria/pendentes`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        const pending = res.ok ? await res.json() : [];

        if (!pending.length) {
            el.innerHTML = '<h3 class="area-main-title">Meus Pendentes</h3><p class="painel-empty">Nenhum corte pendente.</p>';
            return;
        }

        el.innerHTML = `
            <h3 class="area-main-title">Meus Pendentes (${pending.length})</h3>
            <div id="dash-pending-list"></div>`;

        const list = document.getElementById('dash-pending-list');
        list.innerHTML = pending.map(f => `
            <div class="dash-item">
                <strong>${escDash(f.titulo)}</strong>
                <span class="pending-badge-tipo">${escDash(f.tipo_corte)}</span>
                <p class="pending-aguarda"><i class="fas fa-hourglass-half"></i> Aguarda aprovação</p>
            </div>
        `).join('');
    } catch {
        el.innerHTML = '<p class="painel-empty">Erro ao carregar pendentes.</p>';
    }
}

async function renderDashAprovar(el) {
    el.innerHTML = '<p class="painel-loading"><i class="fas fa-spinner fa-spin"></i> A carregar cortes para aprovar...</p>';

    try {
        const res = await fetch(`${API_URL}/galeria/pendentes`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        const pending = res.ok ? await res.json() : [];

        if (!pending.length) {
            el.innerHTML = '<h3 class="area-main-title">Aprovar Cortes</h3><p class="painel-empty">Nenhum corte à espera de aprovação.</p>';
            return;
        }

        el.innerHTML = `<h3 class="area-main-title">Aprovar Cortes (${pending.length})</h3><div id="dash-approve-list"></div>`;
        const list = document.getElementById('dash-approve-list');

        list.innerHTML = pending.map(f => `
            <div class="pending-card">
                <div class="pending-card-header">
                    <span>${escDash(f.barbeiro_nome || f.autor_nome)}</span>
                    <span class="pending-badge-tipo">${escDash(f.tipo_corte)}</span>
                </div>
                <div class="pending-card-body">
                    <strong class="pending-titulo">${escDash(f.titulo)}</strong>
                    ${f.imagem_url ? `<img src="${escDash(f.imagem_url)}" class="pending-preview" alt="" onerror="this.style.display='none'">` : ''}
                    <div class="pending-actions">
                        <button type="button" onclick="approvePending(${f.id})" class="btn-approve">Aprovar</button>
                        <button type="button" onclick="rejectPending(${f.id})" class="btn-reject">Rejeitar</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch {
        el.innerHTML = '<p class="painel-empty">Erro ao carregar. Inicie o backend.</p>';
    }
}

function escDash(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}
