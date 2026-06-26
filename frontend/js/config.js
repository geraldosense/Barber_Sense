// ===== CONFIGURAÇÃO DA API =====
(function () {
    const origin = window.location.origin;
    const port = window.location.port;
    const protocol = window.location.protocol;

    if (protocol === 'file:') {
        window.API_URL = 'http://localhost:3000/api';
        window.SITE_URL = 'http://localhost:3000';
        document.addEventListener('DOMContentLoaded', () => {
            window.location.replace(SITE_URL);
        });
        return;
    }

    if (port === '3000' || (port === '' && origin.includes('localhost'))) {
        window.API_URL = origin + '/api';
        window.SITE_URL = origin;
    } else {
        window.API_URL = 'http://localhost:3000/api';
        window.SITE_URL = 'http://localhost:3000';
    }
})();

var API_URL = window.API_URL;
var SITE_URL = window.SITE_URL || 'http://localhost:3000';

window.resolveMediaUrl = function (path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = (window.API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
    return base + (path.startsWith('/') ? path : `/${path}`);
};

window.obterImagemServico = function (servico) {
    if (!servico) return 'assets/servicos/default.svg';
    if (servico.imagem) return servico.imagem;

    const nome = String(servico.nome || '').toLowerCase().trim();
    if (nome.includes('corte') && nome.includes('barba')) return 'assets/servicos/corte-barba.png';
    if (nome.includes('barba')) return 'assets/servicos/barba.png';
    if (nome.includes('degrad')) return 'assets/servicos/degrade.svg';
    if (nome.includes('tratamento')) return 'assets/servicos/tratamento.svg';
    if (nome.includes('corte')) return 'assets/servicos/corte-normal.png';
    return 'assets/servicos/default.svg';
};

// ===== AVISO file:// (fallback se o redirecionamento falhar) =====
function mostrarAvisoProtocolo() {
    if (window.location.protocol !== 'file:') return;

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('aviso-protocolo')) return;

        const aviso = document.createElement('div');
        aviso.id = 'aviso-protocolo';
        aviso.innerHTML = [
            '<strong>A abrir Sense Barbershop...</strong><br>',
            'Se não redirecionar, use a aplicação <strong>Sense Barbershop.app</strong> ',
            'ou abra <a href="http://localhost:3000" style="color:#fff;">http://localhost:3000</a>'
        ].join('');
        aviso.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#b45309;color:#fff;padding:14px 20px;font-family:Roboto,sans-serif;font-size:14px;line-height:1.6;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.3)';
        document.body.prepend(aviso);
        document.body.style.paddingTop = '72px';
    });
}

mostrarAvisoProtocolo();

// ===== RECONEXÃO AUTOMÁTICA AO SERVIDOR =====
(function () {
    let servidorOnline = null;
    let verificando = false;
    const ouvintes = new Set();

    async function verificarServidor(timeoutMs) {
        const ms = timeoutMs || 4000;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms);
        try {
            const base = (window.API_URL || '').replace(/\/api\/?$/, '') || SITE_URL;
            const res = await fetch(`${base}/api/health`, { signal: ctrl.signal, cache: 'no-store' });
            clearTimeout(t);
            return res.ok;
        } catch {
            clearTimeout(t);
            return false;
        }
    }

    function mostrarBannerOffline() {
        if (document.getElementById('sense-servidor-banner')) return;

        const b = document.createElement('div');
        b.id = 'sense-servidor-banner';
        b.innerHTML = [
            '<div class="sense-servidor-banner__inner">',
            '<span class="sense-servidor-banner__icon"><i class="fas fa-sync fa-spin"></i></span>',
            '<span class="sense-servidor-banner__text">',
            '<strong>A iniciar Sense Barbershop...</strong> O sistema arranca automaticamente. Aguarde alguns segundos.',
            '</span>',
            '<button type="button" class="sense-servidor-banner__btn" id="senseBtnRetry">Tentar agora</button>',
            '</div>'
        ].join('');
        document.body.prepend(b);

        document.getElementById('senseBtnRetry')?.addEventListener('click', async () => {
            const ok = await verificarServidor(5000);
            if (ok) window.location.reload();
            else aguardarServidor(30);
        });
    }

    function esconderBannerOffline() {
        document.getElementById('sense-servidor-banner')?.remove();
    }

    async function aguardarServidor(maxTentativas) {
        if (verificando) return servidorOnline;
        verificando = true;
        const max = maxTentativas || 45;

        for (let i = 0; i < max; i++) {
            const ok = await verificarServidor(3000);
            servidorOnline = ok;
            if (ok) {
                esconderBannerOffline();
                ouvintes.forEach((fn) => { try { fn(); } catch (_) {} });
                ouvintes.clear();
                verificando = false;
                window.dispatchEvent(new CustomEvent('sense:servidor-online'));
                if (i > 0) window.location.reload();
                return true;
            }
            if (i === 0) mostrarBannerOffline();
            await new Promise((r) => setTimeout(r, 2000));
        }

        verificando = false;
        const el = document.querySelector('#sense-servidor-banner .sense-servidor-banner__text');
        if (el) {
            el.innerHTML = `<strong>A aguardar o sistema...</strong> O Sense Barbershop arranca ao ligar o Mac. <a href="${SITE_URL}">Tentar novamente</a>`;
        }
        const icon = document.querySelector('#sense-servidor-banner .sense-servidor-banner__icon i');
        if (icon) icon.className = 'fas fa-exclamation-triangle';
        return false;
    }

    window.SenseServidor = {
        verificar: verificarServidor,
        aguardar: aguardarServidor,
        quandoOnline: function (fn) {
            if (servidorOnline) fn();
            else ouvintes.add(fn);
        },
        get online() { return !!servidorOnline; }
    };

    document.addEventListener('DOMContentLoaded', async () => {
        if (window.location.protocol === 'file:') return;
        const ok = await verificarServidor(2500);
        servidorOnline = ok;
        if (!ok) aguardarServidor(45);
    });
})();
