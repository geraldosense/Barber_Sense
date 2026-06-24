document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('utilizador');
    if (token && user) {
        try {
            const u = JSON.parse(user);
            if (u.perfil === 'administrador') {
                window.location.href = 'painel.html';
                return;
            }
        } catch (_) {}
    }

    await verificarServidorAdmin();

    document.getElementById('formAdminLogin')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const utilizador = document.getElementById('admUser').value.trim();
        const password = document.getElementById('admPass').value;
        const errEl = document.getElementById('admLoginErr');

        try {
            const res = await fetch(`${API_URL}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ utilizador, password })
            });

            let data = {};
            const texto = await res.text();
            try {
                data = texto ? JSON.parse(texto) : {};
            } catch {
                throw new Error('servidor_desatualizado');
            }

            if (!res.ok) {
                errEl.textContent = data.erro || 'Credenciais incorretas.';
                errEl.classList.remove('hidden');
                return;
            }

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('utilizador', JSON.stringify(data.utilizador));
            sessionStorage.setItem('admPainelOk', '1');
            window.location.href = 'painel.html';
        } catch (err) {
            if (err.message === 'servidor_desatualizado') {
                mostrarErroServidor(errEl);
            } else {
                errEl.textContent = 'Sem ligação ao servidor. Verifique se o backend está a correr em http://localhost:3000';
                errEl.classList.remove('hidden');
            }
        }
    });
});

function mostrarErroServidor(errEl) {
    if (!errEl) return;
    errEl.innerHTML = 'O servidor precisa ser <strong>reiniciado</strong> com o código novo. No terminal: <code>cd backend && npm start</code> — depois abra <a href="http://localhost:3000/admin-login.html">http://localhost:3000/admin-login.html</a>';
    errEl.classList.remove('hidden');
}

async function verificarServidorAdmin() {
    const errEl = document.getElementById('admLoginErr');
    try {
        const res = await fetch(`${API_URL}/auth/config`);
        if (!res.ok) throw new Error('offline');
        const cfg = await res.json();
        if (!cfg || typeof cfg.googleAtivo === 'undefined') throw new Error('offline');
    } catch {
        if (window.location.protocol === 'file:') {
            if (errEl) {
                errEl.innerHTML = 'Abra o site em <a href="http://localhost:3000/admin-login.html">http://localhost:3000/admin-login.html</a> (não use a pasta diretamente). Inicie o backend: <code>cd backend && npm start</code>';
                errEl.classList.remove('hidden');
            }
            return;
        }
        if (errEl) {
            errEl.innerHTML = 'Backend offline. No terminal execute: <code>cd backend && npm start</code> e abra <a href="http://localhost:3000/admin-login.html">http://localhost:3000/admin-login.html</a>';
            errEl.classList.remove('hidden');
        }
    }
}
