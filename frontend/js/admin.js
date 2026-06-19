// ===== PAINEL BARBEIRO / ADMIN — aprovação pendente (base de dados SQLite) =====

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
    };
}

function podeGerirGaleria() {
    return utilizadorAtual && ['barbeiro', 'administrador'].includes(utilizadorAtual.perfil);
}

function ehAdmin() {
    return utilizadorAtual && utilizadorAtual.perfil === 'administrador';
}

function esc(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(msg, cor) {
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao(msg, cor === '#ef4444' ? 'error' : 'success');
    } else {
        alert(msg);
    }
}

// Badge vermelho no botão Painel — apenas para admin (cortes a aprovar)
async function renderPendingBadge() {
    const btn = document.getElementById('btn-adm');
    if (!btn) return;

    let badge = document.getElementById('pending-badge');

    if (!ehAdmin()) {
        if (badge) badge.remove();
        return;
    }

    let n = 0;
    try {
        const res = await fetch(`${window.API_URL}/galeria/pendentes/count`, { headers: authHeaders() });
        if (res.ok) {
            const data = await res.json();
            n = data.total || 0;
        }
    } catch { /* silencioso */ }

    if (n > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'pending-badge';
            badge.style.cssText = 'background:#ef4444;color:#fff;border-radius:50%;min-width:18px;height:18px;font-size:.65rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-left:.2rem;padding:0 4px';
            btn.appendChild(badge);
        }
        badge.textContent = n;
    } else if (badge) {
        badge.remove();
    }
}

function abrirPainel() {
    if (!estaAutenticado()) {
        mostrarNotificacaoAuth('Faça login para aceder ao painel.', 'info');
        abrirModalAuth('login');
        return;
    }
    if (!podeGerirGaleria()) {
        mostrarNotificacaoAuth('Acesso reservado a barbeiros e administradores.', 'error');
        return;
    }

    const modal = document.getElementById('modalPainel');
    const titulo = document.getElementById('painel-titulo');
    const tabPend = document.getElementById('tab-pendentes-wrap');

    if (titulo) {
        titulo.innerHTML = ehAdmin()
            ? '<i class="fas fa-cog"></i> Painel Administrador'
            : '<i class="fas fa-cut"></i> Painel do Barbeiro';
    }

    if (tabPend) {
        tabPend.innerHTML = ehAdmin()
            ? '<i class="fas fa-clock"></i> Aprovar <span id="adm-pend-count"></span>'
            : '<i class="fas fa-clock"></i> Os Meus Pendentes <span id="adm-pend-count"></span>';
    }

    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    showView('publicar');
    renderPendingBadge();
}

function fecharPainel() {
    const modal = document.getElementById('modalPainel');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function showView(view) {
    document.querySelectorAll('.painel-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.painel-nav-btn').forEach(b => b.classList.remove('active'));

    const el = document.getElementById(`view-${view}`);
    const btn = document.querySelector(`[data-view="${view}"]`);
    if (el) el.classList.add('active');
    if (btn) btn.classList.add('active');

    if (view === 'pendentes') showPending();
}

async function showPending() {
    const list = document.getElementById('pending-list');
    if (!list) return;

    list.innerHTML = '<p class="painel-loading"><i class="fas fa-spinner fa-spin"></i> A carregar...</p>';

    try {
        const res = await fetch(`${window.API_URL}/galeria/pendentes`, { headers: authHeaders() });
        const pending = res.ok ? await res.json() : [];

        const cnt = document.getElementById('adm-pend-count');
        if (cnt) cnt.textContent = pending.length > 0 ? `(${pending.length})` : '';

        if (!pending.length) {
            list.innerHTML = '<p class="painel-empty">Nenhum corte pendente.</p>';
            renderPendingBadge();
            return;
        }

        const isAdmin = ehAdmin();

        list.innerHTML = pending.map(f => `
            <div class="pending-card">
                <div class="pending-card-header">
                    <span>${esc(f.barbeiro_nome || f.autor_nome || '—')}</span>
                    <span class="pending-badge-tipo">${esc(f.tipo_corte)}</span>
                </div>
                <div class="pending-card-body">
                    <strong class="pending-titulo">${esc(f.titulo)}</strong>
                    <div class="pending-meta">
                        ${formatarData(f.criado_em)} &nbsp;|&nbsp; ${esc(f.duracao || '—')}
                    </div>
                    ${f.descricao ? `<div class="pending-desc">${esc(f.descricao)}</div>` : ''}
                    ${f.imagem_url ? `<img src="${esc(f.imagem_url)}" class="pending-preview" alt="" onerror="this.style.display='none'">` : ''}
                    ${isAdmin ? `
                    <div class="pending-actions">
                        <button type="button" onclick="approvePending(${f.id})" class="btn-approve">Aprovar</button>
                        <button type="button" onclick="rejectPending(${f.id})" class="btn-reject">Rejeitar</button>
                    </div>` : `
                    <p class="pending-aguarda"><i class="fas fa-hourglass-half"></i> Aguarda aprovação do administrador</p>`}
                </div>
            </div>
        `).join('');

        renderPendingBadge();
    } catch {
        list.innerHTML = '<p class="painel-empty">Erro ao carregar. Verifique se o backend está a correr.</p>';
    }
}

function formatarData(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return iso;
    }
}

async function approvePending(id) {
    try {
        const res = await fetch(`${window.API_URL}/galeria/${id}/aprovar`, {
            method: 'POST',
            headers: authHeaders()
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(data.erro || 'Erro ao aprovar.', '#ef4444');
            return;
        }

        showToast('Corte aprovado e publicado!');
        if (typeof carregarGaleria === 'function') carregarGaleria();
        renderPendingBadge();
        showPending();
    } catch {
        showToast('Erro de ligação.', '#ef4444');
    }
}

async function rejectPending(id) {
    if (!confirm('Rejeitar e eliminar este corte da fila?')) return;

    try {
        const res = await fetch(`${window.API_URL}/galeria/${id}/rejeitar`, {
            method: 'POST',
            headers: authHeaders()
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(data.erro || 'Erro ao rejeitar.', '#ef4444');
            return;
        }

        showToast('Corte rejeitado.', '#ef4444');
        renderPendingBadge();
        showPending();
    } catch {
        showToast('Erro de ligação.', '#ef4444');
    }
}

async function submeterNovoCorte(e) {
    e.preventDefault();

    const payload = {
        titulo: document.getElementById('corteTitulo').value.trim(),
        tipo_corte: document.getElementById('corteTipo').value.trim(),
        descricao: document.getElementById('corteDesc').value.trim(),
        imagem_url: document.getElementById('corteImg').value.trim(),
        video_url: document.getElementById('corteVideo').value.trim(),
        duracao: document.getElementById('corteDuracao').value.trim()
    };

    try {
        const res = await fetch(`${window.API_URL}/galeria`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(data.erro || 'Erro ao publicar.', '#ef4444');
            return;
        }

        showToast(data.mensagem);
        document.getElementById('formNovoCorte').reset();

        if (ehAdmin()) {
            if (typeof carregarGaleria === 'function') carregarGaleria();
            showView('publicar');
        } else {
            showView('pendentes');
        }
        renderPendingBadge();
    } catch {
        showToast('Erro de ligação ao servidor.', '#ef4444');
    }
}

function configurarPainel() {
    document.getElementById('closePainel')?.addEventListener('click', fecharPainel);
    document.getElementById('modalPainel')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalPainel') fecharPainel();
    });

    document.querySelectorAll('.painel-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => showView(btn.dataset.view));
    });

    document.getElementById('formNovoCorte')?.addEventListener('submit', submeterNovoCorte);
}

document.addEventListener('DOMContentLoaded', configurarPainel);
