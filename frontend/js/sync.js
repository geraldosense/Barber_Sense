// ===== SINCRONIZAÇÃO TELEMÓVEL ↔ COMPUTADOR =====
// Todos os dispositivos usam a mesma API — este módulo atualiza os dados em tempo real.
(function () {
    const INTERVALO_MS = 20000;

    function dispararSincronizacao() {
        window.dispatchEvent(new CustomEvent('sense:sync'));
    }

    function iniciar() {
        if (!window.API_URL) return;

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) dispararSincronizacao();
        });

        window.addEventListener('focus', dispararSincronizacao);

        setInterval(() => {
            if (!document.hidden) dispararSincronizacao();
        }, INTERVALO_MS);
    }

    window.senseFetch = function (url, options) {
        const opts = { ...options, cache: 'no-store' };
        return fetch(url, opts);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
