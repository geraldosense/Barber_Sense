const METODOS_LABEL = {
    mbway: 'MB Way',
    visa: 'Visa',
    revolut: 'Revolut'
};

let metodoSelecionado = null;
let dadosReserva = null;
let metodosPagamento = {};
let precoEsperado = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== 'reserva') {
        window.location.href = 'marcacao.html';
        return;
    }

    try {
        dadosReserva = JSON.parse(sessionStorage.getItem('reservaPendente') || 'null');
    } catch {
        dadosReserva = null;
    }

    if (!dadosReserva) {
        window.location.href = 'marcacao.html';
        return;
    }

    await verificarSessao();
    if (!estaAutenticado()) {
        window.location.href = 'conta.html';
        return;
    }

    precoEsperado = Number(dadosReserva.preco) || 0;
    document.getElementById('valorEsperado').textContent =
        precoEsperado > 0 ? `${precoEsperado.toFixed(2)}€` : '—';

    renderizarResumo();
    await carregarMetodosPagamento();

    document.getElementById('pagamentoReferencia').textContent = utilizadorAtual?.nome || dadosReserva.payload?.nome || '—';
    document.getElementById('valorPago')?.addEventListener('input', validarValor);
    document.getElementById('btnFinalizar')?.addEventListener('click', confirmarReserva);
});

function renderizarResumo() {
    document.getElementById('finalizarResumo').innerHTML = `
        <div class="finalizar-resumo-row"><span>Serviço</span><strong>${esc(dadosReserva.servico_nome || '—')}</strong></div>
        <div class="finalizar-resumo-row"><span>Barbeiro</span><strong>${esc(dadosReserva.barbeiro_nome || 'Geraldo Sense')}</strong></div>
        <div class="finalizar-resumo-row"><span>Data</span><strong>${esc(dadosReserva.data_fmt || dadosReserva.data)}</strong></div>
        <div class="finalizar-resumo-row"><span>Hora</span><strong>${esc(dadosReserva.hora)}</strong></div>
        <div class="finalizar-resumo-row"><span>Total</span><strong>${esc(dadosReserva.preco_fmt || '')}</strong></div>
    `;
}

async function carregarMetodosPagamento() {
    const grid = document.getElementById('pagamentoGrid');
    try {
        const res = await fetch(`${API_URL}/config/pagamentos`);
        const data = res.ok ? await res.json() : { metodos: {} };
        metodosPagamento = data.metodos || {};

        const entries = Object.entries(metodosPagamento);
        if (!entries.length) {
            grid.innerHTML = '<p class="pagamento-loading">Nenhum método disponível.</p>';
            return;
        }

        grid.innerHTML = entries.map(([key, m]) => `
            <div class="pagamento-option" data-metodo="${key}" role="button" tabindex="0">
                <i class="fas ${m.icon || 'fa-credit-card'}"></i>
                <span>${esc(m.label || key)}</span>
            </div>
        `).join('');

        grid.querySelectorAll('.pagamento-option').forEach(el => {
            const metodo = el.dataset.metodo;
            el.addEventListener('click', () => selecionarPagamento(metodo));
        });
    } catch {
        grid.innerHTML = '<p class="pagamento-loading">Erro ao carregar métodos.</p>';
    }
}

function selecionarPagamento(metodo) {
    const info = metodosPagamento[metodo];
    if (!info) return;

    metodoSelecionado = metodo;
    document.querySelectorAll('.pagamento-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.metodo === metodo);
    });

    const telefone = info.telefone || info.destino || '+351 960 075 690';
    document.getElementById('pagamentoConta').innerHTML = `
        <p><strong>${esc(info.label || metodo)}</strong></p>
        <p class="pagamento-conta-valor"><i class="fas fa-mobile-alt"></i> ${esc(telefone)}</p>
        <p class="pagamento-conta-hint">${esc(info.instrucao || 'Efetue o pagamento na app.')}</p>
        <p class="pagamento-conta-hint">Use o seu nome como referência na transferência.</p>
    `;

    document.getElementById('pagamentoDetalhes').classList.remove('hidden');
    validarValor();
}

function validarValor() {
    const input = document.getElementById('valorPago');
    const status = document.getElementById('valorStatus');
    const btn = document.getElementById('btnFinalizar');
    const valor = parseFloat(input?.value);

    if (!metodoSelecionado) {
        btn.disabled = true;
        return;
    }

    if (Number.isNaN(valor) || valor <= 0) {
        status.textContent = 'Indique o valor que vai pagar.';
        status.className = 'pagamento-valor-status';
        status.classList.remove('hidden', 'ok', 'erro');
        btn.disabled = true;
        return;
    }

    if (precoEsperado > 0 && Math.abs(valor - precoEsperado) > 0.01) {
        status.textContent = `Valor incorreto. O corte custa ${precoEsperado.toFixed(2)}€.`;
        status.className = 'pagamento-valor-status erro';
        status.classList.remove('hidden', 'ok');
        btn.disabled = true;
        return;
    }

    status.textContent = 'Valor correto — pode confirmar a marcação.';
    status.className = 'pagamento-valor-status ok';
    status.classList.remove('hidden', 'erro');
    btn.disabled = false;
}

function mostrarMsg(msg, tipo = 'info') {
    const el = document.getElementById('finalizarMessage');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-message ${tipo}`;
    el.classList.remove('hidden');
}

async function confirmarReserva() {
    const valor = parseFloat(document.getElementById('valorPago')?.value);
    if (!metodoSelecionado) {
        mostrarMsg('Selecione um método de pagamento.', 'error');
        return;
    }
    if (Number.isNaN(valor) || Math.abs(valor - precoEsperado) > 0.01) {
        mostrarMsg('O valor deve corresponder ao preço do corte.', 'error');
        return;
    }

    const btn = document.getElementById('btnFinalizar');
    btn.disabled = true;

    const referencia = utilizadorAtual?.nome || dadosReserva.payload?.nome || '';
    const payload = {
        ...dadosReserva.payload,
        metodo_pagamento: metodoSelecionado,
        referencia_pagamento: referencia,
        valor_pago: valor
    };

    try {
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
            mostrarMsg(data.erro || 'Erro ao confirmar.', 'error');
            btn.disabled = false;
            return;
        }

        sessionStorage.removeItem('reservaPendente');
        sessionStorage.setItem('marcacaoConfirmada', JSON.stringify({
            ...data,
            metodo_pagamento: METODOS_LABEL[metodoSelecionado] || metodoSelecionado,
            valor_pago_fmt: `${valor.toFixed(2)}€`,
            referencia_pagamento: referencia
        }));

        window.location.href = 'marcacao.html?confirmado=1';
    } catch {
        mostrarMsg('Erro de ligação ao servidor.', 'error');
        btn.disabled = false;
    }
}

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
