// ============================================
// TYPEBIZ - AUTH LAYER
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

async function checkUserBanned(userId) {
    if (!userId) return null;
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + userId + '&select=is_banned,ban_reason', {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
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
        
        // ПЕРЕВІРКА БАНА
        var banInfo = await checkUserBanned(user.id);
        if (banInfo && banInfo.is_banned === true) {
            localStorage.setItem('userData', JSON.stringify({
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                is_banned: true,
                ban_reason: banInfo.ban_reason || 'Порушення правил платформи'
            }));
            // КИДАЄМО НА СТОРІНКУ БАНУ
            window.location.href = '/banned';
            return { success: false, error: 'Акаунт заблоковано', banned: true };
        }

        if (user.password && user.password !== password) {
            throw new Error('Невірний пароль');
        }

        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        window.location.href = '/dashboard';
        return { success: true, user: user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function registerUser(email, password, fullName) {
    try {
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
        
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        return { success: true, user: user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function checkAuth() {
    var user = getCurrentUser();
    if (!user) return false;

    if (user.is_banned === true) {
        return false;
    }

    try {
        var banInfo = await checkUserBanned(user.id);
        if (banInfo && banInfo.is_banned === true) {
            user.is_banned = true;
            user.ban_reason = banInfo.ban_reason || 'Порушення правил платформи';
            localStorage.setItem('userData', JSON.stringify(user));
            return false;
        }
        currentUser = user;
        return true;
    } catch {
        return false;
    }
}

async function requireAuth() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        // ЯКЩО КОРИСТУВАЧ ЗАБАНЕНИЙ - КИДАЄМО НА BANNED
        var user = getCurrentUser();
        if (user && user.is_banned === true) {
            window.location.href = '/banned';
        } else {
            window.location.href = '/login';
        }
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

window.auth = {
    getCurrentUser: getCurrentUser,
    checkAuth: checkAuth,
    requireAuth: requireAuth,
    logoutUser: logoutUser,
    loginUser: loginUser,
    registerUser: registerUser,
    isAdmin: isAdmin,
    isOwner: isOwner,
    checkUserBanned: checkUserBanned
};
