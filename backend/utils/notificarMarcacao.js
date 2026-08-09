const { enviarEmail, templateBase } = require('./mailer');

const EMAIL_AVISO =
    process.env.NOTIFY_BOOKING_EMAIL ||
    process.env.SITE_EMAIL ||
    'sensebarber10@gmail.com';

function escaparHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatarDataPt(dataIso) {
    try {
        const [y, m, d] = String(dataIso).split('-').map(Number);
        const data = new Date(y, m - 1, d);
        return data.toLocaleDateString('pt-PT', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dataIso;
    }
}

function formatarEuro(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return '—';
    return `${n.toFixed(2).replace('.', ',')} €`;
}

function labelPagamento(metodo) {
    const mapa = {
        mbway: 'MB WAY',
        visa: 'Visa',
        revolut: 'Revolut',
        paypal: 'PayPal',
        cartao: 'Cartão',
        apple_pay: 'Apple Pay',
        klarna: 'Klarna'
    };
    return mapa[String(metodo || '').toLowerCase()] || (metodo || '—');
}

/**
 * Aviso estruturado para a barbearia quando há nova marcação.
 * Não bloqueia a resposta da API se o email falhar.
 */
async function notificarNovaMarcacao(agendamento) {
    const id = agendamento.id;
    const nome = escaparHtml(agendamento.nome);
    const email = escaparHtml(agendamento.email);
    const telefone = escaparHtml(agendamento.telefone);
    const servico = escaparHtml(agendamento.servico?.nome || '—');
    const barbeiro = escaparHtml(agendamento.barbeiro?.nome || 'Geraldo Sense');
    const dataFmt = escaparHtml(formatarDataPt(agendamento.data));
    const hora = escaparHtml(agendamento.hora);
    const pagamento = escaparHtml(labelPagamento(agendamento.metodo_pagamento));
    const valor = escaparHtml(formatarEuro(agendamento.valor_pago ?? agendamento.servico?.preco));
    const referencia = escaparHtml(agendamento.referencia_pagamento || '—');
    const duracao = agendamento.servico?.tempo
        ? `${escaparHtml(agendamento.servico.tempo)} min`
        : '—';

    const conteudo = `
        <p style="margin:0 0 16px;font-size:16px;">
            <strong>Nova marcação recebida</strong> no site Sense Barbershop.
        </p>
        <div style="background:#111;color:#d4af37;padding:12px 16px;border-radius:8px;margin-bottom:20px;text-align:center;font-weight:700;letter-spacing:0.04em;">
            RESERVA #${escaparHtml(id)}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;width:38%;">Cliente</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">${nome}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">
                    <a href="mailto:${email}" style="color:#1a1a1a;">${email}</a>
                </td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Telefone</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">
                    <a href="tel:${telefone}" style="color:#1a1a1a;">${telefone}</a>
                </td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Serviço</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">${servico}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Duração</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">${duracao}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Barbeiro</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">${barbeiro}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Data</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;text-transform:capitalize;">${dataFmt}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Hora</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">${hora}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Pagamento</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">${pagamento}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Valor</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#b8962e;font-weight:700;font-size:16px;">${valor}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;color:#777;">Referência</td>
                <td style="padding:10px 0;">${referencia}</td>
            </tr>
        </table>
        <p style="margin:22px 0 0;padding:14px;background:#f8f5ea;border-left:4px solid #d4af37;border-radius:4px;font-size:13px;color:#555;">
            Abra o painel de administração para gerir esta marcação. Este aviso foi enviado automaticamente pelo site.
        </p>
    `;

    const texto = [
        `Nova marcação #${id} — Sense Barbershop`,
        '',
        `Cliente: ${agendamento.nome}`,
        `Email: ${agendamento.email}`,
        `Telefone: ${agendamento.telefone}`,
        `Serviço: ${agendamento.servico?.nome || '—'}`,
        `Barbeiro: ${agendamento.barbeiro?.nome || 'Geraldo Sense'}`,
        `Data: ${formatarDataPt(agendamento.data)}`,
        `Hora: ${agendamento.hora}`,
        `Pagamento: ${labelPagamento(agendamento.metodo_pagamento)}`,
        `Valor: ${formatarEuro(agendamento.valor_pago ?? agendamento.servico?.preco)}`,
        `Referência: ${agendamento.referencia_pagamento || '—'}`
    ].join('\n');

    return enviarEmail({
        para: EMAIL_AVISO,
        assunto: `Nova marcação #${id} — ${agendamento.nome} · ${agendamento.data} ${agendamento.hora}`,
        html: templateBase('Nova Marcação', conteudo),
        texto
    });
}

module.exports = { notificarNovaMarcacao, EMAIL_AVISO };
