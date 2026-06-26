const crypto = require('crypto');

const MERCHANT_PHONE = process.env.MBWAY_MERCHANT_PHONE || '+351960075690';
const EASYPAY_ACCOUNT_ID = process.env.EASYPAY_ACCOUNT_ID || '';
const EASYPAY_API_KEY = process.env.EASYPAY_API_KEY || '';
const EASYPAY_SANDBOX = process.env.EASYPAY_SANDBOX === 'true';

function normalizarTelefone(telefone, indicativo = '+351') {
    let digits = String(telefone || '').replace(/\D/g, '');
    const ind = String(indicativo || '+351').replace(/\D/g, '');
    if (digits.startsWith(ind)) digits = digits.slice(ind.length);
    if (digits.startsWith('351') && digits.length > 9) digits = digits.slice(3);
    return { indicativo: ind || '351', numero: digits };
}

function formatarTelefoneExibicao(indicativo, numero) {
    const ind = indicativo.startsWith('+') ? indicativo : `+${indicativo}`;
    return `${ind} ${numero}`;
}

async function criarPedidoMbWay({ telefone, indicativo, valor, referencia, descricao, email }) {
    const { indicativo: ind, numero } = normalizarTelefone(telefone, indicativo);

    if (!numero || numero.length < 9) {
        throw new Error('Número de telemóvel MB WAY inválido.');
    }

    const valorNum = parseFloat(valor);
    if (Number.isNaN(valorNum) || valorNum <= 0) {
        throw new Error('Valor de pagamento inválido.');
    }

    const pedidoId = crypto.randomBytes(16).toString('hex');
    const telefoneCompleto = formatarTelefoneExibicao(ind, numero);
    const telefoneApi = `${ind}${numero}`;

    if (EASYPAY_ACCOUNT_ID && EASYPAY_API_KEY) {
        const baseUrl = EASYPAY_SANDBOX
            ? 'https://api.test.easypay.pt/2.0/mbway'
            : 'https://api.prod.easypay.pt/2.0/mbway';

        const resposta = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                AccountId: EASYPAY_ACCOUNT_ID,
                ApiKey: EASYPAY_API_KEY
            },
            body: JSON.stringify({
                customer: {
                    phone: telefoneApi,
                    email: email || 'cliente@sensebarbershop.pt',
                    name: referencia || 'Cliente Sense'
                },
                value: valorNum,
                description: descricao || 'Marcação Sense Barbershop',
                currency: 'EUR'
            })
        });

        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
            throw new Error(dados.message || dados.error || 'Erro ao enviar pedido MB WAY.');
        }

        return {
            id: dados.id || pedidoId,
            estado: 'pendente',
            telefone_cliente: telefoneCompleto,
            telefone_comerciante: MERCHANT_PHONE,
            valor: valorNum,
            mensagem: `Pedido MB WAY enviado para ${telefoneCompleto}. Confirme na app ou por SMS.`,
            simulado: false,
            provider: 'easypay',
            provider_ref: dados.id || null
        };
    }

    return {
        id: pedidoId,
        estado: 'pendente',
        telefone_cliente: telefoneCompleto,
        telefone_comerciante: MERCHANT_PHONE,
        valor: valorNum,
        mensagem: `Pedido MB WAY enviado para ${telefoneCompleto}. Receberá notificação/SMS para confirmar o pagamento de ${valorNum.toFixed(2)}€ na conta Sense Barbershop (${MERCHANT_PHONE}).`,
        simulado: true,
        provider: 'simulacao'
    };
}

module.exports = {
    MERCHANT_PHONE,
    normalizarTelefone,
    formatarTelefoneExibicao,
    criarPedidoMbWay
};
