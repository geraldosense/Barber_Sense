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
let bkMinhasMarcacoes = [];
let bkEditandoId = null;
let bkEditPrecoOriginal = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await verificarAcessoMarcacao();
    configurarMarcacaoPage();
    await carregarDadosMarcacao();
    await carregarMinhasMarcacoes();
    verificarMarcacaoConfirmada();
});

document.addEventListener('sense:langchange', () => {
    renderizarServicosMarcacao();
    renderizarBarbeirosMarcacao();
    carregarMinhasMarcacoes();
    if (document.getElementById('bkData')?.value) atualizarHorariosMarcacao();
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

    document.getElementById('listaMarcacoes')?.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('[data-editar]');
        const btnEliminar = e.target.closest('[data-eliminar]');
        if (btnEditar) abrirEditarMarcacao(parseInt(btnEditar.dataset.editar, 10));
        if (btnEliminar) eliminarMarcacao(parseInt(btnEliminar.dataset.eliminar, 10));
    });

    document.getElementById('btnFecharEditar')?.addEventListener('click', fecharEditarMarcacao);
    document.getElementById('btnCancelarEditar')?.addEventListener('click', fecharEditarMarcacao);
    document.getElementById('modalEditarBackdrop')?.addEventListener('click', fecharEditarMarcacao);
    document.getElementById('formEditarMarcacao')?.addEventListener('submit', guardarEditarMarcacao);
    document.getElementById('editServico')?.addEventListener('change', atualizarAvisoPrecoEdicao);
    document.getElementById('editBarbeiro')?.addEventListener('change', atualizarHorariosEdicao);
    document.getElementById('editData')?.addEventListener('change', atualizarHorariosEdicao);

    const dataInput = document.getElementById('bkData');
    if (dataInput) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        if (amanha.getDay() === 0) amanha.setDate(amanha.getDate() + 1);
        dataInput.min = amanha.toISOString().split('T')[0];
        const max = new Date();
        max.setDate(max.getDate() + 30);
        dataInput.max = max.toISOString().split('T')[0];
        dataInput.addEventListener('change', () => {
            atualizarHorariosMarcacao();
            atualizarBotoesMarcacao();
        });
    }

    document.getElementById('bkHora')?.addEventListener('change', atualizarBotoesMarcacao);
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
        atualizarNumeracaoPassos();
    }

    renderizarServicosMarcacao();
    renderizarBarbeirosMarcacao();
    atualizarBotoesMarcacao();

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
            <div class="booking-option-image">
                <img src="${obterImagemServico(s)}" alt="${escMarcacao(s.nome)}" loading="lazy">
            </div>
            <div class="booking-option-name">${s.nome}</div>
            <div class="booking-option-price">${Number(s.preco).toFixed(2)}€</div>
            <div class="booking-option-meta">${s.tempo} ${typeof t === 'function' ? t('common.min') : 'min'}</div>
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
    atualizarBotoesMarcacao();
}

function selecionarBarbeiroMarcacao(id) {
    bkReserva.barbeiro_id = id;
    renderizarBarbeirosMarcacao();
    atualizarBotoesMarcacao();
}

function atualizarBotoesMarcacao() {
    const btn1 = document.getElementById('bkNext1');
    const btn2 = document.getElementById('bkNext2');
    const btn3 = document.getElementById('bkNext3');
    const data = document.getElementById('bkData')?.value;
    const hora = document.getElementById('bkHora')?.value;

    if (btn1) btn1.disabled = !bkReserva.servico_id;
    if (btn2) btn2.disabled = !bkReserva.barbeiro_id;
    if (btn3) btn3.disabled = !data || !hora;
}

function atualizarNumeracaoPassos() {
    const visiveis = [...document.querySelectorAll('.booking-step:not(.hidden-step)')];
    visiveis.forEach((step, index) => {
        const bubble = step.querySelector('span');
        if (bubble) bubble.textContent = String(index + 1);
    });
}

function irPasso(passo) {
    if (passo >= 2 && !bkReserva.servico_id) {
        mostrarToastMarcacao(typeof t === 'function' ? t('marcacao.err.service') : 'Selecione um serviço para continuar.', 'error');
        return;
    }

    if (passo === 2 && bkUmBarbeiro) passo = 3;

    if (passo >= 3 && !bkReserva.barbeiro_id) {
        mostrarToastMarcacao(typeof t === 'function' ? t('marcacao.err.barber') : 'Selecione um barbeiro.', 'error');
        return;
    }
    if (passo === 4) {
        const data = document.getElementById('bkData')?.value;
        const hora = document.getElementById('bkHora')?.value;
        if (!data || !hora) {
            mostrarToastMarcacao(typeof t === 'function' ? t('marcacao.err.datetime') : 'Selecione data e horário.', 'error');
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
    atualizarNumeracaoPassos();
    atualizarBotoesMarcacao();
}

async function atualizarHorariosMarcacao(excluirId = null) {
    const select = document.getElementById('bkHora');
    const data = document.getElementById('bkData')?.value;
    if (!select) return;

    const horaAtual = select.value;
    const selectLabel = typeof t === 'function' ? t('common.select') : 'Selecione...';
    select.innerHTML = `<option value="">${selectLabel}</option>`;
    let ocupados = [];

    if (data && bkReserva.barbeiro_id) {
        try {
            let url = `${API_URL}/agendamentos/ocupados?data=${data}&barbeiro_id=${bkReserva.barbeiro_id}`;
            if (excluirId) url += `&excluir_id=${excluirId}`;
            const res = await fetch(url);
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

    if (horaAtual && [...select.options].some(o => o.value === horaAtual)) {
        select.value = horaAtual;
    }
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
    if (bkUmBarbeiro && bkBarbeiros[0]) {
        bkReserva.barbeiro_id = bkBarbeiros[0].id;
    }
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
    atualizarNumeracaoPassos();
    atualizarBotoesMarcacao();
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
        bkMinhasMarcacoes = items;

        if (!items.length) {
            const emptyMsg = typeof t === 'function' ? t('marcacao.empty') : 'Ainda não tem marcações.';
            lista.innerHTML = `<p class="marcacao-empty"><i class="fas fa-calendar"></i> ${emptyMsg}</p>`;
            return;
        }

        lista.innerHTML = items.map(a => {
            const cancelado = (a.status || '').toLowerCase() === 'cancelado';
            const editavel = marcacaoEditavel(a);
            const statusLabel = cancelado
                ? (typeof t === 'function' ? t('marcacao.status.cancelled') : 'Cancelada')
                : (typeof t === 'function' ? t('marcacao.status.confirmed') : 'Confirmado');

            return `
            <div class="marcacao-item ${cancelado ? 'marcacao-item--cancelado' : ''}" data-id="${a.id}">
                <div class="marcacao-item-header">
                    <strong>${escMarcacao(a.servico?.nome || a.servico_nome || 'Serviço')}</strong>
                    ${editavel ? `
                        <div class="marcacao-item-acoes">
                            <button type="button" class="btn-marcacao-icon" data-editar="${a.id}" title="Editar">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button type="button" class="btn-marcacao-icon btn-marcacao-icon--danger" data-eliminar="${a.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <p><i class="fas fa-user"></i> ${escMarcacao(a.barbeiro?.nome || a.barbeiro_nome || '—')}</p>
                <p><i class="fas fa-calendar"></i> ${formatarDataPt(a.data)} às ${a.hora}</p>
                ${a.valor_pago ? `<p><i class="fas fa-euro-sign"></i> ${Number(a.valor_pago).toFixed(2)}€</p>` : ''}
                <span class="status">${statusLabel}</span>
            </div>
        `;
        }).join('');
    } catch {
        lista.innerHTML = '<p class="marcacao-empty">Erro ao carregar marcações.</p>';
    }
}

function marcacaoEditavel(a) {
    if ((a.status || 'confirmado').toLowerCase() !== 'confirmado') return false;
    const [y, m, d] = a.data.split('-').map(Number);
    const [hh, mm] = a.hora.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mm);
    return dt > new Date();
}

function escMarcacao(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function configurarLimitesDataEdit(input) {
    if (!input) return;
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    if (amanha.getDay() === 0) amanha.setDate(amanha.getDate() + 1);
    input.min = amanha.toISOString().split('T')[0];
    const max = new Date();
    max.setDate(max.getDate() + 30);
    input.max = max.toISOString().split('T')[0];
}

function preencherSelectServicosEdit(selecionado) {
    const sel = document.getElementById('editServico');
    if (!sel) return;
    sel.innerHTML = bkServicos.map(s =>
        `<option value="${s.id}" ${s.id === selecionado ? 'selected' : ''}>${escMarcacao(s.nome)} — ${Number(s.preco).toFixed(2)}€</option>`
    ).join('');
}

function preencherSelectBarbeirosEdit(selecionado) {
    const sel = document.getElementById('editBarbeiro');
    const wrap = document.getElementById('editBarbeiroWrap');
    if (!sel || !wrap) return;

    if (bkUmBarbeiro && bkBarbeiros[0]) {
        wrap.classList.add('hidden-step');
        sel.innerHTML = `<option value="${bkBarbeiros[0].id}" selected>${escMarcacao(bkBarbeiros[0].nome)}</option>`;
        return;
    }

    wrap.classList.remove('hidden-step');
    sel.innerHTML = bkBarbeiros.map(b =>
        `<option value="${b.id}" ${b.id === selecionado ? 'selected' : ''}>${escMarcacao(b.nome)}</option>`
    ).join('');
}

async function atualizarHorariosEdicao() {
    const select = document.getElementById('editHora');
    const data = document.getElementById('editData')?.value;
    const barbeiroId = bkUmBarbeiro
        ? bkBarbeiros[0]?.id
        : parseInt(document.getElementById('editBarbeiro')?.value, 10);
    if (!select) return;

    const horaAtual = select.value;
    select.innerHTML = '<option value="">Selecione...</option>';

    if (!data || !barbeiroId) return;

    let ocupados = [];
    try {
        let url = `${API_URL}/agendamentos/ocupados?data=${data}&barbeiro_id=${barbeiroId}`;
        if (bkEditandoId) url += `&excluir_id=${bkEditandoId}`;
        const res = await fetch(url);
        if (res.ok) {
            const r = await res.json();
            ocupados = r.horarios || [];
        }
    } catch { /* silencioso */ }

    BK_HORARIOS.forEach(h => {
        if (!ocupados.includes(h)) {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            select.appendChild(opt);
        }
    });

    if (horaAtual && [...select.options].some(o => o.value === horaAtual)) {
        select.value = horaAtual;
    }
}

function atualizarAvisoPrecoEdicao() {
    const aviso = document.getElementById('editAvisoPreco');
    const servicoId = parseInt(document.getElementById('editServico')?.value, 10);
    const servico = bkServicos.find(s => s.id === servicoId);
    if (!aviso || !servico) return;

    const novoPreco = Number(servico.preco);
    if (Math.abs(novoPreco - bkEditPrecoOriginal) > 0.01) {
        aviso.textContent = `O valor será atualizado para ${novoPreco.toFixed(2)}€.`;
    } else {
        aviso.textContent = '';
    }
}

async function abrirEditarMarcacao(id) {
    const marcacao = bkMinhasMarcacoes.find(m => m.id === id);
    if (!marcacao || !marcacaoEditavel(marcacao)) {
        mostrarToastMarcacao('Esta marcação não pode ser editada.', 'error');
        return;
    }

    bkEditandoId = id;
    bkEditPrecoOriginal = Number(marcacao.valor_pago || marcacao.servico?.preco || 0);

    document.getElementById('editMarcacaoId').value = id;
    preencherSelectServicosEdit(marcacao.servico?.id);
    preencherSelectBarbeirosEdit(marcacao.barbeiro?.id);

    const dataInput = document.getElementById('editData');
    configurarLimitesDataEdit(dataInput);
    dataInput.value = marcacao.data;

    await atualizarHorariosEdicao();
    document.getElementById('editHora').value = marcacao.hora;
    atualizarAvisoPrecoEdicao();

    document.getElementById('modalEditarMarcacao')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function fecharEditarMarcacao() {
    bkEditandoId = null;
    bkEditPrecoOriginal = 0;
    document.getElementById('modalEditarMarcacao')?.classList.add('hidden');
    document.body.style.overflow = '';
}

async function guardarEditarMarcacao(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editMarcacaoId')?.value, 10);
    const servico_id = parseInt(document.getElementById('editServico')?.value, 10);
    const barbeiro_id = bkUmBarbeiro
        ? bkBarbeiros[0]?.id
        : parseInt(document.getElementById('editBarbeiro')?.value, 10);
    const data = document.getElementById('editData')?.value;
    const hora = document.getElementById('editHora')?.value;

    if (!id || !servico_id || !barbeiro_id || !data || !hora) {
        mostrarToastMarcacao('Preencha todos os campos.', 'error');
        return;
    }

    const btn = e.target.querySelector('.btn-marcacao-guardar');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/agendamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obterToken()}`
            },
            body: JSON.stringify({ servico_id, barbeiro_id, data, hora })
        });
        const resultado = await res.json();

        if (!res.ok) {
            mostrarToastMarcacao(resultado.erro || 'Erro ao guardar.', 'error');
            return;
        }

        fecharEditarMarcacao();
        mostrarToastMarcacao('Marcação atualizada com sucesso.', 'success');
        await carregarMinhasMarcacoes();
    } catch {
        mostrarToastMarcacao('Erro de ligação ao servidor.', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function eliminarMarcacao(id) {
    const marcacao = bkMinhasMarcacoes.find(m => m.id === id);
    if (!marcacao || !marcacaoEditavel(marcacao)) {
        mostrarToastMarcacao('Esta marcação não pode ser eliminada.', 'error');
        return;
    }

    const servico = marcacao.servico?.nome || 'Serviço';
    const quando = `${formatarDataPt(marcacao.data)} às ${marcacao.hora}`;
    if (!confirm(`Eliminar a marcação de ${servico} (${quando})?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/agendamentos/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obterToken()}`
            },
            body: JSON.stringify({ motivo: 'Cancelado pelo cliente' })
        });
        const resultado = await res.json();

        if (!res.ok) {
            mostrarToastMarcacao(resultado.erro || 'Erro ao eliminar.', 'error');
            return;
        }

        mostrarToastMarcacao('Marcação eliminada com sucesso.', 'success');
        await carregarMinhasMarcacoes();
    } catch {
        mostrarToastMarcacao('Erro de ligação ao servidor.', 'error');
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
