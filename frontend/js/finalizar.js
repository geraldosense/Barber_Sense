const METODOS_LABEL = {
    mbway: 'MB Way',
    visa: 'Cartão Visa',
    revolut: 'Revolut',
    paypal: 'PayPal',
    santander: 'Santander'
};

let metodoSelecionado = null;
let modoReserva = false;
let dadosReserva = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    modoReserva = params.get('mode') === 'reserva';

    if (modoReserva) {
        try {
            dadosReserva = JSON.parse(sessionStorage.getItem('reservaPendente') || 'null');
        } catch {
            dadosReserva = null;
        }
        if (!dadosReserva) {
            window.location.href = 'marcacao.html';
            return;
        }
        configurarModoReserva();
    } else {
        await verificarSessao();
        if (!estaAutenticado()) {
            window.location.href = 'conta.html';
            return;
        }
        if (utilizadorAtual.perfil_completo && utilizadorAtual.metodo_pagamento) {
            metodoSelecionado = utilizadorAtual.metodo_pagamento;
            selecionarPagamento(metodoSelecionado);
        }
        document.getElementById('finalizarTitulo').textContent = 'Bem-vindo à Sense Barbershop';
        document.getElementById('finalizarSubtitulo').textContent =
            'Último passo: escolha como prefere pagar nas suas marcações.';
    }

    document.getElementById('btnFinalizar')?.addEventListener('click', concluirFinalizacao);
});

function configurarModoReserva() {
    document.getElementById('finalizarTitulo').textContent = 'Confirmar e Pagar';
    document.getElementById('finalizarSubtitulo').textContent =
        'Revise a marcação e escolha o método de pagamento.';
    document.getElementById('finalizarModoLabel').textContent = 'Reserva pendente';

    const resumo = document.getElementById('finalizarResumo');
    resumo.classList.remove('hidden');
    resumo.innerHTML = `
        <div class="finalizar-resumo-row"><span>Serviço</span><strong>${dadosReserva.servico_nome || '—'}</strong></div>
        <div class="finalizar-resumo-row"><span>Barbeiro</span><strong>${dadosReserva.barbeiro_nome || 'Geraldo Sense'}</strong></div>
        <div class="finalizar-resumo-row"><span>Data</span><strong>${dadosReserva.data_fmt || dadosReserva.data}</strong></div>
        <div class="finalizar-resumo-row"><span>Hora</span><strong>${dadosReserva.hora}</strong></div>
        <div class="finalizar-resumo-row"><span>Total</span><strong>${dadosReserva.preco_fmt || ''}</strong></div>
    `;

    document.getElementById('btnFinalizar').innerHTML =
        '<i class="fas fa-calendar-check"></i> Confirmar Marcação';
}

function selecionarPagamento(metodo) {
    metodoSelecionado = metodo;
    document.querySelectorAll('.pagamento-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.metodo === metodo);
    });
    document.getElementById('btnFinalizar').disabled = false;
}

function mostrarFinalizarMsg(msg, tipo = 'info') {
    const el = document.getElementById('finalizarMessage');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-message ${tipo}`;
    el.classList.remove('hidden');
}

async function concluirFinalizacao() {
    if (!metodoSelecionado) {
        mostrarFinalizarMsg('Selecione um método de pagamento.', 'error');
        return;
    }

    const btn = document.getElementById('btnFinalizar');
    btn.disabled = true;

    try {
        if (modoReserva && dadosReserva) {
            await confirmarReservaComPagamento();
            return;
        }

        const res = await fetch(`${API_URL}/auth/completar-perfil`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obterToken()}`
            },
            body: JSON.stringify({ metodo_pagamento: metodoSelecionado })
        });
        const data = await res.json();

        if (!res.ok) {
            mostrarFinalizarMsg(data.erro || 'Erro ao guardar.', 'error');
            btn.disabled = false;
            return;
        }

        guardarSessao(obterToken(), data.utilizador);
        mostrarFinalizarMsg('Perfil concluído! A redirecionar para reservas...', 'success');
        setTimeout(() => {
            window.location.href = 'marcacao.html';
        }, 1200);
    } catch {
        mostrarFinalizarMsg('Erro de ligação ao servidor.', 'error');
        btn.disabled = false;
    }
}

async function confirmarReservaComPagamento() {
    const payload = {
        ...dadosReserva.payload,
        metodo_pagamento: metodoSelecionado
    };

    const res = await fetch(`${API_URL}/agendamentos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${obterToken()}`
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
        mostrarFinalizarMsg(data.erro || 'Erro ao confirmar marcação.', 'error');
        document.getElementById('btnFinalizar').disabled = false;
        return;
    }

    sessionStorage.removeItem('reservaPendente');

    if (!utilizadorAtual?.perfil_completo) {
        await fetch(`${API_URL}/auth/completar-perfil`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obterToken()}`
            },
            body: JSON.stringify({ metodo_pagamento: metodoSelecionado })
        });
        await verificarSessao();
    }

    sessionStorage.setItem('marcacaoConfirmada', JSON.stringify({
        ...data,
        metodo_pagamento: METODOS_LABEL[metodoSelecionado] || metodoSelecionado
    }));

    window.location.href = 'marcacao.html?confirmado=1';
}
