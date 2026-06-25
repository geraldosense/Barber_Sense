document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('utilizador');
    if (token && user && sessionStorage.getItem('admPainelOk') === '1') {
        try {
            const u = JSON.parse(user);
            if (u.perfil === 'administrador') {
                window.location.href = 'painel.html';
                return;
            }
        } catch (_) {}
    }

    sessionStorage.removeItem('admPainelOk');

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
                errEl.textContent = 'Não foi possível contactar o servidor. O site está a arrancar — aguarde ou use Sense Barbershop.command';
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
    const online = window.SenseServidor
        ? await window.SenseServidor.aguardar(15)
        : await fetch(`${API_URL}/auth/config`).then((r) => r.ok).catch(() => false);

    if (!online) {
        if (window.location.protocol === 'file:') {
            if (errEl) {
                errEl.innerHTML = `Abra <a href="${SITE_URL}/admin-login.html">${SITE_URL}/admin-login.html</a> — faça duplo-clique em <strong>Sense Barbershop.command</strong>`;
                errEl.classList.remove('hidden');
            }
            return;
        }
        if (errEl) {
            errEl.innerHTML = `Servidor offline. Faça duplo-clique em <strong>Sense Barbershop.command</strong> na pasta do projeto ou execute <code>./start.sh</code>`;
            errEl.classList.remove('hidden');
        }
    }
}
