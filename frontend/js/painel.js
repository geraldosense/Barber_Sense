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

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAcessoPainel()) return;
    configurarPainelApp();
    carregarStats();
    atualizarBadgePendentes();
    atualizarBadgeAgendamentos();
});

document.addEventListener('sense:sync', () => {
    carregarStats();
    atualizarBadgePendentes();
    atualizarBadgeAgendamentos();
    if (secaoPainelAtual === 'pendentes') carregarPendentes();
    if (secaoPainelAtual === 'servicos') carregarServicos();
    if (secaoPainelAtual === 'agendamentos') carregarAgendamentos();
    if (secaoPainelAtual === 'barbeiros') carregarBarbeiros();
});

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

    document.getElementById('btnPainelLogout')?.addEventListener('click', () => {
        sessionStorage.removeItem('admPainelOk');
        localStorage.removeItem('authToken');
        localStorage.removeItem('utilizador');
        window.location.href = 'admin-login.html';
    });

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
    document.getElementById('painelPageTitle').textContent = TITULOS_SECAO[sec] || 'Painel';

    if (sec === 'pendentes') carregarPendentes();
    if (sec === 'servicos') carregarServicos();
    if (sec === 'agendamentos') {
        marcarAgendamentosVistos();
        carregarAgendamentos();
    }
    if (sec === 'barbeiros') carregarBarbeiros();
    if (sec === 'site') carregarSiteInfo();
}

async function carregarStats() {
    const el = document.getElementById('painelStats');
    if (!el) return;

    try {
        const [rAg, rPend, rServ] = await Promise.all([
            fetch(`${API_URL}/agendamentos`, { headers: authHeaders() }),
            fetch(`${API_URL}/galeria/pendentes/count`, { headers: authHeaders() }),
            fetch(`${API_URL}/servicos`)
        ]);

        const ag = rAg.ok ? await rAg.json() : [];
        const pend = rPend.ok ? await rPend.json() : { total: 0 };
        const serv = rServ.ok ? await rServ.json() : [];
        const hoje = new Date().toISOString().split('T')[0];
        const hojeCount = ag.filter(a => a.data === hoje).length;
        const novos = contarAgendamentosNovos(ag);

        el.innerHTML = `
            <div class="painel-stat"><i class="fas fa-calendar-day"></i><strong>${hojeCount}</strong><span>Marcações hoje</span></div>
            <div class="painel-stat"><i class="fas fa-bell"></i><strong>${novos}</strong><span>Novas marcações</span></div>
            <div class="painel-stat"><i class="fas fa-clock"></i><strong>${pend.total || 0}</strong><span>Cortes pendentes</span></div>
            <div class="painel-stat"><i class="fas fa-cut"></i><strong>${serv.length}</strong><span>Serviços ativos</span></div>
        `;

        if (novos > 0) {
            toast(`${novos} nova(s) marcação(ões) de cliente!`, 'info');
        }
        atualizarBadgeAgendamentos(ag);
    } catch {
        el.innerHTML = '<p class="painel-empty">Erro ao carregar estatísticas.</p>';
    }
}

async function atualizarBadgePendentes() {
    try {
        const res = await fetch(`${API_URL}/galeria/pendentes/count`, { headers: authHeaders() });
        const data = res.ok ? await res.json() : { total: 0 };
        const badge = document.getElementById('badgePendentes');
        if (badge) {
            if (data.total > 0) {
                badge.textContent = data.total;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch { /* silencioso */ }
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
    if (res.ok) { toast('Corte aprovado!'); carregarPendentes(); carregarStats(); }
    else toast('Erro ao aprovar.', 'error');
}

async function rejeitarCorte(id) {
    if (!confirm('Rejeitar este corte?')) return;
    const res = await fetch(`${API_URL}/galeria/${id}/rejeitar`, { method: 'POST', headers: authHeaders() });
    if (res.ok) { toast('Corte rejeitado.'); carregarPendentes(); }
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
    const res = await fetch(`${API_URL}/servicos/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ preco })
    });
    if (res.ok) toast('Preço atualizado!');
    else toast('Erro ao guardar.', 'error');
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
        toast('Serviço adicionado!');
        e.target.reset();
        const preview = document.getElementById('novoServicoImgPreview');
        preview?.classList.add('hidden');
        if (preview) preview.innerHTML = '';
        carregarServicos();
        carregarStats();
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
        const badge = document.getElementById('badgeAgendamentos');
        if (badge) {
            if (novos > 0) {
                badge.textContent = novos;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch { /* silencioso */ }
}

function contarAgendamentosNovos(agendamentos) {
    if (!localStorage.getItem('painelUltimaVisitaAgendamentos')) {
        localStorage.setItem('painelUltimaVisitaAgendamentos', String(Date.now()));
        return 0;
    }
    const ultimaVisita = Number(localStorage.getItem('painelUltimaVisitaAgendamentos') || 0);
    return agendamentos.filter(a => {
        if (!a.criado_em) return false;
        const ts = new Date(a.criado_em).getTime();
        return ts > ultimaVisita;
    }).length;
}

function marcarAgendamentosVistos() {
    localStorage.setItem('painelUltimaVisitaAgendamentos', String(Date.now()));
    document.getElementById('badgeAgendamentos')?.classList.add('hidden');
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
            <table class="painel-table">
                <thead><tr><th>Cliente</th><th>Serviço</th><th>Data</th><th>Hora</th><th>Pagamento</th><th>Valor</th><th>Estado</th></tr></thead>
                <tbody>
                    ${items.map(a => `
                        <tr>
                            <td><strong>${esc(a.nome)}</strong><br><small>${esc(a.email)}</small></td>
                            <td>${esc(a.servico?.nome || '—')}<br><small>${a.servico?.preco ? Number(a.servico.preco).toFixed(2) + '€' : ''}</small></td>
                            <td>${esc(a.data)}</td>
                            <td>${esc(a.hora)}</td>
                            <td>${esc(a.metodo_pagamento || '—')}<br><small>${esc(a.referencia_pagamento || '')}</small></td>
                            <td>${a.valor_pago ? Number(a.valor_pago).toFixed(2) + '€' : '—'}</td>
                            <td><span class="status">${esc(a.status)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
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
        toast('Barbeiro adicionado!');
        e.target.reset();
        carregarBarbeiros();
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
        document.getElementById('siteFacebook').value = site.facebook || '';
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
        facebook: document.getElementById('siteFacebook').value.trim(),
        whatsapp: document.getElementById('siteWhatsapp').value.trim()
    };
    const res = await fetch(`${API_URL}/config/site`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    if (res.ok) toast('Informações do site guardadas!');
    else toast('Erro ao guardar.', 'error');
}
