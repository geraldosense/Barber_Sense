const IMG = {
    mbway: 'assets/payments/mbway.png',
    visa: 'assets/payments/visa.svg',
    paypal: 'assets/payments/paypal.svg',
    revolut: 'assets/payments/revolut.svg'
};

const PAY_LOGOS = {
    visa: `<img src="${IMG.visa}" alt="Visa" class="pay-method-logo pay-method-logo--visa">`,
    mbway: `<img src="${IMG.mbway}" alt="MB WAY" class="pay-method-logo pay-method-logo--mbway">`,
    paypal: `<img src="${IMG.paypal}" alt="PayPal" class="pay-method-logo pay-method-logo--paypal">`,
    revolut: `<img src="${IMG.revolut}" alt="Revolut" class="pay-method-logo pay-method-logo--revolut">`
};

const LOGO_CABECALHO = {
    visa: [{ src: IMG.visa, alt: 'Visa', cls: 'pagamento-brand-logo--visa' }],
    mbway: [{ src: IMG.mbway, alt: 'MB WAY', cls: 'pagamento-brand-logo--mbway' }],
    paypal: [{ src: IMG.paypal, alt: 'PayPal', cls: 'pagamento-brand-logo--paypal' }],
    revolut: [{ src: IMG.revolut, alt: 'Revolut', cls: 'pagamento-brand-logo--revolut' }]
};

const ORDEM_METODOS = ['mbway', 'visa', 'paypal', 'revolut'];

const METODOS_UI = [
    {
        id: 'mbway',
        backend: 'mbway',
        label: 'MB WAY',
        subtitle: 'Confirme no telemóvel com notificação ou SMS',
        logoHtml: PAY_LOGOS.mbway,
        btnLabel: 'Confirmar encomenda',
        needsForm: true,
        formType: 'mbway',
        expandInline: true
    },
    {
        id: 'visa',
        backend: 'visa',
        label: 'Visa',
        subtitle: 'Pagamento seguro com cartão Visa',
        logoHtml: PAY_LOGOS.visa,
        btnLabel: 'Pagar',
        needsForm: true,
        formType: 'visa'
    },
    {
        id: 'paypal',
        backend: 'paypal',
        label: 'PayPal',
        subtitle: 'Pagamento seguro com a sua conta PayPal',
        logoHtml: PAY_LOGOS.paypal,
        btnLabel: 'Pagar com PayPal',
        needsForm: true,
        formType: 'paypal'
    },
    {
        id: 'revolut',
        backend: 'revolut',
        label: 'Revolut',
        subtitle: 'Pague na app Revolut de forma rápida',
        logoHtml: PAY_LOGOS.revolut,
        btnLabel: 'Pagar com Revolut',
        needsForm: true,
        formType: 'revolut'
    }
];

const MAPA_BACKEND = {
    visa: 'visa',
    mbway: 'mbway',
    paypal: 'paypal',
    revolut: 'revolut'
};

let metodoSelecionado = 'mbway';

const PAISES_TELEFONE = [
    { code: '+351', label: 'Portugal (+351)' },
    { code: '+34', label: 'Espanha (+34)' },
    { code: '+33', label: 'França (+33)' },
    { code: '+44', label: 'Reino Unido (+44)' },
    { code: '+49', label: 'Alemanha (+49)' },
    { code: '+55', label: 'Brasil (+55)' },
    { code: '+1', label: 'EUA/Canadá (+1)' }
];

let dadosReserva = null;
let precoEsperado = 0;
let configPagamento = {};
let passoAtual = 'metodos';
let mbwayPedidoId = null;
let mbwayPollTimer = null;
let telefoneComerciante = '+351 960 075 690';

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

    renderizarResumo();
    await carregarConfigPagamento();
    configurarEventos();
    renderizarMetodos();
    atualizarTotalUI();
    atualizarBotaoPrincipal();
});

function formatarEuro(valor) {
    return `€ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function renderizarResumo() {
    document.getElementById('finalizarResumo').innerHTML = `
        <div class="finalizar-resumo-row"><span>Serviço</span><strong>${esc(dadosReserva.servico_nome || '—')}</strong></div>
        <div class="finalizar-resumo-row"><span>Barbeiro</span><strong>${esc(dadosReserva.barbeiro_nome || 'Geraldo Sense')}</strong></div>
        <div class="finalizar-resumo-row"><span>Data</span><strong>${esc(dadosReserva.data_fmt || dadosReserva.data)}</strong></div>
        <div class="finalizar-resumo-row"><span>Hora</span><strong>${esc(dadosReserva.hora)}</strong></div>
        <div class="finalizar-resumo-row"><span>Total</span><strong>${formatarEuro(precoEsperado)}</strong></div>
    `;
}

function atualizarTotalUI() {
    const txt = formatarEuro(precoEsperado);
    const el = document.getElementById('pagamentoTotalModal');
    if (el) el.textContent = txt;
}

async function carregarConfigPagamento() {
    try {
        const [resPag, resCom] = await Promise.all([
            fetch(`${API_URL}/config/pagamentos`),
            fetch(`${API_URL}/pagamentos/comerciante`)
        ]);
        const data = resPag.ok ? await resPag.json() : {};
        configPagamento = data.metodos || {};
        if (resCom.ok) {
            const com = await resCom.json();
            telefoneComerciante = com.mbway || configPagamento.mbway?.telefone || '+351 960 075 690';
        } else {
            telefoneComerciante = configPagamento.mbway?.telefone || '+351 960 075 690';
        }
    } catch {
        configPagamento = {};
    }

    const disponiveis = obterMetodosDisponiveis();
    if (!disponiveis.find(m => m.id === metodoSelecionado)) {
        metodoSelecionado = disponiveis[0]?.id || 'mbway';
    }
}

function obterMetodosDisponiveis() {
    return ORDEM_METODOS
        .map(id => METODOS_UI.find(m => m.id === id))
        .filter(Boolean);
}

function configurarEventos() {
    document.getElementById('btnAbrirPagamento')?.addEventListener('click', abrirModal);
    document.getElementById('pagamentoFechar')?.addEventListener('click', fecharModal);
    document.getElementById('pagamentoBackdrop')?.addEventListener('click', fecharModal);
    document.getElementById('pagamentoVoltar')?.addEventListener('click', voltarPasso);
    document.getElementById('btnPagamentoPrincipal')?.addEventListener('click', avancarPagamento);
    document.getElementById('btnConfirmarPagamento')?.addEventListener('click', confirmarReserva);
    document.getElementById('btnVerResumo')?.addEventListener('click', () => {
        fecharModal();
        document.getElementById('finalizarResumo')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('btnMbwayCancelar')?.addEventListener('click', cancelarMbwayAguardar);
}

function opcoesPaisSelect(selecionado = '+351') {
    return PAISES_TELEFONE.map(p =>
        `<option value="${p.code}" ${p.code === selecionado ? 'selected' : ''}>${esc(p.label)}</option>`
    ).join('');
}

function htmlCampoMbway(prefix = '') {
    const telCliente = utilizadorAtual?.telefone || dadosReserva.payload?.telefone || '';
    const telLimpo = formatarTelefoneLocal(telCliente);
    const fieldKey = prefix ? `${prefix}mbwayTelefone` : 'mbwayTelefone';
    return `
        <div class="pagamento-field" data-field="${fieldKey}">
            <label for="${prefix}mbwayTelefone">Número de telefone</label>
            <div class="pagamento-field-phone">
                <select id="${prefix}mbwayPais" class="mbway-pais-select" aria-label="Indicativo">${opcoesPaisSelect()}</select>
                <div class="pagamento-input-wrap">
                    <input type="tel" id="${prefix}mbwayTelefone" placeholder="9XX XXX XXX" value="${escAttr(telLimpo)}" inputmode="tel" autocomplete="tel">
                    <i class="fas fa-exclamation-circle field-error-icon hidden"></i>
                </div>
            </div>
            <span class="field-error-msg hidden"></span>
        </div>
    `;
}

function formatarTelefoneLocal(telefone) {
    let d = String(telefone || '').replace(/\D/g, '');
    if (d.startsWith('351')) d = d.slice(3);
    if (d.length === 9) {
        return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    }
    return d;
}

function atualizarCabecalhoModal(modo = 'metodos', metodoId = null) {
    const logoSense = document.getElementById('pagamentoCabecalhoLogo');
    const logosPay = document.getElementById('pagamentoCabecalhoLogosPay');
    const brandNome = document.getElementById('pagamentoBrandNome');
    const titulo = document.getElementById('pagamentoTitulo');

    if (modo === 'metodos') {
        logoSense?.classList.remove('hidden');
        logosPay?.classList.add('hidden');
        logosPay.innerHTML = '';
        brandNome?.classList.add('hidden');
        if (titulo) {
            titulo.textContent = typeof t === 'function' ? t('payment.mode') : 'Modo de pagamento';
            titulo.className = 'pagamento-brand-titulo';
        }
        return;
    }

    const m = METODOS_UI.find(x => x.id === metodoId);
    logoSense?.classList.add('hidden');
    brandNome?.classList.add('hidden');

    const logos = LOGO_CABECALHO[metodoId] || [];
    logosPay.innerHTML = logos.map(l =>
        `<img src="${l.src}" alt="${l.alt}" class="pagamento-brand-logo ${l.cls}">`
    ).join('');
    logosPay?.classList.remove('hidden');

    if (titulo) {
        titulo.textContent = m?.label || 'Pagamento';
        titulo.className = 'pagamento-brand-titulo pagamento-brand-titulo--metodo';
    }
}

function abrirModal() {
    passoAtual = 'metodos';
    atualizarCabecalhoModal('metodos');
    document.getElementById('pagamentoStepMetodos').classList.remove('hidden');
    document.getElementById('pagamentoStepDetalhes').classList.add('hidden');
    document.getElementById('pagamentoVoltar').classList.add('hidden');
    document.getElementById('pagamentoModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderizarMetodos();
    atualizarBotaoPrincipal();
}

function fecharModal() {
    if (mbwayPollTimer) clearInterval(mbwayPollTimer);
    document.getElementById('pagamentoModal').classList.add('hidden');
    document.body.style.overflow = '';
    passoAtual = 'metodos';
}

function voltarPasso() {
    if (passoAtual === 'detalhes') {
        passoAtual = 'metodos';
        atualizarCabecalhoModal('metodos');
        document.getElementById('pagamentoStepMetodos').classList.remove('hidden');
        document.getElementById('pagamentoStepDetalhes').classList.add('hidden');
        document.getElementById('pagamentoVoltar').classList.add('hidden');
        atualizarBotaoPrincipal();
    }
}

function renderizarMetodos() {
    const lista = document.getElementById('listaMetodos');
    if (!lista) return;

    const metodos = obterMetodosDisponiveis();

    lista.innerHTML = metodos.map(m => {
        const selected = m.id === metodoSelecionado;
        const bodyMb = m.id === 'mbway' && selected ? `
            <div class="pagamento-metodo-body">
                ${htmlCampoMbway('inline-')}
                <div class="pagamento-info-box">
                    Receberá notificação/SMS MB WAY no telemóvel indicado. O valor será creditado na conta <strong>Sense Barbershop</strong> (${esc(telefoneComerciante)}).
                </div>
            </div>
        ` : '';

        return `
            <div class="pagamento-metodo-card ${selected ? 'selected' : ''}" data-metodo="${m.id}">
                <button type="button" class="pagamento-metodo-head" data-select="${m.id}">
                    <input type="radio" name="metodoPag" value="${m.id}" ${selected ? 'checked' : ''} tabindex="-1" aria-hidden="true">
                    <div class="pagamento-metodo-info">
                        <strong>${esc(m.label)}</strong>
                        ${m.subtitle ? `<small>${esc(m.subtitle)}</small>` : ''}
                    </div>
                    <div class="pagamento-metodo-logo" aria-hidden="true">${m.logoHtml}</div>
                </button>
                ${m.expandInline && selected ? bodyMb : ''}
            </div>
        `;
    }).join('');

    lista.querySelectorAll('[data-select]').forEach(btn => {
        btn.addEventListener('click', () => selecionarMetodo(btn.dataset.select));
    });
}

function selecionarMetodo(id) {
    metodoSelecionado = id;
    renderizarMetodos();
    atualizarBotaoPrincipal();
}

function obterMetodoUI() {
    const metodos = obterMetodosDisponiveis();
    return metodos.find(m => m.id === metodoSelecionado) || metodos[0] || METODOS_UI[0];
}

function atualizarBotaoPrincipal() {
    const btn = document.getElementById('btnPagamentoPrincipal');
    const m = obterMetodoUI();
    if (!btn || !m) return;

    if (m.id === 'visa') {
        btn.textContent = `Pagar ${formatarEuro(precoEsperado)} com Visa`;
    } else if (m.id === 'mbway') {
        btn.textContent = 'Confirmar encomenda';
    } else if (m.id === 'paypal') {
        btn.textContent = `Pagar ${formatarEuro(precoEsperado)} com PayPal`;
    } else if (m.id === 'revolut') {
        btn.textContent = `Pagar ${formatarEuro(precoEsperado)} com Revolut`;
    } else {
        btn.textContent = m.btnLabel || 'Continuar';
    }
}

function avancarPagamento() {
    const m = obterMetodoUI();

    if (m.id === 'mbway' && m.expandInline) {
        if (!validarMbway(true)) return;
        iniciarPagamentoMbway();
        return;
    }

    if (!m.needsForm) {
        confirmarReserva();
        return;
    }

    passoAtual = 'detalhes';
    atualizarCabecalhoModal('detalhes', m.id);
    document.getElementById('pagamentoStepMetodos').classList.add('hidden');
    document.getElementById('pagamentoStepDetalhes').classList.remove('hidden');
    document.getElementById('pagamentoVoltar').classList.remove('hidden');
    renderizarFormulario(m);
}

function renderizarFormulario(m) {
    const container = document.getElementById('pagamentoFormContainer');
    const btn = document.getElementById('btnConfirmarPagamento');

    if (m.formType === 'visa') {
        container.innerHTML = `
            <div class="pagamento-form" id="formCartao">
                <div class="pagamento-field" data-field="cardNumero">
                    <label for="cardNumero">Número do cartão Visa</label>
                    <div class="pagamento-input-wrap">
                        <input type="text" id="cardNumero" placeholder="1234 5678 9012 3456" inputmode="numeric" maxlength="19" autocomplete="cc-number">
                        <i class="far fa-credit-card field-input-icon"></i>
                        <i class="fas fa-exclamation-circle field-error-icon hidden"></i>
                    </div>
                    <div class="pagamento-card-brands pagamento-card-brands--single">
                        <img src="${IMG.visa}" alt="Visa">
                    </div>
                    <span class="field-error-msg hidden"></span>
                </div>
                <div class="pagamento-field-row">
                    <div class="pagamento-field" data-field="cardValidade">
                        <label for="cardValidade">Data de validade</label>
                        <div class="pagamento-input-wrap">
                            <input type="text" id="cardValidade" placeholder="MM/AA" maxlength="5" inputmode="numeric" autocomplete="cc-exp">
                            <i class="fas fa-exclamation-circle field-error-icon hidden"></i>
                        </div>
                        <span class="field-error-msg hidden"></span>
                    </div>
                    <div class="pagamento-field" data-field="cardCvv">
                        <label for="cardCvv">Código de segurança</label>
                        <div class="pagamento-input-wrap">
                            <input type="text" id="cardCvv" placeholder="3 dígitos" maxlength="4" inputmode="numeric" autocomplete="cc-csc">
                            <i class="fas fa-credit-card field-input-icon field-input-icon--cvv" title="CVV"></i>
                            <i class="fas fa-exclamation-circle field-error-icon hidden"></i>
                        </div>
                        <span class="field-error-msg hidden"></span>
                    </div>
                </div>
                <div class="pagamento-field" data-field="cardNome">
                    <label for="cardNome">Nome no cartão</label>
                    <div class="pagamento-input-wrap">
                        <input type="text" id="cardNome" placeholder="J. Smith" autocomplete="cc-name">
                        <i class="fas fa-exclamation-circle field-error-icon hidden"></i>
                    </div>
                    <span class="field-error-msg hidden"></span>
                </div>
            </div>
        `;
        btn.textContent = `Pagar ${formatarEuro(precoEsperado)} com Visa`;
        configurarMascarasCartao();
        return;
    }

    if (m.formType === 'mbway') {
        container.innerHTML = `
            <div class="pagamento-form">
                ${htmlCampoMbway()}
                <div class="pagamento-info-box">
                    Receberá notificação/SMS MB WAY. Pagamento para <strong>Sense Barbershop</strong> (${esc(telefoneComerciante)}).
                </div>
            </div>
        `;
        btn.textContent = 'Confirmar encomenda';
        return;
    }

    if (m.formType === 'paypal') {
        container.innerHTML = `
            <div class="pagamento-form">
                <div class="pagamento-field" data-field="paypalEmail">
                    <label for="paypalEmail">Email PayPal</label>
                    <div class="pagamento-input-wrap">
                        <input type="email" id="paypalEmail" placeholder="seu@email.com" autocomplete="email">
                        <i class="fas fa-exclamation-circle field-error-icon hidden"></i>
                    </div>
                    <span class="field-error-msg hidden"></span>
                </div>
            </div>
        `;
        btn.textContent = `Pagar ${formatarEuro(precoEsperado)} com PayPal`;
        return;
    }

    if (m.formType === 'revolut') {
        const telCliente = formatarTelefoneLocal(utilizadorAtual?.telefone || dadosReserva.payload?.telefone || '');
        container.innerHTML = `
            <div class="pagamento-form">
                <div class="pagamento-field" data-field="revolutTelefone">
                    <label for="revolutTelefone">Telemóvel associado à Revolut</label>
                    <div class="pagamento-field-phone">
                        <select id="revolutPais" class="mbway-pais-select" aria-label="Indicativo">${opcoesPaisSelect()}</select>
                        <div class="pagamento-input-wrap">
                            <input type="tel" id="revolutTelefone" placeholder="9XX XXX XXX" value="${escAttr(telCliente)}" inputmode="tel" autocomplete="tel">
                            <i class="fas fa-exclamation-circle field-error-icon hidden"></i>
                        </div>
                    </div>
                    <span class="field-error-msg hidden"></span>
                </div>
                <div class="pagamento-info-box pagamento-info-box--revolut">
                    Receberá um pedido de pagamento na app <strong>Revolut</strong> para <strong>Sense Barbershop</strong>. Confirme na app para concluir a marcação.
                </div>
            </div>
        `;
        btn.textContent = `Pagar ${formatarEuro(precoEsperado)} com Revolut`;
        document.getElementById('revolutTelefone')?.addEventListener('input', () => limparErroCampo('revolutTelefone'));
        return;
    }
}

function configurarMascarasCartao() {
    const num = document.getElementById('cardNumero');
    const val = document.getElementById('cardValidade');

    num?.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        limparErroCampo('cardNumero');
    });

    val?.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
        e.target.value = v;
        limparErroCampo('cardValidade');
    });

    ['cardCvv', 'cardNome'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => limparErroCampo(id));
    });
}

function luhnValido(num) {
    const digits = num.replace(/\D/g, '');
    if (digits.length < 13) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
    }
    return sum % 10 === 0;
}

function validadeValida(val) {
    if (!/^\d{2}\/\d{2}$/.test(val)) return false;
    const [mm, aa] = val.split('/').map(Number);
    if (mm < 1 || mm > 12) return false;
    const ano = 2000 + aa;
    const agora = new Date();
    const expira = new Date(ano, mm, 0);
    return expira >= new Date(agora.getFullYear(), agora.getMonth(), 1);
}

function definirErroCampo(fieldId, mensagem) {
    const wrap = document.querySelector(`[data-field="${fieldId}"]`);
    if (!wrap) return;
    wrap.classList.add('pagamento-field--error');
    const msg = wrap.querySelector('.field-error-msg');
    const icon = wrap.querySelector('.field-error-icon');
    if (msg) {
        msg.textContent = mensagem;
        msg.classList.remove('hidden');
    }
    if (icon) icon.classList.remove('hidden');
}

function limparErroCampo(fieldId) {
    const wrap = document.querySelector(`[data-field="${fieldId}"]`);
    if (!wrap) return;
    wrap.classList.remove('pagamento-field--error');
    wrap.querySelector('.field-error-msg')?.classList.add('hidden');
    wrap.querySelector('.field-error-icon')?.classList.add('hidden');
}

function limparTodosErros() {
    document.querySelectorAll('.pagamento-field--error').forEach(el => {
        el.classList.remove('pagamento-field--error');
        el.querySelector('.field-error-msg')?.classList.add('hidden');
        el.querySelector('.field-error-icon')?.classList.add('hidden');
    });
}

function validarCartao() {
    limparTodosErros();
    const erros = {};
    const num = document.getElementById('cardNumero')?.value.replace(/\s/g, '') || '';
    const val = document.getElementById('cardValidade')?.value || '';
    const cvv = document.getElementById('cardCvv')?.value || '';
    const nome = document.getElementById('cardNome')?.value.trim() || '';

    if (!num) erros.cardNumero = 'Número de cartão inválido';
    else if (!luhnValido(num)) erros.cardNumero = 'Número de cartão inválido';

    if (!val) erros.cardValidade = 'Data de vencimento inválida';
    else if (!validadeValida(val)) erros.cardValidade = 'Data de vencimento inválida';

    if (!cvv || cvv.length < 3) erros.cardCvv = 'Formato de CVC/CVV inválido';

    if (!nome || nome.length < 2) erros.cardNome = 'Digite o nome conforme mostrado no cartão';

    Object.entries(erros).forEach(([k, v]) => definirErroCampo(k, v));

    if (Object.keys(erros).length) return { ok: false };

    return {
        ok: true,
        detalhes: {
            cartao_ultimos: num.slice(-4),
            cartao_validade: val,
            cartao_nome: nome
        }
    };
}

function obterCamposMbway() {
    const telInput = document.getElementById('mbwayTelefone')
        || document.getElementById('inline-mbwayTelefone');
    const paisSelect = document.getElementById('mbwayPais')
        || document.getElementById('inline-mbwayPais');
    return { telInput, paisSelect };
}

function validarMbway(mostrarErros = true) {
    const { telInput, paisSelect } = obterCamposMbway();
    const tel = telInput?.value.trim() || '';
    const fieldId = telInput?.id || 'mbwayTelefone';

    if (tel.replace(/\D/g, '').length < 9) {
        if (mostrarErros) {
            definirErroCampo(fieldId, 'Indique o número de telemóvel MB WAY');
        }
        return false;
    }
    limparErroCampo(fieldId);
    return {
        ok: true,
        telefone: tel,
        indicativo: paisSelect?.value || '+351'
    };
}

function validarDadosPagamento() {
    const m = obterMetodoUI();

    if (m.formType === 'visa' || m.id === 'visa') {
        return validarCartao();
    }

    if (m.id === 'mbway') {
        const v = validarMbway(true);
        if (!v || v.ok === undefined) return { ok: false };
        if (!v.ok) return { ok: false };
        return {
            ok: true,
            detalhes: {
                mbway_telefone: `${v.indicativo} ${v.telefone}`.trim(),
                mbway_pedido_id: mbwayPedidoId
            }
        };
    }

    if (m.formType === 'paypal') {
        limparErroCampo('paypalEmail');
        const email = document.getElementById('paypalEmail')?.value.trim() || '';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            definirErroCampo('paypalEmail', 'Indique um email PayPal válido');
            return { ok: false };
        }
        return { ok: true, detalhes: { paypal_email: email } };
    }

    if (m.formType === 'revolut') {
        limparErroCampo('revolutTelefone');
        const tel = document.getElementById('revolutTelefone')?.value.trim() || '';
        const indicativo = document.getElementById('revolutPais')?.value || '+351';
        if (tel.replace(/\D/g, '').length < 9) {
            definirErroCampo('revolutTelefone', 'Indique o telemóvel associado à Revolut');
            return { ok: false };
        }
        return {
            ok: true,
            detalhes: {
                revolut_telefone: `${indicativo} ${tel}`.trim()
            }
        };
    }

    return { ok: true, detalhes: {} };
}

async function iniciarPagamentoMbway() {
    const v = validarMbway(true);
    if (!v || !v.ok) return;

    const btnPrincipal = document.getElementById('btnPagamentoPrincipal');
    const btnDetalhes = document.getElementById('btnConfirmarPagamento');
    if (btnPrincipal) btnPrincipal.disabled = true;
    if (btnDetalhes) btnDetalhes.disabled = true;

    const referencia = utilizadorAtual?.nome || dadosReserva.payload?.nome || '';

    try {
        const res = await fetch(`${API_URL}/pagamentos/mbway/pedido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${obterToken()}`
            },
            body: JSON.stringify({
                telefone: v.telefone,
                indicativo: v.indicativo,
                valor: precoEsperado,
                referencia,
                descricao: `Marcação ${dadosReserva.servico_nome || 'Sense Barbershop'}`,
                email: utilizadorAtual?.email || dadosReserva.payload?.email
            })
        });

        const data = await res.json();
        if (!res.ok) {
            mostrarMsg(data.erro || 'Erro ao enviar pedido MB WAY.', 'error');
            if (btnPrincipal) btnPrincipal.disabled = false;
            if (btnDetalhes) btnDetalhes.disabled = false;
            return;
        }

        mbwayPedidoId = data.id;
        mostrarMbwayAguardar(data);
        iniciarPollMbway(data.id);
    } catch {
        mostrarMsg('Erro de ligação ao servidor.', 'error');
        if (btnPrincipal) btnPrincipal.disabled = false;
        if (btnDetalhes) btnDetalhes.disabled = false;
    }
}

function mostrarMbwayAguardar(data) {
    const el = document.getElementById('mbwayAguardar');
    document.getElementById('mbwayAguardarTexto').textContent =
        data.mensagem || 'Confirme o pagamento na app MB WAY quando receber a notificação ou SMS.';
    document.getElementById('mbwayAguardarTel').textContent = data.telefone_cliente || '';
    document.getElementById('mbwayAguardarValor').textContent = formatarEuro(precoEsperado);
    document.getElementById('btnMbwayCancelar').classList.remove('hidden');
    el?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function cancelarMbwayAguardar() {
    if (mbwayPollTimer) clearInterval(mbwayPollTimer);
    mbwayPedidoId = null;
    document.getElementById('mbwayAguardar')?.classList.add('hidden');
    document.getElementById('btnPagamentoPrincipal').disabled = false;
    document.getElementById('btnConfirmarPagamento').disabled = false;
}

function iniciarPollMbway(pedidoId) {
    if (mbwayPollTimer) clearInterval(mbwayPollTimer);

    const verificar = async () => {
        try {
            const res = await fetch(`${API_URL}/pagamentos/mbway/estado/${pedidoId}`, {
                headers: { Authorization: `Bearer ${obterToken()}` }
            });
            const data = await res.json();

            if (data.confirmado) {
                clearInterval(mbwayPollTimer);
                document.getElementById('mbwayAguardarTexto').textContent = 'Pagamento confirmado! A finalizar a marcação...';
                document.querySelector('.mbway-spinner').innerHTML = '<i class="fas fa-check-circle" style="color:#2e7d32;font-size:2rem"></i>';
                setTimeout(() => finalizarAgendamentoAposMbway(), 800);
            } else if (data.estado === 'expirado') {
                clearInterval(mbwayPollTimer);
                cancelarMbwayAguardar();
                mostrarMsg('Pedido MB WAY expirado. Tente novamente.', 'error');
            }
        } catch { /* continua a aguardar */ }
    };

    verificar();
    mbwayPollTimer = setInterval(verificar, 2500);
}

async function finalizarAgendamentoAposMbway() {
    document.getElementById('mbwayAguardar')?.classList.add('hidden');
    await confirmarReserva(true);
}

function mostrarMsg(msg, tipo = 'info') {
    const el = document.getElementById('finalizarMessage');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-message ${tipo}`;
    el.classList.remove('hidden');
}

async function confirmarReserva(mbwayJaConfirmado = false) {
    const m = obterMetodoUI();

    if (m.id === 'mbway' && !mbwayJaConfirmado) {
        if (!validarMbway(true)) return;
        await iniciarPagamentoMbway();
        return;
    }

    const validacao = validarDadosPagamento();
    if (!validacao.ok) return;

    const backendMetodo = MAPA_BACKEND[m.id] || m.id;
    const btnDetalhes = document.getElementById('btnConfirmarPagamento');
    const btnPrincipal = document.getElementById('btnPagamentoPrincipal');
    if (btnDetalhes) btnDetalhes.disabled = true;
    if (btnPrincipal) btnPrincipal.disabled = true;

    const referencia = utilizadorAtual?.nome || dadosReserva.payload?.nome || '';
    const detalhes = { ...validacao.detalhes };
    if (mbwayPedidoId) detalhes.mbway_pedido_id = mbwayPedidoId;

    const payload = {
        ...dadosReserva.payload,
        metodo_pagamento: backendMetodo,
        referencia_pagamento: referencia,
        valor_pago: precoEsperado,
        detalhes_pagamento: detalhes
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
            if (btnDetalhes) btnDetalhes.disabled = false;
            if (btnPrincipal) btnPrincipal.disabled = false;
            return;
        }

        sessionStorage.removeItem('reservaPendente');
        sessionStorage.setItem('marcacaoConfirmada', JSON.stringify({
            ...data,
            metodo_pagamento: m.label,
            valor_pago_fmt: formatarEuro(precoEsperado),
            referencia_pagamento: referencia
        }));

        window.location.href = 'marcacao.html?confirmado=1';
    } catch {
        mostrarMsg('Erro de ligação ao servidor.', 'error');
        if (btnDetalhes) btnDetalhes.disabled = false;
        if (btnPrincipal) btnPrincipal.disabled = false;
    }
}

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function escAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

document.addEventListener('sense:langchange', () => {
    if (passoAtual === 'metodos' || passoAtual === 'detalhes') {
        renderizarMetodos();
        atualizarCabecalhoModal(passoAtual, metodoSelecionado);
        atualizarBotaoPrincipal();
    }
});
