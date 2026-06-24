// ===== ROTAS DE EMAIL =====
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configurar transporter (será necessário configurar com dados reais)
// Para desenvolvimento, pode usar Mailtrap ou similar
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'localhost',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

/**
 * POST /api/email/confirmacao
 * Enviar email de confirmação de agendamento
 */
router.post('/confirmacao', async (req, res) => {
    try {
        const { email, agendamento } = req.body;

        if (!email || !agendamento) {
            return res.status(400).json({
                erro: 'Email e dados do agendamento são obrigatórios'
            });
        }

        // Formatar data
        const date = new Date(agendamento.data + 'T00:00:00');
        const dataFormatada = date.toLocaleDateString('pt-PT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // HTML do email
        const htmlConteudo = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background-color: #1a1a1a; color: #d4af37; padding: 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { padding: 30px; }
                    .confirmation { background-color: #1ab45b; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
                    .details { background-color: #f9f9f9; padding: 20px; border-left: 4px solid #d4af37; margin-bottom: 20px; }
                    .detail-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
                    .detail-label { font-weight: bold; color: #1a1a1a; }
                    .detail-value { color: #666; }
                    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; }
                    .btn { background-color: #d4af37; color: #1a1a1a; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧔 Sense Barbershop</h1>
                    </div>
                    <div class="content">
                        <div class="confirmation">
                            <h2>✓ Seu Agendamento foi Confirmado!</h2>
                        </div>
                        
                        <p>Olá ${agendamento.nome},</p>
                        
                        <p>Seu agendamento para a Sense Barbershop foi confirmado com sucesso.</p>
                        
                        <div class="details">
                            <h3 style="margin-top: 0; color: #1a1a1a;">Detalhes do Agendamento:</h3>
                            
                            <div class="detail-row">
                                <span class="detail-label">Número de Confirmação:</span>
                                <span class="detail-value">#${agendamento.id}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Serviço:</span>
                                <span class="detail-value">${agendamento.servico.nome}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Valor:</span>
                                <span class="detail-value">€${agendamento.servico.preco.toFixed(2)}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Barbeiro:</span>
                                <span class="detail-value">${agendamento.barbeiro.nome}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Data:</span>
                                <span class="detail-value">${dataFormatada}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Hora:</span>
                                <span class="detail-value">${agendamento.hora}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Duração Estimada:</span>
                                <span class="detail-value">${agendamento.servico.tempo} minutos</span>
                            </div>
                        </div>
                        
                        <p>Você receberá uma lembrança 24 horas antes do seu agendamento.</p>
                        
                        <p><strong>Informações Importantes:</strong></p>
                        <ul>
                            <li>Chegue com 5-10 minutos de antecedência</li>
                            <li>Se precisar cancelar ou remarcar, avise com pelo menos 24 horas de antecedência</li>
                            <li>Para dúvidas, ligue para nós</li>
                        </ul>
                        
                        <p style="text-align: center;">
                            <a href="#" class="btn">Ver Meu Agendamento</a>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2026 Sense Barbershop. Todos os direitos reservados.</p>
                        <p>Este é um email automático, por favor não responda.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Configurar opções do email
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'nao-responda@barbeariasense.pt',
            to: email,
            subject: `Agendamento Confirmado - Sense Barbershop #${agendamento.id}`,
            html: htmlConteudo
        };

        // Tentar enviar email (será silenciosamente ignorado se não estiver configurado)
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email enviado para ${email}`);
        } catch (emailError) {
            console.log('Email não configurado ou falhou:', emailError.message);
            // Não retorna erro, apenas registra
        }

        res.json({
            mensagem: 'Confirmação preparada',
            email: email,
            agendamento_id: agendamento.id
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/email/lembrete
 * Enviar email de lembrete
 */
router.post('/lembrete', async (req, res) => {
    try {
        const { email, agendamento } = req.body;

        if (!email || !agendamento) {
            return res.status(400).json({
                erro: 'Email e dados do agendamento são obrigatórios'
            });
        }

        const htmlConteudo = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background-color: #1a1a1a; color: #d4af37; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .alert { background-color: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧔 Sense Barbershop</h1>
                    </div>
                    <div class="content">
                        <div class="alert">
                            <strong>⏰ Lembrete do seu Agendamento!</strong>
                        </div>
                        
                        <p>Olá ${agendamento.nome},</p>
                        
                        <p>Este é um lembrete que você tem um agendamento conosco amanhã!</p>
                        
                        <p><strong>Detalhes:</strong></p>
                        <ul>
                            <li>Serviço: ${agendamento.servico.nome}</li>
                            <li>Barbeiro: ${agendamento.barbeiro.nome}</li>
                            <li>Hora: ${agendamento.hora}</li>
                        </ul>
                        
                        <p>Esperamos você em breve!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'nao-responda@barbeariasense.pt',
            to: email,
            subject: `Lembrete - Seu agendamento na Sense Barbershop`,
            html: htmlConteudo
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.log('Email de lembrete não configurado:', emailError.message);
        }

        res.json({
            mensagem: 'Lembrete enviado'
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

/**
 * POST /api/email/cancelamento
 * Enviar email de cancelamento
 */
router.post('/cancelamento', async (req, res) => {
    try {
        const { email, agendamento, motivo } = req.body;

        if (!email || !agendamento) {
            return res.status(400).json({
                erro: 'Email e dados do agendamento são obrigatórios'
            });
        }

        const htmlConteudo = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; }
                    .header { background-color: #1a1a1a; color: #d4af37; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧔 Sense Barbershop</h1>
                    </div>
                    <div class="content">
                        <p>Olá ${agendamento.nome},</p>
                        
                        <p>Informamos que seu agendamento foi cancelado.</p>
                        
                        <p><strong>Agendamento Cancelado:</strong></p>
                        <ul>
                            <li>Serviço: ${agendamento.servico.nome}</li>
                            <li>Data: ${agendamento.data}</li>
                            <li>Hora: ${agendamento.hora}</li>
                        </ul>
                        
                        ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
                        
                        <p>Para remarcar, visite nosso site ou ligue-nos.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'nao-responda@barbeariasense.pt',
            to: email,
            subject: `Agendamento Cancelado - Sense Barbershop`,
            html: htmlConteudo
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.log('Email de cancelamento não configurado:', emailError.message);
        }

        res.json({
            mensagem: 'Confirmação de cancelamento enviada'
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
