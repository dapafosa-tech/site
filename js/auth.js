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
        
        var userData = data[0];
        
        if (userData.is_banned === true) {
            localStorage.removeItem('userData');
            localStorage.removeItem('isGuest');
            window.location.href = '/banned';
            return false;
        }
        
        currentUser = userData;
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
    if (user && user.role !== 'admin' && user.role !== 'owner') {
        await showAlert('Доступ заборонено. Потрібні права адміністратора.', 'error');
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

async function requireOwner() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login';
        return false;
    }
    
    var user = getCurrentUser();
    if (user && user.role !== 'owner') {
        await showAlert('Доступ заборонено. Потрібні права засновника.', 'error');
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

async function requireModerator() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login';
        return false;
    }
    
    var user = getCurrentUser();
    if (user && user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'owner') {
        await showAlert('Доступ заборонено. Потрібні права модератора або вище.', 'error');
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
        
        if (user.is_banned === true) {
            localStorage.setItem('banReason', user.ban_reason || 'Порушення правил');
            window.location.href = '/banned';
            return { success: false, error: 'Акаунт заблоковано' };
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

        window.location.href = '/dashboard';
        return { success: true, user: user };
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
    isAdmin: isAdmin,
    isOwner: isOwner,
    isModerator: isModerator,
    getUserRole: getUserRole
};
