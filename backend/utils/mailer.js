const nodemailer = require('nodemailer');

function resolverConfigEmail() {
    const user = process.env.EMAIL_USER || '';
    const pass = process.env.EMAIL_PASS || '';
    let host = process.env.EMAIL_HOST || '';
    let port = parseInt(process.env.EMAIL_PORT || '587', 10);
    let secure = process.env.EMAIL_SECURE === 'true';

    if (!host && user.includes('@gmail.com')) {
        host = 'smtp.gmail.com';
        port = 587;
        secure = false;
    }

    return { host, port, secure, user, pass };
}

function emailConfigurado() {
    const { host, user, pass } = resolverConfigEmail();
    return !!(host && user && pass);
}

let transporter = null;

function obterTransporter() {
    if (transporter) return transporter;

    const { host, port, secure, user, pass } = resolverConfigEmail();

    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' }
    });

    return transporter;
}

async function enviarEmail({ para, assunto, html, texto }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Sense Barbershop <nao-responda@sensebarbershop.pt>',
        to: para,
        subject: assunto,
        html,
        text: texto
    };

    if (!emailConfigurado()) {
        console.log('\n📧 [EMAIL NÃO CONFIGURADO — configure EMAIL_HOST, EMAIL_USER e EMAIL_PASS no backend/.env]');
        console.log(`   Para: ${para}`);
        console.log(`   Assunto: ${assunto}`);
        if (texto) console.log(`   Texto: ${texto}`);
        console.log('');
        return { enviado: false, simulado: true, erro: 'Email não configurado no servidor.' };
    }

    try {
        await obterTransporter().sendMail(mailOptions);
        console.log(`✉️  Email enviado para ${para}: ${assunto}`);
        return { enviado: true, simulado: false };
    } catch (err) {
        console.error(`❌ Falha ao enviar email para ${para}:`, err.message);
        return { enviado: false, simulado: false, erro: err.message };
    }
}

function templateBase(titulo, conteudo) {
    return `
        <!DOCTYPE html>
        <html lang="pt">
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                <div style="background:#1a1a1a;color:#d4af37;padding:30px;text-align:center;">
                    <h1 style="margin:0;">🧔 Sense Barbershop</h1>
                    <p style="margin:8px 0 0;opacity:0.9;">${titulo}</p>
                </div>
                <div style="padding:30px;color:#333;line-height:1.6;">
                    ${conteudo}
                </div>
                <div style="background:#f5f5f5;padding:20px;text-align:center;color:#999;font-size:12px;">
                    © 2026 Sense Barbershop. Email automático — não responda.
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { enviarEmail, emailConfigurado, templateBase, resolverConfigEmail };
