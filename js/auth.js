// ============================================
// TYPEBIZ - АВТОРИЗАЦІЯ (З EMAIL ВЕРИФІКАЦІЄЮ)
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

// КОНФІГУРАЦІЯ RESEND
var RESEND_API_KEY = 're_ваш_ключ_з_resend'; // Замініть на реальний ключ
var RESEND_FROM_EMAIL = 'noreply@ваш-домен.com'; // Замініть на ваш домен

var currentUser = null;

function getCurrentUser() {
    try {
        var userData = localStorage.getItem('userData');
        if (userData) {
            currentUser = JSON.parse(userData);
            return currentUser;
        }
        return null;
    } catch {
        return null;
    }
}

async function checkAuth() {
    var user = getCurrentUser();
    if (!user) return false;

    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(user.email), {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) return false;
        
        var data = await response.json();
        if (!data || data.length === 0) return false;
        
        currentUser = data[0];
        localStorage.setItem('userData', JSON.stringify(currentUser));
        return true;
    } catch {
        return false;
    }
}

async function requireAuth() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

async function requireAdmin() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login';
        return false;
    }
    
    var user = getCurrentUser();
    if (user && user.role !== 'admin') {
        await showAlert('Доступ заборонено. Потрібні права адміністратора.', 'error');
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

function logoutUser() {
    localStorage.removeItem('userData');
    localStorage.removeItem('isGuest');
    currentUser = null;
    window.location.href = '/login';
}

async function loginUser(email, password) {
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Помилка під час пошуку користувача');
        }

        var users = await response.json();
        
        if (!users || users.length === 0) {
            throw new Error('Користувача не знайдено');
        }

        var user = users[0];

        if (user.password && user.password !== password) {
            throw new Error('Невірний пароль');
        }

        // Перевіряємо чи email підтверджено
        if (!user.email_verified) {
            throw new Error('Email не підтверджено. Будь ласка, перевірте пошту.');
        }

        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===== ВІДПРАВКА КОДУ НА EMAIL =====
async function sendVerificationCode(email) {
    try {
        // Генеруємо 6-значний код
        var code = Math.floor(100000 + Math.random() * 900000).toString();
        var expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Код діє 5 хвилин

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

        // Відправляємо email через Resend
        var emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + RESEND_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: RESEND_FROM_EMAIL,
                to: [email],
                subject: 'Код підтвердження Typebiz',
                html: `
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
            console.error('Resend error:', errorData);
            throw new Error('Не вдалося надіслати email: ' + (errorData.message || 'невідома помилка'));
        }

        return { success: true, code: code };
    } catch (error) {
        console.error('Send verification code error:', error);
        return { success: false, error: error.message };
    }
}

// ===== ПЕРЕВІРКА КОДУ =====
async function verifyEmailCode(email, code) {
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Користувача не знайдено');
        }

        var users = await response.json();
        if (!users || users.length === 0) {
            throw new Error('Користувача не знайдено');
        }

        var user = users[0];

        // Перевіряємо чи код існує
        if (!user.email_verification_code) {
            throw new Error('Код не був надісланий');
        }

        // Перевіряємо чи код не застарів
        var expiresAt = new Date(user.email_verification_expires);
        if (new Date() > expiresAt) {
            throw new Error('Код застарів. Надішліть новий код.');
        }

        // Перевіряємо код
        if (user.email_verification_code !== code) {
            throw new Error('Невірний код');
        }

        // Код правильний - позначаємо email як підтверджений
        var updateResponse = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email_verified: true,
                email_verification_code: null,
                email_verification_expires: null
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Не вдалося підтвердити email');
        }

        // Оновлюємо локальні дані
        user.email_verified = true;
        user.email_verification_code = null;
        user.email_verification_expires = null;
        localStorage.setItem('userData', JSON.stringify(user));
        currentUser = user;

        return { success: true };
    } catch (error) {
        console.error('Verify code error:', error);
        return { success: false, error: error.message };
    }
}

// ===== РЕЄСТРАЦІЯ =====
async function registerUser(email, password, fullName) {
    try {
        // Перевіряємо чи email вже існує
        var checkResponse = await fetch(SUPABASE_URL + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });

        if (checkResponse.ok) {
            var existing = await checkResponse.json();
            if (existing && existing.length > 0) {
                throw new Error('Користувач з таким email вже існує');
            }
        }

        var userId = generateUUID();
        
        var userData = {
            id: userId,
            auth_id: userId,
            email: email,
            full_name: fullName,
            password: password,
            role: 'user',
            is_active: true,
            email_verified: false,
            created_at: new Date().toISOString()
        };

        var response = await fetch(SUPABASE_URL + '/rest/v1/users', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            var errorText = await response.text();
            throw new Error('Помилка при створенні акаунта: ' + errorText);
        }

        var result = await response.json();
        var user = result[0] || result;
        
        // Зберігаємо користувача локально
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        // Надсилаємо код на email
        var codeResult = await sendVerificationCode(email);
        if (!codeResult.success) {
            // Якщо не вдалося надіслати код, але користувач створений
            console.warn('Код не надіслано:', codeResult.error);
        }

        return { 
            success: true, 
            user: user, 
            codeSent: codeResult.success,
            codeError: codeResult.error
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isAdmin() {
    var user = getCurrentUser();
    return user && user.role === 'admin';
}

window.auth = {
    getCurrentUser: getCurrentUser,
    checkAuth: checkAuth,
    requireAuth: requireAuth,
    requireAdmin: requireAdmin,
    logoutUser: logoutUser,
    loginUser: loginUser,
    registerUser: registerUser,
    sendVerificationCode: sendVerificationCode,
    verifyEmailCode: verifyEmailCode,
    isAdmin: isAdmin
};

console.log('✅ Auth module loaded');
