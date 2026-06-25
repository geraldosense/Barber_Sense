// ===== PÁGINA DE MARCAÇÃO (reservas) =====

const BK_HORARIOS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30'
];

let bkServicos = [];
let bkBarbeiros = [];
let bkReserva = { servico_id: null, barbeiro_id: null, data: null, hora: null };
let bkPasso = 1;
let bkUmBarbeiro = false;

document.addEventListener('DOMContentLoaded', async () => {
    await verificarAcessoMarcacao();
    configurarMarcacaoPage();
    await carregarDadosMarcacao();
    await carregarMinhasMarcacoes();
    verificarMarcacaoConfirmada();
});

async function verificarAcessoMarcacao() {
    await verificarSessao();

    if (!estaAutenticado()) {
        window.location.href = 'conta.html';
        return;
    }

    if (!['cliente'].includes(utilizadorAtual.perfil)) {
        window.location.href = 'conta.html';
        return;
    }

    if (!utilizadorAtual.telefone || utilizadorAtual.telefone === '—') {
        window.location.href = 'conta.html';
        return;
    }

    document.getElementById('marcacaoNome').textContent = utilizadorAtual.nome.split(' ')[0];
    document.getElementById('marcacaoEmail').textContent = utilizadorAtual.email;
}

function configurarMarcacaoPage() {
    document.getElementById('btnLogoutMarcacao')?.addEventListener('click', () => {
        limparSessao();
        window.location.href = 'conta.html';
    });

    document.getElementById('bkNext1')?.addEventListener('click', () => irPasso(2));
    document.getElementById('bkNext2')?.addEventListener('click', () => irPasso(3));
    document.getElementById('bkNext3')?.addEventListener('click', () => irPasso(4));

    document.querySelectorAll('.btn-back[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => irPasso(parseInt(btn.dataset.goto, 10)));
    });

    document.getElementById('formMarcacao')?.addEventListener('submit', submeterMarcacao);
    document.getElementById('bkNovaMarcacao')?.addEventListener('click', reiniciarMarcacao);

    const dataInput = document.getElementById('bkData');
    if (dataInput) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        if (amanha.getDay() === 0) amanha.setDate(amanha.getDate() + 1);
        dataInput.min = amanha.toISOString().split('T')[0];
        const max = new Date();
        max.setDate(max.getDate() + 30);
        dataInput.max = max.toISOString().split('T')[0];
        dataInput.addEventListener('change', atualizarHorariosMarcacao);
    }
}

async function carregarDadosMarcacao() {
    try {
        const [r1, r2] = await Promise.all([
            fetch(`${API_URL}/servicos`),
            fetch(`${API_URL}/barbeiros`)
        ]);
        if (r1.ok) bkServicos = await r1.json();
        if (r2.ok) bkBarbeiros = await r2.json();
    } catch {
        bkServicos = [
            { id: 1, nome: 'Corte Normal', preco: 15, tempo: 30, icon: '✂️' },
            { id: 2, nome: 'Degradê', preco: 20, tempo: 40, icon: '💇' }
        ];
        bkBarbeiros = [
            { id: 1, nome: 'Geraldo Sense' }
        ];
    }

    bkUmBarbeiro = bkBarbeiros.length === 1;
    if (bkUmBarbeiro && bkBarbeiros[0]) {
        bkReserva.barbeiro_id = bkBarbeiros[0].id;
        document.getElementById('bkStep2')?.classList.add('hidden-step');
        document.querySelector('.booking-step[data-step="2"]')?.classList.add('hidden-step');
        document.querySelector('#bkStep3 .btn-back')?.setAttribute('data-goto', '1');
    }

    renderizarServicosMarcacao();
    renderizarBarbeirosMarcacao();

    const servicoGuardado = sessionStorage.getItem('servicoPretendido');
    if (servicoGuardado) {
        sessionStorage.removeItem('servicoPretendido');
        selecionarServicoMarcacao(parseInt(servicoGuardado, 10));
    }
}

function renderizarServicosMarcacao() {
    const grid = document.getElementById('bkServicos');
    if (!grid) return;

    grid.innerHTML = bkServicos.map(s => `
        <div class="booking-option ${bkReserva.servico_id === s.id ? 'selected' : ''}"
             data-id="${s.id}" onclick="selecionarServicoMarcacao(${s.id})">
            <div class="booking-option-icon">${s.icon || '✂️'}</div>
            <div class="booking-option-name">${s.nome}</div>
            <div class="booking-option-price">${Number(s.preco).toFixed(2)}€</div>
            <div class="booking-option-meta">${s.tempo} min</div>
        </div>
    `).join('');
}

function renderizarBarbeirosMarcacao() {
    const grid = document.getElementById('bkBarbeiros');
    if (!grid) return;

    grid.innerHTML = bkBarbeiros.map(b => `
        <div class="booking-option ${bkReserva.barbeiro_id === b.id ? 'selected' : ''}"
             data-id="${b.id}" onclick="selecionarBarbeiroMarcacao(${b.id})">
            <div class="booking-option-icon">🧔</div>
            <div class="booking-option-name">${b.nome}</div>
            ${b.experiencia ? `<div class="booking-option-meta">${b.experiencia}</div>` : ''}
        </div>
    `).join('');
}

function selecionarServicoMarcacao(id) {
    bkReserva.servico_id = id;
    renderizarServicosMarcacao();
}

function selecionarBarbeiroMarcacao(id) {
    bkReserva.barbeiro_id = id;
    renderizarBarbeirosMarcacao();
}

function irPasso(passo) {
    if (passo === 2 && bkUmBarbeiro) passo = 3;

    if (passo === 2 && !bkReserva.servico_id) {
        mostrarToastMarcacao('Selecione um serviço.', 'error');
        return;
    }
    if (passo === 3 && !bkReserva.barbeiro_id) {
        mostrarToastMarcacao('Selecione um barbeiro.', 'error');
        return;
    }
    if (passo === 4) {
        const data = document.getElementById('bkData')?.value;
        const hora = document.getElementById('bkHora')?.value;
        if (!data || !hora) {
            mostrarToastMarcacao('Selecione data e horário.', 'error');
            return;
        }
        bkReserva.data = data;
        bkReserva.hora = hora;
        renderizarResumoMarcacao();
    }

    if (passo === 5) {
        document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('bkStep5')?.classList.add('active');
        return;
    }

    bkPasso = passo;
    document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`bkStep${passo}`)?.classList.add('active');

    document.querySelectorAll('.booking-step').forEach(s => {
        const n = parseInt(s.dataset.step, 10);
        s.classList.toggle('active', n === passo);
        s.classList.toggle('done', n < passo);
    });

    if (passo === 3) atualizarHorariosMarcacao();
}

async function atualizarHorariosMarcacao() {
    const select = document.getElementById('bkHora');
    const data = document.getElementById('bkData')?.value;
    if (!select) return;

    select.innerHTML = '<option value="">Selecione...</option>';
    let ocupados = [];

    if (data && bkReserva.barbeiro_id) {
        try {
            const res = await fetch(
                `${API_URL}/agendamentos/ocupados?data=${data}&barbeiro_id=${bkReserva.barbeiro_id}`
            );
            if (res.ok) {
                const r = await res.json();
                ocupados = r.horarios || [];
            }
        } catch { /* silencioso */ }
    }

    BK_HORARIOS.forEach(h => {
        if (!ocupados.includes(h)) {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            select.appendChild(opt);
        }
    });
}

function renderizarResumoMarcacao() {
    const servico = bkServicos.find(s => s.id === bkReserva.servico_id);
    const barbeiro = bkBarbeiros.find(b => b.id === bkReserva.barbeiro_id);

    document.getElementById('bkResumo').innerHTML = `
        <div class="booking-summary-row"><span>Serviço</span><strong>${servico?.nome || '—'}</strong></div>
        <div class="booking-summary-row"><span>Barbeiro</span><strong>${barbeiro?.nome || '—'}</strong></div>
        <div class="booking-summary-row"><span>Data</span><strong>${formatarDataPt(bkReserva.data)}</strong></div>
        <div class="booking-summary-row"><span>Hora</span><strong>${bkReserva.hora}</strong></div>
        <div class="booking-summary-row"><span>Total</span><strong>${servico ? Number(servico.preco).toFixed(2) + '€' : '—'}</strong></div>
    `;

    document.getElementById('bkUserCard').innerHTML = `
        <p><i class="fas fa-user"></i> ${utilizadorAtual.nome}</p>
        <p><i class="fas fa-envelope"></i> ${utilizadorAtual.email}</p>
        <p><i class="fas fa-phone"></i> ${utilizadorAtual.telefone}</p>
    `;
}

async function submeterMarcacao(e) {
    e.preventDefault();

    const servico = bkServicos.find(s => s.id === bkReserva.servico_id);
    const barbeiro = bkBarbeiros.find(b => b.id === bkReserva.barbeiro_id);

    const payload = {
        servico_id: bkReserva.servico_id,
        barbeiro_id: bkReserva.barbeiro_id,
        data: bkReserva.data,
        hora: bkReserva.hora,
        nome: utilizadorAtual.nome,
        telefone: utilizadorAtual.telefone,
        email: utilizadorAtual.email
    };

    sessionStorage.setItem('reservaPendente', JSON.stringify({
        payload,
        servico_nome: servico?.nome,
        barbeiro_nome: barbeiro?.nome || 'Geraldo Sense',
        data: bkReserva.data,
        data_fmt: formatarDataPt(bkReserva.data),
        hora: bkReserva.hora,
        preco: servico ? Number(servico.preco) : 0,
        preco_fmt: servico ? `${Number(servico.preco).toFixed(2)}€` : ''
    }));

    window.location.href = 'finalizar.html?mode=reserva';
}

function reiniciarMarcacao() {
    bkReserva = { servico_id: null, barbeiro_id: null, data: null, hora: null };
    document.getElementById('formMarcacao')?.reset();
    document.getElementById('bookingProgress').style.display = 'flex';
    renderizarServicosMarcacao();
    renderizarBarbeirosMarcacao();
    bkPasso = 1;
    document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('bkStep1')?.classList.add('active');
    document.querySelectorAll('.booking-step').forEach(s => {
        s.classList.remove('done');
        s.classList.toggle('active', s.dataset.step === '1');
    });
}

async function carregarMinhasMarcacoes() {
    const lista = document.getElementById('listaMarcacoes');
    if (!lista || !utilizadorAtual) return;

    try {
        const res = await fetch(
            `${API_URL}/agendamentos?email=${encodeURIComponent(utilizadorAtual.email)}`,
            { headers: { Authorization: `Bearer ${obterToken()}` } }
        );
        const items = res.ok ? await res.json() : [];

        if (!items.length) {
            lista.innerHTML = '<p class="marcacao-empty"><i class="fas fa-calendar"></i> Ainda não tem marcações.<br>Faça a sua primeira reserva ao lado.</p>';
            return;
        }

        lista.innerHTML = items.slice(0, 8).map(a => `
            <div class="marcacao-item">
                <strong>${a.servico?.nome || a.servico_nome || 'Serviço'}</strong>
                <p><i class="fas fa-user"></i> ${a.barbeiro?.nome || a.barbeiro_nome || '—'}</p>
                <p><i class="fas fa-calendar"></i> ${formatarDataPt(a.data)} às ${a.hora}</p>
                <span class="status">${a.status || 'confirmado'}</span>
            </div>
        `).join('');
    } catch {
        lista.innerHTML = '<p class="marcacao-empty">Erro ao carregar marcações.</p>';
    }
}

function formatarDataPt(iso) {
    if (!iso) return '—';
    try {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    } catch {
        return iso;
    }
}

function mostrarToastMarcacao(msg, tipo) {
    const n = document.createElement('div');
    n.className = `notification ${tipo}`;
    n.textContent = msg;
    document.body.appendChild(n);
    requestAnimationFrame(() => n.classList.add('show'));
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

function verificarMarcacaoConfirmada() {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('confirmado')) return;

    let data;
    try {
        data = JSON.parse(sessionStorage.getItem('marcacaoConfirmada') || 'null');
    } catch {
        data = null;
    }
    sessionStorage.removeItem('marcacaoConfirmada');
    if (!data) return;

    const servico = data.servico || {};
    const barbeiro = data.barbeiro || {};

    document.getElementById('bkConfirmacao').innerHTML = `
        <p><strong>Serviço:</strong> ${servico.nome || ''}</p>
        <p><strong>Barbeiro:</strong> ${barbeiro.nome || 'Geraldo Sense'}</p>
        <p><strong>Data:</strong> ${formatarDataPt(data.data)}</p>
        <p><strong>Hora:</strong> ${data.hora || ''}</p>
        <p><strong>Pagamento:</strong> ${data.metodo_pagamento || '—'}</p>
        ${data.valor_pago_fmt ? `<p><strong>Valor pago:</strong> ${data.valor_pago_fmt}</p>` : ''}
        ${data.referencia_pagamento ? `<p><strong>Nome na transferência:</strong> ${data.referencia_pagamento}</p>` : ''}
        <p style="margin-top:0.75rem;color:#666;">Marcação confirmada. O pagamento foi registado.</p>
    `;

    irPasso(5);
    document.getElementById('bookingProgress').style.display = 'none';
    carregarMinhasMarcacoes();
    window.history.replaceState({}, '', 'marcacao.html');
}
