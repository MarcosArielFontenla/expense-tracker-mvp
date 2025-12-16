import axios from 'axios';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

class EmailService {
    private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

    constructor() { }

    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            // Validate API Key presence
            if (!process.env.BREVO_API_KEY) {
                throw new Error('BREVO_API_KEY is missing in environment variables');
            }

            const senderEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Fallback just in case, but should be set

            const data = {
                sender: { email: senderEmail, name: 'Expense Tracker' },
                to: [{ email: options.to }],
                subject: options.subject,
                htmlContent: options.html
            };

            const response = await axios.post(this.apiUrl, data, {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 5000 // 5s timeout
            });

            console.log(`✅ Email sent to ${options.to}. MessageId: ${(response.data as any)?.messageId}`);
        } catch (error: any) {
            console.error('❌ Brevo API sending error:', error?.response?.data || error.message);

            // Fallback for MVP/No-Domain: Log the content so admin can see the link
            console.log('⚠️ FALLBACK - EMAIL CONTENT ⚠️');
            console.log(`To: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log('content: ', options.html);
            console.log('⚠️ END FALLBACK ⚠️');
        }
    }

    async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${resetToken}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                    .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Recuperación de Contraseña</h1>
                    </div>
                    <div class="content">
                        <p>Hola,</p>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Expense Tracker</strong>.</p>
                        <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                        </div>
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                        <div class="warning">
                            <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por razones de seguridad.
                        </div>
                        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
                        <p>Saludos,<br>El equipo de Expense Tracker</p>
                    </div>
                    <div class="footer">
                        <p>Este es un email automático, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await this.sendEmail({
            to: email,
            subject: '🔐 Recuperación de Contraseña - Expense Tracker',
            html
        });
    }

    async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email/${verificationToken}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                    .info { background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✉️ Verifica tu Email</h1>
                    </div>
                    <div class="content">
                        <p>¡Bienvenido a <strong>Expense Tracker</strong>!</p>
                        <p>Gracias por registrarte. Para completar tu registro y comenzar a usar tu cuenta, necesitamos verificar tu dirección de email.</p>
                        <p>Haz clic en el botón de abajo para verificar tu email:</p>
                        <div style="text-align: center;">
                            <a href="${verifyUrl}" class="button">Verificar Email</a>
                        </div>
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
                        <div class="info">
                            <strong>ℹ️ Nota:</strong> Este enlace expirará en <strong>24 horas</strong>.
                        </div>
                        <p>Si no creaste esta cuenta, puedes ignorar este correo de forma segura.</p>
                        <p>Saludos,<br>El equipo de Expense Tracker</p>
                    </div>
                    <div class="footer">
                        <p>Este es un email automático, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await this.sendEmail({
            to: email,
            subject: '✉️ Verifica tu Email - Expense Tracker',
            html
        });
    }
}

export default new EmailService();