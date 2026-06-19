// API no mesmo servidor quando abre http://localhost:3000
(function () {
    const origin = window.location.origin;
    const port = window.location.port;
    const protocol = window.location.protocol;

    if (protocol === 'file:') {
        window.API_URL = 'http://localhost:3000/api';
        return;
    }

    if (port === '3000' || (port === '' && origin.includes('localhost'))) {
        window.API_URL = origin + '/api';
    } else {
        window.API_URL = 'http://localhost:3000/api';
    }
})();

// Global — outros scripts (main.js, auth.js, etc.) usam API_URL
var API_URL = window.API_URL;

function mostrarAvisoProtocolo() {
    if (window.location.protocol !== 'file:') return;

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('aviso-protocolo')) return;

        const aviso = document.createElement('div');
        aviso.id = 'aviso-protocolo';
        aviso.innerHTML = [
            '<strong>⚠️ Site aberto a partir da pasta (file://)</strong>',
            'Para login, agendamentos e galeria funcionarem, inicie o backend e abra ',
            '<a href="http://localhost:3000" style="color:#fff;text-decoration:underline;">http://localhost:3000</a>',
            ' — no terminal: <code style="background:rgba(0,0,0,.2);padding:2px 6px;border-radius:4px;">cd backend && npm install && npm start</code>'
        ].join('');
        aviso.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'right:0',
            'z-index:99999',
            'background:#b45309',
            'color:#fff',
            'padding:12px 20px',
            'font-family:Roboto,sans-serif',
            'font-size:14px',
            'line-height:1.5',
            'text-align:center',
            'box-shadow:0 2px 8px rgba(0,0,0,.3)'
        ].join(';');
        document.body.prepend(aviso);
        document.body.style.paddingTop = '60px';
    });
}

mostrarAvisoProtocolo();
