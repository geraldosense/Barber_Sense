// ===== PAINEL ADMIN COMPLETO — Sense Barbershop =====

let painelUser = null;

const TITULOS_SECAO = {
    inicio: 'Painel de Administração',
    galeria: 'Publicar Corte',
    pendentes: 'Aprovar Cortes',
    servicos: 'Preços & Serviços',
    agendamentos: 'Agendamentos',
    barbeiros: 'Gerir Barbeiros',
    site: 'Site & Contactos'
};

let secaoPainelAtual = 'inicio';
let notifPendentes = 0;
let notifAgendamentos = 0;
let notifHoje = 0;
let ultimoToastNovos = 0;
let cacheAgendamentos = [];
let pollPainelTimer = null;

const SEEN_BOOKINGS_KEY = 'painelAgendamentosVistosIds';

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAcessoPainel()) return;
    configurarPainelApp();
    carregarStats();
    atualizarBadgePendentes();
    atualizarBadgeAgendamentos();
    iniciarPollPainel();
    verificarPersistenciaPainel();
});

document.addEventListener('sense:sync', () => {
    carregarStats({ silencioso: true });
    atualizarBadgePendentes();
    atualizarBadgeAgendamentos();
    if (secaoPainelAtual === 'pendentes') carregarPendentes();
    if (secaoPainelAtual === 'servicos') carregarServicos();
    if (secaoPainelAtual === 'agendamentos') carregarAgendamentos();
    if (secaoPainelAtual === 'barbeiros') carregarBarbeiros();
    if (secaoPainelAtual === 'site') carregarSiteInfo();
});

function dataLocalISO(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function obterIdsMarcacoesVistos() {
    try {
        const raw = JSON.parse(localStorage.getItem(SEEN_BOOKINGS_KEY) || '[]');
        return new Set((Array.isArray(raw) ? raw : []).map(String));
    } catch {
        return new Set();
    }
}

function guardarIdsMarcacoesVistos(ids) {
    const lista = [...ids].map(String).slice(-800);
    localStorage.setItem(SEEN_BOOKINGS_KEY, JSON.stringify(lista));
}

function idsMarcacoesAtivas(agendamentos) {
    return (agendamentos || []).filter(a =>
        String(a.status || '').toLowerCase() !== 'cancelado' && a.id != null
    );
}

function contarAgendamentosNovos(agendamentos) {
    const ativos = idsMarcacoesAtivas(agendamentos);
    if (!localStorage.getItem(SEEN_BOOKINGS_KEY)) {
        // Primeira visita: marca o existente como visto — só notificam marcações futuras
        guardarIdsMarcacoesVistos(ativos.map(a => a.id));
        return 0;
    }
    const vistos = obterIdsMarcacoesVistos();
    return ativos.filter(a => !vistos.has(String(a.id))).length;
}

function marcarAgendamentosVistos(lista) {
    const fonte = lista || cacheAgendamentos;
    const vistos = obterIdsMarcacoesVistos();
    idsMarcacoesAtivas(fonte).forEach(a => vistos.add(String(a.id)));
    guardarIdsMarcacoesVistos(vistos);
    notifAgendamentos = 0;
    ultimoToastNovos = 0;
    document.getElementById('badgeAgendamentos')?.classList.add('hidden');
    document.getElementById('dotAgendamentos')?.classList.add('hidden');
    atualizarSinoNotificacoes();
    carregarStats({ silencioso: true });
}

function iniciarPollPainel() {
    clearInterval(pollPainelTimer);
    const tick = () => {
        if (document.hidden) return;
        window.SenseSync?.verificar?.('painel');
        carregarStats({ silencioso: true });
    };
    pollPainelTimer = setInterval(tick, 3000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) tick();
    });
}

async function verificarPersistenciaPainel() {
    try {
        const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const dbOk = data?.persistencia?.persistente === true || data?.database?.persistente === true;
        const uploadsOk = data?.uploads_persistentes === true;
        const box = document.getElementById('painelPersistWarn');
        if (!box) return;
        if (dbOk && uploadsOk) {
            box.classList.add('hidden');
            return;
        }
        box.classList.remove('hidden');
        const msg = box.querySelector('div');
        if (msg) {
            const faltas = [];
            if (!dbOk) faltas.push('base de dados (Turso)');
            if (!uploadsOk) faltas.push('fotos (Cloudinary)');
            msg.innerHTML = `
                <strong>Persistência incompleta</strong>
                <p>Falta configurar: <strong>${faltas.join(' e ')}</strong>. Sem isto, dados ou imagens podem desaparecer no Render Free.</p>
            `;
        }
    } catch { /* silencioso */ }
}

function verificarAcessoPainel() {
    if (sessionStorage.getItem('admPainelOk') !== '1') {
        window.location.href = 'admin-login.html';
        return false;
    }
    const token = localStorage.getItem('authToken');
    const guardado = localStorage.getItem('utilizador');
    if (!token || !guardado) {
        window.location.href = 'admin-login.html';
        return false;
    }
    try {
        painelUser = JSON.parse(guardado);
    } catch {
        window.location.href = 'admin-login.html';
        return false;
    }
    if (painelUser.perfil !== 'administrador') {
        window.location.href = 'admin-login.html';
        return false;
    }
    document.getElementById('painelUserNome').textContent = painelUser.nome;
    document.getElementById('painelUserEmail').textContent = painelUser.email;
    return true;
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
    };
}

function esc(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function escAttr(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function toast(msg, tipo = 'success') {
    const n = document.createElement('div');
    n.className = `notification ${tipo}`;
    n.textContent = msg;
    document.body.appendChild(n);
    requestAnimationFrame(() => n.classList.add('show'));
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

function configurarPainelApp() {
    document.querySelectorAll('.painel-nav-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => irSecaoPainel(btn.dataset.section));
    });

    document.querySelectorAll('.painel-tab[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            fecharMaisPainel();
            irSecaoPainel(btn.dataset.section);
        });
    });

    document.getElementById('btnPainelMais')?.addEventListener('click', () => {
        fecharNotificacoesPainel();
        abrirMaisPainel();
    });

    document.getElementById('btnPainelNotif')?.addEventListener('click', (e) => {
        e.stopPropagation();
        alternarNotificacoesPainel();
    });
    document.getElementById('btnFecharNotif')?.addEventListener('click', fecharNotificacoesPainel);
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('painelNotifPanel');
        const btn = document.getElementById('btnPainelNotif');
        if (!panel || panel.classList.contains('hidden')) return;
        if (panel.contains(e.target) || btn?.contains(e.target)) return;
        fecharNotificacoesPainel();
    });

    document.getElementById('painelNotifList')?.addEventListener('click', (e) => {
        const item = e.target.closest('[data-goto]');
        if (!item) return;
        fecharNotificacoesPainel();
        irSecaoPainel(item.dataset.goto);
    });

    document.getElementById('painelMaisBackdrop')?.addEventListener('click', fecharMaisPainel);

    document.querySelectorAll('.painel-mais-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            fecharMaisPainel();
            irSecaoPainel(btn.dataset.section);
        });
    });

    const logout = () => {
        sessionStorage.removeItem('admPainelOk');
        localStorage.removeItem('authToken');
        localStorage.removeItem('utilizador');
        window.location.href = 'admin-login.html';
    };
    document.getElementById('btnPainelLogout')?.addEventListener('click', logout);
    document.getElementById('btnPainelLogoutMobile')?.addEventListener('click', logout);

    document.getElementById('formNovoCorte')?.addEventListener('submit', submeterNovoCorte);
    document.getElementById('formNovoServico')?.addEventListener('submit', submeterNovoServico);
    document.getElementById('formNovoBarbeiro')?.addEventListener('submit', submeterNovoBarbeiro);
    document.getElementById('formSiteInfo')?.addEventListener('submit', guardarSiteInfo);

    document.getElementById('corteImgFile')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        const preview = document.getElementById('corteImgPreview');
        if (!file || !preview) return;
        preview.classList.remove('hidden');
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Pré-visualização">`;
    });

    document.getElementById('novoServicoImgFile')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        const preview = document.getElementById('novoServicoImgPreview');
        if (!file || !preview) return;
        preview.classList.remove('hidden');
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Pré-visualização do serviço">`;
    });

    configurarAcoesAdminListas();
}

function abrirMaisPainel() {
    const overlay = document.getElementById('painelMaisOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.body.style.overflow = 'hidden';
}

function fecharMaisPainel() {
    const overlay = document.getElementById('painelMaisOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
        if (!overlay.classList.contains('open')) overlay.classList.add('hidden');
    }, 280);
}

function atualizarBottomNav(sec) {
    const mapa = {
        inicio: 'inicio',
        agendamentos: 'agendar',
        galeria: 'novo',
        servicos: 'servicos',
        pendentes: 'mais',
        barbeiros: 'mais',
        site: 'mais'
    };
    const tabAtiva = mapa[sec] || 'inicio';
    document.querySelectorAll('.painel-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabAtiva);
    });
}

function configurarAcoesAdminListas() {
    document.getElementById('servicos-admin-list')?.addEventListener('click', (e) => {
        const saveBtn = e.target.closest('[data-save-preco]');
        if (saveBtn) {
            guardarPreco(Number(saveBtn.dataset.savePreco));
            return;
        }
        const delBtn = e.target.closest('[data-delete-servico]');
        if (delBtn) {
            eliminarServico(Number(delBtn.dataset.deleteServico), delBtn.dataset.nome || '');
        }
    });

    document.getElementById('barbeiros-admin-list')?.addEventListener('click', (e) => {
        const delBtn = e.target.closest('[data-delete-barbeiro]');
        if (delBtn) {
            eliminarBarbeiro(Number(delBtn.dataset.deleteBarbeiro), delBtn.dataset.nome || '');
        }
    });
}

function tratarErroAuthPainel(res) {
    if (res.status === 401 || res.status === 403) {
        toast('Sessão expirada ou sem permissão. Faça login novamente no Admin.', 'error');
        setTimeout(() => { window.location.href = 'admin-login.html'; }, 1800);
        return true;
    }
    return false;
}

function irSecaoPainel(sec) {
    secaoPainelAtual = sec;
    document.querySelectorAll('.painel-nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.section === sec);
    });
    document.querySelectorAll('.painel-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`sec-${sec}`)?.classList.add('active');
    const titulo = TITULOS_SECAO[sec] || 'Painel';
    const titleEl = document.getElementById('painelPageTitle');
    if (titleEl) titleEl.textContent = titulo;
    atualizarBottomNav(sec);

    if (sec === 'pendentes') carregarPendentes();
    if (sec === 'servicos') carregarServicos();
    if (sec === 'agendamentos') {
        marcarAgendamentosVistos();
        carregarAgendamentos();
    }
    if (sec === 'barbeiros') carregarBarbeiros();
    if (sec === 'site') carregarSiteInfo();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function carregarStats(opts = {}) {
    const el = document.getElementById('painelStats');
    if (!el) return;
    const silencioso = !!opts.silencioso;

    const hello = document.getElementById('painelHomeHello');
    if (hello) {
        hello.innerHTML = `
            <h2>Olá, Barbeiro 👋</h2>
            <p>Aqui está o resumo do seu negócio hoje.</p>
        `;
    }

    try {
        const [rAg, rPend, rServ] = await Promise.all([
            fetch(`${API_URL}/agendamentos`, { headers: authHeaders(), cache: 'no-store' }),
            fetch(`${API_URL}/galeria/pendentes/count`, { headers: authHeaders(), cache: 'no-store' }),
            fetch(`${API_URL}/servicos`, { cache: 'no-store' })
        ]);

        const ag = rAg.ok ? await rAg.json() : [];
        const pend = rPend.ok ? await rPend.json() : { total: 0 };
        const serv = rServ.ok ? await rServ.json() : [];
        cacheAgendamentos = Array.isArray(ag) ? ag : [];

        const hoje = dataLocalISO();
        const ativos = idsMarcacoesAtivas(cacheAgendamentos);
        const hojeLista = ativos
            .filter(a => a.data === hoje)
            .sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')));
        const proximasLista = ativos
            .filter(a => String(a.data || '') >= hoje)
            .sort((a, b) =>
                String(a.data || '').localeCompare(String(b.data || '')) ||
                String(a.hora || '').localeCompare(String(b.hora || ''))
            );
        const hojeCount = hojeLista.length;
        const novos = contarAgendamentosNovos(cacheAgendamentos);
        const servicosAtivos = Array.isArray(serv) ? serv.length : 0;

        el.innerHTML = `
            <div class="painel-stat"><i class="fas fa-calendar-day"></i><strong>${hojeCount}</strong><span>Marcações</span></div>
            <div class="painel-stat"><i class="fas fa-bell"></i><strong>${novos}</strong><span>Novas marcações</span></div>
            <div class="painel-stat"><i class="fas fa-clock"></i><strong>${pend.total || 0}</strong><span>Cortes pendentes</span></div>
            <div class="painel-stat"><i class="fas fa-cut"></i><strong>${servicosAtivos}</strong><span>Serviços ativos</span></div>
        `;

        renderizarProximasMarcacoes(hojeLista.length ? hojeLista : proximasLista.slice(0, 4), hojeLista.length > 0);

        notifPendentes = Number(pend.total) || 0;
        notifAgendamentos = novos;
        notifHoje = hojeCount;
        atualizarSinoNotificacoes();

        if (!silencioso && novos > ultimoToastNovos) {
            toast(`${novos} nova(s) marcação(ões) de cliente!`, 'info');
        }
        ultimoToastNovos = novos;
        atualizarBadgeAgendamentos(cacheAgendamentos);
    } catch {
        if (!silencioso) {
            el.innerHTML = '<p class="painel-empty">Erro ao carregar estatísticas.</p>';
        }
    }
}

function renderizarProximasMarcacoes(lista, soHoje = true) {
    const box = document.getElementById('painelProximasList');
    if (!box) return;

    if (!lista.length) {
        box.innerHTML = '<p class="painel-proximas-empty"><i class="far fa-calendar"></i> Nenhuma marcação agendada para hoje.</p>';
        return;
    }

    box.innerHTML = lista.slice(0, 4).map(a => `
        <article class="painel-proxima-item">
            <div class="painel-proxima-hora">${esc(a.hora || '—')}</div>
            <div class="painel-proxima-info">
                <strong>${esc(a.nome || a.cliente_nome || 'Cliente')}</strong>
                <span>${esc(a.servico?.nome || a.servico_nome || 'Serviço')}${!soHoje && a.data ? ` · ${esc(a.data)}` : ''}</span>
            </div>
            <span class="painel-proxima-status">${esc(String(a.status || 'confirmado').toUpperCase())}</span>
        </article>
    `).join('');
}

async function atualizarBadgePendentes() {
    try {
        const res = await fetch(`${API_URL}/galeria/pendentes/count`, { headers: authHeaders() });
        const data = res.ok ? await res.json() : { total: 0 };
        const total = Number(data.total) || 0;
        notifPendentes = total;
        ['badgePendentes', 'badgePendentesMobile'].forEach(id => {
            const badge = document.getElementById(id);
            if (!badge) return;
            if (total > 0) {
                badge.textContent = total;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
        document.getElementById('dotMais')?.classList.toggle('hidden', total <= 0);
        atualizarSinoNotificacoes();
    } catch { /* silencioso */ }
}

function atualizarSinoNotificacoes() {
    // O sino prioriza marcações novas; inclui também cortes pendentes
    const total = notifAgendamentos + notifPendentes;
    const badge = document.getElementById('badgeNotificacoes');
    if (badge) {
        if (total > 0) {
            badge.textContent = total > 99 ? '99+' : String(total);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    renderizarPainelNotificacoes();
}

function renderizarPainelNotificacoes() {
    const list = document.getElementById('painelNotifList');
    if (!list) return;

    const itens = [];
    if (notifAgendamentos > 0) {
        itens.push({
            goto: 'agendamentos',
            icon: 'fa-calendar-check',
            titulo: `${notifAgendamentos} nova(s) marcação(ões)`,
            desc: 'Clientes agendaram — toque para ver'
        });
    }
    if (notifPendentes > 0) {
        itens.push({
            goto: 'pendentes',
            icon: 'fa-camera',
            titulo: `${notifPendentes} corte(s) a aprovar`,
            desc: 'Galeria com publicações pendentes'
        });
    }
    if (notifHoje > 0) {
        itens.push({
            goto: 'agendamentos',
            icon: 'fa-calendar-day',
            titulo: `${notifHoje} marcação(ões) hoje`,
            desc: 'Agenda do dia'
        });
    }

    if (!itens.length) {
        list.innerHTML = '<p class="painel-notif-empty">Sem notificações novas.</p>';
        return;
    }

    list.innerHTML = itens.map(n => `
        <button type="button" class="painel-notif-item" data-goto="${n.goto}">
            <i class="fas ${n.icon}"></i>
            <div>
                <strong>${n.titulo}</strong>
                <span>${n.desc}</span>
            </div>
        </button>
    `).join('');
}

function alternarNotificacoesPainel() {
    const panel = document.getElementById('painelNotifPanel');
    const btn = document.getElementById('btnPainelNotif');
    if (!panel) return;
    const aberto = !panel.classList.contains('hidden');
    if (aberto) {
        fecharNotificacoesPainel();
        return;
    }
    fecharMaisPainel();
    renderizarPainelNotificacoes();
    panel.classList.remove('hidden');
    btn?.setAttribute('aria-expanded', 'true');
}

function fecharNotificacoesPainel() {
    document.getElementById('painelNotifPanel')?.classList.add('hidden');
    document.getElementById('btnPainelNotif')?.setAttribute('aria-expanded', 'false');
}

async function parseRespostaApi(res) {
    const texto = await res.text();
    try {
        return { data: texto ? JSON.parse(texto) : {}, ok: res.ok, status: res.status };
    } catch {
        throw new Error('Resposta inválida do servidor. Reinicie o Sense Barbershop e tente novamente.');
    }
}

async function uploadImagemFicheiro(endpoint, file) {
    const fd = new FormData();
    fd.append('imagem', file);
    const res = await fetch(`${API_URL}/upload/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: fd
    });
    const { data, ok, status } = await parseRespostaApi(res);
    if (!ok) {
        if (status === 404 && endpoint === 'servico') {
            return uploadImagemFicheiro('galeria', file);
        }
        throw new Error(data.erro || 'Erro no upload da imagem.');
    }
    return data.url;
}

async function uploadImagem(file) {
    return uploadImagemFicheiro('galeria', file);
}

async function uploadImagemServico(file) {
    return uploadImagemFicheiro('servico', file);
}

async function submeterNovoCorte(e) {
    e.preventDefault();
    const fileInput = document.getElementById('corteImgFile');
    let imagemUrl = document.getElementById('corteImg')?.value || '';

    if (fileInput?.files?.[0]) {
        try {
            imagemUrl = await uploadImagem(fileInput.files[0]);
        } catch (err) {
            toast(err.message, 'error');
            return;
        }
    }
    if (!imagemUrl) {
        toast('Adicione uma fotografia.', 'error');
        return;
    }

    const payload = {
        titulo: document.getElementById('corteTitulo').value.trim(),
        tipo_corte: document.getElementById('corteTipo').value,
        descricao: document.getElementById('corteDesc').value.trim(),
        imagem_url: imagemUrl,
        video_url: document.getElementById('corteVideo').value.trim(),
        duracao: document.getElementById('corteDuracao').value.trim(),
        preco: document.getElementById('cortePreco').value
    };

    try {
        const res = await fetch(`${API_URL}/galeria`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        toast('Corte publicado na galeria!');
        e.target.reset();
        document.getElementById('corteImgPreview')?.classList.add('hidden');
        carregarStats();
        window.SenseSync?.notificarPublicacao();
    } catch (err) {
        toast(err.message || 'Erro ao publicar.', 'error');
    }
}

async function carregarPendentes() {
    const list = document.getElementById('pending-list');
    list.innerHTML = '<p class="painel-loading"><i class="fas fa-spinner fa-spin"></i> A carregar...</p>';

    try {
        const res = await fetch(`${API_URL}/galeria/pendentes`, { headers: authHeaders() });
        const pending = res.ok ? await res.json() : [];

        if (!pending.length) {
            list.innerHTML = '<p class="painel-empty">Nenhum corte pendente.</p>';
            return;
        }

        list.innerHTML = pending.map(f => `
            <div class="pending-card">
                <div class="pending-card-header">
                    <span>${esc(f.barbeiro_nome || f.autor_nome || '—')}</span>
                    <span class="pending-badge-tipo">${esc(f.tipo_corte)}</span>
                </div>
                <div class="pending-card-body">
                    <strong>${esc(f.titulo)}</strong>
                    ${f.imagem_url ? `<img src="${resolveMediaUrl(f.imagem_url)}" class="pending-preview" alt="">` : ''}
                    ${f.preco ? `<p class="galeria-preco">${Number(f.preco).toFixed(2)}€</p>` : ''}
                    <div class="pending-actions">
                        <button type="button" class="btn-approve" onclick="aprovarCorte(${f.id})">Aprovar</button>
                        <button type="button" class="btn-reject" onclick="rejeitarCorte(${f.id})">Rejeitar</button>
                    </div>
                </div>
            </div>
        `).join('');
        atualizarBadgePendentes();
    } catch {
        list.innerHTML = '<p class="painel-empty">Erro ao carregar.</p>';
    }
}

async function aprovarCorte(id) {
    const res = await fetch(`${API_URL}/galeria/${id}/aprovar`, { method: 'POST', headers: authHeaders() });
    if (res.ok) {
        toast('Corte aprovado!');
        carregarPendentes();
        carregarStats();
        window.SenseSync?.notificarPublicacao();
    }
    else toast('Erro ao aprovar.', 'error');
}

async function rejeitarCorte(id) {
    if (!confirm('Rejeitar este corte?')) return;
    const res = await fetch(`${API_URL}/galeria/${id}/rejeitar`, { method: 'POST', headers: authHeaders() });
    if (res.ok) {
        toast('Corte rejeitado.');
        carregarPendentes();
        window.SenseSync?.notificarPublicacao();
    }
}

async function carregarServicos() {
    const list = document.getElementById('servicos-admin-list');
    list.innerHTML = '<p class="painel-loading"><i class="fas fa-spinner fa-spin"></i></p>';

    try {
        const res = await fetch(`${API_URL}/servicos`);
        const servicos = res.ok ? await res.json() : [];

        list.innerHTML = servicos.map(s => `
            <div class="servico-admin-item">
                <div><strong>${esc(s.nome)}</strong><small>${esc(s.descricao || '')} · ${s.tempo || '—'} min</small></div>
                <input type="number" min="0" step="0.5" value="${Number(s.preco).toFixed(2)}" id="preco-serv-${s.id}">
                <div class="servico-admin-actions">
                    <button type="button" class="btn-save-preco" data-save-preco="${s.id}">Guardar</button>
                    <button type="button" class="btn-remove-admin" data-delete-servico="${s.id}" data-nome="${escAttr(s.nome)}" title="Eliminar serviço">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('') || '<p class="painel-empty">Sem serviços.</p>';
    } catch {
        list.innerHTML = '<p class="painel-empty">Erro ao carregar.</p>';
    }
}

async function guardarPreco(id) {
    const preco = parseFloat(document.getElementById(`preco-serv-${id}`).value);
    if (!Number.isFinite(preco) || preco < 0) {
        toast('Indique um preço válido.', 'error');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/servicos/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ preco })
        });
        const data = await res.json().catch(() => ({}));
        if (tratarErroAuthPainel(res)) return;
        if (res.ok) {
            toast('Preço atualizado!');
            window.SenseSync?.notificarPublicacao();
        } else {
            toast(data.erro || 'Erro ao guardar.', 'error');
        }
    } catch {
        toast('Erro de ligação ao servidor.', 'error');
    }
}

async function eliminarServico(id, nome) {
    if (!confirm(`Eliminar o serviço "${nome}"?\n\nDeixará de aparecer no site e na marcação.`)) return;

    try {
        const res = await fetch(`${API_URL}/servicos/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json().catch(() => ({}));

        if (tratarErroAuthPainel(res)) return;

        if (res.ok) {
            toast(data.mensagem || 'Serviço eliminado.');
            carregarServicos();
            carregarStats();
            window.SenseSync?.notificarPublicacao();
        } else {
            toast(data.erro || 'Erro ao eliminar serviço.', 'error');
        }
    } catch {
        toast('Erro de ligação ao servidor.', 'error');
    }
}

async function submeterNovoServico(e) {
    e.preventDefault();

    const fileInput = document.getElementById('novoServicoImgFile');
    let imagemUrl = null;

    if (fileInput?.files?.[0]) {
        try {
            imagemUrl = await uploadImagemServico(fileInput.files[0]);
        } catch (err) {
            toast(err.message, 'error');
            return;
        }
    }

    const payload = {
        nome: document.getElementById('novoServicoNome').value.trim(),
        preco: document.getElementById('novoServicoPreco').value,
        tempo: document.getElementById('novoServicoTempo').value,
        icon: '✂️'
    };
    if (imagemUrl) payload.imagem = imagemUrl;

    let resposta;
    try {
        const res = await fetch(`${API_URL}/servicos`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        resposta = await parseRespostaApi(res);
    } catch (err) {
        toast(err.message, 'error');
        return;
    }

    if (resposta.ok) {
        toast('Serviço adicionado! Já está no site (telemóvel e PC).');
        e.target.reset();
        const preview = document.getElementById('novoServicoImgPreview');
        preview?.classList.add('hidden');
        if (preview) preview.innerHTML = '';
        carregarServicos();
        carregarStats();
        window.SenseSync?.notificarPublicacao();
    } else {
        toast(resposta.data.erro || 'Erro ao adicionar serviço.', 'error');
    }
}

async function atualizarBadgeAgendamentos(agendamentosCache) {
    try {
        let ag = agendamentosCache;
        if (!ag) {
            const res = await fetch(`${API_URL}/agendamentos`, { headers: authHeaders() });
            ag = res.ok ? await res.json() : [];
        }
        const novos = contarAgendamentosNovos(ag);
        notifAgendamentos = novos;
        notifHoje = hojeCount;
        document.getElementById('dotAgendamentos')?.classList.toggle('hidden', novos <= 0);
        const badge = document.getElementById('badgeAgendamentos');
        if (badge) {
            if (novos > 0) {
                badge.textContent = novos;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        atualizarSinoNotificacoes();
    } catch { /* silencioso */ }
}


async function carregarAgendamentos() {
    const list = document.getElementById('agendamentos-admin-list');
    list.innerHTML = '<p class="painel-loading"><i class="fas fa-spinner fa-spin"></i></p>';

    try {
        const res = await fetch(`${API_URL}/agendamentos`, { headers: authHeaders() });
        const items = res.ok ? await res.json() : [];

        if (!items.length) {
            list.innerHTML = '<p class="painel-empty">Nenhuma marcação.</p>';
            return;
        }

        list.innerHTML = `
            <div class="agendamentos-admin-cards">
                ${items.map(a => `
                    <article class="agendamento-admin-card">
                        <div class="agendamento-admin-card-top">
                            <div>
                                <strong>${esc(a.nome)}</strong>
                                <span class="agendamento-admin-email">${esc(a.email || '')}</span>
                            </div>
                            <span class="status">${esc(a.status)}</span>
                        </div>
                        <div class="agendamento-admin-card-grid">
                            <div><small>Serviço</small><p>${esc(a.servico?.nome || '—')}</p></div>
                            <div><small>Data</small><p>${esc(a.data)}</p></div>
                            <div><small>Hora</small><p>${esc(a.hora)}</p></div>
                            <div><small>Pagamento</small><p>${esc(a.metodo_pagamento || '—')}${a.valor_pago ? ` · ${Number(a.valor_pago).toFixed(2)}€` : ''}</p></div>
                        </div>
                        ${a.referencia_pagamento ? `<p class="agendamento-admin-ref">${esc(a.referencia_pagamento)}</p>` : ''}
                    </article>
                `).join('')}
            </div>`;
    } catch {
        list.innerHTML = '<p class="painel-empty">Erro ao carregar.</p>';
    }
}

async function carregarBarbeiros() {
    const list = document.getElementById('barbeiros-admin-list');
    try {
        const res = await fetch(`${API_URL}/barbeiros`);
        const barbeiros = res.ok ? await res.json() : [];

        list.innerHTML = barbeiros.map(b => `
            <div class="servico-admin-item">
                <div>
                    <strong>${esc(b.nome)}${b.principal ? ' <span style="color:var(--secondary-color)">★ Principal</span>' : ''}</strong>
                    <small>${esc(b.experiencia || '')} · ${esc(b.especialidades || '')}</small>
                </div>
                <span>${esc(b.telefone || '—')}</span>
                <button type="button" class="btn-remove-admin" data-delete-barbeiro="${b.id}" data-nome="${escAttr(b.nome)}" title="Eliminar barbeiro">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </div>
        `).join('') || '<p class="painel-empty">Sem barbeiros.</p>';
    } catch {
        list.innerHTML = '<p class="painel-empty">Erro.</p>';
    }
}

async function submeterNovoBarbeiro(e) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/barbeiros`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            nome: document.getElementById('novoBarbeiroNome').value.trim(),
            experiencia: document.getElementById('novoBarbeiroExp').value.trim(),
            especialidades: document.getElementById('novoBarbeiroEsp').value.trim(),
            telefone: document.getElementById('novoBarbeiroTel').value.trim(),
            email: document.getElementById('novoBarbeiroEmail').value.trim()
        })
    });
    if (res.ok) {
        toast('Barbeiro adicionado! Já aparece no site.');
        e.target.reset();
        carregarBarbeiros();
        window.SenseSync?.notificarPublicacao();
    } else {
        const d = await res.json();
        toast(d.erro || 'Erro.', 'error');
    }
}

async function eliminarBarbeiro(id, nome) {
    if (!confirm(`Eliminar o barbeiro "${nome}"?\n\nDeixará de aparecer no site. Marcações futuras deste barbeiro serão canceladas.`)) return;

    try {
        const res = await fetch(`${API_URL}/barbeiros/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json().catch(() => ({}));

        if (tratarErroAuthPainel(res)) return;

        if (res.ok) {
            toast(data.mensagem || 'Barbeiro eliminado.');
            carregarBarbeiros();
            window.SenseSync?.notificarPublicacao();
        } else {
            toast(data.erro || 'Erro ao eliminar barbeiro.', 'error');
        }
    } catch {
        toast('Erro de ligação ao servidor.', 'error');
    }
}

window.guardarPreco = guardarPreco;
window.eliminarServico = eliminarServico;
window.eliminarBarbeiro = eliminarBarbeiro;

async function carregarSiteInfo() {
    try {
        const res = await fetch(`${API_URL}/config/site`);
        const site = res.ok ? await res.json() : {};
        document.getElementById('siteTelefone').value = site.telefone || '';
        document.getElementById('siteEmail').value = site.email || '';
        document.getElementById('siteMorada').value = site.morada || '';
        document.getElementById('siteInstagram').value = site.instagram || '';
        document.getElementById('siteTiktok').value = site.tiktok || '';
        document.getElementById('siteWhatsapp').value = site.whatsapp || '';
    } catch { /* silencioso */ }
}

async function guardarSiteInfo(e) {
    e.preventDefault();
    const payload = {
        telefone: document.getElementById('siteTelefone').value.trim(),
        email: document.getElementById('siteEmail').value.trim(),
        morada: document.getElementById('siteMorada').value.trim(),
        instagram: document.getElementById('siteInstagram').value.trim(),
        tiktok: document.getElementById('siteTiktok').value.trim(),
        whatsapp: document.getElementById('siteWhatsapp').value.trim()
    };
    const res = await fetch(`${API_URL}/config/site`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        toast('Contactos atualizados no site (PC e telemóvel)!');
        window.SenseSync?.notificarPublicacao();
    } else {
        toast('Erro ao guardar.', 'error');
    }
}
