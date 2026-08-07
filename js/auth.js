// ============================================
// TYPEBIZ - AUTH LAYER (ПОВНА ВЕРСІЯ З ФІКСАМИ)
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

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

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// ПЕРЕВІРКА БАНА - ОДИНАКОВА ЛОГІКА ДЛЯ ВСІХ МІСЦЬ
// ============================================

async function checkUserBanned(userId, accessToken) {
    if (!userId) return null;
    
    try {
        var headers = {
            'apikey': SUPABASE_ANON_KEY
        };
        if (accessToken) {
            headers['Authorization'] = 'Bearer ' + accessToken;
        } else {
            headers['Authorization'] = 'Bearer ' + SUPABASE_ANON_KEY;
        }
        
        var response = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + userId + '&select=is_banned,ban_reason', {
            headers: headers
        });

        if (!response.ok) return null;
        
        var data = await response.json();
        if (data && data.length > 0) {
            return {
                is_banned: data[0].is_banned === true,
                ban_reason: data[0].ban_reason || 'Порушення правил платформи'
            };
        }
        return null;
    } catch (e) {
        console.error('checkUserBanned error:', e);
        return null;
    }
}

// ============================================
// ВХІД
// ============================================

async function loginUser(email, password) {
    try {
        // Шукаємо користувача
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
        
        // ПЕРЕВІРКА НА БАН - ПЕРШИМ ДІЛОМ!
        var banInfo = await checkUserBanned(user.id, SUPABASE_ANON_KEY);
        if (banInfo && banInfo.is_banned === true) {
            // Зберігаємо інформацію про бан в localStorage для сторінки banned
            localStorage.setItem('userData', JSON.stringify({
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                is_banned: true,
                ban_reason: banInfo.ban_reason || 'Порушення правил платформи'
            }));
            // Редірект на сторінку бана
            window.location.href = '/banned';
            // ВАЖЛИВО: ВИХОДИМО З ФУНКЦІЇ, ЩОБ НЕ ПРОДОВЖУВАТИ
            return { success: false, error: 'Акаунт заблоковано', banned: true };
        }

        // Перевіряємо пароль (якщо зберігається в БД - в реальному проєкті має бути хеш)
        if (user.password && user.password !== password) {
            throw new Error('Невірний пароль');
        }

        // Зберігаємо сесію ТІЛЬКИ ЯКЩО НЕ ЗАБАНЕНИЙ
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        // Редірект на дашборд
        window.location.href = '/dashboard';
        return { success: true, user: user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// РЕЄСТРАЦІЯ
// ============================================

async function isRegistrationAllowed() {
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/system_settings?key=eq.allow_registration', {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });
        if (!response.ok) return true;
        var rows = await response.json();
        if (rows && rows.length > 0) {
            return rows[0].value !== 'false';
        }
        return true;
    } catch {
        return true;
    }
}

async function checkEmailDomainAllowed(email) {
    try {
        var domain = (email.split('@')[1] || '').toLowerCase().trim();
        if (!domain) return true;

        var response = await fetch(SUPABASE_URL + '/rest/v1/email_domains?select=domain,type', {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });
        if (!response.ok) return true;

        var rows = await response.json();
        if (!rows || rows.length === 0) return true;

        var blocked = [];
        var allowed = [];
        for (var i = 0; i < rows.length; i++) {
            var d = (rows[i].domain || '').toLowerCase().trim();
            if (!d) continue;
            if (rows[i].type === 'block') blocked.push(d);
            else allowed.push(d);
        }

        if (blocked.indexOf(domain) !== -1) return false;
        if (allowed.length > 0 && allowed.indexOf(domain) === -1) return false;

        return true;
    } catch {
        return true;
    }
}

async function registerUser(email, password, fullName) {
    try {
        var allowed = await isRegistrationAllowed();
        if (!allowed) {
            throw new Error('Реєстрація нових користувачів тимчасово вимкнена адміністрацією.');
        }

        var domainOk = await checkEmailDomainAllowed(email);
        if (!domainOk) {
            throw new Error('Реєстрація з поштою цього домену заборонена. Зверніться до адміністрації.');
        }

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
            full_name: fullName || email.split('@')[0],
            password: password,
            role: 'user',
            is_active: true,
            is_banned: false,
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
        
        // Зберігаємо сесію
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        // НЕ РОБИМО РЕДІРЕКТ ТУТ! 
        // Це робить register.html ПІСЛЯ завантаження аватарки
        return { success: true, user: user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// ПЕРЕВІРКА АВТОРИЗАЦІЇ (ДЛЯ ВСІХ СТОРІНОК)
// ============================================

async function checkAuth() {
    var user = getCurrentUser();
    if (!user) return false;

    // Якщо вже є мітка про бан - редірект на banned
    if (user.is_banned === true) {
        if (window.location.pathname !== '/banned') {
            window.location.href = '/banned';
        }
        return false;
    }

    try {
        var banInfo = await checkUserBanned(user.id, SUPABASE_ANON_KEY);
        if (banInfo && banInfo.is_banned === true) {
            // Оновлюємо дані з причиною бана
            user.is_banned = true;
            user.ban_reason = banInfo.ban_reason || 'Порушення правил платформи';
            localStorage.setItem('userData', JSON.stringify(user));
            
            if (window.location.pathname !== '/banned') {
                window.location.href = '/banned';
            }
            return false;
        }
        
        // Оновлюємо дані користувача
        currentUser = user;
        return true;
    } catch {
        return false;
    }
}

async function requireAuth() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        // Якщо ми вже на banned - не редіректимо
        if (window.location.pathname !== '/banned') {
            window.location.href = '/login';
        }
        return false;
    }
    return true;
}

async function requireAdmin() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        if (window.location.pathname !== '/banned') {
            window.location.href = '/login';
        }
        return false;
    }
    
    var user = getCurrentUser();
    if (user && user.role !== 'admin' && user.role !== 'owner') {
        if (window.showAlert) {
            await window.showAlert('Доступ заборонено. Потрібні права адміністратора.', 'error');
        }
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

async function requireOwner() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        if (window.location.pathname !== '/banned') {
            window.location.href = '/login';
        }
        return false;
    }
    
    var user = getCurrentUser();
    if (user && user.role !== 'owner') {
        if (window.showAlert) {
            await window.showAlert('Доступ заборонено. Потрібні права засновника.', 'error');
        }
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

async function requireModerator() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        if (window.location.pathname !== '/banned') {
            window.location.href = '/login';
        }
        return false;
    }
    
    var user = getCurrentUser();
    if (user && user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'owner') {
        if (window.showAlert) {
            await window.showAlert('Доступ заборонено. Потрібні права модератора або вище.', 'error');
        }
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

function isAdmin() {
    var user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'owner');
}

function isOwner() {
    var user = getCurrentUser();
    return user && user.role === 'owner';
}

function isModerator() {
    var user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'moderator' || user.role === 'owner');
}

function getUserRole() {
    var user = getCurrentUser();
    return user ? user.role : 'user';
}

// ============================================
// ЕКСПОРТ
// ============================================

window.auth = {
    getCurrentUser: getCurrentUser,
    checkAuth: checkAuth,
    requireAuth: requireAuth,
    requireAdmin: requireAdmin,
    requireOwner: requireOwner,
    requireModerator: requireModerator,
    logoutUser: logoutUser,
    loginUser: loginUser,
    registerUser: registerUser,
    isRegistrationAllowed: isRegistrationAllowed,
    checkEmailDomainAllowed: checkEmailDomainAllowed,
    isAdmin: isAdmin,
    isOwner: isOwner,
    isModerator: isModerator,
    getUserRole: getUserRole,
    checkUserBanned: checkUserBanned
};

console.log('✅ Auth module loaded successfully');
