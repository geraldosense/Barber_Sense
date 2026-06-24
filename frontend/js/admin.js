// ===== REDIRECIONAMENTO PAINEL ADMIN (index.html) =====

function abrirPainel() {
    if (utilizadorAtual?.perfil === 'administrador' && localStorage.getItem('authToken')) {
        sessionStorage.setItem('admPainelOk', '1');
        window.location.href = 'painel.html';
    } else {
        window.location.href = 'admin-login.html';
    }
}

function fecharPainel() {
    /* painel em página dedicada */
}

async function renderPendingBadge() {
    const btn = document.getElementById('btn-adm');
    if (!btn || utilizadorAtual?.perfil !== 'administrador') return;

    try {
        const res = await fetch(`${window.API_URL}/galeria/pendentes/count`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = res.ok ? await res.json() : { total: 0 };
        let badge = document.getElementById('pending-badge');
        if (data.total > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.id = 'pending-badge';
                badge.style.cssText = 'background:#ef4444;color:#fff;border-radius:50%;min-width:18px;height:18px;font-size:.65rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-left:.2rem;padding:0 4px';
                btn.appendChild(badge);
            }
            badge.textContent = data.total;
        } else if (badge) {
            badge.remove();
        }
    } catch { /* silencioso */ }
}
