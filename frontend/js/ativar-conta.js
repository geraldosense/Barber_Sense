document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email') || sessionStorage.getItem('pendenteEmail') || '';
    const devCodigo = sessionStorage.getItem('pendenteCodigoDev');

    const emailEl = document.getElementById('ativarEmail');
    const emailInput = document.getElementById('ativarEmailInput');
    const devAviso = document.getElementById('ativarDevAviso');

    if (email) {
        emailEl.textContent = email;
        emailInput.value = email;
    } else {
        emailEl.textContent = 'Email não indicado';
    }

    if (devCodigo) {
        devAviso.classList.remove('hidden');
        devAviso.innerHTML = `<strong>Modo teste:</strong> email não configurado no servidor. Código: <strong>${devCodigo}</strong>`;
        sessionStorage.removeItem('pendenteCodigoDev');
    }

    configurarInputsCodigo();
    document.getElementById('formAtivarCodigo')?.addEventListener('submit', submeterAtivacao);
    document.getElementById('btnReenviarCodigo')?.addEventListener('click', reenviarCodigo);
});

function configurarInputsCodigo() {
    const inputs = document.querySelectorAll('#codigoInputs input');

    inputs.forEach((input, i) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '').slice(0, 1);
            if (input.value && inputs[i + 1]) inputs[i + 1].focus();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && inputs[i - 1]) {
                inputs[i - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const texto = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
            texto.split('').forEach((ch, idx) => {
                if (inputs[idx]) inputs[idx].value = ch;
            });
            if (inputs[texto.length - 1]) inputs[texto.length - 1].focus();
        });
    });
}

function obterCodigo() {
    return Array.from(document.querySelectorAll('#codigoInputs input'))
        .map(i => i.value)
        .join('');
}

function mostrarAtivarMsg(msg, tipo = 'info') {
    const el = document.getElementById('ativarMessage');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-message ${tipo}`;
    el.classList.remove('hidden');
}

async function submeterAtivacao(e) {
    e.preventDefault();

    const email = document.getElementById('ativarEmailInput').value.trim();
    const codigo = obterCodigo();

    if (!email) {
        mostrarAtivarMsg('Email em falta. Volte ao registo.', 'error');
        return;
    }

    if (codigo.length !== 6) {
        mostrarAtivarMsg('Introduza o código completo de 6 dígitos.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/confirmar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, codigo })
        });
        const data = await res.json();

        if (!res.ok) {
            mostrarAtivarMsg(data.erro || 'Código inválido.', 'error');
            return;
        }

        if (data.token && data.utilizador) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('utilizador', JSON.stringify(data.utilizador));
        }

        sessionStorage.removeItem('pendenteEmail');
        mostrarAtivarMsg('Conta ativada! A redirecionar...', 'success');
        setTimeout(() => {
            window.location.href = 'finalizar.html';
        }, 1200);
    } catch {
        mostrarAtivarMsg('Erro de ligação ao servidor.', 'error');
    }
}

async function reenviarCodigo() {
    const email = document.getElementById('ativarEmailInput').value.trim();
    if (!email) {
        mostrarAtivarMsg('Email em falta.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/reenviar-confirmacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (data.codigoDesenvolvimento) {
            const devAviso = document.getElementById('ativarDevAviso');
            devAviso.classList.remove('hidden');
            devAviso.innerHTML = `<strong>Modo teste:</strong> novo código: <strong>${data.codigoDesenvolvimento}</strong>`;
        }

        mostrarAtivarMsg(data.mensagem || 'Pedido enviado.', 'success');
    } catch {
        mostrarAtivarMsg('Erro de ligação ao servidor.', 'error');
    }
}
