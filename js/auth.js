// ============================================
// TYPEBIZ - АВТОРИЗАЦІЯ (З BREVO)
// ============================================

// КОНФІГУРАЦІЯ BREVO
var BREVO_API_KEY = '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'; // Отримайте в панелі Brevo
var BREVO_FROM_EMAIL = 'dapafosa@gmail.com'; // Ваш email (підтверджений у Brevo)
var BREVO_FROM_NAME = 'Typebiz';

// ===== ВІДПРАВКА КОДУ ЧЕРЕЗ BREVO =====
async function sendVerificationCode(email) {
    try {
        var code = Math.floor(100000 + Math.random() * 900000).toString();
        var expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        // Зберігаємо код у БД
        var updateResponse = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email_verification_code: code,
                email_verification_expires: expiresAt.toISOString(),
                email_verified: false
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Не вдалося зберегти код');
        }

        // Відправляємо email через Brevo API (БЕЗ CORS!)
        var emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: BREVO_FROM_NAME,
                    email: BREVO_FROM_EMAIL
                },
                to: [
                    {
                        email: email
                    }
                ],
                subject: 'Код підтвердження Typebiz',
                htmlContent: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 40px; }
                            .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .code { font-size: 32px; font-weight: bold; color: #F2A93B; text-align: center; padding: 20px; background: #f8f8f8; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; }
                            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2 style="text-align:center;color:#1a202c;">🔐 Підтвердження email</h2>
                            <p style="color:#4a5568;">Введіть цей код на сайті для підтвердження вашої електронної пошти:</p>
                            <div class="code">${code}</div>
                            <p style="color:#718096;font-size:14px;text-align:center;">
                                ⏳ Код дійсний <strong>5 хвилин</strong><br>
                                ⚠️ Нікому не передавайте цей код
                            </p>
                            <div class="footer">
                                <p>Typebiz — цифрова картотека для організацій</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        });

        if (!emailResponse.ok) {
            var errorData = await emailResponse.json();
            console.error('Brevo error:', errorData);
            throw new Error('Не вдалося надіслати email');
        }

        return { success: true, code: code };
    } catch (error) {
        console.error('Send verification code error:', error);
        return { success: false, error: error.message };
    }
}
