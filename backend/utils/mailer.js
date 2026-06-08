const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

function emailConfigurado() {
    return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

async function enviarEmail({ para, assunto, html }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'nao-responda@barbeariasense.pt',
        to: para,
        subject: assunto,
        html
    };

    if (!emailConfigurado()) {
        console.log('\n📧 [EMAIL NÃO CONFIGURADO]');
        console.log(`   Para: ${para}`);
        console.log(`   Assunto: ${assunto}`);
        console.log('   Conteúdo HTML enviado (verifique links no log do servidor)\n');
        return { enviado: false, simulado: true };
    }

    await transporter.sendMail(mailOptions);
    return { enviado: true, simulado: false };
}

function templateBase(titulo, conteudo) {
    return `
        <!DOCTYPE html>
        <html lang="pt">
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                <div style="background:#1a1a1a;color:#d4af37;padding:30px;text-align:center;">
                    <h1 style="margin:0;">🧔 Sense Barbearia</h1>
                    <p style="margin:8px 0 0;opacity:0.9;">${titulo}</p>
                </div>
                <div style="padding:30px;color:#333;line-height:1.6;">
                    ${conteudo}
                </div>
                <div style="background:#f5f5f5;padding:20px;text-align:center;color:#999;font-size:12px;">
                    © 2026 Sense Barbearia. Email automático — não responda.
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { enviarEmail, emailConfigurado, templateBase };
