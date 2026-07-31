// ===== SINCRONIZAÇÃO ÚNICA — telemóvel ↔ computador =====
// Um só site / uma só API. Todos os dispositivos seguem a mesma versão de dados.
(function () {
    const INTERVALO_RAPIDO_MS = 4000;
    const INTERVALO_FUNDO_MS = 12000;
    let ultimaVersao = null;
    let aVerificar = false;
    let timer = null;
    let canal = null;

    function dispararSincronizacao(motivo) {
        window.dispatchEvent(new CustomEvent('sense:sync', {
            detail: { motivo: motivo || 'poll', versao: ultimaVersao }
        }));
    }

    function notificarAbasLocais() {
        try {
            if (!canal) {
                canal = new BroadcastChannel('sense-barbershop-sync');
                canal.onmessage = (ev) => {
                    if (ev?.data?.type === 'invalidate') {
                        ultimaVersao = null;
                        verificarAgora('broadcast');
                    }
                };
            }
            canal.postMessage({ type: 'invalidate', at: Date.now() });
        } catch (_) { /* browser sem BroadcastChannel */ }
    }

    async function verificarAgora(motivo) {
        if (!window.API_URL || aVerificar) return;
        aVerificar = true;
        try {
            const res = await fetch(`${window.API_URL}/sync`, { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            const versao = String(data.versao || '0');
            if (ultimaVersao === null) {
                ultimaVersao = versao;
                return;
            }
            if (versao !== ultimaVersao) {
                ultimaVersao = versao;
                dispararSincronizacao(motivo || 'versao');
            }
        } catch (_) {
            /* silencioso — o health check trata do offline */
        } finally {
            aVerificar = false;
        }
    }

    function agendar() {
        clearInterval(timer);
        const ms = document.hidden ? INTERVALO_FUNDO_MS : INTERVALO_RAPIDO_MS;
        timer = setInterval(() => verificarAgora('intervalo'), ms);
    }

    function iniciar() {
        if (!window.API_URL || window.GITHUB_PAGES_PREVIEW) return;

        verificarAgora('init');
        agendar();

        document.addEventListener('visibilitychange', () => {
            agendar();
            if (!document.hidden) verificarAgora('visible');
        });

        window.addEventListener('focus', () => verificarAgora('focus'));
        window.addEventListener('online', () => verificarAgora('online'));

        document.addEventListener('sense:servidor-online', () => {
            ultimaVersao = null;
            verificarAgora('servidor-online');
        });
    }

    window.senseFetch = function (url, options) {
        return fetch(url, { ...options, cache: 'no-store' });
    };

    window.SenseSync = {
        verificar: verificarAgora,
        forcar() {
            ultimaVersao = null;
            notificarAbasLocais();
            return verificarAgora('forcar').then(() => dispararSincronizacao('forcar'));
        },
        notificarPublicacao() {
            notificarAbasLocais();
            ultimaVersao = null;
            return verificarAgora('admin');
        },
        get versao() { return ultimaVersao; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
